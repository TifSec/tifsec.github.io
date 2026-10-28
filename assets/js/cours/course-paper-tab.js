export function openCoursePaperTab(source) {
    const sheet = source?.querySelector('.course-paper-sheet');
    if (!sheet) return false;

    const paperWindow = window.open('', '_blank');
    if (!paperWindow) return false;
    paperWindow.opener = null;

    const paperDocument = paperWindow.document;
    paperDocument.open();
    paperDocument.write('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Version papier du cours</title></head><body></body></html>');
    paperDocument.close();

    for (const stylesheet of document.querySelectorAll('link[rel="stylesheet"]')) {
        const link = paperDocument.createElement('link');
        link.rel = 'stylesheet';
        link.href = stylesheet.href;
        paperDocument.head.append(link);
    }

    const container = paperDocument.createElement('main');
    container.id = 'course-paper-version';
    container.className = 'course-paper-version';
    const actions = paperDocument.createElement('div');
    actions.className = 'course-paper-actions';
    const message = paperDocument.createElement('p');
    message.textContent = 'Cette fiche peut être imprimée ou enregistrée en PDF.';
    const print = paperDocument.createElement('button');
    print.type = 'button';
    print.textContent = 'Imprimer / enregistrer en PDF';
    print.addEventListener('click', () => paperWindow.print());
    actions.append(message, print);
    container.append(actions, paperDocument.importNode(sheet, true));
    paperDocument.body.append(container);
    paperDocument.title = sheet.querySelector('h1, h2')?.textContent || 'Version papier du cours';
    return true;
}
