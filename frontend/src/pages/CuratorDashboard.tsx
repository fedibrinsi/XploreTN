import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchMyActivities,
  deleteActivity,
  CATEGORY_CONFIG,
  type Activity,
} from '../services/activityService';

// ─── Status badge styles ────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'text-green-700 bg-green-50',
  PENDING: 'text-amber-700 bg-amber-50',
  REJECTED: 'text-red-700 bg-red-50',
};

export default function CuratorDashboard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Get user info from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // ─── Fetch my activities ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchMyActivities();
        setActivities(data);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          setError('Please log in to view your dashboard.');
        } else {
          setError(err?.response?.data?.message || 'Failed to load activities');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── Delete handler ─────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    setDeletingId(id);
    try {
      await deleteActivity(id);
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete activity');
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Stats ──────────────────────────────────────────────────────────────
  const totalActivities = activities.length;
  const approvedCount = activities.filter((a) => a.status === 'APPROVED').length;
  const pendingCount = activities.filter((a) => a.status === 'PENDING').length;

  return (
    <main className="max-w-7xl mx-auto px-8 py-12 pt-32">
      {/* Header */}
      <header className="mb-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/60">
                Verified Artisan Dashboard
              </span>
            </div>
            <h1 className="font-headline text-5xl font-light text-on-surface leading-tight">
              Aslema,{' '}
              <span className="font-semibold text-primary">
                {user?.fullName || 'Curator'}.
              </span>
            </h1>
            <p className="text-on-surface-variant mt-4 text-base font-light leading-relaxed max-w-md">
              Your curation preserves Tunisia's mosaic. Track your impact and manage your unique
              local experiences.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">
                Profile Status
              </span>
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600" /> Active
              </span>
            </div>
            <Link to="/host">
              <button className="bg-primary text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center gap-3">
                <span className="material-symbols-outlined text-xl">add</span>
                Create Activity
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">travel_explore</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
            Total Experiences
          </p>
          <span className="text-2xl font-semibold text-on-surface tracking-tight">
            {totalActivities}
          </span>
        </div>

        <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">check_circle</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
            Approved
          </p>
          <span className="text-2xl font-semibold text-on-surface">{approvedCount}</span>
        </div>

        <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">hourglass_top</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
            Pending
          </p>
          <span className="text-2xl font-semibold text-on-surface">{pendingCount}</span>
        </div>

        <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-secondary-container text-secondary flex items-center justify-center">
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                group
              </span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
            Total Capacity
          </p>
          <span className="text-2xl font-semibold text-on-surface">
            {activities.reduce((sum, a) => sum + a.capacity, 0)}
          </span>
        </div>
      </section>

      {/* Activities Grid */}
      <section className="mb-24">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-headline text-3xl font-light text-on-surface">
            Experience{' '}
            <span className="font-semibold text-primary tracking-tight">Portfolio</span>
          </h2>
          <Link
            to="/explore"
            className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] border-b border-primary/20 pb-1 hover:border-primary transition-all"
          >
            View Archive
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-2xl aspect-[4/5] bg-surface-container-high mb-6" />
                <div className="space-y-3">
                  <div className="h-3 bg-surface-container-high rounded w-1/3" />
                  <div className="h-6 bg-surface-container-high rounded w-2/3" />
                  <div className="h-3 bg-surface-container-high rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-error mb-4">error</span>
            <p className="text-error font-medium">{error}</p>
            {error.includes('log in') && (
              <Link to="/auth" className="mt-4 inline-block px-6 py-3 rounded-full bg-primary text-white font-bold">
                Go to Login
              </Link>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && activities.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant">add_circle</span>
            <p className="text-on-surface-variant text-lg font-medium">
              No experiences yet. Start curating your first activity!
            </p>
            <Link
              to="/host"
              className="inline-block px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg mt-2"
            >
              Create Your First Activity
            </Link>
          </div>
        )}

        {/* Activity Cards */}
        {!loading && !error && activities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {activities.map((activity) => {
              const catConfig = CATEGORY_CONFIG[activity.category];
              const statusStyle = STATUS_STYLES[activity.status] || STATUS_STYLES.PENDING;

              return (
                <div key={activity.id} className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/5] mb-6">
                    <Link to={`/experience/${activity.id}`}>
                      <img
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        src={activity.images[0] || 'https://placehold.co/800x1000?text=No+Image'}
                        alt={activity.title}
                      />
                    </Link>
                    <div
                      className={`absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm ${statusStyle}`}
                    >
                      {activity.status}
                    </div>

                    {/* Hover overlay with actions */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <Link
                        to={`/experience/${activity.id}`}
                        className="bg-white/90 backdrop-blur w-12 h-12 rounded-full flex items-center justify-center text-primary shadow-lg hover:bg-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(activity.id);
                        }}
                        disabled={deletingId === activity.id}
                        className="bg-white/90 backdrop-blur w-12 h-12 rounded-full flex items-center justify-center text-red-500 shadow-lg hover:bg-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-500 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined">
                          {deletingId === activity.id ? 'hourglass_top' : 'delete'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary/60 mb-1 block flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">{catConfig.icon}</span>
                        {catConfig.label} • Max {activity.capacity}
                      </span>
                      <h4 className="font-headline text-2xl font-medium text-on-surface mb-2">
                        {activity.title}
                      </h4>
                      <p className="text-on-surface-variant text-sm font-light flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary/40">
                          location_on
                        </span>
                        {activity.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-primary">{activity.price}</p>
                      <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
                        TND
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Subtle Floating Organic Decorative Shape */}
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] pointer-events-none -z-10" />
    </main>
  );
}
