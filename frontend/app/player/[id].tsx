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
  FlatList, Animated, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChannels, getCurrentProgram, getProgressPercent } from '../../services/useChannels';
import { HlsVideoPlayer } from '../../components/HlsVideoPlayer';
import type { Channel } from '../../services/channelTypes';

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
    back: '←',
  };
  return <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>{icons[name] ?? name}</Text>;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function TopBar({
  isLocked, onLock, opacity, onBack,
}: { isLocked: boolean; onLock: () => void; opacity: Animated.Value; onBack: () => void }) {
  return (
    <Animated.View style={[styles.topBar, { opacity }]}>
      <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
        <Icon name="back" size={22} />
      </TouchableOpacity>
      <View style={styles.topRight}>
        <TouchableOpacity style={styles.iconBtn}><Icon name="cast" size={20} /></TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}><Icon name="airplay" size={20} /></TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onLock}>
          <Icon name={isLocked ? 'lock' : 'unlock'} size={19} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}><Icon name="grid" size={18} /></TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}><Icon name="settings" size={20} /></TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function BottomInfoBar({
  channel, isFavorite, opacity, onFavorite,
}: { channel: Channel; isFavorite: boolean; opacity: Animated.Value; onFavorite: () => void }) {
  const program = getCurrentProgram(channel);
  return (
    <Animated.View style={[styles.bottomInfoBar, { opacity }]}>
      <View style={styles.infoLeft}>
        <TouchableOpacity onPress={onFavorite} style={styles.iconBtn}>
          <Icon name="heartFill" size={20} color={isFavorite ? '#E53935' : 'rgba(255,255,255,0.5)'} />
        </TouchableOpacity>
        <View style={styles.channelTag}>
          <Text style={styles.channelLogo}>{channel.logo}</Text>
          <Text style={styles.channelName}>{channel.name}</Text>
        </View>
      </View>
      <View style={styles.infoCenter}>
        <Text style={styles.programName} numberOfLines={1}>{program.title}</Text>
        <View style={styles.liveDot} />
      </View>
      <TouchableOpacity style={styles.iconBtn}><Icon name="pip" size={20} /></TouchableOpacity>
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
      <TouchableOpacity style={styles.iconBtn}><Icon name="back10" size={22} /></TouchableOpacity>
      <Text style={styles.timeLabel}>{program.startTime}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
        <View style={[styles.progressThumb, { left: `${pct}%` as unknown as number }]} />
      </View>
      <Text style={styles.timeLabel}>{program.endTime}</Text>
      <TouchableOpacity style={styles.iconBtn}><Icon name="channelList" size={20} /></TouchableOpacity>
    </Animated.View>
  );
}

function ChannelListOverlay({
  channels, activeId, onSelect, onClose,
}: { channels: Channel[]; activeId: string; onSelect: (ch: Channel) => void; onClose: () => void }) {
  const [hoveredId, setHoveredId] = useState(activeId);
  const hovered = channels.find(c => c.id === hoveredId) ?? channels[0]!;
  const hoveredProgram = getCurrentProgram(hovered);
  return (
    <View style={styles.overlayContainer}>
      <TouchableOpacity style={styles.overlayBackdrop} onPress={onClose} />
      <View style={styles.channelRail}>
        <TouchableOpacity style={styles.railClose} onPress={onClose}>
          <Icon name="close" size={18} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}><Icon name="grid" size={20} /></TouchableOpacity>
        <Icon name="heartFill" size={20} color="#E53935" />
        <Icon name="fire" size={20} />
        <FlatList
          data={channels}
          keyExtractor={c => c.id}
          style={{ flex: 1, marginTop: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { setHoveredId(item.id); onSelect(item); }}
              style={[styles.railItem, item.id === hoveredId && styles.railItemActive]}
            >
              <Text style={styles.railNumber}>{item.number}</Text>
              <Text style={styles.railLogo}>{item.logo}</Text>
              <Text style={styles.railNameSmall} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <View style={styles.programCard}>
        <View style={styles.programThumb}>
          <Text style={{ fontSize: 48 }}>{hovered.logo}</Text>
          <View style={styles.thumbPlayBtn}><Icon name="play" size={24} /></View>
          <View style={styles.nowBadge}><Text style={styles.nowBadgeText}>AHORA</Text></View>
        </View>
        <View style={[styles.programThumb, { marginTop: 8, opacity: 0.6 }]}>
          <Text style={{ fontSize: 32 }}>{hovered.logo}</Text>
        </View>
      </View>
      <View style={styles.programInfo}>
        <Text style={styles.programInfoTitle} numberOfLines={2}>{hoveredProgram.title}</Text>
        <Text style={styles.programInfoTime}>{hoveredProgram.startTime} – {hoveredProgram.endTime}</Text>
        {hoveredProgram.description && (
          <Text style={styles.programInfoDesc} numberOfLines={3}>{hoveredProgram.description}</Text>
        )}
      </View>
    </View>
  );
}

