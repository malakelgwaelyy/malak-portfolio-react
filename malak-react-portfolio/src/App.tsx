import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft } from 'lucide-react';
import seed from '../shared/content.json';
import type { Content } from './types';
import Header from './components/Header';
import { PageLoader, reducedMotion } from './components/Motion';
import Portfolio from './pages/Portfolio';
import ProjectDetail from './pages/ProjectDetail';

// GitHub Pages repository base path
const BASE = '/malak-portfolio-react';

// Normalize image paths to work on GitHub Pages
function withBasePaths<T>(value: T): T {
  if (typeof value === 'string') {
    if (value.startsWith('/malak-portfolio/images/')) {
      return `${BASE}/images/${value.slice('/malak-portfolio/images/'.length)}` as T;
    }

    if (value.startsWith('/images/')) {
      return `${BASE}${value}` as T;
    }

    return value as T;
  }

  if (Array.isArray(value)) {
    return value.map(withBasePaths) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        withBasePaths(item),
      ])
    ) as T;
  }

  return value;
}

const contentData = withBasePaths(seed as Content);

const routeFromPath = () => {
  const path = window.location.pathname.replace(BASE, '') || '/';
  return path.startsWith('/') ? path : `/${path}`;
};

export default function App() {
  const content = contentData;

  const [route, setRoute] = useState(routeFromPath);
  const [loading, setLoading] = useState(true);

  const overlay = useRef<HTMLDivElement>(null);
  const navigating = useRef(false);
  const entranceDelay = useRef(0.55);

  useEffect(() => {
    document.title = `${content.profile.name} | ${content.profile.role}`;

    const pop = () => {
      entranceDelay.current = 0;
      setRoute(routeFromPath());

      window.setTimeout(() => {
        const target = window.location.hash
          ? document.getElementById(window.location.hash.slice(1))
          : null;

        if (target) target.scrollIntoView({ behavior: 'instant' });
        else window.scrollTo(0, 0);
      }, 80);
    };

    window.addEventListener('popstate', pop);

    return () => window.removeEventListener('popstate', pop);
  }, [content.profile.name, content.profile.role]);

  const navigate = useCallback((to: string) => {
    if (navigating.current) return;

    const target = new URL(to, window.location.origin);

    const nextPath = target.pathname.startsWith(BASE)
      ? target.pathname
      : `${BASE}${target.pathname === '/' ? '' : target.pathname}`;

    if (
      routeFromPath() === target.pathname ||
      (target.pathname === '/' && route === '/')
    ) {
      if (target.hash) {
        document.querySelector(target.hash)?.scrollIntoView({
          behavior: reducedMotion() ? 'instant' : 'smooth',
        });
      } else {
        window.scrollTo({
          top: 0,
          behavior: reducedMotion() ? 'instant' : 'smooth',
        });
      }

      return;
    }

    const apply = () => {
      entranceDelay.current = 0;

      window.history.pushState(
        {},
        '',
        `${nextPath}${target.hash}`
      );

      setRoute(target.pathname.replace(BASE, '') || '/');

      window.scrollTo(0, 0);

      if (target.hash) {
        window.setTimeout(() => {
          document
            .getElementById(target.hash.slice(1))
            ?.scrollIntoView({ behavior: 'instant' });
        }, 100);
      }
    };

    if (reducedMotion() || !overlay.current) {
      apply();
      return;
    }

    navigating.current = true;

    gsap.timeline({
      onComplete: () => {
        navigating.current = false;
      },
    })
      .set(overlay.current, { yPercent: 100 })
      .to(overlay.current, {
        yPercent: 0,
        duration: 0.45,
        ease: 'power4.inOut',
      })
      .call(apply)
      .to(overlay.current, {
        yPercent: -100,
        duration: 0.55,
        ease: 'power4.inOut',
        delay: 0.04,
      })
      .set(overlay.current, { yPercent: 100 });
  }, [route]);

  const slug = route.startsWith('/projects/')
    ? route.slice('/projects/'.length).replace(/\/$/, '')
    : '';

  const project = content.projects.find((item) => item.slug === slug);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <Header
        profile={content.profile}
        copy={content.copy}
        isHome={route === '/'}
        navigate={navigate}
      />

      <div id="main-content" tabIndex={-1}>
        {route === '/' ? (
          <Portfolio
            content={content}
            navigate={navigate}
            entranceDelay={entranceDelay.current}
          />
        ) : project ? (
          <ProjectDetail
            key={project.id}
            project={project}
            content={content}
            navigate={navigate}
          />
        ) : (
          <main className="not-found">
            <span className="eyebrow">404 / A SMALL DETOUR</span>

            <h1>
              Nothing here.
              <br />
              Plenty to explore.
            </h1>

            <a
              className="button primary"
              href={`${BASE}/`}
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
            >
              <ArrowLeft size={16} />
              Back to home
            </a>
          </main>
        )}
      </div>

      {loading && (
        <PageLoader
          brand={content.profile.brand}
          caption={content.copy.loadingCaption}
          onComplete={() => setLoading(false)}
        />
      )}

      <div className="page-transition-shell" aria-hidden="true">
        <div ref={overlay} className="page-transition">
          <span>{content.profile.brand}.</span>
        </div>
      </div>
    </>
  );
}