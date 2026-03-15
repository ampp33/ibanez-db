import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  type Ref,
} from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { Guitar } from './Guitar';

@Entity({ tableName: 'guitar_images' })
export class GuitarImage {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuid();

  @ManyToOne(() => Guitar, { fieldName: 'guitar_id' })
  guitar!: Guitar;

  /** Storage key in MinIO/S3 (e.g., "rg550/abc-123.jpg"). */
  @Property({ type: 'text' })
  storageKey!: string;

  /** Original filename from the wiki. */
  @Property({ type: 'text' })
  originalName!: string;

  /** File size in bytes. Used to detect image changes. */
  @Property({ type: 'int' })
  sizeBytes!: number;

  @Property({ type: 'text', default: 'image/jpeg' })
  mimeType: string = 'image/jpeg';

  /** Whether this is the primary display image for the guitar. */
  @Property({ type: 'boolean', default: false })
  isPrimary: boolean = false;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();
}
