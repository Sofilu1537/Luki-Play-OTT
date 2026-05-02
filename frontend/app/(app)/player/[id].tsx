'use client';
/**
 * LivePlayer — Full OTT live channel player for Luki-CMS
 *
 * Adapted from Luki-Play-Player/src/screens/LivePlayerScreen.tsx for
 * Expo Router. Key differences:
 *   - Uses useLocalSearchParams({ id }) instead of React Navigation params
 *   - Uses useRouter().back() instead of navigation.goBack()
 *   - Imports HlsVideoPlayer and useChannels from CMS services (port 3000)
 *
 * Route: /player/[id]
 *   id — channel id from the channel list (or 'live' to start on channel 0)
 */
import React, {
  useState, useRef, useEffect, useCallback,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  FlatList, Animated, Platform, PanResponder,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChannels, getCurrentProgram, getProgressPercent, toggleFavorite, fetchStreamUrl } from '../../../services/useChannels';
import { HlsVideoPlayer } from '../../../components/HlsVideoPlayer';
import type { Channel } from '../../../services/channelTypes';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { resolveLogoUrl } from '../../../services/api/config';
import { useAuthStore, DEV_DEVICE_ID } from '../../../services/authStore';
import { openStream, streamHeartbeat, stopStream } from '../../../services/streamApi';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const CONTROLS_HIDE_MS = 6000;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function Icon({ name, size = 20, color = '#fff' }: { name: string; size?: number; color?: string }) {
  const icons: Record<string, string> = {
    menu: '☰', cast: '📡', airplay: '⊡', lock: '🔒', unlock: '🔓',
    grid: '⠿', settings: '⚙️', heart: '♥', heartFill: '♥', pip: '⧉',
    back10: '↺', channelList: '≡', close: '✕', play: '▶', pause: '⏸',
    number: '#', arrow: '→', fire: '🔥', check: '✓', fullscreen: '⛶',
    back: '←', volume: '🔊', mute: '🔇',
  };
  return <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>{icons[name] ?? name}</Text>;
}

