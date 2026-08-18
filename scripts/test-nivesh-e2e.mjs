// End-to-end workflow test on NIVESH: reserve → check-in → housekeeping task →
// maintenance ticket → folio charge → payment. Uses internal (auth-scoped) APIs.
// Requires dev server on localhost:3000 and seed to have been run.
const BASE = "http://localhost:3000";

async function tenantLogin(email, password, tenantCode) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, tenant_code: tenantCode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`login failed: ${data.error || data.message}`);
  return res.headers.get("set-cookie")?.split(";")[0] || "";
}

async function api(path, cookie, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), ...(cookie ? { cookie } : {}), "Content-Type": "application/json" },
  });
  let data = null;
  try { data = await res.json(); } catch { /* ignore */ }
  return { status: res.status, data };
}

const steps = [];
function step(name, ok, detail = "") {
  steps.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name} ${detail}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  const cookie = await tenantLogin("superadmin@ehms.demo", "Demo@1234", "NIVESH");
  const ci = new Date(Date.now() + 2 * 86400000);
  const co = new Date(ci.getTime() + 3 * 86400000);
  const d = (x) => x.toISOString().slice(0, 10);
  const guestEmail = `e2e.guest.${Date.now()}@gmail.com`;

  // 0. Hotel property + a vacant room
  let r = await api("/api/properties", cookie);
  const props = Array.isArray(r.data) ? r.data : r.data?.data || r.data?.properties || [];
  const hotel = props.find((p) => p.vertical_type === "hotel");
  step("0a. find hotel property", r.status === 200 && hotel, hotel?.name);
  const units = Array.isArray(hotel?.units) ? hotel.units : [];
  const room = units.find((u) => u.unit_type === "room" && u.status === "vacant");
  step("0b. find vacant hotel room", Boolean(room), `${room?.unit_label} (${room?.status})`);

  // 0c. Create guest
  r = await api("/api/guests", cookie, {
    method: "POST",
    body: JSON.stringify({ first_name: "E2E", last_name: "Test Guest", email: guestEmail, phone: "+91-90000-99999", nationality: "Indian" }),
  });
  const guestId = r.data?.data?.id;
  step("0c. create guest", r.status === 201 && guestId, guestEmail);

  // 1. Reserve (confirmed booking + draft invoice + unit → reserved)
  r = await api("/api/reservations", cookie, {
    method: "POST",
    body: JSON.stringify({ property_id: hotel.id, unit_id: room.id, guest_id: guestId, check_in: d(ci), check_out: d(co), adults: 2, children: 0, source: "direct" }),
  });
  const booking = r.data?.data;
  step("1. create reservation", r.status === 201 && booking, `booking=${booking?.id} amount=${booking?.total_amount}`);

  // 2. Check-in
  r = await api("/api/dashboard/front-desk/checkin", cookie, {
    method: "POST",
    body: JSON.stringify({ bookingId: booking.id, roomId: room.id, checklistItems: { id: "checked", payment: "done", key: "issued" } }),
  });
  step("2. check-in", r.status === 200 && r.data?.success, JSON.stringify(r.data));

  // 3. Housekeeping task for the occupied room
  r = await api("/api/housekeeping", cookie, {
    method: "POST",
    body: JSON.stringify({ property_id: hotel.id, unit_id: room.id, task_type: "deep_clean", priority: "high", notes: "E2E check-in follow-up" }),
  });
  const hkTask = r.data?.data?.id || r.data?.data?.[0]?.id;
  step("3. housekeeping task", r.status === 201 && hkTask, `task=${hkTask}`);

  // 4. Maintenance ticket (property-scoped)
  r = await api("/api/maintenance", cookie, {
    method: "POST",
    body: JSON.stringify({ property_id: hotel.id, title: "E2E - corridor light flickering", description: "Third floor corridor", priority: "medium", category: "Electrical" }),
  });
  const mt = r.data?.data;
  step("4. maintenance ticket", r.status === 201 && mt, `ticket=${mt?.ticket_number}`);

  // 5. Folio for the booking
  r = await api(`/api/invoices/folio?booking_id=${booking.id}`, cookie);
  const folio = r.data?.data;
  step("5. folio fetch", r.status === 200 && folio?.invoice, `grand_total=${folio?.invoice?.grand_total} status=${folio?.invoice?.status} guest=${folio?.booking?.guest?.name}`);

  // 6. Add a room-service charge to folio
  r = await api("/api/invoices/folio", cookie, {
    method: "POST",
    body: JSON.stringify({ booking_id: booking.id, description: "Room service dinner", quantity: 1, unit_price: 1450, tax_rate: 18, charge_type: "room_service" }),
  });
  const charge = r.data?.data;
  step("6. folio charge", r.status === 201 && charge?.line, `grand_total=${charge?.grand_total} due=${charge?.balance_due}`);

  // 7. Pay the balance
  const bal = charge?.balance_due;
  r = await api("/api/invoices/folio", cookie, {
    method: "PUT",
    body: JSON.stringify({ booking_id: booking.id, amount: bal, payment_method: "upi" }),
  });
  step("7. folio payment", r.status === 200, JSON.stringify(r.data));

  // 8. Verify final folio shows paid
  r = await api(`/api/invoices/folio?booking_id=${booking.id}`, cookie);
  const fin = r.data?.data;
  step("8. verify invoice paid", fin?.invoice?.status === "paid" && Number(fin?.invoice?.balance_due) === 0, `status=${fin?.invoice?.status} paid=${fin?.invoice?.paid_total} due=${fin?.invoice?.balance_due}`);

  // 9. Sanity: data visible in module listings
  r = await api("/api/housekeeping", cookie);
  step("9. housekeeping list", r.status === 200 && r.data?.data?.length >= 1, `${r.data?.data?.length} tasks`);
  r = await api("/api/maintenance", cookie);
  step("10. maintenance list", r.status === 200 && r.data?.data?.length >= 1, `${r.data?.data?.length} tickets`);

  console.log("\n===============================");
  const fails = steps.filter((s) => !s.ok).length;
  console.log(fails === 0 ? `✅ E2E WORKFLOW PASSED (${steps.length}/${steps.length})` : `❌ E2E WORKFLOW: ${fails} step(s) failed`);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
