import { Global, Module } from '@nestjs/common';
import { TypedConfigService } from '../../config/app-config.module';
import { LocalDiskStorage } from './adapters/local-disk.storage';
import { STORAGE_PORT } from './storage.types';

/** URL path uploaded objects are served under (kept in sync with the static mount in main.ts). */
export const UPLOADS_PUBLIC_PREFIX = 'uploads';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PORT,
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) =>
        new LocalDiskStorage({
          dir: config.get('STORAGE_DIR'),
          publicBaseUrl: config.get('PUBLIC_BASE_URL'),
          publicPathPrefix: UPLOADS_PUBLIC_PREFIX,
        }),
    },
  ],
  exports: [STORAGE_PORT],
})
export class StorageModule {}