function ChannelDialOverlay({
  onDigit, onClose, onGo,
}: { onDigit: (d: string) => void; onClose: () => void; onGo: () => void }) {
  return (
    <View style={styles.dialOverlay}>
      <TouchableOpacity style={styles.overlayBackdrop} onPress={onClose} />
      <View style={styles.dialGrid}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '✕', '0', '→'].map((k) => (
          <TouchableOpacity key={k} style={styles.dialKey} onPress={() => {
            if (k === '✕') onClose();
            else if (k === '→') onGo();
            else onDigit(k);
          }}>
            <Text style={styles.dialKeyText}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function NowPlayingPanel({ channel, visible }: { channel: Channel; visible: boolean }) {
  const program = getCurrentProgram(channel);
  if (!visible) return null;
  return (
    <View style={styles.nowPlayingPanel}>
      <Text style={styles.nowPlayingLabel}>ESTÁS VIENDO</Text>
      <Text style={styles.nowPlayingTitle}>{program.title}</Text>
      <Text style={styles.nowPlayingTime}>{program.startTime} a {program.endTime} hrs.</Text>
      <View style={styles.nowPlayingThumb}>
        <Text style={{ fontSize: 48 }}>{channel.logo}</Text>
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
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (channels.length > 0 && id && id !== 'live') {
      const idx = channels.findIndex(c => c.id === id);
      if (idx >= 0) setActiveIndex(idx);
    }
  }, [channels, id]);

  const activeChannel: Channel | undefined = channels[activeIndex] ?? channels[0];

  const [showControls, setShowControls] = useState(true);
  const [showChannelList, setShowChannelList] = useState(false);
  const [showDial, setShowDial] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [dialInput, setDialInput] = useState('');
  const [isLocked, setIsLocked] = useState(false);

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

  const handleDialDigit = (d: string) => setDialInput(prev => (prev + d).slice(-2));
  const handleDialGo = () => {
    const ch = channels.find(c => c.number === parseInt(dialInput, 10));
    if (ch) switchChannel(ch);
    setDialInput('');
    setShowDial(false);
  };

  if (channelsLoading) {
    return (
      <View style={[styles.player, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar hidden />
        <Text style={{ color: '#FFB800', fontSize: 18, fontWeight: '800' }}>▶ LUKI PLAY</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8 }}>Cargando canales…</Text>
      </View>
    );
  }

  if (!activeChannel) {
    return (
      <View style={[styles.player, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <StatusBar hidden />
        <Text style={{ color: '#f43f5e', fontSize: 16, fontWeight: '800', textAlign: 'center' }}>No hay canales disponibles</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 10, textAlign: 'center' }}>
          {channelsError ?? 'Agrega un canal en el CMS (/cms/canales)'}
        </Text>
        <TouchableOpacity
          style={{ marginTop: 24, backgroundColor: '#FFB800', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#000', fontWeight: '700' }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.player}>
      <StatusBar hidden />

      <Pressable style={StyleSheet.absoluteFill} onPress={showControlsNow}>
        <HlsVideoPlayer src={activeChannel.streamUrl} />
      </Pressable>

      {dialInput !== '' && (
        <View style={styles.channelToast}>
          <Text style={styles.channelToastText}>{dialInput}</Text>
        </View>
      )}

      <NowPlayingPanel channel={activeChannel} visible={showNowPlaying} />

      {showControls && (
        <>
          <TopBar isLocked={isLocked} onLock={() => setIsLocked(l => !l)} opacity={controlsOpacity} onBack={() => router.back()} />
          <BottomInfoBar channel={activeChannel} isFavorite={activeChannel.isFavorite} opacity={controlsOpacity} onFavorite={() => setChannels(channels.map((c, i) => i === activeIndex ? { ...c, isFavorite: !c.isFavorite } : c))} />
          <LiveProgressBar channel={activeChannel} opacity={controlsOpacity} />
        </>
      )}

      {showChannelList && (
        <ChannelListOverlay
          channels={channels}
          activeId={activeChannel.id}
          onSelect={switchChannel}
          onClose={() => setShowChannelList(false)}
        />
      )}

      {showDial && (
        <ChannelDialOverlay
          onDigit={handleDialDigit}
          onClose={() => { setShowDial(false); setDialInput(''); }}
          onGo={handleDialGo}
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
  accent: '#E53935',
  gold: '#FFB800',
  muted: 'rgba(255,255,255,0.55)',
  card: 'rgba(30,10,60,0.92)',
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
  overlayContainer: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 50 },
  overlayBackdrop: { flex: 1 },
  channelRail: {
    width: 110, backgroundColor: 'rgba(0,0,0,0.88)',
    paddingTop: 40, paddingHorizontal: 4, paddingBottom: 16,
    alignItems: 'center', gap: 8,
  },
  railClose: { position: 'absolute', top: 12, right: 10 },
  railItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, width: '100%',
  },
  railItemActive: { backgroundColor: 'rgba(255,184,0,0.18)', borderWidth: 1, borderColor: S.gold },
  railNumber: { color: S.muted, fontSize: 11, width: 16 },
  railLogo: { fontSize: 16 },
  railNameSmall: { color: '#fff', fontSize: 10, flex: 1 },
  programCard: {
    width: 190, backgroundColor: 'rgba(0,0,0,0.72)',
    padding: 16, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  programThumb: {
    width: 160, height: 90, borderRadius: 14,
    backgroundColor: 'rgba(80,30,120,0.6)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  thumbPlayBtn: {
    position: 'absolute', width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  nowBadge: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: S.gold, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  nowBadgeText: { color: '#000', fontSize: 9, fontWeight: '800' },
  programInfo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', padding: 20, justifyContent: 'center' },
  programInfoTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  programInfoTime: { color: S.muted, fontSize: 14, marginBottom: 10 },
  programInfoDesc: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 20 },
  dialOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 50 },
  dialGrid: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: '50%', flexDirection: 'row', flexWrap: 'wrap',
    alignContent: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dialKey: {
    width: 64, height: 64, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dialKeyText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  nowPlayingPanel: {
    position: 'absolute', right: 16, top: 80,
    width: 220, backgroundColor: S.card,
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,184,0,0.25)', zIndex: 40,
  },
  nowPlayingLabel: { color: S.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  nowPlayingTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  nowPlayingTime: { color: S.muted, fontSize: 13, marginBottom: 14 },
  nowPlayingThumb: {
    width: '100%', height: 90, borderRadius: 12,
    backgroundColor: 'rgba(80,30,120,0.6)',
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
