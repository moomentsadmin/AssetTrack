// Migration script to move from hardcoded asset type enum to flexible asset_types table
import { getDb } from "./db";
import { assetTypes, assets, locations, customFieldDefinitions } from "@shared/schema";
import { sql } from "drizzle-orm";

async function migrate() {
  try {
    // Step 1: Create asset_types table if it doesn't exist
    await getDb().execute(sql`
      CREATE TABLE IF NOT EXISTS asset_types (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Step 2: Insert default asset types (from old enum values)
    const defaultTypes = [
      { name: "Hardware", description: "Computer hardware, servers, laptops, desktops" },
      { name: "Software", description: "Software applications and tools" },
      { name: "License", description: "Software licenses and subscriptions" },
      { name: "Accessory", description: "Computer accessories and peripherals" },
      { name: "Office Equipment", description: "Office furniture and equipment" },
      { name: "Vehicle", description: "Company vehicles" },
    ];

    for (const type of defaultTypes) {
      await db.execute(sql`
        INSERT INTO asset_types (name, description)
        VALUES (${type.name}, ${type.description})
        ON CONFLICT (name) DO NOTHING
      `);
    }

    // Step 3: Add currency column to locations table if it doesn't exist
    await db.execute(sql`
      ALTER TABLE locations 
      ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD'
    `);

    // Step 4: Check if we need to migrate existing assets
    const needsMigration = await getDb().execute(sql`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_name = 'assets' 
      AND column_name = 'asset_type'
    `);

    if (needsMigration.rows[0]?.count > 0) {
      // Step 5: Add new asset_type_id column
      await getDb().execute(sql`
        ALTER TABLE assets 
        ADD COLUMN IF NOT EXISTS asset_type_id VARCHAR
      `);

      // Step 6: Migrate data from old enum to new table references
      // Map old enum values to new asset type IDs
      await getDb().execute(sql`
        UPDATE assets a
        SET asset_type_id = at.id
        FROM asset_types at
        WHERE LOWER(REPLACE(a.asset_type::text, '_', ' ')) = LOWER(at.name)
      `);

      // Step 7: Make asset_type_id NOT NULL and add foreign key
      await getDb().execute(sql`
        ALTER TABLE assets 
        ALTER COLUMN asset_type_id SET NOT NULL
      `);

      await getDb().execute(sql`
        ALTER TABLE assets 
        ADD CONSTRAINT assets_asset_type_id_fkey 
        FOREIGN KEY (asset_type_id) REFERENCES asset_types(id)
      `);

      // Step 8: Drop old asset_type column
      await getDb().execute(sql`
        ALTER TABLE assets 
        DROP COLUMN IF EXISTS asset_type
      `);

      // Step 9: Make location_id mandatory
      await getDb().execute(sql`
        UPDATE assets 
        SET location_id = (SELECT id FROM locations LIMIT 1)
        WHERE location_id IS NULL
      `);

      await getDb().execute(sql`
        ALTER TABLE assets 
        ALTER COLUMN location_id SET NOT NULL
      `);
    }

    // Step 10: Update custom_field_definitions if needed
      const customFieldNeedsMigration = await getDb().execute(sql`
      SELECT COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_name = 'custom_field_definitions' 
      AND column_name = 'asset_type'
    `);

    if (customFieldNeedsMigration.rows[0]?.count > 0) {
      await getDb().execute(sql`
        ALTER TABLE custom_field_definitions 
        ADD COLUMN IF NOT EXISTS asset_type_id VARCHAR
      `);

      await getDb().execute(sql`
        UPDATE custom_field_definitions cfd
        SET asset_type_id = at.id
        FROM asset_types at
        WHERE LOWER(REPLACE(cfd.asset_type::text, '_', ' ')) = LOWER(at.name)
      `);

      await getDb().execute(sql`
        ALTER TABLE custom_field_definitions 
        ALTER COLUMN asset_type_id SET NOT NULL
      `);

      await getDb().execute(sql`
        ALTER TABLE custom_field_definitions 
        ADD CONSTRAINT custom_field_definitions_asset_type_id_fkey 
        FOREIGN KEY (asset_type_id) REFERENCES asset_types(id)
      `);

      await getDb().execute(sql`
        ALTER TABLE custom_field_definitions 
        DROP COLUMN IF EXISTS asset_type
      `);
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

migrate();
