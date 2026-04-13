import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchActivityById, CATEGORY_CONFIG, type Activity } from '../services/activityService';

export default function ExperienceDetails() {
  const { id } = useParams();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const data = await fetchActivityById(id);
        setActivity(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load experience');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ─── Loading State ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-on-surface-variant font-medium">Loading experience...</p>
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────
  if (error || !activity) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-6xl text-error">error</span>
          <p className="text-error text-lg font-medium">{error || 'Experience not found'}</p>
          <Link to="/explore" className="inline-block mt-4 px-6 py-3 rounded-full bg-primary text-white font-bold">
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const catConfig = CATEGORY_CONFIG[activity.category];
  const mapQuery = `${activity.latitude},${activity.longitude}`;
  const formattedDate = new Date(activity.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      {/* Hero Header */}
      <header className="relative h-[665px] md:h-[768px] w-full overflow-hidden mt-20">
        <img
          className="w-full h-full object-cover"
          src={activity.images[0] || 'https://placehold.co/1920x1080?text=No+Image'}
          alt={activity.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-12 left-0 right-0 px-8 max-w-7xl mx-auto flex flex-col items-start gap-4">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 text-white text-sm">
            <span className="material-symbols-outlined text-[18px]">{catConfig.icon}</span>
            {catConfig.label}
          </div>
          <h1 className="font-headline text-5xl md:text-7xl font-black text-white leading-[1.1] max-w-4xl tracking-tight">
            {activity.title}
          </h1>
          <div className="flex items-center gap-6 text-white/90 font-medium">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">schedule</span>
              {formattedDate}
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">group</span>
              Up to {activity.capacity} People
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">location_on</span>
              {activity.location}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16 relative">
        {/* Storytelling Content */}
        <div className="lg:col-span-7 space-y-12">
          <section>
            <h2 className="font-headline text-3xl font-bold mb-6">The Journey</h2>
            <div className="prose prose-lg text-on-surface-variant font-body leading-relaxed space-y-6">
              <p>{activity.description}</p>
            </div>
          </section>

          {/* Arabesque Divider */}
          <div className="h-32 w-full rounded-3xl arabesque-pattern border border-outline-variant/10" />

          {/* Details Bento Grid */}
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-low p-6 rounded-3xl space-y-3">
              <span className="material-symbols-outlined text-primary">{catConfig.icon}</span>
              <h3 className="font-bold text-lg">{catConfig.label}</h3>
              <p className="text-sm text-on-surface-variant">Experience category</p>
            </div>
            <div className="bg-surface-container-low p-6 rounded-3xl space-y-3">
              <span className="material-symbols-outlined text-primary">group</span>
              <h3 className="font-bold text-lg">Max {activity.capacity}</h3>
              <p className="text-sm text-on-surface-variant">People per session</p>
            </div>
            <div className="bg-surface-container-low p-6 rounded-3xl space-y-3">
              <span className="material-symbols-outlined text-primary">calendar_today</span>
              <h3 className="font-bold text-lg">{new Date(activity.date).toLocaleDateString()}</h3>
              <p className="text-sm text-on-surface-variant">Next available date</p>
            </div>
          </section>

          {/* Map Preview */}
          <section className="space-y-6">
            <div className="flex justify-between items-end">
              <h2 className="font-headline text-3xl font-bold">The Terrain</h2>
              <a
                href={`https://maps.google.com/maps?q=${mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold flex items-center gap-1 cursor-pointer hover:underline"
              >
                View full map <span className="material-symbols-outlined text-sm">north_east</span>
              </a>
            </div>
            <div className="h-80 w-full rounded-3xl overflow-hidden bg-surface-container-high relative group">
              <iframe
                title={`${activity.location} Map`}
                className="w-full h-full object-cover opacity-80 grayscale transition-opacity duration-300 hover:opacity-100 hover:grayscale-0 relative z-0"
                src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10 transition-opacity duration-300 group-hover:opacity-0 hidden md:flex">
                <div className="w-4 h-4 bg-primary rounded-full animate-ping absolute" />
                <div className="w-4 h-4 bg-primary rounded-full relative shadow-lg border-2 border-white" />
                <span className="mt-2 bg-white px-3 py-1 rounded-full text-xs font-bold shadow-md text-on-surface">
                  {activity.location}
                </span>
              </div>
            </div>
          </section>

          {/* Host Profile */}
          <section className="bg-surface-container-lowest border border-outline-variant/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-start">
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 shadow-xl border-4 border-white">
              <img
                alt={activity.creator.fullName}
                className="w-full h-full object-cover"
                src={`http://localhost:5000${activity.creator.image}`}
              />
            </div>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary tracking-widest uppercase mb-1">Your Curator</span>
                <h3 className="text-2xl font-headline font-bold">{activity.creator.fullName}</h3>
              </div>
              {activity.creator.bio && (
                <p className="text-on-surface-variant italic">"{activity.creator.bio}"</p>
              )}
            </div>
          </section>

          {/* Image Gallery (if multiple images) */}
          {activity.images.length > 1 && (
            <section className="space-y-6">
              <h2 className="font-headline text-3xl font-bold">Gallery</h2>
              <div className="grid grid-cols-2 gap-4">
                {activity.images.slice(1).map((img, i) => (
                  <div key={i} className="rounded-3xl overflow-hidden aspect-[4/3]">
                    <img src={img} alt={`${activity.title} ${i + 2}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sticky Sidebar Widget */}
        <aside className="lg:col-span-5 relative">
          <div className="lg:sticky lg:top-28 space-y-6">
            {/* Glassmorphism Booking Card */}
            <div className="bg-[#f0f3f8] backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl shadow-[#1b1c1a]/10 border border-white/40 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 text-right">
                <span className="text-3xl font-headline font-black text-primary block">{activity.price} TND</span>
                <span className="text-sm text-on-surface-variant block">per journey</span>
              </div>
              <div className="space-y-6 mt-16 text-left">
                <h3 className="font-headline text-lg font-bold">Reserve For...</h3>
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Choose Date</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary pointer-events-none">calendar_today</span>
                    <input
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-2xl border-none focus:ring-2 focus:ring-primary/20 font-medium text-on-surface"
                      type="date"
                      defaultValue={new Date(activity.date).toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Guests</label>
                  <div className="flex items-center justify-between bg-surface-container-low rounded-2xl p-3">
                    <div className="flex items-center gap-3 ml-1 text-primary">
                      <span className="material-symbols-outlined">group</span>
                      <span className="font-medium text-on-surface">{guests} Explorer{guests !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-3 border border-outline/20 rounded-full px-2 py-1 bg-surface">
                      <button
                        type="button"
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-primary shadow-sm disabled:opacity-50"
                        disabled={guests <= 1}
                      >
                        <span className="material-symbols-outlined text-[1rem]">remove</span>
                      </button>
                      <span className="font-bold w-4 text-center">{guests}</span>
                      <button
                        type="button"
                        onClick={() => setGuests(Math.min(activity.capacity, guests + 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-primary shadow-sm disabled:opacity-50"
                        disabled={guests >= activity.capacity}
                      >
                        <span className="material-symbols-outlined text-[1rem]">add</span>
                      </button>
                    </div>
                  </div>
                </div>
                <Link to={`/booking/${activity.id}`}>
                  <button className="mt-4 w-full py-5 rounded-full bg-gradient-to-br from-[#003873] to-[#1D4F91] text-white font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex justify-center items-center gap-2">
                    Reserve Experience
                    <span className="material-symbols-outlined">arrow_right_alt</span>
                  </button>
                </Link>
                <p className="text-center text-xs text-on-surface-variant">No charge until journey confirmation.</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="bg-secondary-container p-6 rounded-[2rem] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <div>
                  <h4 className="font-bold text-on-secondary-container">Status: {activity.status}</h4>
                  <p className="text-xs text-on-secondary-container/70">
                    Created {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </>
  );
}
