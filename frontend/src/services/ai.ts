/**
 * services/ai.ts
 * ──────────────
 * Frontend Axios client for all AI-powered endpoints.
 *
 * Why Axios over the native Fetch API on the frontend?
 * ─────────────────────────────────────────────────────
 * 1. Response interceptors let us handle 401 (token expiry) and redirect to
 *    /login in one place — no duplicated error handling across every hook.
 * 2. Automatic JSON parsing with typed generics: `axios.get<T>()` gives us
 *    `response.data` typed as T, while Fetch requires a manual `.json()` cast.
 * 3. Request cancellation via `CancelToken` or `AbortController` has a cleaner
 *    Axios API than the Fetch equivalent.
 * 4. The Axios instance is easily mockable in tests via `axios-mock-adapter`,
 *    without patching the global `fetch`.
 *
 * All calls target /api/ai/* on the Node.js backend — never FastAPI directly.
 */

import axios, { isAxiosError } from "axios";
import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import type {
  EntityType,
  SearchResponse,
  RecommendResponse,
  MatchResponse,
  PersonalisedSearchResponse,
  HealthResponse,
} from "../types/ai.types";
import { BACKEND_URL } from "../utils/backend";

// ── Axios instance ─────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach JWT token ────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle auth errors globally ───────────────────────

apiClient.interceptors.response.use(
  (response) => response,

  (error: AxiosError) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ── Error normalisation helper ────────────────────────────────────────────────

/**
 * Extract a human-readable message from an Axios error.
 * Components can call this in their catch blocks.
 */
export function getErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: string; message?: string }
      | undefined;
    return data?.error ?? data?.message ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Semantic search over Activities or Places (public endpoint).
 *
 * POST is used rather than GET because:
 *  - Query strings appear in browser history and server logs — a privacy concern
 *    for queries that reflect user intent.
 *  - GET responses are cached by browsers and CDNs; search results must be live.
 *  - Long natural-language queries risk exceeding proxy URL length limits.
 */
export async function semanticSearch(
  query: string,
  entity: EntityType = "activity",
  top_k: number = 5,
): Promise<SearchResponse> {
  const { data } = await apiClient.post<SearchResponse>("/api/ai/search", {
    query,
    entity,
    top_k,
  });
  return data;
}

/**
 * Personalised search — blends query relevance with user profile (requires login).
 *
 * POST carries both the free-text query AND implicit user identity.
 * A GET URL like /api/ai/personalised-search?query=hiking&user_id=42&alpha=0.5
 * would leak the user_id and query in access logs and browser history.
 */
export async function personalisedSearch(
  query: string,
  alpha: number = 0.5,
  top_k: number = 5,
): Promise<PersonalisedSearchResponse> {
  const { data } = await apiClient.post<PersonalisedSearchResponse>(
    "/api/ai/personalised-search",
    { query, alpha, top_k },
  );
  return data;
}

/**
 * Profile-based recommendations for the logged-in user (requires login).
 *
 * POST because recommendation results are user-specific and must not be cached
 * — a CDN serving a stale recommendations response to the wrong user would be
 * a data exposure bug.
 */
export async function getRecommendations(
  entity: EntityType = "activity",
  top_k: number = 5,
): Promise<RecommendResponse> {
  const { data } = await apiClient.post<RecommendResponse>(
    "/api/ai/recommend",
    {
      entity,
      top_k,
    },
  );
  return data;
}

/**
 * Find compatible local guides for the logged-in tourist (requires login).
 *
 * POST because future implementations log match impressions for analytics,
 * making this a side-effectful operation that should not be replayed by
 * cache layers or browser back-button navigation.
 */
export async function matchLocals(top_k: number = 3): Promise<MatchResponse> {
  const { data } = await apiClient.post<MatchResponse>("/api/ai/match", {
    top_k,
  });
  return data;
}

/** Poll whether the AI service is fully initialised (model + DB ready). */
export async function checkAIHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>("/api/ai/health");
  return data;
}
