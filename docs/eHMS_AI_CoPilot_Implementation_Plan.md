# HostSphere (eHMS) AI Co-Pilot — Implementation Plan

**Feature:** `/api/chat` route + Chat Widget + intent engine
**System:** HostSphere — Cybelinx Enterprise Hospitality Management System (Next.js 16.2.9, React 19, NeonDB, shard-per-tenant)
**References:** `docs/eHMS_AI_CoPilot_Chatbot_Requirements.md`, `docs/chatbot-intent-catalog.json`

---

## 1. Goals & Non-Goals

### Goals
1. A single authenticated endpoint `POST /api/chat` that answers questions and executes actions against the tenant schema.
2. **Role + Vertical + Property** enforcement identical to the sidebar's 3-layer filter.
3. Reuse existing API routes/services for text-to-action (no business logic duplication).
4. Full audit of every write intent.
5. Streaming (SSE) responses, voice input (Web Speech API), and TTS playback.

### Non-Goals (v1)
- Guest-facing WhatsApp bot (a separate consumer of the same intent engine — out of scope for v1).
- Semantic search over all 130+ tables (RAG is scoped to a curated set: guests, bookings, folios, tickets).
- Model self-hosting.

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser — Chat Widget (components/chat/ChatWidget.tsx)           │
│  • quick chips (role+journey filtered)   • voice (Web Speech)      │
│  • file attach (Vision)                  • TTS 🔊 Listen            │
└───────────────────────────────┬──────────────────────────────────┘
                                │ POST /api/chat  (application/json or SSE)
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  Next.js Route — app/api/chat/route.ts                             │
│  1. Auth  → verifyToken(cookie ehms_token) → context              │
│  2. Guard → role gate + vertical gate + property scope            │
│  3. Route → lib/chat/engine.ts                                    │
└───────────────────────────────┬──────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐   ┌────────────────────┐   ┌──────────────────────┐
│ Intent Engine │   │ RAG Lookup (guest/ │   │ Action Executor       │
│ lib/chat/     │   │ booking/folio)      │   │ lib/chat/executor.ts  │
│ classifier.ts │   │ lib/chat/rag.ts     │   │  • calls existing API │
│ + catalog.json│   │  + pgvector index   │   │    route logic        │
└───────┬───────┘   └─────────┬──────────┘   └──────────┬───────────┘
        │                     │                          │
        ▼                     ▼                          ▼
