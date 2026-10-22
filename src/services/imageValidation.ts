/**
 * Client-side image validation service
 * Enforces file size, MIME types, and magic bytes verification
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  detectedMime?: string;
}

export const MAX_IMAGE_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validate magic bytes from binary slice
 */
export function checkMagicBytes(bytes: Uint8Array): string | null {
  if (!bytes || bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Full file validation for business card images
 */
export async function validateCardImageFile(
  file: File,
  maxSizeBytes: number = MAX_IMAGE_FILE_SIZE_BYTES
): Promise<ValidationResult> {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'Selected file is empty (0 bytes).' };
  }

  if (file.size > maxSizeBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of ${maxMb} MB.`,
    };
  }

  // Read first 16 bytes to inspect magic header
  try {
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const detectedMime = checkMagicBytes(bytes);

    if (!detectedMime) {
      return {
        valid: false,
        error:
          'Unsupported or corrupted file format. Only JPEG, PNG, and WebP business-card images are accepted.',
      };
    }

    if (!ALLOWED_MIME_TYPES.includes(detectedMime)) {
      return {
        valid: false,
        error: `Format "${detectedMime}" is not supported. Please upload JPEG, PNG, or WebP.`,
      };
    }

    return { valid: true, detectedMime };
  } catch (err: any) {
    return {
      valid: false,
      error: 'Failed to inspect file data: ' + (err?.message || 'Read error'),
    };
  }
}
