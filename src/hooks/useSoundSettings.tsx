import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface SoundSettings {
  enabled: boolean;
  volume: number; // 0 to 1
  hapticEnabled: boolean;
}

interface SoundSettingsContextType {
  settings: SoundSettings;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setHapticEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
}

const SoundSettingsContext = createContext<SoundSettingsContextType | null>(null);

const STORAGE_KEY = 'go20-sound-settings';

const defaultSettings: SoundSettings = {
  enabled: true,
  volume: 0.5,
  hapticEnabled: true,
};

export function SoundSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SoundSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      // Ignore parse errors
    }
    return defaultSettings;
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      // Ignore storage errors
    }
  }, [settings]);

  const setEnabled = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, enabled }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const setHapticEnabled = useCallback((hapticEnabled: boolean) => {
    setSettings(prev => ({ ...prev, hapticEnabled }));
  }, []);

  const toggleSound = useCallback(() => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  return (
    <SoundSettingsContext.Provider value={{ settings, setEnabled, setVolume, setHapticEnabled, toggleSound }}>
      {children}
    </SoundSettingsContext.Provider>
  );
}

export function useSoundSettings() {
  const context = useContext(SoundSettingsContext);
  if (!context) {
    // Return default values if used outside provider
    return {
      settings: defaultSettings,
      setEnabled: () => {},
      setVolume: () => {},
      setHapticEnabled: () => {},
      toggleSound: () => {},
    };
  }
  return context;
}
