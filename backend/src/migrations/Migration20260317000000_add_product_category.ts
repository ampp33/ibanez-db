import { Migration } from '@mikro-orm/migrations';

export class Migration20260317000000_add_product_category extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "guitars"
        ADD COLUMN IF NOT EXISTS "product_category" text
          CHECK ("product_category" IN ('guitar', 'bass'));
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "guitars"
        DROP COLUMN IF EXISTS "product_category";
    `);
  }
}
