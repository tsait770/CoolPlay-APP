import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,

  Dimensions,
  Platform,
  Animated,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

import * as DocumentPicker from "expo-document-picker";
import {
  ChevronDown,
  ChevronUp,
  X,
  Plus,
} from "lucide-react-native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { 
  faPlay, 
  faPause, 
  faForward, 
  faBackward, 
  faVolumeUp, 
  faVolumeDown, 
  faVolumeMute, 
  faExpand, 
  faCompress, 
  faRedo, 
  faCog, 
  faMicrophone, 
  faStepForward,
  faStepBackward,
  faStop,
  faUpload,
  faVideo,
  faDesktop,
  faTachometerAlt,
  faLink
} from '@fortawesome/free-solid-svg-icons';
import Colors from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/hooks/useLanguage";
import { useVoiceControl } from "@/providers/VoiceControlProvider";

interface VoiceCommand {
  id: string;
  name: string;
  triggers: string[];
  action: string;
}

interface VideoSource {
  uri: string;
  type: "local" | "url" | "gdrive" | "youtube" | "vimeo" | "stream";
  name?: string;
  headers?: Record<string, string>;
}

type VideoSourceType = "supported" | "extended" | "unsupported" | "unknown";

export default function PlayerScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const voiceControl = useVoiceControl();
  const {
    isListening: isVoiceListening = false,
    startListening: startVoiceListening = () => Promise.resolve(),
    stopListening: stopVoiceListening = () => Promise.resolve(),
    lastCommand = null,
    isProcessing: isVoiceProcessing = false,
    alwaysListening = false,
    toggleAlwaysListening = () => Promise.resolve()
  } = voiceControl || {};
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;
  
  // Responsive sizing
  const getResponsiveSize = (mobile: number, tablet: number, desktop: number) => {
    if (isDesktop) return desktop;
    if (isTablet) return tablet;
    return mobile;
  };
  
  // Siri Integration State
  const [siriEnabled, setSiriEnabled] = useState(false);
  const [siriStatus, setSiriStatus] = useState('');
  const [showSiriSetup, setShowSiriSetup] = useState(false);
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const videoPlayer = useVideoPlayer(videoSource?.uri || '', (player) => {
    player.loop = false;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [videoUrl, setVideoUrl] = useState("");
  const TEST_STREAM_URL = "https://www.youtube.com/live/H3KnMyojEQU?si=JCkwI15nOPXHdaL-" as const;
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const [voiceStatus, setVoiceStatus] = useState("");
  const [showCommandList, setShowCommandList] = useState(false);
  const [showProgressControl, setShowProgressControl] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showScreenControl, setShowScreenControl] = useState(false);
  const [showSpeedControl, setShowSpeedControl] = useState(false);
  const [showCustomCommandActions, setShowCustomCommandActions] = useState(false);
  const [customCommands, setCustomCommands] = useState<VoiceCommand[]>([]);
  const [recording, setRecording] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [showCustomCommandModal, setShowCustomCommandModal] = useState(false);
  const [editingCommand, setEditingCommand] = useState<VoiceCommand | null>(null);
  const [commandName, setCommandName] = useState("");

  const [commandAction, setCommandAction] = useState("");
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Define callback functions first
  const skipForward = useCallback(async (seconds: number = 10) => {
    if (!videoPlayer) return;
    try {
      const currentTime = videoPlayer.currentTime || 0;
      const duration = videoPlayer.duration || 0;
      const newPosition = Math.min(currentTime + seconds, duration);
      videoPlayer.currentTime = newPosition;
    } catch (error) {
      console.error('Error skipping forward:', error);
    }
  }, [videoPlayer]);

  const skipBackward = useCallback(async (seconds: number = 10) => {
    if (!videoPlayer) return;
    try {
      const currentTime = videoPlayer.currentTime || 0;
      const newPosition = Math.max(currentTime - seconds, 0);
      videoPlayer.currentTime = newPosition;
    } catch (error) {
      console.error('Error skipping backward:', error);
    }
  }, [videoPlayer]);

  const setVideoVolume = useCallback(async (newVolume: number) => {
    if (!videoPlayer) return;
    try {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      videoPlayer.volume = clampedVolume;
      setVolume(clampedVolume);
    } catch (error) {
      console.error('Error setting video volume:', error);
    }
  }, [videoPlayer]);

  const setVideoSpeed = useCallback(async (rate: number) => {
    if (!videoPlayer) return;
    try {
      videoPlayer.playbackRate = rate;
      setPlaybackRate(rate);
    } catch (error) {
      console.error('Error setting video speed:', error);
    }
  }, [videoPlayer]);

  // Initialize permissions and Siri integration
  useEffect(() => {
    const initializeVoiceControl = async () => {
      try {
        // Initialize voice control
        console.log('Voice control initialized');
      } catch (error) {
        console.error('Error initializing voice control:', error);
      }
    };
    
    initializeVoiceControl();
    
    // Cleanup on unmount
    return () => {
      if (isVoiceListening && stopVoiceListening && typeof stopVoiceListening === 'function') {
        stopVoiceListening().catch(error => {
          console.error('Error stopping voice control on cleanup:', error);
        });
      }
    };
  }, [isVoiceListening, stopVoiceListening]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 3000);
      return () => clearTimeout(timer);
    } else if (showControls) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showControls, isPlaying, fadeAnim]);

  // Pulse animation for voice button
  useEffect(() => {
    if (isVoiceActive || isVoiceListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isVoiceActive, isVoiceListening, pulseAnim]);

  // Listen for voice commands from Siri integration
  useEffect(() => {
    const handleVoiceCommand = (event: CustomEvent) => {
      try {
        const { command } = event.detail || {};
        if (!command) return;
        
        // Map Siri intent to player actions
        switch (command) {
          case 'PlayVideoIntent':
            if (videoPlayer && typeof videoPlayer.play === 'function') {
              videoPlayer.play();
            }
            break;
          case 'PauseVideoIntent':
            if (videoPlayer && typeof videoPlayer.pause === 'function') {
              videoPlayer.pause();
            }
            break;
          case 'StopVideoIntent':
            if (videoPlayer && typeof videoPlayer.pause === 'function') {
              videoPlayer.pause();
              videoPlayer.currentTime = 0;
            }
            break;
          case 'NextVideoIntent':
            // Handle next video logic
            console.log('Next video command');
            break;
          case 'PreviousVideoIntent':
            // Handle previous video logic
            console.log('Previous video command');
            break;
          case 'ReplayVideoIntent':
            if (videoPlayer) {
              videoPlayer.currentTime = 0;
              if (typeof videoPlayer.play === 'function') {
                videoPlayer.play();
              }
            }
            break;
          case 'Forward10Intent':
            skipForward(10);
            break;
          case 'Forward20Intent':
            skipForward(20);
            break;
          case 'Forward30Intent':
            skipForward(30);
            break;
          case 'Rewind10Intent':
            skipBackward(10);
            break;
          case 'Rewind20Intent':
            skipBackward(20);
            break;
          case 'Rewind30Intent':
            skipBackward(30);
            break;
          case 'VolumeMaxIntent':
            setVideoVolume(1.0);
            break;
          case 'MuteIntent':
            if (videoPlayer) {
              videoPlayer.muted = true;
              setIsMuted(true);
            }
            break;
          case 'UnmuteIntent':
            if (videoPlayer) {
              videoPlayer.muted = false;
              setIsMuted(false);
            }
            break;
          case 'VolumeUpIntent':
            setVideoVolume(Math.min(1.0, volume + 0.2));
            break;
          case 'VolumeDownIntent':
            setVideoVolume(Math.max(0, volume - 0.2));
            break;
          case 'EnterFullscreenIntent':
            setIsFullscreen(true);
            break;
          case 'ExitFullscreenIntent':
            setIsFullscreen(false);
            break;
          case 'SpeedHalfIntent':
            setVideoSpeed(0.5);
            break;
          case 'SpeedNormalIntent':
            setVideoSpeed(1.0);
            break;
          case 'Speed125Intent':
            setVideoSpeed(1.25);
            break;
          case 'Speed150Intent':
            setVideoSpeed(1.5);
            break;
          case 'Speed200Intent':
            setVideoSpeed(2.0);
            break;
          default:
            console.log('Unknown command:', command);
        }
        
        // Show feedback
        setVoiceStatus(`${t('command_executed')}: ${command.replace('Intent', '')}`);
        setTimeout(() => setVoiceStatus(''), 3000);
      } catch (error) {
        console.error('Error handling voice command:', error);
      }
    };

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('voiceCommand', handleVoiceCommand as EventListener);
      return () => {
        if (typeof window.removeEventListener === 'function') {
          window.removeEventListener('voiceCommand', handleVoiceCommand as EventListener);
        }
      };
    }
  }, [videoPlayer, volume, skipForward, skipBackward, setVideoVolume, setVideoSpeed, t]);

  // Update video player state
  useEffect(() => {
    if (videoPlayer) {
      const updateStatus = () => {
        try {
          setIsPlaying(videoPlayer.playing || false);
          setDuration((videoPlayer.duration || 0) * 1000);
          setPosition((videoPlayer.currentTime || 0) * 1000);
          setIsMuted(videoPlayer.muted || false);
          setVolume(videoPlayer.volume || 1.0);
          setPlaybackRate(videoPlayer.playbackRate || 1.0);
        } catch (error) {
          console.error('Error updating video status:', error);
        }
      };
      
      const interval = setInterval(updateStatus, 100);
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [videoPlayer]);

  const togglePlayPause = async () => {
    if (!videoPlayer) return;
    try {
      if (isPlaying) {
        if (videoPlayer.pause && typeof videoPlayer.pause === 'function') {
          videoPlayer.pause();
        }
      } else {
        if (videoPlayer.play && typeof videoPlayer.play === 'function') {
          videoPlayer.play();
        }
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const toggleMute = async () => {
    if (!videoPlayer) return;
    try {
      if (typeof videoPlayer.muted !== 'undefined') {
        videoPlayer.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const toggleFullscreen = async () => {
    // Note: expo-video fullscreen API may differ
    // This is a placeholder - check expo-video docs for actual implementation
    setIsFullscreen(!isFullscreen);
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.uri && asset.uri.trim() !== '') {
          setVideoSource({
            uri: asset.uri,
            type: "local",
            name: asset.name || "Local Video",
          });
        } else {
          Alert.alert(t("error"), t("invalid_video_file"));
        }
      }
    } catch {
      Alert.alert(t("error"), t("failed_to_load_video"));
    }
  };

  const detectVideoSource = (url: string): VideoSourceType => {
    const supportedRegex = [
      /youtube\.com\/watch\?v=[\w-]+/,
      /youtu\.be\/[\w-]+/,
      /vimeo\.com\/\d+/,
      /twitch\.tv\/\w+/,
      /facebook\.com\/watch\/\?v=\d+/,
      /drive\.google\.com\/file\/d\//,
      /dropbox\.com\/s\//,
      /.*\.(mp4|webm|ogg|ogv)$/,
      /.*\.m3u8$/,
      /.*\.mpd$/,
      /^rtmp:\/\/.*/
    ];

    const extendedRegex = [
      /pornhub\.com\/view_video\.php\?viewkey=/,
      /xvideos\.com\/\d+/,
      /twitter\.com\/.*\/status\/\d+/,
      /instagram\.com\/(reel|p|tv)\//,
      /tiktok\.com\/@[\w.-]+\/video\/\d+/,
      /bilibili\.com\/video\/[A-Za-z0-9]+/
    ];

    const unsupportedRegex = [
      /netflix\.com/,
      /disneyplus\.com/,
      /hbomax\.com/,
      /primevideo\.com/,
      /apple\.com\/tv/,
      /iqiyi\.com/
    ];

    if (supportedRegex.some(r => r.test(url))) return "supported";
    if (extendedRegex.some(r => r.test(url))) return "extended";
    if (unsupportedRegex.some(r => r.test(url))) return "unsupported";
    return "unknown";
  };

  const processVideoUrl = (url: string): VideoSource | null => {
    const sourceType = detectVideoSource(url);
    
    if (sourceType === "unsupported") {
      Alert.alert(
        t("unsupported_source"),
        t("drm_protected_content"),
        [{ text: t("ok") }]
      );
      return null;
    }

    // Process Google Drive links
    if (url.includes("drive.google.com")) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        return {
          uri: `https://drive.google.com/uc?export=download&id=${fileId}`,
          type: "gdrive",
          name: "Google Drive Video",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://drive.google.com/"
          }
        };
      }
    }

    // Process YouTube links (with warning)
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      Alert.alert(
        t("youtube_support"),
        t("youtube_processing"),
        [
          {
            text: t("continue"),
            onPress: () => {
              // For now, return the original URL and let the video player handle it
              // In production, you would use a backend service to extract the actual video URL
              return {
                uri: url,
                type: "youtube" as const,
                name: "YouTube Video",
              };
            }
          },
          { text: t("cancel"), style: "cancel" }
        ]
      );
      // Return YouTube source for now
      return {
        uri: url,
        type: "youtube" as const,
        name: "YouTube Video",
      };
    }

    // Process Vimeo links
    if (url.includes("vimeo.com")) {
      const videoIdMatch = url.match(/vimeo\.com\/(\d+)/);
      if (videoIdMatch) {
        return {
          uri: url,
          type: "vimeo",
          name: "Vimeo Video",
        };
      }
    }

    // Process HLS streams
    if (url.includes(".m3u8")) {
      return {
        uri: url,
        type: "stream",
        name: "HLS Stream",
      };
    }

    // Process DASH streams
    if (url.includes(".mpd")) {
      return {
        uri: url,
        type: "stream",
        name: "DASH Stream",
      };
    }

    // Process direct video URLs
    if (
      url.endsWith(".mp4") ||
      url.endsWith(".webm") ||
      url.endsWith(".ogg") ||
      url.endsWith(".ogv") ||
      url.includes(".mp4?") ||
      url.includes(".webm?")
    ) {
      return {
        uri: url,
        type: "url",
        name: "Direct Video",
      };
    }

    // Extended sources (with warning)
    if (sourceType === "extended") {
      Alert.alert(
        t("extended_source"),
        t("extended_source_warning"),
        [
          {
            text: t("continue"),
            onPress: () => {
              console.log("Extended source:", url);
            }
          },
          { text: t("cancel"), style: "cancel" }
        ]
      );
      return null;
    }

    // Default: try as direct URL only if URL is not empty
    if (url && url.trim() !== '') {
      return {
        uri: url,
        type: "url",
        name: "Video URL",
      };
    }
    
    // Return null if no valid URL
    return null;
  };

  const loadVideoFromUrl = () => {
    if (!videoUrl.trim()) {
      Alert.alert(t("error"), t("please_enter_url"));
      return;
    }

    const source = processVideoUrl(videoUrl.trim());
    if (source && source.uri && source.uri.trim() !== '') {
      setVideoSource(source);
      setVideoUrl("");
      // Show success feedback
      setVoiceStatus(t("video_loaded_successfully"));
      setTimeout(() => setVoiceStatus(""), 3000);
    } else {
      Alert.alert(t("error"), t("invalid_url"));
    }
  };



  const saveCustomCommand = () => {
    if (!commandName.trim() || !commandAction.trim()) {
      Alert.alert(t("error"), t("fill_all_fields"));
      return;
    }

    // Check if command name already exists (for new commands)
    if (!editingCommand && customCommands.some(cmd => cmd.name.toLowerCase() === commandName.toLowerCase())) {
      Alert.alert(t("error"), t("command_name_exists"));
      return;
    }

    const newCommand: VoiceCommand = {
      id: editingCommand?.id || Date.now().toString(),
      name: commandName,
      triggers: [commandName.toLowerCase()], // Use command name as trigger
      action: commandAction,
    };

    if (editingCommand) {
      setCustomCommands(prev => 
        prev.map(cmd => cmd.id === editingCommand.id ? newCommand : cmd)
      );
      Alert.alert(t("success"), t("command_updated_successfully"));
    } else {
      setCustomCommands(prev => [...prev, newCommand]);
      Alert.alert(t("success"), t("command_added_successfully"));
    }

    // Reset form
    setCommandName("");
    setCommandAction("");
    setEditingCommand(null);
    setShowCustomCommandModal(false);
  };

  const deleteCustomCommand = (commandId: string) => {
    Alert.alert(
      t("delete_command"),
      t("delete_command_confirm"),
      [
        {
          text: t("cancel"),
          style: "cancel"
        },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => {
            setCustomCommands(prev => prev.filter(cmd => cmd.id !== commandId));
            Alert.alert(t("success"), t("command_deleted_successfully"));
          }
        }
      ]
    );
  };

  const startVoiceRecording = async () => {
    try {
      if (startVoiceListening && typeof startVoiceListening === 'function') {
        await startVoiceListening();
        setIsVoiceActive(true);
        setVoiceStatus(t("listening"));
      } else {
        console.error('startVoiceListening is not available or not a function');
        Alert.alert(t("error"), "Voice control not available");
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert(t("error"), t("failed_to_start_recording") + ": " + (error as Error).message);
    }
  };

  const stopVoiceRecording = async () => {
    try {
      if (stopVoiceListening && typeof stopVoiceListening === 'function') {
        await stopVoiceListening();
      }
      setIsVoiceActive(false);
      setVoiceStatus("");
    } catch (error) {
      console.error("Failed to stop recording:", error);
      setVoiceStatus("");
      setIsVoiceActive(false);
    }
  };

  const processVoiceCommand = async (audioData: string | Blob) => {
    try {
      // Send audio to speech-to-text API
      const formData = new FormData();
      
      if (audioData instanceof Blob) {
        formData.append("audio", audioData, "recording.webm");
      } else if (typeof audioData === 'string') {
        // Handle URI case for mobile
        const response = await fetch(audioData);
        const blob = await response.blob();
        formData.append("audio", blob, "recording.webm");
      }
      
      formData.append("language", language);

      const response = await fetch("https://toolkit.rork.com/stt/transcribe/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const command = result.text.toLowerCase();
        executeVoiceCommand(command);
        setVoiceStatus(`${t("command_executed")}: ${command}`);
      } else {
        setVoiceStatus(t("failed_to_process_command"));
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      setVoiceStatus(t("error_processing_voice"));
    }

    setTimeout(() => setVoiceStatus(""), 3000);
  };

  const executeVoiceCommand = (command: string) => {
    // Play/Pause commands
    if (command.includes(t("play")) || command.includes("play")) {
      try {
        if (videoPlayer && typeof videoPlayer.play === 'function') {
          videoPlayer.play();
        }
      } catch (error) {
        console.error('Error playing video:', error);
      }
    } else if (command.includes(t("pause")) || command.includes("pause")) {
      try {
        if (videoPlayer && typeof videoPlayer.pause === 'function') {
          videoPlayer.pause();
        }
      } catch (error) {
        console.error('Error pausing video:', error);
      }
    } else if (command.includes(t("stop")) || command.includes("stop")) {
      try {
        if (videoPlayer && typeof videoPlayer.pause === 'function') {
          videoPlayer.pause();
        }
      } catch (error) {
        console.error('Error stopping video:', error);
      }
    }
    // Skip commands
    else if (command.includes(t("forward_30")) || command.includes("forward 30")) {
      skipForward(30);
    } else if (command.includes(t("forward_20")) || command.includes("forward 20")) {
      skipForward(20);
    } else if (command.includes(t("forward_10")) || command.includes("forward 10")) {
      skipForward(10);
    } else if (command.includes(t("backward_30")) || command.includes("backward 30")) {
      skipBackward(30);
    } else if (command.includes(t("backward_20")) || command.includes("backward 20")) {
      skipBackward(20);
    } else if (command.includes(t("backward_10")) || command.includes("backward 10")) {
      skipBackward(10);
    }
    // Volume commands
    else if (command.includes(t("mute")) || command.includes("mute")) {
      try {
        if (videoPlayer) {
          videoPlayer.muted = true;
          setIsMuted(true);
        }
      } catch (error) {
        console.error('Error muting video:', error);
      }
    } else if (command.includes(t("unmute")) || command.includes("unmute")) {
      try {
        if (videoPlayer) {
          videoPlayer.muted = false;
          setIsMuted(false);
        }
      } catch (error) {
        console.error('Error unmuting video:', error);
      }
    } else if (command.includes(t("volume_up")) || command.includes("volume up")) {
      setVideoVolume(volume + 0.2);
    } else if (command.includes(t("volume_down")) || command.includes("volume down")) {
      setVideoVolume(volume - 0.2);
    } else if (command.includes(t("max_volume")) || command.includes("max volume")) {
      setVideoVolume(1.0);
    }
    // Speed commands
    else if (command.includes("0.5") || command.includes(t("half_speed"))) {
      setVideoSpeed(0.5);
    } else if (command.includes("1.25")) {
      setVideoSpeed(1.25);
    } else if (command.includes("1.5")) {
      setVideoSpeed(1.5);
    } else if (command.includes("2") || command.includes(t("double_speed"))) {
      setVideoSpeed(2.0);
    } else if (command.includes(t("normal_speed")) || command.includes("normal")) {
      setVideoSpeed(1.0);
    }
    // Fullscreen commands
    else if (command.includes(t("fullscreen")) || command.includes("fullscreen")) {
      toggleFullscreen();
    } else if (command.includes(t("exit_fullscreen")) || command.includes("exit fullscreen")) {
      if (isFullscreen) toggleFullscreen();
    }

    // Check custom commands
    customCommands.forEach((cmd) => {
      cmd.triggers.forEach((trigger) => {
        if (command.includes(trigger.toLowerCase())) {
          executeCustomAction(cmd.action);
        }
      });
    });
  };

  const getActionLabel = (actionKey: string): string => {
    const actionLabels: Record<string, string> = {
      play: "播放",
      pause: "暫停",
      stop: "停止",
      next: "下一部影片",
      previous: "上一部影片",
      restart: "重新播放",
      forward_10: "快轉 10 秒",
      forward_20: "快轉 20 秒",
      forward_30: "快轉 30 秒",
      rewind_10: "倒轉 10 秒",
      rewind_20: "倒轉 20 秒",
      rewind_30: "倒轉 30 秒",
      volume_max: "音量最大",
      mute: "靜音",
      unmute: "解除靜音",
      volume_up: "音量調高",
      volume_down: "音量調低",
      fullscreen: "進入全螢幕",
      exit_fullscreen: "離開全螢幕",
      speed_0_5: "0.5 倍速",
      speed_normal: "正常速度",
      speed_1_25: "1.25 倍速",
      speed_1_5: "1.5 倍速",
      speed_2_0: "2.0 倍速",
    };
    return actionLabels[actionKey] || actionKey;
  };

  const executeCustomAction = (action: string) => {
    switch (action) {
      case "play":
        if (videoPlayer && typeof videoPlayer.play === 'function') {
          videoPlayer.play();
        }
        break;
      case "pause":
        if (videoPlayer && typeof videoPlayer.pause === 'function') {
          videoPlayer.pause();
        }
        break;
      case "stop":
        if (videoPlayer && typeof videoPlayer.pause === 'function') {
          videoPlayer.pause();
        }
        break;
      case "forward_10":
        skipForward(10);
        break;
      case "forward_20":
        skipForward(20);
        break;
      case "forward_30":
        skipForward(30);
        break;
      case "rewind_10":
        skipBackward(10);
        break;
      case "rewind_20":
        skipBackward(20);
        break;
      case "rewind_30":
        skipBackward(30);
        break;
      case "volume_max":
        setVideoVolume(1.0);
        break;
      case "mute":
        if (videoPlayer) {
          videoPlayer.muted = true;
          setIsMuted(true);
        }
        break;
      case "unmute":
        if (videoPlayer) {
          videoPlayer.muted = false;
          setIsMuted(false);
        }
        break;
      case "volume_up":
        setVideoVolume(volume + 0.2);
        break;
      case "volume_down":
        setVideoVolume(volume - 0.2);
        break;
      case "fullscreen":
        setIsFullscreen(true);
        break;
      case "exit_fullscreen":
        setIsFullscreen(false);
        break;
      case "speed_0_5":
        setVideoSpeed(0.5);
        break;
      case "speed_normal":
        setVideoSpeed(1.0);
        break;
      case "speed_1_25":
        setVideoSpeed(1.25);
        break;
      case "speed_1_5":
        setVideoSpeed(1.5);
        break;
      case "speed_2_0":
        setVideoSpeed(2.0);
        break;
      default:
        break;
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = () => {
    if (duration === 0) return 0;
    return (position / duration) * 100;
  };

  const handleProgressBarPress = async (event: any) => {
    if (!videoPlayer || duration === 0) return;
    try {
      const { locationX } = event.nativeEvent;
      const progressBarWidth = Dimensions.get("window").width - 32;
      const percentage = locationX / progressBarWidth;
      const newPosition = (percentage * duration) / 1000; // Convert to seconds
      videoPlayer.currentTime = newPosition;
    } catch (error) {
      console.error('Error seeking video:', error);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.content, { paddingTop: 16 + insets.top }]}>

        {/* Modern Header */}
        <View style={styles.modernHeader}>
          <View style={styles.headerContent}>
            <Text style={styles.modernTitle}>智能語音控制</Text>
            <Text style={styles.modernSubtitle}>雙層語音控制 • Siri 整合 • 即時識別</Text>
          </View>
        </View>

        {/* Video Player */}
        {videoSource && videoSource.uri && videoSource.uri.trim() !== '' ? (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowControls(!showControls)}
            style={styles.videoContainer}
          >
            <VideoView
              style={styles.video}
              player={videoPlayer}
              allowsFullscreen
              allowsPictureInPicture
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderContainer}>
            <FontAwesomeIcon icon={faVideo} size={48} color={Colors.primary.textSecondary} />
          </View>
        )}

        {/* Dual Voice Control Hub */}
        <View style={styles.dualVoiceHub}>
          {/* App Voice Control */}
          <View style={styles.appVoiceCard}>
            <View style={styles.appVoiceHeader}>
              <Text style={styles.appVoiceTitle}>應用內語音控制</Text>
              <Text style={styles.appVoiceSubtitle}>即時語音識別與執行</Text>
            </View>
            
            <View style={styles.voiceControlCenter}>
              <Animated.View
                style={[
                  styles.voiceButtonContainer,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.modernVoiceButton,
                    (isVoiceActive || isVoiceListening) && styles.modernVoiceButtonActive,
                  ]}
                  onPress={(isVoiceActive || isVoiceListening) ? stopVoiceRecording : startVoiceRecording}
                >
                  <View style={styles.voiceButtonInner}>
                    <FontAwesomeIcon 
                      icon={faMicrophone} 
                      size={24} 
                      color="white" 
                    />
                  </View>
                </TouchableOpacity>
              </Animated.View>
              
              <View style={styles.voiceControlInfo}>
                <View style={styles.statusIndicators}>
                  <View style={[styles.statusDot, (isVoiceActive || isVoiceListening) && styles.statusDotActive]} />
                  <View style={[styles.statusDot, (isVoiceActive || isVoiceListening) && styles.statusDotActive]} />
                  <View style={[styles.statusDot, (isVoiceActive || isVoiceListening) && styles.statusDotActive]} />
                </View>
                <Text style={styles.voiceControlStatus}>
                  {(isVoiceActive || isVoiceListening) ? '正在聆聽...' : '點擊開始語音控制'}
                </Text>
              </View>
            </View>
            
            {/* Quick Voice Actions */}
            <View style={styles.quickVoiceActions}>
              <TouchableOpacity 
                style={[styles.quickVoiceAction, alwaysListening && styles.quickVoiceActionActive]}
                onPress={toggleAlwaysListening}
              >
                <FontAwesomeIcon 
                  icon={faMicrophone} 
                  size={16} 
                  color={alwaysListening ? "white" : Colors.accent.primary} 
                />
                <Text style={[styles.quickVoiceActionText, alwaysListening && styles.quickVoiceActionTextActive]}>
                  常駐聆聽
                </Text>
              </TouchableOpacity>

            </View>
          </View>

          {/* Siri Integration Card */}
          <View style={styles.siriCard}>
            <View style={styles.siriCardHeader}>
              <View style={styles.siriIconContainer}>
                <FontAwesomeIcon icon={faMicrophone} size={20} color={Colors.accent.primary} />
              </View>
              <View style={styles.siriCardContent}>
                <Text style={styles.siriCardTitle}>Siri 語音助手</Text>
                <Text style={styles.siriCardStatus}>{siriEnabled ? '已啟用系統級控制' : '點擊啟用 Siri 整合'}</Text>
              </View>
              <View style={[styles.siriStatusIndicator, { backgroundColor: siriEnabled ? Colors.accent.primary : Colors.primary.textSecondary }]} />
            </View>

          </View>
        </View>

        {/* Voice Status */}
        {voiceStatus ? (
          <View style={styles.voiceStatusContainer}>
            <Text style={styles.voiceStatusText}>{voiceStatus}</Text>
          </View>
        ) : null}

        {/* Playback Control Section */}
        <View style={styles.commandsSection}>
          <TouchableOpacity
            style={styles.commandsHeader}
            onPress={() => setShowCommandList(!showCommandList)}
          >
            <View style={styles.commandsHeaderLeft}>
              <FontAwesomeIcon icon={faPlay} size={20} color={Colors.accent.primary} />
              <Text style={styles.commandsTitle}>{t("playback_control")}</Text>
            </View>
            {showCommandList ? (
              <ChevronUp size={20} color={Colors.primary.textSecondary} />
            ) : (
              <ChevronDown size={20} color={Colors.primary.textSecondary} />
            )}
          </TouchableOpacity>

          {showCommandList && (
            <View style={styles.commandsList}>
              <View style={styles.commandCategory}>
                <Text style={styles.categoryTitle}>播放控制</Text>
                <View style={styles.commandItems}>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>播放</Text>
                    <Text style={styles.commandExample}>「播放」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>暫停</Text>
                    <Text style={styles.commandExample}>「暫停」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>停止</Text>
                    <Text style={styles.commandExample}>「停止」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>下一部影片</Text>
                    <Text style={styles.commandExample}>「下一部影片」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>上一部影片</Text>
                    <Text style={styles.commandExample}>「上一部影片」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>重新播放</Text>
                    <Text style={styles.commandExample}>「重新播放」</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Progress Control Section */}
        <View style={styles.commandsSection}>
          <TouchableOpacity
            style={styles.commandsHeader}
            onPress={() => setShowProgressControl(!showProgressControl)}
          >
            <View style={styles.commandsHeaderLeft}>
              <FontAwesomeIcon icon={faStepForward} size={20} color={Colors.accent.primary} />
              <Text style={styles.commandsTitle}>{t("progress_control")}</Text>
            </View>
            {showProgressControl ? (
              <ChevronUp size={20} color={Colors.primary.textSecondary} />
            ) : (
              <ChevronDown size={20} color={Colors.primary.textSecondary} />
            )}
          </TouchableOpacity>
          
          {showProgressControl && (
            <View style={styles.commandsList}>
              <View style={styles.commandCategory}>
                <Text style={styles.categoryTitle}>進度控制</Text>
                <View style={styles.commandItems}>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>快轉 10 秒</Text>
                    <Text style={styles.commandExample}>「快轉 10 秒」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>快轉 20 秒</Text>
                    <Text style={styles.commandExample}>「快轉 20 秒」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>快轉 30 秒</Text>
                    <Text style={styles.commandExample}>「快轉 30 秒」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>倒轉 10 秒</Text>
                    <Text style={styles.commandExample}>「倒轉 10 秒」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>倒轉 20 秒</Text>
                    <Text style={styles.commandExample}>「倒轉 20 秒」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>倒轉 30 秒</Text>
                    <Text style={styles.commandExample}>「倒轉 30 秒」</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Volume Control Section */}
        <View style={styles.commandsSection}>
          <TouchableOpacity
            style={styles.commandsHeader}
            onPress={() => setShowVolumeControl(!showVolumeControl)}
          >
            <View style={styles.commandsHeaderLeft}>
              <FontAwesomeIcon icon={faVolumeUp} size={20} color={Colors.accent.primary} />
              <Text style={styles.commandsTitle}>{t("volume_control")}</Text>
            </View>
            {showVolumeControl ? (
              <ChevronUp size={20} color={Colors.primary.textSecondary} />
            ) : (
              <ChevronDown size={20} color={Colors.primary.textSecondary} />
            )}
          </TouchableOpacity>
          
          {showVolumeControl && (
            <View style={styles.commandsList}>
              <View style={styles.commandCategory}>
                <Text style={styles.categoryTitle}>音量控制</Text>
                <View style={styles.commandItems}>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>音量最大</Text>
                    <Text style={styles.commandExample}>「音量最大」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>靜音</Text>
                    <Text style={styles.commandExample}>「靜音」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>解除靜音</Text>
                    <Text style={styles.commandExample}>「解除靜音」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>音量調高</Text>
                    <Text style={styles.commandExample}>「音量調高」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>音量調低</Text>
                    <Text style={styles.commandExample}>「音量調低」</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Screen Control Section */}
        <View style={styles.commandsSection}>
          <TouchableOpacity
            style={styles.commandsHeader}
            onPress={() => setShowScreenControl(!showScreenControl)}
          >
            <View style={styles.commandsHeaderLeft}>
              <FontAwesomeIcon icon={faDesktop} size={20} color={Colors.accent.primary} />
              <Text style={styles.commandsTitle}>{t("screen_control")}</Text>
            </View>
            {showScreenControl ? (
              <ChevronUp size={20} color={Colors.primary.textSecondary} />
            ) : (
              <ChevronDown size={20} color={Colors.primary.textSecondary} />
            )}
          </TouchableOpacity>
          
          {showScreenControl && (
            <View style={styles.commandsList}>
              <View style={styles.commandCategory}>
                <Text style={styles.categoryTitle}>螢幕控制</Text>
                <View style={styles.commandItems}>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>進入全螢幕</Text>
                    <Text style={styles.commandExample}>「進入全螢幕」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>離開全螢幕</Text>
                    <Text style={styles.commandExample}>「離開全螢幕」</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Playback Speed Section */}
        <View style={styles.commandsSection}>
          <TouchableOpacity
            style={styles.commandsHeader}
            onPress={() => setShowSpeedControl(!showSpeedControl)}
          >
            <View style={styles.commandsHeaderLeft}>
              <FontAwesomeIcon icon={faTachometerAlt} size={20} color={Colors.accent.primary} />
              <Text style={styles.commandsTitle}>{t("playback_speed")}</Text>
            </View>
            {showSpeedControl ? (
              <ChevronUp size={20} color={Colors.primary.textSecondary} />
            ) : (
              <ChevronDown size={20} color={Colors.primary.textSecondary} />
            )}
          </TouchableOpacity>
          
          {showSpeedControl && (
            <View style={styles.commandsList}>
              <View style={styles.commandCategory}>
                <Text style={styles.categoryTitle}>播放速度</Text>
                <View style={styles.commandItems}>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>0.5 倍速</Text>
                    <Text style={styles.commandExample}>「0.5 倍速」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>正常速度</Text>
                    <Text style={styles.commandExample}>「正常速度」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>1.25 倍速</Text>
                    <Text style={styles.commandExample}>「1.25 倍速」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>1.5 倍速</Text>
                    <Text style={styles.commandExample}>「1.5 倍速」</Text>
                  </View>
                  <View style={styles.commandItem}>
                    <Text style={styles.commandAction}>2.0 倍速</Text>
                    <Text style={styles.commandExample}>「2.0 倍速」</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* File Upload Section */}
        <TouchableOpacity style={styles.uploadSection} onPress={pickVideo}>
          <View style={styles.uploadContainer}>
            <FontAwesomeIcon icon={faUpload} size={48} color={Colors.primary.textSecondary} />
            <Text style={styles.uploadTitle}>拖拽視頻文件或點擊上傳</Text>
            <Text style={styles.uploadSubtitle}>支援 MP4, WebM, OGV 格式</Text>
          </View>
        </TouchableOpacity>

        {/* URL Input Section */}
        <View style={styles.urlSection}>
          <View style={styles.urlInputContainer}>
            <FontAwesomeIcon icon={faLink} size={20} color={Colors.primary.textSecondary} style={styles.urlIcon} />
            <TextInput
              style={styles.urlInput}
              placeholder={t("paste_video_url")}
              placeholderTextColor={Colors.primary.textSecondary}
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.loadButton,
              !videoUrl.trim() && styles.loadButtonDisabled
            ]}
            onPress={loadVideoFromUrl}
            disabled={!videoUrl.trim()}
          >
            <FontAwesomeIcon icon={faUpload} size={20} color="white" />
            <Text style={[
              styles.loadButtonText,
              !videoUrl.trim() && styles.loadButtonTextDisabled
            ]}>{t("load_video")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loadButton, { backgroundColor: '#007BFF' }]}
            onPress={() => {
              setVideoUrl(TEST_STREAM_URL);
              setTimeout(() => {
                loadVideoFromUrl();
              }, 10);
            }}
          >
            <FontAwesomeIcon icon={faPlay} size={20} color="white" />
            <Text style={styles.loadButtonText}>載入測試直播串流</Text>
          </TouchableOpacity>
        </View>

        {/* Custom Commands Management */}
        <View style={styles.commandsSection}>
          <TouchableOpacity
            style={styles.commandsHeader}
            onPress={() => setShowCustomCommandModal(true)}
          >
            <View style={styles.commandsHeaderLeft}>
              <FontAwesomeIcon icon={faCog} size={20} color={Colors.accent.primary} />
              <Text style={styles.commandsTitle}>管理自定義指令</Text>
            </View>
            <ChevronDown size={20} color={Colors.primary.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Siri Setup Modal */}
        <Modal
          visible={showSiriSetup}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowSiriSetup(false)}
        >
          <View style={styles.siriSetupModal}>
            <View style={styles.siriSetupHeader}>
              <Text style={styles.siriSetupTitle}>Siri 快捷指令設定</Text>
              <TouchableOpacity
                onPress={() => setShowSiriSetup(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.primary.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.siriSetupContent}>
              <View style={styles.siriSetupSection}>
                <View style={styles.siriFeatureCard}>
                  <View style={styles.siriFeatureIcon}>
                    <FontAwesomeIcon icon={faMicrophone} size={32} color={Colors.accent.primary} />
                  </View>
                  <Text style={styles.siriFeatureTitle}>雙層語音控制系統</Text>
                  <Text style={styles.siriFeatureDescription}>
                    整合 Siri 系統級控制與應用內即時語音識別，提供最完整的語音操作體驗
                  </Text>
                </View>
                
                <View style={styles.siriInstructions}>
                  <Text style={styles.siriInstructionsTitle}>支援的語音指令：</Text>
                  <View style={styles.siriStep}>
                    <Text style={styles.siriStepNumber}>🎬</Text>
                    <Text style={styles.siriStepText}>播放控制：「播放」、「暫停」、「停止」、「重播」</Text>
                  </View>
                  <View style={styles.siriStep}>
                    <Text style={styles.siriStepNumber}>⏩</Text>
                    <Text style={styles.siriStepText}>進度控制：「快轉 10 秒」、「倒轉 20 秒」</Text>
                  </View>
                  <View style={styles.siriStep}>
                    <Text style={styles.siriStepNumber}>🔊</Text>
                    <Text style={styles.siriStepText}>音量控制：「音量最大」、「靜音」、「音量調高」</Text>
                  </View>
                  <View style={styles.siriStep}>
                    <Text style={styles.siriStepNumber}>🖥️</Text>
                    <Text style={styles.siriStepText}>螢幕控制：「全螢幕」、「退出全螢幕」</Text>
                  </View>
                  <View style={styles.siriStep}>
                    <Text style={styles.siriStepNumber}>⚡</Text>
                    <Text style={styles.siriStepText}>播放速度：「1.5 倍速」、「正常速度」</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.siriEnableButton}
                  onPress={() => {
                    setSiriEnabled(true);
                    setSiriStatus('Siri 語音控制已啟用');
                    setShowSiriSetup(false);
                  }}
                >
                  <Text style={styles.siriEnableButtonText}>啟用 Siri 語音控制</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Custom Command Modal */}
        <Modal
          visible={showCustomCommandModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCustomCommandModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>自定義語音指令</Text>
              <TouchableOpacity
                onPress={() => setShowCustomCommandModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.primary.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Add New Command Form */}
              <View style={styles.addCommandSection}>
                <Text style={styles.sectionTitle}>自定義語音指令</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>自定義指令</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="例如: S"
                    placeholderTextColor={Colors.primary.textSecondary}
                    value={commandName}
                    onChangeText={setCommandName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>對應動作</Text>
                  <TouchableOpacity
                    style={styles.actionSelectorButton}
                    onPress={() => setShowCustomCommandActions(!showCustomCommandActions)}
                  >
                    <Text style={styles.actionSelectorText}>
                      {commandAction ? getActionLabel(commandAction) : '選擇動作'}
                    </Text>
                    {showCustomCommandActions ? (
                      <ChevronUp size={16} color={Colors.primary.textSecondary} />
                    ) : (
                      <ChevronDown size={16} color={Colors.primary.textSecondary} />
                    )}
                  </TouchableOpacity>
                  
                  {showCustomCommandActions && (
                    <ScrollView style={styles.actionScrollView} nestedScrollEnabled={true}>
                      <View style={styles.actionCategory}>
                        <Text style={styles.actionCategoryTitle}>播放控制</Text>
                        {[
                          { key: "play", label: "播放" },
                          { key: "pause", label: "暫停" },
                          { key: "stop", label: "停止" },
                          { key: "next", label: "下一部影片" },
                          { key: "previous", label: "上一部影片" },
                          { key: "restart", label: "重新播放" },
                        ].map((action) => (
                          <TouchableOpacity
                            key={action.key}
                            style={[
                              styles.actionItem,
                              commandAction === action.key && styles.actionItemSelected,
                            ]}
                            onPress={() => {
                              setCommandAction(action.key);
                              setShowCustomCommandActions(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.actionItemText,
                                commandAction === action.key && styles.actionItemTextSelected,
                              ]}
                            >
                              {action.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      <View style={styles.actionCategory}>
                        <Text style={styles.actionCategoryTitle}>進度控制</Text>
                        {[
                          { key: "forward_10", label: "快轉 10 秒" },
                          { key: "forward_20", label: "快轉 20 秒" },
                          { key: "forward_30", label: "快轉 30 秒" },
                          { key: "rewind_10", label: "倒轉 10 秒" },
                          { key: "rewind_20", label: "倒轉 20 秒" },
                          { key: "rewind_30", label: "倒轉 30 秒" },
                        ].map((action) => (
                          <TouchableOpacity
                            key={action.key}
                            style={[
                              styles.actionItem,
                              commandAction === action.key && styles.actionItemSelected,
                            ]}
                            onPress={() => {
                              setCommandAction(action.key);
                              setShowCustomCommandActions(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.actionItemText,
                                commandAction === action.key && styles.actionItemTextSelected,
                              ]}
                            >
                              {action.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      <View style={styles.actionCategory}>
                        <Text style={styles.actionCategoryTitle}>音量控制</Text>
                        {[
                          { key: "volume_max", label: "音量最大" },
                          { key: "mute", label: "靜音" },
                          { key: "unmute", label: "解除靜音" },
                          { key: "volume_up", label: "音量調高" },
                          { key: "volume_down", label: "音量調低" },
                        ].map((action) => (
                          <TouchableOpacity
                            key={action.key}
                            style={[
                              styles.actionItem,
                              commandAction === action.key && styles.actionItemSelected,
                            ]}
                            onPress={() => {
                              setCommandAction(action.key);
                              setShowCustomCommandActions(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.actionItemText,
                                commandAction === action.key && styles.actionItemTextSelected,
                              ]}
                            >
                              {action.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      <View style={styles.actionCategory}>
                        <Text style={styles.actionCategoryTitle}>螢幕控制</Text>
                        {[
                          { key: "fullscreen", label: "進入全螢幕" },
                          { key: "exit_fullscreen", label: "離開全螢幕" },
                        ].map((action) => (
                          <TouchableOpacity
                            key={action.key}
                            style={[
                              styles.actionItem,
                              commandAction === action.key && styles.actionItemSelected,
                            ]}
                            onPress={() => {
                              setCommandAction(action.key);
                              setShowCustomCommandActions(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.actionItemText,
                                commandAction === action.key && styles.actionItemTextSelected,
                              ]}
                            >
                              {action.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      <View style={styles.actionCategory}>
                        <Text style={styles.actionCategoryTitle}>播放速度</Text>
                        {[
                          { key: "speed_0_5", label: "0.5 倍速" },
                          { key: "speed_normal", label: "正常速度" },
                          { key: "speed_1_25", label: "1.25 倍速" },
                          { key: "speed_1_5", label: "1.5 倍速" },
                          { key: "speed_2_0", label: "2.0 倍速" },
                        ].map((action) => (
                          <TouchableOpacity
                            key={action.key}
                            style={[
                              styles.actionItem,
                              commandAction === action.key && styles.actionItemSelected,
                            ]}
                            onPress={() => {
                              setCommandAction(action.key);
                              setShowCustomCommandActions(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.actionItemText,
                                commandAction === action.key && styles.actionItemTextSelected,
                              ]}
                            >
                              {action.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.addButton,
                    (!commandName.trim() || !commandAction) && styles.addButtonDisabled,
                  ]}
                  onPress={saveCustomCommand}
                  disabled={!commandName.trim() || !commandAction}
                >
                  <Plus size={20} color="white" />
                  <Text style={styles.addButtonText}>新增</Text>
                </TouchableOpacity>
              </View>

              {/* Saved Commands */}
              <View style={styles.savedCommandsSection}>
                <Text style={styles.sectionTitle}>已儲存的指令</Text>
                {customCommands.length === 0 ? (
                  <Text style={styles.noCommandsText}>尚無自定義指令</Text>
                ) : (
                  <View style={styles.savedCommandsList}>
                    {customCommands.map((command) => (
                      <View key={command.id} style={styles.savedCommandItem}>
                        <View style={styles.savedCommandInfo}>
                          <Text style={styles.savedCommandName}>{command.name}</Text>
                          <Text style={styles.savedCommandAction}>{getActionLabel(command.action)}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteCommandButton}
                          onPress={() => deleteCustomCommand(command.id)}
                        >
                          <X size={16} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </Modal>

      </View>
    </ScrollView>
  );
}

const createStyles = () => {
  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth >= 768;
  const isDesktop = screenWidth >= 1024;
  
  const getResponsiveSize = (mobile: number, tablet: number, desktop: number) => {
    if (isDesktop) return desktop;
    if (isTablet) return tablet;
    return mobile;
  };
  
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  content: {
    paddingHorizontal: getResponsiveSize(16, 24, 32),
    paddingBottom: 40,
    maxWidth: getResponsiveSize(400, 600, 800),
    alignSelf: "center",
    width: "100%",
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    textAlign: "center",
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: getResponsiveSize(12, 16, 20),
    overflow: "hidden",
    marginBottom: getResponsiveSize(20, 24, 28),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    minHeight: getResponsiveSize(180, 220, 260),
    maxHeight: getResponsiveSize(220, 280, 340),
  },
  video: {
    width: "100%",
    height: "100%",
  },

  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "space-between",
    padding: 16,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  videoTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600" as const,
    flex: 1,
    marginRight: 12,
  },
  centerControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 40,
    padding: 12,
  },
  bottomControls: {
    gap: 12,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeText: {
    color: "white",
    fontSize: 12,
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.accent.primary,
    borderRadius: 2,
  },
  bottomButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  speedSelector: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  speedText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  placeholderContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: Colors.secondary.bg,
    borderRadius: getResponsiveSize(12, 16, 20),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: getResponsiveSize(20, 24, 28),
    borderWidth: 2,
    borderColor: Colors.card.border,
    borderStyle: "dashed",
    minHeight: getResponsiveSize(180, 220, 260),
    maxHeight: getResponsiveSize(220, 280, 340),
  },

  voiceControlSection: {
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 8,
  },
  voiceButtonContainer: {
    marginBottom: 16,
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4ECDC4",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  voiceButtonActive: {
    backgroundColor: Colors.danger,
  },
  voiceStatusSection: {
    alignItems: "center",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary.textSecondary,
  },
  statusDotActive: {
    backgroundColor: Colors.accent.primary,
  },
  voiceHint: {
    color: Colors.primary.text,
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 6,
  },
  supportedCommands: {
    color: Colors.primary.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
  speedIcon: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  successMessage: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: {
    color: Colors.primary.text,
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  successSubtitle: {
    color: Colors.primary.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  voiceStatusContainer: {
    backgroundColor: Colors.secondary.bg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: "center",
  },
  voiceStatusText: {
    color: Colors.accent.primary,
    fontSize: 14,
  },
  uploadSection: {
    marginBottom: 32,
    marginHorizontal: 4,
  },
  uploadContainer: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.card.border,
    borderStyle: "dashed",
  },
  uploadTitle: {
    color: Colors.primary.text,
    fontSize: getResponsiveSize(14, 15, 16),
    fontWeight: "600" as const,
    marginTop: 12,
    marginBottom: 6,
    textAlign: "center",
  },
  uploadSubtitle: {
    color: Colors.primary.textSecondary,
    fontSize: getResponsiveSize(13, 14, 15),
    textAlign: "center",
  },
  urlSection: {
    marginBottom: 32,
    marginHorizontal: 4,
  },
  urlInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.card.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urlIcon: {
    marginRight: 12,
  },
  urlInput: {
    flex: 1,
    paddingVertical: getResponsiveSize(12, 14, 16),
    color: Colors.primary.text,
    fontSize: getResponsiveSize(13, 14, 15),
  },
  loadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#4ECDC4",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadButtonDisabled: {
    backgroundColor: Colors.primary.textSecondary,
    opacity: 0.5,
  },
  loadButtonText: {
    color: "white",
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: "600" as const,
  },
  loadButtonTextDisabled: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  supportedFormats: {
    color: Colors.primary.textSecondary,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  commandsSection: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: getResponsiveSize(12, 16, 20),
    marginBottom: getResponsiveSize(12, 16, 20),
    marginHorizontal: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  commandsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: getResponsiveSize(15, 18, 20),
    backgroundColor: Colors.card.bg,
  },
  commandsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  commandsTitle: {
    color: Colors.primary.text,
    fontSize: getResponsiveSize(14, 15, 16),
    fontWeight: "600" as const,
  },
  commandsList: {
    padding: 16,
  },
  commandCategory: {
    marginBottom: 20,
  },
  categoryTitle: {
    color: Colors.accent.primary,
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: "600" as const,
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  commandItems: {
    gap: 8,
  },
  commandItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
  },
  commandAction: {
    color: Colors.primary.text,
    fontSize: getResponsiveSize(13, 14, 15),
  },
  commandExample: {
    color: Colors.primary.textSecondary,
    fontSize: getResponsiveSize(11, 12, 13),
    backgroundColor: Colors.card.bg,
    paddingHorizontal: getResponsiveSize(6, 8, 10),
    paddingVertical: getResponsiveSize(2, 3, 4),
    borderRadius: getResponsiveSize(4, 6, 8),
  },
  customCommandItem: {
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
    backgroundColor: Colors.secondary.bg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.primary.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  addCommandSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.primary.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  actionSelector: {
    marginBottom: 8,
    maxHeight: 50,
  },
  actionScrollContent: {
    paddingHorizontal: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  actionButton: {
    backgroundColor: Colors.secondary.bg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  actionButtonSelected: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  actionButtonText: {
    color: Colors.primary.text,
    fontSize: 14,
    fontWeight: "500" as const,
  },
  actionButtonTextSelected: {
    color: "white",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  addButtonDisabled: {
    backgroundColor: Colors.primary.textSecondary,
    opacity: 0.5,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  savedCommandsSection: {
    marginBottom: 32,
  },
  noCommandsText: {
    color: Colors.primary.textSecondary,
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 16,
  },
  savedCommandsList: {
    gap: 12,
  },
  savedCommandItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.secondary.bg,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  savedCommandInfo: {
    flex: 1,
  },
  savedCommandName: {
    color: Colors.primary.text,
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  savedCommandAction: {
    color: Colors.primary.textSecondary,
    fontSize: 14,
  },
  deleteCommandButton: {
    padding: 8,
  },
  actionSelectorButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
    marginBottom: 8,
  },
  actionSelectorText: {
    color: Colors.primary.text,
    fontSize: 16,
  },
  actionScrollView: {
    maxHeight: 300,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
    marginBottom: 8,
  },
  actionCategory: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
  },
  actionCategoryTitle: {
    color: Colors.accent.primary,
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  actionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  actionItemSelected: {
    backgroundColor: Colors.accent.primary,
  },
  actionItemText: {
    color: Colors.primary.text,
    fontSize: 14,
  },
  actionItemTextSelected: {
    color: "white",
  },
  
  // Modern Header Styles
  modernHeader: {
    marginBottom: 32,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  modernTitle: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: "600" as const,
    color: Colors.primary.text,
    textAlign: "center",
    marginBottom: 6,
  },
  modernSubtitle: {
    fontSize: getResponsiveSize(13, 14, 15),
    color: Colors.primary.textSecondary,
    textAlign: "center",
    fontWeight: "500" as const,
  },
  
  // Dual Voice Hub Styles
  dualVoiceHub: {
    marginBottom: getResponsiveSize(24, 28, 32),
    gap: getResponsiveSize(16, 20, 24),
  },
  
  // Siri Card Styles
  siriCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: getResponsiveSize(16, 20, 24),
    padding: getResponsiveSize(20, 24, 28),
    borderWidth: 1,
    borderColor: Colors.card.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  siriCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  siriIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.primary + '15',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  siriCardContent: {
    flex: 1,
  },
  siriCardTitle: {
    fontSize: getResponsiveSize(15, 16, 17),
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 4,
  },
  siriCardStatus: {
    fontSize: getResponsiveSize(13, 14, 15),
    color: Colors.accent.primary,
    fontWeight: "500" as const,
  },
  siriStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent.primary,
  },
  siriQuickActions: {
    flexDirection: "row",
    gap: 12,
  },
  siriQuickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.accent.primary + '10',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accent.primary + '20',
  },
  siriQuickActionText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.accent.primary,
  },
  
  // App Voice Card Styles
  appVoiceCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: getResponsiveSize(16, 20, 24),
    padding: getResponsiveSize(20, 24, 28),
    borderWidth: 1,
    borderColor: Colors.card.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  appVoiceHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  appVoiceTitle: {
    fontSize: getResponsiveSize(15, 16, 17),
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 6,
    textAlign: "center",
  },
  appVoiceSubtitle: {
    fontSize: getResponsiveSize(13, 14, 15),
    color: Colors.primary.textSecondary,
    textAlign: "center",
    fontWeight: "500" as const,
  },
  voiceControlCenter: {
    alignItems: "center",
    marginBottom: 24,
  },
  voiceControlInfo: {
    alignItems: "center",
    marginTop: 16,
  },
  statusIndicators: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  voiceControlStatus: {
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: "600" as const,
    color: Colors.primary.text,
    textAlign: "center",
  },
  quickVoiceActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  quickVoiceAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.card.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  quickVoiceActionActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  quickVoiceActionText: {
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: "600" as const,
    color: Colors.primary.textSecondary,
  },
  quickVoiceActionTextActive: {
    color: "white",
  },
  
  modernVoiceButton: {
    width: getResponsiveSize(56, 64, 72),
    height: getResponsiveSize(56, 64, 72),
    borderRadius: getResponsiveSize(28, 32, 36),
    backgroundColor: "#4ECDC4",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: "relative",
  },
  modernVoiceButtonActive: {
    backgroundColor: Colors.danger,
    shadowColor: Colors.danger,
  },
  voiceButtonInner: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  
  // Quick Actions Styles
  quickActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.card.bg,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  quickActionButtonActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.primary.textSecondary,
  },
  quickActionTextActive: {
    color: "white",
  },
  
  // Siri Setup Modal Styles
  siriSetupModal: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  siriSetupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
    backgroundColor: Colors.secondary.bg,
  },
  siriSetupTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary.text,
  },
  siriSetupContent: {
    flex: 1,
    padding: 20,
  },
  siriSetupSection: {
    flex: 1,
  },
  siriFeatureCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  siriFeatureIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent.primary + '20',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  siriFeatureTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.primary.text,
    marginBottom: 12,
    textAlign: "center",
  },
  siriFeatureDescription: {
    fontSize: 16,
    color: Colors.primary.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  siriInstructions: {
    marginBottom: 32,
  },
  siriInstructionsTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 16,
  },
  siriStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  siriStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent.primary,
    color: "white",
    fontSize: 16,
    fontWeight: "700" as const,
    textAlign: "center",
    lineHeight: 32,
    marginRight: 16,
  },
  siriStepText: {
    flex: 1,
    fontSize: 16,
    color: Colors.primary.text,
    lineHeight: 22,
  },
  siriEnableButton: {
    backgroundColor: Colors.accent.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  siriEnableButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "white",
  },
  });
};

const styles = createStyles();