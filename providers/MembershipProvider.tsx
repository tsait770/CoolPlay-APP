import { useState, useCallback, useMemo, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useStorage } from '@/providers/StorageProvider';

export type MembershipTier = 'trial' | 'free' | 'basic' | 'premium';

interface MembershipState {
  tier: MembershipTier;
  usageCount: number;
  dailyUsageCount: number;
  lastResetDate: string;
  trialUsed: boolean;
  trialUsageRemaining: number;
  monthlyUsageRemaining: number;
  isFirstLogin: boolean;
}

interface MembershipLimits {
  trial: { total: number };
  free: { daily: number };
  basic: { monthly: number; dailyBonus: number };
  premium: { unlimited: boolean };
}

const MEMBERSHIP_LIMITS: MembershipLimits = {
  trial: { total: 2000 },
  free: { daily: 30 },
  basic: { monthly: 1500, dailyBonus: 40 },
  premium: { unlimited: true },
};

export const [MembershipProvider, useMembership] = createContextHook(() => {
  const { getItem, setItem } = useStorage();
  const [state, setState] = useState<MembershipState>({
    tier: 'trial',
    usageCount: 0,
    dailyUsageCount: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
    trialUsed: false,
    trialUsageRemaining: MEMBERSHIP_LIMITS.trial.total,
    monthlyUsageRemaining: 0,
    isFirstLogin: true,
  });

  const saveMembershipData = useCallback(async (data: MembershipState) => {
    if (!data || typeof data !== 'object') return;
    try {
      await setItem('membershipData', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save membership data:', error);
    }
  }, [setItem]);

  const loadMembershipData = useCallback(async () => {
    try {
      const data = await getItem('membershipData');
      if (data) {
        const parsed = JSON.parse(data);
        const today = new Date().toISOString().split('T')[0];
        
        // Check if we need to reset daily usage
        if (parsed.lastResetDate !== today) {
          parsed.dailyUsageCount = 0;
          parsed.lastResetDate = today;
        }
        
        setState(parsed);
      } else {
        // First time user - set up trial
        const initialState: MembershipState = {
          tier: 'trial',
          usageCount: 0,
          dailyUsageCount: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
          trialUsed: false,
          trialUsageRemaining: MEMBERSHIP_LIMITS.trial.total,
          monthlyUsageRemaining: 0,
          isFirstLogin: true,
        };
        setState(initialState);
        await saveMembershipData(initialState);
      }
    } catch (error) {
      console.error('Failed to load membership data:', error);
    }
  }, [getItem, saveMembershipData]);

  const canUseFeature = useCallback((): boolean => {
    const today = new Date().toISOString().split('T')[0];
    
    // Reset daily usage if needed
    if (state.lastResetDate !== today) {
      setState(prev => ({
        ...prev,
        dailyUsageCount: 0,
        lastResetDate: today,
      }));
    }

    switch (state.tier) {
      case 'trial':
        return state.trialUsageRemaining > 0;
      case 'free':
        return state.dailyUsageCount < MEMBERSHIP_LIMITS.free.daily;
      case 'basic':
        return state.monthlyUsageRemaining > 0 || state.dailyUsageCount < MEMBERSHIP_LIMITS.basic.dailyBonus;
      case 'premium':
        return true;
      default:
        return false;
    }
  }, [state]);

  const useFeature = useCallback(async () => {
    if (!canUseFeature()) {
      return false;
    }

    const newState = { ...state };
    newState.usageCount++;
    newState.dailyUsageCount++;

    switch (state.tier) {
      case 'trial':
        newState.trialUsageRemaining--;
        // Switch to free tier when trial is exhausted
        if (newState.trialUsageRemaining === 0) {
          newState.tier = 'free';
          newState.trialUsed = true;
        }
        break;
      case 'basic':
        if (newState.monthlyUsageRemaining > 0) {
          newState.monthlyUsageRemaining--;
        }
        break;
    }

    setState(newState);
    await saveMembershipData(newState);
    return true;
  }, [state, canUseFeature, saveMembershipData]);

  const upgradeTier = useCallback(async (newTier: MembershipTier) => {
    const newState = {
      ...state,
      tier: newTier,
    };

    if (newTier === 'basic') {
      newState.monthlyUsageRemaining = MEMBERSHIP_LIMITS.basic.monthly;
    }

    setState(newState);
    await saveMembershipData(newState);
  }, [state, saveMembershipData]);

  const getRemainingUsage = useCallback((): number => {
    switch (state.tier) {
      case 'trial':
        return state.trialUsageRemaining;
      case 'free':
        return Math.max(0, MEMBERSHIP_LIMITS.free.daily - state.dailyUsageCount);
      case 'basic':
        return state.monthlyUsageRemaining + Math.max(0, MEMBERSHIP_LIMITS.basic.dailyBonus - state.dailyUsageCount);
      case 'premium':
        return -1; // Unlimited
      default:
        return 0;
    }
  }, [state]);

  const markFirstLoginComplete = useCallback(async () => {
    const newState = {
      ...state,
      isFirstLogin: false,
    };
    setState(newState);
    await saveMembershipData(newState);
  }, [state, saveMembershipData]);

  // Load membership data on mount
  useEffect(() => {
    loadMembershipData();
  }, [loadMembershipData]);

  return useMemo(() => ({
    ...state,
    canUseFeature,
    useFeature,
    upgradeTier,
    getRemainingUsage,
    markFirstLoginComplete,
    limits: MEMBERSHIP_LIMITS,
  }), [state, canUseFeature, useFeature, upgradeTier, getRemainingUsage, markFirstLoginComplete]);
});