import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { useChannelStore } from '../../services/channelStore';
import { useCategoriasStore } from '../../services/categoriasStore';
import { ResizeMode, Video } from 'expo-av';
import type { AdminCanal } from '../../services/api/adminApi';
import { resolveLogoUrl } from '../../services/api/config';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell from '../../components/cms/CmsShell';
import { useTheme } from '../../hooks/useTheme';

type PlaybackState = 'idle' | 'playing' | 'error';
type MonitorViewMode = 'mosaico' | 'videowall';
type GridSize = '2x2' | '3x3' | '4x4';

const CHANNELS_PER_PAGE = 16;
const AUTO_ROTATE_MS = 8000;

// ─── Videowall status config ──────────────────────────────────
const VW_STATUS: Record<AdminCanal['status'], { label: string; color: string; bg: string }> = {
  ACTIVE:      { label: 'Activo',       color: '#17D1C6', bg: 'rgba(23,209,198,0.12)'  },
  SCHEDULED:   { label: 'Programado',   color: '#FF7900', bg: 'rgba(255,121,0,0.12)'   },
  MAINTENANCE: { label: 'Mantenim.',    color: '#FF7900', bg: 'rgba(255,121,0,0.12)'   },
  INACTIVE:    { label: 'Inactivo',     color: '#D1105A', bg: 'rgba(209,16,90,0.14)'   },
};

const GRID_CONFIG: Record<GridSize, { cols: number; rows: number; label: string }> = {
  '2x2': { cols: 2, rows: 2, label: '2×2' },
  '3x3': { cols: 3, rows: 3, label: '3×3' },
  '4x4': { cols: 4, rows: 4, label: '4×4' },
};

function isValidStreamUrl(url: string) {
  try {
    const parsed = new URL(url.trim());
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && !parsed.hostname.includes('example.com');
  } catch {
    return false;
  }
}

function isHlsUrl(url: string) {
  const normalized = url.trim().toLowerCase();
  return normalized.endsWith('.m3u8') || normalized.includes('.m3u8?');
}

function getInitials(nombre: string) {
  return nombre.split(/\s+/).map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase();
}

function getStatusTone(isActive: boolean) {
  return isActive
    ? { label: 'Activo', color: '#4ADE80', background: 'rgba(74,222,128,0.14)', border: 'rgba(74,222,128,0.28)' }
    : { label: 'Inactivo', color: '#FB7185', background: 'rgba(251,113,133,0.14)', border: 'rgba(251,113,133,0.28)' };
}

function getOperationalTone(canal: AdminCanal, playback: PlaybackState) {
  const hasValidUrl = isValidStreamUrl(canal.streamUrl);
  if (canal.status !== 'ACTIVE') {
    return {
      label: 'INACTIVO',
      color: '#FB7185',
      background: 'rgba(251,113,133,0.14)',
      border: 'rgba(251,113,133,0.28)',
      reason: 'Canal desactivado en catálogo',
    };
  }
  if (!hasValidUrl) {
    return {
      label: 'DE BAJA',
      color: '#FB7185',
      background: 'rgba(251,113,133,0.14)',
      border: 'rgba(251,113,133,0.28)',
      reason: 'URL inválida o no operativa',
    };
  }
  if (playback === 'error') {
    return {
      label: 'DE BAJA',
      color: '#FB7185',
      background: 'rgba(251,113,133,0.14)',
      border: 'rgba(251,113,133,0.28)',
      reason: 'Fallo de reproducción detectado',
    };
  }
  return {
    label: 'ACTIVO',
    color: '#4ADE80',
    background: 'rgba(74,222,128,0.14)',
    border: 'rgba(74,222,128,0.28)',
    reason: 'Señal válida para monitoreo',
  };
}

function getSignalLabel(isLive: boolean, protocol: string) {
  return isLive ? 'En vivo' : (protocol || 'Streaming');
}

