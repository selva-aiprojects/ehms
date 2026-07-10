import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const envContent = readFileSync(".env.local", "utf-8");
let DB_URL = "";
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("DATABASE_URL=")) {
    DB_URL = trimmed.slice("DATABASE_URL=".length).trim();
    break;
  }
}

const sql = neon(DB_URL);

async function main() {
  console.log("🌱 Seeding Room Categories, Facilities, and Room Specifications for Viswa Service Apartments...");

  const propId = '26b9252e-c62b-426e-905b-21e979696ba8'; // [CSA] Viswa Service Apartments

  try {
    // 1. Seed Facilities & Amenities Master Entries
    console.log("\n1. Seeding Master Facilities & Amenities...");
    const facilitiesList = [
      { name: "Air Conditioning (AC)", code: "AC", description: "Split/Central Air Conditioning with climate control" },
      { name: "Non-AC / Ceiling Fan", code: "NON-AC", description: "Standard ceiling fans with natural ventilation" },
      { name: "High-Speed WiFi", code: "WIFI", description: "100+ Mbps fiber optic wireless internet" },
      { name: "Smart 4K TV", code: "TV", description: "55-inch Smart TV with OTT subscriptions" },
      { name: "Modular Kitchenette", code: "KITCHEN", description: "Equipped with induction cooktop, microwave & utensils" },
      { name: "Private Balcony", code: "BALCONY", description: "Spacious outdoor balcony with seating" },
      { name: "Work Desk & Ergonomic Chair", code: "DESK", description: "Dedicated work desk for corporate guests" },
      { name: "Ensuite Bathroom", code: "BATHROOM", description: "Attached modern bathroom with walk-in shower" },
      { name: "Room Safe", code: "SAFE", description: "Digital electronic safe deposit box" },
      { name: "Geyser / Hot Water", code: "GEYSER", description: "24/7 hot and cold water supply" },
      { name: "24/7 Room Service", code: "SERVICE", description: "Round the clock in-room dining and assistance" },
      { name: "Washing Machine", code: "WASHER", description: "In-unit automatic washing machine" },
    ];

    for (const fac of facilitiesList) {
      await sql`
        INSERT INTO viswa.facilities (property_id, name, code, description, is_active)
        VALUES (${propId}, ${fac.name}, ${fac.code}, ${fac.description}, true)
        ON CONFLICT DO NOTHING
      `;
    }
    console.log(`✅ Seeded ${facilitiesList.length} master facilities.`);

    // 2. Seed Room Categories Master Entries
    console.log("\n2. Seeding Master Room Categories...");
    const categoriesList = [
      { name: "Executive AC Suite (1BHK)", code: "EXEC-AC", base_price: 8500.00, description: "Spacious 1BHK suite with separate living area, kitchenette, and full air conditioning." },
      { name: "Deluxe AC Studio", code: "DLX-AC", base_price: 5500.00, description: "Modern studio apartment with king bed, AC, and kitchenette." },
      { name: "Standard Non-AC Suite", code: "STD-NONAC", base_price: 3800.00, description: "Budget-friendly non-AC service suite with high ceiling fans and attached study." },
      { name: "Presidential 2BHK AC Penthouse", code: "PENT-2BHK", base_price: 14500.00, description: "Luxurious top-floor 2BHK penthouse with dining hall, sea view balcony, and dual AC units." },
    ];

    for (const cat of categoriesList) {
      await sql`
        INSERT INTO viswa.room_categories (property_id, name, code, base_price, description, is_active)
        VALUES (${propId}, ${cat.name}, ${cat.code}, ${cat.base_price}, ${cat.description}, true)
        ON CONFLICT DO NOTHING
      `;
    }
    console.log(`✅ Seeded ${categoriesList.length} room categories.`);

    // 3. Update Existing Rooms in "Main Tower" (Building A)
    console.log("\n3. Updating specifications for all existing rooms in Main Tower...");
    const mainTowerFloors = await sql`
      SELECT f.id, f.floor_number, f.name FROM viswa.floors f
      JOIN viswa.buildings b ON f.building_id = b.id
      WHERE b.property_id = ${propId} AND b.code = 'A'
      ORDER BY f.floor_number
    `;

    let updatedCount = 0;
    for (const flr of mainTowerFloors) {
      const units = await sql`SELECT id, unit_label FROM viswa.units WHERE floor_id = ${flr.id} ORDER BY unit_label`;
      
      for (const u of units) {
        let catName = "Deluxe AC Studio";
        let layoutType = "Deluxe AC Studio";
        let rate = 5500.00;
        let sqFt = 450.00;
        let maxPax = 2;
        let isAc = true;
        let bedType = "King";
        let features = ["Air Conditioning (AC)", "High-Speed WiFi", "Smart 4K TV", "Modular Kitchenette", "Ensuite Bathroom", "Geyser / Hot Water"];

        const label = u.unit_label;

        // Assign realistic mix based on room number
        if (label.endsWith("01") || label.endsWith("02")) {
          if (flr.floor_number >= 4) {
            catName = "Presidential 2BHK AC Penthouse";
            layoutType = "Presidential 2BHK AC Penthouse";
            rate = 14500.00;
            sqFt = 1200.00;
            maxPax = 6;
            bedType = "King (x2)";
            features = ["Air Conditioning (AC)", "High-Speed WiFi", "Smart 4K TV", "Modular Kitchenette", "Private Balcony", "Work Desk & Ergonomic Chair", "Ensuite Bathroom", "Room Safe", "Geyser / Hot Water", "24/7 Room Service", "Washing Machine"];
          } else {
            catName = "Executive AC Suite (1BHK)";
            layoutType = "Executive AC Suite (1BHK)";
            rate = 8500.00;
            sqFt = 650.00;
            maxPax = 4;
            bedType = "King";
            features = ["Air Conditioning (AC)", "High-Speed WiFi", "Smart 4K TV", "Modular Kitchenette", "Private Balcony", "Work Desk & Ergonomic Chair", "Ensuite Bathroom", "Room Safe", "Washing Machine"];
          }
        } else if (label.endsWith("05") || label.endsWith("04") && flr.floor_number <= 2) {
          catName = "Standard Non-AC Suite";
          layoutType = "Standard Non-AC Suite";
          rate = 3800.00;
          sqFt = 400.00;
          maxPax = 2;
          isAc = false;
          bedType = "Twin";
          features = ["Non-AC / Ceiling Fan", "High-Speed WiFi", "Smart 4K TV", "Work Desk & Ergonomic Chair", "Ensuite Bathroom", "Geyser / Hot Water"];
        }

        const attrObj = JSON.stringify({
          ac: isAc,
          category_name: catName,
          bed_type: bedType,
          features: features,
          smoking: false
        });

        await sql`
          UPDATE viswa.units SET
            layout_type = ${layoutType},
            base_rate = ${rate},
            sq_ft = ${sqFt},
            max_occupancy = ${maxPax},
            attributes = ${attrObj}::jsonb,
            updated_at = now()
          WHERE id = ${u.id}
        `;
        updatedCount++;
      }
    }
    console.log(`✅ Updated specifications for ${updatedCount} existing rooms in Main Tower.`);

    // 4. Create Annex Building ("Block B - Annex Wing") & Seed 18 Rooms
    console.log("\n4. Creating/Seeding Block B (Annex Wing) with additional AC & Non-AC rooms...");
    await sql`
      INSERT INTO viswa.buildings (property_id, name, code, floors, year_built)
      VALUES (${propId}, 'Block B - Annex Wing', 'B', 3, 2025)
      ON CONFLICT (property_id, code) DO UPDATE SET name = EXCLUDED.name
    `;

    const bldBRes = await sql`SELECT id FROM viswa.buildings WHERE property_id = ${propId} AND code = 'B'`;
    const buildingBId = bldBRes[0].id;

    let annexUnitsCount = 0;
    for (let fNum = 1; fNum <= 3; fNum++) {
      await sql`
        INSERT INTO viswa.floors (building_id, name, floor_number)
        VALUES (${buildingBId}, ${'Floor ' + fNum}, ${fNum})
        ON CONFLICT (building_id, floor_number) DO NOTHING
      `;
      const flrRes = await sql`SELECT id FROM viswa.floors WHERE building_id = ${buildingBId} AND floor_number = ${fNum}`;
      const floorBId = flrRes[0].id;

      for (let rNum = 1; rNum <= 6; rNum++) {
        const label = `B${fNum}0${rNum}`;
        const isAc = rNum <= 4; // B101..B104 are AC, B105..B106 are Non-AC
        const catName = isAc ? "Deluxe AC Studio" : "Standard Non-AC Suite";
        const layoutType = catName;
        const rate = isAc ? 5500.00 : 3800.00;
        const sqFt = isAc ? 450.00 : 380.00;
        const maxPax = 2;
        const bedType = isAc ? "King" : "Twin";
        const features = isAc
          ? ["Air Conditioning (AC)", "High-Speed WiFi", "Smart 4K TV", "Modular Kitchenette", "Ensuite Bathroom", "Geyser / Hot Water"]
          : ["Non-AC / Ceiling Fan", "High-Speed WiFi", "Work Desk & Ergonomic Chair", "Ensuite Bathroom", "Geyser / Hot Water"];

        const attrObj = JSON.stringify({
          ac: isAc,
          category_name: catName,
          bed_type: bedType,
          features: features,
          smoking: false
        });

        await sql`
          INSERT INTO viswa.units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes)
          VALUES (${floorBId}, 'apartment', ${label}, ${layoutType}, ${sqFt}, ${maxPax}, ${rate}, 'vacant', ${attrObj}::jsonb)
          ON CONFLICT (floor_id, unit_label) DO UPDATE SET
            layout_type = EXCLUDED.layout_type,
            base_rate = EXCLUDED.base_rate,
            sq_ft = EXCLUDED.sq_ft,
            max_occupancy = EXCLUDED.max_occupancy,
            attributes = EXCLUDED.attributes,
            updated_at = now()
        `;
        annexUnitsCount++;
      }
    }
    console.log(`✅ Seeded ${annexUnitsCount} rooms across 3 floors in Block B - Annex Wing.`);

    // 5. Summary Check
    const totalUnitsRes = await sql`
      SELECT COUNT(*) as count FROM viswa.units u
      JOIN viswa.floors f ON u.floor_id = f.id
      JOIN viswa.buildings b ON f.building_id = b.id
      WHERE b.property_id = ${propId}
    `;
    const acUnitsRes = await sql`
      SELECT COUNT(*) as count FROM viswa.units u
      JOIN viswa.floors f ON u.floor_id = f.id
      JOIN viswa.buildings b ON f.building_id = b.id
      WHERE b.property_id = ${propId} AND (u.attributes->>'ac')::boolean = true
    `;
    const nonAcUnitsRes = await sql`
      SELECT COUNT(*) as count FROM viswa.units u
      JOIN viswa.floors f ON u.floor_id = f.id
      JOIN viswa.buildings b ON f.building_id = b.id
      WHERE b.property_id = ${propId} AND (u.attributes->>'ac')::boolean = false
    `;

    console.log("\n🎉 SEEDING COMPLETE FOR VISWA SERVICE APARTMENTS!");
    console.log(`Summary:`);
    console.log(`  - Total Buildings: 2 (Main Tower & Block B - Annex Wing)`);
    console.log(`  - Total Rooms / Units: ${totalUnitsRes[0].count}`);
    console.log(`  - Air Conditioned (AC) Rooms: ${acUnitsRes[0].count}`);
    console.log(`  - Non-AC / Standard Rooms: ${nonAcUnitsRes[0].count}`);

  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
}

main();
