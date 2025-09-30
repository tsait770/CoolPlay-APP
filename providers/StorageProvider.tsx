import { useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
// eslint-disable-next-line @rork/linters/rsp-no-asyncstorage-direct
import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe JSON parsing utility
export const safeJsonParse = (data: string, fallback: any = null) => {
  try {
    if (!data || typeof data !== 'string' || data.trim().length === 0) {
      return fallback;
    }
    
    // Clean the data
    const cleaned = data
      .trim()
      .replace(/^\uFEFF/, '') // Remove BOM
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\\n/g, '') // Remove escaped newlines
      .replace(/\\r/g, '') // Remove escaped carriage returns
      .replace(/\\t/g, ''); // Remove escaped tabs
    
    // Check for corruption patterns
    if (cleaned.includes('object Object') || 
        cleaned.includes('undefined') || 
        cleaned.includes('NaN') ||
        cleaned.match(/^[a-zA-Z]/) || // Starts with letter (not JSON)
        (!cleaned.includes('{') && !cleaned.includes('['))) {
      console.log('Detected corrupted data pattern');
      return fallback;
    }
    
    // Validate JSON structure
    if ((cleaned.startsWith('{') && cleaned.endsWith('}')) ||
        (cleaned.startsWith('[') && cleaned.endsWith(']'))) {
      const parsed = JSON.parse(cleaned);
      return parsed;
    }
    
    return fallback;
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
};

export const [StorageProvider, useStorage] = createContextHook(() => {
  const getItem = useCallback(async (key: string): Promise<string | null> => {
    try {
      if (!key || !key.trim()) {
        console.error('Invalid storage key');
        return null;
      }
      const data = await AsyncStorage.getItem(key.trim());
      
      // If data exists but looks corrupted, clear it
      if (data && typeof data === 'string' && data.length > 0) {
        const cleaned = data.trim();
        if (cleaned.includes('object Object') || 
            cleaned.includes('undefined') || 
            cleaned.includes('NaN') ||
            cleaned.match(/^[a-zA-Z]/) || // Starts with letter (not JSON)
            (!cleaned.includes('{') && !cleaned.includes('[') && cleaned.length > 10)) {
          console.log(`Clearing corrupted data for key: ${key}`);
          await AsyncStorage.removeItem(key.trim());
          return null;
        }
      }
      
      return data;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return null;
    }
  }, []);

  const setItem = useCallback(async (key: string, value: string): Promise<void> => {
    try {
      if (!key || !key.trim()) {
        console.error('Invalid storage key');
        return;
      }
      if (value === null || value === undefined) {
        console.error('Invalid storage value');
        return;
      }
      await AsyncStorage.setItem(key.trim(), value);
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
    }
  }, []);

  const removeItem = useCallback(async (key: string): Promise<void> => {
    try {
      if (!key || !key.trim()) {
        console.error('Invalid storage key');
        return;
      }
      await AsyncStorage.removeItem(key.trim());
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
    }
  }, []);

  const clear = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }, []);

  const clearCorruptedData = useCallback(async (): Promise<void> => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const corruptedKeys: string[] = [];
      
      for (const key of allKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data && typeof data === 'string' && data.length > 0) {
            const cleaned = data.trim();
            if (cleaned.includes('object Object') || 
                cleaned.includes('undefined') || 
                cleaned.includes('NaN') ||
                cleaned.match(/^[a-zA-Z]/) || // Starts with letter (not JSON)
                (!cleaned.includes('{') && !cleaned.includes('[') && cleaned.length > 10)) {
              corruptedKeys.push(key);
            } else {
              // Try to parse as JSON to verify it's valid
              try {
                if ((cleaned.startsWith('{') && cleaned.endsWith('}')) ||
                    (cleaned.startsWith('[') && cleaned.endsWith(']'))) {
                  JSON.parse(cleaned);
                }
              } catch {
                corruptedKeys.push(key);
              }
            }
          }
        } catch (error) {
          console.error(`Error checking key ${key}:`, error);
          corruptedKeys.push(key);
        }
      }
      
      if (corruptedKeys.length > 0) {
        console.log('Clearing corrupted storage keys:', corruptedKeys);
        await AsyncStorage.multiRemove(corruptedKeys);
      }
    } catch (error) {
      console.error('Failed to clear corrupted data:', error);
    }
  }, []);

  return useMemo(() => ({
    getItem,
    setItem,
    removeItem,
    clear,
    clearCorruptedData,
    safeJsonParse,
  }), [getItem, setItem, removeItem, clear, clearCorruptedData]);
});