import { Link, useParams } from 'react-router-dom';

export default function ExperienceDetails() {
  const { id } = useParams();

  return (
    <>
      <header className="relative h-[665px] md:h-[768px] w-full overflow-hidden mt-20">
        <img className="w-full h-full object-cover" data-alt="The blue and white streets of Sidi Bou Said at sunset" src="https://olovetunisia.com/cdn/shop/articles/sidi_bous_said_tunisia_1600x.jpg?v=1665796742" alt="Hero background" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div className="absolute bottom-12 left-0 right-0 px-8 max-w-7xl mx-auto flex flex-col items-start gap-4">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 text-white text-sm">
            <span className="material-symbols-outlined text-[18px]">auto_stories</span>
            Curated Heritage Experience
          </div>
          <h1 className="font-headline text-5xl md:text-7xl font-black text-white leading-[1.1] max-w-4xl tracking-tight">The Whispers of Sidi Bou Said</h1>
          <div className="flex items-center gap-6 text-white/90 font-medium">
            <span className="flex items-center gap-2"><span className="material-symbols-outlined">schedule</span> 4 Hours</span>
            <span className="flex items-center gap-2"><span className="material-symbols-outlined">group</span> Up to 6 People</span>
            <span className="flex items-center gap-2"><span className="material-symbols-outlined">language</span> English, French, Arabic</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16 relative">
        {/* Storytelling Content */}
        <div className="lg:col-span-7 space-y-12">
          <section>
            <h2 className="font-headline text-3xl font-bold mb-6">The Journey</h2>
            <div className="prose prose-lg text-on-surface-variant font-body leading-relaxed space-y-6">
              <p>Escape the rush of modern life and step into a living canvas. This curated walk is more than a tour; it's an immersion into the poetic soul of Tunisia's most iconic coastal village. We begin as the morning light hits the azure Mediterranean, wandering through cobblestone alleys where the scent of jasmine hangs thick in the air.</p>
              <p>Your guide, a local historian and artist, will peel back the layers of history—from the spiritual origins of the Sufi saint Abu Said al-Beji to the bohemian era that attracted writers like André Gide and Simone de Beauvoir.</p>
            </div>
          </section>

          {/* Arabesque Divider */}
          <div className="h-32 w-full rounded-3xl arabesque-pattern border border-outline-variant/10"></div>

          {/* Features Bento Grid */}
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-low p-6 rounded-3xl space-y-3">
              <span className="material-symbols-outlined text-primary">coffee</span>
              <h3 className="font-bold text-lg">Traditional Tea</h3>
              <p className="text-sm text-on-surface-variant">Authentic pine-nut tea at Café des Nattes.</p>
            </div>
            <div className="bg-surface-container-low p-6 rounded-3xl space-y-3">
              <span className="material-symbols-outlined text-primary">palette</span>
              <h3 className="font-bold text-lg">Artisanal Access</h3>
              <p className="text-sm text-on-surface-variant">Private workshop visit with a local ceramicist.</p>
            </div>
            <div className="bg-surface-container-low p-6 rounded-3xl space-y-3">
              <span className="material-symbols-outlined text-primary">photo_camera</span>
              <h3 className="font-bold text-lg">Curated Views</h3>
              <p className="text-sm text-on-surface-variant">Secret photography spots overlooking the bay.</p>
            </div>
          </section>

          {/* Map Preview */}
          <section className="space-y-6">
            <div className="flex justify-between items-end">
              <h2 className="font-headline text-3xl font-bold">The Terrain</h2>
              <span className="text-primary font-bold flex items-center gap-1 cursor-pointer">View full map <span className="material-symbols-outlined text-sm">north_east</span></span>
            </div>
            <div className="h-80 w-full rounded-3xl overflow-hidden bg-surface-container-high relative">
              <img className="w-full h-full object-cover opacity-50 grayscale" data-alt="Stylized map showing coastal roads and village layout" src="https://external-iad3-2.xx.fbcdn.net/static_map.php?region=US&v=2065&ccb=4-4&size=411x205&center=36.8028%2C10.1797&language=en_US&_nc_client_caller=FacebookMapProvider.php&_nc_client_id=fb_profile_hub_page&theme=default" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-4 h-4 bg-primary rounded-full animate-ping absolute"></div>
                <div className="w-4 h-4 bg-primary rounded-full relative shadow-lg border-2 border-white"></div>
                <span className="mt-2 bg-white px-3 py-1 rounded-full text-xs font-bold shadow-md">Meeting Point: Dar Zarrouk</span>
              </div>
            </div>
          </section>

          {/* Host Profile */}
          <section className="bg-surface-container-lowest border border-outline-variant/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-start">
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 shadow-xl border-4 border-white">
              <img alt="Host Profile Photo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2hEyvQYSjyDHTQvywDtJVvpZs6_48DTvz1KdzZFJICjs-SVXLyizIpEqRWs5e3VSzET99zzaVHZ1N7NTRx06cJ1ffrigGAkait1soZWLKJMP_bv2D1ZamoIP6EZ75cVuK-5uG4QqEc22S7nszYiwF2DWYb-HHeaZ46cEX3Ipdrmk6yy_jVyrRZCNfxSQ_ZcfeBfw6tGMrpAnS-QiE5TqfUSR750qKNyG3tiJv3GLwunMDnlyyJFdbH1xj6MLdxy78Y4D0pGVk3v4" />
            </div>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary tracking-widest uppercase mb-1">Your Curator</span>
                <h3 className="text-2xl font-headline font-bold">Malek Ben Achour</h3>
              </div>
              <p className="text-on-surface-variant">"I’ve spent twenty years documenting the architecture of this village. My goal is for you to leave not just with photos, but with a piece of Tunisia in your heart."</p>
              <button className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all duration-300">
                Message Malek <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </section>

          {/* Reviews */}
          <section className="space-y-8 pb-8">
            <h2 className="font-headline text-3xl font-bold">Guest Stories</h2>
            <div className="space-y-6">
              <div className="pb-6 border-b border-outline-variant/30">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest"></div>
                  <div>
                    <h4 className="font-bold">Elena Rodriguez</h4>
                    <div className="flex text-amber-500 scale-75 origin-left">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    </div>
                  </div>
                </div>
                <p className="text-on-surface-variant italic">"A transcendent experience. Malek knows the owners of every hidden courtyard. It felt like walking through a private dream."</p>
              </div>
            </div>
          </section>
        </div>

        {/* Sticky Sidebar Widget */}
        <aside className="lg:col-span-5 relative">
          <div className="lg:sticky lg:top-28 space-y-6">
            {/* Glassmorphism Booking Card */}
            <div className="bg-[#f0f3f8] backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl shadow-[#1b1c1a]/10 border border-white/40 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 text-right">
                <span className="text-3xl font-headline font-black text-primary block">120 TND</span>
                <span className="text-sm text-on-surface-variant block">per journey</span>
              </div>
              <div className="space-y-6 mt-16 text-left">
                <h3 className="font-headline text-lg font-bold">Reserve For...</h3>
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Choose Date</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary">calendar_today</span>
                    <input className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-2xl border-none focus:ring-2 focus:ring-primary/20 font-medium" type="text" defaultValue="Oct 24, 2024" />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Guests</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary">group</span>
                    <select className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-2xl border-none focus:ring-2 focus:ring-primary/20 font-medium appearance-none">
                      <option>2 Explorers</option>
                      <option>3 Explorers</option>
                      <option>4 Explorers</option>
                    </select>
                  </div>
                </div>
                <Link to={`/booking/${id || 1}`}>
                  <button className="mt-4 w-full py-5 rounded-full bg-gradient-to-br from-[#003873] to-[#1D4F91] text-white font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex justify-center items-center gap-2">
                    Reserve Experience
                    <span className="material-symbols-outlined">arrow_right_alt</span>
                  </button>
                </Link>
                <p className="text-center text-xs text-on-surface-variant">No charge until journey confirmation.</p>
              </div>
            </div>

            {/* Secondary Action */}
            <div className="bg-secondary-container p-6 rounded-[2rem] flex items-center justify-between group cursor-pointer hover:bg-secondary-container/80 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div>
                  <h4 className="font-bold text-on-secondary-container">Ask a question</h4>
                  <p className="text-xs text-on-secondary-container/70">Response within 2 hours</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-secondary-container">chevron_right</span>
            </div>
          </div>
        </aside>
      </main>
    </>
  );
}
