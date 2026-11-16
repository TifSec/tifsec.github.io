import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../assets/js/eleve/course-progression.js',import.meta.url),'utf8');
const { nextLessons } = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const profile = { etablissement:'college', classe:'3e' };
const progression = [{ ...profile, matiere:'techno', seances:[{id:'S10R',numero:'S10'},{id:'S11',numero:'S11'}] }];
const lesson = { ...profile, matiere:'techno', seance:'S10R',state:'new' };
test('après S09 en classe, proposer S10 et non le pilote S02', () => {
    const rows = nextLessons(progression,profile,[{...lesson,seance:'S02',state:'finished'},lesson]);
    assert.equal(rows[0].next.id,'S10R'); assert.equal(rows[0].next.numero,'S10');
});
test('remise de S10 : S11 sans attendre une note, sans inventer un lien absent', () => {
    const row = nextLessons(progression,profile,[{...lesson,state:'finished'}])[0];
    assert.equal(row.next.id,'S11'); assert.equal(row.next.lesson,undefined); assert.equal(row.completed,1);
});

test('les cours importés antérieurs à la séance faite en classe restent consultables sans redevenir la prochaine séance', () => {
    const year = [{ ...profile, matiere: 'techno', derniere_seance_en_classe: 'S09', seances: [{ id: 'S01' }, { id: 'S09' }, ...progression[0].seances] }];
    const history = [{ ...lesson, seance: 'S01', state: 'new' }, { ...lesson, seance: 'S09', state: 'new' }];
    let result = nextLessons(year, profile, [...history, lesson])[0];
    assert.equal(result.next.id, 'S10R'); assert.equal(result.completed, 0);
    result = nextLessons(year, profile, [...history, { ...lesson, state: 'finished' }])[0];
    assert.equal(result.next.id, 'S11'); assert.equal(result.next.lesson, undefined); assert.equal(result.completed, 1);
});
test('travail en cours ou rouvert : rester sur la même séance', () => {
    assert.equal(nextLessons(progression,profile,[{...lesson,state:'started'}])[0].next.id,'S10R');
});
test('ancien essai et ancienne classe ne font pas avancer le nouveau parcours', () => {
    assert.equal(nextLessons(progression,profile,[{...lesson,seance:'S10',state:'finished'},lesson])[0].completed,0);
    assert.deepEqual(nextLessons(progression,{...profile,classe:'4e'},[lesson]),[]);
});
test('parcours remis : aucun faux cours suivant ; doublons refusés', () => {
    assert.equal(nextLessons(progression,profile,[{...lesson,state:'finished'},{...lesson,seance:'S11',state:'finished'}])[0].next,null);
    assert.throws(()=>nextLessons([...progression,...progression],profile,[lesson]),/invalid_progression/);
});
