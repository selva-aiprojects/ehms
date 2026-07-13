import { Resend } from "resend";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const content = readFileSync(envPath, "utf-8");
let apiKey = "";
let fromAddress = "";

for (const line of content.split("\n")) {
  const t = line.trim();
  if (t.startsWith("RESEND_API_KEY=")) {
    apiKey = t.slice("RESEND_API_KEY=".length).replace(/['"]/g, "");
  }
  if (t.startsWith("RESEND_FROM=")) {
    fromAddress = t.slice("RESEND_FROM=".length).replace(/['"]/g, "");
  }
}

console.log("Using API Key:", apiKey ? "FOUND" : "NOT FOUND");
console.log("Using From Address:", fromAddress);

const resend = new Resend(apiKey);

async function test() {
  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: "s.haribabu@gmail.com",
      subject: "Test email from eHMS Dev System",
      html: "<p>Testing email connectivity and credentials.</p>"
    });
    console.log("Resend API response:", response);
  } catch (err) {
    console.error("Resend API call error:", err);
  }
}

test();
