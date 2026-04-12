const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FALLBACK_AVATAR =
  "https://media.istockphoto.com/id/2171382633/vector/user-profile-icon-anonymous-person-symbol-blank-avatar-graphic-vector-illustration.jpg?s=612x612&w=0&k=20&c=ZwOF6NfOR0zhYC44xOX06ryIPAUhDvAajrPsaZ6v1-w=";

export function toImageUrl(path?: string | null): string {
  if (!path) return FALLBACK_AVATAR;

  // Déjà une URL complète (http:// ou https://)
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  // Chemin absolu comme /uploads/... → coller le backend
  if (path.startsWith("/")) return `${BACKEND_URL}${path}`;

  // Chemin relatif comme uploads/... ou profile.jpg → ajouter /uploads/
  return `${BACKEND_URL}/uploads/${path}`;
}
