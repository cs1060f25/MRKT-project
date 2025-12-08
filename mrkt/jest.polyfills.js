/**
 * Jest Polyfills
 *
 * This file runs BEFORE jest.setup.ts to polyfill global APIs
 * needed by Next.js and undici.
 *
 * IMPORTANT: This must be a .js file (not .ts) to avoid TypeScript
 * import hoisting issues.
 */

const { TextEncoder, TextDecoder } = require('util')
const { ReadableStream, TransformStream, WritableStream } = require('stream/web')
const { MessageChannel, MessagePort } = require('worker_threads')

// Polyfill TextEncoder/TextDecoder for undici
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill Web Streams API
global.ReadableStream = ReadableStream
global.TransformStream = TransformStream
global.WritableStream = WritableStream

// Polyfill MessageChannel/MessagePort
global.MessageChannel = MessageChannel
global.MessagePort = MessagePort

// Polyfill BroadcastChannel (not available in Node.js by default)
if (!global.BroadcastChannel) {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
      this.name = name
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
}

// Polyfill crypto.randomUUID if not available
if (!global.crypto || !global.crypto.randomUUID) {
  const crypto = require('crypto')
  global.crypto = {
    ...global.crypto,
    randomUUID: () => crypto.randomUUID(),
    getRandomValues: (arr) => crypto.getRandomValues(arr),
  }
}
