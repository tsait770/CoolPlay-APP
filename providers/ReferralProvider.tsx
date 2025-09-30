import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

interface ReferralRecord {
  recordId: string;
  referrerId: string;
  referralCode: string;
  platform: string;
  timestamp: string;
  status: 'shared' | 'registered' | 'rewarded';
  inviteeId: string | null;
  rewardGranted: boolean;
  registrationDate?: string;
  rewardDate?: string;
}

interface UserReferralData {
  userId: string;
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  referralRate: number;
  voiceCredits: number;
  referralHistory: ReferralRecord[];
  enteredReferralCode?: string;
  hasUsedReferralCode: boolean;
}

interface ReferralContextValue {
  userData: UserReferralData;
  referralRecords: ReferralRecord[];
  recordReferralAction: (platform: string) => string;
  processReferralCode: (code: string) => Promise<{ success: boolean; message: string; credits?: number }>;
  updateStats: () => void;
  resetStats: () => void;
  simulateRegistration: () => void;
  grantReward: (recordId: string) => void;
  generateUserCode: () => string;
  validateCode: (code: string) => { isValid: boolean; type: 'promotional' | 'user' | 'admin' | 'invalid'; message?: string };
  getCodeInfo: (code: string) => {
    isValid: boolean;
    type: string;
    credits?: number;
    description?: string;
    remaining?: number;
  };
  getUsedReferralCodes: () => Promise<string[]>;
  getPromotionalCodes: () => Array<{ code: string; description: string; credits: number }>;
  isAdminCode: (code: string) => boolean;
}

const STORAGE_KEYS = {
  USER_DATA: 'userReferralData',
  REFERRAL_RECORDS: 'referralRecords',
};

const generateUserId = () => 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
// System-generated referral code validation
const SYSTEM_CODE_PREFIX = 'RK'; // Rork prefix for system codes

// Predefined promotional codes with metadata
interface SystemCode {
  code: string;
  type: 'promotional' | 'user_generated' | 'admin';
  credits: number;
  expiryDate?: string;
  maxUses?: number;
  currentUses: number;
  description?: string;
}

// System-managed promotional codes
const SYSTEM_PROMOTIONAL_CODES: Map<string, SystemCode> = new Map([
  ['RKWELCOME', { code: 'RKWELCOME', type: 'promotional', credits: 500, maxUses: 1000, currentUses: 0, description: 'Welcome bonus' }],
  ['RKNEW2025', { code: 'RKNEW2025', type: 'promotional', credits: 300, maxUses: 500, currentUses: 0, description: 'New Year 2025' }],
  ['RKBONUS50', { code: 'RKBONUS50', type: 'promotional', credits: 250, maxUses: 200, currentUses: 0, description: 'Special bonus' }],
  ['RKFRIEND1', { code: 'RKFRIEND1', type: 'promotional', credits: 400, maxUses: 100, currentUses: 0, description: 'Friend referral' }],
  ['RKSTART25', { code: 'RKSTART25', type: 'promotional', credits: 350, currentUses: 0, description: 'Starter pack' }],
]);

// Admin-only codes (hidden from regular users)
const ADMIN_CODES: Set<string> = new Set([
  'RKADMIN01', 'RKADMIN02', 'RKTEST001', 'RKDEBUG01'
]);

