import { useId } from 'react';

export default function Signature({
  text,
  image = '',
  className = '',
}: {
  text: string;
  image?: string;
  className?: string;
}) {
  const maskId = `signature-${useId().replace(/:/g, '')}`;
  if (!text && !image) return null;
  return (
    <span
      className={`signature-mark ${className}`}
      data-signature
      aria-label={`Tanda tangan ${text}`}
    >
      {image ? (
        <img src={image} alt={`Tanda tangan ${text}`} loading="lazy" draggable="false" />
      ) : (
        <svg viewBox="0 0 240 78" role="img" aria-label={text}>
          <defs>
            <clipPath id={maskId}>
              <rect className="signature-ink-mask" x="0" y="0" width="240" height="78" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${maskId})`}>
            <text
              x="14"
              y="47"
              textLength={Math.min(205, Math.max(70, text.length * 11))}
              lengthAdjust="spacingAndGlyphs"
            >
              {text}
            </text>
          </g>
          <path
            className="signature-flourish"
            pathLength="1"
            d="M 13 58 C 70 49 132 55 213 50 C 228 48 209 60 189 64 M 171 36 C 191 30 199 39 184 49"
          />
        </svg>
      )}
    </span>
  );
}
