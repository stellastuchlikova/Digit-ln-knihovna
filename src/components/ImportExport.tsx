import React, { useRef, useState } from 'react';
import type { Book } from '../types/book';
import { exportBooksToJson, importBooksFromJson } from '../services/storage';
import { Download, Upload, Database, FileCheck, AlertCircle, FileText, Cloud, RefreshCw, LogOut, LockKeyhole } from 'lucide-react';

interface ImportExportProps {
  books: Book[];
  onBooksImported: (books: Book[]) => void;
  cloudEnabled: boolean;
  cloudEmail: string | null;
  cloudStatus: string;
  onCloudAuth: (email: string, password: string, mode: 'login' | 'register') => Promise<string>;
  onCloudLogout: () => Promise<void>;
  onCloudSyncNow: () => Promise<void>;
}

export const ImportExport: React.FC<ImportExportProps> = ({
  books, onBooksImported, cloudEnabled, cloudEmail, cloudStatus,
  onCloudAuth, onCloudLogout, onCloudSyncNow
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const handleExport = () => {
    if (books.length === 0) {
      setStatusMessage({ type: 'error', message: 'Databáze je prázdná, není co exportovat.' });
      return;
    }
    exportBooksToJson(books);
    setStatusMessage({ type: 'success', message: 'Záloha knih byla stažena jako JSON soubor.' });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importedBooks = await importBooksFromJson(file);
      onBooksImported(importedBooks);
      setStatusMessage({ type: 'success', message: `Import proběhl. V knihovně je nyní ${importedBooks.length} knih.` });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Nepodařilo se načíst soubor.'
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthBusy(true);
    setStatusMessage(null);
    try {
      const message = await onCloudAuth(email, password, authMode);
      setStatusMessage({ type: 'success', message });
      setPassword('');
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Přihlášení se nezdařilo.'
      });
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSync = async () => {
    setAuthBusy(true);
    try {
      await onCloudSyncNow();
      setStatusMessage({ type: 'success', message: 'Knihovna je aktuální na všech přihlášených zařízeních.' });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Synchronizace se nezdařila.'
      });
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-5">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Záloha a přenos knihovny</h2>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Přenes knihy mezi zařízeními přes bezpečnou synchronizaci, nebo si stáhni samostatnou zálohu.
        </p>
      </div>

      {statusMessage && (
        <div role="status" className={`p-4 rounded-xl border flex items-center space-x-3 shadow-sm ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-[#800020]'
        }`}>
          {statusMessage.type === 'success'
            ? <FileCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            : <AlertCircle className="w-5 h-5 text-[#800020] flex-shrink-0" />}
          <span className="text-sm font-medium">{statusMessage.message}</span>
        </div>
      )}

      <section className="bg-white border border-rose-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-[#800020] flex items-center justify-center shrink-0"><Cloud className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-gray-900">Synchronizace mezi zařízeními</h3>
            <p className="text-sm text-gray-600 mt-1">Přihlas se stejným účtem na telefonu i počítači. Změny se průběžně ukládají a kontrolují přibližně každých 20 sekund.</p>
          </div>
        </div>

        {!cloudEnabled ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 flex items-start gap-3">
            <LockKeyhole className="w-5 h-5 mt-0.5 shrink-0" />
            <p>Cloudová databáze ještě není nakonfigurovaná. Je potřeba vytvořit Supabase projekt a nastavit v GitHub Actions hodnoty <strong>VITE_SUPABASE_URL</strong> a <strong>VITE_SUPABASE_ANON_KEY</strong>. Přesný postup je v README repozitáře.</p>
          </div>
        ) : cloudEmail ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-emerald-900 break-all">{cloudEmail}</p>
              <p className="text-xs text-emerald-800 mt-1">{cloudStatus}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => void handleSync()} disabled={authBusy} className="min-h-11 px-4 rounded-xl bg-[#800020] text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60">
                <RefreshCw className={`w-4 h-4 ${authBusy ? 'animate-spin' : ''}`} /> Synchronizovat
              </button>
              <button type="button" onClick={() => void onCloudLogout()} className="min-h-11 px-4 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold inline-flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Odhlásit
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm font-medium text-gray-700">
              E-mail
              <input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full min-h-11 rounded-xl border border-gray-300 px-3 text-base" placeholder="vas@email.cz" />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Heslo
              <input type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full min-h-11 rounded-xl border border-gray-300 px-3 text-base" placeholder="Alespoň 8 znaků" />
            </label>
            <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 sm:items-center">
              <button type="submit" disabled={authBusy} className="min-h-11 px-5 rounded-xl bg-[#800020] text-white font-semibold disabled:opacity-60">
                {authBusy ? 'Chvilku…' : authMode === 'login' ? 'Přihlásit a synchronizovat' : 'Vytvořit účet'}
              </button>
              <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="min-h-11 px-3 text-sm font-semibold text-[#800020] underline underline-offset-2">
                {authMode === 'login' ? 'Ještě nemám účet' : 'Už mám účet'}
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#800020] flex items-center justify-center"><Download className="w-6 h-6" /></div>
            <h3 className="text-lg font-bold text-gray-900">Stáhnout zálohu</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Ulož všechny knihy včetně poznámek, výpůjček a hodnocení do souboru JSON.</p>
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100 flex items-center justify-between">
              <span>Knih v knihovně:</span><strong className="text-gray-900">{books.length}</strong>
            </div>
          </div>
          <button onClick={handleExport} disabled={books.length === 0} className="min-h-11 w-full px-4 bg-[#800020] hover:bg-[#660019] disabled:opacity-50 text-white font-semibold rounded-xl shadow transition">
            <Download className="w-4 h-4 inline mr-2" /> Stáhnout JSON zálohu
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center"><Upload className="w-6 h-6" /></div>
            <h3 className="text-lg font-bold text-gray-900">Obnovit ze zálohy</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Nahraj JSON soubor. Jeho knihy se sloučí s těmi, které už v knihovně máš.</p>
            <input type="file" ref={fileInputRef} accept=".json,application/json" onChange={handleFileChange} className="hidden" />
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="min-h-11 w-full px-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl shadow transition">
            <FileText className="w-4 h-4 inline mr-2" /> Vybrat soubor JSON
          </button>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 flex items-start gap-3">
        <Database className="w-5 h-5 text-[#800020] shrink-0" />
        <span>Bez přihlášení zůstávají data uložená jen v tomto prohlížeči. JSON záloha funguje nezávisle na synchronizaci.</span>
      </div>
    </div>
  );
};
