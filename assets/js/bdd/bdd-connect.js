/* ========== CONNEXION SUPABASE ========== */

// Adresse et clé publique lues dans la page (générées depuis _config.yml) :
// le même code sert au site des élèves (vraie base) et au bac à sable (base de test).
const setting = name => globalThis.document?.querySelector?.('meta[name="' + name + '"]')?.content || '';
const SUPABASE_URL = setting('supabase-url');
const SUPABASE_PUBLISHABLE_KEY = setting('supabase-publishable-key');

export const db = window.supabase?.createClient && SUPABASE_URL.startsWith('https://') && SUPABASE_PUBLISHABLE_KEY ? window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
) : null;

// Supabase peut réémettre SIGNED_IN au retour sur un onglet déjà connecté.
// Garder les vraies transitions, sans reconstruire tous les écrans pour le même compte.
export function distinctAccountEvents(callback) {
    let currentUser = null;
    return (event, session) => {
        const nextUser = session?.user?.id || null;
        if (event === 'SIGNED_IN' && nextUser && nextUser === currentUser) return;
        if (['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) currentUser = nextUser;
        callback(event, session);
    };
}

if (db) {
    const subscribe = db.auth.onAuthStateChange.bind(db.auth);
    db.auth.onAuthStateChange = callback => subscribe(distinctAccountEvents(callback));
}
