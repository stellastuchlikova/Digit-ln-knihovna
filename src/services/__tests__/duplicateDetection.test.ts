import { describe, it, expect } from 'vitest';
import type { Book } from '../../types/book';
import {
  checkForDuplicates,
  normalizeString,
  normalizeAuthors
} from '../duplicateDetection';

const sampleBooks: Book[] = [
  {
    id: 'book-1',
    isbn: '9788025703670',
    title: 'Životy slavných',
    authors: ['Jean de Nostredame'],
    categories: ['Historie'],
    publishedDate: '2011',
    publisher: 'Argo',
    edition: '1. vydání',
    isAvailable: true,
    addedAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'book-2',
    isbn: '9788020401234',
    title: 'R.U.R.',
    authors: ['Karel Čapek'],
    categories: ['Sci-fi'],
    publishedDate: '1920',
    publisher: 'Aventinum',
    edition: '1. vydání',
    isAvailable: true,
    addedAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

describe('duplicateDetection', () => {
  describe('normalization helpers', () => {
    it('normalizes string removing diacritics and casing', () => {
      expect(normalizeString('R.U.R. - Rossumovi Univerzální Roboti')).toBe('rurrossumoviuniverzalniroboti');
      expect(normalizeString('Karel Čapek')).toBe('karelcapek');
    });

    it('normalizes and sorts authors', () => {
      expect(normalizeAuthors(['Karel Čapek', 'Josef Čapek'])).toBe('josefcapek|karelcapek');
    });
  });

  describe('checkForDuplicates', () => {
    it('detects exact duplicate by ISBN', () => {
      const candidate: Partial<Book> = {
        isbn: '978-80-257-0367-0',
        title: 'Nějaký jiný název',
        authors: ['Kdokoli']
      };
      const res = checkForDuplicates(candidate, sampleBooks);
      expect(res.status).toBe('exact_duplicate');
      expect(res.existingBook?.id).toBe('book-1');
    });

    it('detects exact duplicate by identical title, author, and year', () => {
      const candidate: Partial<Book> = {
        title: 'R.U.R.',
        authors: ['Karel Čapek'],
        publishedDate: '1920',
        edition: '1. vydání'
      };
      const res = checkForDuplicates(candidate, sampleBooks);
      expect(res.status).toBe('exact_duplicate');
      expect(res.existingBook?.id).toBe('book-2');
    });

    it('detects different edition when title & author match but year or edition differs', () => {
      const candidateDifferentYear: Partial<Book> = {
        title: 'R.U.R.',
        authors: ['Karel Čapek'],
        publishedDate: '2004',
        edition: '2. vydání'
      };
      const res = checkForDuplicates(candidateDifferentYear, sampleBooks);
      expect(res.status).toBe('different_edition');
      expect(res.existingBook?.id).toBe('book-2');
      expect(res.message).toContain('jinou verzi/vydání');
    });

    it('detects different edition when title & author match but ISBN is different', () => {
      const candidateDifferentIsbn: Partial<Book> = {
        isbn: '9788072039999',
        title: 'R.U.R.',
        authors: ['Karel Čapek']
      };
      const res = checkForDuplicates(candidateDifferentIsbn, sampleBooks);
      expect(res.status).toBe('different_edition');
      expect(res.existingBook?.id).toBe('book-2');
    });

    it('returns "none" when book does not exist in collection', () => {
      const candidateNew: Partial<Book> = {
        isbn: '9788000000000',
        title: 'Válka s Mloky',
        authors: ['Karel Čapek']
      };
      const res = checkForDuplicates(candidateNew, sampleBooks);
      expect(res.status).toBe('none');
      expect(res.existingBook).toBeUndefined();
    });
  });
});