┌──────────────────────────────────────────────────────────────────┐
│ Data layer                                                     │
│ • getDb() (tenant schema via x-tenant-schema header)            │
│ • Existing route handlers (reused as services)                   │
│ • audit_logs / system_audit_events for every write               │
└──────────────────────────────────────────────────────────────────┘
```

**Streaming:** `POST /api/chat` returns an SSE stream. The engine emits typed events:
`intent`, `tool_start`, `tool_result`, `safety_warning`, `confirmation_required`, `text`, `done`, `error`.

---

## 3. API Contract — `POST /api/chat`

### 3.1 Request
```jsonc
{
  "message": "Book a Deluxe room for 2 nights from 2026-08-05 for phone 9876543210",
  "conversation_id": "uuid-optional",     // for multi-turn entity carry-over
  "journey": "hotels",                    // active vertical; falls back to x-tenant-verticals
  "property_id": "optional-uuid",         // validated against x-user-property-ids
  "attachment": {                          // optional (Vision AI)
    "content_type": "image/png | application/pdf",
    "data_url": "data:image/png;base64,...",
    "prompt": "Extract vendor invoice fields"
  },
  "confirm_token": null                    // filled on the follow-up confirmation turn
}
```

### 3.2 Response (SSE event stream)
```jsonc
{ "type": "intent",              "intent_id": "frontdesk.reservation.create" }
{ "type": "tool_start",          "tool": "POST /api/reservations", "status": "running" }
{ "type": "safety_warning",      "severity": "warn", "message": "⚠️ GUEST FLAGGED: BLACKLISTED" }
{ "type": "confirmation_required", "message": "Confirm booking 2 nights Deluxe for 9876543210?",
  "confirm_token": "resv_8f3a...", "buttons": ["Confirm", "Cancel"] }
{ "type": "tool_result",         "tool": "POST /api/reservations", "status": "ok", "reference": "RES-10501" }
{ "type": "text",                "content": "✅ Booking created — reference RES-10501 (Deluxe, 2026-08-05 → 08-07)." }
{ "type": "suggestions",         "chips": ["Check-in RES-10501", "Folio balance", "View calendar"] }
{ "type": "done" }
```

### 3.3 Errors
| HTTP | Code | Meaning |
| :--- | :--- | :--- |
| 401 | `unauthenticated` | Missing/invalid `ehms_token` |
| 403 | `role_denied` | Role not permitted for the resolved intent |
| 403 | `property_denied` | property_id outside caller's assignment |
| 403 | `vertical_denied` | Intent not available in active journey |
| 422 | `unresolved_intent` | Could not resolve intent; returns `clarify` prompt + top candidates |
| 429 | `rate_limited` | Per-user token-bucket exceeded |
| 500 | `internal` | Engine failure (does not leak stack traces) |

---

## 4. Server Pipeline (in `app/api/chat/route.ts`)

### Step 1 — Auth & Context (reuse proxy headers)
Read `x-user-id`, `x-user-role`, `x-tenant-code`, `x-tenant-schema`, `x-tenant-verticals`, `x-user-property-ids`, `x-is-platform-admin` (already injected by `proxy.ts`). If `x-user-role` is empty, call `verifyToken` from the `ehms_token` cookie as a fallback. Build a typed `ChatContext`:

```ts
interface ChatContext {
  userId: string; email: string;
  role: string;                  // role_name
  tenantCode: string; tenantSchema: string; tenantVerticals: Vertical[];
  assignedPropertyIds: string[]; // [] = unrestricted (super_admin/executive)
  isPlatformAdmin: boolean;
  journey: Vertical | "all";     // from request body, validated against tenantVerticals
  propertyId: string | null;     // validated via validatePropertyAccess
}
```

### Step 2 — Intent Resolution (`lib/chat/classifier.ts`)
1. **Embedding/classifier:** match `message` + `attachment.prompt` against the intent catalog. v1 approach: deterministic keyword/entity classifier → optional LLM function-calling fallback (`intent` tool with the catalog as the tool schema).
2. **Slot extraction:** pull entities via regex/LLM (`booking_ref`, `phone`, `amount`, `date`, `unit_ref`, `priority`, `employee_ref`).
3. **Catalog filter:** drop intents not in `[role] ∩ [journey]` before scoring (never let the LLM pick a disallowed intent).

### Step 3 — Permission Enforcement (`lib/chat/guards.ts`)
Order matters — fail fast:
1. **Vertical gate** — intent.verticals contains journey (or `"all"`).
2. **Role gate** — `role ∈ intent.roles` **and** `hasAccess(role, intent.routes)` from `lib/role-access.ts`.
3. **Property gate** — if `intent.action_type === "write"`, ensure `propertyId` (explicit or resolved from entities) passes `validateMutationPropertyAccess`. Read intents append `property_id = ANY(assignedPropertyIds)`.
4. **Write confirmation** — for `high`/`critical`, require `confirm_token` echo before executing (see §6).

### Step 4 — RAG Lookup (`lib/chat/rag.ts`)
For guest/booking/folio intents:
1. Identify identifier: `phone` (regex `\d{10}`), `booking_ref` (`RES-\d+`), `email`, or `room_no` (resolve via `bookings.unit_id` + current stay).
2. Vector search over a per-tenant `chat_embeddings` table (pgvector) seeded from `guest_profiles`, `bookings`, `invoices`, `invoice_lines`, `guest_requests`, `guest_feedback`, `maintenance_tickets`.
3. Assemble masked summary (mask full ID numbers, card numbers) and feed as context to the LLM.

### Step 5 — Action Execution (`lib/chat/executor.ts`)
Every `write` intent maps to an **existing route handler or shared service**, invoked with the same body a UI form would send. The executor is a registry:

```ts
const EXECUTORS: Record<string, Executor> = {
  "frontdesk.reservation.create": route("POST", "/api/reservations"),
  "frontdesk.checkin.create":      compose(checkinCreate, smartKeyIssue),
  "maint.tickets.create":          route("POST", "/api/maintenance/tickets"),
  "fin.payment.record":            route("POST", "/api/finance/bill-payments"),
  "hr.leave.apply":                route("POST", "/api/hr/leave"),
  "admin.backup.create":           route("POST", "/api/admin/backup"),
  // ...one per write intent in the catalog
};
```
- **Composition caveat:** next.js route handlers read from `req.json()` — invoke them via an internal `callRoute()` helper that forwards `NextRequest` with the proxy-injected headers, **or** refactor shared business logic into `lib/services/*` (preferred long-term) so the chat route and route handlers call the same function.
- Property-scope SQL fragments use `scope.propertyFilter` / `scope.assignedPropertyIds` from `lib/property-scope.ts`.

### Step 6 — Safety & Audit (`lib/chat/audit.ts`)
- After each write, insert into `audit_logs` / `system_audit_events`: actor email, role, IP, `intent_id`, endpoint, payload hash, before/after diff, `conversation_id`.
- Wrap the entire turn in a DB transaction when the intent writes to multiple tables.

### Step 7 — Response & Voice
- Compose a concise markdown reply from `tool_result` + templates in the catalog (`response` field).
- `suggestions` chips computed from role+journey filtered catalog.
- Attach `tts_text` field when voice mode requested.

---

## 5. New Files & File-by-File Checklist

### Server (`lib/chat/`)
| File | Purpose |
| :--- | :--- |
| `lib/chat/catalog.ts` | Loads `docs/chatbot-intent-catalog.json` at build, typed `Intent` interface, `findIntentsFor(ctx)`, `matchIntent(message)` |
| `lib/chat/context.ts` | `ChatContext` builder from request headers/cookie; journey & property validation |
| `lib/chat/classifier.ts` | Deterministic entity/keyword classifier + optional LLM function-calling fallback; returns `{ intent, slots, confidence, candidates }` |
| `lib/chat/guards.ts` | `enforceVertical`, `enforceRole`, `enforceProperty`, `needConfirmation(intent)` |
| `lib/chat/rag.ts` | pgvector embeddings store + masked summarizer for guest/booking/folio intents |
| `lib/chat/executor.ts` | `EXECUTORS` registry mapping intent → existing route/service |
| `lib/chat/confirm.ts` | Confirmation-token issuance/verification (signed, 2-min TTL, stored in-memory/LRU or DB) |
| `lib/chat/audit.ts` | Audit write helper + transaction wrapper |
| `lib/chat/llm.ts` | Provider-agnostic LLM + vision client (lazy init like `lib/email.ts` `getResend()`) |
| `lib/chat/speech.ts` | TTS endpoint helper + language map for §8 |
| `lib/chat/rate-limit.ts` | Per-user token bucket (in-memory + optional DB-backed for serverless) |

### Route & Widget
| File | Purpose |
| :--- | :--- |
| `app/api/chat/route.ts` | POST handler, SSE streaming, orchestrates pipeline |
| `app/api/chat/tts/route.ts` | GET `?text=…&lang=…` → audio (TTS) |
| `app/api/chat/chips/route.ts` | GET → role+journey filtered quick chips |
| `components/chat/ChatWidget.tsx` | Floating widget (drag handle, chips, voice, attachments) |
| `components/chat/ChatMessage.tsx` | Message bubble with 🔊 Listen, action confirmation buttons |
| `components/chat/useChat.ts` | `fetchEventSource`-style SSE hook + conversation state |
| `app/dashboard/layout.tsx` | Mount `ChatWidget` (respect feature toggle `chatbot` if added to `properties.config`) |

### DB
| Migration | Purpose |
| :--- | :--- |
| `037_chat_engine.sql` | `chat_embeddings` (pgvector), `chat_conversations`, `chat_messages`, `chat_audit` — all cloned per shard automatically |

---

## 6. Confirmation & Human-in-the-Loop Flow

```
User: "Void invoice INV-2210"
  → classifier: frontdesk.folio.void (critical)
  → guards: role ok, property ok, requires confirmation
  → SSE: {type:"confirmation_required", message:"Type CONFIRM VOID INV-2210 to proceed.",
          confirm_token:"jwt-1"}
User: "CONFIRM VOID INV-2210"     (same conversation_id)
  → engine verifies token + echo phrase
  → executor runs DELETE /api/invoices/2210
  → audit diff written; SSE text "✅ Invoice INV-2210 voided."
```

Rules:
- `critical` → typed phrase required.
- `high` → token-based confirm button required.
- Financial/access/payroll/tenant intents additionally require manager-level role (enforced by `roles` array), matching §12 of the requirements doc.
- Confirm tokens are single-use, signed with `JWT_SECRET`, expire in 120s.

---

## 7. Reuse Matrix — Intent → Existing Endpoint

| Intent | Existing Endpoint (already shipped) |
| :--- | :--- |
| `ops.arrivals.today` | `GET /api/reservations?status=confirmed&date=` |
| `frontdesk.reservation.create` | `POST /api/reservations` |
| `frontdesk.checkin.create` | `POST /api/checkin` + `POST /api/reservations/[id]/smart-key` |
| `guest.lookup.summary` | `GET /api/guests?search=` + `/api/guests/[id]` + `/history` |
| `frontdesk.folio.charge.post` | `POST /api/invoices/[id]/lines` |
| `hk.tasks.assign` | `POST /api/housekeeping/tasks` + `PATCH /api/housekeeping/tasks/[id]` |
| `hk.inspection.submit` | `POST /api/housekeeping/inspections` |
| `hk.linen.dispatch` | `POST /api/housekeeping/linen/dispatch` + `/api/laundry/orders` |
| `maint.tickets.create` | `POST /api/maintenance/tickets` |
| `maint.parts.use` | `POST /api/maintenance/tickets/[id]/parts` |
| `fin.payment.record` | `POST /api/finance/bill-payments` / `POST /api/invoices/[id]/payments` |
| `fin.journal.post` | `POST /api/finance/journal-entries` |
| `fin.depreciation.run` | `POST /api/finance/depreciation/run` |
| `hr.leave.apply` | `POST /api/hr/leave` |
| `hr.payroll.run` | `POST /api/hr/payroll/run` |
| `proc.po.create` | `POST /api/procurement/purchase-orders` |
| `proc.grn.submit` | `POST /api/procurement/grn` |
| `inv.transaction.issue` | `POST /api/inventory/transactions` |
| `rev.ai.apply` | `POST /api/revenue-ai/apply` |
| `ota.sync.run` | `POST /api/ota/sync` |
| `whatsapp.template.send` | `POST /api/whatsapp/send` |
| `rent.lease.create` | `POST /api/leases` |
| `rent.payment.record` | `POST /api/rent-invoices/[id]/payments` |
| `rent.deposit.refund` | `POST /api/deposits/[id]/refund` |
| `wp.visitor.checkin` | `POST /api/visitors/[id]/checkin` |
| `wp.membership.create` | `POST /api/workplace/memberships` |
| `admin.users.create` | `POST /api/admin/users` |
| `admin.sessions.revoke` | `DELETE /api/admin/sessions/[id]` |
| `admin.backup.create` | `POST /api/admin/backup` |
| `admin.properties.config` | `PUT /api/properties/[id]` |
| `platform.tenants.create` | `POST /api/admin/tenants` (platform superadmin only) |

> **Refactor recommendation:** extract shared services (`lib/services/reservations.ts`, `lib/services/housekeeping.ts`, etc.) so both the route handlers and the chat executor call one function. This keeps one source of truth for business rules (overlap checks, deposit gates, SLA logic).

---

## 8. Vision AI & Multilingual & Voice

### Vision (`lib/chat/llm.ts`)
- Accept `attachment` with `data_url` (≤5 MB, whitelisted MIME).
- Prompt per intent family (invoice-extract → AP draft; ID-proof → guest profile draft; GRN challan → goods-receipt draft).
- Output is a **draft** — staff confirm before persistence (no auto-writes from scans).

### Translation (`util.translate`)
- Use LLM translation for folio notes, checkout summaries, room-service instructions.
- Language map limited to: `hi`, `ta`, `te`, `mr`, `bn`, `es`, `fr`, `de`, `ar`, `ja`.

### Voice / TTS
- **STT:** Web Speech API on the client (no server round-trip for dictation).
- **TTS:** `GET /api/chat/tts` proxies a TTS provider; voice per role's locale preference stored in `system_settings` (`{ tts_voice }`).

---

## 9. Security Hardening

1. **No prompt injection escape:** System prompt includes tenant/role/property boundary; tool calls are schema-constrained to the catalog; LLM output is never trusted for property/role decisions (guards are code, not LLM).
2. **SQL safety:** Only parameterized `sql.query()`/tagged templates; never interpolate LLM-produced SQL. RAG filters are applied server-side after the DB returns candidate rows.
3. **PII masking:** Mask ID numbers, card PANs, phone (last 4 visible) in all chat responses; full values only via the originating module with permission.
4. **Rate limiting:** per-user burst limit (e.g., 20 msg/min) + per-IP cap.
5. **Attachment sanitization:** MIME whitelist, size limit, no server-side execution, OCR-only processing.
6. **Audit:** every write logged; read-only RAG lookups logged at `debug` level only (PII-minimized).
7. **Header trust:** the chat route re-validates `x-user-role`/`x-user-property-ids` against the verified JWT rather than trusting proxy headers blindly.
8. **Tenant isolation:** `getDb()` resolves schema from the validated JWT `tenant_schema`, never from user-supplied input.

---

## 10. Testing Strategy

Reuse the existing Playwright suite conventions (`tests/`, `playwright.config.ts`, dev server on port 3000).

| Suite | Coverage |
| :--- | :--- |
| `15-chat-widget` | Widget opens, drag, chips render per role, SSE renders, TTS button, voice button present |
| `16-chat-rbac` | Same prompt under `front_desk` vs `hr_manager` vs `super_admin` → correct allow/deny |
| `17-chat-actions` | Reservation create → check-in → folio charge → checkout via chat; verify DB + audit rows |
| `18-chat-confirm` | Critical intent without confirmation → blocked; with `CONFIRM ...` phrase → executed |
| `19-chat-vertical-scope` | `rental` journey cannot trigger hotel intents; property-scoped user cannot touch other properties |
| `20-chat-vision` | Upload sample invoice → structured draft returned (no DB write) |

Add unit tests for `guards.ts` (role × journey × property truth table) and `catalog.ts` (every intent ID is unique; every role string exists).

---

## 11. Rollout Phases

| Phase | Scope | Exit Criteria |
| :--- | :--- | :--- |
| **P1 — Foundation** | `lib/chat/*` scaffolding, `POST /api/chat` read-only intents (occupancy, arrivals, guest lookup, ticket queue, folio balance), widget mount | Read intents pass RBAC suite for 5 roles |
| **P2 — Actions** | Executors for Front Desk, HK, Maintenance, HR leave/timesheet | Write intents create real records + audit |
| **P3 — High-risk** | Finance, Procurement, Payroll, Rental deposits, Admin/Platform actions | Confirmation + dual-sign-off flows pass `18-chat-confirm` |
| **P4 — AI Enhancements** | RAG embeddings, Vision, Translation, Voice/TTS, Revenue-AI/OTA executors | `20-chat-vision` + multilingual + voice suites pass |
| **P5 — Hardening** | Rate limits, prompt-injection tests, audit export, docs update | Full Playwright run green; gap-analysis GAP-7/GAP-8 items closed |

---

## 12. Config & Env Vars

| Var | Required | Purpose |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` | Yes (one) | LLM + Vision |
| `CHAT_EMBEDDING_MODEL` | No | pgvector embedding model id (default `text-embedding-3-small`) |
| `CHAT_TTS_PROVIDER` + key | No | TTS; skip if `lib/email.ts`-style graceful degradation preferred |
| `DATABASE_URL` | Yes (existing) | Neon; must support `pgvector` extension in shards |
| `JWT_SECRET` | Yes (existing) | Confirm-token signing |
| `CHAT_RATE_LIMIT` | No | per-user burst (default 20/min) |

---

## 13. Dependency Additions

```
npm i ai @ai-sdk/openai       # or @ai-sdk/anthropic / @google/generative-ai
npm i pgvector               # optional helper for embeddings search
```
`@ai-sdk/*` enables the `streamText`/SSE helpers; if provider SDKs are preferred, skip `ai` and emit SSE manually.

---

*HostSphere AI Co-Pilot Implementation Plan v1.0 • Cybelinx Hospitality Management System (eHMS) • August 2026*
