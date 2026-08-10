import React from 'react';
import { X } from 'lucide-react';

interface VideoModalProps {
  url: string | null;
  onClose: () => void;
}

const getYoutubeEmbedUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    let videoId = '';
    
    if (urlObj.hostname.includes('youtube.com')) {
      if (urlObj.pathname.includes('/shorts/')) {
        videoId = urlObj.pathname.split('/shorts/')[1].split('?')[0];
      } else {
        videoId = urlObj.searchParams.get('v') || '';
      }
    } else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1).split('?')[0];
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
  } catch (e) {
    console.error('Invalid video URL', url);
  }
  return url;
};

export const VideoModal: React.FC<VideoModalProps> = ({ url, onClose }) => {
  if (!url) return null;

  const embedUrl = getYoutubeEmbedUrl(url);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      background: '#000000',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        padding: '16px', 
        display: 'flex', 
        justifyContent: 'flex-end',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10001
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            cursor: 'pointer'
          }}
        >
          <X size={24} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title="Video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ 
            maxWidth: '1200px',
            maxHeight: '100vh',
            aspectRatio: embedUrl.includes('youtube') && url.includes('/shorts/') ? '9/16' : '16/9'
          }}
        />
      </div>
    </div>
  );
};
