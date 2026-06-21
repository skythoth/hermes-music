
import type {VercelRequest, VercelResponse} from '@vercel/node';
import {chatPlain} from './_providers/hermes.js'


export default async function handler (req: VercelRequest, res:VercelResponse) {

    if ( req.method !== 'POST') return res.status (405).json ({error: 'Method not allowed'});

    const { mode, note} = req.body;

    try {
        if (mode === 'remember') {

            await chatPlain (
                `다음은 사용자의 음악 취향 정보야, 추천은 하지 말고 기억만 해둬, 다음 추천 때 반영해: ${note}`
            );
            console.log('[memory] remember 완료'); 

            return res.status (200).json ({ok:true})

        }
        if (mode === 'summary') {
            const reply = await chatPlain (
                '지금까지 기억하는 이 사용자의 음악 취향을 한국 키워드 5개로만, 쉼표로 구분해 짤게 말해줘, 설명 문장 없이 키워드만.'
            )
            console.log('[memory] summary 결과:', reply);

            return res.status(200).json ( {summary: reply})
        };

        return res.status (200).json ({error: 'unkown mode'});

    } catch (err) {

        console.error('[memory] 에러:', err);

        return res.status(500).json ({error: 'memory failed', detail:String(err)})
    }


}