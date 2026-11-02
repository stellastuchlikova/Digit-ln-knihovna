/**
 * Utility to extract ISBN numbers from raw OCR or text strings.
 * Handles formats like:
 * - "ISBN 978-80-257-0367-0"
 * - "ISBN: 978 80 257 0367 0"
 * - "ISBN-13: 9788025703670"
 * - "ISBN-10: 80-257-0367-1"
 * - "978-80-207-1980-8"
 */

import { toIsbn13 } from './isbnApi';

/**
 * Validates check digit for ISBN-10
 */
export function isValidIsbn10(isbn10: string): boolean {
  const clean = isbn10.replace(/[^0-9Xx]/g, '');
  if (clean.length !== 10) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i], 10) * (10 - i);
  }
  const lastChar = clean[9].toUpperCase();
  const lastVal = lastChar === 'X' ? 10 : parseInt(lastChar, 10);
  sum += lastVal;

  return sum % 11 === 0;
}

/**
 * Validates check digit for ISBN-13
 */
export function isValidIsbn13(isbn13: string): boolean {
  const clean = isbn13.replace(/[^0-9]/g, '');
  if (clean.length !== 13) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(clean[12], 10);
}

/**
 * Normalizes an ISBN string candidate (removes spaces, hyphens, and non-ISBN symbols).
 */
export function normalizeIsbn(candidate: string): string {
  return candidate.replace(/[^0-9Xx]/g, '').trim();
}

/**
 * Finds all potential ISBN strings within arbitrary text (e.g. from OCR or pasted text).
 * Returns array of unique cleaned ISBN-13 strings (or valid ISBN-10 converted to ISBN-13).
 */
export function extractIsbnsFromText(text: string): string[] {
  if (!text) return [];

  const foundIsbns: Set<string> = new Set();

  // Pattern 1: Look for explicit ISBN prefix (e.g. "ISBN", "ISBN-10", "ISBN-13", "ISBN:")
  const explicitRegex = /(?:ISBN(?:-1[03])?:?\s*)([0-9Xx\s\-–—]{10,24})/gi;
  let match: RegExpExecArray | null;

  while ((match = explicitRegex.exec(text)) !== null) {
    const rawCandidate = match[1];
    const cleaned = normalizeIsbn(rawCandidate);

    if (cleaned.length === 13 && isValidIsbn13(cleaned)) {
      foundIsbns.add(cleaned);
    } else if (cleaned.length === 10 && isValidIsbn10(cleaned)) {
      foundIsbns.add(toIsbn13(cleaned));
    } else if (cleaned.length >= 13) {
      // Sometimes OCR grabs extra characters or trailing digits, test first 13
      const sub13 = cleaned.substring(0, 13);
      if (isValidIsbn13(sub13)) {
        foundIsbns.add(sub13);
      }
    }
  }

  // Pattern 2: Scan for 13-digit numbers starting with 978 or 979 (with or without hyphens/spaces)
  const isbn13Regex = /\b(97[89][\d\s\-–—]{9,18}\d)\b/g;
  while ((match = isbn13Regex.exec(text)) !== null) {
    const cleaned = normalizeIsbn(match[1]);
    if (cleaned.length === 13 && isValidIsbn13(cleaned)) {
      foundIsbns.add(cleaned);
    }
  }

  // Pattern 3: Scan for 10-character sequences that form valid ISBN-10 (with or without hyphens/spaces)
  const isbn10Regex = /\b(\d[\d\s\-–—]{8,14}[\dXx])\b/g;
  while ((match = isbn10Regex.exec(text)) !== null) {
    const cleaned = normalizeIsbn(match[1]);
    if (cleaned.length === 10 && isValidIsbn10(cleaned)) {
      foundIsbns.add(toIsbn13(cleaned));
    }
  }

  return Array.from(foundIsbns);
}
