import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#faf9f5]/70 dark:bg-[#1b1c1a]/70 backdrop-blur-xl px-12 py-6 flex justify-between items-center max-w-[1920px] mx-auto shadow-sm shadow-[#1b1c1a]/5">
      <div className="font-['Noto_Serif'] italic font-bold text-2xl text-primary dark:text-white">
        XploreTN
      </div>
      <div className="hidden md:flex gap-10 items-center">
        <Link to="/" className="font-['Noto_Serif'] font-medium text-lg text-primary border-b-2 border-primary-container pb-1 transition-colors duration-300">Home</Link>
        <Link to="/explore" className="font-['Noto_Serif'] font-medium text-lg text-on-surface/60 hover:text-primary-container transition-colors duration-300">Explore</Link>
        <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-3 rounded-full font-semibold scale-95 duration-200 ease-in-out hover:scale-100 shadow-md">
          Plan Your Journey
        </button>
      </div>
      <div className="md:hidden">
        <span className="material-symbols-outlined text-primary text-3xl">menu</span>
      </div>
    </nav>
  );
}
