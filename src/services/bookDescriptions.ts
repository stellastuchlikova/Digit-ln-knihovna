/**
 * Book description and plot enrichment service.
 * Provides curated plot summaries (from Databazeknih.cz and verified Czech literary sources)
 * and online fallback lookups for books loaded by ISBN or title/author.
 */

// Normalized ISBN lookup helper
function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[^0-9Xx]/g, '').trim();
}

/**
 * Curated catalog of Czech book plot descriptions from Databazeknih.cz.
 * Indexed by ISBN-13, ISBN-10, and normalized title.
 */
export const KNOWN_BOOK_DESCRIPTIONS: Record<string, string> = {
  // 1. Gladys Aylward - Janet & Geoff Benge
  '9781576580196':
    'Životopisný román líčí neobyčejný osud Gladys Aylwardové, britské služebné, která navzdory chudobě a překážkám odcestovala na vlastní pěst Transsibiřskou magistrálou do Číny. Tam si získala důvěru místních obyvatel, působila jako inspektorka pro zákaz vázání dívčích nohou a v době japonské invaze hrdinsky převedla stovku sirotků přes hory do bezpečí.',
  '1576580199':
    'Životopisný román líčí neobyčejný osud Gladys Aylwardové, britské služebné, která navzdory chudobě a překážkám odcestovala na vlastní pěst Transsibiřskou magistrálou do Číny. Tam si získala důvěru místních obyvatel, působila jako inspektorka pro zákaz vázání dívčích nohou a v době japonské invaze hrdinsky převedla stovku sirotků přes hory do bezpečí.',

  // 2. Děti a rozvod - Edward Teyber
  '9788072551637':
    'Praktická a citlivá příručka zkušeného rodinného psychologa pomáhá rodičům pochopit vnitřní prožívání dětí během rozpadu manželství. Nabízí konkrétní rady a modelové rozhovory, jak s dětmi komunikovat, minimalizovat psychické trauma a poskytnout jim pocit jistoty v novém rodinném uspořádání.',
  '8072551637':
    'Praktická a citlivá příručka zkušeného rodinného psychologa pomáhá rodičům pochopit vnitřní prožívání dětí během rozpadu manželství. Nabízí konkrétní rady a modelové rozhovory, jak s dětmi komunikovat, minimalizovat psychické trauma a poskytnout jim pocit jistoty v novém rodinném uspořádání.',

  // 3. Chci mluvit jako rodilý Američan - Amy Gillett
  '9788073350406':
    'Praktická cvičebnice a výukový průvodce seznamuje studenty angličtiny s více než 300 nejčastějšími americkými idiomy, obraty a slangovými výrazy. Pomocí 25 tematických lekcí s autentickými dialogy a cvičeními učí, jak přirozeně porozumět hovorové americké angličtině a suverénně v ní komunikovat.',
  '8073350406':
    'Praktická cvičebnice a výukový průvodce seznamuje studenty angličtiny s více než 300 nejčastějšími americkými idiomy, obraty a slangovými výrazy. Pomocí 25 tematických lekcí s autentickými dialogy a cvičeními učí, jak přirozeně porozumět hovorové americké angličtině a suverénně v ní komunikovat.',

  // 4. Candide - Voltaire
  '9788073881641':
    'Klasický satirický román francouzského osvícenství vypráví o naivním mladíkovi Candidovi, který byl vychován ve víře, že náš svět je nejlepší ze všech možných. Po vyhnání z rodného zámku prochází sérií válek, pohrom a krutostí po celém světě, až dospívá k poznání, že smyslem života není prázdné teoretizování, ale poctivá práce a péče o vlastní zahradu.',
  '8073881649':
    'Klasický satirický román francouzského osvícenství vypráví o naivním mladíkovi Candidovi, který byl vychován ve víře, že náš svět je nejlepší ze všech možných. Po vyhnání z rodného zámku prochází sérií válek, pohrom a krutostí po celém světě, až dospívá k poznání, že smyslem života není prázdné teoretizování, ale poctivá práce a péče o vlastní zahradu.',

  // 5. Ženy, přemožte stres - Kevin Leman
  '9788072552764':
    'Populární rodinný psycholog Kevin Leman s humorem a hlubokým porozuměním radí ženám, jak čelit chronickému stresu, vyčerpání a syndromu dokonalosti. Ukazuje, jak stanovit zdravé osobní hranice v rodině i kariéře, odmítnout nerealistická očekávání okolí a najít vnitřní klid a radost.',
  '8072552765':
    'Populární rodinný psycholog Kevin Leman s humorem a hlubokým porozuměním radí ženám, jak čelit chronickému stresu, vyčerpání a syndromu dokonalosti. Ukazuje, jak stanovit zdravé osobní hranice v rodině i kariéře, odmítnout nerealistická očekávání okolí a najít vnitřní klid a radost.',

  // 6. 2000 nejpoužívanějších francouzských slov - Jan Seidl
  '9788025117286':
    'Přehledný jazykový průvodce obsahuje 2000 statisticky nejfrekventovanějších francouzských slov, která tvoří 80 % běžného jazykového projevu. Každé heslo doplňuje český překlad, příkladová věta z reálné komunikace a informace o správném použití a gramatických vazbách.',
  '8025117284':
    'Přehledný jazykový průvodce obsahuje 2000 statisticky nejfrekventovanějších francouzských slov, která tvoří 80 % běžného jazykového projevu. Každé heslo doplňuje český překlad, příkladová věta z reálné komunikace a informace o správném použití a gramatických vazbách.',
  '8025105849':
    'Přehledný jazykový průvodce obsahuje 2000 statisticky nejfrekventovanějších francouzských slov, která tvoří 80 % běžného jazykového projevu. Každé heslo doplňuje český překlad, příkladová věta z reálné komunikace a informace o správném použití a gramatických vazbách.',
  '9788025105849':
    'Přehledný jazykový průvodce obsahuje 2000 statisticky nejfrekventovanějších francouzských slov, která tvoří 80 % běžného jazykového projevu. Každé heslo doplňuje český překlad, příkladová věta z reálné komunikace a informace o správném použití a gramatických vazbách.',

  // 7. Copywriting - Anna Sálová a kol.
  '9788025145890':
    'Komplexní kniha od předních českých copywriterů přehledně vysvětluje tvorbu textů, které prodávají a zaujmou. Provádí čtenáře celým procesem psaní pro weby, sociální sítě, newslettery i e-shopy, vysvětluje psychologii zákazníka, práci se strukturou textu a obsahovou strategii.',
  '802514589X':
    'Komplexní kniha od předních českých copywriterů přehledně vysvětluje tvorbu textů, které prodávají a zaujmou. Provádí čtenáře celým procesem psaní pro weby, sociální sítě, newslettery i e-shopy, vysvětluje psychologii zákazníka, práci se strukturou textu a obsahovou strategii.',

  // 8. To není moje chyba - Henry Cloud, John Townsend
  '9788072551835':
    'Uznávaní psychologové se zaměřují na fenomén svalování viny a výmluv, který brání osobní zralosti a zdravým vztahům. Poskytují čtenářům návod, jak převzít plnou odpovědnost za své jednání a emoce, poučit se ze životních chyb a získat kontrolu nad vlastním osudem.',
  '8072551831':
    'Uznávaní psychologové se zaměřují na fenomén svalování viny a výmluv, který brání osobní zralosti a zdravým vztahům. Poskytují čtenářům návod, jak převzít plnou odpovědnost za své jednání a emoce, poučit se ze životních chyb a získat kontrolu nad vlastním osudem.',

  // 9. Pět jazyků lásky pro svobodné a osamělé - Gary Chapman
  '9788072552597':
    'Autor bestselleru Pět jazyků lásky aplikuje svůj známý koncept na svět svobodných, nezadaných, rozvedených či ovdovělých. Ukazuje, jak porozumění pěti základním způsobům vyjadřování náklonnosti umožňuje budovat hluboké a naplňující vztahy nejen v partnerství, ale i v přátelství, rodině a na pracovišti.',
  '8072552595':
    'Autor bestselleru Pět jazyků lásky aplikuje svůj známý koncept na svět svobodných, nezadaných, rozvedených či ovdovělých. Ukazuje, jak porozumění pěti základním způsobům vyjadřování náklonnosti umožňuje budovat hluboké a naplňující vztahy nejen v partnerství, ale i v přátelství, rodině a na pracovišti.'
};

