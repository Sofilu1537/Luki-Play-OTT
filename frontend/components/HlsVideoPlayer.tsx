/**
 * HlsVideoPlayer — CMS Edition
 *
 * Web  → uses HLS.js (Firefox, Chrome, Edge)
 * iOS/Android → uses expo-av Video (SDK 52 compatible)
 */
import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

// ─────────────────────────────────────────────
// Web HLS player (HLS.js)
// ─────────────────────────────────────────────
function WebHlsPlayer({
  src,
  style,
  volume = 1,
}: {
  src: string;
  style?: object;
  volume?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = volume === 0;
    }
  }, [volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Hls = require('hls.js').default;

    if (Hls.isSupported()) {
      if (!hlsRef.current) {
        // First load — create instance once, attach to video element once
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 0,     // no back buffer needed for live zapping
          maxBufferLength: 8,      // start playback with only 8 s buffered
          maxMaxBufferLength: 15,
          liveSyncDurationCount: 2,
          liveMaxLatencyDurationCount: 5,
        });
        hlsRef.current = hls;
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_event: unknown, data: any) => {
          if (data?.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hlsRef.current?.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hlsRef.current?.recoverMediaError();
            } else {
              hlsRef.current?.destroy();
              hlsRef.current = null;
            }
          }
        });
      }
      // Reuse instance on channel switch — avoids destroy+create overhead
      hlsRef.current.loadSource(src);
      hlsRef.current.startLoad(-1);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari — native HLS
      video.src = src;
      video.play().catch(() => {});
    }
  }, [src]);

  // Destroy only on unmount, not on every src change
  useEffect(() => {
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, []);

  return React.createElement('video', {
    ref: videoRef,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      backgroundColor: '#000',
      ...(style ?? {}),
    },
    autoPlay: true,
    playsInline: true,
    controls: false,
    muted: volume === 0,
  });
}

// ─────────────────────────────────────────────
// Native HLS player (expo-av — SDK 52 compatible)
// ─────────────────────────────────────────────
function NativeHlsPlayer({ src, style, volume = 1 }: { src: string; style?: object; volume?: number }) {
  // Lazy import expo-av to avoid issues on web
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Video, ResizeMode } = require('expo-av') as typeof import('expo-av');
  return (
    <Video
      style={[StyleSheet.absoluteFill, style as object]}
      source={{ uri: src }}
      useNativeControls={false}
      resizeMode={ResizeMode.CONTAIN}
      volume={volume}
      isMuted={volume === 0}
      shouldPlay
      isLooping
    />
  );
}

// ─────────────────────────────────────────────
// Unified export
// ─────────────────────────────────────────────
interface HlsVideoPlayerProps {
  src: string;
  style?: object;
  volume?: number;
  /** Not used in CMS edition — kept for API compatibility with Player */
  onPlayerReady?: (player: unknown) => void;
}

export function HlsVideoPlayer({ src, style, volume = 1 }: HlsVideoPlayerProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}>
        <WebHlsPlayer src={src} style={style} volume={volume} />
      </View>
    );
  }
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}>
      <NativeHlsPlayer src={src} style={style} volume={volume} />
    </View>
  );
}

