import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  Collection,
  type Ref,
} from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { GuitarImage } from './GuitarImage';

@Entity({ tableName: 'guitars' })
export class Guitar {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuid();

  /** The model identifier (e.g., "RG550", "JEM777"). Used as the unique business key. */
  @Property({ type: 'text', unique: true })
  model!: string;

  /** Display name, often same as model but may include extra descriptor. */
  @Property({ type: 'text' })
  name!: string;

  /** URL-friendly slug derived from model name (e.g., "rg652ahms"). */
  @Property({ type: 'text', unique: true })
  slug!: string;

  @Property({ type: 'text', nullable: true })
  series: string | null = null;

  @Property({ type: 'text', nullable: true })
  bodyType: string | null = null;

  @Property({ type: 'text', nullable: true })
  bodyMaterial: string | null = null;

  /** Normalized list of material names in the body (e.g., ["Basswood"]). Used for filtering. */
  @Property({ type: 'json' })
  bodyMaterialList: string[] = [];

  @Property({ type: 'text', nullable: true })
  neckType: string | null = null;

  @Property({ type: 'text', nullable: true })
  neckMaterial: string | null = null;

  /** Normalized list of material names in the neck (e.g., ["Maple", "Walnut"]). Used for filtering. */
  @Property({ type: 'json' })
  neckMaterialList: string[] = [];

  @Property({ type: 'text', nullable: true })
  fretboardMaterial: string | null = null;

  /** Normalized list of material names in the fretboard (e.g., ["Rosewood"]). Used for filtering. */
  @Property({ type: 'json' })
  fretboardMaterialList: string[] = [];

  @Property({ type: 'text', nullable: true })
  fretboardRadius: string | null = null;

  @Property({ type: 'int', nullable: true })
  numberOfFrets: number | null = null;

  /** Normalized list of valid fret counts (10–40). Used for filtering. */
  @Property({ type: 'json' })
  numberOfFretsList: number[] = [];

  /** Number of strings (e.g., 4, 6, 7, 8). */
  @Property({ type: 'int', nullable: true })
  numberOfStrings: number | null = null;

  @Property({ type: 'text', nullable: true })
  scaleLength: string | null = null;

  /** e.g., HSH, HSS, HH, SSS */
  @Property({ type: 'text', nullable: true })
  pickupConfiguration: string | null = null;

  /** Normalized list of pickup types (e.g., ["H", "S"]). Used for filtering. */
  @Property({ type: 'json' })
  pickupConfigurationList: string[] = [];

  @Property({ type: 'text', nullable: true })
  neckPickup: string | null = null;

  @Property({ type: 'text', nullable: true })
  middlePickup: string | null = null;

  @Property({ type: 'text', nullable: true })
  bridgePickup: string | null = null;

  @Property({ type: 'text', nullable: true })
  bridgeType: string | null = null;

  @Property({ type: 'boolean', nullable: true })
  tremolo: boolean | null = null;

  @Property({ type: 'text', nullable: true })
  hardwareColor: string | null = null;

  /** JSON array of finish/color names. */
  @Property({ type: 'json', nullable: true })
  finishes: string[] = [];

  @Property({ type: 'text', nullable: true })
  countryOfOrigin: string | null = null;

  /** Normalized list of country names (e.g., ["Japan"]). Used for filtering. */
  @Property({ type: 'json' })
  countryOfOriginList: string[] = [];

  /** Free-text years produced string from wiki (e.g., "1987-1994, 2007-present"). */
  @Property({ type: 'text', nullable: true })
  yearsProduced: string | null = null;

  @Property({ type: 'int', nullable: true })
  productionStart: number | null = null;

  @Property({ type: 'int', nullable: true })
  productionEnd: number | null = null;

  @Property({ type: 'text', nullable: true })
  msrp: string | null = null;

  /** HTML description scraped from the wiki article paragraphs. */
  @Property({ type: 'text', nullable: true })
  descriptionHtml: string | null = null;

  @Property({ type: 'text', nullable: true })
  wikiUrl: string | null = null;

  /** Raw key-value pairs scraped from the wiki infobox. */
  @Property({ type: 'json', nullable: true })
  rawAttributes: Record<string, string> = {};

  @OneToMany(() => GuitarImage, (img) => img.guitar)
  images = new Collection<GuitarImage>(this);

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();

  @Property({ type: 'datetime', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
