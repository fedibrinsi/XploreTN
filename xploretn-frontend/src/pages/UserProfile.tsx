import { Link } from 'react-router-dom';

export default function UserProfile() {
  return (
    <main className="pt-32 pb-24 max-w-7xl mx-auto px-8">
      {/* Profile Hero Section: More Spacious & High-End */}
      <section className="flex flex-col lg:flex-row gap-20 items-center mb-32">
        {/* Prominent Profile Picture with clean border */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700"></div>
          <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-full overflow-hidden border-8 border-white shadow-2xl">
            <img alt="Elena Moretti" className="w-full h-full object-cover" src="https://www.perfocal.com/blog/content/images/2021/01/Perfocal_17-11-2019_TYWFAQ_82_standard-3.jpg" />
          </div>
        </div>
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase bg-primary/10 px-4 py-1.5 rounded-full">Cultural Explorer</span>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Online</span>
              </div>
            </div>
            <h1 className="font-headline text-6xl md:text-7xl font-bold text-slate-900 leading-tight">Elena Moretti</h1>
            <p className="font-headline italic text-2xl text-slate-500">Curating memories across the Mediterranean.</p>
          </div>
          <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
            Based in Milan but my heart belongs to the white and blue streets of Sidi Bou Said. I specialize in uncovering hidden artisanal workshops and documenting the evolving culinary landscape of North Africa.
          </p>
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
            <button className="bg-primary text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">edit</span>
              Edit Profile
            </button>
            <button className="bg-white border border-slate-200 text-slate-900 px-10 py-4 rounded-full font-bold hover:bg-slate-50 transition-all flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">share</span>
              Share Page
            </button>
          </div>
        </div>
      </section>
      
      {/* Content Sections with Increased Whitespace */}
      <section className="space-y-20">
        {/* Minimal Tabs */}
        <div className="flex justify-center md:justify-start gap-12 border-b border-slate-100">
          <button className="pb-6 border-b-2 border-primary text-primary font-bold text-sm uppercase tracking-widest">Bookings</button>
          <button className="pb-6 border-b-2 border-transparent text-slate-400 font-semibold text-sm uppercase tracking-widest hover:text-slate-600 transition-colors">My Activities</button>
          <button className="pb-6 border-b-2 border-transparent text-slate-400 font-semibold text-sm uppercase tracking-widest hover:text-slate-600 transition-colors">Reviews</button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Area: Visual Storytelling */}
          <div className="lg:col-span-8 space-y-12">
            {/* Highlighted Booking Card */}
            <div className="group relative bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100">
              <div className="flex flex-col md:flex-row h-full">
                <div className="md:w-2/5 relative h-80 md:h-auto overflow-hidden">
                  <img alt="Carthage Ruins" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://wildyness.com/uploads/0000/145/2023/07/31/carthage-guide-complete.png" />
                  <div className="absolute top-6 left-6 bg-primary/90 text-white backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Upcoming</div>
                </div>
                <div className="flex-1 p-10 flex flex-col justify-center space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Heritage Experience</span>
                    <h3 className="font-headline text-4xl font-bold text-slate-900 leading-tight">Private Sunset Tour: Ruins of Carthage</h3>
                  </div>
                  <div className="flex flex-wrap gap-6 items-center py-2 border-y border-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">calendar_today</span>
                      <span className="text-sm font-bold text-slate-600">Oct 24, 2024</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                      <span className="text-sm font-bold text-slate-600">17:30 - 20:00</span>
                    </div>
                  </div>
                  <p className="text-slate-500 leading-relaxed text-sm">A specialized curator-led walk through the Punic ports and the Roman amphitheater as the sun dips below the Mediterranean horizon.</p>
                  <div className="flex gap-6 items-center pt-4">
                    <button className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-opacity">Manage</button>
                    <button className="text-slate-900 font-bold text-sm flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                      Directions <span className="material-symbols-outlined text-lg">arrow_outward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Masonry-style Activity Gallery Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                <div className="aspect-video rounded-2xl overflow-hidden mb-6">
                  <img alt="Pottery" className="w-full h-full object-cover" src="https://www.figsandjasmine.com/cdn/shop/articles/Tunisian_Ceramic_Blog-3.jpg?v=1702514603&width=1920" />
                </div>
                <div className="px-4 pb-4">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Djerba Heritage</span>
                  <h4 className="font-headline text-xl font-bold text-slate-900 mt-1">Guellala Pottery Workshop</h4>
                </div>
              </div>
              <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                <div className="aspect-video rounded-2xl overflow-hidden mb-6">
                  <img alt="Cooking" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSOOR-6q3-GvjgLaeckj7WtjulOV05xzUNrY-DzxHz99choaoEBFtuKIzNLGZ5JDbaKUpuDO2zJzInIe-A189sgetr1ZVyW1lBiKkvsqGdsDzMfMHKkazut7u5YxdAJcEmYDe92W1mZeV-4NWlxE55cjvpJJtgmbj6DdB8IfdTfwvVJPvv-QrVb3m43KixzJeHBdkWNqxnIp_m5ruMpqUuH6AtlL6tUFhJQepX4QHI-IVGHrwYMd0A_wI4pbqX49Ia-dOYVdG7-_A" />
                </div>
                <div className="px-4 pb-4">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Tunis Old City</span>
                  <h4 className="font-headline text-xl font-bold text-slate-900 mt-1">Medina Spice Masterclass</h4>
                </div>
              </div>
            </div>
          </div>
          
          {/* Side Sidebar: Elegant & Compact Stats */}
          <div className="lg:col-span-4 space-y-8">
            {/* Smaller, more elegant Curator Rewards */}
            <div className="bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                </div>
                <div className="space-y-2">
                  <h4 className="font-headline text-2xl font-bold">Rewards</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">You're nearly at 'Level 3 Artisan' status. 2 more journeys to go.</p>
                </div>
                <button className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all">View Details</button>
              </div>
            </div>
            
            {/* Subtle Stats */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-10 flex flex-col items-center text-center space-y-4">
              <div className="text-5xl font-headline font-bold text-primary">12</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Experiences Hosted</div>
              <div className="w-12 h-1 bg-primary/20 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-primary"></div>
              </div>
            </div>
            
            {/* Discover New */}
            <Link to="/host" className="block w-full">
              <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary">add_circle</span>
                </div>
                <h5 className="font-bold text-slate-900">New Journey</h5>
                <p className="text-xs text-slate-400 mt-1">Start a new curation</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