// Generate unique user referral codes
const generateUserReferralCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${SYSTEM_CODE_PREFIX}U${timestamp.slice(-3)}${random}`; // RKU prefix for user codes
};

// Generate system promotional codes (admin only)
const generateSystemPromotionalCode = (prefix: string = 'P') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `${SYSTEM_CODE_PREFIX}${prefix}${timestamp.slice(-3)}${random}`;
};

// Comprehensive code validation
const validateReferralCode = (code: string): { isValid: boolean; type: 'promotional' | 'user' | 'admin' | 'invalid'; message?: string } => {
  // Input validation
  if (!code || typeof code !== 'string' || code.length < 6 || code.length > 20) {
    return { isValid: false, type: 'invalid', message: 'Invalid code format' };
  }
  
  const sanitizedCode = code.trim().toUpperCase();
  
  // Must start with system prefix
  if (!sanitizedCode.startsWith(SYSTEM_CODE_PREFIX)) {
    return { isValid: false, type: 'invalid', message: 'Not a system-generated code' };
  }
  
  // Check if it's an admin code
  if (ADMIN_CODES.has(sanitizedCode)) {
    return { isValid: true, type: 'admin', message: 'Admin code' };
  }
  
  // Check if it's a promotional code
  if (SYSTEM_PROMOTIONAL_CODES.has(sanitizedCode)) {
    const promoCode = SYSTEM_PROMOTIONAL_CODES.get(sanitizedCode)!;
    
    // Check if code has expired
    if (promoCode.expiryDate && new Date(promoCode.expiryDate) < new Date()) {
      return { isValid: false, type: 'invalid', message: 'Code has expired' };
    }
    
    // Check if code has reached max uses
    if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
      return { isValid: false, type: 'invalid', message: 'Code has reached maximum uses' };
    }
    
    return { isValid: true, type: 'promotional', message: 'Valid promotional code' };
  }
  
  // Check if it follows user code pattern (RKU + alphanumeric)
  const userPattern = /^RKU[A-Z0-9]{4,7}$/;
  if (userPattern.test(sanitizedCode)) {
    return { isValid: true, type: 'user', message: 'Valid user referral code' };
  }
  
  // Invalid code
  return { isValid: false, type: 'invalid', message: 'Invalid or user-created code' };
};



export const [ReferralProvider, useReferral] = createContextHook<ReferralContextValue>(() => {
  const [userData, setUserData] = useState<UserReferralData>({
    userId: generateUserId(),
    referralCode: generateUserReferralCode(), // Generate unique user code
    totalReferrals: 0,
    activeReferrals: 0,
    referralRate: 0,
    voiceCredits: 2000, // Initial credits
    referralHistory: [],
    hasUsedReferralCode: false,
  });

  const [referralRecords, setReferralRecords] = useState<ReferralRecord[]>([]);

  // Load data from AsyncStorage on mount with delay
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[ReferralProvider] Loading user data...');
      loadUserData();
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const saveUserData = useCallback(async () => {
    try {
      // Validate data before saving
      if (userData && typeof userData === 'object') {
        const dataToSave = JSON.stringify(userData);
        // Double-check the JSON is valid before saving
        try {
          JSON.parse(dataToSave);
          await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, dataToSave);
        } catch (jsonError) {
          console.error('Invalid JSON data, not saving:', jsonError);
        }
      }
      if (Array.isArray(referralRecords)) {
        const recordsToSave = JSON.stringify(referralRecords);
        // Double-check the JSON is valid before saving
        try {
          JSON.parse(recordsToSave);
          await AsyncStorage.setItem(STORAGE_KEYS.REFERRAL_RECORDS, recordsToSave);
        } catch (jsonError) {
          console.error('Invalid JSON records, not saving:', jsonError);
        }
      }
    } catch (error) {
      console.error('Error saving referral data:', error);
    }
  }, [userData, referralRecords]);

  // Save data whenever it changes (with debounce to prevent too many saves)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveUserData();
    }, 500); // Debounce for 500ms
    
    return () => clearTimeout(timeoutId);
  }, [saveUserData]);

  const loadUserData = async () => {
    try {
      const savedUserData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      const savedRecords = await AsyncStorage.getItem(STORAGE_KEYS.REFERRAL_RECORDS);
      
      // Parse user data with comprehensive validation
      if (savedUserData && typeof savedUserData === 'string' && savedUserData.length > 0) {
        try {
          // Remove any potential BOM, invisible characters, and control characters
          const cleanedData = savedUserData
            .trim()
            .replace(/^\uFEFF/, '') // Remove BOM
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
            .replace(/\\n/g, '') // Remove escaped newlines
            .replace(/\\r/g, '') // Remove escaped carriage returns
            .replace(/\\t/g, ''); // Remove escaped tabs
          
          // Additional validation - check for common corruption patterns
          if (cleanedData.includes('object Object') || 
              cleanedData.includes('undefined') || 
              cleanedData.includes('NaN') ||
              cleanedData.match(/^[a-zA-Z]/) || // Starts with letter (not JSON)
              !cleanedData.includes('{')) {
            console.log('Detected corrupted user data, clearing');
            await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
            return;
          }
          
          // Only try to parse if it looks like valid JSON
          if (cleanedData.startsWith('{') && cleanedData.endsWith('}')) {
            const parsedData = JSON.parse(cleanedData);
            
            // Validate parsed data is an object with expected structure
            if (typeof parsedData === 'object' && parsedData !== null && !Array.isArray(parsedData)) {
              // Ensure required fields exist with proper type checking
              const validData: UserReferralData = {
                userId: typeof parsedData.userId === 'string' && parsedData.userId.length > 0 ? parsedData.userId : generateUserId(),
                referralCode: typeof parsedData.referralCode === 'string' && parsedData.referralCode.length > 0 ? parsedData.referralCode : generateUserReferralCode(),
                totalReferrals: typeof parsedData.totalReferrals === 'number' && !isNaN(parsedData.totalReferrals) ? parsedData.totalReferrals : 0,
                activeReferrals: typeof parsedData.activeReferrals === 'number' && !isNaN(parsedData.activeReferrals) ? parsedData.activeReferrals : 0,
                referralRate: typeof parsedData.referralRate === 'number' && !isNaN(parsedData.referralRate) ? parsedData.referralRate : 0,
                voiceCredits: typeof parsedData.voiceCredits === 'number' && !isNaN(parsedData.voiceCredits) ? parsedData.voiceCredits : 2000,
                referralHistory: Array.isArray(parsedData.referralHistory) ? parsedData.referralHistory : [],
                hasUsedReferralCode: typeof parsedData.hasUsedReferralCode === 'boolean' ? parsedData.hasUsedReferralCode : false,
                enteredReferralCode: typeof parsedData.enteredReferralCode === 'string' ? parsedData.enteredReferralCode : undefined,
              };
              setUserData(validData);
            } else {
              console.log('Invalid user data structure, resetting');
              await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
            }
          } else {
            console.log('Invalid JSON format for user data, resetting');
            await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
          }
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
        }
      }
      
      // Parse referral records with comprehensive validation
      if (savedRecords && typeof savedRecords === 'string' && savedRecords.length > 0) {
        try {
          // Remove any potential BOM, invisible characters, and control characters
          const cleanedRecords = savedRecords
            .trim()
            .replace(/^\uFEFF/, '') // Remove BOM
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
            .replace(/\\n/g, '') // Remove escaped newlines
            .replace(/\\r/g, '') // Remove escaped carriage returns
            .replace(/\\t/g, ''); // Remove escaped tabs
          
          // Additional validation - check for common corruption patterns
          if (cleanedRecords.includes('object Object') || 
              cleanedRecords.includes('undefined') || 
              cleanedRecords.includes('NaN') ||
              cleanedRecords.match(/^[a-zA-Z]/) || // Starts with letter (not JSON)
              !cleanedRecords.includes('[')) {
            console.log('Detected corrupted records data, clearing');
            await AsyncStorage.removeItem(STORAGE_KEYS.REFERRAL_RECORDS);
            return;
          }
          
          // Only try to parse if it looks like valid JSON array
          if (cleanedRecords.startsWith('[') && cleanedRecords.endsWith(']')) {
            const parsedRecords = JSON.parse(cleanedRecords);
            
            // Validate parsed records is an array
            if (Array.isArray(parsedRecords)) {
              // Filter out invalid records with proper type checking
              const validRecords = parsedRecords.filter(record => 
                typeof record === 'object' && 
                record !== null && 
                typeof record.recordId === 'string' && 
                record.recordId.length > 0 &&
                typeof record.referrerId === 'string' &&
                record.referrerId.length > 0
              ) as ReferralRecord[];
              setReferralRecords(validRecords);
            } else {
              console.log('Invalid records structure, resetting');
              await AsyncStorage.removeItem(STORAGE_KEYS.REFERRAL_RECORDS);
            }
          } else {
            console.log('Invalid JSON format for records, resetting');
            await AsyncStorage.removeItem(STORAGE_KEYS.REFERRAL_RECORDS);
          }
        } catch (parseError) {
          console.error('Error parsing referral records:', parseError);
          await AsyncStorage.removeItem(STORAGE_KEYS.REFERRAL_RECORDS);
        }
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
      // Clear all corrupted data as a last resort
      try {
        await AsyncStorage.multiRemove([STORAGE_KEYS.USER_DATA, STORAGE_KEYS.REFERRAL_RECORDS]);
        console.log('Cleared all referral storage due to errors');
      } catch (clearError) {
        console.error('Error clearing storage:', clearError);
      }
    }
  };



  const recordReferralAction = useCallback((platform: string): string => {
    const recordId = 'ref_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    
    const newRecord: ReferralRecord = {
      recordId,
      referrerId: userData.userId,
      referralCode: userData.referralCode,
      platform,
      timestamp: new Date().toISOString(),
      status: 'shared',
      inviteeId: null,
      rewardGranted: false,
    };
    
    setReferralRecords(prev => [...prev, newRecord]);
    
    // Update total referrals
    setUserData(prev => ({
      ...prev,
      totalReferrals: prev.totalReferrals + 1,
      referralHistory: [...prev.referralHistory, newRecord],
    }));
    
    return recordId;
  }, [userData.userId, userData.referralCode]);

  const getUsedReferralCodes = useCallback(async (): Promise<string[]> => {
    try {
      const usedCodes = await AsyncStorage.getItem('usedReferralCodes');
      return usedCodes ? JSON.parse(usedCodes) : [];
    } catch (error) {
      console.error('Error getting used codes:', error);
      return [];
    }
  }, []);

  const markReferralCodeAsUsed = useCallback(async (code: string): Promise<void> => {
    // Input validation
    if (!code || typeof code !== 'string' || code.trim().length === 0 || code.length > 20) {
      return;
    }
    
    const sanitizedCode = code.trim().toUpperCase();
    
    try {
      const usedCodes = await getUsedReferralCodes();
      const updatedCodes = [...usedCodes, sanitizedCode];
      await AsyncStorage.setItem('usedReferralCodes', JSON.stringify(updatedCodes));
    } catch (error) {
      console.error('Error marking code as used:', error);
    }
  }, [getUsedReferralCodes]);

  const simulateReferrerReward = useCallback((code: string) => {
    // Input validation
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return;
    }
    
    // In a real app, this would be handled by backend
    // Find if any of our shares resulted in this registration
    const pendingRecord = referralRecords.find(
      record => record.status === 'shared' && !record.inviteeId
    );

    if (pendingRecord) {
      // Update the record to registered
      const updatedRecords = referralRecords.map(record => {
        if (record.recordId === pendingRecord.recordId) {
          return {
            ...record,
            status: 'registered' as const,
            inviteeId: 'invitee_' + Date.now(),
            registrationDate: new Date().toISOString(),
          };
        }
        return record;
      });

      setReferralRecords(updatedRecords);
      
      // Update active referrals
      setUserData(prev => ({
        ...prev,
        activeReferrals: prev.activeReferrals + 1,
      }));

      // Schedule reward (in real app, this would be 24 hours)
      setTimeout(() => {
        grantReward(pendingRecord.recordId);
      }, 5000); // 5 seconds for demo
    }
  }, [referralRecords]);

  const processReferralCode = useCallback(async (code: string): Promise<{ success: boolean; message: string; credits?: number }> => {
    // Input validation
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return { success: false, message: 'Please enter a valid code' };
    }
    
    const sanitizedCode = code.trim().toUpperCase();
    
    // Check if user has already used a referral code
    if (userData.hasUsedReferralCode) {
      return { success: false, message: 'You have already used a referral code' };
    }

    // Check if the code is valid (not the user's own code)
    if (sanitizedCode === userData.referralCode.toUpperCase()) {
      return { success: false, message: 'You cannot use your own referral code' };
    }

    // Validate the code
    const validation = validateReferralCode(sanitizedCode);
    
    if (!validation.isValid) {
      return { success: false, message: validation.message || 'Invalid code' };
    }

    // Block admin codes from regular use
    if (validation.type === 'admin') {
      return { success: false, message: 'This code is not available for public use' };
    }

    // Check if code has already been used by this device
    const usedCodes = await getUsedReferralCodes();
    if (usedCodes.includes(sanitizedCode)) {
      return { success: false, message: 'This code has already been used on this device' };
    }

    // Determine credits based on code type
    let creditsToAdd = 300; // Default for user codes
    let codeDescription = 'Referral bonus';
    
    if (validation.type === 'promotional') {
      const promoCode = SYSTEM_PROMOTIONAL_CODES.get(sanitizedCode);
      if (promoCode) {
        creditsToAdd = promoCode.credits;
        codeDescription = promoCode.description || 'Promotional bonus';
        
        // Update usage count (in real app, this would be backend)
        promoCode.currentUses++;
        SYSTEM_PROMOTIONAL_CODES.set(sanitizedCode, promoCode);
      }
    }

    // Mark code as used
    await markReferralCodeAsUsed(sanitizedCode);

    // Apply the bonus
    setUserData(prev => ({
      ...prev,
      enteredReferralCode: sanitizedCode,
      hasUsedReferralCode: true,
      voiceCredits: prev.voiceCredits + creditsToAdd,
    }));

    // If it's a user code, reward the referrer
    if (validation.type === 'user') {
      simulateReferrerReward(sanitizedCode);
    }

    return { 
      success: true, 
      message: `${codeDescription}: +${creditsToAdd} credits added!`,
      credits: creditsToAdd 
    };
  }, [userData.hasUsedReferralCode, userData.referralCode, getUsedReferralCodes, markReferralCodeAsUsed, simulateReferrerReward]);



  const updateStats = useCallback(() => {
    setUserData(prev => {
      const rate = prev.totalReferrals > 0 
        ? Number(((prev.activeReferrals / prev.totalReferrals) * 100).toFixed(1))
        : 0;
      
      return {
        ...prev,
        referralRate: rate,
      };
    });
  }, []);

  const grantReward = useCallback((recordId: string) => {
    const record = referralRecords.find(r => r.recordId === recordId);
    
    if (record && !record.rewardGranted) {
      // Update record status
      const updatedRecords = referralRecords.map(r => {
        if (r.recordId === recordId) {
          return {
            ...r,
            status: 'rewarded' as const,
            rewardGranted: true,
            rewardDate: new Date().toISOString(),
          };
        }
        return r;
      });
      
      setReferralRecords(updatedRecords);
      
      // Add voice credits
      setUserData(prev => ({
        ...prev,
        voiceCredits: prev.voiceCredits + 300,
      }));
    }
  }, [referralRecords]);

  const simulateRegistration = useCallback(() => {
    // Find a pending referral record
    const pendingRecord = referralRecords.find(
      record => record.status === 'shared' && !record.inviteeId
    );
    
    if (pendingRecord) {
      // Update record to registered
      const updatedRecords = referralRecords.map(record => {
        if (record.recordId === pendingRecord.recordId) {
          return {
            ...record,
            status: 'registered' as const,
            inviteeId: 'invitee_' + Date.now(),
            registrationDate: new Date().toISOString(),
          };
        }
        return record;
      });
      
      setReferralRecords(updatedRecords);
      
      // Update active referrals
      setUserData(prev => ({
        ...prev,
        activeReferrals: prev.activeReferrals + 1,
      }));
      
      // Schedule reward (5 seconds for demo, would be 24 hours in production)
      setTimeout(() => {
        grantReward(pendingRecord.recordId);
      }, 5000);
    }
  }, [referralRecords, grantReward]);

  const resetStats = useCallback(async () => {
    // Clear AsyncStorage
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER_DATA, STORAGE_KEYS.REFERRAL_RECORDS, 'usedReferralCodes']);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
    
    // Reset state to defaults
    setUserData({
      userId: generateUserId(),
      referralCode: generateUserReferralCode(), // Generate new unique code
      totalReferrals: 0,
      activeReferrals: 0,
      referralRate: 0,
      voiceCredits: 2000,
      referralHistory: [],
      hasUsedReferralCode: false,
    });
    setReferralRecords([]);
  }, []);

  // Helper functions for referral code management
  const generateUserCode = useCallback((): string => {
    return generateUserReferralCode();
  }, []);

  const validateCode = useCallback((code: string) => {
    return validateReferralCode(code);
  }, []);

  const getCodeInfo = useCallback((code: string) => {
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return {
        isValid: false,
        type: 'invalid',
      };
    }
    
    const sanitizedCode = code.trim().toUpperCase();
    const validation = validateReferralCode(sanitizedCode);
    
    let result: any = {
      isValid: validation.isValid,
      type: validation.type,
    };
    
    // Add promotional code details if applicable
    if (validation.type === 'promotional' && SYSTEM_PROMOTIONAL_CODES.has(sanitizedCode)) {
      const promoCode = SYSTEM_PROMOTIONAL_CODES.get(sanitizedCode)!;
      result.credits = promoCode.credits;
      result.description = promoCode.description;
      if (promoCode.maxUses) {
        result.remaining = promoCode.maxUses - promoCode.currentUses;
      }
    }
    
    return result;
  }, []);

  const getPromotionalCodes = useCallback(() => {
    // Return only active promotional codes (not admin codes)
    return Array.from(SYSTEM_PROMOTIONAL_CODES.values())
      .filter(code => !code.expiryDate || new Date(code.expiryDate) > new Date())
      .filter(code => !code.maxUses || code.currentUses < code.maxUses)
      .map(code => ({
        code: code.code,
        description: code.description || 'Special offer',
        credits: code.credits,
      }));
  }, []);

  const isAdminCode = useCallback((code: string): boolean => {
    if (!code) return false;
    return ADMIN_CODES.has(code.trim().toUpperCase());
  }, []);

  return useMemo(() => ({
    userData,
    referralRecords,
    recordReferralAction,
    processReferralCode,
    updateStats,
    resetStats,
    simulateRegistration,
    grantReward,
    generateUserCode,
    validateCode,
    getCodeInfo,
    getUsedReferralCodes,
    getPromotionalCodes,
    isAdminCode,
  }), [
    userData,
    referralRecords,
    recordReferralAction,
    processReferralCode,
    updateStats,
    resetStats,
    simulateRegistration,
    grantReward,
    generateUserCode,
    validateCode,
    getCodeInfo,
    getUsedReferralCodes,
    getPromotionalCodes,
    isAdminCode,
  ]);
});