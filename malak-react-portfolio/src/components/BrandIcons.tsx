import type { SVGProps } from 'react';
type IconProps = SVGProps<SVGSVGElement> & { size?: number };
export function Github({ size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path
        d="M9 19c-4.3 1.3-4.3-2.2-6-2.7m12 5v-3.9c0-1.1-.4-1.9-1-2.4 3.3-.4 6.7-1.6 6.7-7.2a5.6 5.6 0 0 0-1.5-3.9c.2-.5.7-2-.1-3.9 0 0-1.2-.4-4 1.5a13.8 13.8 0 0 0-7.2 0C5.1-.4 3.9 0 3.9 0c-.8 1.9-.3 3.4-.1 3.9a5.6 5.6 0 0 0-1.5 3.9c0 5.6 3.4 6.8 6.7 7.2-.5.4-1 1.2-1 2.4v3.9"
        transform="translate(1 1) scale(.92)"
      />
    </svg>
  );
}
export function Instagram({ size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function Linkedin({ size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7.5 10v7M11 17v-7h3v1c1-2 3.5-1 3.5 1.5V17M7.5 7h.01" />
    </svg>
  );
}
