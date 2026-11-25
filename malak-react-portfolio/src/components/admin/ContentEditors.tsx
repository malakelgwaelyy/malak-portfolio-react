import { ArrowDown, ArrowUp, Code2, GraduationCap, IdCard, Plus, Trash2, Type } from 'lucide-react';
import { Field, ImageField } from './Fields';
import IdentityBadge from '../IdentityBadge';
import type { Education, Framework, IdentityCardContent, Profile } from '../../types';

export function CardEditor({
  value,
  profile,
  onChange,
  onError,
}: {
  value: IdentityCardContent;
  profile: Profile;
  onChange: (value: IdentityCardContent) => void;
  onError: (error: string) => void;
}) {
  const update = (key: keyof IdentityCardContent, next: string) =>
    onChange({ ...value, [key]: next });
  const groups: { title: string; fields: [keyof IdentityCardContent, string, string?][] }[] = [
    {
      title: 'Teks di bagian atas',
      fields: [
        ['heading', 'Label kartu'],
        ['roleText', 'Role pada kartu', 'Kosongkan untuk mengikuti profesi di profil.'],
        ['titleLineOne', 'Judul kartu: baris pertama'],
        ['titleLineTwo', 'Judul kartu: baris kedua'],
        ['mark', 'Simbol dekoratif kartu'],
        ['editionLabel', 'Label edisi'],
        ['editionYear', 'Tahun pada kartu'],
      ],
    },
    {
      title: 'Identitas & detail kecil',
      fields: [
        ['displayName', 'Nama pada kartu', 'Kosongkan untuk mengikuti nama profil.'],
        ['brandText', 'Brand pada kartu', 'Kosongkan untuk mengikuti wordmark profil.'],
        ['identifier', 'Nomor / kode identitas'],
        ['photoCaption', 'Caption di samping foto'],
        ['footerLineOne', 'Footer kartu: baris pertama'],
        ['footerLineTwo', 'Footer kartu: baris kedua'],
        ['strapText', 'Teks pada tali'],
        ['dragHint', 'Petunjuk tarik kartu'],
        ['keyboardHint', 'Petunjuk keyboard kartu'],
        ['resetLabel', 'Label tombol reset'],
      ],
    },
  ];
  return (
    <>
      <div className="admin-section-title">
        <IdCard size={21} />
        <div>
          <h2>Your identity. Every little detail.</h2>
          <p>Semua teks, warna, foto, logo, dan tanda tangan pada kartu dapat diubah di sini.</p>
        </div>
      </div>
      <div className="admin-card-layout">
        <div className="admin-card-form">
          {groups.map((group) => (
            <div className="admin-editor-section" key={group.title}>
              <h3>{group.title}</h3>
              <div className="admin-form-grid">
                {group.fields.map(([key, label, hint]) => (
                  <Field key={key} label={label} hint={hint}>
                    <input
                      value={value[key]}
                      maxLength={key.includes('Line') ? 100 : 250}
                      onChange={(event) => update(key, event.target.value)}
                    />
                  </Field>
                ))}
              </div>
            </div>
          ))}
          <div className="admin-editor-section">
            <h3>Foto & transformasi Black Suit</h3>
            <ImageField
              value={value.portrait || profile.portrait}
              onChange={(url) => update('portrait', url)}
              label="Foto dalam kartu"
              onError={onError}
            />
            <Field label="URL foto dalam kartu" hint="Kosongkan untuk menggunakan foto profil.">
              <input
                value={value.portrait}
                onChange={(event) => update('portrait', event.target.value)}
              />
            </Field>
            <ImageField
              value={value.portraitHover || profile.portraitHover}
              onChange={(url) => update('portraitHover', url)}
              label="Foto Black Suit dalam kartu"
              onError={onError}
            />
            <Field
              label="URL foto Black Suit kartu"
              hint="Gunakan foto dengan pose dan crop yang sama. Ini transisi dua gambar, bukan pemrosesan AI real-time."
            >
              <input
                value={value.portraitHover}
                onChange={(event) => update('portraitHover', event.target.value)}
              />
            </Field>
          </div>
          <div className="admin-editor-section">
            <h3>Tanda tangan & logo</h3>
            <Field label="Teks tanda tangan">
              <input
                value={value.signatureText}
                maxLength={60}
                onChange={(event) => update('signatureText', event.target.value)}
              />
            </Field>
            <ImageField
              value={value.signatureImage}
              onChange={(url) => update('signatureImage', url)}
              label="Gambar tanda tangan"
              onError={onError}
            />
            <Field
              label="URL gambar tanda tangan"
              hint="Opsional. Gunakan PNG transparan, atau kosongkan untuk tanda tangan teks beranimasi."
            >
              <input
                value={value.signatureImage}
                onChange={(event) => update('signatureImage', event.target.value)}
              />
            </Field>
            <ImageField
              value={value.logoImage}
              onChange={(url) => update('logoImage', url)}
              label="Logo dalam kartu"
              onError={onError}
            />
            <Field label="URL logo dalam kartu" hint="Kosongkan untuk monogram dari nama brand.">
              <input
                value={value.logoImage}
                onChange={(event) => update('logoImage', event.target.value)}
              />
            </Field>
          </div>
          <div className="admin-editor-section">
            <h3>Warna cetak</h3>
            <div className="admin-form-grid">
              {(
                [
                  ['accentColor', 'Warna aksen kartu'],
                  ['paperColor', 'Warna kertas kartu'],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <span className="admin-color-field">
                    <input
                      type="color"
                      value={value[key]}
                      aria-label={label}
                      onChange={(event) => update(key, event.target.value)}
                    />
                    <span>{value[key]}</span>
                  </span>
                </Field>
              ))}
            </div>
          </div>
        </div>
        <aside className="admin-card-preview">
          <span className="eyebrow">LIVE IDENTITY PREVIEW</span>
          <IdentityBadge profile={profile} card={value} />
          <p>
            Pratinjau langsung. Simpan perubahan agar kartu baru tampil kepada seluruh pengunjung.
          </p>
        </aside>
      </div>
    </>
  );
}

