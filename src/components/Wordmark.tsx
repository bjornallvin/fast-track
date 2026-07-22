import Link from 'next/link';

interface WordmarkProps {
  className?: string; // wordmark text size, e.g. 'text-2xl'
}

// The Fast·Track wordmark as an explicit way home. Every inner page shows a
// visible "‹ my fasts" cue under the mark — installed-PWA users have no URL
// bar or back button to fall back on, so the way back must be on the page.
const Wordmark: React.FC<WordmarkProps> = ({ className = 'text-[22px]' }) => (
  <Link href="/" title="Back to all your fasts" className="group inline-block">
    <span className={`font-serif font-semibold tracking-tight text-ink block ${className}`}>
      Fast<b className="text-clay">·</b>Track
    </span>
    <span className="block text-[11px] text-muted group-hover:text-clay mt-0.5 leading-none">
      ‹ my fasts
    </span>
  </Link>
);

export default Wordmark;
