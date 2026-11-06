/* ========== ÉCRITURES ORDONNÉES ET ÉTAT GLOBAL DE SAUVEGARDE ========== */

export function createAnswerBuffer({ keys, answers, save, onStatus, delay = 750 }) {
    const states = new Map(keys.map(key => [key, { value: "", saved: "", revision: null, error: null }]));
    for (const answer of answers) {
        const state = states.get(answer.key);
        if (state) {
            state.value = answer.value;
            state.saved = answer.value;
            state.revision = answer.revision;
        }
    }
    let disposed = false;
    let writing = null;
    let timer;
    const dirty = state => state.value !== state.saved;

    function status() {
        const all = [...states.values()];
        if (all.some(state => state.error === "conflict")) return "conflict";
        if (all.some(state => state.error)) return "error";
        if (writing) return "saving";
        return all.some(dirty) ? "pending" : "saved";
    }
    function notify() {
        if (!disposed) onStatus(status());
    }

    async function drain() {
        while (!disposed) {
            const entry = [...states.entries()].find(([, state]) => dirty(state) && !state.error);
            if (!entry) break;
            const [key, state] = entry;
            const value = state.value;
            try {
                const answer = await save(key, value, state.revision);
                if (disposed) break;
                state.saved = value;
                state.revision = answer.revision;
            } catch (error) {
                if (disposed) break;
                state.error = error.code === "conflict" ? "conflict" : "save_failed";
            }
            notify();
        }
    }

    function flush() {
        clearTimeout(timer);
        if (disposed) return Promise.resolve();
        if (writing) return writing;
        // Différer le départ pour que writing soit défini avant la première notification.
        writing = Promise.resolve().then(drain).finally(() => {
            writing = null;
            notify();
        });
        notify();
        return writing;
    }

    return {
        value(key) { return states.get(key)?.value || ""; },
        revisions() {
            return [...states.entries()].filter(([, state]) => state.revision !== null)
                .map(([cle, state]) => ({ cle, revision: String(state.revision) }))
                .sort((a,b) => a.cle < b.cle ? -1 : a.cle > b.cle ? 1 : 0);
        },
        adopt(answers) {
            if (disposed || writing || [...states.values()].some(state => dirty(state) || state.error)) return false;
            for (const [key, state] of states) {
                const answer = answers.find(row => row.key === key);
                state.value = state.saved = answer?.value || "";
                state.revision = answer?.revision ?? null;
            }
            return true;
        },
        edit(key, value) {
            const state = states.get(key);
            if (disposed || !state || value === state.value) return;
            state.value = value;
            // Une erreur ou un conflit reste explicite jusqu’à une action de reprise.
            clearTimeout(timer);
            timer = setTimeout(flush, delay);
            notify();
        },
        flush,
        retry() {
            for (const state of states.values()) {
                if (state.error !== "conflict") state.error = null;
            }
            return flush();
        },
        hasUnsaved() { return Boolean(writing) || [...states.values()].some(state => dirty(state) || state.error); },
        dispose() {
            disposed = true;
            clearTimeout(timer);
            states.clear();
        }
    };
}
