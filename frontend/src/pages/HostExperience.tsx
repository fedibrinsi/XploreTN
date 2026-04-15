import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createActivity,
  CATEGORY_CONFIG,
  type ActivityCategory,
  type CreateActivityData,
} from '../services/activityService';
import ImageUploader from '../components/ImageUploader';
import MapPicker from '../components/MapPicker';

const allCategories = Object.keys(CATEGORY_CONFIG) as ActivityCategory[];

export default function HostExperience() {
  const navigate = useNavigate();

  // ─── Form state ─────────────────────────────────────────────────────────
  const [form, setForm] = useState<CreateActivityData>({
    title: '',
    description: '',
    price: 0,
    date: '',
    location: '',
    latitude: 36.8065,
    longitude: 10.1815,
    images: [],
    capacity: 6,
    category: 'ART_HERITAGE',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in as a Citoyen to create an activity.');
      setSubmitting(false);
      return;
    }

    try {
      await createActivity({
        ...form,
        date: new Date(form.date).toISOString(),
      });
      setSuccess('Activity published successfully! It is now live.');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors
          ? JSON.stringify(err.response.data.errors)
          : 'Failed to create activity. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="pt-32 pb-40 px-6 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="mb-12">
        <h1 className="font-headline text-5xl font-black text-primary tracking-tight mb-4 leading-tight">
          Share Your Tunisia
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl font-medium">
          As a local curator, you are the bridge between heritage and the curious traveler. Craft an
          experience that lingers in the soul.
        </p>
      </div>

      {/* Success / Error Messages */}
      {success && (
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-4">
          <span className="material-symbols-outlined text-green-600">check_circle</span>
          <p className="text-green-800 font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4">
          <span className="material-symbols-outlined text-red-600">error</span>
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Form Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Media & Details */}
          <div className="lg:col-span-7 space-y-12">
            {/* Image URLs Section */}
            <section className="relative group">
              <div className="bg-surface-container-low rounded-[2rem] border-2 border-dashed border-outline-variant p-2 space-y-4">
                 <ImageUploader 
                   images={form.images} 
                   onImagesChange={(urls) => setForm(prev => ({...prev, images: urls}))} 
                   maxImages={6} 
                 />
              </div>
            </section>

            {/* Experience Details */}
            <div className="space-y-8 arabesque-pattern p-8 rounded-[2rem] bg-surface-container-low/50">
              <div className="space-y-2">
                <label className="font-label text-sm font-bold uppercase tracking-widest text-primary/70 px-1">
                  Experience Title *
                </label>
                <input
                  className="w-full bg-surface-container-lowest border-none rounded-2xl p-5 text-xl font-headline focus:ring-2 focus:ring-primary-container shadow-sm"
                  placeholder="e.g., Sundown Tea in the Medina Alleys"
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="font-label text-sm font-bold uppercase tracking-widest text-primary/70 px-1">
                  The Narrative *
                </label>
                <textarea
                  className="w-full bg-surface-container-lowest border-none rounded-2xl p-5 text-body focus:ring-2 focus:ring-primary-container shadow-sm"
                  placeholder="Describe the scents, the sounds, and the story of this journey..."
                  rows={5}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label text-sm font-bold uppercase tracking-widest text-primary/70 px-1">
                    Category *
                  </label>
                  <select
                    className="w-full bg-surface-container-lowest border-none rounded-2xl p-5 text-body focus:ring-2 focus:ring-primary-container shadow-sm appearance-none"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-label text-sm font-bold uppercase tracking-widest text-primary/70 px-1">
                    Investment (TND) *
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border-none rounded-2xl p-5 text-body focus:ring-2 focus:ring-primary-container shadow-sm"
                    placeholder="0.00"
                    type="number"
                    min="1"
                    step="0.01"
                    name="price"
                    value={form.price || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label text-sm font-bold uppercase tracking-widest text-primary/70 px-1">
                    Capacity *
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border-none rounded-2xl p-5 text-body focus:ring-2 focus:ring-primary-container shadow-sm"
                    placeholder="Max participants"
                    type="number"
                    min="1"
                    name="capacity"
                    value={form.capacity || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label text-sm font-bold uppercase tracking-widest text-primary/70 px-1">
                    Location *
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border-none rounded-2xl p-5 text-body focus:ring-2 focus:ring-primary-container shadow-sm"
                    placeholder="e.g., Sidi Bou Said, Tunis"
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Context & Scheduling */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-32">
            {/* Location Picker */}
            <div className="bg-surface-container-lowest p-6 rounded-[2rem] shadow-2xl shadow-on-surface/5 space-y-4">
              <div className="flex justify-between items-center px-2 mb-2">
                <h3 className="font-headline text-xl font-bold text-primary">Location</h3>
                <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {form.location || 'Tunisia'}
                </span>
              </div>

              <MapPicker 
                latitude={form.latitude} 
                longitude={form.longitude} 
                onLocationChange={(lat, lng) => setForm(prev => ({...prev, latitude: lat, longitude: lng}))} 
                height="350px" 
              />
            </div>

            {/* Date Selection */}
            <div className="bg-secondary-container/30 p-8 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-secondary">calendar_today</span>
                <h3 className="font-headline text-lg font-bold text-secondary-fixed-variant">
                  Availability
                </h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">
                  Experience Date *
                </label>
                <input
                  className="w-full bg-surface-container-lowest p-4 rounded-xl border-none focus:ring-2 focus:ring-primary-container font-medium"
                  type="datetime-local"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Final Action */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-6 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline text-xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    Publish Activity
                    <span className="material-symbols-outlined">send</span>
                  </>
                )}
              </button>
              <p className="text-center text-xs text-on-surface-variant mt-6 px-8 leading-relaxed">
                By publishing, you agree to our{' '}
                <Link to="#" className="underline">
                  Editorial Standards
                </Link>{' '}
                and the curator code of conduct.
              </p>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
