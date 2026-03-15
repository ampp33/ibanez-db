/**
 * Abstract storage interface for guitar images.
 * Implementations can target MinIO, AWS S3, or any S3-compatible storage.
 */
export interface StorageAdapter {
  /** Ensure the target bucket exists; create if needed. */
  ensureBucket(): Promise<void>;

  /** Upload a file buffer and return the storage key. */
  upload(key: string, data: Buffer, contentType: string): Promise<string>;

  /** Delete an object by key. */
  delete(key: string): Promise<void>;

  /** Get a public URL for the given storage key. */
  getPublicUrl(key: string): string;

  /** Check if an object exists. */
  exists(key: string): Promise<boolean>;
}
