/**
 * Jest Setup File
 *
 * Runs AFTER jest.polyfills.js (which sets up TextEncoder, etc.)
 * Imports jest-dom for additional matchers like toBeInTheDocument().
 */

import '@testing-library/jest-dom'

/**
 * Polyfills for Next.js server APIs in jsdom environment
 * Required for testing API routes that use Request, Response, etc.
 *
 * Note: TextEncoder/TextDecoder are polyfilled in jest.polyfills.js
 */

// Import Node.js fetch polyfills for the test environment
import { Request, Response, Headers, FormData } from 'undici'

// Assign to global scope
Object.assign(global, {
  Request,
  Response,
  Headers,
  FormData,
})

/**
 * Global test lifecycle hooks
 *
 * Cleans up mocks after each test to prevent state leaks.
 * The forceExit option in jest.config.ts handles any timer leaks
 * from component setTimeout calls (redirects, success messages).
 */
afterEach(() => {
  jest.clearAllMocks()
})
