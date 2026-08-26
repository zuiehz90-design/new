/** Rendu partagé du compte à rebours : heures/minutes en grand, secondes en petit. */
export function CountdownText({ p }: { p: { h: number; m: number; s: number } }) {
  return (
    <>
      {p.h > 0 && <span>{p.h}h </span>}
      <span>{p.m.toString().padStart(2, '0')}m</span>
      <span className="ml-1 text-lg text-stone-400">{p.s.toString().padStart(2, '0')}s</span>
    </>
  );
}
