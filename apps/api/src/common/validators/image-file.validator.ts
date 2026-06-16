import { FileValidator } from '@nestjs/common';

export type ImageKind = 'png' | 'jpeg' | 'webp' | 'tiff';

/**
 * Sniffs an image type from its magic bytes — never trusts the client-supplied
 * Content-Type alone. Dependency-free (no ESM `file-type`), so it behaves
 * identically under Node and Jest and is trivially unit-testable.
 */
export function sniffImage(buf: Buffer): ImageKind | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return 'png';
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'jpeg';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  if (
    buf.length >= 4 &&
    ((buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0x2a && buf[3] === 0x00) ||
      (buf[0] === 0x4d && buf[1] === 0x4d && buf[2] === 0x00 && buf[3] === 0x2a))
  ) {
    return 'tiff';
  }
  return null;
}

export interface ImageFileValidatorOptions {
  maxBytes: number;
}

/** Structurally compatible with Nest's `IFile` (mimetype optional — we trust bytes, not it). */
type FileLike = { mimetype?: string; size: number; buffer?: Buffer };

/** Nest file validator enforcing size + magic-byte image type. */
export class ImageFileValidator extends FileValidator<ImageFileValidatorOptions> {
  private reason = 'Invalid image file.';

  isValid(file?: FileLike | FileLike[] | Record<string, FileLike[]>): boolean {
    const single =
      file && !Array.isArray(file) && typeof (file as FileLike).size === 'number'
        ? (file as FileLike)
        : null;
    if (!single) {
      this.reason = 'A single image file is required.';
      return false;
    }
    if (single.size > this.validationOptions.maxBytes) {
      this.reason = `Image exceeds the ${this.validationOptions.maxBytes}-byte limit.`;
      return false;
    }
    if (!single.buffer || !sniffImage(single.buffer)) {
      this.reason = 'Uploaded file is not a supported image (png, jpeg, webp, or tiff).';
      return false;
    }
    return true;
  }

  buildErrorMessage(): string {
    return this.reason;
  }
}
