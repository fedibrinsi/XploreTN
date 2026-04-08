import { Link } from 'react-router-dom';

export default function HostExperience() {
  return (
    <main className="pt-32 pb-40 px-6 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="mb-12">
        <h1 className="font-headline text-5xl font-black text-primary tracking-tight mb-4 leading-tight">Share Your Tunisia</h1>
        <p className="text-on-surface-variant text-lg max-w-2xl font-medium">As a local curator, you are the bridge between heritage and the curious traveler. Craft an experience that lingers in the soul.</p>
      </div>
      
      {/* Form Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Media & Details */}
        <div className="lg:col-span-7 space-y-12">
          {/* Image Upload Area */}
          <section className="relative group">
            <div className="aspect-[16/10] bg-surface-container-low rounded-[2rem] border-2 border-dashed border-outline-variant flex flex-col items-center justify-center overflow-hidden transition-all duration-500 hover:border-primary/40 group-hover:bg-surface-container-high cursor-pointer">
              <div className="text-center p-8 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary group-hover:scale-110 transition-transform duration-500">
                  <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                </div>
                <div>
                  <h3 className="font-headline text-xl font-bold text-primary">Capture the Essence</h3>
                  <p className="text-on-surface-variant text-sm mt-1">Drag and drop high-resolution imagery of your experience</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-tertiary text-on-tertiary rounded-full flex items-center justify-center shadow-lg transform rotate-12">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>colors_spark</span>
            </div>
          </section>
          
          {/* Experience Details */}
          <div className="space-y-8 arabesque-pattern p-8 rounded-[2rem] bg-surface-container-low/50">
            <div className="space-y-2">
              <label className="font-label text-sm font-bold uppercase tracking-widest text-primary/70 px-1">Experience Title</label>
              <input className="w-full bg-surface-container-lowest border-none rounded-2xl p-5 text-xl font-headline focus:ring-2 focus:ring-primary-container shadow-sm" placeholder="e.g., Sundown Tea in the Medina Alleys" type="text" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-sm font-bold uppercase tracking-widest text-primary/70 px-1">The Narrative</label>
              <textarea className="w-full bg-surface-container-lowest border-none rounded-2xl p-5 text-body focus:ring-2 focus:ring-primary-container shadow-sm" placeholder="Describe the scents, the sounds, and the story of this journey..." rows={5}></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-label text-sm font-bold uppercase tracking-widest text-primary/70 px-1">Category</label>
                <select className="w-full bg-surface-container-lowest border-none rounded-2xl p-5 text-body focus:ring-2 focus:ring-primary-container shadow-sm appearance-none">
                  <option>Artisan Heritage</option>
                  <option>Culinary Journey</option>
                  <option>Coastal Escape</option>
                  <option>Historical Tour</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-label text-sm font-bold uppercase tracking-widest text-primary/70 px-1">Investment (TND)</label>
                <input className="w-full bg-surface-container-lowest border-none rounded-2xl p-5 text-body focus:ring-2 focus:ring-primary-container shadow-sm" placeholder="0.00" type="number" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column: Context & Scheduling */}
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-32">
          {/* Location Picker */}
          <div className="bg-surface-container-lowest p-6 rounded-[2rem] shadow-2xl shadow-on-surface/5 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-headline text-xl font-bold text-primary">Location</h3>
              <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">location_on</span>
                Tunis, TN
              </span>
            </div>
            <div className="aspect-square w-full rounded-2xl overflow-hidden relative">
              <img className="w-full h-full object-cover" src="https://www.seatemperature.org/public/map/sidi-bou-said-tn.png" alt="Map" />
              <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl animate-pulse">
                  <div className="w-4 h-4 bg-primary rounded-full"></div>
                </div>
              </div>
              <button className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg text-primary hover:bg-white transition-colors">
                <span className="material-symbols-outlined">my_location</span>
              </button>
            </div>
          </div>
          
          {/* Date Selection */}
          <div className="bg-secondary-container/30 p-8 rounded-[2rem] space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-secondary">calendar_today</span>
              <h3 className="font-headline text-lg font-bold text-secondary-fixed-variant">Availability</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Starts</span>
                <span className="font-medium">Oct 24, 2024</span>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Frequency</span>
                <span className="font-medium">Daily</span>
              </div>
            </div>
          </div>
          
          {/* Final Action */}
          <div className="pt-4">
            <button className="w-full py-6 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline text-xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3">
              Publish Activity
              <span className="material-symbols-outlined">send</span>
            </button>
            <p className="text-center text-xs text-on-surface-variant mt-6 px-8 leading-relaxed">
              By publishing, you agree to our <Link to="#" className="underline">Editorial Standards</Link> and the curator code of conduct.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
