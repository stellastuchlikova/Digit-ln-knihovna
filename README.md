# Digitální knihovna

Aplikace pro skenování ISBN, vyhledávání a správu katalogu knih. Bez přihlášení pracuje lokálně v prohlížeči; volitelná synchronizace přenáší knihy mezi zařízeními přes Supabase.

## Zapnutí synchronizace mezi zařízeními

1. V Supabase vytvoř projekt.
2. V SQL Editoru spusť obsah souboru `supabase/schema.sql`.
3. V Supabase Authentication povol e-mailové účty. Potvrzení e-mailu může zůstat zapnuté; po registraci nejdřív potvrď e-mail.
4. V Supabase Project Settings → API zkopíruj Project URL a veřejný `anon` / publishable klíč.
5. V GitHub repozitáři otevři Settings → Secrets and variables → Actions a přidej:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = veřejný `anon` / publishable klíč
6. V Actions spusť workflow „Deploy to GitHub Pages“ přes Run workflow (nebo odešli commit do `main`).
7. Otevři aplikaci na každém zařízení, vytvoř jeden účet a přihlas se stejným e-mailem a heslem.

Veřejný anon/publishable klíč je určený pro klientskou aplikaci a oprávnění uživatele omezují RLS pravidla. Nikdy nevkládej service_role ani secret key do aplikace. Každý účet vidí jen svůj vlastní katalog.

## Vývoj

```sh
npm ci
npm run dev
```
