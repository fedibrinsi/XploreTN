import { Link } from "react-router-dom";
import { toImageUrl } from "../utils/imageUrl";

const BACKEND_URL = "http://localhost:5000";

export default function Header() {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const profileTarget = token ? "/profile" : "/auth";

  const housingTarget =
    user?.role === "TOURISTE" ? "/housingSearch" : "/housing";

  const avatarSrc = toImageUrl(user?.image);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md shadow-sm shadow-[#1b1c1a]/5 flex justify-between items-center px-8 h-20 max-w-full mx-auto">
      <div className="text-2xl font-black text-[#1D4F91] tracking-tight font-headline">
        <Link to="/">XploreTN</Link>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <Link
          to="/"
          className="text-slate-600 hover:text-[#1D4F91] font-headline font-bold text-lg transition-all duration-300"
        >
          Home
        </Link>
        <Link
          to="/explorePage"
          className="text-slate-600 hover:text-[#1D4F91] font-headline font-bold text-lg transition-all duration-300"
        >
          Explore
        </Link>
        <Link
          to="/dashboard"
          className="text-slate-600 hover:text-[#1D4F91] font-headline font-bold text-lg transition-all duration-300"
        >
          Dashboard
        </Link>
        <Link
          to={housingTarget}
          className="text-slate-600 hover:text-[#1D4F91] font-headline font-bold text-lg transition-all duration-300"
        >
          Housing
        </Link>
        <Link
          to="/messaging"
          className="text-slate-600 hover:text-[#1D4F91] font-headline font-bold text-lg transition-all duration-300"
        >
          Messaging
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-100/50 rounded-full transition-all duration-300">
          <span className="material-symbols-outlined">favorite</span>
        </button>
        <button className="p-2 hover:bg-slate-100/50 rounded-full transition-all duration-300">
          <span className="material-symbols-outlined">notifications</span>
        </button>
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
