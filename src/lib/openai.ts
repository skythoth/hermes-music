
export async function askChatGPT (message: string): Promise<string> {
    const res = await fetch ('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify ({message})

    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Chat failed: ${res.status} ${text}`)

    }

    const data = await res.json();
    return data.reply as string;

}