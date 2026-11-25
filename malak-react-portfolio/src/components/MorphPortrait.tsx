import { useRef, useState, type PointerEvent } from 'react';
import { ScanFace } from 'lucide-react';
import gsap from 'gsap';
import Signature from './Signature';
import { reducedMotion } from './Motion';

export default function MorphPortrait({
  src,
  alternate,
  alt,
  signature,
  signatureImage = '',
  className = '',
  priority = false,
  parallax = false,
}: {
  src: string;
  alternate: string;
  alt: string;
  signature: string;
  signatureImage?: string;
  className?: string;
  priority?: boolean;
  parallax?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const revealed = useRef(false);
  const [pinned, setPinned] = useState(false);
  const reveal = (show: boolean) => {
    if (!ref.current) return;
    if (revealed.current === show) return;
    revealed.current = show;
    gsap.to(ref.current, {
      '--morph-radius': show ? '150%' : '0%',
      duration: reducedMotion() ? 0 : show ? 0.85 : 0.65,
      ease: 'power3.inOut',
      overwrite: 'auto',
    });
    ref.current.dataset.transformed = String(show);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || pinned || !ref.current) return;
    const bounds = ref.current.getBoundingClientRect();
    ref.current.style.setProperty(
      '--morph-x',
      `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
    );
    ref.current.style.setProperty(
      '--morph-y',
      `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
    );
    reveal(true);
  };
  return (
    <div
      ref={ref}
      className={`morph-portrait ${className}`}
      data-transformed="false"
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') reveal(true);
      }}
      onPointerMove={move}
      onPointerLeave={() => {
        if (!pinned) reveal(false);
      }}
    >
      <img
        className="portrait-original"
        data-parallax={parallax || undefined}
        src={src}
        alt={alt}
        width="720"
        height="1080"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        draggable="false"
      />
      {alternate && (
        <>
          <img
            className="portrait-alternate"
            data-parallax={parallax || undefined}
            src={alternate}
            alt=""
            aria-hidden="true"
            width="720"
            height="1080"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            draggable="false"
          />
          <span className="portrait-web-glint" aria-hidden="true" />
          <button
            className="portrait-toggle"
            type="button"
            aria-label="Aktifkan atau nonaktifkan Black Suit"
            aria-pressed={pinned}
            title="Discover the other side"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              const next = !pinned;
              setPinned(next);
              reveal(next);
            }}
          >
            <ScanFace size={15} />
          </button>
        </>
      )}
      <Signature text={signature} image={signatureImage} />
    </div>
  );
}
