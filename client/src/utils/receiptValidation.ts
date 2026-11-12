export const MAX_RECEIPT_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export const ACCEPTED_RECEIPT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

export const ACCEPTED_RECEIPT_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf'
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that a receipt file has an allowed file extension or MIME type,
 * and does not exceed the 25 MB size limit.
 */
export function validateReceiptFile(
  file: File | { name: string; size: number; type?: string } | null | undefined
): FileValidationResult {
  if (!file) {
    return {
      valid: false,
      error: 'No receipt file selected. Please choose or drop a receipt file.'
    };
  }

  const nameParts = file.name.split('.');
  const ext = nameParts.length > 1 ? nameParts.pop()?.toLowerCase() || '' : '';
  const isExtensionValid = ACCEPTED_RECEIPT_EXTENSIONS.includes(ext);
  const mimeType = (file.type || '').toLowerCase();
  const isMimeValid = ACCEPTED_RECEIPT_MIME_TYPES.includes(mimeType);

  if (!isExtensionValid && !isMimeValid) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPG, JPEG, PNG, WebP, or PDF receipt.'
    };
  }

  if (file.size > MAX_RECEIPT_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds 25MB limit. Please upload a receipt smaller than 25MB.'
    };
  }

  return { valid: true };
}
