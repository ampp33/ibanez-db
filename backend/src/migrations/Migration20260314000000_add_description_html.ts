import { Migration } from '@mikro-orm/migrations';

export class Migration20260314000000_add_description_html extends Migration {
  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "guitars" ADD COLUMN IF NOT EXISTS "description_html" text;`);
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "guitars" DROP COLUMN IF EXISTS "description_html";`);
  }
}
