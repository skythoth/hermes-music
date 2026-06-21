export interface ChatSong {
  title: string;
  artist: string;
}

export interface ChatResponse {
  reply: string;
  songs: ChatSong[];
  tags: string[];
}

export interface ChatTurn {
    role: 'user'| 'assistant';
    content: string;
}


export async function askChatGPT(
    message: string, 
    history: ChatTurn[]=[],
    provider?:string,
): Promise<ChatResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, provider }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return {
    reply: data.reply ?? '',
    songs: data.songs ?? [],
    tags: data.tags ?? [],
  };
}
