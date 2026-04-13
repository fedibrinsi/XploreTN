import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <>
      <header className="relative min-h-screen flex items-center pt-20 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img alt="Sidi Bou Said Tunisia" className="w-full h-full object-cover" data-alt="Cinematic wide shot of the iconic blue and white architecture of Sidi Bou Said overlooking the turquoise Mediterranean Sea at sunrise." src="https://tunisiagotravel.com/blog/wp-content/uploads/2021/08/shopping-sidi.webp" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/40 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-4xl">
          <h1 className="font-headline text-6xl md:text-8xl text-primary font-bold leading-tight mb-6">
            Unveil the Heart <br /><span className="italic text-tertiary">of Tunisia</span>
          </h1>
          <p className="text-xl md:text-2xl text-on-surface-variant max-w-2xl mb-10 leading-relaxed">
            Discover authentic local experiences and connect with the soul of the Mediterranean through our curated digital journey.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/explore">
              <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-10 py-4 rounded-full text-lg font-bold shadow-xl flex items-center gap-2 hover:scale-105 duration-200">
                Start Exploring <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-32 px-6 md:px-12 relative arabesque-pattern">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-20 items-center">
          <div className="w-full md:w-1/2 relative">
            <div className="bg-surface-container-high aspect-[4/5] rounded-[4rem] overflow-hidden rotate-2 shadow-2xl relative z-20">
              <img alt="Carthage" className="w-full h-full object-cover"  src="https://wildyness.com/uploads/0000/145/2023/07/31/carthage-guide-complete.png" />
            </div>
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-secondary-fixed rounded-full -z-10 mix-blend-multiply opacity-50 blur-3xl"></div>
            <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-tertiary-fixed rounded-full -z-10 mix-blend-multiply opacity-40 blur-3xl"></div>
          </div>
          <div className="w-full md:w-1/2 space-y-8">
            <span className="text-tertiary font-bold tracking-[0.2em] uppercase text-sm">Authenticity Redefined</span>
            <h2 className="font-headline text-5xl text-primary font-bold leading-tight">A Bridge Between Worlds</h2>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              Our geolocation-based platform doesn't just show you places; it introduces you to people. Using high-precision location mapping, we connect you with local "Curators"—citizens who open their homes and heritage to those seeking more than just a souvenir.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <span className="material-symbols-outlined max-w-fit" data-weight="fill">location_on</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg">Hyper-Local Discovery</h4>
                  <p className="text-on-surface-variant">Find hidden gems within walking distance of your current stay.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <span className="material-symbols-outlined">diversity_3</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg">Direct Citizen Impact</h4>
                  <p className="text-on-surface-variant">Every experience directly supports the local economy and preservation efforts.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-24 bg-surface-container-low px-6 md:px-12">
        <div className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="font-headline text-5xl text-primary font-bold">Curated Portals</h2>
            <p className="text-on-surface-variant text-xl mt-4 max-w-xl">Choose your path through the diverse tapestry of Tunisian life.</p>
          </div>
          <Link to="/explore" className="text-primary font-bold flex items-center gap-2 hover:underline">
            Explore all paths <span className="material-symbols-outlined">north_east</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto h-auto md:h-[800px]">
          <div className="md:col-span-7 group relative rounded-3xl overflow-hidden shadow-lg transition-transform hover:scale-[1.01] cursor-pointer">
            <Link to="/explore?category=ARTISAN_WORKSHOP">
              <img alt="Pottery Workshop" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://www.figsandjasmine.com/cdn/shop/articles/Tunisian_Ceramic_Blog-3.jpg?v=1702514603&width=1920" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-10 left-10 text-white">
                <span className="bg-tertiary text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full mb-3 inline-block">Hands-on</span>
                <h3 className="text-4xl font-headline font-bold">Artisanal Workshops</h3>
                <p className="text-white/80 mt-2 max-w-xs">Master the ancient arts of weaving, pottery, and calligraphy.</p>
              </div>
            </Link>
          </div>
          <div className="md:col-span-5 group relative rounded-3xl overflow-hidden shadow-lg transition-transform hover:scale-[1.01] cursor-pointer">
            <Link to="/explore?category=ARTISAN_WORKSHOP">
              <img alt="Riad Courtyard" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://www.notesfromtheroad.com/files/sidi-bou-said-street.webp" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-10 left-10 text-white">
                <h3 className="text-3xl font-headline font-bold">Heritage Stays</h3>
                <p className="text-white/80 mt-2">Sleep within the walls of history.</p>
              </div>
            </Link>
          </div>
          <div className="md:col-span-5 group relative rounded-3xl overflow-hidden shadow-lg transition-transform hover:scale-[1.01] cursor-pointer">
            <Link to="/explore?category=GASTRONOMY">
              <img alt="Tunisian Spices" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAf3cEL_W_2KcjsRK-bRxvs9FgGHNRYxXEuyNOXVok5IUlnHpJ0lP7SqEmpwZC7szLFw1p2Whb3V9zCce2hmZX_fkg7maRLhK1uurHMA6TUCnhJ_lXo97EE_TclofQXCstFWqDGSH1wN5Lgb90zDXZhE6FND-AvMBDRrUjHqWlGjVIQY57iz3-EpHc2oetxJ89b5OplH-tqDgl0gcmtNKF2hsf4ldCeoKFV4sFhF9e7shy8NzF9c3HIxpaGMxEQ8Z-r-fMRXjoBL9A" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-10 left-10 text-white">
                <h3 className="text-3xl font-headline font-bold">Culinary Secrets</h3>
                <p className="text-white/80 mt-2">Private kitchen experiences with family matriarchs.</p>
              </div>
            </Link>
          </div>
          <div className="md:col-span-7 group relative rounded-3xl overflow-hidden shadow-lg transition-transform hover:scale-[1.01] cursor-pointer">
            <Link to="/explore?category=DESERT_EXPEDITION">
              <img alt="Sahara Desert" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwgf9Lh-j_Cval-WlNx-04AKpLwJpLuEsJ0MhsauFfZv0WJ1Y3EU59z239av_kWCOk30Jct9jEu60fvmXHU_5Bha5tUhW7lcqxHuY8CjbeSh-kW8YRrl46vgkkm2k6ixxWcq45xvpx2xr8FsAuKKBFVuEwQxzZXJcmoxgE6YYKJxOCKrHRNmagImZSar59lu9g90QE9fobBnn-yv_tPYOGO9VKNivzu9KaF0s0qizyPr7gQiUCUQ22h8DWRU-nmBoHJioEwa3AHjw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-10 left-10 text-white">
                <h3 className="text-4xl font-headline font-bold">Desert Expeditions</h3>
                <p className="text-white/80 mt-2">Navigate the golden silence of the Sahara.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
      <section className="py-32 px-6 md:px-12 bg-surface">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16 items-center">
          <div className="lg:col-span-1">
            <span className="text-secondary font-bold tracking-widest uppercase text-xs">Meet the Curators</span>
            <h2 className="font-headline text-5xl text-primary font-bold mt-4 mb-6">Voices of the Medina</h2>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              Our curators are historians, chefs, artists, and elders. They are the keepers of the Tunisian soul, ready to welcome you into their narrative.
            </p>
            <button className="flex items-center gap-3 text-primary font-bold group">
              Explore all Curators 
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-2">trending_flat</span>
            </button>
          </div>
          <div className="lg:col-span-2 flex flex-col md:flex-row gap-8">
            <div className="flex-1 bg-surface-container-lowest p-8 rounded-[2rem] shadow-xl shadow-on-surface/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[4rem]"></div>
              <img alt="Selima curator" className="w-24 h-24 rounded-full object-cover mb-6 border-4 border-white shadow-lg" src="https://d34ad2g4hirisc.cloudfront.net/location_photos/files/000/250/391/main/3149c73ff81a33c8fd996614134643c0.jpg" />
              <h4 className="text-2xl font-headline font-bold text-primary">Selima B.</h4>
              <span className="text-tertiary text-sm font-bold">Textile Historian</span>
              <p className="mt-4 text-on-surface-variant italic">"I don't just teach weaving; I teach the language of symbols passed down for three generations."</p>
              <div className="mt-6 pt-6 border-t border-surface-container-high flex justify-between items-center">
                <span className="text-xs font-bold text-on-surface/40 uppercase">Experience</span>
                <span className="text-sm font-bold text-primary">Indigo & Silk Masterclass</span>
              </div>
            </div>
            <div className="flex-1 bg-surface-container-lowest p-8 rounded-[2rem] shadow-xl shadow-on-surface/5 relative overflow-hidden mt-12 md:mt-24 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary/5 rounded-bl-[4rem]"></div>
              <img alt="Ahmed curator" className="w-24 h-24 rounded-full object-cover mb-6 border-4 border-white shadow-lg" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSstnpmqO_cKSZsBQzZZtxdiGJup2B-ieTHQ&s" />
              <h4 className="text-2xl font-headline font-bold text-primary">Ahmed M.</h4>
              <span className="text-tertiary text-sm font-bold">Desert Guide</span>
              <p className="mt-4 text-on-surface-variant italic">"The stars in the Sahara tell stories that haven't changed since the Berbers first named them."</p>
              <div className="mt-6 pt-6 border-t border-surface-container-high flex justify-between items-center">
                <span className="text-xs font-bold text-on-surface/40 uppercase">Experience</span>
                <span className="text-sm font-bold text-primary">Starlit Nomad Trek</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 md:px-12 bg-surface-container-highest arabesque-pattern">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="bg-surface p-4 rounded-[2.5rem] shadow-2xl overflow-hidden aspect-square md:aspect-video lg:aspect-square relative">
                <iframe 
                  title="Tunisia Interactive Map"
                  className="w-full h-full object-cover rounded-[2rem] opacity-70 grayscale transition-opacity duration-300 hover:opacity-100 hover:grayscale-0"
                  src="https://maps.google.com/maps?q=Tunis,Tunisia&t=&z=6&ie=UTF8&iwloc=&output=embed"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
                <div className="absolute top-1/4 left-1/3 glass-nav bg-white/80 p-3 rounded-2xl shadow-lg animate-bounce flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface/40 leading-none">LA GOULETTE</p>
                    <p className="text-xs font-bold">Fish Market Feast</p>
                  </div>
                </div>
                <div className="absolute bottom-1/3 right-1/4 glass-nav bg-white/80 p-3 rounded-2xl shadow-lg flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface/40 leading-none">KAIROUAN</p>
                    <p className="text-xs font-bold">Carpet Rituals</p>
                  </div>
                </div>
                <div className="absolute top-1/2 right-1/3 glass-nav bg-primary p-3 rounded-2xl shadow-xl text-white flex items-center gap-3">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person_pin_circle</span>
                  <div>
                    <p className="text-[10px] font-bold text-white/60 leading-none">CURRENTLY NEAR YOU</p>
                    <p className="text-xs font-bold">Meryem's Kitchen</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-secondary-container p-6 rounded-3xl shadow-xl hidden md:block">
                <p className="font-headline font-bold text-primary">Live Curator Signal</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-xs font-medium">42 Curators Active in Tunis</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-8 px-4">
              <h2 className="font-headline text-5xl text-primary font-bold">Real-Time Heritage</h2>
              <p className="text-on-surface-variant text-xl">
                Our interactive map reveals the living city. As you move through the winding streets of the Kasbah or the olive groves of Sousse, 'The Digital Curator' pulses with nearby opportunities.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-4 rounded-2xl hover:bg-surface transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                    <span className="material-symbols-outlined">near_me</span>
                  </div>
                  <p className="font-medium text-lg group-hover:text-primary transition-colors">Proximity-based notifications for exclusive daily pop-ups.</p>
                </div>
                <div className="flex items-center gap-6 p-4 rounded-2xl hover:bg-surface transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
                    <span className="material-symbols-outlined">map</span>
                  </div>
                  <p className="font-medium text-lg group-hover:text-primary transition-colors">Offline mapping for safe navigation in the ancient Medinas.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto bg-gradient-to-br from-primary to-primary-container rounded-[3rem] p-12 md:p-24 relative overflow-hidden text-center">
          <div className="absolute inset-0 arabesque-pattern opacity-10"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="font-headline text-5xl md:text-6xl text-white font-bold mb-8 italic">Ready to curate your story?</h2>
            <p className="text-white/80 text-xl mb-12 leading-relaxed">
              Whether you're a traveler seeking the authentic or a citizen proud of your craft, your journey starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="bg-white text-primary px-12 py-5 rounded-full text-xl font-bold shadow-2xl hover:scale-105 transition-transform">
                Start Your Journey
              </button>
              <button className="bg-secondary-container text-on-secondary-container px-12 py-5 rounded-full text-xl font-bold shadow-xl hover:scale-105 transition-transform">
                Become a Curator
              </button>
            </div>
          </div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-tertiary-container/30 rounded-full blur-3xl"></div>
        </div>
      </section>
    </>
  );
}
