
export interface ChatSong {
    title: string;
    artist: string;

}

export interface ChatResult {
    reply: string;
    songs: ChatSong[];
    tags: string[];
}

export interface ChatTurn {
    role: 'system'| 'user' | 'assistant';
    content: string;
}



export const JSON_FORMAT_RULE =  `항상 아래 JSON 형식으로만 응답해 (JSON 외 텍스트 금지):
{
  "reply": "사용자에게 보여줄 친근한 한국어 메시지 (추천 이유 포함, 2-3문장)",
  "songs": [
    { "title": "곡 제목", "artist": "아티스트명" }
  ],
  "tags": ["이번 추천의 핵심 키워드 2~3개 (한국어, 예: 90년대 홍콩영화, 네온 느와르, 감성 발라드)"]
}
규칙:
- songs 배열은 반드시 5개
- tags 배열은 2~3개, 이번 추천의 분위기·테마·장르를 요약하는 짧은 키워드
- 누구나 아는 1위 히트곡만 나열하지 말고, 덜 유명한 곡·다양한 아티스트/장르/연도를 섞어줘
- 같은 대화에서 이미 추천했거나 제외 요청된 곡은 절대 반복하지 마
- title과 artist는 Spotify에서 검색 가능한 정확한 실제 이름 (가상의 곡 금지)
- reply는 자연스럽고 친근한 한국어`;

export function extractJson (content: string) : { reply?:string, songs?:ChatSong[]} {
    try {
        return JSON.parse (content);
    } catch {

        /* 아래에서 {....} 만 추출 실패하면 아무 것도 안함 */
    }

    const s = content.indexOf('{');
    const e = content.lastIndexOf('}');

    if ( s!== -1 && e > s ) {
        try {
            return JSON.parse(content.slice(s, e+1))
        } catch {
            /* 무시 */
        }
    }
    return {};
}

export function toChatResult (parsed: {reply?: string; songs?:ChatSong[]; tags?:string[]}): ChatResult {
    return {
        reply: parsed.reply ?? '',
        songs: Array.isArray(parsed.songs) ? parsed.songs:[],
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    }
}
