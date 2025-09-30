interface VideoSourceInfo {
  type: 'youtube' | 'vimeo' | 'direct' | 'stream' | 'unsupported';
  platform?: string;
  videoId?: string;
  error?: string;
  originalUrl: string;
}

export function detectVideoSource(url: string): VideoSourceInfo {
  if (!url || url.trim() === '') {
    return {
      type: 'unsupported',
      error: '無效的視頻連結',
      originalUrl: url
    };
  }

  const cleanUrl = url.trim();

  // YouTube detection with comprehensive patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*[&?]v=)([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /m\.youtube\.com\/watch\?v=([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/v\/([\w-]{11})/,
    /music\.youtube\.com\/watch\?v=([\w-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      if (/^[\w-]{11}$/.test(videoId)) {
        return {
          type: 'youtube',
          platform: 'YouTube',
          videoId,
          originalUrl: url
        };
      }
    }
  }

  // Try to extract YouTube ID from URL parameters
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    try {
      const urlObj = new URL(cleanUrl);
      const vParam = urlObj.searchParams.get('v');
      if (vParam && /^[\w-]{11}$/.test(vParam)) {
        return {
          type: 'youtube',
          platform: 'YouTube',
          videoId: vParam,
          originalUrl: url
        };
      }
    } catch (e) {
      // URL parsing failed
    }
  }

  // Vimeo detection
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      platform: 'Vimeo',
      videoId: vimeoMatch[1],
      originalUrl: url
    };
  }

  // HLS stream detection
  if (cleanUrl.includes('.m3u8')) {
    return {
      type: 'stream',
      platform: 'HLS Stream',
      originalUrl: url
    };
  }

  // DASH stream detection
  if (cleanUrl.includes('.mpd')) {
    return {
      type: 'stream',
      platform: 'DASH Stream',
      originalUrl: url
    };
  }

  // Direct video file detection
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.ogv', '.mov', '.avi', '.mkv'];
  const hasVideoExtension = videoExtensions.some(ext => 
    cleanUrl.toLowerCase().includes(ext)
  );
  
  if (hasVideoExtension) {
    return {
      type: 'direct',
      platform: 'Direct Video',
      originalUrl: url
    };
  }

  // Google Drive detection
  if (cleanUrl.includes('drive.google.com')) {
    const fileIdMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      // Convert to direct download link
      const directUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
      return {
        type: 'direct',
        platform: 'Google Drive',
        originalUrl: directUrl
      };
    }
  }

  // Dropbox detection
  if (cleanUrl.includes('dropbox.com')) {
    // Convert Dropbox share link to direct link
    const directUrl = cleanUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com')
                              .replace('?dl=0', '')
                              .replace('?dl=1', '');
    return {
      type: 'direct',
      platform: 'Dropbox',
      originalUrl: directUrl
    };
  }

  // Check for unsupported platforms
  const unsupportedPlatforms = [
    { pattern: /netflix\.com/, name: 'Netflix' },
    { pattern: /disneyplus\.com/, name: 'Disney+' },
    { pattern: /hbomax\.com/, name: 'HBO Max' },
    { pattern: /primevideo\.com/, name: 'Prime Video' },
    { pattern: /apple\.com\/tv/, name: 'Apple TV+' },
    { pattern: /hulu\.com/, name: 'Hulu' },
    { pattern: /peacocktv\.com/, name: 'Peacock' },
    { pattern: /paramountplus\.com/, name: 'Paramount+' },
    { pattern: /iqiyi\.com/, name: 'iQiyi' },
    { pattern: /youku\.com/, name: 'Youku' },
    { pattern: /bilibili\.com/, name: 'Bilibili' },
    { pattern: /twitter\.com/, name: 'Twitter/X' },
    { pattern: /x\.com/, name: 'Twitter/X' },
    { pattern: /instagram\.com/, name: 'Instagram' },
    { pattern: /tiktok\.com/, name: 'TikTok' },
    { pattern: /facebook\.com/, name: 'Facebook' },
    { pattern: /twitch\.tv/, name: 'Twitch' },
  ];

  for (const platform of unsupportedPlatforms) {
    if (platform.pattern.test(cleanUrl)) {
      return {
        type: 'unsupported',
        platform: platform.name,
        error: `${platform.name} 內容受DRM保護或需要特殊處理`,
        originalUrl: url
      };
    }
  }

  // Default: try as direct URL if it looks like a valid URL
  try {
    new URL(cleanUrl);
    return {
      type: 'direct',
      platform: 'Unknown',
      originalUrl: url
    };
  } catch {
    return {
      type: 'unsupported',
      error: '無效的URL格式',
      originalUrl: url
    };
  }
}

export function extractVideoInfo(url: string): {
  isSupported: boolean;
  needsSpecialHandling: boolean;
  platform?: string;
  videoId?: string;
  directUrl?: string;
  error?: string;
} {
  const sourceInfo = detectVideoSource(url);
  
  return {
    isSupported: sourceInfo.type !== 'unsupported',
    needsSpecialHandling: sourceInfo.type === 'youtube' || sourceInfo.type === 'vimeo',
    platform: sourceInfo.platform,
    videoId: sourceInfo.videoId,
    directUrl: sourceInfo.type === 'direct' ? sourceInfo.originalUrl : undefined,
    error: sourceInfo.error
  };
}