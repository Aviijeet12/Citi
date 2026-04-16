const DEFAULT_API_URL = "http://localhost:3001";
const DEFAULT_BOOTSTRAP_EMAIL = "admin@citi.com";
const DEFAULT_BOOTSTRAP_PASSWORD = "123456";
const SESSION_STORAGE_KEY = "workshop.auth.session";

const ENV_API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || DEFAULT_API_URL;
const ENV_ENDPOINTS = import.meta.env.VITE_API_ENDPOINTS || import.meta.env.REACT_APP_API_ENDPOINTS || "{}";
const ENV_BOOTSTRAP_EMAIL = import.meta.env.VITE_BOOTSTRAP_EMAIL || DEFAULT_BOOTSTRAP_EMAIL;
const ENV_BOOTSTRAP_PASSWORD = import.meta.env.VITE_BOOTSTRAP_PASSWORD || DEFAULT_BOOTSTRAP_PASSWORD;

let sessionCache = loadStoredSession();
let bootstrapPromise = null;

function stripSurroundingQuotes(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  if ((text.startsWith("\"") && text.endsWith("\"")) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1);
  }
  return text;
}

function parseJsonEnv(value, fallback = {}) {
  const text = stripSurroundingQuotes(value);
  if (!text) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function trimLeadingSlash(value) {
  return String(value || "").replace(/^\/+/, "");
}

function toQueryString(query) {
  if (!query || typeof query !== "object") {
    return "";
  }

  const params = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(query)) {
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      continue;
    }

    if (Array.isArray(rawValue)) {
      for (const value of rawValue) {
        params.append(key, String(value));
      }
      continue;
    }

    params.append(key, String(rawValue));
  }

  const rendered = params.toString();
  return rendered ? `?${rendered}` : "";
}

const API_BASE_URL = trimTrailingSlash(ENV_API_URL || DEFAULT_API_URL);
const API_ENDPOINTS = parseJsonEnv(ENV_ENDPOINTS, {});

function isLocalProxyBaseUrl(value) {
  return /localhost:3001|127\.0\.0\.1:3001/i.test(String(value || ""));
}

function resolveServiceFromBaseUrl(baseUrl, serviceName) {
  const normalizedBase = trimTrailingSlash(baseUrl);
  if (normalizedBase.endsWith("/api")) {
    return `${normalizedBase}/${trimLeadingSlash(serviceName)}`;
  }
  return `${normalizedBase}/api/${trimLeadingSlash(serviceName)}`;
}

function resolveServiceBaseUrl(serviceName) {
  const endpoint = API_ENDPOINTS[serviceName];

  if (endpoint) {
    const endpointValue = trimTrailingSlash(String(endpoint));

    // In LocalStack, endpoint map points to Lambda URLs but frontend should still
    // go through proxy (localhost:3001) to avoid browser CORS/preflight issues.
    if (isLocalProxyBaseUrl(API_BASE_URL)) {
      return resolveServiceFromBaseUrl(API_BASE_URL, serviceName);
    }

    if (/^https?:\/\//i.test(endpointValue)) {
      return endpointValue;
    }

    const normalizedPath = endpointValue.startsWith("/") ? endpointValue : `/${endpointValue}`;
    return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
  }

  return API_BASE_URL
    ? resolveServiceFromBaseUrl(API_BASE_URL, serviceName)
    : `/api/${trimLeadingSlash(serviceName)}`;
}

function buildServiceUrl(serviceName, path = "", query = null) {
  const base = trimTrailingSlash(resolveServiceBaseUrl(serviceName));
  const normalizedPath = trimLeadingSlash(path);
  const url = normalizedPath ? `${base}/${normalizedPath}` : base;
  return `${url}${toQueryString(query)}`;
}

function loadStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.accessToken) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveStoredSession(session) {
  if (typeof window === "undefined") {
    return;
  }
  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function parseResponsePayload(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

function getErrorMessage(payload, fallback) {
  if (!payload) {
    return fallback;
  }
  if (typeof payload === "string") {
    return payload;
  }
  if (typeof payload === "object" && payload.message) {
    return payload.message;
  }
  if (typeof payload === "object" && payload.error) {
    return payload.error;
  }
  return fallback;
}

async function bootstrapSession(forceRefresh = false, email = null, password = null) {
  if (!forceRefresh && sessionCache?.accessToken && !email) {
    return sessionCache;
  }

  if (!email) {
    bootstrapPromise = (async () => {
      const response = await fetch(buildServiceUrl("auth-service", "login"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: ENV_BOOTSTRAP_EMAIL,
          password: ENV_BOOTSTRAP_PASSWORD,
        }),
      });

      const payload = await parseResponsePayload(response);

      if (!response.ok) {
        throw new ApiError(
          getErrorMessage(payload, "Unable to initialize session for backend requests"),
          response.status,
          payload?.details || null
        );
      }

      if (!payload?.access_token) {
        throw new ApiError("Backend login succeeded but did not return access token", 500, payload);
      }

      sessionCache = {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token || null,
        user: payload.user || null,
        tokenType: payload.token_type || "Bearer",
        createdAt: new Date().toISOString(),
      };

      saveStoredSession(sessionCache);
      return sessionCache;
    })();

    try {
      return await bootstrapPromise;
    } finally {
      bootstrapPromise = null;
    }
  }

  // Handle explicit credentials (non-singleton)
  const response = await fetch(buildServiceUrl("auth-service", "login"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, "Login failed"),
      response.status,
      payload?.details || null
    );
  }

  sessionCache = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || null,
    user: payload.user || null,
    tokenType: payload.token_type || "Bearer",
    createdAt: new Date().toISOString(),
  };

  saveStoredSession(sessionCache);
  return sessionCache;
}

async function getAccessToken(forceRefresh = false) {
  const session = await bootstrapSession(forceRefresh);
  if (!session?.accessToken) {
    throw new ApiError("No access token available", 401);
  }
  return session.accessToken;
}

export function clearSession() {
  sessionCache = null;
  saveStoredSession(null);
}

export function getActiveUser() {
  return sessionCache?.user || null;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getKnownEndpoints() {
  return { ...API_ENDPOINTS };
}

export function getServiceUrl(serviceName, path = "", query = null) {
  return buildServiceUrl(serviceName, path, query);
}

export async function request(serviceName, options = {}) {
  const {
    method = "GET",
    path = "",
    query = null,
    body,
    headers = {},
    retryOnAuthFailure = true,
  } = options;

  const token = await getAccessToken(false);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(buildServiceUrl(serviceName, path, query), {
    method,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : body === undefined ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const payload = await parseResponsePayload(response);

  if (response.status === 401 && retryOnAuthFailure) {
    await bootstrapSession(true);
    return request(serviceName, { ...options, retryOnAuthFailure: false });
  }

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, `${method} ${serviceName}/${path || ""} failed`),
      response.status,
      payload?.details || null
    );
  }

  return payload;
}

export const apiClient = {
  get: (serviceName, path = "", query = null, headers = {}) =>
    request(serviceName, { method: "GET", path, query, headers }),
  post: (serviceName, path = "", body = {}, headers = {}) =>
    request(serviceName, { method: "POST", path, body, headers }),
  put: (serviceName, path = "", body = {}, headers = {}) =>
    request(serviceName, { method: "PUT", path, body, headers }),
  delete: (serviceName, path = "", headers = {}) =>
    request(serviceName, { method: "DELETE", path, headers }),
  bootstrapSession,
};
