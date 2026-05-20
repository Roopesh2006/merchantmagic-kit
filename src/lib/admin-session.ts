// Client-side helpers to persist the admin session token in localStorage,
// keyed by shop slug so multiple shops can be administered from one browser.

const key = (slug: string) => `sellerproduct.admin.${slug}`;

export function saveSession(slug: string, token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(slug), token);
}

export function loadSession(slug: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key(slug));
}

export function clearSession(slug: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(slug));
}
