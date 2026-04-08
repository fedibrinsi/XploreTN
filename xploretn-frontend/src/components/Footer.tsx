import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full py-20 px-12 bg-surface-container-low dark:bg-[#2a2b29] tonal-shift-no-border">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="font-['Noto_Serif'] italic font-semibold text-xl text-on-surface dark:text-white">XploreTN</div>
          <p className="text-on-surface/70 dark:text-white/70 font-['Plus_Jakarta_Sans'] text-sm leading-relaxed">
            A digital ecosystem dedicated to the preservation of Tunisian heritage through modern storytelling and local connection.
          </p>
        </div>
        <div>
          <h5 className="text-primary dark:text-[#6fa8dc] font-bold mb-6 font-['Plus_Jakarta_Sans'] text-sm tracking-wide">The Platform</h5>
          <ul className="space-y-4">
            <li><Link to="#" className="text-on-surface/70 dark:text-white/70 hover:text-primary-container hover:underline transition-all">About Us</Link></li>
            <li><Link to="#" className="text-on-surface/70 dark:text-white/70 hover:text-primary-container hover:underline transition-all">Artisans</Link></li>
            <li><Link to="#" className="text-on-surface/70 dark:text-white/70 hover:text-primary-container hover:underline transition-all">Sustainability</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="text-primary dark:text-[#6fa8dc] font-bold mb-6 font-['Plus_Jakarta_Sans'] text-sm tracking-wide">Legal</h5>
          <ul className="space-y-4">
            <li><Link to="#" className="text-on-surface/70 dark:text-white/70 hover:text-primary-container hover:underline transition-all">Privacy Policy</Link></li>
            <li><Link to="#" className="text-on-surface/70 dark:text-white/70 hover:text-primary-container hover:underline transition-all">Terms of Service</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="text-primary dark:text-[#6fa8dc] font-bold mb-6 font-['Plus_Jakarta_Sans'] text-sm tracking-wide">Connect</h5>
          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
              <span className="material-symbols-outlined">share</span>
            </a>
            <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
              <span className="material-symbols-outlined">language</span>
            </a>
            <a className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" href="#">
              <span className="material-symbols-outlined">alternate_email</span>
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-on-surface/10 dark:border-white/10 text-center">
        <p className="font-['Plus_Jakarta_Sans'] text-sm tracking-wide text-on-surface/70 dark:text-white/70">
          © 2026 XploreTN. Preserving Tunisian Heritage through Digital Storytelling.
        </p>
      </div>
    </footer>
  );
}
