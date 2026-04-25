// ─────────────────────────────────────────────
// Luki Play — Channel & EPG Types
// Shared between useChannels hook and player screens.
// ─────────────────────────────────────────────

export interface EpgProgram {
  title: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  description?: string;
  thumbnail?: string;
}

export interface Channel {
  id: string;
  number: number;
  name: string;
  logo: string;
  streamUrl: string;
  category: string;
  isFavorite: boolean;
  epg: EpgProgram[];
}

// ─────────────────────────────────────────────
// EPG helpers
// ─────────────────────────────────────────────

export function getCurrentProgram(channel: Channel): EpgProgram {
  if (!channel.epg || channel.epg.length === 0) {
    return { title: channel.name, startTime: '00:00', endTime: '23:59', description: 'En vivo' };
  }
  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return channel.epg.find(p => p.startTime <= nowStr && p.endTime > nowStr) ?? channel.epg[0]!;
}

export function getProgressPercent(program: EpgProgram): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const start = toMin(program.startTime);
  const end = toMin(program.endTime);
  if (end <= start) return 100;
  return Math.min(100, Math.max(0, ((nowMin - start) / (end - start)) * 100));
}
