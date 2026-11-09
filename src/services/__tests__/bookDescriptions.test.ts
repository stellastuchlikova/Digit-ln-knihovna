import { describe, it, expect, beforeEach, vi } from 'vitest';
import { findBookDescription, fetchWikipediaSummary, KNOWN_BOOK_DESCRIPTIONS } from '../bookDescriptions';
import { enrichMissingBookDescriptions, enrichStoredBooksOnline, getStoredBooks, saveBooks } from '../storage';
import type { Book } from '../../types/book';

// Mock localStorage for node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('bookDescriptions service', () => {
  it('returns known description by ISBN', async () => {
    const desc = await findBookDescription({
      isbn: '978-80-7255-163-7',
      title: 'Děti a rozvod'
    });
    expect(desc).toContain('rozpadu manželství');
    expect(desc).toBe(KNOWN_BOOK_DESCRIPTIONS['9788072551637']);
  });

  it('returns known description by Title match when ISBN is missing', async () => {
    const desc = await findBookDescription({
      title: 'Candide'
    });
    expect(desc).toBe(KNOWN_BOOK_DESCRIPTIONS['9788073881641']);
  });

  it('keeps existing description if already provided', async () => {
    const customDesc = 'Vlastní popis knihy';
    const desc = await findBookDescription({
      isbn: '978-80-7255-163-7',
      title: 'Děti a rozvod',
      existingDescription: customDesc
    });
    expect(desc).toBe(customDesc);
  });

  it('contains descriptions for all 9 library books', () => {
    const isbns = [
      '9781576580196', // Gladys Aylward
      '9788072551637', // Děti a rozvod
      '9788073350406', // Chci mluvit jako rodilý Američan
      '9788073881641', // Candide
      '9788072552764', // Ženy, přemožte stres
      '9788025117286', // 2000 nejpoužívanějších francouzských slov
      '9788025145890', // Copywriting
      '9788072551835', // To není moje chyba
      '9788072552597'  // Pět jazyků lásky pro svobodné a osamělé
    ];

    for (const isbn of isbns) {
      expect(KNOWN_BOOK_DESCRIPTIONS[isbn]).toBeDefined();
      expect(KNOWN_BOOK_DESCRIPTIONS[isbn].length).toBeGreaterThan(20);
    }
  });

  it('fetches wikipedia summary with fallback if network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const res = await fetchWikipediaSummary('Nonexistent Book');
    expect(res).toBeNull();
    vi.unstubAllGlobals();
  });

  it('prioritizes Knihovny.cz when available', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: any) => {
      const urlStr = url.toString();
      if (urlStr.includes('knihovny.cz')) {
        return new Response(JSON.stringify({
          resultCount: 1,
          records: [{
            id: 'rec1',
            isbns: ['9788025703670'],
            summary: ['Anotace děje přímo z portálu Knihovny.cz']
          }]
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ resultCount: 0 }), { status: 200 });
    }));

    const desc = await findBookDescription({
      isbn: '9788025703670',
      title: 'Kniha test'
    });

    expect(desc).toBe('Anotace děje přímo z portálu Knihovny.cz');
    vi.unstubAllGlobals();
  });
});

describe('storage description enrichment', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('enriches books missing descriptions', () => {
    const sampleBooks: Book[] = [
      {
        id: '1',
        title: 'Děti a rozvod',
        authors: ['Edward Teyber'],
        categories: ['Psychologie'],
        isbn: '978-80-7255-163-7',
        description: '',
        isAvailable: true,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Kniha s popisem',
        authors: ['Autor'],
        categories: ['Ostatní'],
        isbn: '1234567890',
        description: 'Původní popis zachován',
        isAvailable: true,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const { books, updated } = enrichMissingBookDescriptions(sampleBooks);
    expect(updated).toBe(true);
    expect(books[0].description).toBe(KNOWN_BOOK_DESCRIPTIONS['9788072551637']);
    expect(books[1].description).toBe('Původní popis zachován');
  });

  it('getStoredBooks automatically enriches and persists missing descriptions', () => {
    const sampleBooks: Book[] = [
      {
        id: '1',
        title: 'Copywriting',
        authors: ['Anna Sálová'],
        categories: ['Marketing'],
        isbn: '978-80-251-4589-0',
        description: '',
        isAvailable: true,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    saveBooks(sampleBooks);
    const loaded = getStoredBooks();
    expect(loaded[0].description).toBe(KNOWN_BOOK_DESCRIPTIONS['9788025145890']);
  });

  it('enrichStoredBooksOnline asynchronously enriches missing descriptions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: any) => {
      const urlStr = url.toString();
      if (urlStr.includes('knihovny.cz')) {
        return new Response(JSON.stringify({
          resultCount: 1,
          records: [{
            id: 'rec-online',
            isbns: ['9788011223344'],
            summary: ['Dohledaný online děj z Knihovny.cz']
          }]
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ resultCount: 0 }), { status: 200 });
    }));

    const sampleBooks: Book[] = [
      {
        id: 'online-1',
        title: 'Neznámá kniha',
        authors: ['Neznámý autor'],
        categories: ['Ostatní'],
        isbn: '978-80-1122-334-4',
        description: '',
        isAvailable: true,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    saveBooks(sampleBooks);
    let callbackTriggered = false;
    const { books, updatedCount } = await enrichStoredBooksOnline((updatedBooks) => {
      callbackTriggered = true;
      expect(updatedBooks[0].description).toBe('Dohledaný online děj z Knihovny.cz');
    });

    expect(updatedCount).toBe(1);
    expect(callbackTriggered).toBe(true);
    expect(books[0].description).toBe('Dohledaný online děj z Knihovny.cz');
    vi.unstubAllGlobals();
  });
});