function WebMonitorPreview({ url, onPlaybackOk, onPlaybackError }: { url: string; onPlaybackOk: () => void; onPlaybackError: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let disposed = false;
    let hls: any = null;

    const markOk = () => { if (!disposed) onPlaybackOk(); };
    const markError = () => { if (!disposed) onPlaybackError(); };

    const handleLoaded = () => markOk();
    const handlePlaying = () => markOk();
    const handleError = () => markError();

    video.addEventListener('loadeddata', handleLoaded);
    video.addEventListener('canplay', handleLoaded);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('error', handleError);

    const setup = async () => {
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.loop = true;

      if (isHlsUrl(url)) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
          video.load();
          video.play().catch(() => {});
          return;
        }

        const Hls = require('hls.js').default;
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true, autoStartLoad: true });
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_event: unknown, data: { fatal?: boolean } | undefined) => {
            if (data?.fatal) markError();
          });
          return;
        }
      }

      video.src = url;
      video.load();
      video.play().catch(() => {});
    };

    setup().catch(() => markError());

    return () => {
      disposed = true;
      video.pause();
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('canplay', handleLoaded);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);
      if (hls) hls.destroy();
    };
  }, [onPlaybackError, onPlaybackOk, url]);

  return (
    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
      {/* @ts-ignore */}
      <video ref={videoRef} muted autoPlay playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', backgroundColor: 'black' }} />
    </View>
  );
}

