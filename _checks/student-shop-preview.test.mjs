import test from 'node:test';
import assert from 'node:assert/strict';
import { randomAvatar, initStudentShopPreview } from '../assets/js/eleve/student-shop-preview.js';

class FakeElement {
    constructor(dataset = {}) {
        this.dataset = dataset;
        this.attributes = {};
        this.listeners = {};
        this.style = {};
        this.textContent = '';
    }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    setAttribute(name, value) { this.attributes[name] = value; }
    click() { this.listeners.click?.(); }
    querySelector(selector) { return selector === '[data-xp-demo-fill]' ? this.fill : null; }
}

function previewDocument() {
    const avatar = new FakeElement({ avatarStyle: 'explorateur', avatarPalette: 'lagon', avatarAccessory: 'false' });
    const status = new FakeElement();
    const styles = ['explorateur', 'astronaute', 'inventeur', 'robot'].map(id => new FakeElement({ avatarStyle: id }));
    const palettes = ['lagon', 'soleil', 'foret', 'nebuleuse'].map(id => new FakeElement({ avatarPalette: id }));
    const accessory = new FakeElement();
    const random = new FakeElement();
    const progress = new FakeElement();
    progress.fill = new FakeElement();
    const count = new FakeElement();
    const message = new FakeElement();
    const add = new FakeElement();
    const reset = new FakeElement();
    const nodes = new Map([
        ['student-avatar-preview', avatar], ['avatar-preview-status', status], ['shop-demo-progress', progress],
        ['shop-demo-xp-count', count], ['shop-demo-xp-status', message]
    ]);
    return {
        avatar, status, styles, palettes, accessory, random, progress, count, message, add, reset,
        getElementById: id => nodes.get(id),
        querySelectorAll: selector => selector === 'button[data-avatar-style]' ? styles : selector === 'button[data-avatar-palette]' ? palettes : [],
        querySelector: selector => ({ '[data-avatar-accessory]': accessory, '[data-avatar-random]': random, '[data-xp-demo-add]': add, '[data-xp-demo-reset]': reset })[selector] || null
    };
}

test('le générateur crée seulement des avatars et palettes connus', () => {
    assert.deepEqual(randomAvatar(() => 0), { style: 'explorateur', palette: 'lagon', accessory: false });
    assert.deepEqual(randomAvatar(() => 0.99), { style: 'robot', palette: 'nebuleuse', accessory: true });
});

test('l’atelier change le personnage et simule une récompense sans stockage', () => {
    const ui = previewDocument();
    initStudentShopPreview(ui);
    ui.styles[3].click();
    ui.palettes[1].click();
    ui.accessory.click();
    assert.equal(ui.avatar.dataset.avatarStyle, 'robot');
    assert.equal(ui.avatar.dataset.avatarPalette, 'soleil');
    assert.equal(ui.avatar.dataset.avatarAccessory, 'true');
    assert.equal(ui.styles[3].attributes['aria-pressed'], 'true');

    for (let index = 0; index < 5; index++) ui.add.click();
    assert.equal(ui.progress.attributes['aria-valuenow'], '100');
    assert.equal(ui.progress.dataset.complete, 'true');
    assert.match(ui.message.textContent, /[Aa]ucun point réel n’a été ajouté/);
    ui.reset.click();
    assert.equal(ui.progress.attributes['aria-valuenow'], '0');
});