function ChannelLogo({ logo, size = 20, style }: { logo: string; size?: number; style?: any }) {
  if (!logo || logo === '📺') {
    return <Ionicons name="tv-outline" size={size} color="#fff" style={style} />;
  }
  const uri = resolveLogoUrl(logo);
  if (uri) {
    const pad = Math.max(3, Math.floor(size * 0.12));
    return (
      <View style={[{ width: size, height: size, borderRadius: Math.floor(size * 0.2), backgroundColor: '#fff', padding: pad, overflow: 'hidden' }, style]}>
        <Image source={{ uri }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
      </View>
    );
  }
  return <Ionicons name="tv-outline" size={size} color="#fff" style={style} />;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function TopBar({
  isLocked, onLock, opacity, onBack,
}: { isLocked: boolean; onLock: () => void; opacity: Animated.Value; onBack: () => void }) {
  return (
    <Animated.View style={[styles.topBar, { opacity: isLocked ? 1 : opacity }]}>
      <TouchableOpacity style={styles.iconBtn} onPress={onBack} disabled={isLocked}>
        <Ionicons name="chevron-back" size={28} color={isLocked ? 'rgba(255,255,255,0.2)' : '#fff'} />
      </TouchableOpacity>
      {isLocked && (
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' }}>
          Pantalla bloqueada
        </Text>
      )}
      <View style={styles.topRight}>
        <TouchableOpacity style={styles.iconBtn} onPress={onLock}>
          <Icon name={isLocked ? 'lock' : 'unlock'} size={19} color={isLocked ? '#FFB800' : '#fff'} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function BottomInfoBar({
  channel, isFavorite, opacity, onFavorite, onFullscreen, isFullscreen, onVolumeChange, volume = 1
}: { channel: Channel; isFavorite: boolean; opacity: Animated.Value; onFavorite: () => void; onFullscreen?: () => void; isFullscreen?: boolean; onVolumeChange?: (v: number) => void; volume?: number }) {
  const program = getCurrentProgram(channel);
  return (
    <Animated.View style={[styles.bottomInfoBar, { opacity }]}>
      <View style={styles.infoLeft}>
        <TouchableOpacity onPress={onFavorite} style={styles.iconBtn}>
          <Icon name="heartFill" size={20} color={isFavorite ? '#E53935' : 'rgba(255,255,255,0.5)'} />
        </TouchableOpacity>
        <View style={styles.channelTag}>
          <ChannelLogo logo={channel.logo} size={18} />
          <Text style={styles.channelName}>{channel.name}</Text>
        </View>
      </View>
      <View style={styles.infoCenter}>
        <Text style={styles.programName} numberOfLines={1}>{program.title}</Text>
        <View style={styles.liveDot} />
      </View>
      <View style={styles.infoRight}>
        {onVolumeChange && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4 }}>
            <TouchableOpacity onPress={() => onVolumeChange(volume === 0 ? 1 : 0)} style={styles.iconBtn}>
              <Icon name={volume < 0.05 ? 'mute' : 'volume'} size={20} />
            </TouchableOpacity>
            <View 
              style={{ width: 80, height: 24, justifyContent: 'center', marginHorizontal: 4 }}
              onStartShouldSetResponder={() => true}
              onResponderMove={(evt) => {
                const x = evt.nativeEvent.locationX;
                let v = x / 80;
                if (v < 0) v = 0;
                if (v > 1) v = 1;
                onVolumeChange(v);
              }}
              onResponderGrant={(evt) => {
                const x = evt.nativeEvent.locationX;
                let v = x / 80;
                if (v < 0) v = 0;
                if (v > 1) v = 1;
                onVolumeChange(v);
              }}
            >
              <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                <View style={{ width: `${volume * 100}%`, height: '100%', backgroundColor: '#fff', borderRadius: 2 }} />
                <View style={{ position: 'absolute', top: -5, left: `${volume * 100}%`, marginLeft: -7, width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff' }} />
              </View>
            </View>
          </View>
        )}
        {onFullscreen && (
          <TouchableOpacity onPress={onFullscreen} style={styles.iconBtn}>
            <Icon name={isFullscreen ? 'close' : 'fullscreen'} size={20} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

function LiveProgressBar({ channel, opacity }: { channel: Channel; opacity: Animated.Value }) {
  const program = getCurrentProgram(channel);
  const [pct, setPct] = useState(getProgressPercent(program));
  useEffect(() => {
    setPct(getProgressPercent(getCurrentProgram(channel)));
    const t = setInterval(() => setPct(getProgressPercent(getCurrentProgram(channel))), 30000);
    return () => clearInterval(t);
  }, [channel]);
  return (
    <Animated.View style={[styles.progressSection, { opacity }]}>
      <Text style={styles.timeLabel}>{program.startTime}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
        <View style={[styles.progressThumb, { left: `${pct}%` as unknown as number }]} />
      </View>
      <Text style={styles.timeLabel}>{program.endTime}</Text>
    </Animated.View>
  );
}

function ChannelListOverlay({
  channels, activeId, onSelect, onClose,
  onFullscreen, isFullscreen, onVolumeChange, volume = 1,
}: {
  channels: Channel[]; activeId: string; onSelect: (ch: Channel) => void; onClose: () => void;
  onFullscreen?: () => void; isFullscreen?: boolean;
  onVolumeChange?: (v: number) => void; volume?: number;
}) {
  const [hoveredId, setHoveredId] = useState(activeId);
  const hovered = channels.find(c => c.id === hoveredId) ?? channels[0]!;
  const hoveredProgram = getCurrentProgram(hovered);
  const [pct, setPct] = useState(getProgressPercent(hoveredProgram));

  useEffect(() => {
    setPct(getProgressPercent(getCurrentProgram(hovered)));
    const t = setInterval(() => setPct(getProgressPercent(getCurrentProgram(hovered))), 30000);
    return () => clearInterval(t);
  }, [hovered.id]);

  return (
    <View style={styles.overlayContainer}>
      {/* Improvement 1: unified full scrim */}
      <View style={styles.overlayScrim} />
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />

      {/* Improvement 2: unified left rail — horizontal rows */}
      <View style={styles.channelRail}>
        <TouchableOpacity style={styles.railClose} onPress={onClose}>
          <Icon name="close" size={16} />
        </TouchableOpacity>
        <FlatList
          data={channels}
          keyExtractor={c => c.id}
          style={{ flex: 1, marginTop: 44 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const prog = getCurrentProgram(item);
            return (
              <TouchableOpacity
                onPress={() => { setHoveredId(item.id); onSelect(item); }}
                style={[styles.railItem, item.id === hoveredId && styles.railItemActive]}
              >
                <ChannelLogo logo={item.logo} size={28} />
                <View style={styles.railItemText}>
                  <Text style={styles.railName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.railProg} numberOfLines={1}>{prog.title}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Improvement 3: unified EPG bottom bar */}
      <View style={styles.epgBar}>
        <ChannelLogo logo={hovered.logo} size={44} />
        <View style={styles.epgInfo}>
          <View style={styles.epgHeaderRow}>
            <Text style={styles.epgLabel}>Estás viendo</Text>
            <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>EN VIVO</Text></View>
          </View>
          <Text style={styles.epgChannelName} numberOfLines={1}>{hovered.name}</Text>
          <Text style={styles.epgTitle} numberOfLines={1}>{hoveredProgram.title}</Text>
          <Text style={styles.epgTime}>{hoveredProgram.startTime} – {hoveredProgram.endTime}</Text>
          <View style={styles.epgProgress}>
            <View style={[styles.epgProgressFill, { width: `${pct}%` as any }]} />
          </View>
        </View>
        {/* Improvement 6: controls integrated into EPG bar */}
        <View style={styles.epgControls}>
          {onVolumeChange && (
            <TouchableOpacity onPress={() => onVolumeChange(volume < 0.05 ? 1 : 0)} style={styles.iconBtn}>
              <Icon name={volume < 0.05 ? 'mute' : 'volume'} size={22} />
            </TouchableOpacity>
          )}
          {onFullscreen && (
            <TouchableOpacity onPress={onFullscreen} style={styles.iconBtn}>
              <Icon name={isFullscreen ? 'close' : 'fullscreen'} size={22} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// 3×4 grid layout — matches every remote control / phone keypad
const DIAL_ROWS = [
  [{ v: '1', s: '' }, { v: '2', s: 'ABC' }, { v: '3', s: 'DEF' }],
  [{ v: '4', s: 'GHI' }, { v: '5', s: 'JKL' }, { v: '6', s: 'MNO' }],
  [{ v: '7', s: 'PQRS' }, { v: '8', s: 'TUV' }, { v: '9', s: 'WXYZ' }],
  [{ v: '⌫', s: '', t: 'del' }, { v: '0', s: '' }, { v: 'IR', s: '✓', t: 'go' }],
] as const;

function BlinkingCursor() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ width: 2, height: 26, backgroundColor: '#fff', opacity: anim }} />;
}

function TimeoutBar({ duration }: { duration: number }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    anim.setValue(1);
    Animated.timing(anim, { toValue: 0, duration, useNativeDriver: false }).start();
  }, []);
  return (
    <View style={styles.dialTimeoutTrack}>
      <Animated.View style={[styles.dialTimeoutFill, {
        width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
      }]} />
    </View>
  );
}

function ChannelDialOverlay({
  onDigit, onClose, onGo, dialInput, channels,
}: {
  onDigit: (d: string) => void; onClose: () => void; onGo: () => void;
  dialInput: string; channels: Channel[];
}) {
  const matched = dialInput ? channels.find(c => c.number === parseInt(dialInput, 10)) : null;
  const matchedProg = matched ? getCurrentProgram(matched) : null;

  // Auto-confirm 2.5 s after last digit
  useEffect(() => {
    if (!dialInput) return;
    const t = setTimeout(onGo, 2500);
    return () => clearTimeout(t);
  }, [dialInput]);

  return (
    <View style={styles.dialOverlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.dialPanel}>

        {/* Channel preview card */}
        <View style={styles.dialPreview}>
          {matched ? (
            <>
              <ChannelLogo logo={matched.logo} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={styles.dialPreviewNum}>Canal {matched.number}</Text>
                <Text style={styles.dialPreviewName} numberOfLines={1}>{matched.name}</Text>
                {matchedProg && <Text style={styles.dialPreviewProg} numberOfLines={1}>{matchedProg.title}</Text>}
              </View>
            </>
          ) : (
            <>
              <View style={styles.dialPreviewEmpty}>
                <Ionicons name="tv-outline" size={22} color="rgba(255,255,255,0.25)" />
              </View>
              <Text style={styles.dialPreviewHint}>Ingresa el número de canal</Text>
            </>
          )}
        </View>

        {/* Digit display slots */}
        <View style={styles.dialDisplay}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[
              styles.dialSlot,
              !!dialInput[i] && styles.dialSlotFilled,
              !dialInput[i] && i === dialInput.length && styles.dialSlotCursor,
            ]}>
              {dialInput[i]
                ? <Text style={styles.dialSlotText}>{dialInput[i]}</Text>
                : i === dialInput.length ? <BlinkingCursor /> : null}
            </View>
          ))}
        </View>

        {/* Timeout progress bar — resets on each new digit via key prop */}
        {dialInput.length > 0
          ? <TimeoutBar key={dialInput} duration={2500} />
          : <View style={styles.dialTimeoutTrack} />}
        <Text style={styles.dialTimeoutHint}>
          {dialInput.length > 0 ? 'Auto-confirma en 2 s…' : ' '}
        </Text>

        {/* 3×4 keypad grid */}
        <View style={styles.dialGrid}>
          {DIAL_ROWS.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', gap: 8 }}>
              {row.map((k) => (
                <TouchableOpacity
                  key={k.v}
                  style={[
                    styles.dialKey,
                    k.t === 'del' && styles.dialKeyDel,
                    k.t === 'go' && styles.dialKeyGo,
                  ]}
                  onPress={() => {
                    if (k.t === 'del') onDigit('⌫');
                    else if (k.t === 'go') onGo();
                    else onDigit(k.v);
                  }}
                >
                  <Text style={[
                    styles.dialKeyText,
                    k.t === 'del' && { color: '#e74c3c', fontSize: 20 },
                    k.t === 'go' && { color: '#2ecc71', fontSize: 14 },
                  ]}>{k.v}</Text>
                  {k.s ? <Text style={styles.dialKeySub}>{k.s}</Text> : null}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

      </View>
    </View>
  );
}

function NowPlayingPanel({ channel, visible }: { channel: Channel; visible: boolean }) {
  const program = getCurrentProgram(channel);
  if (!visible) return null;
  return (
    <View style={styles.nowPlayingPanel}>
      <ChannelLogo logo={channel.logo} size={44} />
      <View style={styles.nowPlayingText}>
        <Text style={styles.nowPlayingLabel}>Estás viendo</Text>
        <Text style={styles.nowPlayingTitle} numberOfLines={1}>
          {channel.name}  {program.startTime} – {program.endTime}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Player Screen (Expo Router page)
// ─────────────────────────────────────────────
export default function LivePlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { channels, setChannels, loading: channelsLoading, error: channelsError } = useChannels();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [activeIndex, setActiveIndex] = useState(0);
  const channelInitialized = useRef(false);

  useEffect(() => {
    if (channelInitialized.current) return;
    if (channels.length > 0 && id && id !== 'live') {
      const idx = channels.findIndex(c => c.id === id);
      if (idx >= 0) {
        setActiveIndex(idx);
        channelInitialized.current = true;
      }
    }
  }, [channels, id]);

  const activeChannel: Channel | undefined = channels[activeIndex] ?? channels[0];

  // Stream URL is fetched on demand — never exposed in the public API
  const [streamUrl, setStreamUrl] = useState<string>('');
  useEffect(() => {
    if (!activeChannel || !accessToken) return;
    setStreamUrl(''); // clear while loading
    fetchStreamUrl(activeChannel.id, accessToken).then(url => {
      if (url) setStreamUrl(url);
    });
  }, [activeChannel?.id, accessToken]);

  // Stream slot lifecycle — reserve slot on mount, heartbeat every 30s, release on unmount
  const streamSessionId = useRef<string | null>(null);
  useEffect(() => {
    if (!activeChannel || !accessToken) return;
    let heartbeatInterval: ReturnType<typeof setInterval>;

    openStream(activeChannel.id, accessToken, DEV_DEVICE_ID)
      .then(({ streamId }) => {
        streamSessionId.current = streamId;
        heartbeatInterval = setInterval(() => {
          streamHeartbeat(streamId, accessToken);
        }, 30_000);
      })
      .catch((err: Error & { status?: number }) => {
        if (err.status === 429) {
          router.replace('/(app)/(tabs)/home?streamLimit=1' as any);
        }
      });

    return () => {
      clearInterval(heartbeatInterval);
      if (streamSessionId.current) {
        stopStream(streamSessionId.current, accessToken);
        streamSessionId.current = null;
      }
    };
  }, [activeChannel?.id, accessToken]);

  const [showControls, setShowControls] = useState(true);
  const [showChannelList, setShowChannelList] = useState(false);
  const [showDial, setShowDial] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [dialInput, setDialInput] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1.0);
  
  const playerRef = useRef<any>(null);

  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControlsNow = useCallback(() => {
    if (isLocked) return;
    setShowControls(true);
    Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.timing(controlsOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start(
        () => setShowControls(false),
      );
    }, CONTROLS_HIDE_MS);
  }, [controlsOpacity, isLocked]);

  // When locking: cancel any pending hide and keep controls visible.
  // When unlocking: restart the auto-hide timer.
  useEffect(() => {
    if (isLocked) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setShowControls(true);
      Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      showControlsNow();
    }
  }, [isLocked]);

  useEffect(() => {
    showControlsNow();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  const switchChannel = useCallback((ch: Channel) => {
    const idx = channels.findIndex(c => c.id === ch.id);
    if (idx !== -1) setActiveIndex(idx);
    setShowChannelList(false);
    setShowDial(false);
  }, [channels]);

  const handleDialDigit = (d: string) => {
    if (d === '⌫') setDialInput(prev => prev.slice(0, -1));
    else setDialInput(prev => (prev + d).slice(-3));
  };
  const handleDialGo = () => {
    const ch = channels.find(c => c.number === parseInt(dialInput, 10));
    if (ch) switchChannel(ch);
    setDialInput('');
    setShowDial(false);
  };

  const toggleFullscreen = useCallback(() => {
    if (Platform.OS === 'web') {
      const docFuncs = ['requestFullscreen', 'webkitRequestFullscreen', 'mozRequestFullScreen', 'msRequestFullscreen'] as const;
      const exitFuncs = ['exitFullscreen', 'webkitExitFullscreen', 'mozCancelFullScreen', 'msExitFullscreen'] as const;
      const doc = document as any;
      const el = playerRef.current || (document.documentElement as any);

      if (!isFullscreen) {
        for (const func of docFuncs) {
          if (el[func]) {
            el[func]();
            break;
          }
        }
      } else {
        for (const func of exitFuncs) {
          if (doc[func]) {
            doc[func]();
            break;
          }
        }
      }
    }
  }, [isFullscreen]);

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v);
  }, []);

  // Refs so the PanResponder (created once) always sees the latest values
  const channelsRef = useRef(channels);
  useEffect(() => { channelsRef.current = channels; }, [channels]);
  const showControlsNowRef = useRef(showControlsNow);
  useEffect(() => { showControlsNowRef.current = showControlsNow; }, [showControlsNow]);
  const isLockedRef = useRef(isLocked);
  useEffect(() => { isLockedRef.current = isLocked; }, [isLocked]);
  const swipedRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { swipedRef.current = false; },
      // Switch channel as soon as dx crosses threshold — don't wait for finger lift
      onPanResponderMove: (_, gestureState) => {
        if (isLockedRef.current) return;
        if (!swipedRef.current && Math.abs(gestureState.dx) > 40) {
          swipedRef.current = true;
          const len = channelsRef.current.length;
          if (len > 0) {
            setActiveIndex(prev =>
              gestureState.dx < 0 ? (prev + 1) % len : (prev - 1 + len) % len
            );
            showControlsNowRef.current();
          }
        }
      },
      onPanResponderRelease: () => {
        if (!swipedRef.current && !isLockedRef.current) showControlsNowRef.current();
        swipedRef.current = false;
      },
    })
  ).current;

  useEffect(() => {
    if (Platform.OS === 'web') {
      const onFullscreenChange = () => {
        const doc = document as any;
        const isFS = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
        setIsFullscreen(isFS);
      };
      
      const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
      events.forEach(e => document.addEventListener(e, onFullscreenChange));
      return () => events.forEach(e => document.removeEventListener(e, onFullscreenChange));
    }
  }, []);

  if (channelsLoading) {
    return (
      <View style={[styles.player, { alignItems: 'center', justifyContent: 'center' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar hidden />
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>▶ LUKI PLAY</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8 }}>Cargando canales…</Text>
      </View>
    );
  }

  if (!activeChannel) {
    return (
      <View style={[styles.player, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar hidden />
        <Text style={{ color: '#f43f5e', fontSize: 16, fontWeight: '800', textAlign: 'center' }}>No hay canales disponibles</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 10, textAlign: 'center' }}>
          {channelsError ?? 'Agrega un canal en el CMS (/cms/canales)'}
        </Text>
        <TouchableOpacity
          style={{ marginTop: 24, backgroundColor: '#FFB800', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 }}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}
        >
          <Text style={{ color: '#000', fontWeight: '800' }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.player} ref={playerRef}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden />

      <View 
        style={StyleSheet.absoluteFill} 
        {...panResponder.panHandlers}
      >
        <HlsVideoPlayer src={streamUrl} volume={volume} />
      </View>

      {dialInput !== '' && (
        <View style={styles.channelToast}>
          <Text style={styles.channelToastText}>{dialInput}</Text>
        </View>
      )}

      {/* Improvement 5: NowPlayingPanel hidden when EPG bar is visible in overlay */}
      <NowPlayingPanel channel={activeChannel} visible={showNowPlaying && !showChannelList} />

      {/* TopBar always rendered when locked so the user can unlock */}
      {(showControls || isLocked) && (
        <TopBar isLocked={isLocked} onLock={() => setIsLocked(l => !l)} opacity={controlsOpacity} onBack={() => router.canGoBack() ? router.back() : router.replace('/home')} />
      )}

      {/* Improvements 4 & 6: hide fragmented bottom panels when channel list overlay is open */}
      {showControls && !isLocked && !showChannelList && (
        <>
          <BottomInfoBar
            channel={activeChannel}
            isFavorite={activeChannel.isFavorite}
            opacity={controlsOpacity}
            onFavorite={() => {
              if (accessToken) {
                toggleFavorite(activeChannel.id, !activeChannel.isFavorite, accessToken, DEV_DEVICE_ID);
              } else {
                setChannels(channels.map((c, i) => i === activeIndex ? { ...c, isFavorite: !c.isFavorite } : c));
              }
            }}
            onFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
            onVolumeChange={handleVolumeChange}
            volume={volume}
          />
          <LiveProgressBar channel={activeChannel} opacity={controlsOpacity} />
        </>
      )}

      {showChannelList && (
        <ChannelListOverlay
          channels={channels}
          activeId={activeChannel.id}
          onSelect={switchChannel}
          onClose={() => setShowChannelList(false)}
          onFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          onVolumeChange={handleVolumeChange}
          volume={volume}
        />
      )}

      {showDial && (
        <ChannelDialOverlay
          onDigit={handleDialDigit}
          onClose={() => { setShowDial(false); setDialInput(''); }}
          onGo={handleDialGo}
          dialInput={dialInput}
          channels={channels}
        />
      )}

      {!showChannelList && !showDial && (
        <View style={styles.fabRow}>
          <TouchableOpacity style={styles.fab} onPress={() => { showControlsNow(); setShowNowPlaying(v => !v); }}>
            <Text style={styles.fabText}>ℹ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fab} onPress={() => { showControlsNow(); setShowChannelList(true); }}>
            <Text style={styles.fabText}>≡</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fab} onPress={() => { showControlsNow(); setShowDial(true); }}>
            <Text style={styles.fabText}>#</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const S = {
  accent: '#17D1C6',
  gold: '#FFB800',
  muted: '#B07CC6',
  card: 'rgba(36, 0, 70, 0.92)',
};

const styles = StyleSheet.create({
  player: { flex: 1, backgroundColor: '#000' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 48 : 16, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 8 },
  bottomInfoBar: {
    position: 'absolute', left: 0, right: 0, bottom: 56,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  channelTag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, gap: 6,
  },
  channelLogo: { fontSize: 18 },
  channelName: { color: '#fff', fontWeight: '700', fontSize: 13 },
  infoCenter: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  infoRight: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  programName: { color: '#fff', fontSize: 14, fontWeight: '600', flexShrink: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: S.accent },
  progressSection: {
    position: 'absolute', bottom: 4, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, gap: 8, height: 48,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  timeLabel: { color: S.muted, fontSize: 11, minWidth: 36, textAlign: 'center' },
  progressTrack: {
    flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2, overflow: 'visible',
  },
  progressFill: { height: 4, backgroundColor: S.accent, borderRadius: 2 },
  progressThumb: {
    position: 'absolute', top: -6, width: 14, height: 14,
    borderRadius: 7, backgroundColor: S.accent,
    marginLeft: -7, shadowColor: S.accent, shadowRadius: 4, shadowOpacity: 0.8, elevation: 4,
  } as never,
  overlayContainer: { ...StyleSheet.absoluteFillObject, zIndex: 50 },
  overlayScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,3,18,0.72)' },
  overlayBackdrop: { flex: 1 },
  channelRail: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 260, backgroundColor: 'rgba(20,6,46,0.98)',
    paddingBottom: 80,
  },
  railClose: { position: 'absolute', top: 12, right: 10, zIndex: 2, padding: 8 },
  railItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginHorizontal: 6,
  },
  railItemActive: { backgroundColor: 'rgba(255,184,0,0.15)', borderWidth: 1, borderColor: S.gold },
  railItemText: { flex: 1 },
  railName: { color: '#fff', fontSize: 13, fontWeight: '700' },
  railProg: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  railNumber: { color: S.muted, fontSize: 11, width: 16 },
  epgBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: 'rgba(10,4,24,0.97)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  epgInfo: { flex: 1, gap: 3 },
  epgHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  epgLabel: { color: S.muted, fontSize: 10, fontWeight: '600' },
  liveBadge: { backgroundColor: '#E53935', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  liveBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  epgChannelName: { color: '#fff', fontSize: 15, fontWeight: '800' },
  epgTitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  epgTime: { color: S.muted, fontSize: 11 },
  epgProgress: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden', marginTop: 4,
  },
  epgProgressFill: { height: '100%' as any, backgroundColor: S.accent, borderRadius: 2 },
  epgControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dialOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 50,
    backgroundColor: 'rgba(5,3,18,0.78)',
    alignItems: 'center', justifyContent: 'center',
  },
  dialPanel: {
    backgroundColor: 'rgba(14,6,32,0.97)',
    borderRadius: 20, padding: 20,
    alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 240,
  },
  dialPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    padding: 12, width: '100%',
  },
  dialPreviewEmpty: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dialPreviewHint: { color: 'rgba(255,255,255,0.3)', fontSize: 12, flex: 1 },
  dialPreviewNum: { color: S.muted, fontSize: 10, fontWeight: '600' },
  dialPreviewName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  dialPreviewProg: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  dialDisplay: { flexDirection: 'row', gap: 8 },
  dialSlot: {
    width: 54, height: 62, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  dialSlotFilled: { backgroundColor: 'rgba(23,209,198,0.12)', borderColor: S.accent },
  dialSlotCursor: { borderColor: 'rgba(255,255,255,0.4)' },
  dialSlotText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  dialTimeoutTrack: {
    width: '100%', height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1,
  },
  dialTimeoutFill: { height: '100%' as any, backgroundColor: S.accent, borderRadius: 1 },
  dialTimeoutHint: { color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: -6 },
  dialGrid: { gap: 8 },
  dialKey: {
    width: 64, height: 54, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    gap: 2,
  },
  dialKeyDel: { backgroundColor: 'rgba(231,76,60,0.2)', borderColor: 'rgba(231,76,60,0.45)' },
  dialKeyGo: { backgroundColor: 'rgba(39,174,96,0.2)', borderColor: 'rgba(39,174,96,0.45)' },
  dialKeyText: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 24 },
  dialKeySub: { color: 'rgba(255,255,255,0.35)', fontSize: 7, fontWeight: '700', letterSpacing: 1 },
  nowPlayingPanel: {
    position: 'absolute', left: 20, bottom: 80,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(10,4,24,0.82)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', zIndex: 40,
    maxWidth: 300,
  },
  nowPlayingText: { flex: 1 },
  nowPlayingLabel: { color: S.muted, fontSize: 10, fontWeight: '600', marginBottom: 3 },
  nowPlayingTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  nowPlayingTime: { color: S.muted, fontSize: 13, marginBottom: 14 },
  nowPlayingThumb: {
    width: '100%', height: 90, borderRadius: 12,
    backgroundColor: 'rgba(50,50,50,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  channelToast: {
    position: 'absolute', top: '40%', alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  channelToastText: { color: '#fff', fontSize: 52, fontWeight: '900' },
  fabRow: { position: 'absolute', right: 14, top: '45%', gap: 10, alignItems: 'center' },
  fab: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  fabText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
