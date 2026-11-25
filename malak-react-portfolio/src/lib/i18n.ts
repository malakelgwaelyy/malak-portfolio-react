import languageData from '../../shared/languages.json';

export type LanguageEntry = { code: string; name: string; native: string };
export const DEFAULT_LANGUAGE = 'id';
const STORAGE_KEY = 'portfolio.lang';
const RTL = new Set(['ar', 'iw', 'fa', 'ur', 'ps', 'sd', 'ug', 'ckb', 'dv', 'yi']);

function nativeName(code: string, fallback: string) {
  try {
    const value = new Intl.DisplayNames([code], { type: 'language' }).of(code);
    return value && value !== code ? value : fallback;
  } catch {
    return fallback;
  }
}

let cache: LanguageEntry[] | null = null;
export function getLanguages(): LanguageEntry[] {
  if (!cache)
    cache = (languageData as [string, string][])
      .map(([code, name]) => ({ code, name, native: nativeName(code, name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  return cache;
}
export const languageName = (code: string) =>
  getLanguages().find((item) => item.code === code)?.name ?? code;

export function storedLanguage(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}
export function storeLanguage(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* storage unavailable */
  }
}

/** Visitors may only choose a language while the admin has "Mode bahasa" enabled. */
export function effectiveLanguage(settings?: { languageMode: boolean; language: string }) {
  const base = settings?.language || DEFAULT_LANGUAGE;
  if (!settings?.languageMode) return base;
  const chosen = storedLanguage();
  return chosen && getLanguages().some((item) => item.code === chosen) ? chosen : base;
}

let patched = false;
// Google's translator rewrites text nodes; this keeps React from throwing on stale nodes.
function patchDom() {
  if (patched) return;
  patched = true;
  const remove = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return remove.call(this, child) as T;
  };
  const insert = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    this: Node,
    node: T,
    reference: Node | null,
  ): T {
    if (reference && reference.parentNode !== this) return node;
    return insert.call(this, node, reference) as T;
  };
}

function readCookie() {
  const match = document.cookie.match(/(?:^|; )googtrans=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}
function writeCookie(value: string) {
  const base = `googtrans=${value}; path=/`;
  document.cookie = value ? `${base}; max-age=31536000; samesite=lax` : `${base}; max-age=0`;
}

let scriptLoaded = false;
type GoogleWindow = Window & {
  google?: { translate: { TranslateElement: new (o: object, id: string) => unknown } };
  __portfolioTranslateInit?: () => void;
};
function loadTranslator() {
  if (scriptLoaded) return;
  scriptLoaded = true;
  patchDom();
  const w = window as GoogleWindow;
  if (!document.getElementById('google_translate_element')) {
    const holder = document.createElement('div');
    holder.id = 'google_translate_element';
    holder.setAttribute('aria-hidden', 'true');
    document.body.appendChild(holder);
  }
  w.__portfolioTranslateInit = () => {
    new w.google!.translate.TranslateElement(
      { pageLanguage: 'auto', autoDisplay: false },
      'google_translate_element',
    );
  };
  const script = document.createElement('script');
  script.src =
    'https://translate.google.com/translate_a/element.js?cb=__portfolioTranslateInit';
  script.async = true;
  document.head.appendChild(script);
}

/** Applies the language to the public site. Reloads only to undo an applied translation. */
export function applyLanguage(code: string) {
  const html = document.documentElement;
  html.lang = code === 'iw' ? 'he' : code;
  html.dir = RTL.has(code) ? 'rtl' : 'ltr';
  const wanted = code === DEFAULT_LANGUAGE ? '' : `/auto/${code}`;
  if (readCookie() === wanted && (wanted === '' || scriptLoaded)) return;
  writeCookie(wanted);
  if (scriptLoaded) {
    window.location.reload();
    return;
  }
  if (wanted) loadTranslator();
}
