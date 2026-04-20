import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchActivityById,
  type Activity,
  CATEGORY_CONFIG,
} from "../services/activityService";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../utils/backend";

export default function BookingPage() {
  const { id } = useParams();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guests, setGuests] = useState(2);
  const navigate = useNavigate();
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const data = await fetchActivityById(id);
        setActivity(data);
        setGuests(Math.min(2, data.capacity)); // Default to 2 max
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load experience");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleConfirmBooking = async () => {
    setBooking(true);
    setBookingError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/api/activity-reservations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            activityId: id,
            guests,
            notes: specialRequests || undefined,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setBookingError(data.message || "Erreur lors de la réservation.");
        return;
      }

      navigate("/messaging", {
        state: {
          targetConvId: data.conversationId,
        },
      });
    } catch {
      setBookingError("Impossible de contacter le serveur.");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-on-surface-variant font-medium">
            Loading details...
          </p>
        </div>
      </div>
    );
  }

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
            to={`/experience/${id || 1}`}
            className="inline-block mt-4 px-6 py-3 rounded-full bg-primary text-white font-bold"
          >
            Back
          </Link>
        </div>
      </div>
    );
  }

  const catConfig = CATEGORY_CONFIG[activity.category];
  const formattedDate = new Date(activity.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalPrice = activity.price * guests;

  return (
    <>
      {/* Hero Experience Image */}
      <section className="relative h-[60vh] min-h-[400px] w-full overflow-hidden hero-mask mt-20">
        <img
          alt={activity.title}
          className="w-full h-full object-cover"
          src={
            activity.images[0] || "https://placehold.co/1920x1080?text=No+Image"
          }
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-primary/60"></div>
        <div className="absolute bottom-16 left-0 w-full">
          <div className="max-w-7xl mx-auto px-6">
            <div className="inline-flex bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full font-label text-[10px] font-bold uppercase tracking-[0.2em] mb-4 items-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-[14px]">
                {catConfig.icon}
              </span>
              {catConfig.label}
            </div>
            <h1 className="font-headline text-5xl lg:text-7xl text-white drop-shadow-lg leading-tight">
              {activity.title}
            </h1>
          </div>
        </div>
      </section>

      <main className="min-h-screen relative pb-20 -mt-20 z-10">
        <div className="max-w-7xl mx-auto px-6">
          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Details & Inputs */}
            <div className="lg:col-span-7 space-y-8">
              {/* Back Link */}
              <Link to={`/experience/${id || 1}`}>
                <button className="flex items-center gap-2 text-white/90 hover:text-white font-semibold group mb-4 pt-10">
                  <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">
                    arrow_back
                  </span>
                  <span className="font-label uppercase tracking-widest text-[10px]">
                    Back to Experience
                  </span>
                </button>
              </Link>

              {/* Summary Card */}
              <div className="bg-surface-container-lowest p-8 lg:p-10 shadow-xl shadow-primary/5 border border-surface-variant/30 rounded-xl space-y-8 mt-5">
                <div>
                  <h2 className="font-headline text-3xl text-primary mb-4">
                    Experience Details
                  </h2>
                  <p className="text-on-surface-variant leading-relaxed">
                    {activity.description}
                  </p>
                </div>

                {/* Curator Mini Profile */}
                <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-variant/20">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                    <img
                      src={
                        activity.creator.image
                          ? `${BACKEND_URL}${activity.creator.image}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.creator.fullName)}`
                      }
                      alt={activity.creator.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary tracking-widest uppercase mb-0.5">
                      Your Curator
                    </p>
                    <p className="font-headline font-bold text-on-surface">
                      {activity.creator.fullName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-y border-surface-variant/30">
                  <div>
                    <span className="font-label text-[10px] uppercase tracking-[0.2em] text-tertiary font-bold mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        calendar_today
                      </span>
                      Date
                    </span>
                    <p className="font-headline text-xl text-primary">
                      {formattedDate}
                    </p>
                  </div>
                  <div>
                    <span className="font-label text-[10px] uppercase tracking-[0.2em] text-tertiary font-bold mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        location_on
                      </span>
                      Location
                    </span>
                    <p className="font-headline text-xl text-primary">
                      {activity.location}
                    </p>
                  </div>
                </div>

                {/* Compact Traveler Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <h3 className="font-headline text-xl text-primary">
                      Number of Explorers
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium">
                      Max capacity: {activity.capacity} persons
                    </p>
                  </div>

                  <div className="flex items-center justify-between bg-surface-container-low rounded-2xl p-3">
                    <div className="flex items-center gap-3 ml-1 text-primary">
                      <span className="material-symbols-outlined">group</span>
                    </div>
                    <div className="flex items-center gap-3 border border-outline/20 rounded-full px-2 py-1 bg-surface">
                      <button
                        type="button"
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-primary shadow-sm disabled:opacity-50 cursor-pointer"
                        disabled={guests <= 1}
                      >
                        <span className="material-symbols-outlined text-[1rem]">
                          remove
                        </span>
                      </button>
                      <span className="font-bold w-4 text-center">
                        {guests}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setGuests(Math.min(activity.capacity, guests + 1))
                        }
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-primary shadow-sm disabled:opacity-50 cursor-pointer"
                        disabled={guests >= activity.capacity}
                      >
                        <span className="material-symbols-outlined text-[1rem]">
                          add
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Requests Section */}
              <div className="bg-surface-container-lowest p-8 lg:p-10 shadow-xl shadow-primary/5 border border-surface-variant/30 rounded-xl">
                <h3 className="font-headline text-2xl text-primary mb-6">
                  Additional Notes
                </h3>
                <div className="space-y-2">
                  <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">
                    Special Requests or Dietary Requirements
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg transition-all py-4 px-4 text-on-surface placeholder:text-outline-variant italic resize-none"
                    placeholder="e.g. Vegetarian, early pickup..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Price Breakdown & CTA */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 pt-8">
              <div className="glass-panel p-10 shadow-2xl shadow-primary/10 space-y-8 border border-white/40 rounded-2xl relative overflow-hidden bg-white/80 backdrop-blur-2xl">
                {/* Subtle Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary-fixed/10 rounded-full blur-3xl -z-10 -mr-10 -mt-10"></div>

                <div className="space-y-4">
                  <h3 className="font-headline text-2xl text-primary border-b border-surface-variant pb-4 flex items-center justify-between">
                    <span>Fare Breakdown</span>
                    <span className="material-symbols-outlined text-tertiary">
                      receipt_long
                    </span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant">
                        Participant (×{guests})
                      </span>
                      <span className="font-bold text-primary">
                        {(activity.price * guests).toFixed(2)} TND
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-surface-variant">
                    <span className="font-headline text-xl text-primary">
                      Total Amount
                    </span>
                    <div className="text-right">
                      <span className="font-headline text-4xl text-primary block">
                        {totalPrice.toFixed(2)} TND
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                        Including all taxes
                      </span>
                    </div>
                  </div>
                </div>
                {bookingError && (
                  <div className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-xl text-sm text-error">
                    <span className="material-symbols-outlined text-base">
                      error
                    </span>
                    {bookingError}
                  </div>
                )}

                <div className="space-y-6">
                  <button
                    onClick={handleConfirmBooking}
                    disabled={booking}
                    className="w-full bg-primary text-white py-6 rounded-xl font-bold tracking-[0.2em] uppercase text-xs shadow-xl shadow-primary/30 hover:bg-primary-container hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    {booking ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        Sending request...
                      </>
                    ) : (
                      <>
                        <span>Confirm Booking</span>
                        <span className="material-symbols-outlined text-sm">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>

                  <div className="flex items-start gap-3 bg-secondary-container/20 p-4 rounded-xl border border-secondary-container/30">
                    <span className="material-symbols-outlined text-tertiary mt-0.5">
                      verified_user
                    </span>
                    <div>
                      <p className="text-xs font-bold text-on-secondary-container">
                        Curated Excellence
                      </p>
                      <p className="text-[10px] leading-relaxed text-on-secondary-container/80">
                        Every experience is hand-verified by our local
                        historians to ensure cultural authenticity and luxury
                        standards.
                      </p>
                    </div>
                  </div>

                  <p className="text-center text-[10px] text-on-surface-variant leading-relaxed px-4">
                    By confirming, you agree to our{" "}
                    <Link
                      to="#"
                      className="underline decoration-tertiary underline-offset-4 font-bold"
                    >
                      Terms of Discovery
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="#"
                      className="underline decoration-tertiary underline-offset-4 font-bold"
                    >
                      Cancellation Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
