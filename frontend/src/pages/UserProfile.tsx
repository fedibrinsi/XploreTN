import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toImageUrl } from "../utils/imageUrl"; // ← utiliser la fonction centralisée

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface UserData {
  id: number;
  email: string;
  fullName: string;
  role: "CITOYEN" | "TOURISTE";
  image: string;
  bio: string | null;
  createdAt?: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "bookings" | "activities" | "reviews"
  >("bookings");

  // ── Fetch profile on mount ────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
      return;
    }

    axios
      .get<UserData>(`${BACKEND_URL}/api/profile/me`, {
        headers: getAuthHeaders(),
      })
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.clear();
        navigate("/auth");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  function openEdit() {
    if (!user) return;
    setEditName(user.fullName);
    setEditBio(user.bio ?? "");
    setSaveError("");
    setEditOpen(true);
  }

  async function handleSave() {
    if (!editName.trim()) {
      setSaveError("Le nom ne peut pas être vide.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const res = await axios.put<{ user: UserData }>(
        `${BACKEND_URL}/api/profile/update`,
        { fullName: editName.trim(), bio: editBio },
        { headers: getAuthHeaders() },
      );
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setEditOpen(false);
    } catch (err: any) {
      setSaveError(
        err.response?.data?.message || "Erreur lors de la sauvegarde.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const res = await axios.post<{ user: UserData }>(
        `${BACKEND_URL}/api/profile/photo`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch {
      alert("Échec du téléchargement de la photo.");
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleLogout() {
    localStorage.clear();
    navigate("/auth");
  }

  if (loading) {
    return (
      <main className="pt-32 pb-24 max-w-7xl mx-auto px-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">
            refresh
          </span>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
            Chargement du profil…
          </p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const roleLabel = user.role === "CITOYEN" ? "Citoyen" : "Touriste";
  const roleIcon = user.role === "CITOYEN" ? "person_pin" : "luggage";

  return (
    <main className="pt-32 pb-24 max-w-7xl mx-auto px-8">
      <section className="flex flex-col lg:flex-row gap-20 items-center mb-32">
        <div className="relative group flex-shrink-0">
          <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
          <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-full overflow-hidden border-8 border-white shadow-2xl">
            {/* ✅ toImageUrl gère Cloudinary, chemins locaux, et fallback */}
            <img
              alt={user.fullName}
              className="w-full h-full object-cover"
              src={toImageUrl(user.image)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              {photoUploading ? (
                <span className="material-symbols-outlined text-white text-4xl animate-spin">
                  refresh
                </span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-white text-4xl">
                    add_a_photo
                  </span>
                  <span className="text-white text-xs font-bold uppercase tracking-widest">
                    Changer
                  </span>
                </>
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase bg-primary/10 px-4 py-1.5 rounded-full flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">
                  {roleIcon}
                </span>
                {roleLabel}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  En ligne
                </span>
              </div>
            </div>
            <h1 className="font-headline text-6xl md:text-7xl font-bold text-slate-900 leading-tight">
              {user.fullName}
            </h1>
            <p className="font-headline italic text-2xl text-slate-500">
              {user.bio || "Aucune description pour le moment."}
            </p>
          </div>
          <p className="text-sm text-slate-400 flex items-center justify-center lg:justify-start gap-2">
            <span className="material-symbols-outlined text-base">
              alternate_email
            </span>
            {user.email}
          </p>
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
            <button
              onClick={openEdit}
              className="bg-primary text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-xl">edit</span>
              Modifier le profil
            </button>
            <button
              onClick={handleLogout}
              className="bg-white border border-slate-200 text-slate-600 px-10 py-4 rounded-full font-bold hover:bg-slate-50 transition-all flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              Déconnexion
            </button>
          </div>
        </div>
      </section>

      {/* Tabs — inchangés */}
      <section className="space-y-20">
        <div className="flex justify-center md:justify-start gap-12 border-b border-slate-100">
          {(["bookings", "activities", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-6 border-b-2 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              {tab === "bookings"
                ? "Réservations"
                : tab === "activities"
                  ? "Activités"
                  : "Avis"}
            </button>
          ))}
        </div>
        {/* ... reste du JSX inchangé ... */}
      </section>

      {editOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditOpen(false);
          }}
        >
          <div className="bg-white rounded-[2rem] p-10 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-3xl font-bold text-slate-900">
                Modifier le profil
              </h2>
              <button
                onClick={() => setEditOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-slate-600">
                  close
                </span>
              </button>
            </div>
            {saveError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  error
                </span>
                {saveError}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Nom complet
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Description{" "}
                <span className="normal-case font-normal text-slate-300">
                  ({editBio.length}/500)
                </span>
              </label>
              <textarea
                rows={4}
                maxLength={500}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Parlez de vous, de vos passions…"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="flex gap-4 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">
                      refresh
                    </span>{" "}
                    Sauvegarde…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">
                      save
                    </span>{" "}
                    Sauvegarder
                  </>
                )}
              </button>
              <button
                onClick={() => setEditOpen(false)}
                className="px-8 py-4 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
