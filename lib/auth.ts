export const LOGIN_REDIRECT_KEY = "auth_login_redirect_path";
export const LEGACY_LAPQUEST_LOGIN_KEY = "lapquest_login_intent";

export function getLoginRedirect(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LOGIN_REDIRECT_KEY);
}

export function setLoginRedirect(path: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOGIN_REDIRECT_KEY, path);
}

export function consumeLoginRedirect(): string | null {
  if (typeof window === "undefined") return null;
  const target = window.localStorage.getItem(LOGIN_REDIRECT_KEY);
  if (target) {
    window.localStorage.removeItem(LOGIN_REDIRECT_KEY);
  }
  return target;
}
