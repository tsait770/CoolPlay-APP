import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import WebView from 'react-native-webview';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  AlertCircle,
} from 'lucide-react-native';
import { detectVideoSource } from '@/utils/videoSourceDetector';

interface VideoPlayerProps {
  url: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
}

export default function VideoPlayer({ url, onError, onLoad }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect video source type
  const sourceInfo = detectVideoSource(url);
  
  // Initialize video player for native video playback
  const videoUrl = sourceInfo.type === 'direct' || sourceInfo.type === 'stream' ? url : '';
  const player = useVideoPlayer(videoUrl && videoUrl.trim() !== '' ? videoUrl : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    };
  }, [showControls, isPlaying]);

  const seek = useCallback((seconds: number) => {
    if (sourceInfo.type === 'youtube' || sourceInfo.type === 'vimeo') {
      webViewRef.current?.injectJavaScript(`seekTo(${seconds});`);
    } else if (player) {
      const newPosition = Math.max(0, Math.min(duration, currentTime + seconds));
      player.currentTime = newPosition;
    }
  }, [sourceInfo.type, player, duration, currentTime]);

  const setVolume = useCallback((volume: number) => {
    if (sourceInfo.type === 'youtube' || sourceInfo.type === 'vimeo') {
      webViewRef.current?.injectJavaScript(`setVolume(${volume});`);
    } else if (player) {
      player.volume = volume;
    }
  }, [sourceInfo.type, player]);

  const toggleMute = useCallback((mute?: boolean) => {
    const shouldMute = mute !== undefined ? mute : !isMuted;
    
    if (sourceInfo.type === 'youtube' || sourceInfo.type === 'vimeo') {
      webViewRef.current?.injectJavaScript(shouldMute ? 'mute();' : 'unMute();');
    } else if (player) {
      player.muted = shouldMute;
    }
    setIsMuted(shouldMute);
  }, [sourceInfo.type, player, isMuted]);

  // Listen for voice commands
  useEffect(() => {
    const handleVoiceCommand = (event: any) => {
      const detail = event?.detail ?? {};
      const cmd: string | undefined = (detail.intent as string) ?? (detail.command as string);
      if (!cmd) return;
      if (!player && sourceInfo.type === 'direct') return;

      switch (cmd) {
        case 'PlayVideoIntent':
          if (sourceInfo.type === 'youtube' || sourceInfo.type === 'vimeo') {
            webViewRef.current?.injectJavaScript('playVideo();');
          } else if (player) {
            player.play();
          }
          setIsPlaying(true);
          break;
        case 'PauseVideoIntent':
          if (sourceInfo.type === 'youtube' || sourceInfo.type === 'vimeo') {
            webViewRef.current?.injectJavaScript('pauseVideo();');
          } else if (player) {
            player.pause();
          }
          setIsPlaying(false);
          break;
        case 'StopVideoIntent':
          if (sourceInfo.type === 'youtube' || sourceInfo.type === 'vimeo') {
            webViewRef.current?.injectJavaScript('stopVideo();');
          } else if (player) {
            player.pause();
            player.currentTime = 0;
          }
          setIsPlaying(false);
          break;
        case 'NextVideoIntent':
          console.log('NextVideoIntent received');
          break;
        case 'PreviousVideoIntent':
          console.log('PreviousVideoIntent received');
          break;
        case 'ReplayVideoIntent':
          if (sourceInfo.type === 'youtube' || sourceInfo.type === 'vimeo') {
            webViewRef.current?.injectJavaScript('seekTo(-999999);playVideo();');
          } else if (player) {
            player.currentTime = 0;
            player.play();
          }
          setIsPlaying(true);
          break;
        case 'Forward10Intent':
          seek(10);
          break;
        case 'Forward20Intent':
          seek(20);
          break;
        case 'Forward30Intent':
          seek(30);
          break;
        case 'Rewind10Intent':
          seek(-10);
          break;
        case 'Rewind20Intent':
          seek(-20);
          break;
        case 'Rewind30Intent':
          seek(-30);
          break;
        case 'MuteIntent':
          toggleMute(true);
          break;
        case 'UnmuteIntent':
          toggleMute(false);
          break;
        case 'VolumeMaxIntent':
          setVolume(1.0);
          break;
        case 'VolumeHalfIntent':
          setVolume(0.5);
          break;
        case 'VolumeUpIntent':
          setVolume(Math.min(1.0, (player?.volume || 0.5) + 0.2));
          break;
        case 'VolumeDownIntent':
          setVolume(Math.max(0, (player?.volume || 0.5) - 0.2));
          break;
        case 'EnterFullscreenIntent':
          setIsFullscreen(true);
          break;
        case 'ExitFullscreenIntent':
          setIsFullscreen(false);
          break;
        case 'SpeedHalfIntent':
          try {
            if (sourceInfo.type === 'youtube') {
              webViewRef.current?.injectJavaScript('player && player.setPlaybackRate && player.setPlaybackRate(0.5);');
            } else if (sourceInfo.type === 'vimeo') {
              webViewRef.current?.injectJavaScript('player && player.setPlaybackRate && player.setPlaybackRate(0.5);');
            } else if (player && (player as any)) {
              (player as any).playbackRate = 0.5;
            }
          } catch (e) { console.log('Speed change failed', e); }
          break;
        case 'SpeedNormalIntent':
          try {
            if (sourceInfo.type === 'youtube') {
              webViewRef.current?.injectJavaScript('player && player.setPlaybackRate && player.setPlaybackRate(1.0);');
            } else if (sourceInfo.type === 'vimeo') {
              webViewRef.current?.injectJavaScript('player && player.setPlaybackRate && player.setPlaybackRate(1.0);');
            } else if (player && (player as any)) {
              (player as any).playbackRate = 1.0;
            }
          } catch (e) { console.log('Speed change failed', e); }
          break;
        case 'Speed125Intent':
          try {
            if (sourceInfo.type === 'youtube') {
              webViewRef.current?.injectJavaScript('player && player.setPlaybackRate && player.setPlaybackRate(1.25);');
            } else if (sourceInfo.type === 'vimeo') {
              webViewRef.current?.injectJavaScript('player && player.setPlaybackRate && player.setPlaybackRate(1.25);');
            } else if (player && (player as any)) {
              (player as any).playbackRate = 1.25;
            }
          } catch (e) { console.log('Speed change failed', e); }
          break;
        case 'Speed150Intent':
          try {
            if (sourceInfo.type === 'youtube') {
              webViewRef.current?.injectJavaScript('player && player.setPlaybackRate && player.setPlaybackRate(1.5);');
            } else if (sourceInfo.type === 'vimeo') {
              webViewRef.current?.injectJavaScript('player && player.setPlaybackRate && player.setPlaybackRate(1.5);');
            } else if (player && (player as any)) {
              (player as any).playbackRate = 1.5;
            }
          } catch (e) { console.log('Speed change failed', e); }
          break;
        case 'Speed200Intent':
          try {
            if (sourceInfo.type === 'youtube') {
              webViewRef.current?.injectJavaScript('player && player.setPlaybackRate && player.setPlaybackRate(2.0);');
            } else if (sourceInfo.type === 'vimeo') {
              webViewRef.current?.injectJavaScript('player && player.setPlaybackRate && player.setPlaybackRate(2.0);');
            } else if (player && (player as any)) {
              (player as any).playbackRate = 2.0;
            }
          } catch (e) { console.log('Speed change failed', e); }
          break;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('voiceCommand', handleVoiceCommand);
      return () => {
        window.removeEventListener('voiceCommand', handleVoiceCommand);
      };
    }
  }, [player, sourceInfo.type, seek, setVolume, toggleMute]);

  // Update playback status for native player
  useEffect(() => {
    if (!player || sourceInfo.type !== 'direct') return;

    const interval = setInterval(() => {
      setCurrentTime(player.currentTime);
      setDuration(player.duration);
      setIsPlaying(player.playing);
      if (isLoading && player.duration > 0) {
        setIsLoading(false);
        onLoad?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player, sourceInfo.type, isLoading, onLoad]);

  const getEmbedHtml = useCallback(() => {
    if (sourceInfo.type === 'youtube' && sourceInfo.videoId) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
            <style>
              body { margin: 0; padding: 0; background: #000; }
              .video-container { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; }
              .video-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
            </style>
            <script>
              var player;
              var tag = document.createElement('script');
              tag.src = "https://www.youtube.com/iframe_api";
              var firstScriptTag = document.getElementsByTagName('script')[0];
              firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
              
              function onYouTubeIframeAPIReady() {
                player = new YT.Player('player', {
                  height: '100%',
                  width: '100%',
                  videoId: '${sourceInfo.videoId}',
                  playerVars: {
                    'playsinline': 1,
                    'autoplay': 1,
                    'rel': 0,
                    'modestbranding': 1,
                    'controls': 1
                  },
                  events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                  }
                });
              }
              
              function onPlayerReady(event) {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ready'}));
              }
              
              function onPlayerStateChange(event) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'stateChange',
                  state: event.data
                }));
              }
              
              function playVideo() {
                if (player && player.playVideo) player.playVideo();
              }
              
              function pauseVideo() {
                if (player && player.pauseVideo) player.pauseVideo();
              }
              
              function stopVideo() {
                if (player && player.stopVideo) player.stopVideo();
              }
              
              function seekTo(seconds) {
                if (player && player.seekTo) {
                  var current = player.getCurrentTime();
                  player.seekTo(current + seconds, true);
                }
              }
              
              function setVolume(volume) {
                if (player && player.setVolume) player.setVolume(volume * 100);
              }
              
              function mute() {
                if (player && player.mute) player.mute();
              }
              
              function unMute() {
                if (player && player.unMute) player.unMute();
              }
            </script>
          </head>
          <body>
            <div class="video-container">
              <div id="player"></div>
            </div>
          </body>
        </html>
      `;
    } else if (sourceInfo.type === 'vimeo' && sourceInfo.videoId) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
            <style>
              body { margin: 0; padding: 0; background: #000; }
              .video-container { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; }
              .video-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
            </style>
            <script src="https://player.vimeo.com/api/player.js"></script>
          </head>
          <body>
            <div class="video-container">
              <iframe id="vimeo-player"
                src="https://player.vimeo.com/video/${sourceInfo.videoId}?autoplay=1"
                frameborder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowfullscreen>
              </iframe>
            </div>
            <script>
              var iframe = document.querySelector('#vimeo-player');
              var player = new Vimeo.Player(iframe);
              
              player.on('play', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'play'}));
              });
              
              player.on('pause', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'pause'}));
              });
              
              player.on('ended', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ended'}));
              });
              
              function playVideo() {
                player.play();
              }
              
              function pauseVideo() {
                player.pause();
              }
              
              function stopVideo() {
                player.pause();
                player.setCurrentTime(0);
              }
              
              function seekTo(seconds) {
                player.getCurrentTime().then(function(time) {
                  player.setCurrentTime(time + seconds);
                });
              }
              
              function setVolume(volume) {
                player.setVolume(volume);
              }
              
              function mute() {
                player.setVolume(0);
              }
              
              function unMute() {
                player.setVolume(1);
              }
            </script>
          </body>
        </html>
      `;
    }
    return '';
  }, [sourceInfo]);

  const togglePlayPause = () => {
    if (sourceInfo.type === 'youtube' || sourceInfo.type === 'vimeo') {
      if (isPlaying) {
        webViewRef.current?.injectJavaScript('pauseVideo();');
      } else {
        webViewRef.current?.injectJavaScript('playVideo();');
      }
      setIsPlaying(!isPlaying);
    } else if (player) {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
      setIsPlaying(!isPlaying);
    }
  };



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (Platform.OS === 'web') {
      if (!isFullscreen) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const messageData = event?.nativeEvent?.data;
      if (!messageData || typeof messageData !== 'string') {
        return;
      }
      
      // Skip empty or invalid messages
      if (messageData.trim().length === 0) {
        return;
      }
      
      // Additional validation before parsing
      if (messageData.includes('object Object') || 
          messageData.includes('undefined') || 
          messageData.includes('NaN') ||
          messageData.match(/^[a-zA-Z]/) ||
          messageData.includes('source.uri should not be an empty string') ||
          messageData.includes('Voice commands import error')) {
        return;
      }
      
      // Only process valid JSON messages
      if (!messageData.startsWith('{') && !messageData.startsWith('[')) {
        return;
      }
      
      const data = JSON.parse(messageData);
      if (!data || typeof data !== 'object') {
        return;
      }
      
      if (data.type === 'ready') {
        setIsLoading(false);
        onLoad?.();
      } else if (data.type === 'stateChange') {
        // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
        if (data.state === 1) {
          setIsPlaying(true);
        } else if (data.state === 2 || data.state === 0) {
          setIsPlaying(false);
        }
      } else if (data.type === 'play') {
        setIsPlaying(true);
      } else if (data.type === 'pause' || data.type === 'ended') {
        setIsPlaying(false);
      }
    } catch {
      // Silently ignore parsing errors to prevent console spam
    }
  };

  // Handle unsupported sources
  if (sourceInfo.type === 'unsupported') {
    return (
      <View style={styles.container}>
        <View style={styles.errorOverlay}>
          <AlertCircle size={48} color="#ff4444" />
          <Text style={styles.errorText}>{sourceInfo.error || '不支援的視頻格式'}</Text>
          {sourceInfo.platform && (
            <Text style={styles.errorSubtext}>平台: {sourceInfo.platform}</Text>
          )}
        </View>
      </View>
    );
  }

  // Handle empty URL
  if (!url || url.trim() === '') {
    return (
      <View style={styles.container}>
        <View style={styles.errorOverlay}>
          <AlertCircle size={48} color="#ff4444" />
          <Text style={styles.errorText}>無效的視頻連結</Text>
        </View>
      </View>
    );
  }

  // Use WebView for YouTube and Vimeo
  if (sourceInfo.type === 'youtube' || sourceInfo.type === 'vimeo') {
    const embedHtml = getEmbedHtml();
    
    if (!embedHtml) {
      return (
        <View style={styles.container}>
          <View style={styles.errorOverlay}>
            <AlertCircle size={48} color="#ff4444" />
            <Text style={styles.errorText}>無法解析視頻ID</Text>
            <Text style={styles.errorSubtext}>請檢查連結格式</Text>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: embedHtml }}
          style={styles.webview}
          allowsFullscreenVideo
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          onMessage={handleWebViewMessage}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            const errorMsg = `視頻載入失敗: ${nativeEvent.description || '未知錯誤'}`;
            setError(errorMsg);
            onError?.(errorMsg);
          }}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
            </View>
          )}
        />
        
        {/* Simple controls overlay for WebView */}
        <TouchableOpacity 
          style={styles.webviewControlsOverlay}
          activeOpacity={1}
          onPress={() => setShowControls(!showControls)}
        >
          {showControls && (
            <View style={styles.webviewControls}>
              <TouchableOpacity onPress={togglePlayPause} style={styles.webviewPlayButton}>
                {isPlaying ? (
                  <Pause size={40} color="#fff" />
                ) : (
                  <Play size={40} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }
  
  // Use native Video component for direct video files
  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      )}
      
      {error && (
        <View style={styles.errorOverlay}>
          <AlertCircle size={48} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Video Controls Overlay */}
      <TouchableOpacity 
        style={styles.controlsOverlay}
        activeOpacity={1}
        onPress={() => setShowControls(!showControls)}
      >
        {showControls && !error && !isLoading && (
          <>
            <View style={styles.topControls}>
              <TouchableOpacity onPress={handleFullscreen}>
                {isFullscreen ? (
                  <Minimize size={24} color="#fff" />
                ) : (
                  <Maximize size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.centerControls}>
              <TouchableOpacity onPress={() => seek(-10)} style={styles.controlButton}>
                <SkipBack size={32} color="#fff" />
                <Text style={styles.seekText}>10s</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
                {isPlaying ? (
                  <Pause size={40} color="#fff" />
                ) : (
                  <Play size={40} color="#fff" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => seek(10)} style={styles.controlButton}>
                <SkipForward size={32} color="#fff" />
                <Text style={styles.seekText}>10s</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.bottomControls}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }]} 
                />
              </View>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
              <TouchableOpacity onPress={() => toggleMute()} style={styles.volumeButton}>
                {isMuted ? (
                  <VolumeX size={20} color="#fff" />
                ) : (
                  <Volume2 size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorSubtext: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
  },
  webviewControlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webviewControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  webviewPlayButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlButton: {
    alignItems: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  volumeButton: {
    padding: 5,
  },
});