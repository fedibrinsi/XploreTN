import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { toImageUrl } from "../utils/imageUrl";

const BACKEND_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

export default function Header() {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const profileTarget = token ? "/profile" : "/auth";

  const housingTarget =
    user?.role === "TOURISTE" ? "/housingSearch" : "/housing";

  const activityTarget = user?.role === "CITOYEN" ? "/activity" : "/explore";

  const avatarSrc = toImageUrl(user?.image);

  // ─── Unread notification count ──────────────────────────────────────────
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    // Fetch initial unread count
    fetch(`${BACKEND_URL}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.count === "number") setUnreadCount(data.count);
      })
      .catch(() => {});

    // Real-time: increment on new notification
    const socket = io(BACKEND_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("notification", () => {
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Reset badge when user visits /notifications
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.location.pathname === "/notifications") {
        setUnreadCount(0);
      }
    };
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md shadow-sm shadow-[#1b1c1a]/5 flex justify-between items-center px-8 h-20 max-w-full mx-auto">
      <div className="text-2xl font-black text-[#1D4F91] tracking-tight font-headline">
        <Link to="/">XploreTN</Link>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link
          to="/explorePage"
          className="text-slate-600 hover:text-[#1D4F91] font-headline font-bold text-lg transition-all duration-300"
        >
          Explore
        </Link>
        <Link
          to={activityTarget}
          className="text-slate-600 hover:text-[#1D4F91] font-headline font-bold text-lg transition-all duration-300"
        >
          Activities
        </Link>
        <Link
          to={housingTarget}
          className="text-slate-600 hover:text-[#1D4F91] font-headline font-bold text-lg transition-all duration-300"
        >
          Housing
        </Link>
        {user?.role === "CITOYEN" && (
          <Link
            to="/dashboard"
            className="text-slate-600 hover:text-[#1D4F91] font-headline font-bold text-lg transition-all duration-300"
          >
            Dashboard
          </Link>
        )}
        <Link
          to="/messaging"
          className="text-slate-600 hover:text-[#1D4F91] font-headline font-bold text-lg transition-all duration-300"
        >
          Messaging
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification icon with badge */}
        <Link
          to="/notifications"
          onClick={() => setUnreadCount(0)}
          className="relative p-2 hover:bg-slate-100/50 rounded-full transition-all duration-300"
          title="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 pointer-events-none shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        <Link to={profileTarget}>
          <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-[#1D4F91] transition-all duration-300">
            <img
              alt={user?.fullName ?? "User avatar"}
              className="w-full h-full object-cover"
              src={avatarSrc}
            />
          </div>
        </Link>
      </div>
    </nav>
  );
}
