export interface ChatSong {
  title: string;
  artist: string;
}

export interface ChatResponse {
  reply: string;
  songs: ChatSong[];
}

export async function askChatGPT(message: string): Promise<ChatResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return {
    reply: data.reply ?? '',
    songs: data.songs ?? [],
  };
}
