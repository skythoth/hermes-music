/**
 * Hermes Music Agent — virtual catalog + recommendation engine
 * TODO(A): parseIntent() + recommend() will be replaced by OpenAI calls
 * TODO(B): CATALOG will be replaced by Spotify Search results
 */

// ---- Types -------------------------------------------------------------------
export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  bpm: number;
  genre: string;
  vocal: 'female' | 'male' | 'mixed' | 'inst';
  energy: number;
  moods: string[];
  hue: number;
}

export interface Profile {
  genre: Record<string, number>;
  vocal: Record<string, number>;
  mood: Record<string, number>;
  bpmTarget: number;
  energyTarget: number;
  seen: Record<string, 'like' | 'skip' | 'block'>;
  feedbackCount: number;
  likes: number;
}

export interface MemoryTag {
  key: string;
  label: string;
  weight: number;
  meta?: boolean;
}

export interface IntentResult {
  patch: Partial<{ genre: Record<string, number>; vocal: Record<string, number>; mood: Record<string, number>; bpmTarget: number; energyTarget: number }>;
  tags: string[];
  reply: string;
}

// ---- Virtual catalog ---------------------------------------------------------
export const CATALOG: Track[] = [
  { id: "neon-sprint",   title: "Neon Sprint",    artist: "AVA K",      album: "PUREFLOW, Pt.1", bpm: 132, genre: "electro pop", vocal: "female", energy: 88, moods: ["workout", "party"],       hue: 145 },
  { id: "rushline",      title: "Rushline",       artist: "Mira Vox",   album: "Afterhours",     bpm: 128, genre: "dance",       vocal: "female", energy: 84, moods: ["workout", "drive"],       hue: 168 },
  { id: "velocity",      title: "Velocity Heart", artist: "Nova June",  album: "Synthetica",     bpm: 130, genre: "synth wave",  vocal: "female", energy: 86, moods: ["workout", "drive"],       hue: 120 },
  { id: "supernova",     title: "Supernova Kiss", artist: "AVA K",      album: "PUREFLOW, Pt.1", bpm: 135, genre: "electro pop", vocal: "female", energy: 90, moods: ["workout", "party"],       hue: 152 },
  { id: "ignition",      title: "Ignition",       artist: "Mira Vox",   album: "Afterhours",     bpm: 138, genre: "big room",    vocal: "female", energy: 95, moods: ["workout", "party"],       hue: 188 },
  { id: "daybreak",      title: "Daybreak Run",   artist: "Bloomgirl",  album: "Hyperbloom",     bpm: 145, genre: "hyperpop",    vocal: "female", energy: 96, moods: ["workout", "party"],       hue: 320 },
  { id: "cherry",        title: "Cherry Static",  artist: "Bloomgirl",  album: "Hyperbloom",     bpm: 124, genre: "hyperpop",    vocal: "female", energy: 80, moods: ["party", "drive"],         hue: 340 },
  { id: "heartbeat",     title: "Heartbeat Echo", artist: "Seo Lux",    album: "Midnight City",  bpm: 122, genre: "dance pop",   vocal: "male",   energy: 74, moods: ["drive", "party"],         hue: 210 },
  { id: "midnight",      title: "Midnight Drive", artist: "Seo Lux",    album: "Midnight City",  bpm: 118, genre: "synth pop",   vocal: "male",   energy: 70, moods: ["drive", "late-night"],    hue: 230 },
  { id: "violet",        title: "Violet Hour",    artist: "Nova June",  album: "Synthetica",     bpm: 112, genre: "synth pop",   vocal: "female", energy: 60, moods: ["late-night", "drive"],    hue: 270 },
  { id: "crystalize",    title: "Crystalize",     artist: "HEXA",       album: "Machine Bloom",  bpm: 126, genre: "house",       vocal: "inst",   energy: 78, moods: ["focus", "workout"],      hue: 175 },
  { id: "pulse",         title: "Pulse Theory",   artist: "HEXA",       album: "Machine Bloom",  bpm: 140, genre: "techno",      vocal: "inst",   energy: 92, moods: ["focus", "workout"],      hue: 195 },
  { id: "overdrive",     title: "Overdrive",      artist: "HEXA",       album: "Machine Bloom",  bpm: 150, genre: "hardstyle",   vocal: "inst",   energy: 99, moods: ["workout"],               hue: 8   },
  { id: "afterglow",     title: "Afterglow",      artist: "KITO",       album: "Paper Skies",    bpm: 102, genre: "indie pop",   vocal: "mixed",  energy: 50, moods: ["chill", "late-night"],    hue: 36  },
  { id: "paper-planes",  title: "Paper Planes",   artist: "KITO",       album: "Paper Skies",    bpm: 96,  genre: "indie",       vocal: "mixed",  energy: 45, moods: ["chill", "focus"],         hue: 48  },
  { id: "gravity",       title: "Gravity",        artist: "KITO",       album: "Paper Skies",    bpm: 88,  genre: "indie folk",  vocal: "male",   energy: 30, moods: ["chill"],                  hue: 60  },
  { id: "static-bloom",  title: "Static Bloom",   artist: "Aeon Park",  album: "Low Tide",       bpm: 100, genre: "chillwave",   vocal: "mixed",  energy: 48, moods: ["chill", "focus"],         hue: 90  },
  { id: "low-tide",      title: "Low Tide",       artist: "Aeon Park",  album: "Low Tide",       bpm: 84,  genre: "lo-fi",       vocal: "inst",   energy: 25, moods: ["focus", "chill"],         hue: 100 },
  { id: "glass-ocean",   title: "Glass Ocean",    artist: "Yuna Reine", album: "Tideglass",      bpm: 92,  genre: "ballad",      vocal: "female", energy: 30, moods: ["late-night", "chill"],    hue: 250 },
  { id: "slow-burn",     title: "Slow Burn",      artist: "Yuna Reine", album: "Tideglass",      bpm: 78,  genre: "r&b",         vocal: "female", energy: 35, moods: ["late-night", "chill"],    hue: 288 },
];

