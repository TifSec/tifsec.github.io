import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const shop = read('_includes/eleve/student-shop.html');
const dashboard = read('assets/js/eleve/student-dashboard.js');
const page = read('eleve/index.html');
const head = read('_includes/head.html');
const themeStyles = read('assets/css/eleve/theme-harmonization.css');
const studentTheme = read('assets/css/eleve/student-theme.css');
const themeWorlds = read('assets/css/eleve/student-theme-worlds.css');
const studentHeader = read('assets/css/eleve/student-header.css');
const shopPreview = read('assets/js/eleve/student-shop-preview.js');
const studentLayout = read('_layouts/eleve.html');

test('la boutique est un aperçu local sans achat ni stockage', () => {
    assert.match(shop, /Maquette — aucune récompense n’est encore activée/);
    assert.match(shop, /les prix et les achats seront définis plus tard/);
    assert.match(shop, /Aucun|ne dépense aucun point/);
    assert.doesNotMatch(shop, /<form\b|supabase|fetch\(|\.insert\(|\.update\(/i);
    assert.equal((shop.match(/class="student-reward-card"/g) || []).length, 15);
    assert.match(shop, /Éliminer une mauvaise réponse/);
    assert.match(shop, /Éliminer deux mauvaises réponses/);
    assert.match(shop, /Fond galaxie/);
    assert.match(shop, /Cartes en relief/);
    assert.match(shop, /Projecteur lumineux/);
    assert.match(shop, /Carte holographique/);
    assert.match(shop, /Aurore animée/);
    assert.match(shop, /Relief en couches/);
    assert.match(shop, /Barre d’XP vivante/);
    assert.match(shop, /Cadre d’avatar/);
    assert.match(read('assets/css/eleve/student-shop.css'), /shop-aurora-preview[\s\S]*prefers-reduced-motion: reduce/);
    assert.match(read('assets/css/eleve/student-shop.css'), /\.shop-effect-card \{[^}]*background:\s*var\(--student-soft(?:,\s*#[^)]+)?\)[^}]*color:\s*var\(--student-text(?:,\s*#[^)]+)?\)/);
    assert.match(themeStyles, /button:not\(\.shop-effect-card\)/);
    assert.match(studentTheme, /button:not\(\.shop-effect-card\):not\(\.avatar-palette-swatch\)/);
    assert.match(themeWorlds, /button:not\(\.shop-effect-card\):not\(\.avatar-palette-swatch\)/);
    assert.match(studentHeader, /button:not\(\.shop-effect-card\):not\(\.avatar-palette-swatch\)/);
    assert.match(shop, /id="student-avatar-preview"[^>]*data-avatar-style=/);
    assert.match(shop, /data-avatar-random/);
    assert.match(shop, /data-xp-demo-add/);
    assert.match(shopPreview, /export function randomAvatar/);
    assert.match(shopPreview, /aria-pressed/);
    assert.match(shopPreview, /Bravo ! Le cadre d’avatar est gagné dans cette démonstration/);
    assert.doesNotMatch(shopPreview, /localStorage|supabase|fetch\(/i);
    assert.match(studentLayout, /student-shop-preview\.js/);
    assert.match(page, /include eleve\/student-shop\.html/);
});

test('la maquette XP est visible au collège et en aperçu local authentifié', () => {
    assert.match(shop, /id="student-card-shop" hidden/);
    assert.match(dashboard, /const isLocalPreview = \['localhost', '127\.0\.0\.1', '\[::1\]'\]\.includes\(window\.location\.hostname\)/);
    assert.match(dashboard, /rewardShop\.hidden = verified\.profile\.etablissement !== 'college' && !isLocalPreview/);
    assert.match(head, /student-shop\.css/);
});
