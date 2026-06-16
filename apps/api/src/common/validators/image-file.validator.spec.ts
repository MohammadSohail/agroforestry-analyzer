import { ImageFileValidator, sniffImage } from './image-file.validator';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP')]);

describe('sniffImage', () => {
  it('detects png/jpeg/webp by magic bytes', () => {
    expect(sniffImage(PNG)).toBe('png');
    expect(sniffImage(JPEG)).toBe('jpeg');
    expect(sniffImage(WEBP)).toBe('webp');
  });

  it('returns null for non-image content', () => {
    expect(sniffImage(Buffer.from('not an image'))).toBeNull();
  });
});

describe('ImageFileValidator', () => {
  const validator = new ImageFileValidator({ maxBytes: 100 });

  it('accepts a valid, in-size image', () => {
    expect(validator.isValid({ size: 10, buffer: PNG })).toBe(true);
  });

  it('rejects oversized files', () => {
    expect(validator.isValid({ size: 101, buffer: PNG })).toBe(false);
    expect(validator.buildErrorMessage()).toMatch(/limit/);
  });

  it('rejects content whose bytes are not an image', () => {
    expect(validator.isValid({ size: 5, buffer: Buffer.from('plain') })).toBe(false);
    expect(validator.buildErrorMessage()).toMatch(/not a supported image/);
  });

  it('rejects a missing file', () => {
    expect(validator.isValid(undefined)).toBe(false);
  });
});
