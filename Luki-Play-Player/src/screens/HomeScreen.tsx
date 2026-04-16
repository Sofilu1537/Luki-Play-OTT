import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Image, FlatList,
} from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { LivePlayerScreen } from './LivePlayerScreen';
import { useChannels, getCurrentProgram } from '../hooks/useChannels';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Hero Banner — Live TV Promo
// ─────────────────────────────────────────────
function HeroBanner({ onWatchLive }: { onWatchLive: () => void }) {
  return (
    <View style={hero.container}>
      {/* Gradient background */}
      <View style={hero.bg} />
      <View style={hero.overlay}>
        <View style={hero.livePill}>
          <View style={hero.liveDot} />
          <Text style={hero.liveText}>EN VIVO</Text>
        </View>
        <Text style={hero.title}>TV en Vivo</Text>
        <Text style={hero.subtitle}>
          10 canales de Ecuador en alta calidad — sin interrupciones
        </Text>
        <View style={hero.actions}>
          <TouchableOpacity style={hero.playBtn} onPress={onWatchLive}>
            <Text style={hero.playBtnText}>▶  Ver ahora</Text>
          </TouchableOpacity>
          <TouchableOpacity style={hero.infoBtn}>
            <Text style={hero.infoBtnText}>ℹ  Guía EPG</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const hero = StyleSheet.create({
  container: {
    width: '100%', height: width * 0.56, backgroundColor: '#0D001A', overflow: 'hidden',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#200040',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 24, paddingTop: 48, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(229,57,53,0.22)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(229,57,53,0.4)',
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#E53935' },
  liveText: { color: '#E53935', fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 20, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12 },
  playBtn: {
    backgroundColor: '#FFB800', borderRadius: 10,
    paddingHorizontal: 22, paddingVertical: 11,
  },
  playBtnText: { color: '#000', fontWeight: '900', fontSize: 14 },
  infoBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 11,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  infoBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

// ─────────────────────────────────────────────
// Channel Grid Row
// ─────────────────────────────────────────────
function ChannelRow({ channels, onSelectChannel }: { channels: import('../data/channels').Channel[]; onSelectChannel: (idx: number) => void }) {
  return (
    <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>📺 Canales en Vivo</Text>
        <TouchableOpacity>
          <Text style={{ color: '#FFB800', fontSize: 13, fontWeight: '700' }}>Ver todos →</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={channels}
        keyExtractor={c => c.id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item, index }) => {
          const prog = getCurrentProgram(item);
          return (
            <TouchableOpacity style={channelCard.card} onPress={() => onSelectChannel(index)}>
              {/* Thumb */}
              <View style={channelCard.thumb}>
                <Text style={{ fontSize: 32 }}>{item.logo}</Text>
                <View style={channelCard.playIcon}><Text style={{ color: '#fff', fontSize: 16 }}>▶</Text></View>
                <View style={channelCard.badge}><Text style={channelCard.badgeText}>LIVE</Text></View>
              </View>
              {/* Info */}
              <View style={channelCard.info}>
                <Text style={channelCard.chNum}>{item.number}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={channelCard.name} numberOfLines={1}>{item.name}</Text>
                  <Text style={channelCard.program} numberOfLines={1}>{prog.title}</Text>
                </View>
                {item.isFavorite && <Text style={{ color: '#E53935', fontSize: 14 }}>♥</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const channelCard = StyleSheet.create({
  card: {
    width: 150, backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  thumb: {
    height: 84, backgroundColor: '#200040',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  playIcon: {
    position: 'absolute',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: 7, right: 7,
    backgroundColor: '#E53935', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  info: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  chNum: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700', width: 18 },
  name: { color: '#fff', fontSize: 12, fontWeight: '700' },
  program: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },
});

// ─────────────────────────────────────────────
// Favorites Row
// ─────────────────────────────────────────────
function FavoritesRow({ channels, onSelectChannel }: { channels: import('../data/channels').Channel[]; onSelectChannel: (idx: number) => void }) {
  const favs = channels.filter(c => c.isFavorite);
  if (!favs.length) return null;
  return (
    <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 14 }}>
        ♥ Mis Favoritos
      </Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={favs}
        keyExtractor={c => c.id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => {
          const idx = channels.findIndex(c => c.id === item.id);
          const prog = getCurrentProgram(item);
          return (
            <TouchableOpacity
              style={{
                width: 120, alignItems: 'center', gap: 6,
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 14, padding: 12,
                borderWidth: 1, borderColor: 'rgba(255,184,0,0.20)',
              }}
              onPress={() => onSelectChannel(idx)}
            >
              <Text style={{ fontSize: 36 }}>{item.logo}</Text>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' }}>{item.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, textAlign: 'center' }} numberOfLines={1}>{prog.title}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// Main HomeScreen
// ─────────────────────────────────────────────
export const HomeScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { logout } = useAuthStore();
  const { channels, loading: channelsLoading, error: channelsError, isFromBackend } = useChannels();
  const [watchingLive, setWatchingLive] = useState(false);
  const [startChannelIdx, setStartChannelIdx] = useState(0);

  const openLive = (idx = 0) => {
    setStartChannelIdx(Math.min(idx, Math.max(0, channels.length - 1)));
    setWatchingLive(true);
  };

  if (watchingLive) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <LivePlayerScreen initialIndex={startChannelIdx} />
        <TouchableOpacity
          style={{
            position: 'absolute', top: 48, left: 14,
            backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20,
            paddingHorizontal: 14, paddingVertical: 8,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
          }}
          onPress={() => setWatchingLive(false)}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>← Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} bounces={false}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 54, paddingBottom: 14,
      }}>
        <View>
          <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '900', letterSpacing: 1 }}>
            LUKI <Text style={{ color: '#fff' }}>PLAY</Text>
          </Text>
          {isFromBackend && (
            <Text style={{ color: '#10b981', fontSize: 10, fontWeight: '700', marginTop: 2 }}>
              ● {channels.length} canales cargados desde el CMS
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }}>🔍</Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }}>🔔</Text>
        </View>
      </View>

      {/* Hero */}
      <HeroBanner onWatchLive={() => openLive(0)} />

      {/* Channels */}
      <ChannelRow channels={channels} onSelectChannel={openLive} />

      {/* Favorites */}
      <FavoritesRow channels={channels} onSelectChannel={openLive} />

      {/* Trending row placeholder */}
      <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 14 }}>
          🔥 Tendencias
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={{
              width: 110, height: 160, borderRadius: 12, marginRight: 12,
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
            }} />
          ))}
        </ScrollView>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={{
          margin: 28, padding: 15, borderRadius: 10,
          borderWidth: 1, borderColor: colors.primary,
          backgroundColor: 'rgba(255,184,0,0.06)',
        }}
        onPress={logout}
      >
        <Text style={{ color: colors.primary, textAlign: 'center', fontWeight: '700' }}>
          Cerrar Sesión
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
