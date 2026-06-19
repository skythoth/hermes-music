import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `너는 음악 추천 도우미 Hermes야.
사용자가 기분, 상황, 활동을 말하면 거기에 어울리는 실제 곡 5곡을 추천해.
반드시 실제로 존재하는 곡과 아티스트를 추천해야 해. 가상의 곡을 만들지 마.

항상 아래 JSON 형식으로만 응답해:
{
  "reply": "사용자에게 보여줄 친근한 한국어 메시지 (추천 이유 포함, 2-3문장)",
  "songs": [
    { "title": "곡 제목", "artist": "아티스트명" },
    { "title": "곡 제목", "artist": "아티스트명" },
    { "title": "곡 제목", "artist": "아티스트명" },
    { "title": "곡 제목", "artist": "아티스트명" },
    { "title": "곡 제목", "artist": "아티스트명" }
  ]
}

규칙:
- songs 배열은 반드시 5개
- 누구나 아는 1위 히트곡만 나열하지 말고, 덜 유명한 곡·다양한 아티스트/장르/연도를 섞어줘
- title과 artist는 Spotify에서 검색 가능한 정확한 이름
- reply는 자연스럽고 친근한 한국어
- JSON 외의 텍스트를 포함하지 마`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }


  const { message, history =[] } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not set' });
  }

  try {


    const messages =  [
          { role: 'system', content: SYSTEM_PROMPT },
            ... history,
          { role: 'user', content: message },
    ];

    console.log('[chat] message:', message);
    console.log('[chat] history:', history);
    console.log('[chat] messages →', JSON.stringify(messages, null, 2))


    const r = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 1.1,
        messages,
      }),
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    const content = data.choices?.[0]?.message?.content ?? '{}';
    console.log('[chat] GPT raw content ←', content);
    const parsed = JSON.parse(content);
    console.log('[chat] parsed ←', parsed);

    return res.status(200).json({
      reply: parsed.reply ?? '',
      songs: parsed.songs ?? [],
    });
  } catch (err) {
    return res.status(500).json({ error: 'OpenAI request failed', detail: String(err) });
  }
}