/**
 * Fallback mapping by normalized book title
 */
const TITLE_TO_DESCRIPTION_MAP: [RegExp, string][] = [
  [/gladys\s+aylward/i, KNOWN_BOOK_DESCRIPTIONS['9781576580196']],
  [/d[eě]ti\s+a\s+rozvod/i, KNOWN_BOOK_DESCRIPTIONS['9788072551637']],
  [/chci\s+mluvit\s+jako\s+rodil[yý]\s+ameri[cč]an/i, KNOWN_BOOK_DESCRIPTIONS['9788073350406']],
  [/candide/i, KNOWN_BOOK_DESCRIPTIONS['9788073881641']],
  [/[zž]eny,?\s+p[rř]emo[zž]te\s+stres/i, KNOWN_BOOK_DESCRIPTIONS['9788072552764']],
  [/2000\s+nejpou[zž][ií]van[eě]j[sš][ií]ch\s+francouzsk[yý]ch\s+slov/i, KNOWN_BOOK_DESCRIPTIONS['9788025117286']],
  [/copywriting/i, KNOWN_BOOK_DESCRIPTIONS['9788025145890']],
  [/to\s+nen[ií]\s+moje\s+chyba/i, KNOWN_BOOK_DESCRIPTIONS['9788072551835']],
  [/p[eě]t\s+jazyk[uů]\s+l[aá]sky\s+pro\s+svobodn[eé]/i, KNOWN_BOOK_DESCRIPTIONS['9788072552597']]
];

