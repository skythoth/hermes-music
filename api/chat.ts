import type { VercelRequest, VercelResponse } from '@vercel/node';

import { recommend as openai } from './_providers/openai';
import { recommend as hermes } from './_providers/hermes';



export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }


  const { message, history =[], provider: bodyProvider } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }

  const provider = (bodyProvider|| process.env.AI_PROVIDER || 'openai').toLowerCase();
  console.log('[chat] provider:', provider, '|message:', message);
  console.log('[chat] history:', history)
  
  try {

   
    const result = provider === 'hermes'
      ? await hermes (message, history)
      : await openai (message, history);
    
    console.log ('[chat] result <-', result);
    return res.status(200).json ({... result, provider});

  } catch (err) {
    return res.status (500).json ({error:'AI request failed', provider, detail:String(err)});

  }
  

    
}
