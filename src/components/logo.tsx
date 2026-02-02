import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="140"
      height="40"
      {...props}
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path
        fill="url(#grad1)"
        d="M10,45 L10,15 Q10,5 20,5 L30,5 Q40,5 40,15 L40,45 M30,45 L30,15 M40,25 L20,25"
        stroke="url(#grad1)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <animate attributeName="d" values="M10,45 L10,15 Q10,5 20,5 L30,5 Q40,5 40,15 L40,45 M30,45 L30,15 M40,25 L20,25;M10,45 L10,15 Q10,5 20,5 L30,5 Q40,5 40,15 L40,45 M30,45 L30,15 M50,25 L10,25" dur="2s" repeatCount="indefinite" />
      </path>
      <text
        x="55"
        y="32"
        fontFamily="var(--font-headline)"
        fontSize="24"
        fontWeight="bold"
        fill="hsl(var(--foreground))"
        className="font-headline"
      >
        Monisha's Mandate
      </text>
    </svg>
  );
}
