import { useCallback, useEffect, useMemo, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useStorage } from '@/providers/StorageProvider';

export type SoundType = 'click' | 'success' | 'error';

interface SoundContextValue {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (v: boolean) => void;
  play: (type?: SoundType) => Promise<void>;
}

const CLICK_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3';
const SUCCESS_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-interface-1-1264.mp3';
const ERROR_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-system-beep-buzzer-fail-2964.mp3';

export const [SoundProvider, useSound] = createContextHook<SoundContextValue>(() => {
  const storage = useStorage();
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const v = await storage.getItem('pref_sound_enabled');
        if (!mounted) return;
        if (v === 'false') setEnabled(false);
      } catch (e) {
        console.log('Failed to load sound preference', e);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [storage]);

  const persist = useCallback(async (v: boolean) => {
    try {
      if (typeof v !== 'boolean') return;
      await storage.setItem('pref_sound_enabled', String(v));
    } catch (e) {
      console.log('Failed to save sound preference', e);
    }
  }, [storage]);

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      void persist(next);
      return next;
    });
  }, [persist]);

  const playWeb = useCallback(async (url: string) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
        const audio = new window.Audio(url);
        audio.volume = 0.6;
        await audio.play();
      }
    } catch (e) {
      console.log('Web audio play failed', e);
    }
  }, []);

  // Simplified sound playing without expo-av
  const playNativeSound = useCallback(async (url: string) => {
    try {
      if (Platform.OS === 'web') return;
      if (!url || typeof url !== 'string' || url.trim().length === 0) return;
      if (url.length > 500) return; // URL length limit
      
      // For now, just log the sound play attempt
      // In a real implementation, you would use a native sound library
      console.log('Playing native sound:', url.trim());
    } catch (e) {
      console.log('Native sound play error', e);
    }
  }, []);

  const urlFor = (type?: SoundType) => {
    switch (type) {
      case 'success':
        return SUCCESS_URL;
      case 'error':
        return ERROR_URL;
      default:
        return CLICK_URL;
    }
  };

  const play = useCallback(async (type?: SoundType) => {
    try {
      if (!enabled) return;
      if (type && typeof type === 'string' && !['click', 'success', 'error'].includes(type)) return;
      const url = urlFor(type);

      if (Platform.OS !== 'web') {
        await playNativeSound(url);
      } else {
        await playWeb(url);
      }

      if (Platform.OS !== 'web') {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      } else {
        console.log('Haptics not available on web');
      }
    } catch (e) {
      console.log('play sound failed', e);
    }
  }, [enabled, playNativeSound, playWeb]);

  const setEnabledCallback = useCallback((v: boolean) => {
    if (typeof v !== 'boolean') return;
    if (v !== true && v !== false) return;
    setEnabled(v);
    void persist(v);
  }, [persist]);

  return useMemo(() => ({ enabled, toggle, setEnabled: setEnabledCallback, play }), [enabled, toggle, setEnabledCallback, play]);
});
