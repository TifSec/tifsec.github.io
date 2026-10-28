import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../assets/js/eleve/student-cards.js', import.meta.url), 'utf8');
const { initStudentCards } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
function harness() {
    const node = () => ({ handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; }, fire(name, event = {}) { this.handlers[name]?.({ preventDefault() {}, ...event }); } });
    const page = node(); page.activeElement = null;
    const cards = Array.from({ length: 4 }, () => {
        const card = node(), summary = node(), close = node(); card.open = false;
        card.contains = target => [card, summary, close].includes(target);
        card.querySelector = selector => selector === 'summary' ? summary : close;
        summary.focus = () => { page.activeElement = summary; card.fire('focusin'); };
        close.focus = () => { page.activeElement = close; card.fire('focusin'); };
        card.summary = summary; card.close = close; return card;
    });
    page.querySelectorAll = () => cards;
    initStudentCards(page); return { cards, page };
}
test('survol et focus seuls ne déclenchent aucune ouverture', () => {
    const { cards } = harness();
    cards[0].fire('pointerenter', { pointerType: 'mouse' }); assert.equal(cards[0].open, false);
    cards[0].summary.focus(); assert.equal(cards[0].open, false);
    cards[0].summary.fire('click'); assert.equal(cards[0].open, true);
    cards[1].fire('pointerenter', { pointerType: 'mouse' }); assert.equal(cards[1].open, false);
    cards[1].summary.fire('click'); assert.equal(cards[0].open, false); assert.equal(cards[1].open, true);
    cards[1].summary.fire('click'); assert.equal(cards[1].open, false);
});

test('tactile : aucun survol artificiel, clic maintient ouvert', () => {
    const { cards } = harness(); cards[0].fire('pointerenter', { pointerType: 'touch' }); assert.equal(cards[0].open, false);
    cards[0].summary.fire('click'); cards[0].fire('pointerleave'); assert.equal(cards[0].open, true);
    cards[0].close.fire('click'); assert.equal(cards[0].open, false);
});
test('clavier : accès au panneau et Échap restaure le focus sans rouvrir', () => {
    const { cards, page } = harness(); cards[0].summary.focus(); assert.equal(cards[0].open, false); cards[0].summary.fire('click'); assert.equal(cards[0].open, true);
    page.fire('keydown', { key: 'Escape' }); assert.equal(cards[0].open, false); assert.equal(page.activeElement, cards[0].summary);
    cards[1].summary.focus(); cards[1].fire('focusout', { relatedTarget: null }); assert.equal(cards[1].open, false);
});
test('clic extérieur ferme une carte maintenue ouverte', () => {
    const { cards, page } = harness(); cards[2].summary.fire('click');
    page.fire('pointerdown', { target: cards[2].close }); assert.equal(cards[2].open, true);
    page.fire('pointerdown', { target: {} }); assert.equal(cards[2].open, false);
});
