import { useMemo, useState } from 'react';
import { Check, Globe, Languages, Search } from 'lucide-react';
import { getLanguages, languageName } from '../../lib/i18n';
import type { AppSettings } from '../../types';

export function LanguageEditor({
  value,
  onChange,
}: {
  value: AppSettings;
  onChange: (value: AppSettings) => void;
}) {
  const [query, setQuery] = useState('');
  const all = getLanguages();
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (item) =>
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.native.toLowerCase().includes(q) ||
        item.code.toLowerCase() === q,
    );
  }, [all, query]);
  return (
    <>
      <div className="admin-section-title">
        <Languages size={20} />
        <div>
          <h2>Bahasa aplikasi.</h2>
          <p>
            Pilih bahasa dasar website dari {all.length} bahasa. Terjemahan dibuat otomatis
            (mesin), jadi periksa hasilnya untuk bahasa penting.
          </p>
        </div>
      </div>
      <label className="admin-checkbox lang-mode-toggle">
        <input
          type="checkbox"
          checked={value.languageMode}
          onChange={(event) => onChange({ ...value, languageMode: event.target.checked })}
        />
        <span>
          <strong>Aktifkan mode bahasa</strong>
          <small>
            {value.languageMode
              ? 'Aktif: pengunjung melihat tombol bahasa di header dan bisa memilih sendiri.'
              : 'Nonaktif: pengunjung tidak bisa memilih bahasa. Website memakai bahasa dasar di bawah.'}
          </small>
        </span>
      </label>
      <div className="lang-current">
        <Globe size={16} />
        Bahasa dasar saat ini: <strong>{languageName(value.language)}</strong>
        {value.language === 'id' && <em>(asli, tanpa terjemahan)</em>}
      </div>
      <label className="lang-admin-search">
        <Search size={15} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Cari di ${all.length} bahasa...`}
          aria-label="Cari bahasa"
        />
        <span>{list.length} bahasa</span>
      </label>
      <div className="lang-grid" role="radiogroup" aria-label="Bahasa dasar aplikasi">
        {list.map((item) => (
          <button
            type="button"
            key={item.code}
            role="radio"
            aria-checked={item.code === value.language}
            className={item.code === value.language ? 'selected' : ''}
            onClick={() => onChange({ ...value, language: item.code })}
          >
            <span>
              <strong translate="no">{item.native}</strong>
              <small>{item.name}</small>
            </span>
            {item.code === value.language ? <Check size={15} /> : <code>{item.code}</code>}
          </button>
        ))}
      </div>
    </>
  );
}
