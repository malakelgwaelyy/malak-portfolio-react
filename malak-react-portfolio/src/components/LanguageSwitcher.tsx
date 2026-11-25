import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Globe, Search } from 'lucide-react';
import { getLanguages, languageName, storeLanguage } from '../lib/i18n';

export default function LanguageSwitcher({
  current,
  onSelect,
  variant = 'desktop',
}: {
  current: string;
  onSelect: (code: string) => void;
  variant?: 'desktop' | 'mobile';
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return getLanguages().filter(
      (item) =>
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.native.toLowerCase().includes(q) ||
        item.code.toLowerCase() === q,
    );
  }, [query]);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') setOpen(false);
      } else if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);
  return (
    <div className={`lang-switcher ${variant}`} ref={root} translate="no">
      <button
        type="button"
        className="lang-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Bahasa: ${languageName(current)}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe size={15} />
        <span>{current.split('-')[0].toUpperCase()}</span>
      </button>
      {open && (
        <div className="lang-popover" data-lenis-prevent>
          <label className="lang-search">
            <Search size={14} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari bahasa..."
              aria-label="Cari bahasa"
            />
          </label>
          <ul role="listbox" aria-label="Pilih bahasa">
            {list.map((item) => (
              <li key={item.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={item.code === current}
                  className={item.code === current ? 'selected' : ''}
                  onClick={() => {
                    setOpen(false);
                    storeLanguage(item.code);
                    onSelect(item.code);
                  }}
                >
                  <span>
                    {item.native}
                    <small>{item.name}</small>
                  </span>
                  {item.code === current && <Check size={14} />}
                </button>
              </li>
            ))}
            {!list.length && <li className="lang-empty">Bahasa tidak ditemukan.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
