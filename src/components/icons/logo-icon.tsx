export function LogoIcon({ className }: { className?: string }) {
    // A beautiful minimal Ribbon + Sparkle SVG
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Ribbon loops */}
            <path d="M12 12c-3-3-6-4-8-2s1 6 4 6 4-4 4-4Z" />
            <path d="M12 12c3-3 6-4 8-2s-1 6-4 6-4-4-4-4Z" />
            {/* Ribbon tails */}
            <path d="M10 14c-1 4-3 6-5 8" />
            <path d="M14 14c1 4 3 6 5 8" />
            {/* Little sparkle center */}
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
    );
}
