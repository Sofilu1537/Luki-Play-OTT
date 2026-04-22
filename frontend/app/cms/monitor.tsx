import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { useChannelStore } from '../../services/channelStore';
import { ResizeMode, Video } from 'expo-av';
import type { AdminCanal } from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

type PlaybackState = 'idle' | 'playing' | 'error';

const CHANNELS_PER_PAGE = 16;
const AUTO_ROTATE_MS = 8000;

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
      <video ref={videoRef} muted autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: 'black' }} />
    </View>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return (
    <View style={{ flex: 1, minWidth: 180, backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 38, height: 38, backgroundColor: `${color}22`, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
          <FontAwesome name={icon} size={16} color={color} />
        </View>
        <Text style={{ color: C.textDim, fontSize: 13, fontWeight: '600' }}>{label}</Text>
      </View>
      <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

function EmptyMonitorTile({ index }: { index: number }) {
  return (
    <View style={{ flexBasis: '24%', minWidth: 220, minHeight: 170, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border, backgroundColor: '#0C1422', padding: 16, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 52, height: 52, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '800' }}>{String(index + 1).padStart(2, '0')}</Text>
      </View>
      <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>Sin canal asignado</Text>
      <Text style={{ color: C.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>Este espacio se llenará cuando agregues más canales al catálogo.</Text>
    </View>
  );
}

function ChannelMonitorTile({ canal, playback, onPlaybackOk, onPlaybackError }: { canal: AdminCanal; playback: PlaybackState; onPlaybackOk: () => void; onPlaybackError: () => void }) {
  const isActive = canal.status === 'ACTIVE';
  const tone = getStatusTone(isActive);
  const operationalTone = getOperationalTone(canal, playback);
  const shouldRenderVideo = isActive && playback !== 'error' && isValidStreamUrl(canal.streamUrl);
  const showVideoChrome = shouldRenderVideo && playback === 'playing';

  return (
    <View style={{ flexBasis: '24%', minWidth: 220, minHeight: 170, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: playback === 'playing' ? C.accent : operationalTone.border, backgroundColor: '#0C1422', position: 'relative' }}>
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
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,198,41,0.14)', borderWidth: 1, borderColor: C.accentBorder, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: C.accent, fontSize: 10, fontWeight: '800' }}>{getInitials(canal.nombre)}</Text>
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
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,198,41,0.12)', borderWidth: 1, borderColor: C.accentBorder, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: C.accent, fontSize: 12, fontWeight: '800' }}>{getInitials(canal.nombre)}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: 'white', fontSize: 14, fontWeight: '800' }}>{canal.nombre}</Text>
                  <Text numberOfLines={1} style={{ color: C.textDim, fontSize: 12, marginTop: 3 }}>{canal.category?.nombre || 'Canal registrado'}</Text>
                </View>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.textDim, fontSize: 10, fontWeight: '800' }}>{shouldRenderVideo ? 'CARGANDO' : 'FICHA'}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: tone.background, borderWidth: 1, borderColor: tone.border }}>
                <Text style={{ color: tone.color, fontSize: 10, fontWeight: '800' }}>{tone.label}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: operationalTone.background, borderWidth: 1, borderColor: operationalTone.border }}>
                <Text style={{ color: operationalTone.color, fontSize: 10, fontWeight: '800' }}>{operationalTone.label}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.textDim, fontSize: 10, fontWeight: '800' }}>{getSignalLabel(canal.isLive, canal.streamProtocol)}</Text>
              </View>
            </View>

            <View style={{ backgroundColor: 'rgba(0,0,0,0.26)', borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12, gap: 8 }}>
              <View>
                <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>URL</Text>
                <Text selectable style={{ color: C.textDim, fontSize: 11, lineHeight: 16 }}>{canal.streamUrl || 'Sin URL configurada'}</Text>
              </View>
              <View>
                <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>ESTADO OPERATIVO</Text>
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
  const { profile } = useCmsStore();
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // Subscribe to channelStore — no polling needed, fully reactive
  // ---------------------------------------------------------------------------
  const allChannels = useChannelStore((s) => s.channels);
  const canales = useMemo(() => allChannels.filter((c) => c.status === 'ACTIVE'), [allChannels]);

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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
          <SummaryCard label="Canales activos" value={canales.length} icon="television" color="#5B5BD6" />
          <SummaryCard label="Operativos" value={activos} icon="play-circle" color="#10B981" />
          <SummaryCard label="Slots por vista" value={CHANNELS_PER_PAGE} icon="th" color="#F59E0B" />
          <SummaryCard label="Con preview" value={conPreview} icon="video-camera" color="#0EA5E9" />
        </View>

        {canales.length === 0 ? (
          <View style={{ backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 48, alignItems: 'center', gap: 14 }}>
            <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(91,91,214,0.14)', alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome name="television" size={28} color="#5B5BD6" />
            </View>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '800' }}>Sin canales activos</Text>
            <Text style={{ color: C.muted, fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 340 }}>
              Crea o activa canales desde la sección Canales para verlos aparecer aquí en tiempo real.
            </Text>
          </View>
        ) : (
          <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <View>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Mosaico 4x4</Text>
                <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Se muestran 16 canales por pantalla. Si la URL es inválida o la señal falla, el canal queda marcado como de baja.</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <Text style={{ color: C.textDim, fontSize: 12 }}>Actualizado: {new Date().toLocaleTimeString('es-CO')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setPage((current) => Math.max(0, current - 1))}
                    disabled={page === 0}
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: page === 0 ? 'rgba(255,255,255,0.04)' : C.surfaceAlt, borderWidth: 1, borderColor: C.border, opacity: page === 0 ? 0.5 : 1 }}
                  >
                    <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700' }}>Anterior</Text>
                  </TouchableOpacity>
                  <Text style={{ color: C.textDim, fontSize: 12 }}>Pantalla {page + 1} de {totalPages}</Text>
                  <TouchableOpacity
                    onPress={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                    disabled={page >= totalPages - 1}
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: page >= totalPages - 1 ? 'rgba(255,255,255,0.04)' : C.surfaceAlt, borderWidth: 1, borderColor: C.border, opacity: page >= totalPages - 1 ? 0.5 : 1 }}
                  >
                    <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700' }}>Siguiente</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color: C.muted, fontSize: 11 }}>Rotación automática cada 8 s</Text>
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
