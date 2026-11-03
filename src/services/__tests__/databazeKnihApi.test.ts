import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mapCategoriesToPredefinedGenres,
  inferGenresFromText,
  getGenreInfo,
  DEFAULT_GENRE
} from '../../constants/genres';
import {
  extractGenresFromDatabazeKnihHtml,
  fetchGenresFromDatabazeKnih,
  autoClassifyBookGenres
} from '../databazeKnihApi';

describe('DatabazeKnih.cz Genre Mapping & Categorization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('mapCategoriesToPredefinedGenres', () => {
    it('maps official Databazeknih genres accurately', () => {
      expect(mapCategoriesToPredefinedGenres(['Romány'])).toEqual(['📖 Romány & Beletrie']);
      expect(mapCategoriesToPredefinedGenres(['Sci-fi'])).toEqual(['🚀 Sci-fi & Fantasy']);
      expect(mapCategoriesToPredefinedGenres(['Fantasy'])).toEqual(['🚀 Sci-fi & Fantasy']);
      expect(mapCategoriesToPredefinedGenres(['Detektivky, krimi'])).toEqual(['🔍 Detektivky & Thrillery']);
      expect(mapCategoriesToPredefinedGenres(['Horory'])).toEqual(['👻 Horory & Temné příběhy']);
      expect(mapCategoriesToPredefinedGenres(['Pro ženy', 'Dívčí romány'])).toEqual(['💖 Pro ženy & Romantika']);
      expect(mapCategoriesToPredefinedGenres(['Pro děti a mládež'])).toEqual(['🧸 Pro děti & Mládež']);
      expect(mapCategoriesToPredefinedGenres(['Komiksy'])).toEqual(['💥 Komiksy & Manga']);
      expect(mapCategoriesToPredefinedGenres(['Historie', 'Biografie a memoáry'])).toEqual(['📜 Historie & Biografie']);
      expect(mapCategoriesToPredefinedGenres(['Literatura naučná', 'Věda'])).toEqual(['💡 Naučná & Odborná literatura']);
      expect(mapCategoriesToPredefinedGenres(['Kuchařky'])).toEqual(['🍳 Kuchařky & Gastronomie']);
      expect(mapCategoriesToPredefinedGenres(['Cestopisy a místopisy'])).toEqual(['🧭 Cestopisy & Průvodce']);
      expect(mapCategoriesToPredefinedGenres(['Poezie', 'Divadelní hry'])).toEqual(['🎭 Poezie & Divadelní hry']);
      expect(mapCategoriesToPredefinedGenres(['Filozofie', 'Duchovní literatura'])).toEqual(['✨ Filozofie & Duchovno']);
      expect(mapCategoriesToPredefinedGenres(['Příroda, zvířata'])).toEqual(['🌿 Příroda & Zvířata']);
    });

    it('returns DEFAULT_GENRE for empty or unknown inputs', () => {
      expect(mapCategoriesToPredefinedGenres([])).toEqual([DEFAULT_GENRE]);
      expect(mapCategoriesToPredefinedGenres(['xyz123random'])).toEqual([DEFAULT_GENRE]);
    });

    it('maps english international categories (Google/OpenLibrary)', () => {
      expect(mapCategoriesToPredefinedGenres(['Science Fiction / Cyberpunk'])).toEqual(['🚀 Sci-fi & Fantasy']);
      expect(mapCategoriesToPredefinedGenres(['Juvenile Fiction / Fantasy'])).toEqual([
        '🧸 Pro děti & Mládež',
        '🚀 Sci-fi & Fantasy'
      ]);
    });
  });

  describe('inferGenresFromText', () => {
    it('infers genre from book title and description keywords', () => {
      const scifi = inferGenresFromText({
        title: 'Válka s mloky',
        description: 'Vědeckofantastický román o inteligentních mlocích'
      });
      expect(scifi).toContain('🚀 Sci-fi & Fantasy');

      const detektivka = inferGenresFromText({
        title: 'Vražda v Orient expresu',
        authors: ['Agatha Christie'],
        description: 'Slavný vyšetřovatel řeší záhadný zločin ve vlaku'
      });
      expect(detektivka).toContain('🔍 Detektivky & Thrillery');

      const kucharka = inferGenresFromText({
        title: 'Babiččina kuchařka',
        description: 'Tradiční recepty pro pečení a vaření'
      });
      expect(kucharka).toContain('🍳 Kuchařky & Gastronomie');

      const basne = inferGenresFromText({
        title: 'Kytice z pověstí národních',
        authors: ['Karel Jaromír Erben'],
        description: 'Klasická sbírka básní a balad'
      });
      expect(basne).toContain('🎭 Poezie & Divadelní hry');
    });

    it('returns DEFAULT_GENRE when text contains no distinctive genre clues', () => {
      expect(inferGenresFromText({ title: 'Neznámý zápisník', description: 'Bez popisu' })).toEqual([DEFAULT_GENRE]);
    });
  });

  describe('extractGenresFromDatabazeKnihHtml', () => {
    it('extracts genre names from Databazeknih.cz HTML snippets', () => {
      const htmlSnippet = `
        <div class="lora lineHeightMid">
          <a href='/zanry/literatura-svetova-1'>Literatura světová</a><span class='pozn'>,</span>
          <a href='/zanry/romany-12'>Romány</a>
          <a href="https://www.databazeknih.cz/zanry/sci-fi-19">Sci-fi</a>
        </div>
      `;

      const extracted = extractGenresFromDatabazeKnihHtml(htmlSnippet);
      expect(extracted).toEqual(['Literatura světová', 'Romány', 'Sci-fi']);
    });

    it('ignores empty HTML or pages without genre links', () => {
      expect(extractGenresFromDatabazeKnihHtml('')).toEqual([]);
      expect(extractGenresFromDatabazeKnihHtml('<div>Žádné žánry</div>')).toEqual([]);
    });
  });

  describe('fetchGenresFromDatabazeKnih', () => {
    it('fetches and parses genres via proxy response', async () => {
      const mockHtml = `
        <div>
          <a href='/zanry/detektivky-krimi-2'>Detektivky, krimi</a>
          <a href='/zanry/thrillery-16'>Thrillery</a>
        </div>
      `;

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(mockHtml, { status: 200 })
      );

      const genres = await fetchGenresFromDatabazeKnih('9788020718907');
      expect(genres).toEqual(['🔍 Detektivky & Thrillery']);
    });

    it('returns null if fetch fails or no genres matched', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      const genres = await fetchGenresFromDatabazeKnih('9780000000000');
      expect(genres).toBeNull();
    });
  });

  describe('autoClassifyBookGenres', () => {
    it('auto-classifies book using existing categories if valid', async () => {
      const classified = await autoClassifyBookGenres({
        title: 'Duna',
        categories: ['Sci-fi', 'Fantasy']
      });
      expect(classified).toEqual(['🚀 Sci-fi & Fantasy']);
    });

    it('auto-classifies book using text heuristics when online lookup yields nothing', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Proxy down'));

      const classified = await autoClassifyBookGenres({
        title: 'Povídky z jedné a druhé kapsy',
        authors: ['Karel Čapek'],
        description: 'Povídky s kriminální a detektivní zápletkou',
        categories: [DEFAULT_GENRE]
      });

      expect(classified).toContain('🔍 Detektivky & Thrillery');
      expect(classified).toContain('📖 Romány & Beletrie');
    });
  });

  describe('getGenreInfo', () => {
    it('returns genre option matching label or name', () => {
      const info = getGenreInfo('🚀 Sci-fi & Fantasy');
      expect(info.id).toBe('scifi-fantasy');
      expect(info.name).toBe('Sci-fi & Fantasy');
    });

    it('falls back to default genre option when not matched', () => {
      const fallback = getGenreInfo('nonexistent');
      expect(fallback.id).toBe('ostatni');
    });
  });
});
