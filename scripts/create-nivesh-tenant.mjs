const BASE = "http://localhost:3000";

async function main() {
  const login = await fetch(BASE + "/api/auth/platform-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@ehms.co", password: "Platform@1234" }),
  });
  if (!login.ok) throw new Error("platform login failed");
  const cookie = (login.headers.get("set-cookie") || "").split(";")[0];

  const payload = {
    name: "Nivesh Resorts & Hotels Ltd",
    code: "NIVESH",
    schema: "nivesh",
    workspaces: [
      { type: "hotels", name: "Nivesh Grand Resorts", is_primary: true },
      { type: "apartments", name: "Nivesh Service Apartments", is_primary: false },
      { type: "rental", name: "Nivesh Rental Residences", is_primary: false },
      { type: "workplace", name: "Nivesh Business Park", is_primary: false },
    ],
    primary_contact_name: "Nivesh Administrator",
    contact_email: "admin@nivesh.demo",
    payment_mode: "monthly",
    subscription_charges_type: "Monthly",
    price: 19999,
  };

  console.log("POST /api/admin/tenants ...");
  const res = await fetch(BASE + "/api/admin/tenants", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  console.log("status:", res.status);
  console.log(JSON.stringify(data, null, 2));
  if (!res.ok) process.exit(1);
}
main().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
