import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { useLanguage } from '@/hooks/useLanguage';
import { useStorage } from '@/providers/StorageProvider';
// Import JSON files directly to avoid dynamic import issues
import voiceCommandsData from '@/constants/voiceCommands.json';
import voiceIntentsData from '@/constants/voiceIntents.json';

// Use imported data directly
const voiceCommands = voiceCommandsData;
const voiceIntents = voiceIntentsData;

// Load JSON files safely (now just returns the imported data)
const loadVoiceData = async () => {
  try {
    // Data is already loaded via imports
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to load voice data:', error);
    return Promise.resolve();
  }
};

interface VoiceControlState {
  isListening: boolean;
  alwaysListening: boolean;
  usageCount: number;
  lastCommand: string | null;
  confidence: number;
  isProcessing: boolean;
}

interface VoiceCommand {
  intent: string;
  action?: string;
  slot: any;
  usage_count: number;
  utterances: Record<string, string[]>;
}

export const [VoiceControlProvider, useVoiceControl] = createContextHook(() => {
  const { language } = useLanguage();
  const storage = useStorage();
  const [state, setState] = useState<VoiceControlState>({
    isListening: false,
    alwaysListening: false,
    usageCount: 0,
    lastCommand: null,
    confidence: 0,
    isProcessing: false,
  });

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const keepAliveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognition = useRef<any>(null);

  const loadSettings = useCallback(async () => {
    try {
      if (!storage || typeof storage.getItem !== 'function') {
        console.warn('Storage not available, using default settings');
        return;
      }
      const settings = await storage.getItem('voiceControlSettings');
      if (settings && typeof settings === 'string' && settings.trim()) {
        try {
          // Additional validation before parsing
          const trimmedSettings = settings.trim();
          if (!trimmedSettings.startsWith('{') || !trimmedSettings.endsWith('}')) {
            throw new Error('Invalid JSON format');
          }
          
          let parsed;
          try {
            // Additional validation before parsing
            if (trimmedSettings.includes('object Object') || 
                trimmedSettings.includes('undefined') || 
                trimmedSettings.includes('NaN') ||
                trimmedSettings.includes('Voice commands import error') ||
                trimmedSettings.includes('source.uri should not be an empty string') ||
                trimmedSettings.match(/^[a-zA-Z]/)) {
              throw new Error('Corrupted data detected');
            }
            parsed = JSON.parse(trimmedSettings);
          } catch (jsonError) {
            console.error('JSON parse error in loadSettings:', jsonError);
            console.log('Problematic data:', trimmedSettings.substring(0, 100));
            throw new Error('Invalid JSON format in stored settings');
          }
          
          // Validate parsed data structure
          if (typeof parsed !== 'object' || parsed === null) {
            throw new Error('Parsed data is not an object');
          }
          
          setState(prev => ({
            ...prev,
            alwaysListening: typeof parsed.alwaysListening === 'boolean' ? parsed.alwaysListening : false,
            usageCount: typeof parsed.usageCount === 'number' ? parsed.usageCount : 0,
          }));
        } catch (parseError) {
          console.error('Failed to parse voice control settings:', parseError);
          console.log('Corrupted settings data:', settings);
          // Clear corrupted data
          try {
            if (storage && typeof storage.removeItem === 'function') {
              await storage.removeItem('voiceControlSettings');
              console.log('Cleared corrupted voice control settings');
            }
          } catch (clearError) {
            console.error('Failed to clear corrupted voice control settings:', clearError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load voice control settings:', error);
    }
  }, [storage]);

  // Clear any corrupted storage data on startup
  const clearCorruptedData = useCallback(async () => {
    try {
      if (!storage || typeof storage.getItem !== 'function') return;
      
      const keys = ['voiceControlSettings'];
      for (const key of keys) {
        const data = await storage.getItem(key);
        if (data && typeof data === 'string' && data.trim()) {
          const trimmed = data.trim();
          // Check if it's valid JSON
          if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
            console.log(`Clearing corrupted data for key: ${key}`);
            await storage.removeItem(key);
          } else {
            try {
              // Additional validation before parsing
              if (trimmed.includes('object Object') || 
                  trimmed.includes('undefined') || 
                  trimmed.includes('NaN') ||
                  trimmed.includes('Voice commands import error') ||
                  trimmed.includes('source.uri should not be an empty string') ||
                  trimmed.match(/^[a-zA-Z]/)) {
                throw new Error('Corrupted data detected');
              }
              JSON.parse(trimmed);
            } catch (jsonError) {
              console.log(`Clearing invalid JSON for key: ${key}`, jsonError);
              console.log('Invalid data:', trimmed.substring(0, 100));
              await storage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error clearing corrupted data:', error);
    }
  }, [storage]);

  // Load settings from localStorage with delay
  useEffect(() => {
    const timer = setTimeout(() => {
      const initializeSettings = async () => {
        console.log('[VoiceControlProvider] Initializing settings...');
        if (storage && typeof storage.clearCorruptedData === 'function') {
          await storage.clearCorruptedData();
        }
        await clearCorruptedData();
        await loadSettings();
      };
      initializeSettings();
    }, 900);
    return () => clearTimeout(timer);
  }, [clearCorruptedData, loadSettings, storage]);



  const saveSettings = useCallback(async (settings: Partial<VoiceControlState>) => {
    try {
      if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
        console.warn('Storage not available, cannot save settings');
        return;
      }
      const current = await storage.getItem('voiceControlSettings');
      let currentData = {};
      
      if (current && typeof current === 'string' && current.trim()) {
        try {
          const trimmedCurrent = current.trim();
          if (trimmedCurrent.startsWith('{') && trimmedCurrent.endsWith('}')) {
            let parsed;
            try {
              // Additional validation before parsing
              if (trimmedCurrent.includes('object Object') || 
                  trimmedCurrent.includes('undefined') || 
                  trimmedCurrent.includes('NaN') ||
                  trimmedCurrent.includes('Voice commands import error') ||
                  trimmedCurrent.includes('source.uri should not be an empty string') ||
                  trimmedCurrent.match(/^[a-zA-Z]/)) {
                throw new Error('Corrupted data detected');
              }
              parsed = JSON.parse(trimmedCurrent);
            } catch (jsonError) {
              console.error('JSON parse error in saveSettings:', jsonError);
              console.log('Problematic data:', trimmedCurrent.substring(0, 100));
              throw new Error('Invalid JSON format in current settings');
            }
            if (typeof parsed === 'object' && parsed !== null) {
              currentData = parsed;
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse current settings, using defaults:', parseError);
          // Clear corrupted data
          try {
            await storage.removeItem('voiceControlSettings');
          } catch (clearError) {
            console.error('Failed to clear corrupted settings:', clearError);
          }
          currentData = {};
        }
      }
      
      // Validate settings before saving
      const validatedSettings: any = {};
      if (typeof settings.alwaysListening === 'boolean') {
        validatedSettings.alwaysListening = settings.alwaysListening;
      }
      if (typeof settings.usageCount === 'number' && !isNaN(settings.usageCount)) {
        validatedSettings.usageCount = settings.usageCount;
      }
      
      const updated = {
        ...currentData,
        ...validatedSettings,
      };
      
      const jsonString = JSON.stringify(updated);
      await storage.setItem('voiceControlSettings', jsonString);
    } catch (error) {
      console.error('Failed to save voice control settings:', error);
    }
  }, [storage]);

  const findMatchingCommand = useCallback(async (text: string, lang: string): Promise<VoiceCommand | null> => {
    try {
      if (!text || typeof text !== 'string') return null;
      
      // Ensure voice data is loaded
      await loadVoiceData();
      
      const normalizedText = text.toLowerCase().trim();
      let bestMatch: VoiceCommand | null = null;
      let bestScore = 0;
      
      // First, try new intent-based matching
      const intents: { intent: string; utterances: Record<string, string[]>; }[] = Array.isArray(voiceIntents) ? voiceIntents : [];
      for (const item of intents) {
        if (!item || !item.utterances) continue;
        const utterances = (item.utterances as any)[lang] || (item.utterances as any)['en'];
        if (!Array.isArray(utterances)) continue;
        for (const utterance of utterances) {
          if (typeof utterance !== 'string') continue;
          const normUtter = utterance.toLowerCase().trim();
          if (normalizedText === normUtter || normalizedText.includes(normUtter)) {
            return {
              intent: item.intent,
              action: undefined,
              slot: null,
              usage_count: 1,
              utterances: item.utterances,
            } as VoiceCommand;
          }
        }
      }

      // Fallback to legacy grouped commands
      const commands = (voiceCommands as any)?.commands || [];
      
      for (const command of commands) {
        if (!command || !command.utterances) continue;
        
        const utterances = (command.utterances as any)[lang] || (command.utterances as any)['en'];
        if (!Array.isArray(utterances)) continue;
        
        for (const utterance of utterances) {
          if (typeof utterance !== 'string') continue;
          
          const normalizedUtterance = utterance.toLowerCase();
          
          // Exact match
          if (normalizedText === normalizedUtterance) {
            return command;
          }
          
          // Contains match with scoring
          if (normalizedText.includes(normalizedUtterance)) {
            const score = normalizedUtterance.length / normalizedText.length;
            if (score > bestScore) {
              bestScore = score;
              bestMatch = command;
            }
          }
        }
      }
      
      // Return best match if score is above threshold
      return bestScore > 0.5 ? bestMatch : null;
    } catch (error) {
      console.error('Error in findMatchingCommand:', error);
      return null;
    }
  }, []);

  const executeCommand = useCallback(async (command: VoiceCommand) => {
    try {
      if (!command) return;
      
      const newCount = state.usageCount + (command.usage_count || 1);
      setState(prev => ({ ...prev, usageCount: newCount }));
      
      if (typeof saveSettings === 'function') {
        await saveSettings({ usageCount: newCount });
      }

      const event = new CustomEvent('voiceCommand', {
        detail: {
          intent: command.intent,
          action: command.action,
          slot: command.slot,
        },
      });
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Failed to execute voice command:', error);
    }
  }, [state.usageCount, saveSettings]);

  const processCommand = useCallback((text: string, confidence: number) => {
    try {
      if (!text || typeof text !== 'string') return;
      
      const normalizedText = text.toLowerCase().trim();
      
      // 立即更新狀態以提供即時反饋
      setState(prev => ({
        ...prev,
        lastCommand: normalizedText,
        confidence,
        isProcessing: false,
      }));

      // 使用 requestAnimationFrame 優化命令執行
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(async () => {
          try {
            const matchedCommand = await findMatchingCommand(normalizedText, language);
            
            if (matchedCommand) {
              // 降低信心閾值以提高識別率
              if (confidence >= 0.3) {
                executeCommand(matchedCommand);
              } else {
                console.log(`Low confidence: ${confidence}, but executing command: "${normalizedText}"`);
                executeCommand(matchedCommand);
              }
            } else {
              console.log(`No matching command found for: "${normalizedText}"`);
            }
          } catch (frameError) {
            console.error('Error in requestAnimationFrame callback:', frameError);
          }
        });
      } else {
        // Fallback for environments without requestAnimationFrame
        setTimeout(async () => {
          try {
            const matchedCommand = await findMatchingCommand(normalizedText, language);
            
            if (matchedCommand) {
              executeCommand(matchedCommand);
            } else {
              console.log(`No matching command found for: "${normalizedText}"`);
            }
          } catch (timeoutError) {
            console.error('Error in setTimeout callback:', timeoutError);
          }
        }, 0);
      }
    } catch (error) {
      console.error('Failed to process voice command:', error);
    }
  }, [language, executeCommand, findMatchingCommand]);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      if (typeof FormData === 'undefined' || typeof fetch === 'undefined') {
        console.warn('FormData or fetch not available');
        return;
      }
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', getLanguageCode(language));

      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        processCommand(result.text, 0.85);
      } else {
        console.error('Transcription API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Transcription failed:', error);
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [language, processCommand]);

  const getLanguageCode = (lang: string): string => {
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'zh-TW': 'zh-TW',
      'zh-CN': 'zh-CN',
      'es': 'es-ES',
      'pt-BR': 'pt-BR',
      'pt': 'pt-PT',
      'de': 'de-DE',
      'fr': 'fr-FR',
      'ru': 'ru-RU',
      'ar': 'ar-SA',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
    };
    return langMap[lang] || 'en-US';
  };

  // Define functions with useRef to avoid circular dependencies
  const startListeningRef = useRef<(() => Promise<void>) | null>(null);
  const stopListeningRef = useRef<(() => Promise<void>) | null>(null);

  const startWebRecording = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Media devices not available');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (typeof MediaRecorder === 'undefined') {
        console.warn('MediaRecorder not available');
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
        
        if (state.alwaysListening && startListeningRef.current) {
          // 減少延遲以提高連續識別速度
          setTimeout(() => {
            if (startListeningRef.current) {
              startListeningRef.current();
            }
          }, 100);
        }
      };

      mediaRecorder.current.start();
      
      // 縮短錄音時間以提高響應速度
      setTimeout(() => {
        if (mediaRecorder.current?.state === 'recording') {
          mediaRecorder.current.stop();
        }
      }, 5000);
    } catch (error) {
      console.error('Failed to start web recording:', error);
      setState(prev => ({ ...prev, isListening: false }));
    }
  }, [state.alwaysListening, transcribeAudio]);

  const startListening = useCallback(async () => {
    try {
      if (state.isListening) return;

      setState(prev => ({ ...prev, isListening: true, isProcessing: false }));

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
          const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
          if (typeof SpeechRecognition === 'function') {
            recognition.current = new SpeechRecognition();
            recognition.current.continuous = state.alwaysListening;
            recognition.current.interimResults = true;
            recognition.current.lang = getLanguageCode(language);

            recognition.current.onresult = (event: any) => {
              try {
                const last = event.results.length - 1;
                const result = event.results[last];
                if (result && result[0] && result[0].transcript) {
                  const transcript = result[0].transcript;
                  const confidence = result[0].confidence || 0.7;
                  
                  // 立即處理中間結果以提高響應速度
                  if (transcript.length > 2) {
                    setState(prev => ({ ...prev, lastCommand: transcript }));
                    
                    // 對於高置信度的中間結果，立即執行
                    if (!result.isFinal && confidence > 0.8) {
                      findMatchingCommand(transcript.toLowerCase().trim(), language).then(matchedCommand => {
                        if (matchedCommand) {
                          processCommand(transcript, confidence);
                        }
                      }).catch(error => {
                        console.error('Error in interim command matching:', error);
                      });
                    }
                  }
                  
                  if (result.isFinal) {
                    processCommand(transcript, confidence);
                  }
                }
              } catch (resultError) {
                console.error('Error processing speech result:', resultError);
              }
            };

            recognition.current.onerror = (event: any) => {
              console.error('Speech recognition error:', event.error);
              if (event.error === 'no-speech' && state.alwaysListening && startListeningRef.current) {
                // 快速重啟以保持背景監聽
                setTimeout(() => {
                  if (startListeningRef.current && typeof startListeningRef.current === 'function') {
                    try {
                      startListeningRef.current();
                    } catch (restartError) {
                      console.error('Error restarting recognition:', restartError);
                    }
                  }
                }, 200);
              } else if (stopListeningRef.current && typeof stopListeningRef.current === 'function') {
                stopListeningRef.current();
              }
            };

            recognition.current.onend = () => {
              if (state.alwaysListening && state.isListening && startListeningRef.current) {
                // 立即重啟以保持連續監聽
                setTimeout(() => {
                  if (startListeningRef.current && typeof startListeningRef.current === 'function') {
                    try {
                      startListeningRef.current();
                    } catch (restartError) {
                      console.error('Error restarting recognition on end:', restartError);
                    }
                  }
                }, 50);
              }
            };

            recognition.current.start();
          }
        } else if (typeof startWebRecording === 'function') {
          await startWebRecording();
        }
      } else {
        console.log('Voice control on mobile requires web recording');
        if (typeof startWebRecording === 'function') {
          await startWebRecording();
        }
      }

      if (state.alwaysListening) {
        keepAliveInterval.current = setInterval(() => {
          if (state.alwaysListening && !state.isListening && startListeningRef.current) {
            console.log('Keeping voice listening alive...');
            // Check if recognition is still active
            if (recognition.current && recognition.current.state === 'inactive') {
              if (typeof startListeningRef.current === 'function') {
                try {
                  startListeningRef.current();
                } catch (keepAliveError) {
                  console.error('Error in keep alive restart:', keepAliveError);
                }
              }
            }
          }
        }, 5000); // 更頻繁檢查以保持活躍
      }
    } catch (error) {
      console.error('Failed to start voice listening:', error);
      setState(prev => ({ ...prev, isListening: false }));
    }
  }, [state.isListening, state.alwaysListening, language, processCommand, startWebRecording]);

  const stopListening = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isListening: false }));

      if (recognition.current) {
        try {
          if (typeof recognition.current.stop === 'function') {
            recognition.current.stop();
          }
        } catch (error) {
          console.warn('Error stopping speech recognition:', error);
        }
        recognition.current = null;
      }
      
      if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
        try {
          if (typeof mediaRecorder.current.stop === 'function') {
            mediaRecorder.current.stop();
          }
        } catch (error) {
          console.warn('Error stopping media recorder:', error);
        }
      }

      if (keepAliveInterval.current) {
        clearInterval(keepAliveInterval.current);
        keepAliveInterval.current = null;
      }
    } catch (error) {
      console.error('Failed to stop voice listening:', error);
    }
  }, []);

  const toggleAlwaysListening = useCallback(async () => {
    try {
      const newValue = !state.alwaysListening;
      setState(prev => ({ ...prev, alwaysListening: newValue }));
      
      if (typeof saveSettings === 'function') {
        await saveSettings({ alwaysListening: newValue });
      }

      if (newValue) {
        if (typeof startListening === 'function') {
          await startListening();
        }
      } else {
        if (typeof stopListening === 'function') {
          await stopListening();
        }
      }
    } catch (error) {
      console.error('Failed to toggle voice listening:', error);
    }
  }, [state.alwaysListening, startListening, stopListening, saveSettings]);

  // Update refs
  startListeningRef.current = startListening;
  stopListeningRef.current = stopListening;

  return useMemo(() => ({
    ...state,
    startListening: typeof startListening === 'function' ? startListening : () => Promise.resolve(),
    stopListening: typeof stopListening === 'function' ? stopListening : () => Promise.resolve(),
    toggleAlwaysListening: typeof toggleAlwaysListening === 'function' ? toggleAlwaysListening : () => Promise.resolve(),
  }), [state, startListening, stopListening, toggleAlwaysListening]);
});