import { useCallback } from 'react';
import { useSoundSettings } from './useSoundSettings';

// Haptic feedback patterns
type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20],
  warning: [30, 30, 30],
  error: [50, 30, 50],
};

export const useHaptics = () => {
  const { settings } = useSoundSettings();

  const canVibrate = useCallback(() => {
    return 'vibrate' in navigator && settings.hapticEnabled;
  }, [settings.hapticEnabled]);

  const vibrate = useCallback((pattern: HapticPattern = 'light') => {
    if (!canVibrate()) return false;
    
    try {
      const vibrationPattern = HAPTIC_PATTERNS[pattern];
      navigator.vibrate(vibrationPattern);
      return true;
    } catch (e) {
      return false;
    }
  }, [canVibrate]);

  // Convenience methods
  const lightTap = useCallback(() => vibrate('light'), [vibrate]);
  const mediumTap = useCallback(() => vibrate('medium'), [vibrate]);
  const heavyTap = useCallback(() => vibrate('heavy'), [vibrate]);
  const successVibration = useCallback(() => vibrate('success'), [vibrate]);
  const warningVibration = useCallback(() => vibrate('warning'), [vibrate]);
  const errorVibration = useCallback(() => vibrate('error'), [vibrate]);

  return {
    canVibrate: canVibrate(),
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    successVibration,
    warningVibration,
    errorVibration,
  };
};
