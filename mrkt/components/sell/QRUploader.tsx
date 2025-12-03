/**
 * QR Code Uploader Component
 *
 * File upload component for QR code images with:
 * - Drag and drop support
 * - File type and size validation
 * - Image preview
 * - Upload progress tracking
 * - Error handling
 *
 * Premium dark theme styling.
 */

'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import {
  validateQRFile,
  ALLOWED_QR_EXTENSIONS,
  MAX_QR_FILE_SIZE,
} from '@/lib/supabase/storage'

interface QRUploaderProps {
  /**
   * File selected by user (not yet uploaded)
   */
  file: File | null

  /**
   * Callback when file is selected or changed
   */
  onFileSelect: (file: File | null) => void

  /**
   * Whether the component is in a disabled state (e.g., during form submission)
   */
  disabled?: boolean

  /**
   * Validation error to display (from parent component)
   */
  error?: string | null
}

export function QRUploader({
  file,
  onFileSelect,
  disabled = false,
  error = null,
}: QRUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Combined error (validation or external)
  const displayError = validationError || error

  /**
   * Handle file selection (both from input and drag-drop)
   */
  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) {
      setPreview(null)
      setValidationError(null)
      onFileSelect(null)
      return
    }

    // Validate file
    const error = validateQRFile(selectedFile)
    if (error) {
      setValidationError(error)
      setPreview(null)
      onFileSelect(null)
      return
    }

    // Clear validation error
    setValidationError(null)

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      // PDF - no preview
      setPreview(null)
    }

    // Notify parent
    onFileSelect(selectedFile)
  }

  /**
   * Handle drag events
   */
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (disabled) return

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  /**
   * Handle drop event
   */
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFile(droppedFile)
    }
  }

  /**
   * Handle file input change
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return

    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFile(selectedFile)
    }
  }

  /**
   * Handle remove file
   */
  const handleRemove = () => {
    if (disabled) return

    handleFile(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div>
      <label
        htmlFor="qr-upload"
        className="block text-sm font-medium text-white mb-2"
      >
        QR Code Image <span className="text-red-400">*</span>
      </label>

      {/* Upload Area */}
      {!file ? (
        <div
          className={`flex justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
            dragActive
              ? 'border-[var(--color-crimson)] bg-[var(--color-crimson)]/10'
              : 'border-white/20 hover:border-white/40'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-white/30"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                clipRule="evenodd"
              />
            </svg>
            <div className="mt-4 flex text-sm text-white/60">
              <span className="font-semibold text-[var(--color-crimson)]">
                {dragActive ? 'Drop file here' : 'Click to upload'}
              </span>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-white/40 mt-2">
              PNG, JPEG, or PDF up to{' '}
              {formatFileSize(MAX_QR_FILE_SIZE)}
            </p>
          </div>
        </div>
      ) : (
        /* File Preview */
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              {/* Image Preview or PDF Icon */}
              {preview ? (
                <img
                  src={preview}
                  alt="QR Code Preview"
                  className="h-20 w-20 rounded-lg object-cover border border-white/10"
                />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                  <svg
                    className="h-10 w-10 text-white/40"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {file.name}
                </p>
                <p className="text-sm text-white/50">
                  {formatFileSize(file.size)}
                </p>
                <p className="text-xs text-green-400 mt-1">
                  ✓ File ready for upload
                </p>
              </div>
            </div>

            {/* Remove Button */}
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="ml-4 rounded-lg bg-white/10 p-2 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={inputRef}
        id="qr-upload"
        name="qr-upload"
        type="file"
        className="sr-only"
        accept={ALLOWED_QR_EXTENSIONS.join(',')}
        onChange={handleChange}
        disabled={disabled}
      />

      {/* Help Text */}
      <p className="mt-2 text-sm text-white/50">
        Upload a redacted screenshot or image of your ticket QR code
      </p>

      {/* Error Message */}
      {displayError && (
        <p className="mt-2 text-sm text-red-400">{displayError}</p>
      )}
    </div>
  )
}
