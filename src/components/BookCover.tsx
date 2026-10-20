import React, { useState } from 'react';
import { getGenreInfo } from '../constants/genres';
import { BookOpen, Sparkles } from 'lucide-react';

interface BookCoverProps {
  coverUrl?: string;
  title: string;
  authors?: string[];
  categories?: string[];
  className?: string;
  aspectRatio?: string; // e.g., 'aspect-[2/3]' or custom height
  size?: 'sm' | 'md' | 'lg';
}

export const BookCover: React.FC<BookCoverProps> = ({
  coverUrl,
  title,
  authors = [],
  categories = [],
  className = '',
  size = 'md'
}) => {
  const [imageError, setImageError] = useState(false);

  const mainCategory = categories[0] || '❓ Ostatní / Nezařazeno';
  const genreInfo = getGenreInfo(mainCategory);
  const primaryAuthor = authors[0] || 'Neznámý autor';

  const hasValidImage = Boolean(coverUrl && coverUrl.trim() !== '' && !imageError);

  if (hasValidImage) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-gray-100 shadow-sm transition group-hover:shadow-md ${className}`}>
        <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover rounded-xl"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Visual styled fallback cover
  return (
    <div
      className={`relative rounded-xl overflow-hidden shadow-sm flex flex-col justify-between p-3.5 select-none bg-gradient-to-br ${genreInfo.gradient} text-white transition group-hover:shadow-md ${className}`}
    >
      {/* Decorative background patterns */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-black/20 rounded-full blur-xl pointer-events-none" />

      {/* Top Bar: Genre Emoji & Decorative Icon */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-2">
        <span className="text-xl drop-shadow-sm">{genreInfo.emoji}</span>
        <div className="flex items-center space-x-1 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
          <BookOpen className="w-3 h-3 text-white/90" />
          <span className="text-[9px] font-bold tracking-wider uppercase text-white/90">Kniha</span>
        </div>
      </div>

      {/* Center: Title and Author */}
      <div className="relative z-10 my-auto py-2 text-center space-y-1.5">
        <h4 className={`font-black tracking-tight leading-snug drop-shadow-md text-white line-clamp-3 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm'}`}>
          {title || 'Bez názvu'}
        </h4>
        <div className="w-8 h-0.5 bg-amber-300/80 mx-auto rounded-full shadow-xs" />
        <p className={`font-semibold text-white/90 line-clamp-1 ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
          {primaryAuthor}
        </p>
      </div>

      {/* Bottom Bar: Spine design / Category tag */}
      <div className="relative z-10 pt-2 border-t border-white/20 flex items-center justify-between text-[10px] font-medium text-white/80">
        <span className="truncate max-w-[80%] font-semibold">{genreInfo.name}</span>
        <Sparkles className="w-3 h-3 text-amber-300 flex-shrink-0" />
      </div>
    </div>
  );
};
