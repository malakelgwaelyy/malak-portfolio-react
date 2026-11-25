import { useEffect, useId, useRef, type PointerEvent } from 'react';
import gsap from 'gsap';
import { RotateCcw } from 'lucide-react';
import { reducedMotion } from './Motion';
import IdentityBadge from './IdentityBadge';
import type { IdentityCardContent, Profile } from '../types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function InteractiveLanyard({
  profile,
  card,
}: {
  profile: Profile;
  card: IdentityCardContent;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const position = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const attachment = useRef<HTMLSpanElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const pathId = `lanyard-${useId().replace(/:/g, '')}`;
  const motion = useRef({ x: 0, y: 0, vx: 0, vy: 0, visible: true, spring: false, maxScroll: 0 });
  const drag = useRef<{
    startX: number;
    startY: number;
    clientX: number;
    clientY: number;
    pointerId: number;
    maxY: number;
  } | null>(null);
  const resetRef = useRef<() => void>(() => {});

  const localPoint = (clientX: number, clientY: number) => {
    const matrix = svg.current?.getScreenCTM();
    return matrix
      ? new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse())
      : new DOMPoint(clientX, clientY);
  };

  useEffect(() => {
    const node = position.current;
    const canvas = svg.current;
    const marker = attachment.current;
    if (!node || !canvas || !marker) return;
    const hero = stage.current?.closest<HTMLElement>('.hero');
    const state = motion.current;
    const setX = gsap.quickSetter(node, 'x', 'px');
    const setY = gsap.quickSetter(node, 'y', 'px');
    const setRotation = gsap.quickSetter(node, 'rotation', 'deg');
    const draw = () => {
      const matrix = canvas.getScreenCTM();
      if (!matrix) return;
      const rect = marker.getBoundingClientRect();
      const end = new DOMPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      ).matrixTransform(matrix.inverse());
      const slack = clamp(1 - Math.max(0, end.y - 280) / 850, 0.18, 1);
      const midX = 318 + (end.x - 318) * 0.45 - 72 * slack;
      const midY = Math.max(50, (end.y + 35) * 0.49);
      const d = `M 318 -45 C 312 40 ${midX - 30 * slack} ${midY - 65 * slack} ${midX} ${midY} C ${midX + 25 * slack} ${midY + 75 * slack} ${end.x + 12 * slack} ${end.y - 50} ${end.x} ${end.y}`;
      paths.current.forEach((path) => path?.setAttribute('d', d));
      canvas.dataset.endX = String(end.x);
      canvas.dataset.endY = String(end.y);
      node.dataset.offsetY = String(state.y);
      node.dataset.offsetX = String(state.x);
    };
    const release = () => {
      if (!drag.current && !state.spring && Math.abs(state.x) + Math.abs(state.y) < 1) return;
      drag.current = null;
      state.spring = true;
      node.dataset.dragging = 'false';
      gsap.to(tilt.current, {
        rotationX: 0,
        rotationY: 0,
        duration: reducedMotion() ? 0 : 0.6,
        overwrite: 'auto',
      });
      if (reducedMotion()) {
        state.x = state.y = state.vx = state.vy = 0;
        state.spring = false;
        setX(0);
        setY(0);
        setRotation(11);
        draw();
        hero?.classList.remove('is-card-dragging');
      }
    };
    resetRef.current = release;
    let last = 0;
    const frame = (time: number) => {
      if (!state.visible && !drag.current && !state.spring) return;
      const dt = last ? clamp((time - last) * 60, 0.4, 1.8) : 1;
      last = time;
      if (drag.current) {
        const current = drag.current;
        const scrollSpeed =
          current.clientY > innerHeight - 80
            ? clamp((current.clientY - innerHeight + 80) * 0.35, 0, 20)
            : current.clientY < 65
              ? -clamp((65 - current.clientY) * 0.3, 0, 17)
              : 0;
        if (
          scrollSpeed &&
          ((scrollSpeed > 0 && scrollY < state.maxScroll) || (scrollSpeed < 0 && scrollY > 0))
        )
          window.scrollBy(0, scrollSpeed * dt);
        const point = localPoint(current.clientX, current.clientY);
        const nextX = clamp(point.x - current.startX, -850, 450);
        const nextY = clamp(point.y - current.startY, -135, current.maxY);
        state.vx = (nextX - state.x) * 0.35;
        state.vy = (nextY - state.y) * 0.35;
        state.x = nextX;
        state.y = nextY;
      } else if (state.spring) {
        state.vx = (state.vx - state.x * 0.022 * dt) * Math.pow(0.83, dt);
        state.vy = (state.vy - state.y * 0.022 * dt) * Math.pow(0.83, dt);
        state.x += state.vx * dt;
        state.y += state.vy * dt;
        if (state.y < -135) {
          state.y = -135;
          state.vy *= -0.22;
        }
        if (
          Math.abs(state.x) + Math.abs(state.y) + Math.abs(state.vx) + Math.abs(state.vy) <
          0.35
        ) {
          state.x = state.y = state.vx = state.vy = 0;
          state.spring = false;
          hero?.classList.remove('is-card-dragging');
        }
      } else if (reducedMotion()) return;
      const idle = !drag.current && !state.spring && !reducedMotion();
      setX(state.x);
      setY(state.y + (idle ? Math.sin(time * 0.8) * 3 : 0));
      setRotation(
        11 +
          clamp(state.x * 0.014 - state.vx * 0.25, -16, 16) +
          (idle ? Math.sin(time * 0.65) * 1.1 : 0),
      );
      draw();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        state.visible = entries[0].isIntersecting;
      },
      { rootMargin: '100px' },
    );
    if (stage.current) observer.observe(stage.current);
    const resize = () => draw();
    window.addEventListener('resize', resize);
    gsap.ticker.add(frame);
    setRotation(11);
    draw();
    return () => {
      gsap.ticker.remove(frame);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      hero?.classList.remove('is-card-dragging');
      gsap.killTweensOf(tilt.current);
    };
  }, []);

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button, a')) return;
    event.preventDefault();
    event.currentTarget.dataset.inputMode = 'pointer';
    event.currentTarget.focus({ preventScroll: true });
    const point = localPoint(event.clientX, event.clientY);
    const matrix = svg.current?.getScreenCTM();
    const scale = matrix ? Math.hypot(matrix.a, matrix.b) : 1;
    const documentHeight = document.documentElement.scrollHeight;
    const hero = stage.current?.closest<HTMLElement>('.hero');
    motion.current.maxScroll = documentHeight - innerHeight;
    drag.current = {
      startX: point.x - motion.current.x,
      startY: point.y - motion.current.y,
      clientX: event.clientX,
      clientY: event.clientY,
      pointerId: event.pointerId,
      maxY: Math.max(1000, (documentHeight + innerHeight - (hero?.offsetTop || 0)) / scale),
    };
    motion.current.spring = false;
    hero?.classList.add('is-card-dragging');
    if (position.current) position.current.dataset.dragging = 'true';
    gsap.set(stage.current?.querySelector('.lanyard-reveal') || [], { clipPath: 'none' });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current) {
      drag.current.clientX = event.clientX;
      drag.current.clientY = event.clientY;
      return;
    }
    if (event.pointerType !== 'mouse' || reducedMotion()) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    gsap.to(tilt.current, {
      rotationY: (event.clientX - bounds.left - bounds.width / 2) / 43,
      rotationX: -(event.clientY - bounds.top - bounds.height / 2) / 55,
      duration: 0.7,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };
  return (
    <div
      className="hero-lanyard"
      ref={stage}
      aria-label={`Kartu identitas kreatif ${profile.name}`}
    >
      <div className="lanyard-reveal">
        <div className="lanyard-parallax">
          <svg
            ref={svg}
            className="lanyard-strap"
            viewBox="0 0 560 2000"
            width="560"
            height="2000"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id={`${pathId}-fabric`}
                x1="240"
                x2="330"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#121820" />
                <stop offset=".5" stopColor="#2a3039" />
                <stop offset="1" stopColor="#11151c" />
              </linearGradient>
              <path
                ref={(node) => {
                  paths.current[0] = node;
                }}
                id={pathId}
                d="M318 -45C300 68 222 91 241 182C252 226 307 225 305 286"
              />
            </defs>
            <use href={`#${pathId}`} stroke="#59606b" strokeWidth="47" />
            <use href={`#${pathId}`} stroke={`url(#${pathId}-fabric)`} strokeWidth="44" />
            <use
              href={`#${pathId}`}
              stroke="#9da4b0"
              strokeOpacity=".16"
              strokeWidth="36"
              strokeDasharray="1 3"
            />
            <text fill="#d0d2d4" fontSize="11.5" fontWeight="800" letterSpacing="3" dy="4">
              <textPath href={`#${pathId}`} startOffset="4%">
                {card.strapText} + {(card.brandText || profile.brand).toUpperCase()}.
              </textPath>
            </text>
          </svg>
          <div ref={position} className="badge-position" data-dragging="false" data-offset-y="0">
            <div
              ref={tilt}
              className="badge-tilt"
              tabIndex={0}
              role="group"
              aria-label={card.dragHint}
              aria-describedby={`${pathId}-instructions`}
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={() => resetRef.current()}
              onPointerCancel={() => resetRef.current()}
              onLostPointerCapture={() => {
                if (drag.current) resetRef.current();
              }}
              onPointerLeave={() => {
                if (!drag.current)
                  gsap.to(tilt.current, {
                    rotationX: 0,
                    rotationY: 0,
                    duration: 0.7,
                    overwrite: 'auto',
                  });
              }}
              onKeyDown={(event) => {
                event.currentTarget.dataset.inputMode = 'keyboard';
                if (event.target !== event.currentTarget) return;
                const offsets: Record<string, [number, number]> = {
                  ArrowDown: [0, 80],
                  ArrowUp: [0, -80],
                  ArrowLeft: [-50, 0],
                  ArrowRight: [50, 0],
                };
                if (event.key === 'Home' || event.key === 'Escape') {
                  event.preventDefault();
                  resetRef.current();
                }
                if (offsets[event.key]) {
                  event.preventDefault();
                  motion.current.x += offsets[event.key][0];
                  motion.current.y = clamp(motion.current.y + offsets[event.key][1], -100, 900);
                  motion.current.spring = false;
                  stage.current?.closest('.hero')?.classList.add('is-card-dragging');
                  gsap.set(event.currentTarget.closest('.lanyard-reveal'), { clipPath: 'none' });
                }
              }}
            >
              <span ref={attachment} className="strap-attachment" />
              <div className="badge-clip" aria-hidden="true">
                <div className="clip-hole" />
                <div className="clip-metal" />
                <div className="clip-ring" />
              </div>
              <IdentityBadge profile={profile} card={card} priority />
              <button
                type="button"
                className="lanyard-reset"
                aria-label={card.resetLabel}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => {
                  motion.current.spring = true;
                  resetRef.current();
                }}
              >
                <RotateCcw size={13} />
              </button>
            </div>
            <span className="sr-only" id={`${pathId}-instructions`}>
              {card.dragHint}
              <span>{card.keyboardHint}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
