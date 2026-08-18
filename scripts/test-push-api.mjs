/**
 * test-push-api.mjs — Logs in as a demo user and exercises the push API
 * endpoints (subscribe → list → send → unsubscribe) to verify the full
 * server-side flow works.
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

async function main() {
  // 1. Login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@ehms.demo",
      password: "Demo@1234",
      tenant_code: "VISWA",
    }),
    redirect: "manual",
  });
  const setCookie = loginRes.headers.get("set-cookie");
  if (!setCookie) {
    console.log("Login response:", loginRes.status, await loginRes.text());
    process.exit(1);
  }
  const cookie = setCookie.split(";")[0];
  console.log("✓ Logged in, cookie:", cookie.slice(0, 30) + "...");

  const h = { Cookie: cookie, "Content-Type": "application/json" };

  // 2. Subscribe (fake subscription shape)
  const fakeSub = {
    endpoint: `https://fcm.googleapis.com/fcm/send/test-${Date.now()}`,
    keys: {
      p256dh: "BPmXtestBase64Keyp256dhData",
      auth: "testAuthBase64Key",
    },
  };
  const subRes = await fetch(`${BASE}/api/push/subscribe`, {
    method: "POST",
    headers: h,
    body: JSON.stringify(fakeSub),
  });
  console.log("subscribe →", subRes.status, await subRes.text());

  // 3. Send (will fail at web-push level with 404/410 for the fake endpoint,
  //    but should return a proper JSON response and clean up the stale row)
  const sendRes = await fetch(`${BASE}/api/push/send`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ title: "Test", body: "Hello from HostSphere" }),
  });
  const sendBody = await sendRes.json();
  console.log("send →", sendRes.status, JSON.stringify(sendBody));

  // 4. Unsubscribe
  const unsubRes = await fetch(`${BASE}/api/push/unsubscribe`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ endpoint: fakeSub.endpoint }),
  });
  console.log("unsubscribe →", unsubRes.status, await unsubRes.text());

  // 5. Check dashboard loads for this user
  const dashRes = await fetch(`${BASE}/dashboard`, { headers: { Cookie: cookie }, redirect: "manual" });
  console.log("dashboard →", dashRes.status);
}

main().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
