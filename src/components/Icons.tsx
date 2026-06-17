import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

export const Icon = {
  home: (p: P) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></svg>),
  search: (p: P) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>),
  spark: (p: P) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...p}><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /></svg>),
  plus: (p: P) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14" /></svg>),
  play: (p: P) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}><path d="M7 4l13 8-13 8z" /></svg>),
  heart: (p: P) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M12 21s-7.5-4.6-10-9C.5 9 2 5 5.5 5 8 5 9.5 7 12 9c2.5-2 4-4 6.5-4C22 5 23.5 9 22 12c-2.5 4.4-10 9-10 9z" /></svg>),
  ban: (p: P) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></svg>),
  skip: (p: P) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}><path d="M5 4l10 8-10 8z" /><rect x="17" y="4" width="3" height="16" rx="1" /></svg>),
  send: (p: P) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...p}><path d="M3 11l18-8-8 18-2.5-7.5z" /></svg>),
  save: (p: P) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>),
};
