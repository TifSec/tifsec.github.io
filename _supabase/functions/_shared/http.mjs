// Outils HTTP communs aux fonctions professeur.
export class AccessError extends Error {
    constructor(status, code) { super(code); this.status = status; this.code = code; }
}
export async function boundedText(response, maximum) {
    if (Number(response.headers.get('content-length')) > maximum) throw new AccessError(503, 'unavailable');
    const reader = response.body?.getReader();
    if (!reader) return '';
    const chunks = [];
    let size = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > maximum) throw new AccessError(503, 'unavailable');
            chunks.push(value);
        }
    } finally { await reader.cancel().catch(() => {}); }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
