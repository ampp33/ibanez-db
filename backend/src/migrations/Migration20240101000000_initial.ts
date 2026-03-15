import { Migration } from '@mikro-orm/migrations';

export class Migration20240101000000_initial extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "guitars" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "model" text NOT NULL UNIQUE,
        "name" text NOT NULL,
        "series" text,
        "body_type" text,
        "body_material" text,
        "neck_type" text,
        "neck_material" text,
        "fretboard_material" text,
        "fretboard_radius" text,
        "number_of_frets" int,
        "scale_length" text,
        "pickup_configuration" text,
        "neck_pickup" text,
        "middle_pickup" text,
        "bridge_pickup" text,
        "bridge_type" text,
        "tremolo" boolean,
        "hardware_color" text,
        "finishes" jsonb DEFAULT '[]',
        "country_of_origin" text,
        "years_produced" text,
        "production_start" int,
        "production_end" int,
        "msrp" text,
        "wiki_url" text,
        "raw_attributes" jsonb DEFAULT '{}',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "guitars_pkey" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_guitars_series" ON "guitars" ("series");
      CREATE INDEX IF NOT EXISTS "idx_guitars_body_material" ON "guitars" ("body_material");
      CREATE INDEX IF NOT EXISTS "idx_guitars_fretboard_material" ON "guitars" ("fretboard_material");
      CREATE INDEX IF NOT EXISTS "idx_guitars_pickup_configuration" ON "guitars" ("pickup_configuration");
      CREATE INDEX IF NOT EXISTS "idx_guitars_bridge_type" ON "guitars" ("bridge_type");
      CREATE INDEX IF NOT EXISTS "idx_guitars_country_of_origin" ON "guitars" ("country_of_origin");
      CREATE INDEX IF NOT EXISTS "idx_guitars_production_start" ON "guitars" ("production_start");

      CREATE TABLE IF NOT EXISTS "guitar_images" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "guitar_id" uuid NOT NULL,
        "storage_key" text NOT NULL,
        "original_name" text NOT NULL,
        "size_bytes" int NOT NULL,
        "mime_type" text NOT NULL DEFAULT 'image/jpeg',
        "is_primary" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "guitar_images_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "guitar_images_guitar_id_fkey"
          FOREIGN KEY ("guitar_id") REFERENCES "guitars" ("id")
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS "idx_guitar_images_guitar_id" ON "guitar_images" ("guitar_id");
      CREATE INDEX IF NOT EXISTS "idx_guitar_images_is_primary" ON "guitar_images" ("is_primary");
    `);
  }

  override async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS "guitar_images";');
    this.addSql('DROP TABLE IF EXISTS "guitars";');
  }
}
