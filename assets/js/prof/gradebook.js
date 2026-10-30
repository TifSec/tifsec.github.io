import { db } from '../bdd/bdd-connect.js';
import { checkSession } from '../auth/auth-session.js';
import { lessonCatalogue } from '../cours/collaboration.js';
import { initialCourseScope } from './course-selection.js';
import { gradebookModel, readGradebook, copyTrackingUrl } from './gradebook-model.js';

export function initGradebook() {
    const root = document.getElementById('teacher-gradebook');
    if (!root || root.dataset.enabled !== 'true') return;
    const node = id => document.getElementById('notes-' + id);
    const subject=node('subject'), schoolClass=node('class'), lesson=node('lesson'), filters=node('filters'), status=node('status');
    let generation=0, reading=0, detailReading=0, actor=null, assignments=[], catalogue=[], model=null, scope=null, timer;
    let classLabels={};
    try { classLabels=JSON.parse(document.getElementById('classes-data')?.textContent || '{}'); } catch {}
    const labels={techno:'Technologie',tim:'TIM',maths:'Mathématiques'};
    const states={missing:'Pas de copie',open:'Copie ouverte',to_grade:'À corriger',reopened:'À recorriger',ambiguous:'Plusieurs copies à vérifier'};
    const text=(tag,value,className)=>{const element=document.createElement(tag);element.textContent=value;if(className)element.className=className;return element;};
    const classKey=row=>row.etablissement+'|'+row.classe;
    const format=value=>Number(value).toLocaleString('fr-FR',{maximumFractionDigits:6});
    const date=value=>{const parsed=new Date(value);return Number.isNaN(parsed.getTime())?'Date indisponible':parsed.toLocaleString('fr-FR');};
    function closeDetail() {++detailReading;node('history').replaceChildren();node('detail').hidden=true;node('detail-title').textContent='';node('detail-status').textContent='';}
    function clear() {++generation;++reading;closeDetail();actor=null;scope=null;model=null;assignments=[];node('table').replaceChildren();node('summary').textContent='';subject.replaceChildren();schoolClass.replaceChildren();lesson.replaceChildren();filters.disabled=true;}
    function options(select,entries) {select.replaceChildren();for(const [value,label]of entries)select.add(new Option(label,value));}
    function classOptions(preferred) {
        const entries=new Map(assignments.filter(row=>row.matiere===subject.value).map(row=>[classKey(row),
            (classLabels[row.etablissement]?.nom || row.etablissement)+' · '+(classLabels[row.etablissement]?.classes?.find(item=>item.id===row.classe)?.nom || row.classe)]));
        options(schoolClass,entries);if(entries.has(preferred))schoolClass.value=preferred;
    }
    function copyLink(copy, item, historical=false) {
        const link=text('a',historical?'Ouvrir la copie actuelle':'Ouvrir la copie');
        link.href=copyTrackingUrl(root.dataset.trackingUrl || '/prof/suivi/',scope,item,copy.id,historical);return link;
    }
    function render() {
        closeDetail();node('table').replaceChildren();
        if (!model) return;
        const lessons=model.lessons.filter(item=>!lesson.value || item.seance===lesson.value);
        if (!lessons.length) {node('table').append(text('p','Aucune séance ou copie disponible pour cet enseignement.'));return;}
        const table=document.createElement('table');table.className='gradebook-table';table.append(text('caption','Notes validées sur 20 — '+(labels[scope.matiere] || scope.matiere)+' · '+scope.classe));
        const head=document.createElement('thead'),titles=document.createElement('tr'),name=text('th','Élève');name.scope='col';titles.append(name);
        for(const item of lessons){const th=text('th',item.seance+' — '+item.titre);th.scope='col';titles.append(th);}head.append(titles);table.append(head);
        const body=document.createElement('tbody');let count=0;
        for(const row of model.rows) {
            const tr=document.createElement('tr'),name=text('th',(row.pupil.prenom+' '+row.pupil.nom).trim());name.scope='row';
            if(row.pupil.former)name.append(text('p','Profil actuellement dans une autre classe','gradebook-kind'));
            else if(row.pupil.enrollment_status==='pending')name.append(text('p','Inscription en attente','gradebook-kind'));
            tr.append(name);
            for(const item of lessons) {
                const cell=row.cells.find(cell=>cell.lesson.seance===item.seance),td=document.createElement('td');
                if(cell.current){count++;td.append(text('span',format(cell.current.total)+' / 20','gradebook-note'),text('p',cell.collective?'Collectif':'Individuel','gradebook-kind'));}
                else td.append(text('p',states[cell.state] || 'Note indisponible'));
                if(cell.copy && item.url)td.append(copyLink(cell.copy,item));
                if(cell.history.length){const button=text('button',cell.current?'Détail et historique':'Corrections précédentes');button.type='button';button.setAttribute('aria-controls','notes-detail');button.setAttribute('aria-label',button.textContent+' — '+row.pupil.prenom+' '+row.pupil.nom+' — '+item.seance);button.addEventListener('click',()=>openHistory(row.pupil,cell));td.append(button);}
                tr.append(td);
            }
            body.append(tr);
        }
        table.append(body);node('table').append(table);
        node('summary').textContent=model.rows.length+' élève(s) · '+lessons.length+' séance(s) · '+count+' note(s) validée(s) affichée(s). Les notes collectives figurent pour chaque participant.';
        if(!model.rows.length)node('summary').textContent='Aucun élève inscrit ni évaluation conservée dans cette classe.';
    }
    async function openHistory(pupil,cell) {
        closeDetail();const current=generation,chosen=detailReading,user=actor;
        node('detail').hidden=false;node('detail-title').textContent=(pupil.prenom+' '+pupil.nom).trim()+' — '+cell.lesson.seance;
        node('detail-title').tabIndex=-1;node('detail-title').focus?.();node('detail').scrollIntoView?.({behavior:'smooth',block:'start'});
        node('detail-status').textContent='Chargement des corrections…';
        try {
            const ids=cell.history.map(item=>item.id),grades=[];
            for(let start=0;start<ids.length;start+=100) {
                const result=await db.from('work_evaluations').select('id,work_session_id,total,marks,validated_at,course_version')
                    .in('id',ids.slice(start,start+100)).order('id').range(0,99);
                if(result.error || !Array.isArray(result.data))throw new Error('history_unavailable');grades.push(...result.data);
            }
            const session=await checkSession();if(current!==generation || chosen!==detailReading)return;
            if(session.status!=='authenticated'||session.user.id!==user||session.profile.role!=='teacher'){clear();status.textContent='Reconnectez-vous pour consulter les notes.';return;}
            if(grades.length!==ids.length || grades.some(grade=>!cell.history.some(expected=>String(expected.id)===String(grade.id)&&String(expected.work_session_id)===String(grade.work_session_id))))throw new Error('history_changed');
            for(const record of cell.history) {
                const grade=grades.find(grade=>String(grade.id)===String(record.id));
                const article=document.createElement('article');article.className='gradebook-correction';
                const active=cell.current && String(cell.current.id)===String(grade.id);
                article.append(text('h3',(active?'Note courante : ':'Ancienne correction : ')+format(grade.total)+' / 20'),text('p',date(grade.validated_at)+' · '+(record.recipient_ids.length>1?'Copie collective':'Copie individuelle')));
                const table=document.createElement('table'),header=document.createElement('tr');header.append(text('th','Question'),text('th','Points'));table.append(header);
                if(!Array.isArray(grade.marks))throw new Error('invalid_marks');
                for(const [index,mark]of grade.marks.entries()) {
                    const row=document.createElement('tr'),title=text('th','Question '+(index+1));title.scope='row';row.append(title,text('td',format(mark.points)+' / '+format(mark.maximum)));table.append(row);
                    if(mark.commentaire){const comment=document.createElement('tr'),td=text('td',mark.commentaire);td.colSpan=2;comment.append(td);table.append(comment);}
                    if(mark.details?.length)for(const [cellIndex,detail]of mark.details.entries()){const line=document.createElement('tr');line.append(text('td','↳ Réponse '+(cellIndex+1)),text('td',format(detail.points)+' / '+format(detail.maximum)));table.append(line);}
                }
                article.append(table);
                const source=model.rows.flatMap(row=>row.cells).find(item=>item.lesson.seance===cell.lesson.seance && item.copy && String(item.copy.id)===String(grade.work_session_id));
                if(cell.lesson.url)article.append(copyLink({id:grade.work_session_id},cell.lesson,!source));
                node('history').append(article);
            }
            node('detail-status').textContent='Les anciennes corrections sont conservées. Le lien vers une copie ouvre ses réponses actuelles, qui ont pu évoluer depuis une ancienne correction.';
        } catch {if(current===generation&&chosen===detailReading){node('history').replaceChildren();node('detail-status').textContent='Impossible de charger les corrections. Actualisez le tableau avant de réessayer.';}}
    }
    async function loadScope() {
        const current=generation,request=++reading;closeDetail();model=null;node('table').replaceChildren();node('summary').textContent='';lesson.replaceChildren();
        scope=assignments.find(row=>row.matiere===subject.value&&classKey(row)===schoolClass.value);
        if(!scope){status.textContent='Choisissez un enseignement parmi vos affectations.';return;}
        const selectedScope=scope,user=actor;status.textContent='Chargement des notes…';
        try {
            const data=await readGradebook(db,selectedScope,{submission:root.dataset.studentSubmission==='true'}),session=await checkSession();
            if(current!==generation||request!==reading)return;
            if(session.status!=='authenticated'||session.user.id!==user||session.profile.role!=='teacher'){clear();status.textContent='Reconnectez-vous avec votre compte professeur.';return;}
            model=gradebookModel({scope:selectedScope,catalogue,...data});
            options(lesson,[['','Toutes les séances'],...model.lessons.map(item=>[item.seance,item.seance+' — '+item.titre])]);lesson.value='';
            render();status.textContent='Tableau chargé. Seules les notes validées sont présentées comme définitives.';
        } catch {if(current===generation&&request===reading)status.textContent='Les notes ne sont pas disponibles. Vérifiez votre connexion puis actualisez.';}
    }
    async function start() {
        clear();const current=generation;status.textContent='Chargement de vos enseignements…';
        try {
            const session=await checkSession();if(current!==generation)return;
            if(session.status!=='authenticated'||session.profile.role!=='teacher'){status.textContent='Connectez-vous avec votre compte professeur.';return;}
            const result=await db.from('teacher_class_assignments').select('etablissement,matiere,classe').eq('teacher_id',session.user.id);
            if(current!==generation)return;if(result.error||!Array.isArray(result.data))throw new Error('scopes_unavailable');
            assignments=result.data;actor=session.user.id;catalogue=lessonCatalogue();
            options(subject,[...new Set(assignments.map(row=>row.matiere))].map(value=>[value,labels[value] || value]));
            const selected=initialCourseScope(assignments,catalogue,new URL(window.location.href).searchParams);
            if(selected)subject.value=selected.matiere;classOptions(selected?classKey(selected):'');filters.disabled=false;await loadScope();
        } catch {if(current===generation)status.textContent='Chargement interrompu. Reconnectez-vous puis réessayez.';}
    }
    subject.addEventListener('change',()=>{classOptions('');loadScope();});schoolClass.addEventListener('change',loadScope);lesson.addEventListener('change',render);
    node('refresh').addEventListener('click',loadScope);node('close').addEventListener('click',closeDetail);
    db.auth.onAuthStateChange(event=>{if(!['SIGNED_OUT','SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED'].includes(event))return;clearTimeout(timer);clear();status.textContent='Connexion modifiée.';if(event!=='SIGNED_OUT')timer=setTimeout(start,0);});
    window.addEventListener('pagehide',clear);window.addEventListener('pageshow',event=>{if(event.persisted)start();});start();
}
initGradebook();
