import type { FC } from "react";
import { Link } from "react-router-dom";
import { CATEGORY_CONFIG, type Activity } from "../services/activityService";

interface ActivityCardProps {
  activity: Activity;
}

/**
 * ActivityCard Component
 * ─────────────────────
 * Reusable activity card that displays activity information in a vertical layout.
 *
 * Usage:
 *   <ActivityCard activity={activity} />
 */

const ActivityCard: FC<ActivityCardProps> = ({ activity }) => {
  const catConfig = CATEGORY_CONFIG[activity.category];
  const formattedDate = new Date(activity.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className="group relative bg-surface-container-lowest rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 min-h-[500px] flex flex-col">
      <Link to={`/experience/${activity.id}`} className="flex flex-col h-full">
        <div className="h-64 relative overflow-hidden shrink-0">
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
        <div className="p-8 flex-1 flex flex-col justify-between">
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