// ─── VideoWall Component ──────────────────────────────────────
function VideoWall({
  channels,
  categories,
}: {
  channels: AdminCanal[];
  categories: { id: string; nombre: string }[];
}) {
  const { theme } = useTheme();
  const [gridSize, setGridSize] = useState<GridSize>('3x3');
  const [page, setPage] = useState(0);
  const [zoomed, setZoomed] = useState<AdminCanal | null>(null);
  const [zoomedIdx, setZoomedIdx] = useState(0);
  const [wallPlayback, setWallPlayback] = useState<Record<string, PlaybackState>>({});

  const { cols } = GRID_CONFIG[gridSize];
  const perPage = GRID_CONFIG[gridSize].cols * GRID_CONFIG[gridSize].rows;
  const totalPages = Math.max(1, Math.ceil(channels.length / perPage));
  const safePage = Math.min(page, totalPages - 1);
  const pageChannels = channels.slice(safePage * perPage, (safePage + 1) * perPage);
  const cells: (AdminCanal | null)[] = [
    ...pageChannels,
    ...Array(Math.max(0, perPage - pageChannels.length)).fill(null),
  ];

  // Reset playback state when visible cells change
  useEffect(() => {
    setWallPlayback((prev) =>
      Object.fromEntries(
        pageChannels.map((ch) => [ch.id, isValidStreamUrl(ch.streamUrl) ? (prev[ch.id] ?? 'idle') : 'idle']),
      ),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePage, gridSize]);

  function openZoom(ch: AdminCanal, localIdx: number) {
    const globalIdx = safePage * perPage + localIdx;
    setZoomed(ch);
    setZoomedIdx(globalIdx);
  }

  function navigateZoom(dir: 1 | -1) {
    const newIdx = zoomedIdx + dir;
    if (newIdx < 0 || newIdx >= channels.length) return;
    const newPage = Math.floor(newIdx / perPage);
    setPage(newPage);
    setZoomed(channels[newIdx]);
    setZoomedIdx(newIdx);
  }

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (zoomed) {
        if (e.key === 'ArrowRight') navigateZoom(1);
        else if (e.key === 'ArrowLeft') navigateZoom(-1);
        else if (e.key === 'Escape') setZoomed(null);
      } else {
        if (e.key === 'ArrowRight') setPage((p) => Math.min(p + 1, totalPages - 1));
        else if (e.key === 'ArrowLeft') setPage((p) => Math.max(p - 1, 0));
      }
    };
    (window as any).addEventListener('keydown', onKey);
    return () => (window as any).removeEventListener('keydown', onKey);
  }, [totalPages, zoomed, zoomedIdx]);

  const GRID_SIZES: GridSize[] = ['2x2', '3x3', '4x4'];
  const cellFontSize = cols <= 2 ? 11 : cols === 3 ? 9 : 7;
  const cellLogoSize = cols <= 2 ? 28 : cols === 3 ? 18 : 14;

  return (
    <View>
      {/* Controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <FontAwesome name="th" size={11} color={theme.textMuted} />
        <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginRight: 4 }}>Grilla</Text>
        {GRID_SIZES.map((s) => {
          const active = gridSize === s;
          return (
            <TouchableOpacity
              key={s}
              onPress={() => { setGridSize(s); setPage(0); setZoomed(null); }}
              style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: active ? theme.accent : theme.border, backgroundColor: active ? theme.accentSoft : 'transparent' }}
            >
              <Text style={{ color: active ? theme.accent : theme.textMuted, fontSize: 11, fontWeight: '700' }}>
                {GRID_CONFIG[s].label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          disabled={safePage === 0}
          onPress={() => setPage((p) => p - 1)}
          style={{ width: 30, height: 30, borderRadius: 7, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', opacity: safePage === 0 ? 0.3 : 1 }}
        >
          <FontAwesome name="chevron-left" size={11} color={theme.textSec} />
        </TouchableOpacity>
        <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '700', minWidth: 52, textAlign: 'center' }}>
          {safePage + 1} / {totalPages}
        </Text>
        <TouchableOpacity
          disabled={safePage >= totalPages - 1}
          onPress={() => setPage((p) => p + 1)}
          style={{ width: 30, height: 30, borderRadius: 7, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', opacity: safePage >= totalPages - 1 ? 0.3 : 1 }}
        >
          <FontAwesome name="chevron-right" size={11} color={theme.textSec} />
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <View style={{ position: 'relative', backgroundColor: '#020209', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((ch, i) => {
            const cellStyle: any = {
              width: `${(100 / cols).toFixed(4)}%`,
              aspectRatio: 16 / 9,
              borderWidth: 0.5,
              borderColor: 'rgba(255,255,255,0.05)',
              overflow: 'hidden',
              position: 'relative',
            };
            if (!ch) {
              return (
                <View key={`empty-${i}`} style={[cellStyle, { backgroundColor: '#050510', alignItems: 'center', justifyContent: 'center' }]}>
                  <FontAwesome name="television" size={cellLogoSize} color="rgba(255,255,255,0.04)" />
                </View>
              );
            }
            const catName = ch.category?.nombre ?? categories.find((c) => c.id === ch.categoryId)?.nombre ?? '—';
            const statusCfg = VW_STATUS[ch.status];
            const pb = wallPlayback[ch.id] ?? 'idle';
            const canStream = isValidStreamUrl(ch.streamUrl);
            const isPlaying = pb === 'playing';

            return (
              <TouchableOpacity
                key={ch.id}
                onPress={() => openZoom(ch, i)}
                activeOpacity={0.85}
                style={[cellStyle, { backgroundColor: '#07070f' }]}
              >
                {/* Background video stream */}
                {canStream && pb !== 'error' ? (
                  Platform.OS === 'web' ? (
                    <WebMonitorPreview
                      url={ch.streamUrl}
                      onPlaybackOk={() => setWallPlayback((p) => p[ch.id] === 'playing' ? p : { ...p, [ch.id]: 'playing' })}
                      onPlaybackError={() => setWallPlayback((p) => p[ch.id] === 'error' ? p : { ...p, [ch.id]: 'error' })}
                    />
                  ) : (
                    <Video
                      source={{ uri: ch.streamUrl }}
                      resizeMode={ResizeMode.COVER}
                      isMuted
                      shouldPlay
                      isLooping
                      onLoad={() => setWallPlayback((p) => ({ ...p, [ch.id]: 'playing' }))}
                      onError={() => setWallPlayback((p) => ({ ...p, [ch.id]: 'error' }))}
                      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
                    />
                  )
                ) : null}

                {/* Logo — shown while loading or on error/inactive */}
                {(!isPlaying) && (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#07070f' }}>
                    {ch.logoUrl
                      // @ts-ignore – web-only img
                      ? <img src={resolveLogoUrl(ch.logoUrl)} alt={ch.nombre} style={{ maxHeight: '44%', maxWidth: '56%', objectFit: 'contain', opacity: 0.88 }} />
                      : <FontAwesome name="television" size={cellLogoSize} color="rgba(255,255,255,0.07)" />
                    }
                    {canStream && pb === 'idle' && (
                      <View style={{ position: 'absolute', bottom: '30%', alignItems: 'center' }}>
                        <FontAwesome name="circle-o-notch" size={cellLogoSize - 4} color="rgba(255,255,255,0.18)" />
                      </View>
                    )}
                  </View>
                )}

                {/* Bottom gradient */}
                {Platform.OS === 'web' && (
                  // @ts-ignore
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(transparent, rgba(0,0,0,0.88))', pointerEvents: 'none' }} />
                )}

                {/* Channel name bottom */}
                <View style={{ position: 'absolute', bottom: 5, left: 6, right: 6 }}>
                  <Text style={{ color: '#fff', fontSize: cellFontSize, fontWeight: '700' }} numberOfLines={1}>{ch.nombre}</Text>
                </View>

                {/* Top-left: status + category */}
                <View style={{ position: 'absolute', top: 5, left: 5, gap: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: statusCfg.bg, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2 }}>
                    {ch.isLive && ch.status === 'ACTIVE' && (
                      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: statusCfg.color }} />
                    )}
                    <Text style={{ color: statusCfg.color, fontSize: 7, fontWeight: '800', letterSpacing: 0.3 }}>
                      {ch.isLive && ch.status === 'ACTIVE' ? 'EN VIVO' : statusCfg.label.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(176,124,198,0.78)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, alignSelf: 'flex-start' }}>
                    <Text style={{ color: '#fff', fontSize: 7, fontWeight: '800', letterSpacing: 0.2 }} numberOfLines={1}>{catName}</Text>
                  </View>
                </View>

                {/* Top-right: playing indicator */}
                {isPlaying && (
                  <View style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Zoomed overlay */}
        {zoomed && (() => {
          const catName = zoomed.category?.nombre ?? categories.find((c) => c.id === zoomed.categoryId)?.nombre ?? '—';
          const statusCfg = VW_STATUS[zoomed.status];
          const canStream = isValidStreamUrl(zoomed.streamUrl);
          return (
            <Pressable
              onPress={() => setZoomed(null)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 30 }}
            >
              <Pressable
                onPress={(e) => e.stopPropagation?.()}
                style={{ width: '100%', height: '100%', position: 'relative' }}
              >
                {/* Full-size stream */}
                {canStream ? (
                  Platform.OS === 'web' ? (
                    <WebMonitorPreview url={zoomed.streamUrl} onPlaybackOk={() => {}} onPlaybackError={() => {}} />
                  ) : (
                    <Video
                      source={{ uri: zoomed.streamUrl }}
                      resizeMode={ResizeMode.CONTAIN}
                      isMuted={false}
                      shouldPlay
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />
                  )
                ) : (
                  /* No stream — show logo centered */
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#040810' }}>
                    {zoomed.logoUrl
                      // @ts-ignore
                      ? <img src={resolveLogoUrl(zoomed.logoUrl)} alt={zoomed.nombre} style={{ maxHeight: '36%', maxWidth: '48%', objectFit: 'contain', filter: 'drop-shadow(0 8px 32px rgba(176,124,198,0.35))' }} />
                      : <FontAwesome name="television" size={56} color="rgba(255,255,255,0.1)" />
                    }
                  </View>
                )}

                {/* Bottom info bar */}
                {Platform.OS === 'web' && (
                  // @ts-ignore
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(transparent, rgba(0,0,0,0.92))', pointerEvents: 'none' }} />
                )}
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 }}>
                  <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>
                    {zoomed.nombre}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: statusCfg.bg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
                      {zoomed.isLive && zoomed.status === 'ACTIVE' && (
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusCfg.color }} />
                      )}
                      <Text style={{ color: statusCfg.color, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>
                        {zoomed.isLive && zoomed.status === 'ACTIVE' ? 'EN VIVO' : statusCfg.label.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(176,124,198,0.85)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{catName}</Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }} numberOfLines={1}>
                      {zoomed.streamUrl}
                    </Text>
                  </View>
                  {/* Navigation */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, alignItems: 'center' }}>
                    <TouchableOpacity
                      disabled={zoomedIdx === 0}
                      onPress={(e) => { e.stopPropagation?.(); navigateZoom(-1); }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.4)', opacity: zoomedIdx === 0 ? 0.3 : 1 }}
                    >
                      <FontAwesome name="chevron-left" size={11} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Anterior</Text>
                    </TouchableOpacity>
                    <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, minWidth: 60, textAlign: 'center' }}>
                      {zoomedIdx + 1} / {channels.length}
                    </Text>
                    <TouchableOpacity
                      disabled={zoomedIdx >= channels.length - 1}
                      onPress={(e) => { e.stopPropagation?.(); navigateZoom(1); }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.4)', opacity: zoomedIdx >= channels.length - 1 ? 0.3 : 1 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Siguiente</Text>
                      <FontAwesome name="chevron-right" size={11} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Close button */}
                <TouchableOpacity
                  onPress={() => setZoomed(null)}
                  style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <FontAwesome name="times" size={14} color="#fff" />
                </TouchableOpacity>

                {Platform.OS === 'web' && (
                  <Text style={{ position: 'absolute', top: 16, left: '50%', color: 'rgba(255,255,255,0.2)', fontSize: 10, letterSpacing: 0.3 }}>
                    ESC para cerrar · ← → para navegar
                  </Text>
                )}
              </Pressable>
            </Pressable>
          );
        })()}
      </View>

      {Platform.OS === 'web' && !zoomed && (
        <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 8, textAlign: 'center', letterSpacing: 0.3 }}>
          ← → para cambiar página · clic en celda para ampliar
        </Text>
      )}
    </View>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, minWidth: 180, backgroundColor: theme.cardBg, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 38, height: 38, backgroundColor: `${color}22`, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
          <FontAwesome name={icon} size={16} color={color} />
        </View>
        <Text style={{ color: theme.textSec, fontSize: 13, fontWeight: '600' }}>{label}</Text>
      </View>
      <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

