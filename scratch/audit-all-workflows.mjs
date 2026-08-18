async function runAudit() {
  console.log("==========================================================================");
  console.log("🔍 STARTING COMPREHENSIVE EHMS API & WORKFLOW AUDIT (VISWA TENANT)");
  console.log("==========================================================================\n");

  // 1. Authenticate as superadmin@ehms.demo under VISWA
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "superadmin@ehms.demo",
      password: "Demo@1234",
      tenant_code: "VISWA"
    })
  });

  if (loginRes.status !== 200) {
    console.error("❌ Login failed:", await loginRes.text());
    return;
  }

  const setCookie = loginRes.headers.get("set-cookie") || "";
  const authHeaders = { "cookie": setCookie };
  console.log("✓ Authenticated as super_admin under VISWA schema.\n");

  const endpoints = [
    { name: "1. Properties List", url: "/api/properties" },
    { name: "2. Dashboard Overview Stats", url: "/api/dashboard/stats" },
    { name: "3. Bookings & Reservations", url: "/api/reservations" },
    { name: "4. AI Revenue Manager", url: "/api/dashboard/front-desk/revenue-ai" },
    { name: "5. Rate Plans", url: "/api/rate-plans" },
    { name: "6. Guest CRM Profiles", url: "/api/guests" },
    { name: "7. Housekeeping Tasks", url: "/api/housekeeping" },
    { name: "8. Linen & RFID Inventory", url: "/api/housekeeping/linen/items" },
    { name: "9. Maintenance Tickets", url: "/api/maintenance" },
    { name: "10. Asset Management", url: "/api/maintenance/assets" },
    { name: "11. HRMS Employees", url: "/api/hr/employees" },
    { name: "12. HR Departments", url: "/api/hr/departments" },
    { name: "13. Payroll Runs", url: "/api/hr/payroll" },
    { name: "14. Chart of Accounts", url: "/api/finance/accounts" },
    { name: "15. Journal Entries", url: "/api/finance/journal-entries" },
    { name: "16. Vendor Bills", url: "/api/finance/vendor-bills" },
    { name: "17. Long-Term Leases (VA)", url: "/api/leases" },
    { name: "18. Rent Invoices (VA)", url: "/api/rent-invoices" },
    { name: "19. Admin User Directory", url: "/api/admin/users" },
    { name: "20. Admin RBAC Roles", url: "/api/admin/roles" }
  ];

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const ep of endpoints) {
    const start = Date.now();
    try {
      const res = await fetch(`http://localhost:3000${ep.url}`, { headers: authHeaders });
      const ms = Date.now() - start;
      const text = await res.text();

      if (res.status >= 200 && res.status < 300) {
        let summary = "OK";
        try {
          const json = JSON.parse(text);
          if (Array.isArray(json)) summary = `${json.length} items`;
          else if (json.data && Array.isArray(json.data)) summary = `${json.data.length} items`;
          else if (json.properties && Array.isArray(json.properties)) summary = `${json.properties.length} properties`;
          else if (json.reservations && Array.isArray(json.reservations)) summary = `${json.reservations.length} reservations`;
          else if (json.tasks && Array.isArray(json.tasks)) summary = `${json.tasks.length} tasks`;
          else if (json.tickets && Array.isArray(json.tickets)) summary = `${json.tickets.length} tickets`;
          else if (json.employees && Array.isArray(json.employees)) summary = `${json.employees.length} employees`;
          else if (json.accounts && Array.isArray(json.accounts)) summary = `${json.accounts.length} accounts`;
          else if (json.recommendations && Array.isArray(json.recommendations)) summary = `${json.recommendations.length} recommendations`;
          else summary = "JSON object returned";
        } catch (_) {}
        console.log(`✓ ${ep.name.padEnd(32)} -> Status: ${res.status} (${ms}ms) [${summary}]`);
        passed++;
      } else {
        console.log(`❌ ${ep.name.padEnd(32)} -> Status: ${res.status} (${ms}ms) -> ${text.slice(0, 150)}`);
        failed++;
        failures.push({ name: ep.name, url: ep.url, status: res.status, error: text });
      }
    } catch (e) {
      console.log(`❌ ${ep.name.padEnd(32)} -> Network/Fetch Error: ${e.message}`);
      failed++;
      failures.push({ name: ep.name, url: ep.url, status: "ERROR", error: e.message });
    }
  }

  console.log("\n==========================================================================");
  console.log(`📊 AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED across ${endpoints.length} API Routes`);
  console.log("==========================================================================");

  if (failed > 0) {
    console.log("\nFailed Endpoints to Investigate:");
    failures.forEach(f => {
      console.log(`- [${f.status}] ${f.name} (${f.url}): ${f.error.slice(0, 200)}`);
    });
  } else {
    console.log("\n✨ ALL 20 MAJOR API ROUTES AND WORKFLOWS ARE 100% HEALTHY & READY FOR DEMO!");
  }
}
runAudit();
