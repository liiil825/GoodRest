// Tomato Icons as SVG components

interface TomatoIconProps {
  size?: number;
  className?: string;
}

// Small tomato icon (red circle)
export function SmallTomatoIcon({ size = 24, className = '' }: TomatoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="12" cy="13" r="9" fill="#ef4444" />
      <path d="M12 4C12 4 8 2 6 4C4 6 4 8 6 9L12 4Z" fill="#22c55e" />
      <path d="M12 4L14 2L16 3" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Big tomato icon (larger red circle)
export function BigTomatoIcon({ size = 32, className = '' }: TomatoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
    >
      <circle cx="16" cy="17" r="12" fill="#ef4444" />
      <ellipse cx="16" cy="6" rx="4" ry="2" fill="#22c55e" />
      <path d="M16 5C16 5 20 3 22 5C24 7 23 10 20 11L16 5Z" fill="#22c55e" />
    </svg>
  );
}

// Empty/unfilled tomato outline icon
export function EmptyTomatoIcon({ size = 24, className = '' }: TomatoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="12" cy="13" r="9" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M12 4C12 4 8 2 6 4C4 6 4 8 6 9L12 4Z" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="2 1" />
    </svg>
  );
}
