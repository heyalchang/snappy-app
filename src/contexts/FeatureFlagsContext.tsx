import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FlagKey = 'autoLoginEnabled' | 'passwordCheckEnabled' | 'friendActionsEnabled';

interface FeatureFlags {
  autoLoginEnabled: boolean;
  passwordCheckEnabled: boolean;
  friendActionsEnabled: boolean;
}

interface FlagsCtx extends FeatureFlags {
  setFlag: (key: FlagKey, value: boolean) => void;
}

const STORAGE_KEY = 'SNAPPY_FEATURE_FLAGS';

const DEFAULT_FLAGS: FeatureFlags = {
  autoLoginEnabled: true,
  passwordCheckEnabled: true,
  friendActionsEnabled: true,
};

const FeatureFlagsContext = createContext<FlagsCtx | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from AsyncStorage once
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) {
          setFlags({ ...DEFAULT_FLAGS, ...JSON.parse(json) });
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  // Persist whenever flags change
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(flags)).catch(() => {});
    }
  }, [flags, isLoaded]);

  const setFlag = (key: FlagKey, value: boolean) =>
    setFlags((prev) => ({ ...prev, [key]: value }));

  if (!isLoaded) return null; // Prevent flicker while loading

  return (
    <FeatureFlagsContext.Provider value={{ ...flags, setFlag }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FlagsCtx {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return ctx;
}