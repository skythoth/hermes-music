import {
  Home, Search, Sparkles, Plus, Play, Pause, Heart, Ban, SkipForward,
  Send, Bookmark, Music, X, LogOut,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

type P = LucideProps;

const S = 1.75; // default strokeWidth for consistency

export const Icon = {
  home:   (p: P) => <Home size={18} strokeWidth={S} {...p} />,
  search: (p: P) => <Search size={18} strokeWidth={S} {...p} />,
  spark:  (p: P) => <Sparkles size={16} strokeWidth={S} {...p} />,
  plus:   (p: P) => <Plus size={16} strokeWidth={S} {...p} />,
  play:   (p: P) => <Play size={14} strokeWidth={S} {...p} />,
  pause:  (p: P) => <Pause size={14} strokeWidth={S} {...p} />,
  heart:  (p: P) => <Heart size={14} strokeWidth={S} {...p} />,
  ban:    (p: P) => <Ban size={14} strokeWidth={S} {...p} />,
  skip:   (p: P) => <SkipForward size={14} strokeWidth={S} {...p} />,
  send:   (p: P) => <Send size={16} strokeWidth={S} {...p} />,
  save:   (p: P) => <Bookmark size={14} strokeWidth={S} {...p} />,
  music:  (p: P) => <Music size={14} strokeWidth={S} {...p} />,
  x:      (p: P) => <X size={14} strokeWidth={S} {...p} />,
  logout: (p: P) => <LogOut size={14} strokeWidth={S} {...p} />,
};
