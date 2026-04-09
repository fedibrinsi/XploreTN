import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

type Role = "CITOYEN" | "TOURISTE";

interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: Role;
    image: string;
  };
  message?: string;
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const BACKEND_URL = "http://localhost:5000";
  // Login form state
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Signup form state
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    role: "TOURISTE" as Role,
  });

  const handleLogin = async () => {
    setError("");
    if (!loginData.email || !loginData.password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post<AuthResponse>(
        `${BACKEND_URL}/api/auth/login`,
        {
          email: loginData.email,
          password: loginData.password,
        },
      );
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/profile");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError("");
    if (!signupData.email || !signupData.password || !signupData.fullName) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (signupData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post<AuthResponse>(
        `${BACKEND_URL}/api/auth/signup`,
        {
          email: signupData.email,
          password: signupData.password,
          fullName: signupData.fullName,
          role: signupData.role,
        },
      );
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/profile");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erreur lors de la création du compte.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <h1 className="font-headline text-4xl font-bold text-slate-900">
            Wandara
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Explorez. Découvrez. Partagez.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`flex-1 py-5 text-sm font-bold uppercase tracking-widest transition-colors ${
                mode === "login"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`flex-1 py-5 text-sm font-bold uppercase tracking-widest transition-colors ${
                mode === "signup"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Inscription
            </button>
          </div>

          <div className="p-8 space-y-5">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  error
                </span>
                {error}
              </div>
            )}

            {mode === "login" ? (
              <>
                {/* Login Form */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-base animate-spin">
                        refresh
                      </span>
                      Connexion…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">
                        login
                      </span>
                      Se connecter
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Signup Form */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Nom complet <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Elena Moretti"
                    value={signupData.fullName}
                    onChange={(e) =>
                      setSignupData({ ...signupData, fullName: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Email <span className="text-primary">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    value={signupData.email}
                    onChange={(e) =>
                      setSignupData({ ...signupData, email: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Mot de passe <span className="text-primary">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Min. 6 caractères"
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData({ ...signupData, password: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Confirmer le mot de passe{" "}
                    <span className="text-primary">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={signupData.confirmPassword}
                    onChange={(e) =>
                      setSignupData({
                        ...signupData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Role selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Je suis
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["TOURISTE", "CITOYEN"] as Role[]).map((r) => (
                      <button
                        key={r}
                        onClick={() =>
                          setSignupData({ ...signupData, role: r })
                        }
                        className={`py-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                          signupData.role === r
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-200 text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {r === "TOURISTE" ? "luggage" : "person_pin"}
                        </span>
                        {r === "TOURISTE" ? "Touriste" : "Citoyen"}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSignup}
                  disabled={loading}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-base animate-spin">
                        refresh
                      </span>
                      Création…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">
                        person_add
                      </span>
                      Créer mon compte
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-slate-400 mt-6">
          {mode === "login" ? (
            <>
              Pas encore de compte ?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className="text-primary font-bold hover:underline"
              >
                S'inscrire
              </button>
            </>
          ) : (
            <>
              Déjà inscrit ?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="text-primary font-bold hover:underline"
              >
                Se connecter
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
