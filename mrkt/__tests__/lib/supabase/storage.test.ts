/**
 * Unit Tests: Storage Utilities
 *
 * Tests for pure storage functions in lib/supabase/storage.ts
 */

import {
  validateQRFile,
  generateQRStoragePath,
  MAX_QR_FILE_SIZE,
} from '@/lib/supabase/storage'

/**
 * Helper to create a mock File object
 */
function createMockFile(
  name: string,
  type: string,
  size: number = 1024
): File {
  const file = new File(['test content'], name, { type })
  // Override the size property
  Object.defineProperty(file, 'size', { value: size, writable: false })
  return file
}

describe('validateQRFile', () => {
  it('should return null for valid PNG file under 10MB', () => {
    const file = createMockFile('qr.png', 'image/png', 5 * 1024 * 1024)
    expect(validateQRFile(file)).toBeNull()
  })

  it('should return null for valid JPEG file', () => {
    const file = createMockFile('qr.jpeg', 'image/jpeg', 1024 * 1024)
    expect(validateQRFile(file)).toBeNull()
  })

  it('should return null for valid PDF file', () => {
    const file = createMockFile('qr.pdf', 'application/pdf', 1024 * 1024)
    expect(validateQRFile(file)).toBeNull()
  })

  it('should return error for file exceeding 10MB', () => {
    const file = createMockFile('qr.png', 'image/png', 15 * 1024 * 1024)
    const error = validateQRFile(file)
    expect(error).not.toBeNull()
    expect(error).toContain('less than')
    expect(error).toContain('10MB')
  })

  it('should return error for invalid MIME type', () => {
    const file = createMockFile('qr.gif', 'image/gif', 1024)
    const error = validateQRFile(file)
    expect(error).not.toBeNull()
    expect(error).toContain('File type not allowed')
  })

  it('should return error for invalid file extension', () => {
    // Create a file with valid MIME but invalid extension
    const file = createMockFile('qr.bmp', 'image/png', 1024)
    const error = validateQRFile(file)
    expect(error).not.toBeNull()
    expect(error).toContain('extension not allowed')
  })
})

describe('generateQRStoragePath', () => {
  it('should generate correct path for PNG file', () => {
    const file = createMockFile('ticket.png', 'image/png')
    const path = generateQRStoragePath('event-123', 'ask-456', file)
    expect(path).toBe('event-123/ask-456/qr.png')
  })

  it('should generate correct path for JPEG file', () => {
    const file = createMockFile('ticket.jpg', 'image/jpeg')
    const path = generateQRStoragePath('event-123', 'ask-456', file)
    expect(path).toBe('event-123/ask-456/qr.jpeg')
  })

  it('should generate correct path for PDF file', () => {
    const file = createMockFile('ticket.pdf', 'application/pdf')
    const path = generateQRStoragePath('event-123', 'ask-456', file)
    expect(path).toBe('event-123/ask-456/qr.pdf')
  })
})

describe('MAX_QR_FILE_SIZE constant', () => {
  it('should be 10MB in bytes', () => {
    expect(MAX_QR_FILE_SIZE).toBe(10 * 1024 * 1024)
  })
})
