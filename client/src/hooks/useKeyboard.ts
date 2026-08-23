import { useEffect, useState } from 'react';

/**
 * Hauteur du clavier virtuel — équivalent web de KeyboardAvoidingView.
 *
 * iOS Safari (et la plupart des navigateurs mobiles) ne reduit pas la
 * viewport de mise en page quand le clavier s'ouvre : il flotte par-dessus
 * le contenu. On mesure donc l'ecart entre la viewport de mise en page
 * (window.innerHeight) et la viewport visuelle (visualViewport). Des que
 * cet ecart devient positif, le bas de l'ecran est masque : on renvoie sa
 * hauteur pour la compenser en padding sur le conteneur racine.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    const measure = () => {
      const diff = vv ? Math.round(window.innerHeight - vv.height) : 0;
      setHeight(diff > 0 ? diff : 0);
    };
    measure();
    window.addEventListener('resize', measure);
    vv?.addEventListener('resize', measure);
    vv?.addEventListener('scroll', measure);
    return () => {
      window.removeEventListener('resize', measure);
      vv?.removeEventListener('resize', measure);
      vv?.removeEventListener('scroll', measure);
    };
  }, []);

  return height;
}