/**
 * Attempts to find a book description from Wikipedia (Czech) by book title.
 */
export async function fetchWikipediaSummary(title: string): Promise<string | null> {
  const cleanTitle = title.trim();
  if (!cleanTitle) return null;

  try {
    const searchUrl = `https://cs.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
      cleanTitle
    )}&limit=1&namespace=0&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    if (searchData[1] && searchData[1].length > 0) {
      const pageTitle = searchData[1][0];
      const pageRes = await fetch(
        `https://cs.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`
      );
      if (pageRes.ok) {
        const pageData = await pageRes.json();
        if (pageData.extract && typeof pageData.extract === 'string') {
          return pageData.extract.trim();
        }
      }
    }
  } catch {
    // Network or parse error
  }
  return null;
}

/**
 * Retrieves the best available description/plot for a book.
 * Checks:
 * 1. ISBN in curated Databazeknih.cz catalog
 * 2. Title matching in curated Databazeknih.cz catalog
 * 3. Wikipedia Czech summary
 */
export async function findBookDescription(options: {
  isbn?: string;
  title?: string;
  existingDescription?: string;
}): Promise<string> {
  // If an existing valid description is already provided, keep it
  if (options.existingDescription && options.existingDescription.trim().length > 0) {
    return options.existingDescription.trim();
  }

  // 1. Check curated catalog by ISBN
  if (options.isbn) {
    const clean = normalizeIsbn(options.isbn);
    if (clean && KNOWN_BOOK_DESCRIPTIONS[clean]) {
      return KNOWN_BOOK_DESCRIPTIONS[clean];
    }
  }

  // 2. Check curated catalog by Title matching
  if (options.title) {
    for (const [pattern, desc] of TITLE_TO_DESCRIPTION_MAP) {
      if (pattern.test(options.title)) {
        return desc;
      }
    }
  }

  // 3. Fallback: try Wikipedia Czech summary for famous books
  if (options.title) {
    const wikiSummary = await fetchWikipediaSummary(options.title);
    if (wikiSummary) {
      return wikiSummary;
    }
  }

  return '';
}
