export default function TechnologyIcon({
  symbol,
  logo = '',
  name = '',
}: {
  symbol: string;
  logo?: string;
  name?: string;
}) {
  if (logo)
    return (
      <img
        className="technology-icon"
        src={logo}
        alt={`Logo ${name}`}
        width="40"
        height="40"
        loading="lazy"
      />
    );
  if (symbol === 'react')
    return (
      <svg
        className="technology-icon react-icon"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <g stroke="currentColor" strokeWidth="1.7">
          <ellipse cx="24" cy="24" rx="21" ry="8" />
          <ellipse cx="24" cy="24" rx="21" ry="8" transform="rotate(60 24 24)" />
          <ellipse cx="24" cy="24" rx="21" ry="8" transform="rotate(120 24 24)" />
        </g>
        <circle cx="24" cy="24" r="3.4" fill="currentColor" />
      </svg>
    );
  if (symbol === 'nextjs')
    return (
      <svg className="technology-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="1.5" />
        <path d="M15 32V16L34 39M31 16V29" stroke="currentColor" strokeWidth="2.4" />
      </svg>
    );
  if (symbol === 'typescript')
    return (
      <svg className="technology-icon" viewBox="0 0 48 48" aria-hidden="true">
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="7"
          fill="currentColor"
          fillOpacity=".12"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="M11 20H27M19 20V36M39 23C34 17 27 23 31 27L36 29C42 32 37 39 30 34"
          stroke="currentColor"
          strokeWidth="2.8"
          fill="none"
        />
      </svg>
    );
  if (symbol === 'tailwind')
    return (
      <svg className="technology-icon" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">
        <path d="M24 10C18 10 14 13 12 19C15 15 19 15 23 18C25 20 28 23 33 23C39 23 43 20 45 14C42 18 38 18 34 15C32 13 29 10 24 10ZM12 25C6 25 2 28 0 34C3 30 7 30 11 33C13 35 16 38 21 38C27 38 31 35 33 29C30 33 26 33 22 30C20 28 17 25 12 25Z" />
      </svg>
    );
  if (symbol === 'nodejs')
    return (
      <svg className="technology-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M24 2L43 13V35L24 46L5 35V13Z" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M16 18V32C16 36 11 35 11 32M35 20C31 15 24 18 27 23L32 25C38 28 33 35 26 30"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    );
  return (
    <svg className="technology-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M7 32L17 12L14 26H25L20 38L40 15"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
