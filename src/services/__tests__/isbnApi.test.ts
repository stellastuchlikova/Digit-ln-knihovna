import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  toIsbn13,
  cleanCatalogText,
  cleanAuthorName,
  parseYearFromPublicationDates,
  parsePageCountFromPhysicalDescriptions,
  cleanDescriptionText,
  extractDescriptionFromKnihovnyRecord,
  parseKnihovnyCzRecord,
  fetchFromKnihovnyCz,
  fetchSummaryFromKnihovnyCz
} from '../isbnApi';

const sampleApiResponse = {
  resultCount: 1,
  records: [
    {
      id: "mkp.3521868",
      title: "Životy slavných a starých provensálských básníků, kteří žili v dobách hrabat z kraje Provença",
      authors: {
        primary: { "Jean de Nostredame, asi 1507-1577": [] },
        secondary: { "Josef Prokop, 1971-": [], "Vojtěch Domlátil, 1979-": [] },
        corporate: []
      },
      publishers: ["Argo,"],
      placesOfPublication: ["Praha :"],
      publicationDates: ["2011"],
      physicalDescriptions: ["218 s. : il. ; 22 cm"],
      isbns: ["978-80-257-0367-0"],
      issns: [],
      cnb: "cnb002163342",
      formats: ["0/BOOKS/"],
      summary: ["<p>Poutavé vyprávění ze staré Provence plné básní a příběhů.</p>"]
    }
  ],
  status: "OK"
};