function EmptyMonitorTile({ index }: { index: number }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexBasis: '24%', minWidth: 220, minHeight: 170, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.border, backgroundColor: '#0C1422', padding: 16, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 52, height: 52, borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.textSec, fontSize: 12, fontWeight: '800' }}>{String(index + 1).padStart(2, '0')}</Text>
      </View>
      <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>Sin canal asignado</Text>
      <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>Este espacio se llenará cuando agregues más canales al catálogo.</Text>
    </View>
  );
}

function ChannelMonitorTile({ canal, playback, onPlaybackOk, onPlaybackError }: { canal: AdminCanal; playback: PlaybackState; onPlaybackOk: () => void; onPlaybackError: () => void }) {
  const { theme } = useTheme();
  const isActive = canal.status === 'ACTIVE';
  const tone = getStatusTone(isActive);
  const operationalTone = getOperationalTone(canal, playback);
  const shouldRenderVideo = isActive && playback !== 'error' && isValidStreamUrl(canal.streamUrl);
  const showVideoChrome = shouldRenderVideo && playback === 'playing';

  return (
    <View style={{ flexBasis: '24%', minWidth: 220, minHeight: 170, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: playback === 'playing' ? theme.accent : operationalTone.border, backgroundColor: '#0C1422', position: 'relative' }}>
      {shouldRenderVideo ? (
        Platform.OS === 'web' ? (
          <WebMonitorPreview url={canal.streamUrl} onPlaybackOk={onPlaybackOk} onPlaybackError={onPlaybackError} />
        ) : (
          <Video source={{ uri: canal.streamUrl }} resizeMode={ResizeMode.COVER} isMuted shouldPlay isLooping onLoad={onPlaybackOk} onError={onPlaybackError} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        )
      ) : null}

      {showVideoChrome ? (
        <>
          <View style={{ position: 'absolute', top: 0, right: 0, left: 0, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: 'rgba(4,8,15,0.18)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              {canal.logoUrl ? (
                <Image source={{ uri: canal.logoUrl }} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)' }} />
              ) : (
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,198,41,0.14)', borderWidth: 1, borderColor: theme.accentBorder, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '800' }}>{getInitials(canal.nombre)}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: 'white', fontSize: 13, fontWeight: '800' }}>{canal.nombre}</Text>
                <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, marginTop: 2 }}>{canal.category?.nombre || 'Canal registrado'}</Text>
              </View>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: operationalTone.background, borderWidth: 1, borderColor: operationalTone.border }}>
              <Text style={{ color: operationalTone.color, fontSize: 10, fontWeight: '800' }}>{operationalTone.label}</Text>
            </View>
          </View>

          <View style={{ position: 'absolute', right: 0, bottom: 0, left: 0, paddingHorizontal: 12, paddingTop: 34, paddingBottom: 12, backgroundColor: 'rgba(4,8,15,0.18)' }}>
            <View style={{ position: 'absolute', right: 0, bottom: 0, left: 0, top: 0, backgroundColor: 'rgba(4,8,15,0.28)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: tone.background, borderWidth: 1, borderColor: tone.border }}>
                <Text style={{ color: tone.color, fontSize: 10, fontWeight: '800' }}>{tone.label}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: operationalTone.background, borderWidth: 1, borderColor: operationalTone.border }}>
                <Text style={{ color: operationalTone.color, fontSize: 10, fontWeight: '800' }}>{operationalTone.label}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>{getSignalLabel(canal.isLive, canal.streamProtocol)}</Text>
              </View>
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: shouldRenderVideo ? 'rgba(8,12,20,0.42)' : 'rgba(8,12,20,0.96)' }} />
          <View style={{ padding: 16, gap: 14, flex: 1, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                {canal.logoUrl ? (
                  <Image source={{ uri: canal.logoUrl }} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)' }} />
                ) : (
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,198,41,0.12)', borderWidth: 1, borderColor: theme.accentBorder, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '800' }}>{getInitials(canal.nombre)}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: 'white', fontSize: 14, fontWeight: '800' }}>{canal.nombre}</Text>
                  <Text numberOfLines={1} style={{ color: theme.textSec, fontSize: 12, marginTop: 3 }}>{canal.category?.nombre || 'Canal registrado'}</Text>
                </View>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.textSec, fontSize: 10, fontWeight: '800' }}>{shouldRenderVideo ? 'CARGANDO' : 'FICHA'}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: tone.background, borderWidth: 1, borderColor: tone.border }}>
                <Text style={{ color: tone.color, fontSize: 10, fontWeight: '800' }}>{tone.label}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: operationalTone.background, borderWidth: 1, borderColor: operationalTone.border }}>
                <Text style={{ color: operationalTone.color, fontSize: 10, fontWeight: '800' }}>{operationalTone.label}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.textSec, fontSize: 10, fontWeight: '800' }}>{getSignalLabel(canal.isLive, canal.streamProtocol)}</Text>
              </View>
            </View>

            <View style={{ backgroundColor: 'rgba(0,0,0,0.26)', borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 12, gap: 8 }}>
              <View>
                <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>URL</Text>
                <Text selectable style={{ color: theme.textSec, fontSize: 11, lineHeight: 16 }}>{canal.streamUrl || 'Sin URL configurada'}</Text>
              </View>
              <View>
                <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>ESTADO OPERATIVO</Text>
                <Text style={{ color: operationalTone.color, fontSize: 11, lineHeight: 16 }}>{operationalTone.reason}</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

