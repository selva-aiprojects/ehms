const BASE = "https://ehms-app-eta.vercel.app";

async function run() {
  console.log("1. Logging into Vercel production URL:", BASE);
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "superadmin@ehms.demo", password: "Demo@1234", tenant_code: "VISWA" })
  });
  console.log("Login Status:", loginRes.status);
  const loginData = await loginRes.json();
  if (!loginData.token) {
    console.error("Login failed:", loginData);
    return;
  }
  console.log("Logged in as:", loginData.user.email, "| Role:", loginData.user.role_name);

  // Extract raw set-cookie header value
  const setCookie = loginRes.headers.get("set-cookie") || "";
  const cookieMatch = setCookie.match(/ehms_token=([^;]+)/);
  const tokenCookie = cookieMatch ? `ehms_token=${cookieMatch[1]}` : `ehms_token=${loginData.token}`;

  console.log("\n2. Fetching Front Desk Matrix from Vercel using exact cookie (no x-tenant-schema header)...");
  const matrixRes = await fetch(`${BASE}/api/dashboard/front-desk/matrix`, {
    headers: { "Cookie": tokenCookie }
  });
  console.log("Matrix Status:", matrixRes.status);
  const matrixText = await matrixRes.text();
  try {
    const matrixJson = JSON.parse(matrixText);
    console.log("Matrix rooms count:", matrixJson.data?.length);
    if (matrixJson.data?.length > 0) {
      console.log("Sample room 1:", matrixJson.data[0].property_name, "| Bldg:", matrixJson.data[0].building_code, "| Floor:", matrixJson.data[0].floor_number, "| Label:", matrixJson.data[0].unit_label);
    } else {
      console.log("Matrix returned empty array! JSON:", matrixJson);
    }
  } catch (e) {
    console.log("Matrix returned non-JSON! First 200 chars:", matrixText.slice(0, 200));
  }
}

run();
