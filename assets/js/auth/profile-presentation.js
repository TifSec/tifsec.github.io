// Présentation seulement : les droits restent vérifiés par les contrôles existants.
export function profileDetails(profile, schools) {
    const school = schools[profile.etablissement];
    const schoolClass = school?.classes?.find(item => item.id === profile.classe);
    const subjects = { techno: 'Technologie', tim: 'TIM', maths: 'Mathématiques' };
    return {
        matieres: [...new Set(schoolClass?.matieres || [])].map(id => subjects[id]).filter(Boolean).join(' · '),
        etablissement: school?.nom || profile.etablissement || 'Non renseigné',
        classe: schoolClass?.nom || profile.classe || 'Non renseignée',
        validation: profile.enrollment_status === 'pending' ? 'En attente de validation par ton professeur. Recharge cette page après validation.' :
            profile.enrollment_status === 'approved' ? 'Inscription validée' : 'Compte existant — accès conservé'
    };
}

export function renderProfile(profile, { identity, root, schools }) {
    if (identity) identity.textContent = profile ? ((profile.prenom || '') + ' ' + (profile.nom || '')).trim() : '';
    const details = profile ? profileDetails(profile, schools) : {};
    root.querySelectorAll('[data-profile-field]').forEach(field => {
        field.textContent = details[field.dataset.profileField] || '';
    });
}
