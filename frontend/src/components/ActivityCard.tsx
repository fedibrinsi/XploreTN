import type { FC } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_CONFIG, type Activity } from "../services/activityService";

interface ActivityCardProps {
  activity: Activity;
  variant?: "default" | "large";
}

/**
 * ActivityCard Component
 * ─────────────────────
 * Reusable activity card that displays in two variants:
 * - "default": compact card with image, price, and key info
 * - "large": full-width horizontal card with more details
 *
 * Usage:
 *   <ActivityCard activity={activity} />
 *   <ActivityCard activity={activity} variant="large" />
 */

const ActivityCard: FC<ActivityCardProps> = ({
  activity,
  variant = "default",
}) => {
  const catConfig = CATEGORY_CONFIG[activity.category];
  const formattedDate = new Date(activity.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (variant === "large") {
    return (
      <article className="group relative bg-surface-container-lowest rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 flex flex-col md:flex-row">
        <Link
          to={`/experience/${activity.id}`}
          className="w-full flex flex-col md:flex-row"
        >
          <div className="w-full md:w-2/5 relative overflow-hidden">
            <img
              alt={activity.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              src={
                activity.images[0] ||
                "https://placehold.co/800x600?text=No+Image"
              }
            />
            <div className="absolute inset-0 bg-linear-to-r from-black/40 to-transparent md:block hidden" />
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-1 shadow-sm">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">
                  Full Day
                </span>
                <span className="text-lg font-black text-primary">
                  {activity.price} TND
                </span>
              </div>
              <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm text-xs font-bold text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">
                  calendar_today
                </span>
                {formattedDate}
              </div>
            </div>
          </div>
          <div className="w-full md:w-3/5 p-10 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
              <span className="material-symbols-outlined text-sm">
                {catConfig.icon}
              </span>
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
                <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-1">
                  Location
                </span>
                <span className="text-sm font-medium">{activity.location}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-1">
                  Capacity
                </span>
                <span className="text-sm font-medium">
                  Up to {activity.capacity} people
                </span>
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

  // Default variant
  return (
    <article className="group relative bg-surface-container-lowest rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
      <Link to={`/experience/${activity.id}`}>
        <div className="aspect-4/5 relative overflow-hidden">
          <img
            alt={activity.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            src={
              activity.images[0] ||
              "https://placehold.co/800x1000?text=No+Image"
            }
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-1 shadow-sm">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">
              From
            </span>
            <span className="text-lg font-black text-primary">
              {activity.price} TND
            </span>
          </div>
          <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm text-xs font-bold text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">
              calendar_today
            </span>
            {formattedDate}
          </div>
          <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-tertiary-fixed text-on-tertiary-fixed-variant px-3 py-1.5 rounded-full text-xs font-bold">
            <span className="material-symbols-outlined text-sm">
              {catConfig.icon}
            </span>
            {catConfig.label}
          </div>
        </div>
        <div className="p-8">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">
            <span className="material-symbols-outlined text-sm">
              {catConfig.icon}
            </span>
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
              <span className="material-symbols-outlined text-on-surface-variant">
                location_on
              </span>
              <span className="text-sm font-medium">{activity.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">
                group
              </span>
              <span className="text-sm font-medium">
                Max {activity.capacity}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default ActivityCard;
