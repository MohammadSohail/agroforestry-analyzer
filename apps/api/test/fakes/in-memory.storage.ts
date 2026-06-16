import { randomUUID } from 'node:crypto';
import { PutObjectInput, StoragePort, StoredObject } from '../../src/shared/storage/storage.types';

/** In-memory {@link StoragePort} — records puts without touching the filesystem. */
export class InMemoryStorage implements StoragePort {
  readonly puts: PutObjectInput[] = [];

  async put(input: PutObjectInput): Promise<StoredObject> {
    this.puts.push(input);
    const key = `${randomUUID()}.img`;
    return { key, url: `https://test.local/uploads/${key}` };
  }
}
