import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchActivityById,
  CATEGORY_CONFIG,
  type Activity,
} from "../services/activityService";
import { LocationAutocomplete } from "./LocationAutocomplete";

// Cloudinary optimization helper
const getOptimizedUrl = (url: string, width = 1600) => {
  if (!url) return "https://placehold.co/1600x900?text=No+Image";
  if (url.includes("cloudinary.com")) {
    const parts = url.split("/upload/");
    return `${parts[0]}/upload/w_${width},q_auto,f_auto/${parts[1]}`;
  }
  return url;
};

export default function ExperienceDetails() {
  const { id } = useParams();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guests, setGuests] = useState(2);
  const [pickupLocation, setPickupLocation] = useState("");
  const currentUserId = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw).id : null;
    } catch {
      return null;
    }
  })();

  const isOwner = currentUserId && activity?.creator.id === currentUserId;

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const data = await fetchActivityById(id);
        setActivity(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load experience");
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
          <p className="text-on-surface-variant font-medium">
            Loading experience...
          </p>
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────
  if (error || !activity) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-6xl text-error">
            error
          </span>
          <p className="text-error text-lg font-medium">
            {error || "Experience not found"}
          </p>
          <Link
            to="/explore"
            className="inline-block mt-4 px-6 py-3 rounded-full bg-primary text-white font-bold"
          >
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const catConfig = CATEGORY_CONFIG[activity.category];
  const mapQuery = `${activity.latitude},${activity.longitude}`;
  const formattedDate = new Date(activity.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Hero Header */}
      <header className="relative h-[665px] md:h-[768px] w-full overflow-hidden mt-20">
        <img
          className="w-full h-full object-cover"
          src={
            activity.images[0]
              ? getOptimizedUrl(activity.images[0], 2000)
              : "https://placehold.co/1600x900?text=No+Image"
          }
          alt={activity.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-12 left-0 right-0 px-8 max-w-7xl mx-auto flex flex-col items-start gap-4">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 text-white text-sm">
            <span className="material-symbols-outlined text-[18px]">
              {catConfig.icon}
            </span>
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
            <h2 className="font-headline text-3xl font-bold mb-6">
              The Journey
            </h2>
            <div className="prose prose-lg text-on-surface-variant font-body leading-relaxed space-y-6">
              <p>{activity.description}</p>
            </div>
          </section>

          {/* Arabesque Divider */}
          <div className="h-32 w-full rounded-3xl arabesque-pattern border border-outline-variant/10" />

          {/* Details Bento Grid */}
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-low p-6 rounded-3xl space-y-3">
              <span className="material-symbols-outlined text-primary">
                {catConfig.icon}
              </span>
              <h3 className="font-bold text-lg">{catConfig.label}</h3>
              <p className="text-sm text-on-surface-variant">
                Experience category
              </p>
            </div>
            <div className="bg-surface-container-low p-6 rounded-3xl space-y-3">
              <span className="material-symbols-outlined text-primary">
                group
              </span>
              <h3 className="font-bold text-lg">Max {activity.capacity}</h3>
              <p className="text-sm text-on-surface-variant">
                People per session
              </p>
            </div>
            <div className="bg-surface-container-low p-6 rounded-3xl space-y-3">
              <span className="material-symbols-outlined text-primary">
                calendar_today
              </span>
              <h3 className="font-bold text-lg">
                {new Date(activity.date).toLocaleDateString()}
              </h3>
              <p className="text-sm text-on-surface-variant">
                Next available date
              </p>
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
                View full map{" "}
                <span className="material-symbols-outlined text-sm">
                  north_east
                </span>
              </a>
            </div>
            <div className="h-80 w-full rounded-3xl overflow-hidden bg-surface-container-high relative group">
              <iframe
                title={`${activity.location} Map`}
                className="w-full h-full object-cover   relative z-0"
                src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>

          {/* Host Profile */}
          <section className="bg-surface-container-lowest border border-outline-variant/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-start">
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 shadow-xl border-4 border-white">
              <img
                alt={activity.creator.fullName}
                className="w-full h-full object-cover"
                src={getOptimizedUrl(activity.creator.image, 2000)}
              />
            </div>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary tracking-widest uppercase mb-1">
                  Your Curator
                </span>
                <h3 className="text-2xl font-headline font-bold">
                  {activity.creator.fullName}
                </h3>
              </div>
              {activity.creator.bio && (
                <p className="text-on-surface-variant italic">
                  "{activity.creator.bio}"
                </p>
              )}
            </div>
          </section>

          {/* Image Gallery (if multiple images) */}
          {activity.images.length > 1 && (
            <section className="space-y-6">
              <h2 className="font-headline text-3xl font-bold">Gallery</h2>
              <div className="grid grid-cols-2 gap-4">
                {activity.images.slice(1).map((img, i) => (
                  <div
                    key={i}
                    className="rounded-3xl overflow-hidden aspect-[4/3]"
                  >
                    <img
                      src={getOptimizedUrl(img, 800)}
                      alt={`${activity.title} ${i + 2}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
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
                <span className="text-3xl font-headline font-black text-primary block">
                  {activity.price} TND
                </span>
                <span className="text-sm text-on-surface-variant block">
                  per journey
                </span>
              </div>
              <div className="space-y-6 mt-16 text-left">
                {isOwner ? (
                  <div className="mt-4 w-full py-5 rounded-full bg-surface-container-high text-on-surface-variant font-bold text-lg flex justify-center items-center gap-2 cursor-not-allowed">
                    <span className="material-symbols-outlined">lock</span>
                    Your Experience
                  </div>
                ) : (
                  <Link to={`/booking/${activity.id}`}>
                    <button className="mt-4 w-full py-5 rounded-full bg-gradient-to-br from-[#003873] to-[#1D4F91] text-white font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex justify-center items-center gap-2">
                      Reserve Experience
                      <span className="material-symbols-outlined">
                        arrow_right_alt
                      </span>
                    </button>
                  </Link>
                )}
                <p className="text-center text-xs text-on-surface-variant">
                  {isOwner
                    ? "You created this experience."
                    : "No charge until journey confirmation."}
                </p>
                <p className="text-center text-xs text-on-surface-variant">
                  No charge until journey confirmation.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </>
  );
}
