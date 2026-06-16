export interface StoredObject {
  /** Opaque key used to address the object within the storage backend. */
  key: string;
  /** Publicly reachable URL for the stored object. */
  url: string;
}

export interface PutObjectInput {
  body: Buffer;
  contentType: string;
  /** Original filename — used to derive a sensible extension. */
  filename: string;
}

/** DI token for the storage port. */
export const STORAGE_PORT = Symbol('STORAGE_PORT');

export interface StoragePort {
  put(input: PutObjectInput): Promise<StoredObject>;
}
