import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  IdCard,
  Code2,
  Folder,
  Languages,
  ImagePlus,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { api, setCsrfToken, uploadImage } from '../lib/api';
import type {
  AuthState,
  Content,
  Message,
  Navigate,
  PageContent,
  Profile,
  Project,
} from '../types';
import Modal from '../components/Modal';
import { LanguageEditor } from '../components/admin/LanguageEditor';
import { Field, ImageField } from '../components/admin/Fields';
import {
  CardEditor,
  CopyEditor,
  EducationEditor,
  FrameworkEditor,
} from '../components/admin/ContentEditors';

type Tab =
  | 'overview'
  | 'profile'
  | 'card'
  | 'education'
  | 'frameworks'
  | 'projects'
  | 'skills'
  | 'pages'
  | 'contact'
  | 'language'
  | 'inbox'
  | 'security';
const tabs: { id: Tab; label: string; icon: typeof UserRound }[] = [
  { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'profile', label: 'Profil saya', icon: UserRound },
  { id: 'card', label: 'Kartu identitas', icon: IdCard },
  { id: 'education', label: 'Riwayat sekolah', icon: GraduationCap },
  { id: 'frameworks', label: 'Frameworks', icon: Code2 },
  { id: 'projects', label: 'Projects', icon: Folder },
  { id: 'skills', label: 'Skills & services', icon: Sparkles },
  { id: 'pages', label: 'Konten halaman', icon: FileText },
  { id: 'contact', label: 'Informasi kontak', icon: Mail },
  { id: 'language', label: 'Bahasa', icon: Languages },
  { id: 'inbox', label: 'Pesan masuk', icon: Mail },
  { id: 'security', label: 'Keamanan', icon: ShieldCheck },
];
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.';
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function PasswordForm({
  force = false,
  onAuthChange,
}: {
  force?: boolean;
  onAuthChange: (auth: AuthState) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setError('');
    setSuccess(false);
    if (values.newPassword !== values.confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }
    setBusy(true);
    try {
      const next = await api<AuthState>('/auth/password', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setCsrfToken(next.csrfToken);
      onAuthChange(next);
      form.reset();
      setSuccess(true);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="admin-form password-form" onSubmit={submit}>
      <Field label="Password saat ini">
        <input
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </Field>
      <Field label="Password baru" hint="Minimal 10 karakter, terdiri dari huruf dan angka.">
        <input
          type="password"
          name="newPassword"
          autoComplete="new-password"
          minLength={10}
          maxLength={128}
          pattern="(?=.*[A-Za-z])(?=.*[0-9]).{10,}"
          required
        />
      </Field>
      <Field label="Konfirmasi password baru">
        <input
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={10}
          maxLength={128}
          required
        />
      </Field>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="admin-success" role="status">
          <CheckCheck size={17} />
          Password berhasil diganti. Sesi perangkat lain telah diakhiri.
        </p>
      )}
      <button type="submit" className="button primary" disabled={busy}>
        {busy ? <LoaderCircle size={16} className="spin" /> : <LockKeyhole size={16} />}{' '}
        {force ? 'Ganti password & masuk studio' : 'Perbarui password'}
      </button>
    </form>
  );
}

