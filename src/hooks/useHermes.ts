/**
 * Hermes Music Agent — core state hook + agent logic
 * TODO(A): sendTurn() 내부의 parseIntent+recommend → OpenAI 호출로 교체
 * TODO(B): CATALOG 기반 byId/recommend → Spotify Search 결과로 교체
 * TODO(C): savePlaylist() → Spotify Create Playlist + Add Tracks 로 교체
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  defaultProfile, recommend, applyFeedback, parseIntent, mergePatch,
  memoryTags, fitScore, TAG_LABELS, topKey, CATALOG, byId, registerTrack,
} from '../lib/catalog';
import type { Track, Profile, MemoryTag } from '../lib/catalog';
import type { Playlist } from '../components/Sidebar';
import type { LayoutMode } from '../components/LayoutSwitch';
import { fbLabel } from '../components/TrackRow';
import { askChatGPT, type ChatSong } from '../lib/openai';
import { getAccessToken } from '../lib/spotify-auth';
import { getCurrentUser, searchTrack, createPlaylist, addTracksToPlaylist, type SpotifyTrackItem } from '../lib/spotify-api';

import { rememberPreference, getTasteSummary } from '../lib/hermes-memory';


// ---- Message types -----------------------------------------------------------
export interface AgentMessage {
  kind: 'agent';
  text: string;
  intro?: boolean;
  tags?: string[];
}

export interface UserMessage {
  kind: 'user';
  text: string;
}

export interface RecMessage {
  kind: 'rec';
  id: number;
  trackIds: string[];
  feedback: Record<string, 'like' | 'skip' | 'block'>;
  title: string;
  tags: string[];
  reason: string;
  saved: boolean;
  savedName?: string;
  adjusted?: number;
}

export type Message = AgentMessage | UserMessage | RecMessage;

export interface FeedItem {
  label: string;
  kind: 'like' | 'skip' | 'block';
  t: number;
}

// ---- Exported state shape ----------------------------------------------------
export interface HermesState {
  profile: Profile;
  messages: Message[];
  playlists: Playlist[];
  activePlaylist: string | null;
  setActivePlaylist: (id: string | null) => void;
  layout: LayoutMode;
  setLayout: (v: LayoutMode) => void;
  thinking: boolean;
  toast: string | null;
  feed: FeedItem[];
  fit: number;
  tags: MemoryTag[];
  newTagKeys: string[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
  sendTurn: (text: string, opts?: SendOpts) => void;
  onFeedback: (recId: number, track: Track, kind: 'like' | 'skip' | 'block') => void;
  refine: (label: string, override?: Record<string, unknown>) => void;
  savePlaylist: (rec: RecMessage) => void;
  hermesTaste: string[];
  refreshHermesTaste: () => void;
  provider: 'openai' | 'hermes';                       
  setProvider: (p: 'openai' | 'hermes') => void;       
}

interface SendOpts {
  title?: string;
  profileOverride?: Profile;
}

let _recSeq = 1;

// ---- Helpers -----------------------------------------------------------------
function derivedTags(p: Profile): string[] {
  const out: string[] = [];
  const g = topKey(p.genre); if (g) out.push(TAG_LABELS["genre:" + g] || g);
  const m = topKey(p.mood); if (m) out.push(TAG_LABELS["mood:" + m] || m);
  const v = topKey(p.vocal); if (v && p.vocal[v] > 0.2) out.push(TAG_LABELS["vocal:" + v] || v);
  return out.slice(0, 3);
}

function buildReason(p: Profile, _intentTags: string[]): string {
  const bpm = Math.round(p.bpmTarget);
  const g = TAG_LABELS["genre:" + topKey(p.genre)] || "선호 장르";
  const m = TAG_LABELS["mood:" + topKey(p.mood)] || "분위기";
  const likeNote = p.likes ? `좋아요 ${p.likes}건` : "초기 취향";
  return `${likeNote} 기준으로 ${g}·${m} 색을 반영했고, 목표 BPM은 약 ${bpm}으로 맞췄어요. 제외한 곡의 분위기 태그는 추천 점수를 낮춰 반영합니다.`;
}

// ---- Hook --------------------------------------------------------------------
export function useHermes(): HermesState {
  const [profile, setProfile] = useState<Profile>(() => defaultProfile());
  const [messages, setMessages] = useState<Message[]>([
    { kind: "agent", text: "안녕하세요, Hermes예요. 지금 기분이나 상황을 말해주면 거기에 맞는 곡을 골라올게요. 추천에 좋아요·스킵·제외를 누를수록 취향을 더 정확히 기억해요.", intro: true },
  ]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<string | null>(null);
  const [layout, setLayout] = useState<LayoutMode>("list");
  const [thinking, setThinking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [newTagKeys, setNewTagKeys] = useState<string[]>([]);
  const prevTagKeys = useRef(new Set(memoryTags(defaultProfile()).map((t) => t.key)));

  const fit = fitScore(profile);
  const tags = memoryTags(profile);

  // detect newly-added tags → pulse animation
  useEffect(() => {
    const now = new Set(tags.map((t) => t.key));
    const added = [...now].filter((k) => !prevTagKeys.current.has(k));
    if (added.length) {
      setNewTagKeys(added);
      const id = setTimeout(() => setNewTagKeys([]), 1600);
      prevTagKeys.current = now;
      return () => clearTimeout(id);
    }
    prevTagKeys.current = now;
  }, [tags.map((t) => t.key).join(",")]);



  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }

  function pushFeed(label: string, kind: 'like' | 'skip' | 'block') {
    setFeed((f) => [{ label, kind, t: Date.now() }, ...f].slice(0, 6));
  }

  /** SpotifyTrackItem → catalog Track 변환 후 레지스트리에 등록 */
  function spotifyToTrack(sp: SpotifyTrackItem): Track {
    const t: Track = {
      id: sp.id,
      title: sp.name,
      artist: sp.artists.map((a) => a.name).join(', '),
      album: sp.album.name,
      bpm: 120,
      genre: 'pop',
      vocal: 'mixed',
      energy: 70,
      moods: [],
      hue: Math.floor(Math.random() * 360),
      imageUrl: sp.album.images?.[0]?.url,
      spotifyUri: sp.uri,
    };
    registerTrack(t);
    return t;
  }

  /** OpenAI 추천 곡들을 Spotify에서 검색하여 트랙 ID 배열 반환 */
  async function searchSongsOnSpotify(songs: ChatSong[]): Promise<string[]> {
    const token = getAccessToken();
    if (!token) return [];

    const results = await Promise.all(
      songs.map((s) => searchTrack(`${s.title} ${s.artist}`, token))
    );

    const trackIds: string[] = [];
    for (const sp of results) {
      if (sp) {
        spotifyToTrack(sp);
        trackIds.push(sp.id);
      }
    }
    return trackIds;
  }

  const lastSongsRef = useRef<string[]>([]);

  const [provider, setProvider] = useState <'openai'| 'hermes'> ('hermes');



  const sendTurn = useCallback(async (userText: string, opts: SendOpts = {}) => {
    setMessages((m) => [...m, { kind: "user", text: userText }]);
    setThinking(true);
    const { patch, tags: intentTags } = parseIntent(userText);
    const merged = opts.profileOverride || mergePatch(profile, patch);

    try {

      const prev = lastSongsRef.current;
      const history = prev.length
        ? [{ role: 'assistant' as const, content: `방금 이 곡들을 추천했어: ${prev.join(', ')}` }]
        : [];


      const { reply, songs, tags: aiTags } = await askChatGPT(userText, history, provider);
      console.log('[Hermes] GPT reply:', reply);
      console.log('[Hermes] GPT songs:', songs);
      console.log('[Hermes] GPT tags:', aiTags);

      // Spotify에서 실제 트랙 검색
      let trackIds: string[];
      if (songs.length > 0) {
        trackIds = await searchSongsOnSpotify(songs);
        console.log('[Hermes] Spotify trackIds:', trackIds);
        console.log('[Hermes] Spotify tracks:', trackIds.map((id) => byId(id)));
      } else {
        // fallback: OpenAI가 곡을 안 줬으면 로컬 추천
        trackIds = recommend(merged, 4, []).map((t) => t.id);
        console.log('[Hermes] Fallback local trackIds:', trackIds);
      }

      lastSongsRef.current = trackIds
      .map((id) => byId(id))
      .filter((t): t is Track => !!t)
      .map((t) => `${t.title} - ${t.artist}`);


      setProfile(merged);
      const rec: RecMessage = {
        kind: "rec",
        id: _recSeq++,
        trackIds,
        feedback: {},
        title: opts.title || "추천 결과",
        tags: aiTags.length ? aiTags : intentTags.length ? intentTags : derivedTags(merged),
        reason: reply,
        saved: false,
      };
      console.log('[Hermes] RecMessage:', rec);

      setMessages((m) => [...m, { kind: "agent", text: reply, tags: intentTags }, rec]);
    } catch {
      setMessages((m) => [...m, { kind: "agent", text: "응답을 가져오지 못했어요" }]);
    } finally {
      setThinking(false);
    }
  }, [profile, provider]);

  function onFeedback(recId: number, track: Track, kind: 'like' | 'skip' | 'block') {
    const np = applyFeedback(profile, track, kind);
    setProfile(np);
    pushFeed(`${track.title} · ${fbLabel(kind)}`, kind);

    if (provider === 'hermes') { 
      console.log('[onFeedback] 피드백:', track.title, kind);
      rememberPreference(
        `사용자가 "${track.title} - ${track.artist}"(${track.genre})를 ` +
        `${kind === 'like' ? '좋아함' : kind === 'skip' ? '건너뜀' : '제외함'}.`
      );
    }


    setMessages((msgs) => msgs.map((msg) => {
      if (msg.kind !== "rec" || msg.id !== recId) return msg;
      const rec = msg as RecMessage;
      const feedback = { ...rec.feedback, [track.id]: kind };
      let ids = rec.trackIds.slice();
      if (kind === "block") ids = ids.filter((id) => id !== track.id);
      const liked = ids.filter((id) => feedback[id] === "like");
      const rest = ids.filter((id) => feedback[id] !== "like");
      const ranked = recommend(np, 12, []).map((t) => t.id);
      rest.sort((a, b) => ranked.indexOf(a) - ranked.indexOf(b));
      ids = [...liked, ...rest];
      const present = new Set(ids);
      for (const t of recommend(np, 12, [])) {
        if (ids.length >= 4) break;
        if (!present.has(t.id) && np.seen[t.id] !== "block") { ids.push(t.id); present.add(t.id); }
      }
      ids = ids.slice(0, 4);
      return { ...rec, trackIds: ids, feedback, reason: buildReason(np, []), adjusted: (rec.adjusted || 0) + 1 };
    }));
  }

  function refine(label: string, override?: Record<string, unknown>) {
    sendTurn(label, override ? { profileOverride: mergePatch(profile, override as Parameters<typeof mergePatch>[1]) } : {});
  }

  async function savePlaylist(rec: RecMessage) {
    const token = getAccessToken();
    if (!token) {
      showToast('로그인이 필요해요');
      return;
    }

    const tracks = rec.trackIds
      .filter((id) => rec.feedback[id] !== "block")
      .map((id) => byId(id))
      .filter((t): t is Track => t !== undefined);

    // spotifyUri가 있는 트랙만 저장 대상
    const uris = tracks
      .map((t) => t.spotifyUri)
      .filter((uri): uri is string => !!uri);

    if (uris.length === 0) {
      showToast('저장할 곡이 없어요');
      return;
    }

    showToast('Spotify에 저장 중…');

    const n = playlists.filter((p) => p.byAgent).length + 1;
    const plName = rec.tags.length > 0 ? `Hermes · ${rec.tags.join(' · ')}` : `Hermes #${n}`;

    try {
      // 1. Spotify에 새 플레이리스트 생성
      const user = await getCurrentUser(token);
      const created = await createPlaylist(user.id, plName, token);

      // 2. 트랙 추가 (이미 확보된 URI 사용)
      await addTracksToPlaylist(created.id, uris, token);

      // 3. UI 반영 (Spotify 저장 성공)
      const pl: Playlist = {
        id: created.id,
        name: created.name,
        byAgent: true,
        tracks,
        fresh: true,
        trackCount: uris.length,
      };
      setPlaylists((ps) => [pl, ...ps]);
      setMessages((m) => m.map((x) =>
        (x.kind === "rec" && x.id === rec.id ? { ...x, saved: true, savedName: created.name } : x)
      ));
      showToast(`'${created.name}' Spotify에 저장됨 · ${uris.length}곡`);
    } catch (err) {
      console.error('savePlaylist Spotify error:', err);
      // Spotify 실패 시 로컬 저장 fallback
      const pl: Playlist = {
        id: "pl-" + Date.now(),
        name: plName,
        byAgent: true,
        tracks,
        fresh: true,
        trackCount: tracks.length,
      };
      setPlaylists((ps) => [pl, ...ps]);
      setMessages((m) => m.map((x) =>
        (x.kind === "rec" && x.id === rec.id ? { ...x, saved: true, savedName: plName } : x)
      ));
      showToast(`'${plName}' 로컬 저장됨 · ${tracks.length}곡 (Spotify 연동 실패)`);
    }
  }

  const [hermesTaste, setHermesTaste] = useState<string[]>([]);
  const refreshHermesTaste = useCallback (async () => {

    console.log('[refreshHermesTaste] 조회 시작');
    const tags = await getTasteSummary();
        console.log('[refreshHermesTaste] 받은 태그:', tags);      
    setHermesTaste(tags);

  }, []);

  return {
    profile, messages, playlists, setPlaylists, activePlaylist, setActivePlaylist, layout, setLayout,
    thinking, toast, feed, fit, tags, newTagKeys,
    sendTurn, onFeedback, refine, savePlaylist,
    hermesTaste, refreshHermesTaste,
    provider, setProvider, 
  };
}
