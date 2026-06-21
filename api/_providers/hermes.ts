import { JSON_FORMAT_RULE, extractJson, toChatResult,
    type ChatResult, type ChatTurn } from './shared.js';


const SYSTEM_PROMPT = `너는 사용자의 음악 취향을 기억하는 에이전트 Hermes 야.
지금까지 학습한 이 사용자의 취향(좋아요/제외한 곡, 선호 장르·분위기)을 떠올려서
그에 맞는 실제 곡 5 곡을 추천해. 가상의 곡은 만들지 마.
가능하면 reply 에 "지난 취향을 말해주고 이 취향을 반영했다"는 점을 자연 스럽게 언급해.

${JSON_FORMAT_RULE}`;

export async function recommend (message: string, history: ChatTurn[]=[]): Promise <ChatResult> {
    const base = process.env.HERMES_BASE_URL; 
    const apiKey = process.env.HERMES_API_KEY;

    if (!base) throw new Error('HERMES_BASE_URL not set')

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT},
        ... history,
        { role: 'user', content: message},
    ];

    const r = await fetch (`${base}/chat/completions`, {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ... (apiKey? {Authorization: `Bearer ${apiKey}`}: {})
        },
        body: JSON.stringify ( {
            model: process.env.HERMES_MODEL || 'hermes-music-agent',
            temperature: 1.1,
            messages,
        }),
    });

    const data = await r.json ();
    if (! r.ok) throw new Error (`Hermes ${r.status}: ${JSON.stringify(data)}`);

    const content = data.choices?.[0]?.message?.content ?? '{}';
    console.log ('[hermes] raw <-', content);
    
    return toChatResult(extractJson(content));
}

export async function chatPlain (message: string): Promise<string> {



    const base = process.env.HERMES_BASE_URL;
    const apiKey = process.env.HERMES_API_KEY;

    if (!base) throw new Error ('HERMES_BASE_URL not set');

    console.log('[chatPlain] Hermes에 보냄 →', message);

    const r = await fetch (`${base}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ... (apiKey ? {Authorization: `Bearer ${apiKey}`}: {}), 
        }, 
        body: JSON.stringify ( {
            model: process.env.HERMES_MODEL || 'hermes-music-agent',
            messages: [{ role:'user', content: message}]
        }),
    });

    const data = await r.json ();


    if (!r.ok) throw new Error (`Hermes ${r.status}: ${JSON.stringify(data)}`);

    const content = data.choices?.[0]?.message?.content ?? '';
    console.log('[chatPlain] Hermes 응답 ←', content); 

    return content;

}
