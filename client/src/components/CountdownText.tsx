/** Rendu partagé du compte à rebours, uniforme (même taille pour tout). */
export function CountdownText({ p }: { p: { h: number; m: number; s: number } }) {
  return (
    <span className="tabular-nums tracking-tight">
      {p.h > 0 && <span>{p.h}h </span>}
      <span>{p.m.toString().padStart(2, '0')}m </span>
      <span>{p.s.toString().padStart(2, '0')}s</span>
    </span>
  );
}
