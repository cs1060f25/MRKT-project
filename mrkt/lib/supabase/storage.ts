/**
 * Supabase Storage Utilities
 *
 * Helper functions for managing file uploads to Supabase Storage,
 * specifically for QR code images in the 'qr_codes' bucket.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Allowed file types for QR code uploads
 */
export const ALLOWED_QR_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
] as const

export const ALLOWED_QR_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.pdf'] as const

/**
 * Maximum file size for QR codes (10MB)
 */
export const MAX_QR_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

/**
 * Storage bucket name for QR codes
 */
export const QR_CODES_BUCKET = 'qr_codes'

/**
 * Result type for upload operations
 */
export interface UploadResult {
  success: boolean
  path?: string
  error?: string
}

/**
 * Progress callback for upload tracking
 */
export type UploadProgressCallback = (progress: number) => void

/**
 * Validate file before upload
 *
 * Checks file type and size constraints
 *
 * @param file - File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateQRFile(file: File): string | null {
  // Check file size
  if (file.size > MAX_QR_FILE_SIZE) {
    const sizeMB = (MAX_QR_FILE_SIZE / (1024 * 1024)).toFixed(0)
    return `File size must be less than ${sizeMB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`
  }

  // Check file type by MIME type
  if (!ALLOWED_QR_MIME_TYPES.includes(file.type as any)) {
    return `File type not allowed. Please upload a PNG, JPEG, or PDF file.`
  }

  // Additional check: validate file extension
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
  if (!ALLOWED_QR_EXTENSIONS.includes(extension as any)) {
    return `File extension not allowed. Allowed: ${ALLOWED_QR_EXTENSIONS.join(', ')}`
  }

  return null
}

/**
 * Generate storage path for QR code
 *
 * Path format: {event_id}/{ask_id}/qr.{extension}
 *
 * @param eventId - Event UUID
 * @param askId - Ask UUID
 * @param file - File being uploaded (to determine extension)
 * @returns Storage path
 */
export function generateQRStoragePath(
  eventId: string,
  askId: string,
  file: File
): string {
  // Determine extension from file type
  let extension = 'png'
  if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
    extension = 'jpeg'
  } else if (file.type === 'application/pdf') {
    extension = 'pdf'
  }

  return `${eventId}/${askId}/qr.${extension}`
}

/**
 * Upload QR code to Supabase Storage
 *
 * Uploads a QR code file to the qr_codes bucket using the RLS-protected path format.
 * The path is pre-determined as {eventId}/{askId}/qr.{ext}, and RLS policies
 * ensure the user can only upload for asks they own.
 *
 * @param supabase - Supabase client (must be authenticated)
 * @param file - File to upload
 * @param eventId - Event UUID
 * @param askId - Ask UUID
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Upload result with path or error
 *
 * @example
 * ```typescript
 * const result = await uploadQRCode(
 *   supabase,
 *   file,
 *   'event-uuid',
 *   'ask-uuid',
 *   (progress) => console.log(`${progress}% uploaded`)
 * )
 * if (result.success) {
 *   console.log('Uploaded to:', result.path)
 * } else {
 *   console.error('Upload failed:', result.error)
 * }
 * ```
 */
export async function uploadQRCode(
  supabase: SupabaseClient,
  file: File,
  eventId: string,
  askId: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  try {
    // Validate file
    const validationError = validateQRFile(file)
    if (validationError) {
      return {
        success: false,
        error: validationError,
      }
    }

    // Generate storage path
    const path = generateQRStoragePath(eventId, askId, file)

    // Track progress if callback provided
    if (onProgress) {
      onProgress(0)
    }

    // Upload to Supabase Storage
    // Note: upsert=true allows replacing existing QR code
    const { data, error } = await supabase.storage
      .from(QR_CODES_BUCKET)
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      })

    if (error) {
      console.error('[uploadQRCode] Storage error:', error)

      // Map common errors to user-friendly messages
      if (error.message.includes('row-level security')) {
        return {
          success: false,
          error: 'You are not authorized to upload this file. Please ensure you own this listing.',
        }
      }

      if (error.message.includes('payload too large')) {
        return {
          success: false,
          error: 'File is too large. Maximum size is 10MB.',
        }
      }

      return {
        success: false,
        error: error.message || 'Failed to upload file. Please try again.',
      }
    }

    if (onProgress) {
      onProgress(100)
    }

    return {
      success: true,
      path: data.path,
    }
  } catch (err) {
    console.error('[uploadQRCode] Unexpected error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Delete QR code from storage
 *
 * Deletes a QR code file from the qr_codes bucket.
 * RLS policies ensure only the seller can delete QR codes for open asks.
 *
 * @param supabase - Supabase client (must be authenticated)
 * @param eventId - Event UUID
 * @param askId - Ask UUID
 * @param extension - File extension ('png', 'jpeg', or 'pdf')
 * @returns True if deleted successfully, false otherwise
 */
export async function deleteQRCode(
  supabase: SupabaseClient,
  eventId: string,
  askId: string,
  extension: 'png' | 'jpeg' | 'pdf' = 'png'
): Promise<boolean> {
  try {
    const path = `${eventId}/${askId}/qr.${extension}`

    const { error } = await supabase.storage
      .from(QR_CODES_BUCKET)
      .remove([path])

    if (error) {
      console.error('[deleteQRCode] Storage error:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('[deleteQRCode] Unexpected error:', err)
    return false
  }
}

/**
 * Get signed URL for viewing QR code
 *
 * Generates a time-limited signed URL for viewing a QR code.
 * RLS policies ensure only authorized users (seller or ticket winner) can access.
 *
 * @param supabase - Supabase client (must be authenticated)
 * @param storagePath - Full storage path (e.g., "event-id/ask-id/qr.png")
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Signed URL or null if error
 *
 * @example
 * ```typescript
 * const url = await getQRCodeURL(supabase, 'event-id/ask-id/qr.png')
 * if (url) {
 *   window.open(url, '_blank')
 * }
 * ```
 */
export async function getQRCodeURL(
  supabase: SupabaseClient,
  storagePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(QR_CODES_BUCKET)
      .createSignedUrl(storagePath, expiresIn)

    if (error) {
      console.error('[getQRCodeURL] Storage error:', error)
      return null
    }

    return data.signedUrl
  } catch (err) {
    console.error('[getQRCodeURL] Unexpected error:', err)
    return null
  }
}

/**
 * Check if QR code exists in storage
 *
 * @param supabase - Supabase client
 * @param storagePath - Full storage path
 * @returns True if file exists, false otherwise
 */
export async function qrCodeExists(
  supabase: SupabaseClient,
  storagePath: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from(QR_CODES_BUCKET)
      .list(storagePath.split('/').slice(0, -1).join('/'), {
        search: storagePath.split('/').pop(),
      })

    if (error) {
      return false
    }

    return data && data.length > 0
  } catch {
    return false
  }
}
