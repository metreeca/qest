/*
 * Copyright © 2025 Metreeca srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * URL-safe base64 encoding and decoding.
 *
 * Implements RFC 4648 §5 base64url encoding using `-` instead of `+`, `_` instead of `/`, and omitting `=` padding
 * for URL compatibility. Handles Unicode content via UTF-8 encoding.
 *
 * @remarks
 *
 * Native `btoa()` and `atob()` functions have significant limitations:
 *
 * - **Character range**: Accept only Latin-1 characters (code points ≤ 0xFF); multi-byte Unicode characters throw
 *   `InvalidCharacterError`
 * - **No UTF-8 support**: Treat input as 16-bit code units, not UTF-8 bytes, causing encoding failures for non-ASCII
 *   content
 * - **Surrogate pair issues**: Emoji and other characters outside the Basic Multilingual Plane (e.g., 🦄) are
 *   represented as surrogate pairs in JavaScript's UTF-16 encoding, which `btoa()` mishandles
 *
 * This module addresses these limitations:
 *
 * - **Full Unicode support**: Arbitrary Unicode strings, including emoji and non-BMP characters, encode and decode
 *   correctly
 * - **URL-safe output**: Encoded strings can be embedded directly in URLs without escaping
 * - **Flexible input**: Decoding accepts both padded and unpadded base64url strings
 *
 * @module
 *
 * @see {@link https://datatracker.ietf.org/doc/html/rfc4648#section-5 | RFC 4648 §5}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa | MDN - btoa()}
 */

/**
 * Encodes a string to URL-safe base64.
 *
 * @param plain The string to encode
 *
 * @returns The URL-safe base64-encoded string
 *
 * @see {@link decodeBase64}
 */
export function encodeBase64(plain: string): string {

	const bytes = new TextEncoder().encode(plain);
	const base64 = btoa(String.fromCharCode(...bytes));

	return base64
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");

}

/**
 * Decodes a URL-safe base64 string.
 *
 * Handles both padded and unpadded input, restoring padding as needed before decoding.
 *
 * @param encoded The URL-safe base64-encoded string
 *
 * @returns The decoded string
 *
 * @see {@link encodeBase64}
 */
export function decodeBase64(encoded: string): string {

	const base64 = encoded
		.replace(/-/g, "+")
		.replace(/_/g, "/");

	const padLen = (4-base64.length%4)%4;
	const padded = padLen > 0 && !base64.endsWith("=") ? base64+"=".repeat(padLen) : base64;
	const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));

	return new TextDecoder().decode(bytes);

}