function ProjectEditor({
  project,
  onClose,
  onSaved,
}: {
  project: Project;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [draft, setDraft] = useState(clone(project));
  const [tools, setTools] = useState(project.tools.join(', '));
  const [gallery, setGallery] = useState(project.gallery.join('\n'));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!project.id);
  const change = <K extends keyof Project>(key: K, value: Project[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = {
        ...draft,
        tools: tools
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        gallery: gallery
          .split('\n')
          .map((value) => value.trim())
          .filter(Boolean),
      };
      await api(`/admin/projects${project.id ? `/${project.id}` : ''}`, {
        method: project.id ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      await onSaved();
      onClose();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={project.id ? 'Edit project' : 'Tambah project'}
      onClose={onClose}
      className="project-editor"
    >
      <span className="eyebrow">THE PROJECT STUDIO</span>
      <h2>{project.id ? 'Refine your work.' : 'Make room for good work.'}</h2>
      <p className="admin-muted">Project yang disimpan langsung tampil kepada semua pengunjung.</p>
      <form className="admin-form" onSubmit={submit}>
        <ImageField
          value={draft.image}
          onChange={(url) => change('image', url)}
          label="Cover project"
          onError={setError}
        />
        <div className="admin-form-grid">
          <Field label="Judul project">
            <input
              required
              value={draft.title}
              maxLength={200}
              onChange={(event) => {
                change('title', event.target.value);
                if (!slugTouched) change('slug', slugify(event.target.value));
              }}
            />
          </Field>
          <Field label="URL slug" hint="Huruf kecil, angka, dan tanda hubung.">
            <input
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={draft.slug}
              onChange={(event) => {
                setSlugTouched(true);
                change('slug', event.target.value);
              }}
            />
          </Field>
          <Field label="Kategori">
            <select
              value={draft.category}
              onChange={(event) => change('category', event.target.value)}
            >
              <option>Web Development</option>
              <option>UI/UX Design</option>
            </select>
          </Field>
          <Field label="Tahun">
            <input
              required
              value={draft.year}
              maxLength={20}
              onChange={(event) => change('year', event.target.value)}
            />
          </Field>
          <Field label="Ringkasan singkat" wide>
            <textarea
              value={draft.summary}
              required
              maxLength={500}
              rows={2}
              onChange={(event) => change('summary', event.target.value)}
            />
          </Field>
          <Field label="Cerita project" wide>
            <textarea
              value={draft.description}
              required
              maxLength={10000}
              rows={4}
              onChange={(event) => change('description', event.target.value)}
            />
          </Field>
          <Field label="Pendekatan / tantangan" wide>
            <textarea
              value={draft.challenge}
              maxLength={10000}
              rows={3}
              onChange={(event) => change('challenge', event.target.value)}
            />
          </Field>
          <Field label="Teknologi" hint="Pisahkan dengan koma.">
            <input value={tools} onChange={(event) => setTools(event.target.value)} />
          </Field>
          <Field label="Link website (opsional)">
            <input
              type="url"
              placeholder="https://"
              value={draft.url}
              onChange={(event) => change('url', event.target.value)}
            />
          </Field>
          <Field label="URL gambar cover" wide>
            <input
              value={draft.image}
              required
              placeholder="/uploads/... atau https://..."
              onChange={(event) => change('image', event.target.value)}
            />
          </Field>
          <Field
            label="Galeri project (opsional)"
            wide
            hint="Satu URL gambar per baris. Atau unggah gambar melalui tombol di bawah."
          >
            <textarea
              rows={3}
              value={gallery}
              onChange={(event) => setGallery(event.target.value)}
            />
          </Field>
        </div>
        <label className="gallery-upload text-button">
          <ImagePlus size={16} /> Tambah gambar galeri
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try {
                const url = await uploadImage(file);
                setGallery((current) => [current, url].filter(Boolean).join('\n'));
              } catch (error) {
                setError(errorText(error));
              } finally {
                setBusy(false);
                event.target.value = '';
              }
            }}
          />
        </label>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(event) => change('featured', event.target.checked)}
          />
          Tandai sebagai featured project
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Batal
          </button>
          <button className="button primary" type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}Simpan project
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Admin({
  content,
  onContentChange,
  navigate,
}: {
  content: Content;
  onContentChange: (content: Content) => void;
  navigate: Navigate;
}) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [draft, setDraft] = useState<Content>(clone(content));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeMessage, setActiveMessage] = useState<Message | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const sidebarRef = useRef<HTMLElement>(null);
  const updateAuth = (next: AuthState) => {
    setCsrfToken(next.csrfToken);
    setAuth(next);
  };
  useEffect(() => {
    api<AuthState>('/auth/me')
      .then(updateAuth)
      .catch((error) => setError(errorText(error)));
  }, []);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)');
    const change = () => setMobile(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (!sidebar || !mobile || !sidebarRef.current) return;
    const panel = sidebarRef.current;
    const previous = document.activeElement as HTMLElement | null;
    const before = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const controls = () =>
      Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')).filter(
        (element) => element.getClientRects().length,
      );
    controls()[0]?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSidebar(false);
      }
      if (event.key !== 'Tab') return;
      const items = controls();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => {
      document.documentElement.style.overflow = before;
      document.removeEventListener('keydown', keyboard);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [sidebar, mobile]);
  useEffect(() => {
    if (!dirty) setDraft(clone(content));
  }, [content, dirty]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!dirty) return;
    const before = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, [dirty]);
  useEffect(() => {
    if (auth?.authenticated && !auth.mustChangePassword)
      api<Message[]>('/admin/messages')
        .then(setMessages)
        .catch((error) => setError(errorText(error)));
  }, [auth, tab]);
  const updateProfile = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDraft((current) => ({ ...current, profile: { ...current.profile, [key]: value } }));
    setDirty(true);
  };
  const updateSection = <K extends keyof Content>(key: K, value: Content[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };
  const updatePage = (key: keyof PageContent, value: string) => {
    setDraft((current) => ({ ...current, pages: { ...current.pages, [key]: value } }));
    setDirty(true);
  };
  const refresh = async () => {
    const updated = await api<Content>('/content');
    onContentChange(updated);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const updated = await api<Content>('/admin/content', {
        method: 'PUT',
        body: JSON.stringify(draft),
      });
      onContentChange(updated);
      setDraft(clone(updated));
      setDirty(false);
      setToast('Perubahan disimpan dan sudah tampil di website.');
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const next = await api<AuthState>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      updateAuth(next);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  const leave = () => {
    if (!dirty || window.confirm('Ada perubahan yang belum disimpan. Tetap tinggalkan studio?'))
      navigate('/');
  };

  if (!auth || !auth.authenticated || auth.mustChangePassword)
    return (
      <main className="admin-auth">
        <a
          className="auth-back animated-link"
          href="/"
          onClick={(event) => {
            event.preventDefault();
            navigate('/');
          }}
        >
          <ArrowLeft size={15} />
          Back to portfolio
        </a>
        <div className="auth-composition">
          <div className="auth-story">
            <a
              className="wordmark"
              href="/"
              onClick={(event) => {
                event.preventDefault();
                navigate('/');
              }}
            >
              {content.profile.brand}
              <span>.</span>
              <span className="studio-label">/ STUDIO</span>
            </a>
            <span className="eyebrow">A SPACE FOR YOUR IDEAS</span>
            <h1>
              Your work.
              <br />
              Your story.
              <br />
              <span>Your studio.</span>
            </h1>
            <p>
              Ruang kecil untuk merawat semua hal baik
              <br />
              yang sedang kamu bangun.
            </p>
            <div className="auth-line" />
            <span className="auth-footnote">THOUGHTFULLY DESIGNED. ENTIRELY YOURS.</span>
          </div>
          <div className="auth-form-side">
            {auth?.mustChangePassword ? (
              <>
                <span className="auth-icon">
                  <LockKeyhole size={26} />
                </span>
                <span className="eyebrow">FIRST THINGS FIRST</span>
                <h2>
                  Make it yours.
                  <br />
                  Keep it secure.
                </h2>
                <p>Password awal wajib diganti sebelum kamu bisa mengelola portfolio.</p>
                <PasswordForm force onAuthChange={updateAuth} />
              </>
            ) : (
              <>
                <span className="auth-icon">
                  <ShieldCheck size={27} />
                </span>
                <span className="eyebrow">WELCOME BACK</span>
                <h2>
                  A little behind
                  <br />
                  the scenes.
                </h2>
                <p>Masuk untuk mengelola karya dan cerita kamu.</p>
                {!auth && !error ? (
                  <div className="auth-loading">
                    <LoaderCircle className="spin" size={22} />
                    Menghubungkan ke studio...
                  </div>
                ) : (
                  <form className="admin-form" onSubmit={login}>
                    <Field label="Username">
                      <input
                        name="username"
                        autoComplete="username"
                        required
                        maxLength={100}
                      />
                    </Field>
                    <Field label="Password">
                      <span className="password-input">
                        <input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          maxLength={128}
                        />
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </span>
                    </Field>
                    {error && (
                      <p className="form-error" role="alert">
                        {error}
                      </p>
                    )}
                    <button className="button primary" disabled={busy || !auth} type="submit">
                      {busy ? (
                        <LoaderCircle size={17} className="spin" />
                      ) : (
                        <>
                          Enter the studio
                          <ArrowRight size={17} />
                        </>
                      )}
                    </button>
                    {!auth && (
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => {
                          setError('');
                          api<AuthState>('/auth/me')
                            .then(updateAuth)
                            .catch((error) => setError(errorText(error)));
                        }}
                      >
                        Coba hubungkan kembali <ArrowRight size={15} />
                      </button>
                    )}
                  </form>
                )}
              </>
            )}
          </div>
        </div>
        <div className="auth-copyright">
          &copy; {new Date().getFullYear()} {content.profile.name} / Private workspace
        </div>
      </main>
    );

  const settingsTab = [
    'profile',
    'card',
    'education',
    'frameworks',
    'skills',
    'pages',
    'contact',
    'language',
  ].includes(tab);
  const unread = messages.filter((message) => !message.is_read).length;
  const newProject: Project = {
    id: '',
    slug: '',
    title: '',
    category: 'Web Development',
    year: String(new Date().getFullYear()),
    summary: '',
    description: '',
    challenge: '',
    image: '',
    gallery: [],
    tools: [],
    url: '',
    featured: false,
  };
  const pageLabels: Record<keyof PageContent, string> = {
    heroGreeting: 'Hero: sapaan',
    heroLineOne: 'Hero: baris pertama',
    heroLineTwo: 'Hero: baris kedua',
    heroEyebrow: 'Hero: teks kecil',
    aboutTitle: 'About: judul section',
    aboutHeadline: 'About: headline (baris baru didukung)',
    skillsTitle: 'Skills: judul (baris baru didukung)',
    educationTitle: 'Pendidikan: judul section',
    educationDescription: 'Pendidikan: deskripsi section',
    frameworksTitle: 'Frameworks: judul section',
    frameworksDescription: 'Frameworks: deskripsi section',
    projectsTitle: 'Projects: judul section',
    projectsDescription: 'Projects: deskripsi section',
    contactTitle: 'Contact: judul (baris baru didukung)',
    contactDescription: 'Contact: deskripsi',
    footerNote: 'Footer: catatan pendek',
  };
  return (
    <div className="admin-app">
      <aside
        ref={sidebarRef}
        inert={mobile && !sidebar}
        aria-label="Navigasi studio"
        className={`admin-sidebar ${sidebar ? 'open' : ''}`}
      >
        <div className="sidebar-brand">
          <a
            className="wordmark"
            href="/"
            onClick={(event) => {
              event.preventDefault();
              leave();
            }}
          >
            {content.profile.brand}
            <span>.</span>
          </a>
          <span>STUDIO</span>
          <button
            className="icon-button sidebar-close"
            aria-label="Tutup sidebar"
            onClick={() => setSidebar(false)}
          >
            <X size={20} />
          </button>
        </div>
        <span className="sidebar-label">YOUR WORKSPACE</span>
        <nav aria-label="Navigasi studio">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'active' : ''}
              onClick={() => {
                setTab(id);
                setSidebar(false);
                setError('');
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
              {id === 'inbox' && unread > 0 && <span className="inbox-count">{unread}</span>}
              {tab === id && <ChevronRight size={14} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="storage-status">
            <span className="status-dot" />
            SQLite connected<span>SERVER-SIDE STORAGE</span>
          </div>
          <button className="sidebar-preview" onClick={leave}>
            <ExternalLink size={16} />
            Lihat website
            <ArrowUpRight size={14} />
          </button>
          <button
            className="sidebar-logout"
            onClick={async () => {
              if (dirty && !window.confirm('Keluar tanpa menyimpan perubahan?')) return;
              try {
                await api('/auth/logout', { method: 'POST' });
                setDirty(false);
                const next = await api<AuthState>('/auth/me');
                updateAuth(next);
              } catch (error) {
                setError(errorText(error));
              }
            }}
          >
            <LogOut size={16} />
            Keluar studio
          </button>
        </div>
      </aside>
      {sidebar && (
        <button
          className="sidebar-backdrop"
          aria-label="Tutup sidebar"
          onClick={() => setSidebar(false)}
        />
      )}
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <button
              className="icon-button admin-menu-button"
              aria-label="Buka navigasi studio"
              aria-expanded={sidebar}
              onClick={() => setSidebar(true)}
            >
              <Menu size={21} />
            </button>
            <span>Studio</span>
            <ChevronRight size={13} />
            <span>{tabs.find((item) => item.id === tab)?.label}</span>
          </div>
          <span className="admin-identity">
            <span className="admin-avatar">{content.profile.firstName.slice(0, 1)}</span>
            {auth.username}
            <ShieldCheck size={14} />
          </span>
        </header>
        <main className="admin-content">
          <div className="admin-page-heading">
            <div>
              <span className="eyebrow">YOUR PORTFOLIO, THOUGHTFULLY MANAGED</span>
              <h1>
                {tab === 'overview'
                  ? `Hello, ${content.profile.firstName}.`
                  : tabs.find((item) => item.id === tab)?.label}
              </h1>
              <p>
                {tab === 'overview'
                  ? 'A little space to make a big impression.'
                  : 'Setiap detail kecil membentuk cerita yang besar.'}
              </p>
            </div>
            {settingsTab && (
              <div className="admin-save-actions">
                {dirty && (
                  <button
                    className="button secondary small"
                    onClick={() => {
                      setDraft(clone(content));
                      setDirty(false);
                    }}
                  >
                    Batalkan
                  </button>
                )}
                <button
                  form="admin-settings"
                  type="submit"
                  className="button primary small"
                  disabled={!dirty || busy}
                >
                  {busy ? <LoaderCircle size={15} className="spin" /> : <Save size={15} />}Simpan
                  perubahan
                </button>
              </div>
            )}
            {settingsTab && (
              <div className="admin-save-bottom">
                <span>Perubahan disimpan di server dan ditampilkan kepada semua pengunjung.</span>
                <button
                  className="button primary small"
                  form="admin-settings"
                  type="submit"
                  disabled={!dirty || busy}
                >
                  {busy ? <LoaderCircle size={15} className="spin" /> : <Save size={15} />}Simpan ke
                  website
                </button>
              </div>
            )}
            {tab === 'projects' && (
              <button className="button primary small" onClick={() => setEditing(newProject)}>
                <Plus size={16} />
                Tambah project
              </button>
            )}
          </div>
          {error && (
            <div className="admin-error-banner" role="alert">
              {error}
              <button
                className="icon-button"
                aria-label="Tutup pesan error"
                onClick={() => setError('')}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {dirty && settingsTab && (
            <p className="unsaved-note">
              <span />
              Ada perubahan yang belum disimpan.
            </p>
          )}
          {tab === 'overview' && (
            <>
              <div className="admin-overview-intro">
                <div>
                  <span className="eyebrow">A WORK IN PROGRESS. ALWAYS.</span>
                  <h2>
                    Good things
                    <br />
                    start here<span>.</span>
                  </h2>
                  <p>
                    Profil, karya, dan cerita kamu tersimpan di server dan dapat dilihat seluruh
                    pengunjung. Jadikan ruang ini milikmu.
                  </p>
                  <button className="text-button animated-link" onClick={() => setTab('profile')}>
                    Mulai dari profil kamu
                    <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="overview-quick-links">
                  <button onClick={() => setTab('projects')}>
                    <Folder size={23} />
                    <span>
                      <strong>{content.projects.length.toString().padStart(2, '0')}</strong>Projects
                      published
                    </span>
                    <ArrowUpRight size={20} />
                  </button>
                  <button onClick={() => setTab('skills')}>
                    <Sparkles size={23} />
                    <span>
                      <strong>{content.skills.length.toString().padStart(2, '0')}</strong>Skills &
                      services
                    </span>
                    <ArrowUpRight size={20} />
                  </button>
                  <button onClick={() => setTab('inbox')}>
                    <Mail size={23} />
                    <span>
                      <strong>{unread.toString().padStart(2, '0')}</strong>Unread conversations
                    </span>
                    <ArrowUpRight size={20} />
                  </button>
                </div>
              </div>
              <div className="admin-section-top">
                <h2>Your recent work</h2>
                <button className="text-button" onClick={() => setTab('projects')}>
                  Kelola semua
                  <ArrowRight size={15} />
                </button>
              </div>
              <div className="admin-project-list">
                {content.projects.slice(0, 3).map((project) => (
                  <button
                    className="admin-project-list-item"
                    key={project.id}
                    onClick={() => setEditing(project)}
                  >
                    <img src={project.image} alt={project.title} />
                    <span>
                      <strong>{project.title}</strong>
                      <small>{project.category}</small>
                    </span>
                    <span>{project.year}</span>
                    <Pencil size={16} />
                  </button>
                ))}
              </div>
              <p className="admin-placeholder-note">
                <CircleHelp size={16} />
                Identitas dan project awal adalah konten contoh. Ganti dengan karya dan informasi
                asli kamu.
              </p>
            </>
          )}
          {settingsTab && (
            <form id="admin-settings" className="admin-form admin-settings-form" onSubmit={save}>
              {tab === 'card' && (
                <CardEditor
                  value={draft.card}
                  profile={draft.profile}
                  onChange={(value) => updateSection('card', value)}
                  onError={setError}
                />
              )}
              {tab === 'education' && (
                <EducationEditor
                  value={draft.education}
                  onChange={(value) => updateSection('education', value)}
                  onError={setError}
                />
              )}
              {tab === 'frameworks' && (
                <FrameworkEditor
                  value={draft.frameworks}
                  onChange={(value) => updateSection('frameworks', value)}
                  onError={setError}
                />
              )}
              {tab === 'profile' && (
                <>
                  <div className="admin-section-title">
                    <UserRound size={20} />
                    <div>
                      <h2>The person behind the pixels.</h2>
                      <p>Identitas ini tampil di hero, kartu lanyard, About, dan footer.</p>
                    </div>
                  </div>
                  <ImageField
                    value={draft.profile.portrait}
                    onChange={(url) => updateProfile('portrait', url)}
                    label="Foto profil"
                    onError={setError}
                  />
                  <ImageField
                    value={draft.profile.portraitHover}
                    onChange={(url) => updateProfile('portraitHover', url)}
                    label="Foto Black Suit profil"
                    onError={setError}
                  />
                  <Field
                    label="URL foto Black Suit profil"
                    hint="Gunakan gambar dengan pose dan crop identik dengan foto profil."
                  >
                    <input
                      value={draft.profile.portraitHover}
                      onChange={(event) => updateProfile('portraitHover', event.target.value)}
                    />
                  </Field>
                  <div className="admin-form-grid">
                    <Field label="Nama lengkap">
                      <input
                        value={draft.profile.name}
                        required
                        maxLength={100}
                        onChange={(event) => updateProfile('name', event.target.value)}
                      />
                    </Field>
                    <Field label="Nama panggilan">
                      <input
                        value={draft.profile.firstName}
                        required
                        maxLength={30}
                        onChange={(event) => updateProfile('firstName', event.target.value)}
                      />
                    </Field>
                    <Field label="Wordmark / brand" hint="Tanpa titik. Contoh: vano">
                      <input
                        value={draft.profile.brand}
                        required
                        maxLength={25}
                        onChange={(event) => updateProfile('brand', event.target.value)}
                      />
                    </Field>
                    <Field label="Profesi / role">
                      <input
                        value={draft.profile.role}
                        required
                        maxLength={100}
                        onChange={(event) => updateProfile('role', event.target.value)}
                      />
                    </Field>
                    <Field label="Lokasi">
                      <input
                        value={draft.profile.location}
                        required
                        maxLength={100}
                        onChange={(event) => updateProfile('location', event.target.value)}
                      />
                    </Field>
                    <Field label="URL foto profil">
                      <input
                        value={draft.profile.portrait}
                        required
                        onChange={(event) => updateProfile('portrait', event.target.value)}
                      />
                    </Field>
                    <Field label="Intro singkat (hero)" wide>
                      <textarea
                        rows={3}
                        value={draft.profile.intro}
                        required
                        maxLength={1000}
                        onChange={(event) => updateProfile('intro', event.target.value)}
                      />
                    </Field>
                    <Field label="Tentang saya" wide>
                      <textarea
                        rows={4}
                        value={draft.profile.about}
                        required
                        maxLength={5000}
                        onChange={(event) => updateProfile('about', event.target.value)}
                      />
                    </Field>
                    <Field label="Cerita lanjutan" wide>
                      <textarea
                        rows={4}
                        value={draft.profile.aboutMore}
                        maxLength={5000}
                        onChange={(event) => updateProfile('aboutMore', event.target.value)}
                      />
                    </Field>
                  </div>
                </>
              )}
              {tab === 'contact' && (
                <>
                  <div className="admin-section-title">
                    <Mail size={20} />
                    <div>
                      <h2>Keep the conversation open.</h2>
                      <p>Kontak dan social links yang tampil kepada pengunjung.</p>
                    </div>
                  </div>
                  <div className="admin-form-grid">
                    <Field label="Email kontak" wide>
                      <input
                        type="email"
                        value={draft.profile.email}
                        required
                        onChange={(event) => updateProfile('email', event.target.value)}
                      />
                    </Field>
                    {(['github', 'instagram', 'linkedin'] as const).map((key) => (
                      <Field
                        key={key}
                        label={
                          key === 'github'
                            ? 'GitHub URL'
                            : key === 'instagram'
                              ? 'Instagram URL'
                              : 'LinkedIn URL'
                        }
                        wide
                      >
                        <input
                          type="url"
                          value={draft.profile[key]}
                          placeholder="https://"
                          onChange={(event) => updateProfile(key, event.target.value)}
                        />
                      </Field>
                    ))}
                  </div>
                  <label className="admin-checkbox">
                    <input
                      type="checkbox"
                      checked={draft.profile.available}
                      onChange={(event) => updateProfile('available', event.target.checked)}
                    />
                    Terbuka untuk kolaborasi baru
                  </label>
                  <p className="admin-info-note">
                    <Mail size={17} />
                    Pesan dari form website disimpan di inbox studio, bukan dikirim otomatis melalui
                    email.
                  </p>
                </>
              )}
              {tab === 'pages' && (
                <>
                  <div className="admin-section-title">
                    <FileText size={20} />
                    <div>
                      <h2>Find the right words.</h2>
                      <p>Edit judul dan microcopy tanpa menyentuh kode.</p>
                    </div>
                  </div>
                  <div className="admin-form-grid">
                    {(Object.keys(pageLabels) as (keyof PageContent)[]).map((key) => (
                      <Field
                        key={key}
                        label={pageLabels[key]}
                        wide={
                          key.toLowerCase().includes('description') ||
                          key.toLowerCase().includes('headline')
                        }
                      >
                        <textarea
                          rows={key.toLowerCase().includes('description') ? 3 : 2}
                          maxLength={5000}
                          value={draft.pages[key]}
                          onChange={(event) => updatePage(key, event.target.value)}
                        />
                      </Field>
                    ))}
                  </div>
                </>
              )}
              {tab === 'language' && (
                <LanguageEditor
                  value={draft.settings}
                  onChange={(value) => updateSection('settings', value)}
                />
              )}
              {tab === 'pages' && (
                <CopyEditor value={draft.copy} onChange={(value) => updateSection('copy', value)} />
              )}
              {tab === 'skills' && (
                <>
                  <div className="admin-section-title">
                    <Sparkles size={20} />
                    <div>
                      <h2>What you bring to the table.</h2>
                      <p>Atur layanan, deskripsi, dan teknologi. Urutannya mengikuti website.</p>
                    </div>
                  </div>
                  <div className="admin-skills-list">
                    {draft.skills.map((skill, index) => (
                      <div className="admin-skill-editor" key={skill.id}>
                        <div className="skill-editor-top">
                          <span>SKILL / {String(index + 1).padStart(2, '0')}</span>
                          <div>
                            <button
                              className="icon-button"
                              type="button"
                              aria-label={`Pindahkan ${skill.title} ke atas`}
                              disabled={index === 0}
                              onClick={() => {
                                const skills = [...draft.skills];
                                [skills[index - 1], skills[index]] = [
                                  skills[index],
                                  skills[index - 1],
                                ];
                                setDraft((current) => ({ ...current, skills }));
                                setDirty(true);
                              }}
                            >
                              <ArrowUp size={15} />
                            </button>
                            <button
                              className="icon-button"
                              type="button"
                              aria-label={`Pindahkan ${skill.title} ke bawah`}
                              disabled={index === draft.skills.length - 1}
                              onClick={() => {
                                const skills = [...draft.skills];
                                [skills[index], skills[index + 1]] = [
                                  skills[index + 1],
                                  skills[index],
                                ];
                                setDraft((current) => ({ ...current, skills }));
                                setDirty(true);
                              }}
                            >
                              <ArrowDown size={15} />
                            </button>
                            <button
                              className="icon-button danger-text"
                              type="button"
                              aria-label={`Hapus skill ${skill.title}`}
                              onClick={() => {
                                setDraft((current) => ({
                                  ...current,
                                  skills: current.skills.filter((item) => item.id !== skill.id),
                                }));
                                setDirty(true);
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                        <Field label="Nama layanan">
                          <input
                            value={skill.title}
                            required
                            maxLength={200}
                            onChange={(event) => {
                              setDraft((current) => ({
                                ...current,
                                skills: current.skills.map((item) =>
                                  item.id === skill.id
                                    ? { ...item, title: event.target.value }
                                    : item,
                                ),
                              }));
                              setDirty(true);
                            }}
                          />
                        </Field>
                        <Field label="Deskripsi">
                          <textarea
                            value={skill.description}
                            rows={2}
                            maxLength={3000}
                            onChange={(event) => {
                              setDraft((current) => ({
                                ...current,
                                skills: current.skills.map((item) =>
                                  item.id === skill.id
                                    ? { ...item, description: event.target.value }
                                    : item,
                                ),
                              }));
                              setDirty(true);
                            }}
                          />
                        </Field>
                        <Field label="Teknologi / tools" hint="Pisahkan dengan koma.">
                          <input
                            value={skill.tools.join(', ')}
                            onChange={(event) => {
                              setDraft((current) => ({
                                ...current,
                                skills: current.skills.map((item) =>
                                  item.id === skill.id
                                    ? {
                                        ...item,
                                        tools: event.target.value
                                          .split(',')
                                          .map((value) => value.trim()),
                                      }
                                    : item,
                                ),
                              }));
                              setDirty(true);
                            }}
                          />
                        </Field>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      setDraft((current) => ({
                        ...current,
                        skills: [
                          ...current.skills,
                          { id: crypto.randomUUID(), title: '', description: '', tools: [] },
                        ],
                      }));
                      setDirty(true);
                    }}
                  >
                    <Plus size={16} />
                    Tambah layanan
                  </button>
                </>
              )}
            </form>
          )}
          {tab === 'projects' && (
            <>
              <p className="admin-project-description">
                Koleksi ide yang sudah menemukan bentuknya. Klik edit untuk memperbarui cerita,
                gambar, dan detail.
              </p>
              <div className="admin-projects-grid">
                {content.projects.map((project) => (
                  <article key={project.id} className="admin-project-tile">
                    <div className="admin-project-cover">
                      <img src={project.image} alt={project.title} />
                      {project.featured && <span>FEATURED</span>}
                    </div>
                    <div className="admin-project-tile-content">
                      <span className="eyebrow">
                        {project.category} / {project.year}
                      </span>
                      <h2>{project.title}</h2>
                      <p>{project.summary}</p>
                      <div>
                        <button
                          className="button secondary small"
                          onClick={() => setEditing(project)}
                        >
                          <Pencil size={14} />
                          Edit project
                        </button>
                        <a
                          className="icon-button"
                          href={`/projects/${project.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Preview ${project.title}`}
                        >
                          <Eye size={17} />
                        </a>
                        <button
                          className="icon-button danger-text"
                          aria-label={`Hapus ${project.title}`}
                          onClick={() => setDeleting(project)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {!content.projects.length && (
                <div className="empty-state">
                  <Folder size={35} />
                  <h2>Your next good thing goes here.</h2>
                  <button className="button primary" onClick={() => setEditing(newProject)}>
                    <Plus size={16} />
                    Tambah project pertama
                  </button>
                </div>
              )}
            </>
          )}
          {tab === 'security' && (
            <div className="admin-security">
              <div className="admin-section-title">
                <ShieldCheck size={21} />
                <div>
                  <h2>A secure little corner.</h2>
                  <p>
                    Password di-hash menggunakan scrypt. Sesi disimpan di server dengan cookie
                    HttpOnly.
                  </p>
                </div>
              </div>
              <PasswordForm onAuthChange={updateAuth} />
              <p className="admin-info-note">
                <ShieldCheck size={17} />
                Mengganti password juga mengakhiri sesi admin di perangkat lain.
              </p>
            </div>
          )}
          {tab === 'inbox' && (
            <div className="admin-inbox">
              <div className="inbox-list">
                {messages.length ? (
                  messages.map((message) => (
                    <button
                      key={message.id}
                      className={`inbox-message ${activeMessage?.id === message.id ? 'active' : ''} ${!message.is_read ? 'unread' : ''}`}
                      onClick={async () => {
                        setActiveMessage(message);
                        if (!message.is_read) {
                          try {
                            await api(`/admin/messages/${message.id}`, { method: 'PATCH' });
                            setMessages((current) =>
                              current.map((item) =>
                                item.id === message.id ? { ...item, is_read: 1 } : item,
                              ),
                            );
                          } catch (error) {
                            setError(errorText(error));
                          }
                        }
                      }}
                    >
                      <span className="message-initial">
                        {message.name.charAt(0).toUpperCase()}
                      </span>
                      <span>
                        <strong>{message.name}</strong>
                        <small>{message.message.slice(0, 65)}</small>
                      </span>
                      <time>
                        {new Date(message.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </time>
                      {!message.is_read && <i />}
                    </button>
                  ))
                ) : (
                  <div className="empty-state">
                    <Mail size={32} />
                    <h3>
                      A good conversation
                      <br />
                      is on its way.
                    </h3>
                    <p>Pesan dari form kontak akan muncul di sini.</p>
                  </div>
                )}
              </div>
              <div className="inbox-detail">
                {activeMessage ? (
                  <>
                    <span className="eyebrow">A NEW CONVERSATION</span>
                    <h2>{activeMessage.name}</h2>
                    <a className="animated-link" href={`mailto:${activeMessage.email}`}>
                      {activeMessage.email}
                      <ArrowUpRight size={14} />
                    </a>
                    <time>
                      {new Date(activeMessage.created_at).toLocaleString('id-ID', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </time>
                    <p>{activeMessage.message}</p>
                    <div>
                      <a
                        className="button primary small"
                        href={`mailto:${activeMessage.email}?subject=${encodeURIComponent('Re: Mari berkolaborasi')}`}
                      >
                        <Mail size={15} />
                        Balas via email
                      </a>
                      <button
                        className="icon-button danger-text"
                        aria-label="Hapus pesan"
                        onClick={async () => {
                          if (!window.confirm('Hapus pesan ini secara permanen?')) return;
                          try {
                            await api(`/admin/messages/${activeMessage.id}`, { method: 'DELETE' });
                            setMessages((current) =>
                              current.filter((message) => message.id !== activeMessage.id),
                            );
                            setActiveMessage(null);
                            setToast('Pesan dihapus.');
                          } catch (error) {
                            setError(errorText(error));
                          }
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <Mail size={30} />
                    <p>Pilih percakapan untuk membaca pesan.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <footer className="admin-content-footer">
            <span>{content.profile.brand}. / Studio</span>
            <span>
              <ShieldCheck size={12} />
              Your content. Safely stored.
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="admin-toast" role="status">
          <Check size={18} />
          {toast}
          <button
            className="icon-button"
            aria-label="Tutup notifikasi"
            onClick={() => setToast('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {editing && (
        <ProjectEditor
          key={editing.id || 'new'}
          project={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await refresh();
            setToast('Project tersimpan dan sudah tampil di website.');
          }}
        />
      )}
      {deleting && (
        <Modal title="Hapus project" onClose={() => setDeleting(null)} className="confirm-modal">
          <span className="delete-symbol">
            <Trash2 size={25} />
          </span>
          <h2>Let this one go?</h2>
          <p>
            Project <strong>{deleting.title}</strong> akan dihapus secara permanen dari website.
            Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setDeleting(null)}>
              Tetap simpan
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api(`/admin/projects/${deleting.id}`, { method: 'DELETE' });
                  await refresh();
                  setDeleting(null);
                  setToast('Project berhasil dihapus.');
                } catch (error) {
                  setError(errorText(error));
                  setDeleting(null);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? <LoaderCircle size={15} className="spin" /> : <Trash2 size={15} />}Hapus
              project
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
