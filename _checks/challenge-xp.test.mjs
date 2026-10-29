import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('bonus du défi : 5 XP par séance, accordé par un professeur affecté, lisible seulement par les participants', () => {
    const sql = read('_supabase/17_bonus_defi.sql');
    assert.match(sql, /create table if not exists public\.challenge_awards/);
    assert.match(sql, /enable row level security/);
    assert.match(sql, /using \(refonte_private\.can_read_copy\(work_session_id\)\)/);
    assert.match(sql, /grant select on public\.challenge_awards to authenticated/);
    assert.doesNotMatch(sql, /grant (insert|update|delete)[^;]*challenge_awards/);
    assert.match(sql, /refonte_private\.teacher_scope\(s\.etablissement, s\.matiere, s\.classe\)/);
    assert.match(sql, /\+ 5 \* \(select count\(\*\) from defis\)/);
    assert.match(sql, /select distinct s\.etablissement, s\.matiere, s\.classe, s\.seance\s+from public\.challenge_awards/);
});

test('bonus du défi : activé sur le bac à sable seulement, et annoncé seulement quand il est actif', () => {
    assert.match(read('_config_bac_a_sable.yml'), /^bonus_defi: true$/m);
    assert.doesNotMatch(read('_config.yml'), /bonus_defi/);
    assert.match(read('_includes/head.html'), /\{% if site\.bonus_defi %\}<meta name="tifsec-bonus-defi"/);
    assert.match(read('_includes/cours/cours-activites.html'), /\{% if site\.bonus_defi %\}[^{]*Défi réussi = \+5 XP/);
    assert.match(read('assets/js/eleve/student-theme.js'), /meta\[name="tifsec-bonus-defi"\][\s\S]*5 de plus pour chaque petit défi réussi/);
    const page = read('prof/suivi/index.html');
    assert.match(page, /\{% if site\.bonus_defi %\}<section id="tracking-challenge"/);
    const tracking = read('assets/js/prof/prof-tracking.js');
    assert.match(tracking, /refonte_set_challenge_award/);
    assert.match(tracking, /querySelector\('\.course-challenge'\)/);
    assert.match(tracking, /row\.is_history\) \{ clearChallenge\(\)/);
});
