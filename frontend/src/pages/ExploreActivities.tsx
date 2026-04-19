import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchActivities,
  CATEGORY_CONFIG,
  type Activity,
  type ActivityCategory,
  type ActivityFilters,
  type ActivitySortBy,
} from "../services/activityService";
import { useDebouncedPrice } from '../hooks/useDebouncedPrice';
import { PriceRangeSlider } from '../components/PriceRangeSlider';
import ActivityCard from "../components/ActivityCard";
import { useSearch } from "../hooks/useAI";
import type { EntityType } from "../types/ai.types";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExploreActivities() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<
    ActivityCategory | ""
  >((searchParams.get("category") as ActivityCategory) || "");
  const [maxPrice, setMaxPrice] = useState<number>(500);
  const { localPrice, setLocalPrice } = useDebouncedPrice(
    maxPrice,
    (price) => setMaxPrice(price),
    300, // Debounce delay in ms
  );
  const [sortBy, setSortBy] = useState<ActivitySortBy>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // AI Search state
  const [aiQuery, setAiQuery] = useState("");
  const [aiEntity] = useState<EntityType>("activity");
  const [usePersonalised, setUsePersonalised] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const totalPages = Math.ceil(total / pageSize);

  // AI Search
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
  } = useSearch(aiQuery, {
    entity: aiEntity,
    personalised: usePersonalised,
  });

  // ─── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (aiQuery.trim().length >= 2) return; // Don't load regular activities if searching

      setLoading(true);
      setError("");
      try {
        const filters: ActivityFilters = {
          status: "APPROVED",
          page: currentPage,
          pageSize,
          sortBy,
        };
        if (selectedCategory) filters.category = selectedCategory;
        if (maxPrice < 500) filters.maxPrice = maxPrice;

        const result = await fetchActivities(filters);
        const sorted = result.activities;

        // Client-side sort
        if (sortBy === "newest")
          sorted.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        if (sortBy === "price_desc") sorted.sort((a, b) => b.price - a.price);
        if (sortBy === "price_asc") sorted.sort((a, b) => a.price - b.price);

        setActivities(sorted);
        setTotal(result.total);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load activities",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedCategory, maxPrice, sortBy, currentPage, aiQuery]);

  // ─── Category select handler ────────────────────────────────────────────
  const handleCategorySelect = (cat: ActivityCategory | "") => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    if (cat) {
      setSearchParams({ category: cat });
    } else {
      setSearchParams({});
    }
  };

  const allCategories = Object.keys(CATEGORY_CONFIG) as ActivityCategory[];

  return (
    <div className="pt-28 pb-32 min-h-screen px-4 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Filter Sidebar */}
      <aside className="w-full md:w-80 shrink-0">
        <div
          className="sticky top-28 bg-surface-container-low rounded-4xl flex flex-col"
          style={{ maxHeight: "calc(100vh - 8rem)" }}
        >
          <div className="absolute inset-0 arabesque-pattern pointer-events-none rounded-4xl"></div>
          <div
            className="relative z-10 p-8 overflow-y-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "var(--color-primary) transparent",
            }}
          >
            <h2 className="font-headline text-2xl font-bold mb-8 text-primary">
              Refine Your Search
            </h2>
            <div className="space-y-8">
              {/* Categories */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                  Experience Category
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCategorySelect("")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      selectedCategory === ""
                        ? "bg-primary text-white"
                        : "bg-white text-on-surface hover:bg-secondary-container"
                    }`}
                  >
                    All Activities
                  </button>
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        selectedCategory === cat
                          ? "bg-primary text-white"
                          : "bg-white text-on-surface hover:bg-secondary-container"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {CATEGORY_CONFIG[cat].icon}
                      </span>
                      {CATEGORY_CONFIG[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <PriceRangeSlider
                value={localPrice}
                onLocalChange={setLocalPrice}
                min={20}
                max={500}
              />

              <button
                onClick={() => {
                  handleCategorySelect("");
                  setMaxPrice(500);
                  setLocalPrice(500);
                  setCurrentPage(1);
                }}
                className="w-full py-4 rounded-full bg-linear-to-br from-[#003873] to-[#1D4F91] text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mb-4"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <section className="flex-1">
        {/* AI Search Panel */}
        <div className="mb-8 bg-surface-container-lowest rounded-[2rem] border border-surface-variant/20 shadow-lg shadow-primary/5 p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Search for experiences
            </label>
            <input
              type="search"
              className="w-full px-6 py-4 rounded-2xl border border-surface-variant/40 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Try: outdoor adventure, traditional craft workshop, local café…"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
            />
          </div>

          {isLoggedIn && (
            <div className="space-y-2">
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-surface-variant/40 bg-surface-container-low cursor-pointer hover:border-primary/50 transition-all">
                <input
                  type="checkbox"
                  checked={usePersonalised}
                  onChange={(e) => setUsePersonalised(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-sm font-medium">
                  Use my profile (personalized results)
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 gap-4">
          <div>
            <h1 className="font-headline text-5xl font-black text-primary leading-tight">
              {aiQuery.trim().length >= 2
                ? "Search Results"
                : "Curated Experiences"}
            </h1>
            <p className="text-on-surface-variant mt-2 text-lg">
              {aiQuery.trim().length >= 2
                ? `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""} found`
                : `${total} experience${total !== 1 ? "s" : ""} found across Tunisia.`}
            </p>
          </div>
          {aiQuery.trim().length < 2 && (
            <div className="flex items-center gap-2 text-sm font-medium bg-surface-container-high px-4 py-2 rounded-full">
              <span className="text-on-surface-variant">Sort by:</span>
              <select
                className="bg-transparent border-none focus:ring-0 font-bold text-primary cursor-pointer"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as ActivitySortBy);
                  setCurrentPage(1);
                }}
              >
                <option value="newest">Newest First</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="price_asc">Price: Low to High</option>
              </select>
            </div>
          )}
        </div>

        {/* Loading State */}
        {(aiQuery.trim().length >= 2 ? searchLoading : loading) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`${i === 3 ? "lg:col-span-2" : ""} bg-surface-container-lowest rounded-[2.5rem] overflow-hidden animate-pulse`}
              >
                <div className="aspect-4/5 bg-surface-container-high" />
                <div className="p-8 space-y-4">
                  <div className="h-4 bg-surface-container-high rounded w-1/3" />
                  <div className="h-8 bg-surface-container-high rounded w-2/3" />
                  <div className="h-4 bg-surface-container-high rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {(aiQuery.trim().length >= 2 ? searchError : error) &&
          !(aiQuery.trim().length >= 2 ? searchLoading : loading) && (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-error mb-4">
                error
              </span>
              <p className="text-error text-lg font-medium">
                {aiQuery.trim().length >= 2 ? searchError : error}
              </p>
            </div>
          )}

        {/* Empty State */}
        {!loading &&
          !error &&
          activities.length === 0 &&
          aiQuery.trim().length < 2 && (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">
                search_off
              </span>
              <p className="text-on-surface-variant text-lg font-medium">
                No experiences found matching your filters.
              </p>
              <button
                onClick={() => {
                  handleCategorySelect("");
                  setMaxPrice(500);
                  setCurrentPage(1);
                }}
                className="mt-4 px-6 py-3 rounded-full bg-primary text-white font-bold"
              >
                Clear Filters
              </button>
            </div>
          )}

        {/* Activities Grid */}
        {!loading &&
          !error &&
          activities.length > 0 &&
          aiQuery.trim().length < 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}

        {/* Search Results Grid */}
        {!searchLoading &&
          !searchError &&
          searchResults.length > 0 &&
          aiQuery.trim().length >= 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {searchResults.map((item) => (
                <ActivityCard
                  key={item.id}
                  activity={{
                    id: item.id as number,
                    title: (item.data as any)?.title || "Activity",
                    description:
                      (item.data as any)?.description || "No description",
                    price: (item.data as any)?.price || 0,
                    date: (item.data as any)?.date || new Date().toISOString(),
                    location: (item.data as any)?.location || "Tunisia",
                    latitude: (item.data as any)?.latitude || 35.8,
                    longitude: (item.data as any)?.longitude || 10.1957,
                    images: (item.data as any)?.images || [],
                    capacity: (item.data as any)?.capacity || 1,
                    category: (item.data as any)?.category || "OTHER",
                    status: "APPROVED",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    creatorId: 0,
                    creator: {
                      id: 0,
                      fullName: "Creator",
                      image: "",
                    },
                  }}
                />
              ))}
            </div>
          )}

        {/* Search Error State */}
        {aiQuery.trim().length >= 2 && searchError && !searchLoading && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-error mb-4">
              error
            </span>
            <p className="text-error text-lg font-medium">{searchError}</p>
          </div>
        )}

        {/* Search Empty State */}
        {aiQuery.trim().length >= 2 &&
          !searchLoading &&
          !searchError &&
          searchResults.length === 0 && (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">
                search_off
              </span>
              <p className="text-on-surface-variant text-lg font-medium">
                No results found. Try a different search.
              </p>
            </div>
          )}

        {/* Pagination */}
        {aiQuery.trim().length < 2 && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-full bg-primary text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-full ${page === currentPage ? "bg-primary text-white" : "bg-gray-200 text-gray-700"}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-full bg-primary text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
