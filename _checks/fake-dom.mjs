export class Element {
    constructor(tag = 'div') {
        this.tagName = tag.toUpperCase(); this.children = []; this.dataset = {}; this.handlers = new Map();
        this.textContent = ''; this.value = '0'; this.hidden = true; this.disabled = false; this.className = ''; this.id = '';
    }
    append(...nodes) { for (const node of nodes) { node.remove(); node.parent = this; this.children.push(node); } }
    get parentNode() { return this.parent; }
    get nextSibling() { return this.parent?.children[this.parent.children.indexOf(this) + 1] || null; }
    prepend(node) { node.remove(); node.parent = this; this.children.unshift(node); }
    insertBefore(node, target) {
        if (!target) { this.append(node); return; }
        node.remove(); node.parent = this; this.children.splice(this.children.indexOf(target), 0, node);
    }
    remove() { if (this.parent) { this.parent.children = this.parent.children.filter(node => node !== this); this.parent = null; } }
    replaceChildren(...nodes) { for (const node of this.children) node.parent = null; this.children = []; this.append(...nodes); }
    add(node) { this.append(node); }
    addEventListener(name, fn) { this.handlers.set(name, fn); }
    fire(name) { return this.handlers.get(name)?.(); }
    setAttribute(name, value) { this[name] = value; }
    matches(selector) {
        return selector.split(',').some(raw => {
            const part = raw.trim();
            if (part.startsWith('#')) return this.id === part.slice(1);
            if (part.startsWith('.')) return this.className.split(' ').includes(part.slice(1));
            const attribute = part.match(/^\[data-([a-z-]+)(?:="([^"]*)")?\]$/);
            if (attribute) {
                const key = attribute[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                return attribute[2] === undefined ? key in this.dataset : this.dataset[key] === attribute[2];
            }
            return this.tagName.toLowerCase() === part;
        });
    }
    querySelectorAll(selector) {
        return this.children.flatMap(node => [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}
export function courseFixture() {
    const preview = new Element();
    const intro = new Element('header'); intro.className = 'cours-intro'; intro.id = 'course-intro';
    const activities = new Element('section'); activities.className = 'cours-activites';
    const activity = new Element('article'); activity.className = 'cours-activite'; activity.id = 'a01';
    const heading = new Element('h2'); heading.textContent = 'Activité fictive';
    const question = new Element(); question.className = 'cours-question'; question.dataset.question = 'q01';
    const input = new Element('textarea'); input.dataset.answerId = 'a01_q01';
    question.append(input); activity.append(heading, question); activities.append(activity); preview.append(intro, activities);
    return { preview, intro, activity, question, input };
}
