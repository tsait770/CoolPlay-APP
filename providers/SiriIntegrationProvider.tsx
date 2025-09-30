import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import voiceCommands from '@/constants/voiceCommands.json';
import { useLanguage } from '@/hooks/useLanguage';
import { useStorage } from '@/providers/StorageProvider';

export const [SiriIntegrationProvider, useSiriIntegration] = createContextHook(() => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isBackgroundMode, setIsBackgroundMode] = useState(false);
  const [isSiriEnabled, setIsSiriEnabled] = useState(false);
  const { language } = useLanguage();
  const storage = useStorage();
  const recordingRef = useRef<any>(null);
  const appStateRef = useRef(AppState.currentState);
  const recognitionRef = useRef<any>(null);
  const continuousListeningRef = useRef(false);

  // Safe storage access
  const getItem = useCallback(async (key: string) => {
    try {
      if (!key || !key.trim() || key.length > 100) {
        console.error('Invalid storage key');
        return null;
      }
      const sanitizedKey = key.trim();
      if (storage && typeof storage.getItem === 'function') {
        return await storage.getItem(sanitizedKey);
      }
      return null;
    } catch (error) {
      console.error('Error getting item:', error);
      return null;
    }
  }, [storage]);

  const setItem = useCallback(async (key: string, value: string) => {
    try {
      if (!key || !key.trim() || key.length > 100) {
        console.error('Invalid storage key');
        return;
      }
      if (!value || value.length > 10000) {
        console.error('Invalid storage value');
        return;
      }
      const sanitizedKey = key.trim();
      const sanitizedValue = value.trim();
      if (storage && typeof storage.setItem === 'function') {
        await storage.setItem(sanitizedKey, sanitizedValue);
      }
    } catch (error) {
      console.error('Error setting item:', error);
    }
  }, [storage]);

  // Check and request permissions
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        // Web permissions
        if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
          setError('Voice control not supported on this browser');
          return false;
        }
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach(track => {
              if (track && typeof track.stop === 'function') {
                track.stop();
              }
            });
          }
          setHasPermission(true);
          await setItem('voicePermissionGranted', 'true');
          return true;
        } catch {
          setError('Microphone permission denied');
          return false;
        }
      } else {
        // Mobile permissions - simplified without expo-av
        // In production, this would use a native module for permissions
        // For now, we'll assume permission is granted on mobile
        setHasPermission(true);
        await setItem('voicePermissionGranted', 'true');
        return true;
      }
    } catch (err) {
      console.error('Permission request error:', err);
      setError('Failed to request permissions');
      return false;
    }
  }, [setItem]);

  // Enhanced command matching with fuzzy matching
  const findMatchingCommand = useCallback((input: string): string | null => {
    try {
      if (!input || typeof input !== 'string') return null;
      
      const normalizedInput = input.toLowerCase().trim();
      
      // Remove common filler words
      const cleanInput = normalizedInput
        .replace(/\b(please|can you|could you|would you|i want to|i'd like to)\b/g, '')
        .trim();
      
      // Get commands for current language
      const commands = voiceCommands?.commands || [];
      
      // First pass: exact match
      for (const command of commands) {
        if (!command || !command.utterances) continue;
        
        const utterances = command.utterances[language as keyof typeof command.utterances] || command.utterances.en;
        
        if (Array.isArray(utterances)) {
          for (const utterance of utterances) {
            if (typeof utterance === 'string') {
              if (cleanInput === utterance.toLowerCase() || normalizedInput === utterance.toLowerCase()) {
                return command.intent;
              }
            }
          }
        }
      }
      
      // Second pass: contains match
      for (const command of commands) {
        if (!command || !command.utterances) continue;
        
        const utterances = command.utterances[language as keyof typeof command.utterances] || command.utterances.en;
        
        if (Array.isArray(utterances)) {
          for (const utterance of utterances) {
            if (typeof utterance === 'string') {
              if (cleanInput.includes(utterance.toLowerCase()) || normalizedInput.includes(utterance.toLowerCase())) {
                return command.intent;
              }
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error in findMatchingCommand:', error);
      return null;
    }
  }, [language]);

  // Execute voice command with improved feedback
  const executeCommand = useCallback((command: string) => {
    try {
      // Validate input
      if (!command || typeof command !== 'string' || !command.trim()) return;
      if (command.length > 100) return;
      const sanitizedCommand = command.trim();
      
      setLastCommand(sanitizedCommand);
      setIsProcessing(true);
      
      // Emit event for other components to handle
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        const event = new CustomEvent('voiceCommand', { detail: { command: sanitizedCommand } });
        window.dispatchEvent(event);
      }
      
      // Audio feedback removed due to expo-audio limitations
      // Consider using expo-haptics for tactile feedback instead
      
      // Visual feedback duration
      setTimeout(() => {
        setIsProcessing(false);
      }, 300);
    } catch (error) {
      console.error('Error in executeCommand:', error);
      setIsProcessing(false);
    }
  }, []);

  // Enable Siri shortcuts (iOS only)
  const enableSiri = useCallback(async () => {
    if (Platform.OS === 'ios') {
      try {
        // This would integrate with native iOS Siri Shortcuts
        // For now, we'll mark it as enabled
        await setItem('siriShortcutsEnabled', 'true');
        setIsSiriEnabled(true);
        // In production, this would show a native iOS dialog
        console.log('Siri shortcuts enabled');
      } catch (err) {
        console.error('Failed to enable Siri:', err);
        setError('Failed to enable Siri shortcuts');
      }
    }
  }, [setItem]);

  // Register app shortcuts
  const registerShortcuts = useCallback(async () => {
    if (Platform.OS === 'ios') {
      // Register shortcuts with iOS
      const shortcuts = [
        { phrase: 'Play Video', intent: 'PlayVideoIntent' },
        { phrase: 'Pause Video', intent: 'PauseVideoIntent' },
        { phrase: 'Next Video', intent: 'NextVideoIntent' },
        { phrase: 'Forward 10 seconds', intent: 'Forward10Intent' },
        { phrase: 'Volume Max', intent: 'VolumeMaxIntent' },
      ];
      
      // Store shortcuts for reference
      try {
        const shortcutsJson = JSON.stringify(shortcuts);
        if (shortcutsJson && shortcutsJson.length > 0) {
          await setItem('registeredShortcuts', shortcutsJson);
        }
      } catch (jsonError) {
        console.error('Failed to stringify shortcuts:', jsonError);
      }
      
      // In production, this would show a native iOS dialog
      console.log('Shortcuts registered');
    }
  }, [setItem]);

  // Enhanced continuous listening with auto-restart
  const startContinuousListening = useCallback(async () => {
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) return;
      }

      continuousListeningRef.current = true;
      await setItem('voiceControlAutoStart', 'true');
      
      const listen = async () => {
        if (!continuousListeningRef.current) return;
        
        try {
          if (Platform.OS === 'web') {
            if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
              const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
              if (typeof SpeechRecognition === 'function') {
                const recognition = new SpeechRecognition();
                
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.maxAlternatives = 3;
                recognition.lang = language === 'zh-TW' ? 'zh-TW' : 
                                 language === 'zh-CN' ? 'zh-CN' :
                                 language === 'es' ? 'es-ES' :
                                 language === 'pt' ? 'pt-PT' :
                                 language === 'pt-BR' ? 'pt-BR' :
                                 language === 'de' ? 'de-DE' :
                                 language === 'fr' ? 'fr-FR' :
                                 language === 'ru' ? 'ru-RU' :
                                 language === 'ar' ? 'ar-SA' :
                                 language === 'ja' ? 'ja-JP' :
                                 language === 'ko' ? 'ko-KR' :
                                 'en-US';
                
                recognition.onresult = (event: any) => {
                  try {
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                      const result = event.results[i];
                      if (result && result.isFinal && result[0] && result[0].transcript) {
                        const transcript = result[0].transcript;
                        console.log('Voice input:', transcript);
                        
                        const matchedCommand = findMatchingCommand(transcript);
                        if (matchedCommand) {
                          executeCommand(matchedCommand);
                          // Don't stop listening, just execute the command
                        }
                      }
                    }
                  } catch (resultError) {
                    console.error('Error processing speech result:', resultError);
                  }
                };
                
                recognition.onerror = (event: any) => {
                  console.error('Speech recognition error:', event.error);
                  if (event.error === 'no-speech' || event.error === 'audio-capture') {
                    // Restart recognition
                    setTimeout(() => {
                      if (continuousListeningRef.current && typeof recognition.start === 'function') {
                        try {
                          recognition.start();
                        } catch (startError) {
                          console.error('Error restarting recognition:', startError);
                        }
                      }
                    }, 1000);
                  } else {
                    setError(`Recognition error: ${event.error}`);
                    setIsListening(false);
                    continuousListeningRef.current = false;
                  }
                };
                
                recognition.onend = () => {
                  // Auto-restart if continuous listening is enabled
                  if (continuousListeningRef.current) {
                    setTimeout(() => {
                      if (continuousListeningRef.current && typeof recognition.start === 'function') {
                        try {
                          recognition.start();
                        } catch (startError) {
                          console.error('Error restarting recognition on end:', startError);
                        }
                      }
                    }, 100);
                  } else {
                    setIsListening(false);
                  }
                };
                
                recognition.start();
                recognitionRef.current = recognition;
                setIsListening(true);
              } else {
                setError('Speech recognition not available');
              }
            } else {
              setError('Speech recognition not supported in this browser');
            }
          } else {
            // Mobile implementation - simplified without expo-av
            // In production, this would use a native module for recording
            // For now, we'll just set the listening state
            setIsListening(true);
            console.log('Voice control started (mobile)');
          }
        } catch (err) {
          console.error('Failed to start continuous listening:', err);
          setError('Failed to start voice recognition');
          setIsListening(false);
          continuousListeningRef.current = false;
        }
      };
      
      await listen();
    } catch (error) {
      console.error('Error in startContinuousListening:', error);
      setError('Failed to initialize voice control');
      setIsListening(false);
      continuousListeningRef.current = false;
    }
  }, [hasPermission, requestPermission, language, findMatchingCommand, executeCommand, setItem]);

  // Start listening for voice commands
  const startListening = useCallback(async () => {
    await startContinuousListening();
  }, [startContinuousListening]);

  // Stop listening for voice commands
  const stopListening = useCallback(async () => {
    continuousListeningRef.current = false;
    await setItem('voiceControlAutoStart', 'false');
    setIsListening(false);
    
    try {
      if (Platform.OS === 'web') {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
      } else {
        // Mobile - simplified without expo-av
        if (recordingRef.current) {
          recordingRef.current = null;
        }
      }
    } catch (err) {
      console.error('Failed to stop listening:', err);
    }
  }, [setItem]);

  // Handle app state changes for background mode
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        setIsBackgroundMode(false);
        // Resume listening if it was active
        if (continuousListeningRef.current && !isListening) {
          startListening();
        }
      } else if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        setIsBackgroundMode(true);
        // Keep listening in background for iOS if possible
        if (Platform.OS === 'ios' && continuousListeningRef.current) {
          // Background audio session is already configured
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isListening, startListening]);

  // Initialize permissions and check previous state
  useEffect(() => {
    const initializeVoiceControl = async () => {
      try {
        const permissionGranted = await getItem('voicePermissionGranted');
        if (permissionGranted === 'true') {
          setHasPermission(true);
          // Auto-start listening if previously enabled
          const autoStart = await getItem('voiceControlAutoStart');
          if (autoStart === 'true') {
            // Will start after component mounts
            setTimeout(() => {
              try {
                startListening();
              } catch (startError) {
                console.error('Error auto-starting voice control:', startError);
              }
            }, 1000);
          }
        } else {
          requestPermission();
        }
        
        // Check if Siri shortcuts are enabled
        const siriEnabled = await getItem('siriShortcutsEnabled');
        setIsSiriEnabled(siriEnabled === 'true');
      } catch (error) {
        console.error('Error initializing voice control:', error);
      }
    };
    
    initializeVoiceControl();
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (recognitionRef.current) {
        try {
          if (typeof recognitionRef.current.stop === 'function') {
            recognitionRef.current.stop();
          }
        } catch (err) {
          console.warn('Error stopping recognition on cleanup:', err);
        }
        recognitionRef.current = null;
      }
    };
  }, [getItem, requestPermission, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, [isListening, stopListening]);

  return useMemo(() => ({
    isListening: isListening || false,
    startListening: typeof startListening === 'function' ? startListening : () => Promise.resolve(),
    stopListening: typeof stopListening === 'function' ? stopListening : () => Promise.resolve(),
    executeCommand: typeof executeCommand === 'function' ? executeCommand : () => {},
    lastCommand: lastCommand || null,
    isProcessing: isProcessing || false,
    error: error || null,
    hasPermission: hasPermission || false,
    requestPermission: typeof requestPermission === 'function' ? requestPermission : () => Promise.resolve(false),
    isBackgroundMode: isBackgroundMode || false,
    isSiriEnabled: isSiriEnabled || false,
    enableSiri: typeof enableSiri === 'function' ? enableSiri : () => Promise.resolve(),
    registerShortcuts: typeof registerShortcuts === 'function' ? registerShortcuts : () => Promise.resolve(),
  }), [isListening, startListening, stopListening, executeCommand, lastCommand, isProcessing, error, hasPermission, requestPermission, isBackgroundMode, isSiriEnabled, enableSiri, registerShortcuts]);
});