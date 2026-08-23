import { useRef, useState } from 'react';

/**
 * Génère une belle image de verset coranique au format TikTok (1080×1920)
 * via Canvas API — aucune dépendance externe requise.
 *
 * L'image contient :
 *  - Fond dégradé sombre avec accents or/vert (identité Nour)
 *  - Texte arabe centré en grand
 *  - Traduction en français en dessous
 *  - Référence (sourate : verset)
 *  - Logo Nour + signature
 */

interface VerseShareCardProps {
  chapter: number;
  verse: number;
  arabic: string;
  translated: string;
  surahName: string;
  surahArabic: string;
}

const W = 1080;
const H = 1920;

function drawCard(data: VerseShareCardProps): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas not supported'));

    // === Fond dégradé ===
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#04120f');
    grad.addColorStop(0.3, '#06201a');
    grad.addColorStop(0.7, '#0a2f26');
    grad.addColorStop(1, '#04120f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // === Motif décoratif subtil (étoiles / points dorés) ===
    ctx.fillStyle = 'rgba(207, 161, 74, 0.06)';
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // === Bordure dorée intérieure ===
    ctx.strokeStyle = 'rgba(207, 161, 74, 0.25)';
    ctx.lineWidth = 3;
    const m = 40;
    roundRect(ctx, m, m, W - 2 * m, H - 2 * m, 30);
    ctx.stroke();

    // === Icône croissant de lune (emoji) ===
    ctx.font = '72px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(207, 161, 74, 0.9)';
    ctx.fillText('☽', W / 2, 160);

    // === Nom de la sourate en arabe ===
    ctx.font = '64px serif';
    ctx.fillStyle = '#cfa14a';
    ctx.textAlign = 'center';
    ctx.fillText(data.surahArabic, W / 2, 260);

    // === Nom de la sourate en français ===
    ctx.font = '36px sans-serif';
    ctx.fillStyle = '#a8b5a0';
    ctx.fillText(data.surahName, W / 2, 320);

    // === Ligne séparatrice dorée ===
    const lineY = 360;
    ctx.strokeStyle = 'rgba(207, 161, 74, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 120, lineY);
    ctx.lineTo(W / 2 + 120, lineY);
    ctx.stroke();
    // Point central
    ctx.fillStyle = '#cfa14a';
    ctx.beginPath();
    ctx.arc(W / 2, lineY, 5, 0, Math.PI * 2);
    ctx.fill();

    // === Texte arabe (grand, centré, RTL) ===
    const arabicLines = wrapText(ctx, data.arabic, W - 160, '64px Amiri, serif');
    ctx.font = '64px Amiri, serif';
    ctx.fillStyle = '#f0ede6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let arabicY = 560;
    const arabicLineH = 100;
    for (const line of arabicLines) {
      ctx.fillText(line, W / 2, arabicY);
      arabicY += arabicLineH;
    }

    // === Basmala décorative (si verset > 1, sinons skip car déjà dans le texte) ===
    const basmalaY = arabicY + 30;
    ctx.font = '28px serif';
    ctx.fillStyle = 'rgba(207, 161, 74, 0.5)';
    ctx.fillText('﷽', W / 2, basmalaY);

    // === Ligne séparatrice ===
    const sepY = basmalaY + 50;
    ctx.strokeStyle = 'rgba(207, 161, 74, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, sepY);
    ctx.lineTo(W - 100, sepY);
    ctx.stroke();

    // === Traduction ===
    const transLines = wrapText(ctx, data.translated, W - 180, '34px sans-serif');
    ctx.font = '34px sans-serif';
    ctx.fillStyle = '#a8b5a0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let transY = sepY + 60;
    const transLineH = 52;
    for (const line of transLines) {
      ctx.fillText(line, W / 2, transY);
      transY += transLineH;
    }

    // === Référence ===
    const refY = H - 260;
    ctx.font = 'bold 40px sans-serif';
    ctx.fillStyle = '#cfa14a';
    ctx.fillText(`— ${data.chapter}:${data.verse} —`, W / 2, refY);

    // === Signature Nour ===
    ctx.font = '28px sans-serif';
    ctx.fillStyle = 'rgba(168, 181, 160, 0.6)';
    ctx.fillText('Nour · Chat islamique', W / 2, refY + 50);

    // === Export ===
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      },
      'image/png',
      1.0
    );
  });
}

/** Helper: arrondir un rectangle */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Helper: couper le texte en lignes qui tiennent dans maxWidth */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string
): string[] {
  ctx.font = font;
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

export function VerseShareButton({
  chapter,
  verse,
  arabic,
  translated,
  surahName,
  surahArabic,
}: VerseShareCardProps) {
  const [generating, setGenerating] = useState(false);

  const handleShare = async () => {
    setGenerating(true);
    try {
      const blob = await drawCard({
        chapter,
        verse,
        arabic,
        translated,
        surahName,
        surahArabic,
      });
      const url = URL.createObjectURL(blob);

      // Tenter le partage natif (mobile)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `nour-${chapter}-${verse}.png`, {
          type: 'image/png',
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Coran ${chapter}:${verse} — Nour`,
            text: `${arabic}\n\n${translated}\n\n— Sourate ${surahName} (${chapter}:${verse})`,
            files: [file],
          });
          URL.revokeObjectURL(url);
          return;
        }
      }

      // Fallback : téléchargement
      const a = document.createElement('a');
      a.href = url;
      a.download = `nour-${chapter}-${verse}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleShare();
      }}
      className="chip hover:!border-emerald-500/50 hover:!text-emerald-300"
      title="Partager sur TikTok"
      disabled={generating}
    >
      {generating ? '⏳' : '📤'} Share
    </button>
  );
}
