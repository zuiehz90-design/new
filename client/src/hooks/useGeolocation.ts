import { useCallback, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useAuth } from '../context/AuthContext';
import { storageKey } from '../lib/storageScope';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../i18n';
import { geoErrorKey, reverseGeocode } from '../lib/geocode';
import type { Coords } from '../lib/types';

export function useGeolocation() {
  const { scope } = useAuth();
  const { t } = useI18n();
  const { show } = useToast();
  const [coords, setCoords] = useLocalStorage<Coords | null>(storageKey(scope, 'coords'), null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Applique des coordonnées (GPS ou recherche de ville) + message de confirmation. */
  const confirmCoords = useCallback(
    async (c: Coords, label?: string) => {
      setCoords(c);
      setError(null);
      let place: string | null = label ?? null;
      if (!place) place = await reverseGeocode(c.lat, c.lng);
      show(
        '📍',
        t('prayer.confirmed'),
        place ? t('prayer.confirmedSubtitle', { place }) : undefined,
        'bg-emerald-600',
      );
    },
    [setCoords, show, t],
  );

  const request = useCallback(() => {
    if (!window.isSecureContext) {
      setError(t('prayer.geoInsecure'));
      return;
    }
    if (!('geolocation' in navigator)) {
      setError(t('prayer.geoUnsupported'));
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        void confirmCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setLoading(false);
        setError(t(geoErrorKey(err.code)));
      },
      { timeout: 10000, maximumAge: 600000, enableHighAccuracy: false },
    );
  }, [confirmCoords, t]);

  return { coords, error, loading, request, setCoords, confirmCoords };
}
