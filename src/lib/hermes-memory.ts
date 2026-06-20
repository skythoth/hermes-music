

export async function rememberPreference (note: string): Promise <void> {

    console.log('[rememberPreference] 보냄 →', note);  

    try {
        const res = await fetch ('/api/memory', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify ({mode: 'remember', note})
        });

        console.log('[rememberPreference] 응답:', res.status);

    } catch (e) {
        console.warn('[rememberPreference] 실패(무시):', e);
    }

}

export async function getTasteSummary(): Promise<string[]> {
    try {
        const res = await fetch ('/api/memory', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify ({mode: 'summary'}),
        });

        if (! res.ok) return [];

        const data = await res.json ();

        console.log('[getTasteSummary] 원본 summary:', data.summary);  

        const tags = (data.summary ?? '').split(/[,\n·]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 5);
        console.log('[getTasteSummary] 파싱된 태그:', tags);

        return tags;

    } catch {
        return [];
    }
}
