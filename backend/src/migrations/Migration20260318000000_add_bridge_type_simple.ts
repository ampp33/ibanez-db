import { Migration } from '@mikro-orm/migrations';

export class Migration20260318000000_add_bridge_type_simple extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "guitars"
        ADD COLUMN IF NOT EXISTS "bridge_type_simple" text
          CHECK ("bridge_type_simple" IN ('fixed', 'tremolo'));
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "guitars"
        DROP COLUMN IF EXISTS "bridge_type_simple";
    `);
  }
}
