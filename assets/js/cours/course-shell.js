import { db } from '../bdd/bdd-connect.js';
import { checkSession } from '../auth/auth-session.js';
import { initLogout } from '../auth/auth-logout.js';
import { renderProfile } from '../auth/profile-presentation.js';

export function initCourseShell() {
    const header = document.getElementById('course-header');
    if (!header) return;
    const identity = document.getElementById('course-header-identity');
    const welcome = document.getElementById('course-welcome');
    const logout = document.getElementById('course-logout');
    const login = document.getElementById('course-login');
    const button = document.getElementById('course-group-toggle');
    const panel = document.getElementById('course-collaboration');
    const close = document.getElementById('course-group-close');
    const heading = document.getElementById('course-group-heading');
    const controls = document.getElementById('group-controls');
    const select = document.getElementById('group-copy');
    const badge = document.getElementById('course-copy-kind');
    let canCollaborate = false;
    let revision = 0;
    let timer;

    function showGroups(open, focus = false) {
        panel.hidden = !open;
        button.setAttribute('aria-expanded', String(open));
        if (focus) (open ? heading : button).focus();
    }
    function updateGroupState() {
        const available = canCollaborate && !controls.hidden;
        button.hidden = !available;
        badge.hidden = !available;
        if (!available) { showGroups(false); badge.textContent = ''; return; }
        badge.textContent = select.value === '__history__' ? 'Historique individuel' :
            select.value ? select.selectedOptions?.[0]?.textContent || 'Copie collective' : 'Travail individuel';
    }
    function clear() {
        renderProfile(null, { root: header, identity, schools: {} });
        welcome.hidden = true;
        logout.hidden = true;
        login.hidden = false;
        canCollaborate = false;
        updateGroupState();
    }
    async function refresh() {
        const current = ++revision;
        clear();
        try {
            const session = await checkSession();
            if (current !== revision || session.status !== 'authenticated') return;
            const schools = JSON.parse(document.getElementById('classes-data')?.textContent || '{}');
            renderProfile(session.profile, { root: header, identity, schools });
            welcome.hidden = false;
            header.querySelector('.student-profile').hidden = session.profile.role !== 'student';
            logout.hidden = false;
            login.hidden = true;
            canCollaborate = session.profile.role === 'student' && ['approved', 'legacy'].includes(session.profile.enrollment_status) &&
                panel.dataset.enabled === 'true';
            updateGroupState();
        } catch { if (current === revision) clear(); }
    }
    button.addEventListener('click', () => { if (!button.hidden) showGroups(panel.hidden, true); });
    close.addEventListener('click', () => { showGroups(false, true); });
    panel.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); showGroups(false, true); }
    });
    select.addEventListener('change', updateGroupState);
    const observer = new MutationObserver(updateGroupState);
    observer.observe(controls, { attributes: true, attributeFilter: ['hidden'] });
    observer.observe(select, { childList: true, subtree: true });

    const steps = document.getElementById('course-step-list');
    const mobile = window.matchMedia('(max-width: 760px)');
    const resize = () => { if (steps) steps.open = !mobile.matches; };
    resize();
    mobile.addEventListener('change', resize);
    initLogout('course-logout');
    db?.auth.onAuthStateChange(event => {
        if (!['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) return;
        ++revision;
        clearTimeout(timer);
        clear();
        if (event !== 'SIGNED_OUT') timer = setTimeout(refresh, 0);
    });
    window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
    refresh();
    return { refresh, clear, showGroups, updateGroupState };
}

initCourseShell();
