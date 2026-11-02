import { describe, it, expect } from 'vitest';
import {
  extractIsbnsFromText,
  isValidIsbn10,
  isValidIsbn13,
  normalizeIsbn
} from '../isbnExtractor';

describe('isbnExtractor', () => {
  describe('isValidIsbn10 and isValidIsbn13', () => {
    it('validates 10-digit ISBN check digit', () => {
      // 80-257-0367-3 is valid ISBN-10
      expect(isValidIsbn10('80-257-0367-3')).toBe(true);
      expect(isValidIsbn10('8025703673')).toBe(true);
      expect(isValidIsbn10('8025703672')).toBe(false); // bad check digit
    });

    it('validates 13-digit ISBN check digit', () => {
      expect(isValidIsbn13('978-80-257-0367-0')).toBe(true);
      expect(isValidIsbn13('9788025703670')).toBe(true);
      expect(isValidIsbn13('9788025703675')).toBe(false); // bad check digit
    });
  });

  describe('normalizeIsbn', () => {
    it('strips non-isbn characters', () => {
      expect(normalizeIsbn('ISBN: 978-80-257-0367-0')).toBe('9788025703670');
      expect(normalizeIsbn(' 80 257 0367 3 ')).toBe('8025703673');
    });
  });

  describe('extractIsbnsFromText (OCR parser)', () => {
    it('extracts ISBN when prefixed with "ISBN"', () => {
      const text = `
        Vydalo nakladatelství Argo v Praze roku 2011.
        ISBN 978-80-257-0367-0
        Vytiskla tiskárna PBtisk Příbram.
      `;
      const isbns = extractIsbnsFromText(text);
      expect(isbns).toContain('9788025703670');
    });

    it('extracts bare 13-digit ISBN without "ISBN" label', () => {
      const text = 'Čárový kód: 9788020719805 cena 299 Kč';
      const isbns = extractIsbnsFromText(text);
      expect(isbns).toContain('9788020719805');
    });

    it('converts valid ISBN-10 to ISBN-13', () => {
      const text = 'ISBN-10: 80-257-0367-3';
      const isbns = extractIsbnsFromText(text);
      expect(isbns).toContain('9788025703670');
    });

    it('returns empty array when no valid ISBN is found in text', () => {
      const text = 'Žádný kód zde není, pouze telefon 123456789 a náhodný text.';
      const isbns = extractIsbnsFromText(text);
      expect(isbns).toEqual([]);
    });
  });
});
