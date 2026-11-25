import { useLayoutEffect, useRef, type ReactNode, type RefObject, type PointerEvent } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ArrowUpRight } from 'lucide-react';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function usePortfolioMotion(scope: RefObject<HTMLDivElement | null>, entranceDelay = 0) {
  useLayoutEffect(() => {
    const root = scope.current;
    if (!root) return;
    const media = gsap.matchMedia();
    let lenis: Lenis | undefined;
    let tick: ((time: number) => void) | undefined;
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        lenis = new Lenis({
          duration: 1.1,
          smoothWheel: true,
          syncTouch: false,
          anchors: { offset: -100 },
          prevent: (node) => node.hasAttribute('data-lenis-prevent'),
        });
        lenis.on('scroll', ScrollTrigger.update);
        tick = (time: number) => lenis?.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        const entrance = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: entranceDelay });
        if (root.querySelector('.hero')) {
          entrance
            .from('.hero-line > span', { yPercent: 110, rotate: 3, duration: 1.15, stagger: 0.105 })
            .from(
              '.hero-copy, .hero-actions',
              { y: 24, opacity: 0, duration: 0.85, stagger: 0.1 },
              '-=0.7',
            )
            .fromTo(
              '.lanyard-reveal',
              { clipPath: 'inset(0 0 100% 0)', y: -45, scale: 1.1 },
              {
                clipPath: 'inset(0 0 0% 0)',
                y: 0,
                scale: 1,
                duration: 1.55,
                ease: 'power4.inOut',
                onComplete: () => {
                  gsap.set(root.querySelector('.lanyard-reveal'), { clipPath: 'none' });
                },
              },
              0,
            )
            .from('.hero-bottom', { opacity: 0, y: 12, duration: 0.8 }, '-=0.6');
          gsap.to('.hero-words', {
            y: 85,
            opacity: 0.1,
            ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
          });
          gsap.to('.lanyard-parallax', {
            y: -95,
            rotation: 6,
            scale: 0.95,
            ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 },
          });
        }

        const progress = root.querySelector('[data-scroll-progress]');
        if (progress)
          ScrollTrigger.create({
            start: 0,
            end: () => ScrollTrigger.maxScroll(window),
            onUpdate: (self) => gsap.set(progress, { scaleX: self.progress }),
          });
        const line = root.querySelector('.education-line > span');
        if (line)
          gsap.fromTo(
            line,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: '.education-timeline',
                start: 'top 75%',
                end: 'bottom 65%',
                scrub: 0.8,
              },
            },
          );
        gsap.utils.toArray<HTMLElement>('[data-signature]').forEach((element) => {
          const ink = element.querySelector('.signature-ink-mask');
          const flourish = element.querySelector('.signature-flourish');
          if (ink)
            gsap.fromTo(
              ink,
              { scaleX: 0, transformOrigin: 'left center' },
              {
                scaleX: 1,
                duration: 1,
                ease: 'power2.inOut',
                scrollTrigger: {
                  trigger: element,
                  start: 'top 94%',
                  toggleActions: 'play none none reset',
                },
              },
            );
          if (flourish)
            gsap.fromTo(
              flourish,
              { strokeDashoffset: 1 },
              {
                strokeDashoffset: 0,
                duration: 0.8,
                delay: 0.6,
                scrollTrigger: {
                  trigger: element,
                  start: 'top 94%',
                  toggleActions: 'play none none reset',
                },
              },
            );
        });
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
          gsap.fromTo(
            element,
            { y: 35, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.95,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: element,
                start: 'top 91%',
                toggleActions: 'play none none reverse',
              },
            },
          );
        });
        gsap.utils.toArray<HTMLElement>('[data-line-reveal]').forEach((element) => {
          gsap.from(element.querySelectorAll('.line-inner'), {
            yPercent: 105,
            rotate: 2,
            duration: 1,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 90%',
              toggleActions: 'play none none reverse',
            },
          });
        });
        gsap.utils.toArray<HTMLElement>('[data-image-reveal]').forEach((element) => {
          gsap.fromTo(
            element,
            { clipPath: 'inset(12% 0 12% 0)' },
            {
              clipPath: 'inset(0% 0 0% 0)',
              duration: 1.25,
              ease: 'power3.inOut',
              scrollTrigger: {
                trigger: element,
                start: 'top 94%',
                toggleActions: 'play none none reverse',
              },
            },
          );
        });
        media.add('(min-width: 1024px)', () => {
          gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((element) => {
            gsap.fromTo(
              element,
              { yPercent: -6, scale: 1.12 },
              {
                yPercent: 6,
                scale: 1.12,
                ease: 'none',
                scrollTrigger: {
                  trigger: element.parentElement,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 1.3,
                },
              },
            );
          });
          const intro = root.querySelector<HTMLElement>('.services-intro');
          const list = root.querySelector<HTMLElement>('.services-list');
          if (intro && list)
            ScrollTrigger.create({
              trigger: '.services-layout',
              pin: intro,
              start: 'top 180px',
              end: () => `+=${Math.max(1, list.offsetHeight - intro.offsetHeight)}`,
              pinSpacing: false,
              invalidateOnRefresh: true,
            });
        });
        if (root.querySelector('.footer-wordmark'))
          gsap.from('.footer-wordmark', {
            yPercent: 42,
            opacity: 0,
            duration: 1.3,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.site-footer', start: 'top 95%', once: true },
          });
        if (root.querySelector('.footer-social a'))
          gsap.from('.footer-social a', {
            y: 16,
            opacity: 0,
            stagger: 0.1,
            duration: 0.7,
            scrollTrigger: { trigger: '.site-footer', start: 'top 95%', once: true },
          });
      });
    }, root);
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh);
    const timer = window.setTimeout(refresh, 500);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', refresh);
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      media.revert();
      context.revert();
    };
  }, [scope, entranceDelay]);
}

