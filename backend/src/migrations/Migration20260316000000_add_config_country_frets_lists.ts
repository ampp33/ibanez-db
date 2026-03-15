import { Migration } from '@mikro-orm/migrations';

export class Migration20260316000000_add_config_country_frets_lists extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "guitars"
        ADD COLUMN IF NOT EXISTS "pickup_configuration_list" jsonb NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "country_of_origin_list" jsonb NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "number_of_frets_list" jsonb NOT NULL DEFAULT '[]';
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "guitars"
        DROP COLUMN IF EXISTS "pickup_configuration_list",
        DROP COLUMN IF EXISTS "country_of_origin_list",
        DROP COLUMN IF EXISTS "number_of_frets_list";
    `);
  }
}
