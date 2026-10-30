import { quadraticState } from './quadratic-model.js';

export function mountCourseGraphs(root) {
    for (const box of root.querySelectorAll('[data-course-graph]')) {
        if (box.dataset.mounted) continue;
        const coefficients = { a: Number(box.dataset.a), b: Number(box.dataset.b), c: Number(box.dataset.c) };
        const xmin = Number(box.dataset.xMin), xmax = Number(box.dataset.xMax);
        const ymin = Number(box.dataset.yMin), ymax = Number(box.dataset.yMax);
        if (![...Object.values(coefficients), xmin, xmax, ymin, ymax].every(Number.isFinite) || xmin >= xmax || ymin >= ymax) continue;
        const svg = box.querySelector('svg'), slider = box.querySelector('input'), output = box.querySelector('output');
        const X = x => 58 + (x - xmin) / (xmax - xmin) * 572;
        const Y = y => 316 - (y - ymin) / (ymax - ymin) * 270;
        const element = (tag, attrs, label) => {
            const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
            for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
            if (label !== undefined) node.textContent = label;
            return node;
        };
        svg.replaceChildren();
        const clipId = 'plot-' + Math.random().toString(36).slice(2);
        const defs = element('defs', {}), clip = element('clipPath', { id: clipId });
        clip.append(element('rect', { x: 58, y: 46, width: 572, height: 270 })); defs.append(clip); svg.append(defs);
        for (let index = 0; index <= 7; index++) {
            const x = xmin + index / 7 * (xmax - xmin);
            svg.append(element('line', { x1: X(x), x2: X(x), y1: 46, y2: 316, stroke: '#d6dee8' }), element('text', { x: X(x), y: 340, 'text-anchor': 'middle' }, Number(x.toFixed(1))));
        }
        for (let index = 0; index <= 4; index++) {
            const y = ymin + index / 4 * (ymax - ymin);
            svg.append(element('line', { x1: 58, x2: 630, y1: Y(y), y2: Y(y), stroke: '#d6dee8' }), element('text', { x: 50, y: Y(y) + 5, 'text-anchor': 'end' }, Number(y.toFixed(1))));
        }
        svg.append(element('path', { d: 'M58 40V316H640', stroke: '#172b42', fill: 'none' }), element('text', { x: 60, y: 23 }, 'Coût du modèle (€)'), element('text', { x: 400, y: 370 }, 'Valeur de x'));
        const points = Array.from({ length: 161 }, (_, index) => {
            const x = xmin + index / 160 * (xmax - xmin);
            return X(x) + ',' + Y(quadraticState(coefficients, x).value);
        }).join(' ');
        svg.append(element('polyline', { points, stroke: '#20529b', 'stroke-width': 3, fill: 'none', 'clip-path': 'url(#' + clipId + ')' }));
        const tangent = element('line', { stroke: '#9c2f25', 'stroke-width': 2, 'clip-path': 'url(#' + clipId + ')' });
        const point = element('circle', { r: 6, fill: '#9c2f25' }); svg.append(tangent, point);
        function update() {
            const state = quadraticState(coefficients, Number(slider.value));
            const at = x => state.value + state.slope * (x - state.x);
            for (const [key, value] of Object.entries({ x1: X(xmin), x2: X(xmax), y1: Y(at(xmin)), y2: Y(at(xmax)) })) tangent.setAttribute(key, value);
            point.setAttribute('cx', X(state.x)); point.setAttribute('cy', Y(state.value));
            output.textContent = 'x = ' + state.x.toLocaleString('fr-FR') + ' · coût = ' + state.value.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' € · pente = ' + state.slope.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
        }
        slider.addEventListener('input', update); update(); box.dataset.mounted = 'true';
    }
}
