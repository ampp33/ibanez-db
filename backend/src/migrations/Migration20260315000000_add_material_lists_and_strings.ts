import { Migration } from '@mikro-orm/migrations';

export class Migration20260315000000_add_material_lists_and_strings extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "guitars"
        ADD COLUMN IF NOT EXISTS "body_material_list" jsonb NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "neck_material_list" jsonb NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "fretboard_material_list" jsonb NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "number_of_strings" int NULL;
    `);

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "guitars_number_of_strings_idx" ON "guitars" ("number_of_strings");
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "guitars_number_of_strings_idx";`);
    this.addSql(`
      ALTER TABLE "guitars"
        DROP COLUMN IF EXISTS "body_material_list",
        DROP COLUMN IF EXISTS "neck_material_list",
        DROP COLUMN IF EXISTS "fretboard_material_list",
        DROP COLUMN IF EXISTS "number_of_strings";
    `);
  }
}
