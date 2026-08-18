// Smoke test for the subscription provisioning flow (044)
// Requires the dev server on localhost:3000
const BASE = "http://localhost:3000";

async function loginPlatform() {
  const res = await fetch(`${BASE}/api/auth/platform-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@ehms.co", password: "Platform@1234" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`platform login failed: ${data.error}`);
  const cookie = res.headers.get("set-cookie")?.split(";")[0] || "";
  console.log("✓ platform admin login OK (cookie acquired)");
  return cookie;
}

async function tenantLogin(email, password, tenantCode) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, tenant_code: tenantCode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`tenant login failed: ${data.error || data.message}`);
  const cookie = res.headers.get("set-cookie")?.split(";")[0] || "";
  console.log(`✓ tenant login OK (${email} / ${tenantCode})`);
  return cookie;
}

async function api(path, cookie, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), cookie, "Content-Type": "application/json" },
  });
  let data = null;
  try { data = await res.json(); } catch { /* ignore */ }
  return { status: res.status, data };
}

async function main() {
  const platformCookie = await loginPlatform();

  // 1. GET provisioning data for VISWA
  let r = await api("/api/platform/tenants/VISWA/provision", platformCookie);
  console.log(`\n[1] GET /provision -> ${r.status}`);
  if (r.status !== 200) throw new Error(JSON.stringify(r.data));
  console.log("    tenant:", r.data.tenant.name);
  console.log("    subscription:", r.data.subscription ? `${r.data.subscription.tier}/${r.data.subscription.status} verticals=${r.data.subscription.subscribed_verticals.join(", ")}` : "NONE");
  console.log("    plans:", r.data.plans.map((p) => `${p.code}(${p.tier})`).join(", "));
  console.log("    verticals:", r.data.verticals.filter((v) => v.subscribed).map((v) => v.code).join(", "));
  console.log("    flags:", r.data.flags.length, "in shard; granted:", r.data.flags.filter((f) => f.granted).length);
  const flags = r.data.flags;
  const commercialFlag = flags.find((f) => f.flag_key === "commercial_module");
  const hospitalityFlag = flags.find((f) => f.flag_key === "hospitality_base");
  console.log("    commercial_module granted before:", commercialFlag?.granted);
  console.log("    hospitality_base granted before:", hospitalityFlag?.granted);

  // 2. Attempt to enable a NOT-subscribed flag as a tenant (commercial) -> should be blocked by enforcement
  const tenantCookie = await tenantLogin("superadmin@ehms.demo", "Demo@1234", "VISWA");
  r = await api("/api/features", tenantCookie, {
    method: "POST",
    body: JSON.stringify({ action: "enable", flag: "commercial_module", scope: "global" }),
  });
  console.log(`\n[2] tenant tries to enable commercial_module (global) -> ${r.status}`);
  console.log("    response:", JSON.stringify(r.data));
  if (r.data?.success === true) {
    console.log("    ❌ ENFORCEMENT FAILED: tenant enabled a non-subscribed flag");
  } else {
    console.log("    ✅ enforcement blocked it (dependencies may also block)");
  }

  // 3. Provision: add 'commercial' vertical to VISWA via platform, then re-check
  r = await api("/api/platform/tenants/VISWA/provision", platformCookie, {
    method: "POST",
    body: JSON.stringify({
      plan_id: null,
      tier: "enterprise",
      status: "active",
      subscribed_verticals: ["hospitality_hotels", "hospitality_serviced_apartments", "apartment_rental", "workplace_management", "commercial"],
    }),
  });
  console.log(`\n[3] POST /provision (add commercial, tier=enterprise) -> ${r.status}`);
  console.log("    message:", r.data.message);
  console.log("    granted:", r.data.granted.length, r.data.granted.join(", "));
  console.log("    revoked:", r.data.revoked.length, r.data.revoked.join(", "));
  if (r.status !== 200) throw new Error(JSON.stringify(r.data));

  // 4. Re-check: commercial_module should now be granted at global scope in shard
  r = await api("/api/platform/tenants/VISWA/provision", platformCookie);
  const commercialAfter = r.data.flags.find((f) => f.flag_key === "commercial_module");
  console.log(`\n[4] commercial_module granted after provision: ${commercialAfter?.granted}`);

  // 5. Tenant tries again to enable commercial (should now succeed since subscribed)
  r = await api("/api/features", tenantCookie, {
    method: "POST",
    body: JSON.stringify({ action: "enable", flag: "commercial_module", scope: "global" }),
  });
  console.log(`\n[5] tenant enables commercial_module after provisioning -> ${r.status}`);
  console.log("    response:", JSON.stringify(r.data));

  // 6. Downgrade: remove commercial vertical, verify it gets revoked
  r = await api("/api/platform/tenants/VISWA/provision", platformCookie, {
    method: "POST",
    body: JSON.stringify({
      subscribed_verticals: ["hospitality_hotels", "hospitality_serviced_apartments", "apartment_rental", "workplace_management"],
      tier: "professional",
      status: "active",
    }),
  });
  console.log(`\n[6] POST /provision (remove commercial) -> ${r.status}`);
  console.log("    granted:", r.data.granted.length, " revoked:", r.data.revoked.length);
  r = await api("/api/platform/tenants/VISWA/provision", platformCookie);
  const commercialRevoked = r.data.flags.find((f) => f.flag_key === "commercial_module");
  console.log("    commercial_module granted after downgrade:", commercialRevoked?.granted);

  console.log("\n✅ SMOKE TEST COMPLETE");
}

main().catch((e) => {
  console.error("\n❌ SMOKE TEST FAILED:", e.message);
  process.exit(1);
});