describe('ISBN & Knihovny.cz API utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('toIsbn13', () => {
    it('converts 10-digit ISBN to 13-digit ISBN', () => {
      // 80-257-0367-1 -> 9788025703670
      expect(toIsbn13('8025703671')).toBe('9788025703670');
      expect(toIsbn13('80-257-0367-1')).toBe('9788025703670');
    });

    it('returns existing 13-digit ISBN without hyphens', () => {
      expect(toIsbn13('978-80-257-0367-0')).toBe('9788025703670');
    });
  });

  describe('cleanCatalogText', () => {
    it('trims trailing cataloguing punctuation', () => {
      expect(cleanCatalogText('Argo,')).toBe('Argo');
      expect(cleanCatalogText('Praha :')).toBe('Praha');
      expect(cleanCatalogText('[Praha] :')).toBe('[Praha]');
      expect(cleanCatalogText('  Test Title ;  ')).toBe('Test Title');
    });
  });

  describe('cleanAuthorName', () => {
    it('removes date ranges and years from author name keys', () => {
      expect(cleanAuthorName('Jean de Nostredame, asi 1507-1577')).toBe('Jean de Nostredame');
      expect(cleanAuthorName('Josef Prokop, 1971-')).toBe('Josef Prokop');
      expect(cleanAuthorName('Vojtěch Domlátil, 1979-')).toBe('Vojtěch Domlátil');
      expect(cleanAuthorName('Karel Čapek')).toBe('Karel Čapek');
    });
  });

  describe('parseYearFromPublicationDates', () => {
    it('extracts 4-digit year from array', () => {
      expect(parseYearFromPublicationDates(['2011'])).toBe('2011');
      expect(parseYearFromPublicationDates(['c2010'])).toBe('2010');
      expect(parseYearFromPublicationDates(['[2025]'])).toBe('2025');
      expect(parseYearFromPublicationDates([])).toBe('');
      expect(parseYearFromPublicationDates(undefined)).toBe('');
    });
  });

  describe('parsePageCountFromPhysicalDescriptions', () => {
    it('extracts page count number', () => {
      expect(parsePageCountFromPhysicalDescriptions(['218 s. : il. ; 22 cm'])).toBe(218);
      expect(parsePageCountFromPhysicalDescriptions(['260 stran'])).toBe(260);
      expect(parsePageCountFromPhysicalDescriptions(undefined)).toBeUndefined();
    });
  });

  describe('cleanDescriptionText & extractDescriptionFromKnihovnyRecord', () => {
    it('strips html tags and trims description text', () => {
      expect(cleanDescriptionText('<p>Krásná <b>kniha</b> &amp; příběh.</p>')).toBe('Krásná kniha & příběh.');
    });

    it('extracts summary array into joined text', () => {
      const record = {
        summary: ['První odstavec děje.', 'Druhý odstavec děje.']
      };
      expect(extractDescriptionFromKnihovnyRecord(record)).toBe('První odstavec děje.\n\nDruhý odstavec děje.');
    });

    it('falls back to description or notes if summary is not present', () => {
      expect(extractDescriptionFromKnihovnyRecord({ description: 'Popis z pole description' })).toBe('Popis z pole description');
      expect(extractDescriptionFromKnihovnyRecord({ notes: ['Poznámka o ději'] })).toBe('Poznámka o ději');
      expect(extractDescriptionFromKnihovnyRecord({})).toBe('');
    });
  });

  describe('parseKnihovnyCzRecord', () => {
    it('correctly maps raw JSON record from Knihovny.cz to Partial<Book>', () => {
      const record = sampleApiResponse.records[0];
      const parsed = parseKnihovnyCzRecord(record, '9788025703670');

      expect(parsed).toEqual({
        isbn: '9788025703670',
        title: 'Životy slavných a starých provensálských básníků, kteří žili v dobách hrabat z kraje Provença',
        authors: [
          'Jean de Nostredame',
          'Josef Prokop',
          'Vojtěch Domlátil'
        ],
        categories: ['❓ Ostatní / Nezařazeno'],
        publishedDate: '2011',
        publisher: 'Argo',
        description: 'Poutavé vyprávění ze staré Provence plné básní a příběhů.',
        coverUrl: undefined,
        pageCount: 218,
        language: 'cs'
      });
    });
  });

  describe('fetchSummaryFromKnihovnyCz', () => {
    it('fetches summary by ISBN', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(sampleApiResponse), { status: 200 })
      );

      const summary = await fetchSummaryFromKnihovnyCz({ isbn: '978-80-257-0367-0' });
      expect(summary).toBe('Poutavé vyprávění ze staré Provence plné básní a příběhů.');
    });

    it('fetches summary by title when ISBN is absent', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(sampleApiResponse), { status: 200 })
      );

      const summary = await fetchSummaryFromKnihovnyCz({ title: 'Životy slavných a starých provensálských básníků' });
      expect(summary).toBe('Poutavé vyprávění ze staré Provence plné básní a příběhů.');
    });
  });

  describe('fetchFromKnihovnyCz', () => {
    it('fetches and parses book data using Knihovny.cz API structure', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
        const urlString = url.toString();
        expect(urlString).toContain('https://www.knihovny.cz/api/v1/search');
        expect(urlString).toContain('lookfor=9788025703670');
        expect(urlString).toContain('type=ISN');
        expect(urlString).toContain('limit=10');
        expect(urlString).toContain('field%5B%5D=id');
        expect(urlString).toContain('field%5B%5D=title');

        return new Response(JSON.stringify(sampleApiResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      });

      const result = await fetchFromKnihovnyCz('9788025703670');

      expect(fetchSpy).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Životy slavných a starých provensálských básníků, kteří žili v dobách hrabat z kraje Provença');
      expect(result?.authors).toEqual(['Jean de Nostredame', 'Josef Prokop', 'Vojtěch Domlátil']);
      expect(result?.publisher).toBe('Argo');
      expect(result?.publishedDate).toBe('2011');
      expect(result?.pageCount).toBe(218);
    });

    it('returns null when records do not contain matching ISBN', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(JSON.stringify(sampleApiResponse), { status: 200 });
      });

      // Query with a different ISBN that does not match the sample record's ISBN
      const result = await fetchFromKnihovnyCz('9788020719808');
      expect(result).toBeNull();
    });

    it('returns null when API returns resultCount 0 and no records key', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(JSON.stringify({ resultCount: 0, status: "OK" }), { status: 200 });
      });

      const result = await fetchFromKnihovnyCz('9788025703670');
      expect(result).toBeNull();
    });
  });
});
