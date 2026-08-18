import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

// 1. Get users
const users = await sql`SELECT id, email FROM viswa.users`;
const userMap = {};
users.forEach(u => userMap[u.email] = u.id);

console.log("Mapping users to employees...");
// Update EMP001 -> frontdesk@ehms.demo
await sql`
  UPDATE viswa.employees 
  SET user_id = ${userMap['frontdesk@ehms.demo']} 
  WHERE employee_code = 'EMP001'
`;

// Update EMP002 -> housekeeping@ehms.demo
await sql`
  UPDATE viswa.employees 
  SET user_id = ${userMap['housekeeping@ehms.demo']} 
  WHERE employee_code = 'EMP002'
`;

// Update EMP003 -> maintenance@ehms.demo
await sql`
  UPDATE viswa.employees 
  SET user_id = ${userMap['maintenance@ehms.demo']} 
  WHERE employee_code = 'EMP003'
`;

// Update EMP004 -> finance@ehms.demo
await sql`
  UPDATE viswa.employees 
  SET user_id = ${userMap['finance@ehms.demo']} 
  WHERE employee_code = 'EMP004'
`;

// Update EMP005 -> admin@ehms.demo
await sql`
  UPDATE viswa.employees 
  SET user_id = ${userMap['admin@ehms.demo']} 
  WHERE employee_code = 'EMP005'
`;

console.log("Checking if EMP006 (HR Manager) exists...");
const emp006 = await sql`SELECT id FROM viswa.employees WHERE employee_code = 'EMP006'`;
if (emp006.length === 0) {
  const hrDept = await sql`SELECT id FROM viswa.departments WHERE name = 'Human Resources & Admin' LIMIT 1`;
  const firstProp = await sql`SELECT id FROM viswa.properties LIMIT 1`;
  
  if (hrDept.length > 0 && userMap['hr@ehms.demo']) {
    console.log("Inserting EMP006 (HR Manager)...");
    await sql`
      INSERT INTO viswa.employees (
        id, employee_code, user_id, department_id, designation, employment_type,
        doj, base_salary, is_active, property_id, created_at
      ) VALUES (
        gen_random_uuid(), 'EMP006', ${userMap['hr@ehms.demo']}, ${hrDept[0].id}, 'HR Manager', 'full_time',
        '2025-01-15', 55000.00, true, ${firstProp[0].id}, NOW()
      )
    `;
  }
}

console.log("✅ Successfully mapped employees to their user accounts!");
