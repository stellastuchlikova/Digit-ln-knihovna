import React, { useRef, useState } from 'react';
import type { Book } from '../types/book';
import { exportBooksToJson, importBooksFromJson } from '../services/storage';
import { Download, Upload, Database, FileCheck, AlertCircle, FileText } from 'lucide-react';

interface ImportExportProps {
  books: Book[];
  onBooksImported: (books: Book[]) => void;
}

export const ImportExport: React.FC<ImportExportProps> = ({ books, onBooksImported }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleExport = () => {
    if (books.length === 0) {
      setStatusMessage({ type: 'error', message: 'Databáze je prázdná, není co exportovat.' });
      return;
    }
    exportBooksToJson(books);
    setStatusMessage({ type: 'success', message: 'Databáze byla úspěšně stáhnuta ve formátu JSON.' });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedBooks = await importBooksFromJson(file);
      onBooksImported(importedBooks);
      setStatusMessage({
        type: 'success',
        message: `Import proběhl úspěšně. Nyní máte v databázi celkem ${importedBooks.length} knih.`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        message: err.message || 'Nepodařilo se načíst soubor.'
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Záloha a přenos databáze</h2>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Zde můžete exportovat vaše knihy do JSON souboru pro zálohování nebo importovat dříve uploaddovanou databázi.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 shadow-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-[#800020]'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <FileCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#800020] flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{statusMessage.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-wine-50 text-[#800020] flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Exportovat databázi</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Stáhněte kompletní seznam vašich knih včetně všech údajů, autorů, žánrů a stavů vypůjčení jako záložní `.json` soubor.
            </p>
            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-100 flex items-center justify-between">
              <span>Aktuální počet knih:</span>
              <strong className="text-gray-900 font-bold">{books.length}</strong>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={books.length === 0}
            className="w-full py-2.5 px-4 bg-[#800020] hover:bg-[#660019] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Stáhnout JSON databázi</span>
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Importovat databázi</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Nahrajte dříve uložený `.json` soubor s databází knih. Importované knihy se sloučí s vaší stávající databází.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 bg-black hover:bg-gray-800 text-white font-semibold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Vybrat JSON soubor</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 flex items-center space-x-3">
        <Database className="w-5 h-5 text-[#800020] flex-shrink-0" />
        <span>
          Aplikace ukládá vaše data přímo v prohlížeči. Pro prevenci ztráty dat doporučujeme pravidelný export.
        </span>
      </div>
    </div>
  );
};
