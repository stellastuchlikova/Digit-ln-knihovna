import React, { useState } from 'react';
import type { Book } from '../types/book';
import { BookOpen, Edit2, Trash2, CheckCircle2, XCircle, Calendar, User, Tag, Hash, Building2 } from 'lucide-react';

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
  onUpdate: (updatedBook: Book) => void;
  onDelete: (id: string) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({ book, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBook, setEditedBook] = useState<Book>({ ...book });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // For quick borrow state change
  const [borrowerName, setBorrowerName] = useState(book.borrowedTo || '');

  const handleToggleAvailability = () => {
    if (book.isAvailable) {
      // Switching to borrowed
      if (!borrowerName.trim()) {
        alert('Zadejte prosím jméno osoby, které knihu půjčujete.');
        return;
      }
      const updated = {
        ...book,
        isAvailable: false,
        borrowedTo: borrowerName.trim(),
        borrowedAt: new Date().toISOString()
      };
      onUpdate(updated);
    } else {
      // Switching to available
      const updated = {
        ...book,
        isAvailable: true,
        borrowedTo: '',
        borrowedAt: undefined
      };
      onUpdate(updated);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(editedBook);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden my-8">

        {/* Header */}
        <div className="bg-[#800020] text-white p-5 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-pink-200" />
            <h3 className="text-xl font-bold">Detail knihy</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-[#660019] p-1.5 rounded-lg transition duration-150 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {showDeleteConfirm ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-4">
              <h4 className="text-lg font-bold text-red-900">Opravdu si přejete tuto knihu smazat?</h4>
              <p className="text-sm text-red-700">
                Kniha <strong>"{book.title}"</strong> bude trvale odstraněna z vaší databáze.
              </p>
              <div className="flex justify-center space-x-3 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  onClick={() => onDelete(book.id)}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow cursor-pointer"
                >
                  Smazat knihu
                </button>
              </div>
            </div>
          ) : isEditing ? (
            /* Editing Form */
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <h4 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Úprava údajů knihy</h4>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Název knihy</label>
                <input
                  type="text"
                  required
                  value={editedBook.title}
                  onChange={(e) => setEditedBook({ ...editedBook, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Autoři (oddělení čárkou)</label>
                  <input
                    type="text"
                    value={editedBook.authors.join(', ')}
                    onChange={(e) => setEditedBook({ ...editedBook, authors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Žánry / Kategorie (čárkou)</label>
                  <input
                    type="text"
                    value={editedBook.categories.join(', ')}
                    onChange={(e) => setEditedBook({ ...editedBook, categories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">ISBN</label>
                  <input
                    type="text"
                    value={editedBook.isbn}
                    onChange={(e) => setEditedBook({ ...editedBook, isbn: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Rok / Datum</label>
                  <input
                    type="text"
                    value={editedBook.publishedDate || ''}
                    onChange={(e) => setEditedBook({ ...editedBook, publishedDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nakladatelství</label>
                  <input
                    type="text"
                    value={editedBook.publisher || ''}
                    onChange={(e) => setEditedBook({ ...editedBook, publisher: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">URL Obálky</label>
                <input
                  type="text"
                  value={editedBook.coverUrl || ''}
                  onChange={(e) => setEditedBook({ ...editedBook, coverUrl: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Popis / Anotace</label>
                <textarea
                  rows={3}
                  value={editedBook.description || ''}
                  onChange={(e) => setEditedBook({ ...editedBook, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#800020] hover:bg-[#660019] text-white text-sm font-bold rounded-lg shadow cursor-pointer"
                >
                  Uložit změny
                </button>
              </div>
            </form>
          ) : (
            /* Read Mode */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Book Cover */}
                <div className="flex flex-col items-center">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="max-h-64 object-contain rounded-lg shadow-md border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-36 h-52 bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400">
                      <BookOpen className="w-12 h-12 mb-2 text-gray-300" />
                      <span className="text-xs">Bez obálky</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="mt-4 w-full">
                    {book.isAvailable ? (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-lg flex items-center justify-center space-x-2 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Dostupná v knihovně</span>
                      </div>
                    ) : (
                      <div className="bg-rose-50 border border-rose-200 text-rose-900 p-2.5 rounded-lg flex items-center justify-center space-x-2 text-sm font-medium">
                        <XCircle className="w-4 h-4 text-[#800020]" />
                        <span>Vypůjčená</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{book.title}</h2>
                    <p className="text-base font-semibold text-[#800020] mt-0.5 flex items-center space-x-1">
                      <User className="w-4 h-4 inline mr-1 text-gray-500" />
                      <span>{book.authors.join(', ') || 'Neznámý autor'}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {book.categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                      >
                        <Tag className="w-3 h-3 mr-1 text-[#800020]" />
                        {cat}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-gray-600 border-t border-b border-gray-100 py-3">
                    {book.isbn && (
                      <div className="flex items-center space-x-1">
                        <Hash className="w-3.5 h-3.5 text-gray-400" />
                        <span><strong>ISBN:</strong> {book.isbn}</span>
                      </div>
                    )}
                    {book.publishedDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span><strong>Rok:</strong> {book.publishedDate}</span>
                      </div>
                    )}
                    {book.publisher && (
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span><strong>Nakladatel:</strong> {book.publisher}</span>
                      </div>
                    )}
                    {book.pageCount && (
                      <div>
                        <span><strong>Stránky:</strong> {book.pageCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Borrow Management Card */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                    <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Správa vypůjčení</h5>

                    {book.isAvailable ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={borrowerName}
                          onChange={(e) => setBorrowerName(e.target.value)}
                          placeholder="Jméno vypůjčitele..."
                          className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white text-gray-900"
                        />
                        <button
                          onClick={handleToggleAvailability}
                          className="w-full py-1.5 px-3 bg-[#800020] hover:bg-[#660019] text-white text-xs font-bold rounded shadow transition cursor-pointer"
                        >
                          Označit jako Vypůjčenou
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-700">
                          Vypůjčeno pro: <strong className="text-gray-900">{book.borrowedTo || 'Nespecifikováno'}</strong>
                          {book.borrowedAt && (
                            <span className="block text-gray-500 text-[11px] mt-0.5">
                              Dne: {new Date(book.borrowedAt).toLocaleDateString('cs-CZ')}
                            </span>
                          )}
                        </p>
                        <button
                          onClick={handleToggleAvailability}
                          className="w-full py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded shadow transition cursor-pointer"
                        >
                          Vrátit knihu do knihovny (Označit jako Dostupnou)
                        </button>
                      </div>
                    )}
                  </div>

                  {book.description && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 uppercase mb-1">Popis / Anotace</h4>
                      <p className="text-xs text-gray-600 leading-relaxed max-h-40 overflow-y-auto bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        {book.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Smazat knihu</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Upravit údaje</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-white bg-black hover:bg-gray-800 rounded-lg cursor-pointer"
                  >
                    Zavřít
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
