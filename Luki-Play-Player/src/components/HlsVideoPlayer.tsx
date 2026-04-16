/**
 * HlsVideoPlayer
 *
 * Web  → usa HLS.js (soporta Firefox, Chrome, Edge — todos los navegadores)
 * iOS/Android → usa expo-video (soporte nativo HLS via AVPlayer / ExoPlayer)
 *
 * La prop `onPlayerReady` devuelve el objeto player nativo (solo en mobile)
 * para que el padre pueda llamar player.play() / player.pause().
 */
import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

// Lazy-import expo-video only on native to avoid web bundling issues
let VideoView: React.ComponentType<{
  style?: any;
  player?: any;
  nativeControls?: boolean;
}> | null = null;

let useVideoPlayer: typeof import('expo-video').useVideoPlayer | null = null;

if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const expovideo = require('expo-video') as typeof import('expo-video');
  VideoView = expovideo.VideoView;
  useVideoPlayer = expovideo.useVideoPlayer;
}

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
  const hlsRef = useRef<InstanceType<typeof import('hls.js').default> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isMounted = true;

    import('hls.js').then(({ default: Hls }) => {
      if (!isMounted) return;

      // Destroy previous instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        // Firefox, Chrome, Edge → HLS.js
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {
            // Autoplay blocked by browser policy — user must tap play
          });
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
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
        // Safari — native HLS support
        video.src = src;
        video.play().catch(() => {});
      }
    });

    return () => {
      isMounted = false;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

  // Render as DOM video element (only works on web)
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
// Native HLS player (expo-video)
// ─────────────────────────────────────────────
function NativeHlsPlayer({
  src,
  style,
  onPlayerReady,
}: {
  src: string;
  style?: object;
  onPlayerReady?: (player: ReturnType<NonNullable<typeof useVideoPlayer>>) => void;
}) {
  if (!useVideoPlayer || !VideoView) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const player = useVideoPlayer!(src, p => {
    p.loop = true;
    p.play();
  });

  useEffect(() => {
    onPlayerReady?.(player);
  }, []);

  const SafeVideoView = VideoView as NonNullable<typeof VideoView>;

  return (
    <SafeVideoView
      style={[StyleSheet.absoluteFill, style as object]}
      player={player}
      nativeControls={false}
    />
  );
}

// ─────────────────────────────────────────────
// Unified export
// ─────────────────────────────────────────────
interface HlsVideoPlayerProps {
  src: string;
  style?: object;
  onPlayerReady?: (player: ReturnType<NonNullable<typeof useVideoPlayer>>) => void;
}

export function HlsVideoPlayer({ src, style, onPlayerReady }: HlsVideoPlayerProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, style as object]}>
        <WebHlsPlayer src={src} />
      </View>
    );
  }
  return <NativeHlsPlayer src={src} style={style} onPlayerReady={onPlayerReady} />;
}
