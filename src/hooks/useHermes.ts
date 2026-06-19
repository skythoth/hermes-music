/**
 * Hermes Music Agent — core state hook + agent logic
 * TODO(A): sendTurn() 내부의 parseIntent+recommend → OpenAI 호출로 교체
 * TODO(B): CATALOG 기반 byId/recommend → Spotify Search 결과로 교체
 * TODO(C): savePlaylist() → Spotify Create Playlist + Add Tracks 로 교체
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  defaultProfile, recommend, applyFeedback, parseIntent, mergePatch,
  memoryTags, fitScore, TAG_LABELS, topKey, CATALOG, byId,
} from '../lib/catalog';
import type { Track, Profile, MemoryTag } from '../lib/catalog';
import type { Playlist } from '../components/Sidebar';
import type { LayoutMode } from '../components/LayoutSwitch';
import { fbLabel } from '../components/TrackRow';
import { askChatGPT } from '../lib/openai';

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

  // TODO(A): This entire function will call OpenAI API instead of local recommend()
  function makeRec(prof: Profile, title: string, tagList: string[], reason: string): RecMessage {
    const tracks = recommend(prof, 4, []);
    return {
      kind: "rec", id: _recSeq++, trackIds: tracks.map((t) => t.id),
      feedback: {}, title, tags: tagList, reason, saved: false,
    };
  }

  // TODO(A): sendTurn will send user text to OpenAI serverless function
  const sendTurn = useCallback( async (userText: string, opts: SendOpts = {}) => {
    setMessages((m) => [...m, { kind: "user", text: userText }]);
    setThinking(true);
    const { patch, tags: intentTags} = parseIntent(userText);
    const merged = opts.profileOverride || mergePatch(profile, patch);

    //setTimeout(() => {

    try {

      const reply = await askChatGPT (userText);
      
      console.log("GPT 응답", reply);

      setProfile(merged);
      const reason = buildReason(merged, intentTags);
      const rec = makeRec(merged, opts.title || "추천 결과", intentTags.length ? intentTags : derivedTags(merged), reason);
      setMessages((m) => [...m, { kind: "agent", text: reply, tags: intentTags }, rec]);
      setThinking(false);

    } catch {
      setMessages ((m) => [...m, {kind: "agent", text:"응답을 가져오지 못했어요"}]);
    } finally {
      setThinking (false);
    }


    //}, 720);
  }, [profile]);

  function onFeedback(recId: number, track: Track, kind: 'like' | 'skip' | 'block') {
    const np = applyFeedback(profile, track, kind);
    setProfile(np);
    pushFeed(`${track.title} · ${fbLabel(kind)}`, kind);

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

  // TODO(C): Replace with Spotify Create Playlist + Add Tracks to Playlist
  function savePlaylist(rec: RecMessage) {
    const tracks = rec.trackIds
      .filter((id) => rec.feedback[id] !== "block")
      .map((id) => byId(id))
      .filter((t): t is Track => t !== undefined);
    const n = playlists.filter((p) => p.byAgent).length + 13;
    const pl: Playlist = { id: "pl-" + Date.now(), name: "내 플레이리스트 #" + n, byAgent: true, tracks, fresh: true };
    setPlaylists((ps) => [pl, ...ps]);
    setMessages((m) => m.map((x) => (x.kind === "rec" && x.id === rec.id ? { ...x, saved: true, savedName: pl.name } : x)));
    showToast(`'${pl.name}' 저장됨 · ${tracks.length}곡`);
  }

  return {
    profile, messages, playlists, setPlaylists, activePlaylist, setActivePlaylist, layout, setLayout,
    thinking, toast, feed, fit, tags, newTagKeys,
    sendTurn, onFeedback, refine, savePlaylist,
  };
}
