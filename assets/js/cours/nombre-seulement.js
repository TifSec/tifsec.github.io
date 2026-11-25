// Champ « Résultat » : on n'y garde qu'un nombre (chiffres, une virgule, un signe moins, espaces).
// Écoute en phase de capture : la valeur est nettoyée avant l'enregistrement de la réponse.
export function nombreSeulement(texte) {
    let valeur = String(texte).replace(/\./g, ',').replace(/[^0-9,\- −]/g, '');
    const signe = /^\s*[-−]/.test(valeur) ? '−' : '';
    valeur = valeur.replace(/[-−]/g, '');
    const virgule = valeur.indexOf(',');
    if (virgule >= 0) valeur = valeur.slice(0, virgule + 1) + valeur.slice(virgule + 1).replace(/,/g, '');
    return signe + valeur.replace(/^\s+/, '');
}
document.addEventListener('input', event => {
    const champ = event.target;
    if (!(champ instanceof HTMLInputElement) || !champ.hasAttribute('data-nombre-seulement')) return;
    const propre = nombreSeulement(champ.value);
    if (propre !== champ.value) {
        const fin = champ.selectionEnd ?? propre.length;
        const decalage = champ.value.length - propre.length;
        champ.value = propre;
        try { champ.setSelectionRange(Math.max(0, fin - decalage), Math.max(0, fin - decalage)); } catch {}
        champ.classList.add('cours-resultat-refus');
        setTimeout(() => champ.classList.remove('cours-resultat-refus'), 600);
    }
}, true);
