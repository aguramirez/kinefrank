import React from 'react';
import { getYoutubeId } from '@/lib/youtube';

interface ExerciseVideoProps {
  url: string | null;
  thumbnailMode?: boolean;
  className?: string;
  videoClassName?: string;
}

export default function ExerciseVideo({ 
  url, 
  thumbnailMode = false, 
  className = "",
  videoClassName = "" 
}: ExerciseVideoProps) {
  if (!url) return null;

  const ytId = getYoutubeId(url);

  if (ytId) {
    if (thumbnailMode) {
      return (
        <img 
          src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} 
          alt="Video thumbnail"
          className={`w-full h-full object-cover ${className} ${videoClassName}`}
        />
      );
    }
    
    return (
      <iframe 
        src={`https://www.youtube.com/embed/${ytId}?rel=0`} 
        title="YouTube video player" 
        frameBorder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowFullScreen
        className={`w-full h-full ${className} ${videoClassName}`}
      />
    );
  }

  // Fallback to standard video tag for cloudinary or other direct video links
  return (
    <video 
      src={url} 
      controls={!thumbnailMode} 
      muted={thumbnailMode}
      playsInline={thumbnailMode}
      preload="metadata"
      className={`w-full h-full object-cover ${className} ${videoClassName}`}
    />
  );
}
