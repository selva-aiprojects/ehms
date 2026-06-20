async function main() {
  try {
    const res = await fetch("http://localhost:3001/api/leases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: "4369ebf5-f1f3-4b31-8437-7a784617a1ad",
        unit_id: "17f32fdf-49ce-4d3b-bc27-0832a3a85ce9",
        tenant_id: "2973a209-e212-4f1f-9fd8-c76ef58d08a5",
        start_date: "2026-07-01",
        end_date: "2027-06-30",
        rent_amount: 25000,
        security_deposit: 50000,
        notice_period_days: 30,
        status: "active"
      })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
main();
