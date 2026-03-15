import { Migration } from '@mikro-orm/migrations';

export class Migration20260314100000_add_slug extends Migration {
  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "guitars" ADD COLUMN IF NOT EXISTS "slug" text;`);
    // Populate slug from model: expand Unicode Roman numerals, lowercase,
    // replace non-alphanumeric runs with hyphens, trim leading/trailing hyphens.
    this.addSql(`
      UPDATE "guitars"
      SET "slug" = TRIM(BOTH '-' FROM REGEXP_REPLACE(
        LOWER(
          REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            "model",
            E'\u2160', 'I'),
            E'\u2161', 'II'),
            E'\u2162', 'III'),
            E'\u2163', 'IV'),
            E'\u2164', 'V')
        ),
        '[^a-z0-9]+', '-', 'g'
      ))
      WHERE "slug" IS NULL;
    `);
    this.addSql(`ALTER TABLE "guitars" ALTER COLUMN "slug" SET NOT NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "guitars_slug_unique" ON "guitars" ("slug");`);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "guitars_slug_unique";`);
    this.addSql(`ALTER TABLE "guitars" DROP COLUMN IF EXISTS "slug";`);
  }
}
