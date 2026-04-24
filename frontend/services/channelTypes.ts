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
  logo: string;           // emoji fallback while no CDN
  streamUrl: string;
  category: string;
  isFavorite: boolean;
  epg: EpgProgram[];
}

// ─────────────────────────────────────────────
// Fallback static channels (used when backend has no channels yet)
// ─────────────────────────────────────────────

const S_MUX     = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const S_APPLE   = 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8';
const S_CPH     = 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8';
const S_UNIFIED = 'https://demo.unified-streaming.com/k8s/live/scte35.isml/.m3u8';

const hh = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const addMin = (d: Date, m: number) => new Date(d.getTime() + m * 60000);

function makeEpg(programs: [string, number, string][]): EpgProgram[] {
  let cursor = new Date();
  cursor.setMinutes(0, 0, 0);
  return programs.map(([title, dur, description]) => {
    const start = new Date(cursor);
    cursor = addMin(cursor, dur);
    return { title, startTime: hh(start), endTime: hh(cursor), description };
  });
}

export const STATIC_CHANNELS: Channel[] = [
  {
    id: 'ch-001', number: 1, name: 'Canal 1 HD', logo: '📺', streamUrl: S_MUX,
    category: 'Noticias', isFavorite: false,
    epg: makeEpg([['Noticias de la Mañana', 60, 'Actualidad nacional e internacional'], ['Debate Nacional', 90, 'Análisis político'], ['Cultura y Sociedad', 60, 'Magazine cultural']]),
  },
  {
    id: 'ch-002', number: 2, name: 'Gama TV', logo: '🎬', streamUrl: S_APPLE,
    category: 'Entretenimiento', isFavorite: true,
    epg: makeEpg([['La Virgencita Ecuador', 60, 'Telenovela nacional'], ['Gama Noticias', 30, 'Últimas noticias'], ['Cinemax Noche', 120, 'Cine de estreno']]),
  },
  {
    id: 'ch-003', number: 3, name: 'TC Televisión', logo: '🏆', streamUrl: S_CPH,
    category: 'Entretenimiento', isFavorite: false,
    epg: makeEpg([['Ecuador en Vivo', 30, 'Noticias en tiempo real'], ['Series TC', 90, 'Series nacionales'], ['Deportes TC', 60, 'Resúmenes deportivos']]),
  },
  {
    id: 'ch-004', number: 4, name: 'TVC', logo: '📡', streamUrl: S_UNIFIED,
    category: 'Noticias', isFavorite: false,
    epg: makeEpg([['24 Horas', 60, 'Noticias todo el día'], ['Agenda País', 30, 'Situación nacional'], ['El Gran Debate', 90, 'Política y economía']]),
  },
  {
    id: 'ch-005', number: 5, name: 'Ecuador TV', logo: '🇪🇨', streamUrl: S_MUX,
    category: 'Cultura', isFavorite: true,
    epg: makeEpg([['Yo Soy Emprendedor', 60, 'Historias de éxito empresarial'], ['Arte y Cultura', 60, 'Patrimonio cultural'], ['Documental', 90, 'Documentales nacionales']]),
  },
  {
    id: 'ch-006', number: 6, name: 'Uno TV', logo: '1️⃣', streamUrl: S_APPLE,
    category: 'Entretenimiento', isFavorite: false,
    epg: makeEpg([['Acción Total', 120, 'Cine de acción'], ['Realidad Total', 60, 'Reality show'], ['Noche de Comedia', 60, 'Stand-up y humor']]),
  },
  {
    id: 'ch-007', number: 7, name: 'Ecuador 7', logo: '7️⃣', streamUrl: S_CPH,
    category: 'Deportes', isFavorite: false,
    epg: makeEpg([['Liga Pro Ecuador', 90, 'Fútbol en vivo'], ['Ídolo Deportivo', 60, 'Análisis deportivo'], ['Mundial Sub-20', 90, 'Cobertura especial']]),
  },
  {
    id: 'ch-008', number: 8, name: 'Gamavisión', logo: '📡', streamUrl: S_UNIFIED,
    category: 'Noticias', isFavorite: true,
    epg: makeEpg([['Noticiero Central', 60, 'Noticias de Ecuador'], ['Especial Investigativo', 60, 'Periodismo de fondo'], ['Cine Clásico', 120, 'Películas icónicas']]),
  },
  {
    id: 'ch-009', number: 9, name: 'TVC Noticias', logo: '📰', streamUrl: S_MUX,
    category: 'Noticias', isFavorite: false,
    epg: makeEpg([['Última Hora', 30, 'Breaking news'], ['El Informe', 60, 'Noticias ampliadas'], ['Noche Informativa', 60, 'Resumen nocturno']]),
  },
  {
    id: 'ch-010', number: 10, name: 'Teleamazonas', logo: '🌐', streamUrl: S_APPLE,
    category: 'Entretenimiento', isFavorite: false,
    epg: makeEpg([['24 Horas Amazon', 60, 'Noticias al instante'], ['La Pareja Feliz', 60, 'Comedia familiar'], ['Serie Prime', 90, 'Series internacionales']]),
  },
];

// ─────────────────────────────────────────────
// EPG helpers
// ─────────────────────────────────────────────

export function getCurrentProgram(channel: Channel): EpgProgram {
  if (!channel.epg || channel.epg.length === 0) {
    return { title: channel.name, startTime: '00:00', endTime: '23:59', description: 'En vivo' };
  }
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  return channel.epg.find(p => {
    const start = toMin(p.startTime);
    const end = toMin(p.endTime);
    if (end < start) {
      // Midnight-crossing program (e.g. 23:30 – 01:00)
      return nowMin >= start || nowMin < end;
    }
    return nowMin >= start && nowMin < end;
  }) ?? channel.epg[0]!;
}

export function getProgressPercent(program: EpgProgram): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const start = toMin(program.startTime);
  let end = toMin(program.endTime);
  let elapsed = nowMin - start;

  if (end < start) {
    // Midnight-crossing: add 24h to end and adjust elapsed if we're past midnight
    end += 24 * 60;
    if (nowMin < start) elapsed = (nowMin + 24 * 60) - start;
  }

  const duration = end - start;
  if (duration <= 0) return 100;
  return Math.min(100, Math.max(0, (elapsed / duration) * 100));
}
