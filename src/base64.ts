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
 * @module
 *
 * @see {@link https://datatracker.ietf.org/doc/html/rfc4648#section-5 RFC 4648 §5 - Base 64 Encoding with URL and Filename Safe Alphabet}
 */

/**
 * Encodes a string to URL-safe base64.
 *
 * @param plain The string to encode
 * @returns The URL-safe base64-encoded string
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
 * @returns The decoded string
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
