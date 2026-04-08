import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md shadow-sm shadow-[#1b1c1a]/5 flex justify-between items-center px-8 h-20 max-w-full mx-auto">
      <div className="text-2xl font-black text-[#1D4F91] tracking-tight font-headline">XploreTN</div>
      <div className="hidden md:flex items-center gap-8">
        <Link to="/explore" className="text-slate-600 hover:text-[#1D4F91] font-headline font-bold text-lg transition-all duration-300">Explore</Link>
        <Link to="/" className="text-slate-600 hover:text-[#1D4F91] font-headline font-bold text-lg transition-all duration-300">Home</Link>
        <Link to="/dashboard" className="text-slate-600 hover:text-[#1D4F91] font-headline font-bold text-lg transition-all duration-300">Dashboard</Link>
        <Link to="/messages" className="text-slate-600 hover:text-[#1D4F91] font-headline font-bold text-lg transition-all duration-300">Messaging</Link>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-100/50 rounded-full transition-all duration-300">
          <span className="material-symbols-outlined">favorite</span>
        </button>
        <button className="p-2 hover:bg-slate-100/50 rounded-full transition-all duration-300">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <Link to="/profile">
          <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden cursor-pointer">
            <img alt="User profile avatar" className="w-full h-full object-cover" src="https://media.istockphoto.com/id/2171382633/vector/user-profile-icon-anonymous-person-symbol-blank-avatar-graphic-vector-illustration.jpg?s=612x612&w=0&k=20&c=ZwOF6NfOR0zhYC44xOX06ryIPAUhDvAajrPsaZ6v1-w=" />
          </div>
        </Link>
      </div>
    </nav>
  );
}