export function Magnetic({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const move = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType !== 'mouse' || reducedMotion() || !ref.current) return;
    const bounds = ref.current.getBoundingClientRect();
    gsap.to(ref.current, {
      x: (event.clientX - bounds.left - bounds.width / 2) * 0.13,
      y: (event.clientY - bounds.top - bounds.height / 2) * 0.2,
      duration: 0.45,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };
  return (
    <span
      ref={ref}
      className={`magnetic ${className}`}
      onPointerMove={move}
      onPointerLeave={() =>
        gsap.to(ref.current, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' })
      }
    >
      {children}
    </span>
  );
}

export function ProjectCursor({ label = 'VIEW PROJECT' }: { label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current || reducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;
    const cursor = ref.current;
    const x = gsap.quickTo(cursor, 'x', { duration: 0.25, ease: 'power3.out' });
    const y = gsap.quickTo(cursor, 'y', { duration: 0.25, ease: 'power3.out' });
    const move = (event: globalThis.PointerEvent) => {
      x(event.clientX);
      y(event.clientY);
    };
    const over = (event: globalThis.PointerEvent) => {
      const target = event.target as HTMLElement;
      gsap.to(cursor, {
        scale: target.closest('[data-project-cursor]') ? 1 : 0,
        duration: 0.25,
        ease: 'power3.out',
      });
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerover', over);
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      gsap.killTweensOf(cursor);
    };
  }, []);
  return (
    <div ref={ref} className="project-cursor" aria-hidden="true">
      <ArrowUpRight size={25} />
      <span>{label}</span>
    </div>
  );
}

export function PageLoader({
  brand,
  caption,
  onComplete,
}: {
  brand: string;
  caption?: string;
  onComplete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onComplete);
  callback.current = onComplete;
  useLayoutEffect(() => {
    if (reducedMotion()) {
      callback.current();
      return;
    }
    const context = gsap.context(() => {
      gsap
        .timeline({ onComplete: () => callback.current() })
        .from('.loader-brand', { opacity: 0, y: 15, duration: 0.35, ease: 'power3.out' })
        .fromTo(
          '.loader-progress span',
          { scaleX: 0 },
          { scaleX: 1, duration: 0.6, ease: 'power2.inOut' },
          0.1,
        )
        .to(
          ref.current,
          { clipPath: 'inset(0 0 100% 0)', duration: 0.8, ease: 'power4.inOut' },
          0.65,
        );
    }, ref);
    return () => context.revert();
  }, []);
  return (
    <div className="page-loader" ref={ref} aria-label="Memuat portfolio">
      <div className="loader-brand">
        {brand}
        <span>.</span>
      </div>
      <div className="loader-progress">
        <span />
      </div>
      <span className="loader-caption">
        {caption || 'A LITTLE PATIENCE. GOOD THINGS ARE COMING.'}
      </span>
    </div>
  );
}

export function RevealLines({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`reveal-lines ${className}`} data-line-reveal>
      {text.split('\n').map((line, index) => (
        <span className="line-mask" key={index}>
          <span className="line-inner">{line}</span>
        </span>
      ))}
    </span>
  );
}
