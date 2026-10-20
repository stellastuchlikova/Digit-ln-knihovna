import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating?: number; // 0..5
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  onRatingChange,
  readonly = false,
  size = 'md',
  showNumber = false
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starIndex: number) => {
    if (readonly || !onRatingChange) return;
    // If clicking the same rating, toggle back to 0
    if (rating === starIndex) {
      onRatingChange(0);
    } else {
      onRatingChange(starIndex);
    }
  };

  return (
    <div className="inline-flex items-center space-x-1">
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = activeRating >= star;

          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => !readonly && setHoverRating(star)}
              onMouseLeave={() => !readonly && setHoverRating(null)}
              className={`${
                readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'
              } focus:outline-none p-0.5`}
              title={readonly ? `Hodnocení: ${rating}/5` : `Ohodnotit ${star} z 5 hvězdiček`}
            >
              <Star
                className={`${starSizes[size]} ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                    : 'fill-gray-100 text-gray-300'
                } transition-colors duration-150`}
              />
            </button>
          );
        })}
      </div>

      {showNumber && (
        <span className="text-xs font-bold text-gray-700 ml-1">
          {rating > 0 ? `${rating}/5` : 'Nehodnoceno'}
        </span>
      )}
    </div>
  );
};
