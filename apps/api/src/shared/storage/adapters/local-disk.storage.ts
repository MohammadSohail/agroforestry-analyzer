import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { PutObjectInput, StoragePort, StoredObject } from '../storage.types';

export interface LocalDiskOptions {
  /** Directory on disk where objects are written. */
  dir: string;
  /** Public base URL the API serves these objects from. */
  publicBaseUrl: string;
  /** URL path prefix the objects are exposed under (matches the static mount). */
  publicPathPrefix: string;
}

/**
 * Writes uploaded imagery to local disk and exposes it via a static mount.
 *
 * Chosen for the demo's simplicity. The {@link StoragePort} abstraction means a
 * production S3/R2 adapter is a drop-in replacement — no caller changes. (On an
 * ephemeral host like Render's free tier these files don't survive a restart;
 * see the README's storage note.)
 */
@Injectable()
export class LocalDiskStorage implements StoragePort {
  constructor(private readonly options: LocalDiskOptions) {}

  async put(input: PutObjectInput): Promise<StoredObject> {
    await mkdir(this.options.dir, { recursive: true });
    const ext = extname(input.filename) || '.bin';
    const key = `${randomUUID()}${ext}`;
    await writeFile(join(this.options.dir, key), input.body);

    const base = this.options.publicBaseUrl.replace(/\/$/, '');
    const prefix = this.options.publicPathPrefix.replace(/^\/?|\/$/g, '');
    return { key, url: `${base}/${prefix}/${key}` };
  }
}
