/**
 * components/DiscoveryPage.tsx
 * ────────────────────────────
 * Discovery page wiring all three AI hooks.
 * This is an annotated reference component — style it to match your design system.
 *
 * Data flow:
 *   1. <SearchBar>        → useSearch           → semanticSearch / personalisedSearch
 *   2. <RecommendedFeed>  → useRecommendations  → getRecommendations
 *   3. <LocalsSection>    → useMatchLocals       → matchLocals
 */

import { useState } from "react";
import type { FC, ReactNode } from "react";
import { useSearch, useRecommendations, useMatchLocals } from "../hooks/useAI";
import type { ScoredItem, EntityType } from "../types/ai.types";

// ── Prop types ────────────────────────────────────────────────────────────────

interface DiscoveryPageProps {
  /** True when a valid JWT exists in localStorage */
  isLoggedIn?: boolean;
  /** True when the authenticated user is a TOURISTE (shows social matching) */
  isTourist?: boolean;
}

// ── Activity data shape returned by the backend ───────────────────────────────
// Matches the Prisma Activity model fields returned in ScoredItem.data

interface ActivityData {
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  images?: string[];
  tags?: string[];
}

// ── Local user data shape ─────────────────────────────────────────────────────

interface LocalData {
  fullName: string;
  bio?: string;
  interests: string[];
  image?: string;
}

// ── Small presentational components ──────────────────────────────────────────

interface ActivityCardProps {
  item: ScoredItem<ActivityData>;
}

const ActivityCard: FC<ActivityCardProps> = ({ item }) => {
  const { title, description, price, category, location } = item.data;

  return (
    <article className="activity-card" aria-label={title}>
      <header>
        <span className="activity-card__match">
          {(item.score * 100).toFixed(0)}% match
        </span>
        <h3 className="activity-card__title">{title}</h3>
        <p className="activity-card__meta">
          <span>{category}</span>
          <span> · </span>
          <span>{location}</span>
          <span> · </span>
          <span>€{price}</span>
        </p>
      </header>
      <p className="activity-card__description">{description}</p>
    </article>
  );
};

interface LocalCardProps {
  match: ScoredItem<LocalData>;
}

const LocalCard: FC<LocalCardProps> = ({ match }) => {
  const { fullName, bio, interests, image } = match.data;

  return (
    <article className="local-card" aria-label={`Local guide: ${fullName}`}>
      {image && (
        <img
          className="local-card__avatar"
          src={image}
          alt={fullName}
          width={56}
          height={56}
        />
      )}
      <div className="local-card__body">
        <h4 className="local-card__name">{fullName}</h4>
        <p className="local-card__compatibility">
          {(match.score * 100).toFixed(0)}% compatibility
        </p>
        {bio && <p className="local-card__bio">{bio}</p>}
        <ul className="local-card__interests" aria-label="interests">
          {(interests ?? []).slice(0, 4).map((tag) => (
            <li key={tag} className="tag">
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
};

// ── Loading / empty / error states ───────────────────────────────────────────

const Spinner: FC = () => (
  <div className="spinner" role="status" aria-label="Loading">
    <span className="sr-only">Loading…</span>
  </div>
);

const ErrorMessage: FC<{ message: string }> = ({ message }) => (
  <p className="error-message" role="alert">
    {message}
  </p>
);

const EmptyState: FC<{ children: ReactNode }> = ({ children }) => (
  <p className="empty-state">{children}</p>
);

// ── Section wrapper ───────────────────────────────────────────────────────────

const Section: FC<{ title: string; children: ReactNode }> = ({
  title,
  children,
}) => (
  <section className="discovery-section">
    <h2 className="discovery-section__title">{title}</h2>
    {children}
  </section>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const DiscoveryPage: FC<DiscoveryPageProps> = ({
  isLoggedIn = false,
}) => {
  const [query, setQuery] = useState<string>("");
  const [entity, setEntity] = useState<EntityType>("activity");
  const [usePersonalised, setPersonal] = useState<boolean>(isLoggedIn);

  // ── Hook 1: live search ────────────────────────────────────────────────────
  // Debounced — fires 400 ms after the user stops typing.
  // Switches to personalised mode automatically when the user is logged in.
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
  } = useSearch(query, {
    entity,
    personalised: usePersonalised && isLoggedIn,
    top_k: 6,
    debounceMs: 400,
  });

  // ── Hook 2: profile recommendations ───────────────────────────────────────
  // Fetches once on mount; only rendered when search is idle.
  const {
    results: recommendations,
    loading: recLoading,
    error: recError,
  } = useRecommendations("activity", 6);

  // ── Hook 3: social matching ────────────────────────────────────────────────
  // Only fetched for tourists — prevents an unnecessary 403 for locals.
  const {
    matches,
    loading: matchLoading,
    error: matchError,
  } = useMatchLocals(3);

  // A query is "active" when it has at least 2 characters (mirrors the hook)
  const hasActiveQuery = query.trim().length >= 2;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="discovery-page">
      {/* ── Search ──────────────────────────────────────────────────────── */}
      <Section title="Discover Tunisia">
        <div className="search-bar" role="search">
          <input
            type="search"
            className="search-bar__input"
            placeholder="Try: outdoor adventure, traditional craft workshop…"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setQuery(e.target.value)
            }
            aria-label="Search activities and places"
          />

          <select
            className="search-bar__entity-select"
            value={entity}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setEntity(e.target.value as EntityType)
            }
            aria-label="Search category"
          >
            <option value="activity">Activities</option>
            <option value="place">Places</option>
          </select>

          {isLoggedIn && (
            <label className="search-bar__personalised-toggle">
              <input
                type="checkbox"
                checked={usePersonalised}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPersonal(e.target.checked)
                }
              />
              Personalise
            </label>
          )}
        </div>

        {/* Search results */}
        {searchLoading && <Spinner />}
        {searchError && <ErrorMessage message={searchError} />}
        {hasActiveQuery && !searchLoading && searchResults.length === 0 && (
          <EmptyState>
            No results found. Try a different search term.
          </EmptyState>
        )}
        {searchResults.length > 0 && (
          <div className="results-grid" role="list">
            {searchResults.map((item) => (
              <ActivityCard
                key={item.id}
                item={item as unknown as ScoredItem<ActivityData>}
              />
            ))}
          </div>
        )}
      </Section>

      {/* ── Recommendations (logged-in, search idle) ─────────────────────── */}
      {isLoggedIn && !hasActiveQuery && (
        <Section title="For You">
          {recLoading && <Spinner />}
          {recError && <ErrorMessage message={recError} />}
          {!recLoading && recommendations.length === 0 && (
            <EmptyState>
              Update your interests in your profile to get personalised
              recommendations.
            </EmptyState>
          )}
          <div className="results-grid" role="list">
            {recommendations.map((item) => (
              <ActivityCard
                key={item.id}
                item={item as unknown as ScoredItem<ActivityData>}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ── Social matching ──────────────────────────── */}
      {isLoggedIn && !hasActiveQuery && (
        <Section title="Meet a Local Guide">
          {matchLoading && <Spinner />}
          {matchError && <ErrorMessage message={matchError} />}
          {!matchLoading && matches.length === 0 && (
            <EmptyState>No local guides found. Check back soon!</EmptyState>
          )}
          <div className="locals-grid" role="list">
            {matches.map((match) => (
              <LocalCard
                key={match.id}
                match={match as unknown as ScoredItem<LocalData>}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
};

export default DiscoveryPage;
