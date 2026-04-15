import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  fetchActivities,
  CATEGORY_CONFIG,
  type Activity,
  type ActivityCategory,
} from '../services/activityService';
import { useDebouncedPrice } from '../hooks/useDebouncedPrice';
import { PriceRangeSlider } from '../components/PriceRangeSlider';

export default function ExploreActivities() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ─── State ──────────────────────────────────────────────────────────────
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | ''>
    ((searchParams.get('category') as ActivityCategory) || '');
  const [maxPrice, setMaxPrice] = useState<number>(500);
  const { localPrice, setLocalPrice } = useDebouncedPrice(
    maxPrice,
    (price) => setMaxPrice(price),
    300 // Debounce delay in ms
  );
  const [sortBy, setSortBy] = useState('newest');

  // ─── Fetch activities whenever filters change ───────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const filters: any = { status: 'APPROVED' };
        if (selectedCategory) filters.category = selectedCategory;
        if (maxPrice < 500) filters.maxPrice = maxPrice;

        const result = await fetchActivities(filters);
        const sorted = result.activities;

        // Client-side sort
        if (sortBy === 'newest') sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (sortBy === 'price_desc') sorted.sort((a, b) => b.price - a.price);
        if (sortBy === 'price_asc') sorted.sort((a, b) => a.price - b.price);

        setActivities(sorted);
        setTotal(result.total);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedCategory, maxPrice, sortBy]);

  // ─── Category select handler ────────────────────────────────────────────
  const handleCategorySelect = (cat: ActivityCategory | '') => {
    setSelectedCategory(cat);
    if (cat) {
      setSearchParams({ category: cat });
    } else {
      setSearchParams({});
    }
  };

  // ─── All category keys for filter buttons ─────────────────────────────
  const allCategories = Object.keys(CATEGORY_CONFIG) as ActivityCategory[];

  // ─── Render a single activity card ────────────────────────────────────
  const renderCard = (activity: Activity, index: number) => {
    const catConfig = CATEGORY_CONFIG[activity.category];
    const isLarge = index === 2; // Third card spans full width
    const formattedDate = new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (isLarge) {
      return (
        <article
          key={activity.id}
          className="lg:col-span-2 group relative bg-surface-container-lowest rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 flex flex-col md:flex-row"
        >
          <Link to={`/experience/${activity.id}`} className="w-full flex flex-col md:flex-row">
            <div className="w-full md:w-2/5 relative overflow-hidden">
              <img
                alt={activity.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                src={activity.images[0] || 'https://placehold.co/800x600?text=No+Image'}
              />
              <div className="absolute inset-0 bg-linear-to-r from-black/40 to-transparent md:block hidden" />
              <div className="absolute top-6 left-6 flex items-center gap-2">
                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-1 shadow-sm">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">Full Day</span>
                  <span className="text-lg font-black text-primary">{activity.price} TND</span>
                </div>
                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm text-xs font-bold text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  {formattedDate}
                </div>
              </div>
            </div>
            <div className="w-full md:w-3/5 p-10 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
                <span className="material-symbols-outlined text-sm">{catConfig.icon}</span>
                {catConfig.label}
              </div>
              <h3 className="font-headline text-4xl font-bold text-on-surface mb-4 group-hover:text-primary transition-colors leading-tight">
                {activity.title}
              </h3>
              <p className="text-on-surface-variant leading-relaxed mb-8 text-lg">
                {activity.description}
              </p>
              <div className="flex flex-wrap items-center gap-8 mb-8">
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-1">Location</span>
                  <span className="text-sm font-medium">{activity.location}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-1">Capacity</span>
                  <span className="text-sm font-medium">Up to {activity.capacity} people</span>
                </div>
              </div>
              <button className="self-start px-8 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary-container transition-colors">
                Explore Experience
              </button>
            </div>
          </Link>
        </article>
      );
    }

    return (
      <article
        key={activity.id}
        className="group relative bg-surface-container-lowest rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10"
      >
        <Link to={`/experience/${activity.id}`}>
          <div className="aspect-4/5 relative overflow-hidden">
            <img
              alt={activity.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              src={activity.images[0] || 'https://placehold.co/800x1000?text=No+Image'}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-1 shadow-sm">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">From</span>
              <span className="text-lg font-black text-primary">{activity.price} TND</span>
            </div>
            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm text-xs font-bold text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {formattedDate}
            </div>
            <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-tertiary-fixed text-on-tertiary-fixed-variant px-3 py-1.5 rounded-full text-xs font-bold">
              <span className="material-symbols-outlined text-sm">{catConfig.icon}</span>
              {catConfig.label}
            </div>
          </div>
          <div className="p-8">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">
              <span className="material-symbols-outlined text-sm">{catConfig.icon}</span>
              {catConfig.label}
            </div>
            <h3 className="font-headline text-3xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">
              {activity.title}
            </h3>
            <p className="text-on-surface-variant line-clamp-2 leading-relaxed mb-6">
              {activity.description}
            </p>
            <div className="flex items-center gap-6 border-t border-surface-container-high pt-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">location_on</span>
                <span className="text-sm font-medium">{activity.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">group</span>
                <span className="text-sm font-medium">Max {activity.capacity}</span>
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  };

  return (
    <div className="pt-28 pb-32 min-h-screen px-4 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Filter Sidebar */}
      <aside className="w-full md:w-80 shrink-0">
        <div 
          className="sticky top-28 bg-surface-container-low rounded-4xl flex flex-col"
          style={{ maxHeight: 'calc(100vh - 8rem)' }}
        >
          <div className="absolute inset-0 arabesque-pattern pointer-events-none rounded-4xl"></div>
          <div 
            className="relative z-10 p-8 overflow-y-auto" 
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-primary) transparent' }}
          >
          <h2 className="font-headline text-2xl font-bold mb-8 text-primary">Refine Your Search</h2>
          <div className="space-y-8">
            {/* Categories */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Experience Category</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    selectedCategory === ''
                      ? 'bg-primary text-white'
                      : 'bg-white text-on-surface hover:bg-secondary-container'
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
                        ? 'bg-primary text-white'
                        : 'bg-white text-on-surface hover:bg-secondary-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{CATEGORY_CONFIG[cat].icon}</span>
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
                handleCategorySelect('');
                setMaxPrice(500);
                setLocalPrice(500);
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
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 gap-4">
          <div>
            <h1 className="font-headline text-5xl font-black text-primary leading-tight">Curated Experiences</h1>
            <p className="text-on-surface-variant mt-2 text-lg">
              {total} experience{total !== 1 ? 's' : ''} found across Tunisia.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium bg-surface-container-high px-4 py-2 rounded-full">
            <span className="text-on-surface-variant">Sort by:</span>
            <select
              className="bg-transparent border-none focus:ring-0 font-bold text-primary cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`${i === 3 ? 'lg:col-span-2' : ''} bg-surface-container-lowest rounded-[2.5rem] overflow-hidden animate-pulse`}>
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
        {error && !loading && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
            <p className="text-error text-lg font-medium">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && activities.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">search_off</span>
            <p className="text-on-surface-variant text-lg font-medium">No experiences found matching your filters.</p>
            <button
              onClick={() => { handleCategorySelect(''); setMaxPrice(500); }}
              className="mt-4 px-6 py-3 rounded-full bg-primary text-white font-bold"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Activities Grid */}
        {!loading && !error && activities.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {activities.map((activity, index) => renderCard(activity, index))}
          </div>
        )}
      </section>
    </div>
  );
}
