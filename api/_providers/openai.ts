import { JSON_FORMAT_RULE, extractJson, toChatResult,
        type ChatResult, type ChatTurn } from './shared.js';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';


const SYSTEM_PROMPT  = ` 너는 음악 추천 도우미야.

사용자가 기분, 상황, 활동을 말하면 거기에 어울리는 실제 곡 5곡을 추천해.
반드시 실제로 존재하는 곡과 아티스트만 추천하고, 가상의 곡은 만들지마.


${JSON_FORMAT_RULE}`;

export async function recommend (message:string, history: ChatTurn[]=[]): Promise<ChatResult> {

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY  not set');

    const messages = [
        {role: 'system', content: SYSTEM_PROMPT },
        ... history,
        {role: 'user', content:message},
    ]

    const r = await fetch (OPENAI_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },

        body: JSON.stringify ( {
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 1.1,
            messages,
        }),
        
    });

    const data = await r.json ();
    if (! r.ok) throw new Error (`OpenAI ${r.status}: ${JSON.stringify(data)}`);

    const content = data.choices?.[0]?.message?.content ?? '{}';
    console.log('[openai] raw <-', content)
    return toChatResult(extractJson(content));
}