export default function CmsMonitor() {
  const { isDark, theme } = useTheme();
  const { profile } = useCmsStore();
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // Subscribe to channelStore — no polling needed, fully reactive
  // ---------------------------------------------------------------------------
  const allChannels = useChannelStore((s) => s.channels);
  const canales = useMemo(() => allChannels.filter((c) => c.status === 'ACTIVE'), [allChannels]);
  const categorias = useCategoriasStore((s) => s.categorias);

  const [monitorView, setMonitorView] = useState<MonitorViewMode>('mosaico');
  const [playback, setPlayback] = useState<Record<string, PlaybackState>>({});
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Reset playback map when canales list changes
  useEffect(() => {
    setPlayback((current) => Object.fromEntries(
      canales.map((item) => {
        const next: PlaybackState = !isValidStreamUrl(item.streamUrl) ? 'idle' : (current[item.id] ?? 'idle');
        return [item.id, next];
      }),
    ));
    setPage(0);
  }, [canales]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(canales.length / CHANNELS_PER_PAGE)), [canales.length]);
  const visibles = useMemo(() => canales.slice(page * CHANNELS_PER_PAGE, page * CHANNELS_PER_PAGE + CHANNELS_PER_PAGE), [canales, page]);
  const activos = useMemo(() => canales.filter((item) => item.status === 'ACTIVE' && isValidStreamUrl(item.streamUrl)).length, [canales]);
  const conPreview = useMemo(() => Object.values(playback).filter((state) => state === 'playing').length, [playback]);
  const vacios = Math.max(0, CHANNELS_PER_PAGE - visibles.length);

  useEffect(() => {
    if (totalPages <= 1) return;

    const timer = setInterval(() => {
      setPage((current) => (current + 1) % totalPages);
    }, AUTO_ROTATE_MS);

    return () => clearInterval(timer);
  }, [totalPages]);

  if (!profile) return null;

  return (
    <CmsShell breadcrumbs={[{ label: 'Monitor' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>

        {/* ── View Toggle ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>
            {monitorView === 'mosaico' ? 'Vista de monitoreo con preview en vivo' : 'Videowall de canales del catálogo'}
          </Text>
          <View style={{ flexDirection: 'row', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
            <TouchableOpacity
              onPress={() => setMonitorView('mosaico')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: monitorView === 'mosaico' ? theme.accentSoft : 'transparent' }}
            >
              <FontAwesome name="video-camera" size={12} color={monitorView === 'mosaico' ? theme.accent : theme.textMuted} />
              <Text style={{ color: monitorView === 'mosaico' ? theme.accent : theme.textMuted, fontSize: 12, fontWeight: '700' }}>Mosaico</Text>
            </TouchableOpacity>
            <View style={{ width: 1, backgroundColor: theme.border }} />
            <TouchableOpacity
              onPress={() => setMonitorView('videowall')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: monitorView === 'videowall' ? theme.accentSoft : 'transparent' }}
            >
              <FontAwesome name="desktop" size={12} color={monitorView === 'videowall' ? theme.accent : theme.textMuted} />
              <Text style={{ color: monitorView === 'videowall' ? theme.accent : theme.textMuted, fontSize: 12, fontWeight: '700' }}>Videowall</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Summary Cards ── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
          <SummaryCard label="Canales activos" value={canales.length} icon="television" color="#5B5BD6" />
          <SummaryCard label="Operativos" value={activos} icon="play-circle" color="#10B981" />
          {monitorView === 'mosaico'
            ? <SummaryCard label="Con preview" value={conPreview} icon="video-camera" color="#0EA5E9" />
            : <SummaryCard label="Total catálogo" value={allChannels.length} icon="th" color="#F59E0B" />
          }
        </View>

        {canales.length === 0 ? (
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 48, alignItems: 'center', gap: 14 }}>
            <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(91,91,214,0.14)', alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome name="television" size={28} color="#5B5BD6" />
            </View>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>Sin canales activos</Text>
            <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 340 }}>
              Crea o activa canales desde la sección Canales para verlos aparecer aquí en tiempo real.
            </Text>
          </View>
        ) : monitorView === 'videowall' ? (
          /* ── Videowall View ── */
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <View>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>Videowall</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                  Todos los canales del catálogo. Clic para ampliar · logo, estado y categoría en cada celda.
                </Text>
              </View>
            </View>
            <VideoWall
              channels={allChannels}
              categories={categorias.map((c) => ({ id: c.id, nombre: c.nombre }))}
            />
          </View>
        ) : (
          /* ── Mosaico View ── */
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <View>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>Mosaico 4x4</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>Se muestran 16 canales por pantalla. Si la URL es inválida o la señal falla, el canal queda marcado como de baja.</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <Text style={{ color: theme.textSec, fontSize: 12 }}>Actualizado: {new Date().toLocaleTimeString('es-CO')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setPage((current) => Math.max(0, current - 1))}
                    disabled={page === 0}
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: page === 0 ? 'rgba(255,255,255,0.04)' : theme.liftBg, borderWidth: 1, borderColor: theme.border, opacity: page === 0 ? 0.5 : 1 }}
                  >
                    <Text style={{ color: theme.textSec, fontSize: 12, fontWeight: '700' }}>Anterior</Text>
                  </TouchableOpacity>
                  <Text style={{ color: theme.textSec, fontSize: 12 }}>Pantalla {page + 1} de {totalPages}</Text>
                  <TouchableOpacity
                    onPress={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                    disabled={page >= totalPages - 1}
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: page >= totalPages - 1 ? 'rgba(255,255,255,0.04)' : theme.liftBg, borderWidth: 1, borderColor: theme.border, opacity: page >= totalPages - 1 ? 0.5 : 1 }}
                  >
                    <Text style={{ color: theme.textSec, fontSize: 12, fontWeight: '700' }}>Siguiente</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>Rotación automática cada 8 s</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
              {visibles.map((canal) => (
                <ChannelMonitorTile
                  key={canal.id}
                  canal={canal}
                  playback={playback[canal.id] ?? 'idle'}
                  onPlaybackOk={() => setPlayback((current) => current[canal.id] === 'playing' ? current : { ...current, [canal.id]: 'playing' })}
                  onPlaybackError={() => setPlayback((current) => current[canal.id] === 'error' ? current : { ...current, [canal.id]: 'error' })}
                />
              ))}
              {Array.from({ length: vacios }).map((_, index) => (
                <EmptyMonitorTile key={`empty-${index}`} index={visibles.length + index} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </CmsShell>
  );
}
