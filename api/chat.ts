
import type {VercelRequest, VercelResponse} from '@vercel/node';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';



export default async function handler (req:VercelRequest, res: VercelResponse) {

        if (req.method !== 'POST') {
            return res.status(405).json ({error:'Method not allowed'})
        }


        const {message} = req.body;

        if (!message) {
            return res.status(400).json({error:'Missing message'})
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json ({error:'OPENAI_API_KEY not set'})
        }

        try {
            const r = await fetch (OPENAI_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization:`Bearer ${apiKey}`,
                },

                body: JSON.stringify ({
                    model: 'gpt-4o-mini',
                    messages: [
                        {role: 'system', content:'너는 음악 추천 도우미 Hermes 야, 한국어로 답해'},
                        {role: 'user', content:message},
                    ],
                }),
            
            });

            const data = await r.json();
            if (!r.ok) return res.status (r.status).json(data);

            const reply = data.choices?.[0]?.message?.content ?? '';
            return res.status (200).json ({reply})

        } catch (err) {
            return res.status(500).json ({error:'OpenAI request failed', detail: String(err)})

        }
    
}