function CollectionActions({
  index,
  count,
  name,
  move,
  remove,
}: {
  index: number;
  count: number;
  name: string;
  move: (direction: number) => void;
  remove: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        className="icon-button"
        aria-label={`Pindahkan ${name} ke atas`}
        disabled={index === 0}
        onClick={() => move(-1)}
      >
        <ArrowUp size={15} />
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label={`Pindahkan ${name} ke bawah`}
        disabled={index === count - 1}
        onClick={() => move(1)}
      >
        <ArrowDown size={15} />
      </button>
      <button
        type="button"
        className="icon-button danger-text"
        aria-label={`Hapus ${name}`}
        onClick={remove}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function moveItem<T>(items: T[], index: number, direction: number) {
  const next = [...items];
  [next[index], next[index + direction]] = [next[index + direction], next[index]];
  return next;
}

export function EducationEditor({
  value,
  onChange,
  onError,
}: {
  value: Education[];
  onChange: (items: Education[]) => void;
  onError: (error: string) => void;
}) {
  const update = (id: string, key: keyof Education, next: string) =>
    onChange(value.map((item) => (item.id === id ? { ...item, [key]: next } : item)));
  return (
    <>
      <div className="admin-section-title">
        <GraduationCap size={22} />
        <div>
          <h2>Every chapter matters.</h2>
          <p>
            Tambah, edit, hapus, dan urutkan sekolahmu. Riwayat awal adalah data contoh, bukan data
            pendidikan asli.
          </p>
        </div>
      </div>
      <div className="admin-collection">
        {value.map((item, index) => (
          <section className="admin-collection-item" key={item.id}>
            <div className="collection-heading">
              <div>
                <GraduationCap size={19} />
                <h3>{item.school || `Sekolah ${index + 1}`}</h3>
              </div>
              <CollectionActions
                index={index}
                count={value.length}
                name={item.school || 'sekolah'}
                move={(direction) => onChange(moveItem(value, index, direction))}
                remove={() => onChange(value.filter((entry) => entry.id !== item.id))}
              />
            </div>
            <div className="admin-form-grid">
              <Field label="Nama sekolah / universitas">
                <input
                  required
                  value={item.school}
                  maxLength={250}
                  onChange={(event) => update(item.id, 'school', event.target.value)}
                />
              </Field>
              <Field label="Jurusan / jenjang pendidikan">
                <input
                  value={item.degree}
                  maxLength={250}
                  onChange={(event) => update(item.id, 'degree', event.target.value)}
                />
              </Field>
              <Field label="Periode pendidikan" hint="Contoh: 2021 - 2025 atau 2024 - Sekarang">
                <input
                  value={item.period}
                  maxLength={100}
                  onChange={(event) => update(item.id, 'period', event.target.value)}
                />
              </Field>
              <Field label="Lokasi sekolah">
                <input
                  value={item.location}
                  maxLength={250}
                  onChange={(event) => update(item.id, 'location', event.target.value)}
                />
              </Field>
              <Field label="Cerita / pencapaian selama sekolah" wide>
                <textarea
                  rows={3}
                  value={item.description}
                  maxLength={3000}
                  onChange={(event) => update(item.id, 'description', event.target.value)}
                />
              </Field>
            </div>
            <ImageField
              value={item.logo}
              onChange={(url) => update(item.id, 'logo', url)}
              label={`Logo sekolah ${index + 1}`}
              onError={onError}
            />
            <Field label="URL logo sekolah" hint="Opsional. Kosongkan untuk ikon pendidikan.">
              <input
                value={item.logo}
                onChange={(event) => update(item.id, 'logo', event.target.value)}
              />
            </Field>
          </section>
        ))}
      </div>
      <button
        type="button"
        className="button secondary"
        onClick={() =>
          onChange([
            ...value,
            {
              id: crypto.randomUUID(),
              school: '',
              degree: '',
              period: '',
              location: '',
              description: '',
              logo: '',
            },
          ])
        }
      >
        <Plus size={16} />
        Tambah sekolah
      </button>
    </>
  );
}

export function FrameworkEditor({
  value,
  onChange,
  onError,
}: {
  value: Framework[];
  onChange: (items: Framework[]) => void;
  onError: (error: string) => void;
}) {
  const update = (id: string, key: keyof Framework, next: string) =>
    onChange(value.map((item) => (item.id === id ? { ...item, [key]: next } : item)));
  return (
    <>
      <div className="admin-section-title">
        <Code2 size={22} />
        <div>
          <h2>The right tools for good ideas.</h2>
          <p>Atur framework, kategori, deskripsi, ikon, dan urutan toolkit di website.</p>
        </div>
      </div>
      <div className="admin-collection">
        {value.map((item, index) => (
          <section className="admin-collection-item" key={item.id}>
            <div className="collection-heading">
              <div>
                <Code2 size={18} />
                <h3>{item.name || `Framework ${index + 1}`}</h3>
              </div>
              <CollectionActions
                index={index}
                count={value.length}
                name={item.name || 'framework'}
                move={(direction) => onChange(moveItem(value, index, direction))}
                remove={() => onChange(value.filter((entry) => entry.id !== item.id))}
              />
            </div>
            <div className="admin-form-grid">
              <Field label="Nama framework / teknologi">
                <input
                  required
                  value={item.name}
                  maxLength={200}
                  onChange={(event) => update(item.id, 'name', event.target.value)}
                />
              </Field>
              <Field label="Kategori framework">
                <input
                  value={item.category}
                  maxLength={200}
                  onChange={(event) => update(item.id, 'category', event.target.value)}
                />
              </Field>
              <Field label="Ikon bawaan">
                <select
                  value={item.symbol}
                  onChange={(event) => update(item.id, 'symbol', event.target.value)}
                >
                  <option value="react">React</option>
                  <option value="nextjs">Next.js</option>
                  <option value="typescript">TypeScript</option>
                  <option value="tailwind">Tailwind CSS</option>
                  <option value="gsap">GSAP / Motion</option>
                  <option value="nodejs">Node.js</option>
                </select>
              </Field>
              <Field
                label="URL logo framework"
                hint="Opsional. Gambar custom menggantikan ikon bawaan."
              >
                <input
                  value={item.logo}
                  onChange={(event) => update(item.id, 'logo', event.target.value)}
                />
              </Field>
              <Field label="Deskripsi framework" wide>
                <textarea
                  rows={3}
                  value={item.description}
                  maxLength={3000}
                  onChange={(event) => update(item.id, 'description', event.target.value)}
                />
              </Field>
            </div>
            <ImageField
              value={item.logo}
              onChange={(url) => update(item.id, 'logo', url)}
              label={`Logo framework ${index + 1}`}
              onError={onError}
            />
          </section>
        ))}
      </div>
      <button
        type="button"
        className="button secondary"
        onClick={() =>
          onChange([
            ...value,
            {
              id: crypto.randomUUID(),
              name: '',
              category: '',
              description: '',
              symbol: 'gsap',
              logo: '',
            },
          ])
        }
      >
        <Plus size={16} />
        Tambah framework
      </button>
    </>
  );
}

export function CopyEditor({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (copy: Record<string, string>) => void;
}) {
  return (
    <section className="microcopy-editor">
      <h3>
        <Type size={18} /> Labels & microcopy
      </h3>
      <p>
        Ubah juga teks navigasi, tombol, deskripsi, form kontak, dan footer. Perubahan tidak
        mengubah fungsi tombol.
      </p>
      <div className="admin-form-grid">
        {Object.entries(value).map(([key, text]) => (
          <Field key={key} label={`Teks / ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`}>
            <textarea
              rows={text.length > 120 ? 3 : 2}
              maxLength={6000}
              value={text}
              onChange={(event) => onChange({ ...value, [key]: event.target.value })}
            />
          </Field>
        ))}
      </div>
    </section>
  );
}
