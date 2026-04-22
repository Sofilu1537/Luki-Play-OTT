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
}: {
  src: string;
  style?: object;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isMounted = true;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Hls = require('hls.js').default;

    if (!isMounted) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event: unknown, data: any) => {
        if (data?.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            hls.destroy();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari — native HLS
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
    muted: false,
  });
}

// ─────────────────────────────────────────────
// Native HLS player (expo-av — SDK 52 compatible)
// ─────────────────────────────────────────────
function NativeHlsPlayer({ src, style }: { src: string; style?: object }) {
  // Lazy import expo-av to avoid issues on web
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Video, ResizeMode } = require('expo-av') as typeof import('expo-av');
  return (
    <Video
      style={[StyleSheet.absoluteFill, style as object]}
      source={{ uri: src }}
      useNativeControls={false}
      resizeMode={ResizeMode.CONTAIN}
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
  /** Not used in CMS edition — kept for API compatibility with Player */
  onPlayerReady?: (player: unknown) => void;
}

export function HlsVideoPlayer({ src, style }: HlsVideoPlayerProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}>
        <WebHlsPlayer src={src} style={style} />
      </View>
    );
  }
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}>
      <NativeHlsPlayer src={src} style={style} />
    </View>
  );
}

