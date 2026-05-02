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
    if (!video || !src) return;

    let isMounted = true;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Hls = require('hls.js').default;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!isMounted) return;

    const t0 = performance.now();

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 0,
        maxBufferLength: 8,
        maxMaxBufferLength: 15,
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 5,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log(`[HLS] manifest parsed: ${(performance.now() - t0).toFixed(0)} ms`);
        video.play().catch(() => {});
      });
      video.addEventListener('playing', () => {
        console.log(`[HLS] first frame:     ${(performance.now() - t0).toFixed(0)} ms`);
      }, { once: true });
      hls.on(Hls.Events.ERROR, (_event: unknown, data: any) => {
        if (data?.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
            hlsRef.current = null;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.play().catch(() => {});
    }

    return () => {
      isMounted = false;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

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
  if (!src) return null;
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