// ---- Starter taste profile ---------------------------------------------------
export function defaultProfile(): Profile {
  return {
    genre: { "electro pop": 0.5, dance: 0.4, "synth wave": 0.3, indie: -0.15, "lo-fi": -0.1, ballad: -0.1 },
    vocal: { female: 0.45, male: 0, mixed: 0, inst: -0.05 },
    mood:  { workout: 0.55, drive: 0.25, party: 0.2, chill: -0.25, focus: 0, "late-night": 0 },
    bpmTarget: 126,
    energyTarget: 80,
    seen: {},
    feedbackCount: 0,
    likes: 0,
  };
}

// ---- Scoring -----------------------------------------------------------------
function scoreTrack(t: Track, p: Profile): number {
  let s = 0;
  s += (p.genre[t.genre] || 0) * 30;
  s += (p.vocal[t.vocal] || 0) * 20;
  for (const m of t.moods) s += (p.mood[m] || 0) * 14;
  s += (1 - Math.min(1, Math.abs(t.bpm - p.bpmTarget) / 45)) * 22;
  s += (1 - Math.min(1, Math.abs(t.energy - p.energyTarget) / 70)) * 16;
  return s;
}

// TODO(A): This will be replaced by OpenAI recommendations
export function recommend(p: Profile, n: number, excludeIds: string[]): Track[] {
  const ex = new Set(excludeIds);
  return CATALOG
    .filter((t) => !ex.has(t.id) && p.seen[t.id] !== "block")
    .map((t) => ({ track: t, score: scoreTrack(t, p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.track);
}

// ---- Feedback ----------------------------------------------------------------
export function applyFeedback(profile: Profile, track: Track, kind: 'like' | 'skip' | 'block'): Profile {
  const p: Profile = JSON.parse(JSON.stringify(profile));
  const dir = kind === "like" ? 1 : kind === "skip" ? -0.5 : -1;
  const mag = 0.18;
  p.genre[track.genre] = (p.genre[track.genre] || 0) + dir * mag;
  p.vocal[track.vocal] = (p.vocal[track.vocal] || 0) + dir * mag * 0.7;
  for (const m of track.moods) p.mood[m] = (p.mood[m] || 0) + dir * mag * 0.6;
  p.bpmTarget += (track.bpm - p.bpmTarget) * (kind === "like" ? 0.22 : -0.08);
  p.energyTarget += (track.energy - p.energyTarget) * (kind === "like" ? 0.22 : -0.08);
  p.energyTarget = Math.max(10, Math.min(100, p.energyTarget));
  p.seen[track.id] = kind;
  p.feedbackCount += 1;
  if (kind === "like") p.likes += 1;
  return p;
}

// ---- Intent parsing ----------------------------------------------------------
// TODO(A): This will be replaced by OpenAI intent understanding
export function parseIntent(text: string): IntentResult {
  const t = text.toLowerCase();
  const patch: IntentResult['patch'] = {};
  const tags: string[] = [];
  let reply = "요청을 반영해 추천을 다시 구성했어요.";

  const has = (...ws: string[]) => ws.some((w) => t.includes(w));

  if (has("운동", "workout", "gym", "헬스", "달리기", "런닝", "러닝")) {
    patch.mood = { workout: 0.4, party: 0.15 }; patch.energyTarget = 88; patch.bpmTarget = 132;
    tags.push("운동", "고에너지"); reply = "운동 세션에 맞춰 고에너지·빠른 BPM 위주로 골랐어요.";
  }
  if (has("집중", "공부", "focus", "study", "작업")) {
    patch.mood = { focus: 0.4, chill: 0.2, workout: -0.2 }; patch.energyTarget = 38; patch.bpmTarget = 96;
    tags.push("집중", "저자극"); reply = "방해되지 않게 잔잔하고 보컬 적은 곡 위주로 모았어요.";
  }
  if (has("드라이브", "drive", "운전", "새벽", "밤")) {
    patch.mood = { drive: 0.4, "late-night": 0.25 }; patch.bpmTarget = 116;
    tags.push("드라이브", "야간"); reply = "밤공기에 어울리는 드라이브 무드로 구성했어요.";
  }
  if (has("신나", "더 빠르", "빠르게", "업", "텐션", "energetic", "faster", "hype")) {
    patch.energyTarget = 95; patch.bpmTarget = 140;
    tags.push("더 빠르게"); reply = "BPM과 에너지를 더 끌어올렸어요.";
  }
  if (has("느리", "차분", "slow", "낮춰", "잔잔")) {
    patch.energyTarget = 45; patch.bpmTarget = 100;
    tags.push("템포 ↓"); reply = "템포와 에너지를 한 단계 낮춰봤어요.";
  }
  if (has("여성", "걸그룹", "female")) {
    patch.vocal = { female: 0.4, male: -0.15 }; tags.push("여성 보컬");
    reply = "여성 보컬 중심으로 유지했어요.";
  }
  if (has("남성", "male", "보이")) {
    patch.vocal = { male: 0.4, female: -0.1 }; tags.push("남성 보컬");
    reply = "남성 보컬 비중을 올렸어요.";
  }
  if (has("가사 없", "가사 적", "instrumental", "연주")) {
    patch.vocal = { inst: 0.45 }; tags.push("연주곡");
    reply = "가사가 적거나 없는 연주 중심으로 바꿨어요.";
  }
  if (has("edm", "이디엠", "댄스", "클럽", "파티", "house", "테크노")) {
    patch.genre = { dance: 0.3, house: 0.25 }; patch.mood = { party: 0.3 };
    tags.push("EDM", "파티"); reply = "클럽/EDM 색을 더 진하게 입혔어요.";
  }
  if (has("인디", "감성", "indie", "어쿠스틱")) {
    patch.genre = { indie: 0.35, "indie pop": 0.3 }; tags.push("인디");
    reply = "인디 감성 트랙을 더 가져왔어요.";
  }
  return { patch, tags, reply };
}

// ---- Merge patch into profile ------------------------------------------------
export function mergePatch(profile: Profile, patch: IntentResult['patch']): Profile {
  const p: Profile = JSON.parse(JSON.stringify(profile));
  for (const key of ["genre", "vocal", "mood"] as const) {
    const patchObj = patch[key];
    if (!patchObj) continue;
    for (const k in patchObj) p[key][k] = (p[key][k] || 0) + patchObj[k];
  }
  if (patch.bpmTarget != null) p.bpmTarget += (patch.bpmTarget - p.bpmTarget) * 0.6;
  if (patch.energyTarget != null) p.energyTarget += (patch.energyTarget - p.energyTarget) * 0.6;
  return p;
}

// ---- Memory tags + fit score -------------------------------------------------
export const TAG_LABELS: Record<string, string> = {
  "genre:electro pop": "일렉트로 팝", "genre:dance": "댄스", "genre:synth wave": "신스웨이브",
  "genre:house": "하우스", "genre:techno": "테크노", "genre:hyperpop": "하이퍼팝",
  "genre:indie": "인디", "genre:indie pop": "인디 팝", "genre:lo-fi": "로파이",
  "genre:ballad": "발라드", "genre:r&b": "R&B", "genre:chillwave": "칠웨이브",
  "vocal:female": "여성 보컬", "vocal:male": "남성 보컬", "vocal:inst": "연주곡", "vocal:mixed": "혼성 보컬",
  "mood:workout": "운동", "mood:drive": "드라이브", "mood:party": "파티",
  "mood:chill": "차분함", "mood:focus": "집중", "mood:late-night": "심야",
};

export function memoryTags(p: Profile): MemoryTag[] {
  const out: MemoryTag[] = [];
  for (const cat of ["genre", "vocal", "mood"] as const) {
    for (const k in p[cat]) {
      const w = p[cat][k];
      if (Math.abs(w) < 0.18) continue;
      out.push({ key: cat + ":" + k, label: TAG_LABELS[cat + ":" + k] || k, weight: w });
    }
  }
  out.push({ key: "bpm", label: "선호 BPM " + Math.round(p.bpmTarget), weight: 0.5, meta: true });
  return out.sort((a, b) => b.weight - a.weight);
}

export function fitScore(p: Profile): number {
  const conf = Math.min(1, p.feedbackCount / 10);
  const likeRatio = p.feedbackCount ? p.likes / p.feedbackCount : 0.5;
  let sharp = 0, cnt = 0;
  for (const cat of ["genre", "vocal", "mood"] as const) {
    for (const k in p[cat]) { sharp += Math.abs(p[cat][k]); cnt++; }
  }
  sharp = cnt ? Math.min(1, sharp / cnt / 0.5) : 0;
  const base = 0.62;
  const val = base + conf * 0.12 + likeRatio * 0.14 + sharp * 0.12;
  return Math.round(Math.max(0.5, Math.min(0.99, val)) * 100);
}

export function coverStyle(track: Track): string {
  const h = track.hue;
  return `linear-gradient(135deg, hsl(${h} 70% 22%) 0%, hsl(${(h + 28) % 360} 78% 38%) 55%, hsl(${(h + 60) % 360} 80% 52%) 100%)`;
}

// ---- Helpers used by other modules -------------------------------------------
export function topKey(obj: Record<string, number>): string | null {
  let best: string | null = null, bv = -Infinity;
  for (const k in obj) if (obj[k] > bv) { bv = obj[k]; best = k; }
  return best;
}

export function byId(id: string): Track | undefined {
  return CATALOG.find((t) => t.id === id);
}
