async function testLogin() {
  console.log("=== Testing POST /api/auth/login ===");
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "superadmin@ehms.demo",
      password: "Demo@1234",
      tenant_code: "VISWA"
    })
  });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
  const setCookie = res.headers.get("set-cookie");
  console.log("Set-Cookie:", setCookie);

  console.log("\n=== Testing GET /api/auth/me ===");
  const meRes = await fetch("http://localhost:3000/api/auth/me", {
    headers: { "cookie": setCookie || "" }
  });
  console.log("Status:", meRes.status);
  console.log("Body:", await meRes.text());
}
testLogin();
