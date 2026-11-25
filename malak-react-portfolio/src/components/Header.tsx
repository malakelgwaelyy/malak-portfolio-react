import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, Moon, Sun, X } from 'lucide-react';
import gsap from 'gsap';
import type { Navigate, Profile } from '../types';
import LanguageSwitcher from './LanguageSwitcher';
import { reducedMotion } from './Motion';

const links = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'community', label: 'Community' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
];

export default function Header({
  profile,
  copy,
  isHome,
  navigate,
  language,
  onLanguage,
}: {
  language?: string;
  onLanguage?: (code: string) => void;
  profile: Profile;
  copy: Record<string, string>;
  isHome: boolean;
  navigate: Navigate;
}) {
  const [active, setActive] = useState('home');
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);
  const navigationLinks = links.map((link) => ({
    ...link,
    label: copy[`nav${link.id[0].toUpperCase()}${link.id.slice(1)}`] || link.label,
  }));
  useEffect(() => {
    if (!isHome) {
      setActive('');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-15% 0px -55% 0px' },
    );
    links.forEach((link) => {
      const section = document.getElementById(link.id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [isHome]);
  useEffect(() => {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    return () => {
      document.documentElement.dataset.theme = 'dark';
    };
  }, [light]);
  useEffect(() => {
    if (open) {
      menuRef.current?.showModal();
      const before = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      if (!reducedMotion())
        gsap.fromTo(
          '.mobile-menu-link',
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.065, duration: 0.6, ease: 'power3.out' },
        );
      return () => {
        document.documentElement.style.overflow = before;
      };
    }
    menuRef.current?.close();
  }, [open]);
  const href = (id: string) => (isHome ? `#${id}` : `/#${id}`);
  const follow = (event: React.MouseEvent, id: string) => {
    setOpen(false);
    if (!isHome) {
      event.preventDefault();
      navigate(`/#${id}`);
    }
  };
  return (
    <>
      <header className="site-header">
        <a
          href="#home"
          className="wordmark"
          aria-label={`${profile.brand} - Home`}
          onClick={(event) => {
            if (!isHome) {
              event.preventDefault();
              navigate('/');
            }
          }}
        >
          {profile.brand}
          <span>.</span>
        </a>
        <nav className="desktop-nav" aria-label="Navigasi utama">
          {navigationLinks.map((link) => (
            <a
              key={link.id}
              className={`nav-link ${active === link.id ? 'active' : ''}`}
              href={href(link.id)}
              onClick={(event) => follow(event, link.id)}
            >
              <span>{link.label}</span>
              {active === link.id && <span className="nav-dot" />}
            </a>
          ))}
          <span className="nav-divider" />
          <button
            type="button"
            className="theme-button"
            onClick={() => setLight((value) => !value)}
            aria-label={light ? 'Gunakan tema gelap' : 'Gunakan tema terang'}
            title={light ? 'Dark mode' : 'Light mode'}
          >
            {light ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          {language && onLanguage && <LanguageSwitcher current={language} onSelect={onLanguage} />}
        </nav>
        <a
          href={href('contact')}
          className="header-contact"
          onClick={(event) => follow(event, 'contact')}
        >
          {copy.heroContact} <ArrowUpRight size={16} />
        </a>
        <button
          className="mobile-menu-toggle icon-button"
          aria-label="Buka menu navigasi"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu size={22} />
        </button>
      </header>
      <dialog
        ref={menuRef}
        className="mobile-menu"
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        data-lenis-prevent
      >
        <div className="mobile-menu-top">
          <a className="wordmark" href="#home" onClick={(event) => { if (!isHome) { event.preventDefault(); navigate('/'); } }}>
            {profile.brand}
            <span>.</span>
          </a>
          <button
            className="icon-button"
            aria-label="Tutup navigasi"
            onClick={() => setOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        <nav aria-label="Navigasi mobile">
          {navigationLinks.map((link, index) => (
            <a
              key={link.id}
              className="mobile-menu-link"
              href={href(link.id)}
              onClick={(event) => follow(event, link.id)}
            >
              <span>0{index + 1}</span>
              {link.label}
              <ArrowUpRight size={32} />
            </a>
          ))}
        </nav>
        <a className="mobile-menu-email" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
        {language && onLanguage && (
          <LanguageSwitcher current={language} onSelect={onLanguage} variant="mobile" />
        )}
        <button className="text-button" onClick={() => setLight((value) => !value)}>
          {light ? <Moon size={17} /> : <Sun size={17} />}{' '}
          {light ? 'Switch to dark' : 'Switch to light'}
        </button>
      </dialog>
    </>
  );
}
