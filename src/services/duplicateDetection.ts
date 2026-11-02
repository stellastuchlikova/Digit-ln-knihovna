import type { Book } from '../types/book';
import { toIsbn13 } from './isbnApi';

export type DuplicateStatus =
  | 'none'
  | 'exact_duplicate' // Same ISBN, or same title+author with same publication date/edition
  | 'different_edition'; // Same title+author, but different ISBN, publication date, or edition

export interface DuplicateCheckResult {
  status: DuplicateStatus;
  existingBook?: Book;
  message: string;
}

/**
 * Normalizes title string for loose comparison (lowercase, trimmed, stripped punctuation/accents).
 */
export function normalizeString(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]/g, '') // alphanumeric only
    .trim();
}

/**
 * Normalizes author array to single sorted string for comparison
 */
export function normalizeAuthors(authors?: string[]): string {
  if (!authors || authors.length === 0) return '';
  return authors
    .map(a => normalizeString(a))
    .filter(Boolean)
    .sort()
    .join('|');
}

/**
 * Checks whether a candidate book is an exact duplicate or a different edition
 * of an existing book in the collection.
 */
export function checkForDuplicates(candidate: Partial<Book>, existingBooks: Book[]): DuplicateCheckResult {
  const candidateIsbn = candidate.isbn ? toIsbn13(candidate.isbn) : '';
  const candidateTitleNorm = normalizeString(candidate.title);
  const candidateAuthorsNorm = normalizeAuthors(candidate.authors);
  const candidateYear = candidate.publishedDate?.trim() || '';
  const candidateEdition = candidate.edition?.trim().toLowerCase() || '';

  // 1. Direct ISBN match check
  if (candidateIsbn) {
    const matchByIsbn = existingBooks.find(b => b.isbn && toIsbn13(b.isbn) === candidateIsbn);
    if (matchByIsbn) {
      return {
        status: 'exact_duplicate',
        existingBook: matchByIsbn,
        message: `Kniha se stejným kódem ISBN (${candidateIsbn}) již v knihovně existuje: "${matchByIsbn.title}".`
      };
    }
  }

  // 2. Title and Author match check
  if (candidateTitleNorm) {
    const matchByTitleAndAuthor = existingBooks.find(b => {
      const bTitleNorm = normalizeString(b.title);
      const bAuthorsNorm = normalizeAuthors(b.authors);

      const titleMatches = bTitleNorm === candidateTitleNorm;
      // If either has no author listed, match on title only if title is at least 4 chars
      const authorMatches = (!candidateAuthorsNorm || !bAuthorsNorm)
        ? bTitleNorm.length > 4
        : bAuthorsNorm === candidateAuthorsNorm;

      return titleMatches && authorMatches;
    });

    if (matchByTitleAndAuthor) {
      const existingYear = matchByTitleAndAuthor.publishedDate?.trim() || '';
      const existingEdition = matchByTitleAndAuthor.edition?.trim().toLowerCase() || '';
      const existingIsbn = matchByTitleAndAuthor.isbn ? toIsbn13(matchByTitleAndAuthor.isbn) : '';

      // Check if it's considered an exact duplicate or a different edition
      const hasDifferentIsbn = candidateIsbn && existingIsbn && candidateIsbn !== existingIsbn;
      const hasDifferentYear = candidateYear && existingYear && candidateYear !== existingYear;
      const hasDifferentEdition = candidateEdition && existingEdition && candidateEdition !== existingEdition;

      if (hasDifferentIsbn || hasDifferentYear || hasDifferentEdition) {
        let details = [];
        if (hasDifferentYear) details.push(`rok: ${candidateYear || 'neuveden'} vs původní ${existingYear}`);
        if (hasDifferentEdition) details.push(`vydání: ${candidate.edition} vs původní ${matchByTitleAndAuthor.edition}`);
        if (hasDifferentIsbn) details.push(`odlišné ISBN`);

        return {
          status: 'different_edition',
          existingBook: matchByTitleAndAuthor,
          message: `V knihovně již máte jinou verzi/vydání knihy "${matchByTitleAndAuthor.title}" (${details.join(', ')}).`
        };
      }

      // If no different properties are specified, it's considered an exact duplicate
      return {
        status: 'exact_duplicate',
        existingBook: matchByTitleAndAuthor,
        message: `Kniha se stejným názvem "${matchByTitleAndAuthor.title}" a autorem již v knihovně existuje.`
      };
    }
  }

  return {
    status: 'none',
    message: ''
  };
}
