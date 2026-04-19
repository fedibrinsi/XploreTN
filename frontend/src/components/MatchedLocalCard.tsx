import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import type { ScoredItem } from "../types/ai.types";

interface LocalData {
  fullName: string;
  bio?: string;
  interests?: string[];
  image?: string;
}

interface MatchedLocalCardProps {
  match: ScoredItem<LocalData>;
  localId?: number;
}

/**
 * MatchedLocalCard Component
 * ──────────────────────────
 * Displays a matched local guide with:
 * - Profile image and name
 * - Compatibility score
 * - Bio and interests
 * - Message button that navigates to messaging page
 *
 * Usage:
 *   <MatchedLocalCard match={matchedLocal} localId={123} />
 */

const MatchedLocalCard: FC<MatchedLocalCardProps> = ({ match, localId }) => {
  const navigate = useNavigate();
  const { fullName, bio, interests, image } = match.data;
  const compatibilityScore = (match.score * 100).toFixed(0);

  const handleMessageClick = () => {
    // Navigate to messaging page and open conversation with this local
    // Pass localId as state to auto-open the conversation
    navigate("/messaging", {
      state: { targetUserId: localId || match.id },
    });
  };

  return (
    <article
      className="group relative bg-surface-container-lowest rounded-[2.5rem] overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 p-6 flex flex-col"
      aria-label={`Local guide: ${fullName}`}
    >
      {/* Header with image */}
      <div className="flex flex-col items-center mb-6">
        {image ? (
          <img
            className="w-20 h-20 rounded-full object-cover mb-4 ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all"
            src={image}
            alt={fullName}
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-4 ring-primary/20">
            <span className="material-symbols-outlined text-primary text-5xl">
              person
            </span>
          </div>
        )}

        <h3 className="text-lg font-bold text-on-surface text-center">
          {fullName}
        </h3>
        <p className="text-sm font-bold text-primary mt-1">
          {compatibilityScore}% compatible
        </p>
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-sm text-on-surface-variant text-center mb-6 line-clamp-3">
          {bio}
        </p>
      )}

      {/* Interests */}
      {interests && interests.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
            Interests
          </p>
          <ul
            className="flex flex-wrap gap-2 justify-center"
            aria-label="interests"
          >
            {interests.slice(0, 4).map((tag) => (
              <li
                key={tag}
                className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Message Button */}
      <button
        onClick={handleMessageClick}
        className="w-full mt-auto px-6 py-3 rounded-full bg-primary text-white font-bold transition-all duration-200 hover:bg-primary-container active:scale-95 flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">mail</span>
        Message
      </button>
    </article>
  );
};

export default MatchedLocalCard;
