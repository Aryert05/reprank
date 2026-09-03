// The signature visual element carried over from Experiment 1: a circular
// XP-progress ring (CSS conic-gradient, see .rank-ring in src/style.css) with
// the level number centered. Now a proper reusable React component.
export default function RankRing({ level, pct, size = 'h-12 w-12', labelSize = 'text-sm' }) {
  return (
    <span className={`rank-ring ${size}`} style={{ '--pct': pct }}>
      <span className={`rank-ring-label ${labelSize}`}>{level}</span>
    </span>
  );
}
