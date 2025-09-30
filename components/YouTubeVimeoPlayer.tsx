import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react-native';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { detectVideoSource } from '@/utils/videoSourceDetector';

// Web-specific component for iframe rendering
const WebIframePlayer: React.FC<{ embedUrl: string; onLoad?: () => void; onError?: (error: string) => void }> = ({ embedUrl, onLoad, onError }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const iframe = iframeRef.current;
      if (iframe && typeof iframe.addEventListener === 'function') {
        const handleLoad = () => {
          setIsLoading(false);
          onLoad?.();
        };
        
        const handleError = () => {
          const errorMsg = '視頻載入失敗';
          setIsLoading(false);
          onError?.(errorMsg);
        };
        
        try {
          iframe.addEventListener('load', handleLoad);
          iframe.addEventListener('error', handleError);
          
          return () => {
            try {
              if (iframe && typeof iframe.removeEventListener === 'function') {
                iframe.removeEventListener('load', handleLoad);
                iframe.removeEventListener('error', handleError);
              }
            } catch (cleanupError) {
              console.warn('Error cleaning up iframe event listeners:', cleanupError);
            }
          };
        } catch (eventError) {
          console.warn('Error adding iframe event listeners:', eventError);
        }
      }
    }
  }, [onLoad, onError]);

  if (Platform.OS === 'web') {
    return (
      <div className="web-video-container">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="web-video-iframe"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
        {isLoading && (
          <div className="web-video-loading">
            <div className="web-video-spinner" />
          </div>
        )}
      </div>
    );
  }
  
  return null;
};

interface YouTubeVimeoPlayerProps {
  url: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
}

const YouTubeVimeoPlayer: React.FC<YouTubeVimeoPlayerProps> = ({ url, onError, onLoad }) => {

  const sourceInfo = detectVideoSource(url);

  // 獲取嵌入URL
  const getEmbedUrl = useCallback(() => {
    if (sourceInfo.type === 'youtube' && sourceInfo.videoId) {
      return `https://www.youtube.com/embed/${sourceInfo.videoId}?autoplay=1&controls=1&rel=0&modestbranding=1`;
    } else if (sourceInfo.type === 'vimeo' && sourceInfo.videoId) {
      return `https://player.vimeo.com/video/${sourceInfo.videoId}?autoplay=1`;
    }
    return null;
  }, [sourceInfo]);

  // 處理不支援的源
  if (sourceInfo.type === 'unsupported') {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <AlertCircle size={48} color="#ef4444" style={styles.errorIcon} />
          <Text style={styles.errorText}>{sourceInfo.error || '不支援的視頻格式'}</Text>
          {sourceInfo.platform && (
            <Text style={styles.platformText}>平台: {sourceInfo.platform}</Text>
          )}
        </View>
      </View>
    );
  }

  // 處理空URL
  if (!url || url.trim() === '') {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <AlertCircle size={48} color="#ef4444" style={styles.errorIcon} />
          <Text style={styles.errorText}>無效的視頻連結</Text>
        </View>
      </View>
    );
  }

  const embedUrl = getEmbedUrl();

  if (!embedUrl) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <AlertCircle size={48} color="#ef4444" style={styles.errorIcon} />
          <Text style={styles.errorText}>無法解析視頻ID</Text>
          <Text style={styles.platformText}>請檢查連結格式</Text>
        </View>
      </View>
    );
  }

  // Platform-specific rendering
  if (Platform.OS === 'web') {
    return (
      <WebIframePlayer
        embedUrl={embedUrl}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  // Native mobile rendering
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: embedUrl }}
        style={styles.webview}
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        onLoad={() => {
          onLoad?.();
        }}
        onError={() => {
          const errorMsg = '視頻載入失敗';
          onError?.(errorMsg);
        }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  errorContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    alignItems: 'center',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  platformText: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

// Add CSS styles for web components with proper DOM readiness checks
if (Platform.OS === 'web' && typeof document !== 'undefined' && typeof window !== 'undefined') {
  const addWebVideoStyles = () => {
    try {
      // Check if DOM is ready and document.head exists
      if (!document || !document.head || document.readyState === 'loading') {
        // DOM not ready, try again later
        setTimeout(addWebVideoStyles, 100);
        return;
      }
      
      // Check if styles already exist
      if (document.head.querySelector('#web-video-styles')) {
        return;
      }
      
      // Additional safety check for appendChild method
      if (typeof document.head.appendChild !== 'function') {
        console.warn('document.head.appendChild not available for web video styles');
        return;
      }
      
      const style = document.createElement('style');
      style.id = 'web-video-styles';
      style.textContent = `
        .web-video-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16/9;
          background-color: #000;
        }
        
        .web-video-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        
        .web-video-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.5);
        }
        
        .web-video-spinner {
          width: 48px;
          height: 48px;
          border: 2px solid #3b82f6;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      
      // Safely append to head
      document.head.appendChild(style);
      console.log('Web video styles added successfully');
    } catch (error) {
      console.warn('Failed to add web video styles:', error);
      // Try alternative method
      try {
        if (document.head && document.head.insertAdjacentHTML && typeof document.head.insertAdjacentHTML === 'function') {
          document.head.insertAdjacentHTML('beforeend', `
            <style id="web-video-styles">
              .web-video-container {
                position: relative;
                width: 100%;
                aspect-ratio: 16/9;
                background-color: #000;
              }
              .web-video-iframe {
                width: 100%;
                height: 100%;
                border: none;
              }
              .web-video-loading {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: rgba(0, 0, 0, 0.5);
              }
              .web-video-spinner {
                width: 48px;
                height: 48px;
                border: 2px solid #3b82f6;
                border-top: 2px solid transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          `);
          console.log('Web video styles added via insertAdjacentHTML');
        }
      } catch (altError) {
        console.warn('Alternative web video style injection also failed:', altError);
      }
    }
  };
  
  // Initialize styles when DOM is ready
  if (document.readyState === 'loading') {
    if (typeof document.addEventListener === 'function') {
      document.addEventListener('DOMContentLoaded', addWebVideoStyles, { once: true });
    }
    // Fallback timeout
    setTimeout(addWebVideoStyles, 500);
  } else {
    // DOM is already ready
    addWebVideoStyles();
  }
}

export default YouTubeVimeoPlayer;