import React, { useState } from 'react';
import type { Book } from '../types/book';
import { PREDEFINED_GENRES, DEFAULT_GENRE } from '../constants/genres';
import { BookCover } from './BookCover';
import { StarRating } from './StarRating';
import { BookOpen, Edit2, Trash2, CheckCircle2, XCircle, Calendar, User, Tag, Hash, Building2, Plus, Layers, FileText, Check, X } from 'lucide-react';

interface BookDetailModalProps {
  book: Book;
  allBooks?: Book[];
  onClose: () => void;
  onSelectBook?: (book: Book) => void;
  onUpdate: (updatedBook: Book) => void;
  onDelete: (id: string) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  allBooks = [],
  onClose,
  onSelectBook,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBook, setEditedBook] = useState<Book>({ ...book });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Find other editions or copies of the same book
  const otherEditions = allBooks.filter(b => {
    if (b.id === book.id) return false;
    const sameTitle = b.title.trim().toLowerCase() === book.title.trim().toLowerCase();
    const sameAuthor = b.authors.some(a => book.authors.includes(a));
    return sameTitle || sameAuthor;
  });

  // For quick borrow state change
  const [borrowerName, setBorrowerName] = useState(book.borrowedTo || '');

  // Quick inline plot/description edit state
  const [isInlineEditingDesc, setIsInlineEditingDesc] = useState(false);
  const [inlineDescText, setInlineDescText] = useState(book.description || '');

  const handleSaveInlineDesc = () => {
    onUpdate({
      ...book,
      description: inlineDescText.trim()
    });
    setIsInlineEditingDesc(false);
  };

  const handleCancelInlineDesc = () => {
    setInlineDescText(book.description || '');
    setIsInlineEditingDesc(false);
  };

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

              {/* Edit Rating */}
              <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-lg">
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                  Hodnocení knihy
                </label>
                <StarRating
                  rating={editedBook.rating || 0}
                  onRatingChange={(r) => setEditedBook({ ...editedBook, rating: r })}
                  size="lg"
                  showNumber
                />
              </div>

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
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Žánry / Kategorie (Předdefinovaný výběr)
                </label>
                {(editedBook.categories.length > 0 ? editedBook.categories : [DEFAULT_GENRE]).map((cat, idx) => (
                  <div key={idx} className="flex items-center space-x-2 mb-2">
                    <select
                      value={cat}
                      onChange={(e) => {
                        const updated = [...editedBook.categories];
                        updated[idx] = e.target.value;
                        setEditedBook({ ...editedBook, categories: updated });
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                    >
                      {PREDEFINED_GENRES.map(genre => (
                        <option key={genre.id} value={genre.label}>
                          {genre.label}
                        </option>
                      ))}
                    </select>
                    {editedBook.categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editedBook.categories.filter((_, i) => i !== idx);
                          setEditedBook({ ...editedBook, categories: updated });
                        }}
                        className="text-red-500 hover:text-red-700 text-sm font-bold px-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setEditedBook({
                      ...editedBook,
                      categories: [...editedBook.categories, DEFAULT_GENRE]
                    });
                  }}
                  className="text-xs font-medium text-[#800020] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Přidat další žánr</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">ISBN</label>
                  <input
                    type="text"
                    value={editedBook.isbn}
                    onChange={(e) => setEditedBook({ ...editedBook, isbn: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Vydání</label>
                  <input
                    type="text"
                    value={editedBook.edition || ''}
                    placeholder="např. 1. vydání"
                    onChange={(e) => setEditedBook({ ...editedBook, edition: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Rok / Datum</label>
                  <input
                    type="text"
                    value={editedBook.publishedDate || ''}
                    onChange={(e) => setEditedBook({ ...editedBook, publishedDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nakladatelství</label>
                  <input
                    type="text"
                    value={editedBook.publisher || ''}
                    onChange={(e) => setEditedBook({ ...editedBook, publisher: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-900"
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
                  <BookCover
                    coverUrl={book.coverUrl}
                    title={book.title}
                    authors={book.authors}
                    categories={book.categories}
                    className="w-44 h-64 shadow-md"
                    size="lg"
                  />

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

                  {/* Rating in Read Mode with quick inline rating change */}
                  <div className="flex items-center space-x-3 p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Hodnocení:</span>
                    <StarRating
                      rating={book.rating || 0}
                      onRatingChange={(newRating) => onUpdate({ ...book, rating: newRating })}
                      size="md"
                      showNumber
                    />
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
                    {book.edition && (
                      <div className="flex items-center space-x-1">
                        <Layers className="w-3.5 h-3.5 text-[#800020]" />
                        <span><strong>Vydání:</strong> {book.edition}</span>
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

                  {/* Related Editions / Copies in database */}
                  {otherEditions.length > 0 && (
                    <div className="p-3 bg-rose-50/60 border border-rose-200/70 rounded-xl space-y-2">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-[#800020]">
                        <Layers className="w-4 h-4" />
                        <span>Další vydání / výtisky v knihovně ({otherEditions.length})</span>
                      </div>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {otherEditions.map(ed => (
                          <div
                            key={ed.id}
                            onClick={() => onSelectBook && onSelectBook(ed)}
                            className="p-2 bg-white hover:bg-rose-100/50 rounded-lg border border-rose-100 text-xs flex justify-between items-center cursor-pointer transition"
                          >
                            <div>
                              <span className="font-bold text-gray-900">{ed.title}</span>
                              <span className="text-gray-500 ml-2">
                                {ed.edition ? `[${ed.edition}] ` : ''}
                                ({ed.publishedDate || 'rok neudán'})
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-[#800020]">Zobrazit</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

                </div>
              </div>

              {/* Dedicated Plot / Book Description Section */}
              <div className="bg-rose-50/40 border border-[#800020]/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[#800020]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#800020]">
                      Stručný popis děje a anotace knihy
                    </h4>
                  </div>
                  {!isInlineEditingDesc && (
                    <button
                      type="button"
                      onClick={() => {
                        setInlineDescText(book.description || '');
                        setIsInlineEditingDesc(true);
                      }}
                      className="text-xs text-[#800020] hover:text-[#660019] hover:underline flex items-center space-x-1 font-semibold cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{book.description ? 'Upravit popis' : 'Přidat popis'}</span>
                    </button>
                  )}
                </div>

                {isInlineEditingDesc ? (
                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      value={inlineDescText}
                      onChange={(e) => setInlineDescText(e.target.value)}
                      placeholder="Sem zadejte stručný popis děje knihy..."
                      className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-[#800020] leading-relaxed"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={handleCancelInlineDesc}
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-xs font-medium flex items-center space-x-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Zrušit</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveInlineDesc}
                        className="px-3 py-1.5 bg-[#800020] hover:bg-[#660019] text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Uložit popis děje</span>
                      </button>
                    </div>
                  </div>
                ) : book.description ? (
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-rose-100/80 whitespace-pre-line shadow-2xs">
                    {book.description}
                  </p>
                ) : (
                  <div className="bg-white/60 border border-dashed border-rose-200 rounded-xl p-3.5 text-center">
                    <p className="text-xs text-gray-500 italic mb-2">
                      K této knize zatím nebyl přidán žádný popis děje.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setInlineDescText('');
                        setIsInlineEditingDesc(true);
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#800020] text-xs font-bold rounded-lg cursor-pointer inline-flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Přidat stručný popis děje</span>
                    </button>
                  </div>
                )}
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
