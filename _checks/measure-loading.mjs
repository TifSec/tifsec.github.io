// Mesures publiques uniquement : aucun compte, jeton de session ou contenu élève.
const urls = [
    'http://127.0.0.1:4000/prof/',
    'http://127.0.0.1:4000/prof/cours/',
    'http://127.0.0.1:4000/assets/vendor/supabase/supabase-2.118.0.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://aqbjykgppbyrzqxlzxuf.supabase.co/auth/v1/health'
];
for (const url of urls) {
    const results = [];
    for (let run = 0; run < 3; run++) {
        const start = performance.now();
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
            const body = await response.arrayBuffer();
            results.push({ ms: Math.round(performance.now() - start), status: response.status, bytes: body.byteLength,
                ...(response.headers.get('x-jsd-version') ? { version: response.headers.get('x-jsd-version') } : {}) });
        } catch (error) { results.push({ failed: error.cause?.code || error.name }); }
    }
    console.log(JSON.stringify({ url, results }));
}
