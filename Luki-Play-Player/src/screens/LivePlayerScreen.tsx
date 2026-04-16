'use client';
import React, {
  useState, useRef, useEffect, useCallback,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  FlatList, Animated, Dimensions, StatusBar, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Channel } from '../data/channels';
import { useChannels, getCurrentProgram, getProgressPercent } from '../hooks/useChannels';
import { HlsVideoPlayer } from '../components/HlsVideoPlayer';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const CONTROLS_HIDE_MS = 6000;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function Icon({ name, size = 20, color = '#fff' }: { name: string; size?: number; color?: string }) {
  const icons: Record<string, string> = {
    menu: '☰', cast: '📡', airplay: '⊡', lock: '🔒', unlock: '🔓',
    grid: '⠿', settings: '⚙️', heart: '♥', heartFill: '♥', pip: '⧉',
    back10: '↺', channelList: '≡', close: '✕', play: '▶', pause: '⏸',
    number: '#', arrow: '→', fire: '🔥', check: '✓', fullscreen: '⛶',
  };
  return <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>{icons[name] ?? name}</Text>;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

/** Top-bar with menu, cast, lock, settings */
function TopBar({
  isLocked, onLock, opacity,
}: { isLocked: boolean; onLock: () => void; opacity: Animated.Value }) {
  return (
    <Animated.View style={[styles.topBar, { opacity }]}>
      <TouchableOpacity style={styles.iconBtn}>
        <Icon name="menu" size={22} />
      </TouchableOpacity>
      <View style={styles.topRight}>
        <TouchableOpacity style={styles.iconBtn}>
          <Icon name="cast" size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <Icon name="airplay" size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onLock}>
          <Icon name={isLocked ? 'lock' : 'unlock'} size={19} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <Icon name="grid" size={18} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <Icon name="settings" size={20} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

/** Bottom info bar: channel logo, program name, PiP */
function BottomInfoBar({
  channel, isFavorite, opacity, onFavorite,
}: {
  channel: Channel; isFavorite: boolean; opacity: Animated.Value;
  onFavorite: () => void;
}) {
  const program = getCurrentProgram(channel);
  return (
    <Animated.View style={[styles.bottomInfoBar, { opacity }]}>
      {/* Left: favorite + channel */}
      <View style={styles.infoLeft}>
        <TouchableOpacity onPress={onFavorite} style={styles.iconBtn}>
          <Icon name="heartFill" size={20} color={isFavorite ? '#E53935' : 'rgba(255,255,255,0.5)'} />
        </TouchableOpacity>
        <View style={styles.channelTag}>
          <Text style={styles.channelLogo}>{channel.logo}</Text>
          <Text style={styles.channelName}>{channel.name}</Text>
        </View>
      </View>

      {/* Center: program name */}
      <View style={styles.infoCenter}>
        <Text style={styles.programName} numberOfLines={1}>{program.title}</Text>
        <View style={styles.liveDot} />
      </View>

      {/* Right: PiP */}
      <TouchableOpacity style={styles.iconBtn}>
        <Icon name="pip" size={20} />
      </TouchableOpacity>
    </Animated.View>
  );
}

/** Red progress bar showing live position */
function LiveProgressBar({
  channel, opacity,
}: { channel: Channel; opacity: Animated.Value }) {
  const program = getCurrentProgram(channel);
  const progress = getProgressPercent(program);
  const [pct, setPct] = useState(progress);

  useEffect(() => {
    setPct(getProgressPercent(getCurrentProgram(channel)));
    const t = setInterval(() => setPct(getProgressPercent(getCurrentProgram(channel))), 30000);
    return () => clearInterval(t);
  }, [channel]);

  return (
    <Animated.View style={[styles.progressSection, { opacity }]}>
      <TouchableOpacity style={styles.iconBtn}>
        <Icon name="back10" size={22} />
      </TouchableOpacity>
      <Text style={styles.timeLabel}>{program.startTime}</Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
        <View style={[styles.progressThumb, { left: `${pct}%` as unknown as number }]} />
      </View>

      <Text style={styles.timeLabel}>{program.endTime}</Text>
      <TouchableOpacity style={styles.iconBtn}>
        <Icon name="channelList" size={20} />
      </TouchableOpacity>
    </Animated.View>
  );
}

/** Channel list sidebar (Zapping style) */
function ChannelListOverlay({
  channels, activeId, onSelect, onClose,
}: {
  channels: Channel[]; activeId: string;
  onSelect: (ch: Channel) => void; onClose: () => void;
}) {
  const current = channels.find(c => c.id === activeId)!;
  const program = getCurrentProgram(current);
  const [hoveredId, setHoveredId] = useState(activeId);
  const hovered = channels.find(c => c.id === hoveredId)!;
  const hoveredProgram = getCurrentProgram(hovered);

  return (
    <View style={styles.overlayContainer}>
      {/* Dimmed backdrop */}
      <TouchableOpacity style={styles.overlayBackdrop} onPress={onClose} />

      {/* Left channel rail */}
      <View style={styles.channelRail}>
        <TouchableOpacity style={styles.railClose} onPress={onClose}>
          <Icon name="close" size={18} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <Icon name="grid" size={20} />
        </TouchableOpacity>
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

      {/* Center: program card */}
      <View style={styles.programCard}>
        <View style={styles.programThumb}>
          <Text style={{ fontSize: 48 }}>{hovered.logo}</Text>
          <View style={styles.thumbPlayBtn}>
            <Icon name="play" size={24} />
          </View>
          <View style={styles.nowBadge}><Text style={styles.nowBadgeText}>AHORA</Text></View>
        </View>
        <View style={[styles.programThumb, { marginTop: 8, opacity: 0.6 }]}>
          <Text style={{ fontSize: 32 }}>{hovered.logo}</Text>
        </View>
      </View>

      {/* Right: info */}
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

/** Numeric channel-jump keypad */
function ChannelDialOverlay({
  onDigit, onClose, onGo,
}: { onDigit: (d: string) => void; onClose: () => void; onGo: () => void }) {
  return (
    <View style={styles.dialOverlay}>
      <TouchableOpacity style={styles.overlayBackdrop} onPress={onClose} />
      <View style={styles.dialGrid}>
        {['1','2','3','4','5','6','7','8','9','✕','0','→'].map((k) => (
          <TouchableOpacity
            key={k}
            style={styles.dialKey}
            onPress={() => {
              if (k === '✕') onClose();
              else if (k === '→') onGo();
              else onDigit(k);
            }}
          >
            <Text style={styles.dialKeyText}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/** "Now Playing" panel (top-right info card) */
function NowPlayingPanel({
  channel, visible,
}: { channel: Channel; visible: boolean }) {
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
// Main Player Screen
// ─────────────────────────────────────────────
export const LivePlayerScreen: React.FC<{ initialIndex?: number }> = ({ initialIndex = 0 }) => {
  const insets = useSafeAreaInsets();

  // Channel state — shared singleton (already loaded by HomeScreen)
  const { channels, setChannels, loading: channelsLoading, error: channelsError } = useChannels();
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // Safe channel access
  const activeChannel: Channel | undefined = channels[activeIndex] ?? channels[0];

  // UI overlays
  const [showControls, setShowControls] = useState(true);
  const [showChannelList, setShowChannelList] = useState(false);
  const [showDial, setShowDial] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [dialInput, setDialInput] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  // Animation
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Loading state (only visible on very first render before singleton resolves)
  if (channelsLoading) {
    return (
      <View style={[styles.player, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#FFB800', fontSize: 18, fontWeight: '800' }}>▶ LUKI PLAY</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8 }}>Cargando canales…</Text>
      </View>
    );
  }

  // Show error if no channels could be loaded
  if (!activeChannel) {
    return (
      <View style={[styles.player, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <Text style={{ color: '#f43f5e', fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
          No hay canales disponibles
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 10, textAlign: 'center' }}>
          {channelsError ?? 'Agrega un canal en el CMS (localhost:3001/canales)'}
        </Text>
      </View>
    );
  }

  // Switch channel — HlsVideoPlayer reacts to src prop change automatically
  const switchChannel = useCallback((ch: Channel) => {
    const idx = channels.findIndex(c => c.id === ch.id);
    if (idx !== -1) setActiveIndex(idx);
    setShowChannelList(false);
    setShowDial(false);
  }, [channels]);

  // Controls auto-hide
  const showControlsNow = useCallback(() => {
    if (isLocked) return;
    setShowControls(true);
    Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.timing(controlsOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => setShowControls(false));
    }, CONTROLS_HIDE_MS);
  }, [controlsOpacity, isLocked]);

  useEffect(() => { showControlsNow(); return () => { if (hideTimer.current) clearTimeout(hideTimer.current); }; }, []);

  // Toggle favorite
  const toggleFavorite = () => {
    setChannels(channels.map((c, i) => i === activeIndex ? { ...c, isFavorite: !c.isFavorite } : c));
  };

  // Dial
  const handleDialDigit = (d: string) => {
    const next = (dialInput + d).slice(-2);
    setDialInput(next);
  };
  const handleDialGo = () => {
    const num = parseInt(dialInput, 10);
    const ch = channels.find(c => c.number === num);
    if (ch) switchChannel(ch);
    setDialInput('');
    setShowDial(false);
  };

  return (
    <View style={styles.player}>
      <StatusBar hidden />

      {/* VIDEO — HLS.js on web, expo-video on native */}
      <Pressable style={StyleSheet.absoluteFill} onPress={showControlsNow}>
        <HlsVideoPlayer src={activeChannel.streamUrl} />
      </Pressable>

      {/* Channel number toast (dial input) */}
      {dialInput !== '' && (
        <View style={styles.channelToast}>
          <Text style={styles.channelToastText}>{dialInput}</Text>
        </View>
      )}

      {/* NOW PLAYING PANEL */}
      <NowPlayingPanel channel={activeChannel} visible={showNowPlaying} />

      {/* CONTROLS (auto-hide) */}
      {showControls && (
        <>
          <TopBar
            isLocked={isLocked}
            onLock={() => setIsLocked(l => !l)}
            opacity={controlsOpacity}
          />

          <BottomInfoBar
            channel={activeChannel}
            isFavorite={activeChannel.isFavorite}
            opacity={controlsOpacity}
            onFavorite={toggleFavorite}
          />

          <LiveProgressBar channel={activeChannel} opacity={controlsOpacity} />
        </>
      )}

      {/* CHANNEL LIST OVERLAY */}
      {showChannelList && (
        <ChannelListOverlay
          channels={channels}
          activeId={activeChannel.id}
          onSelect={switchChannel}
          onClose={() => setShowChannelList(false)}
        />
      )}

      {/* DIAL OVERLAY */}
      {showDial && (
        <ChannelDialOverlay
          onDigit={handleDialDigit}
          onClose={() => { setShowDial(false); setDialInput(''); }}
          onGo={handleDialGo}
        />
      )}

      {/* FAB: siempre visibles para poder recuperar los controles */}
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
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const S = {
  darkBg: 'rgba(0,0,0,0.75)',
  accent: '#E53935',   // live red
  gold: '#FFB800',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.55)',
  card: 'rgba(30,10,60,0.92)',
};

const styles = StyleSheet.create({
  player: {
    flex: 1, backgroundColor: '#000',
  },

  // ── Top bar ──
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 48 : 16, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 8 },

  // ── Bottom info ──
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

  // ── Progress bar ──
  progressSection: {
    position: 'absolute', bottom: 4, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, gap: 8, height: 48,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  timeLabel: { color: S.muted, fontSize: 11, minWidth: 36, textAlign: 'center' },
  progressTrack: {
    flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2, position: 'relative', overflow: 'visible',
  },
  progressFill: { height: 4, backgroundColor: S.accent, borderRadius: 2 },
  progressThumb: {
    position: 'absolute', top: -6, width: 14, height: 14,
    borderRadius: 7, backgroundColor: S.accent,
    marginLeft: -7, shadowColor: S.accent, shadowRadius: 4, shadowOpacity: 0.8,
    elevation: 4,
  } as never,

  // ── Channel list overlay ──
  overlayContainer: {
    ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 50,
  },
  overlayBackdrop: { flex: 1 },
  channelRail: {
    width: 110, backgroundColor: 'rgba(0,0,0,0.88)',
    paddingTop: 40, paddingHorizontal: 4, paddingBottom: 16,
    alignItems: 'center', gap: 8,
  },
  railClose: { position: 'absolute', top: 12, right: 10 },
  railItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10,
    width: '100%',
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
    overflow: 'hidden', position: 'relative',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  thumbPlayBtn: {
    position: 'absolute',
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  nowBadge: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: S.gold, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  nowBadgeText: { color: '#000', fontSize: 9, fontWeight: '800' },
  programInfo: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 20, justifyContent: 'center',
  },
  programInfoTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  programInfoTime: { color: S.muted, fontSize: 14, marginBottom: 10 },
  programInfoDesc: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 20 },

  // ── Dial overlay ──
  dialOverlay: {
    ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 50,
  },
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

  // ── Now Playing Panel ──
  nowPlayingPanel: {
    position: 'absolute', right: 16, top: 80,
    width: 220, backgroundColor: S.card,
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,184,0,0.25)',
    zIndex: 40,
  },
  nowPlayingLabel: { color: S.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  nowPlayingTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  nowPlayingTime: { color: S.muted, fontSize: 13, marginBottom: 14 },
  nowPlayingThumb: {
    width: '100%', height: 90, borderRadius: 12,
    backgroundColor: 'rgba(80,30,120,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Channel toast ──
  channelToast: {
    position: 'absolute', top: '40%', alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  channelToastText: { color: '#fff', fontSize: 52, fontWeight: '900' },

  // ── FAB row ──
  fabRow: {
    position: 'absolute', right: 14, top: '45%',
    gap: 10, alignItems: 'center',
  },
  fab: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  fabText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
