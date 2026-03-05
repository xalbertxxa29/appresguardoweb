import { Security } from '../core/security.js';

/**
 * Dashboard Renderer
 * Se encarga puramente de la manipulación del DOM y renderizado de componentes.
 */

const PAGE_SIZE = 10;

// ─── Lightbox ──────────────────────────────────────────────────────────────
function initLightbox() {
    if (document.getElementById('lightbox-overlay')) return;
    const lb = document.createElement('div');
    lb.id = 'lightbox-overlay';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = `
        <button class="lb-close" id="lb-close-btn" aria-label="Cerrar">
            <span class="material-symbols-outlined">close</span>
        </button>
        <div class="lb-img-wrap">
            <img id="lb-img" src="" alt="Vista ampliada">
        </div>
        <div class="lb-caption" id="lb-caption"></div>
    `;
    document.body.appendChild(lb);

    const close = () => {
        lb.classList.remove('lb-visible');
        document.body.style.overflow = '';
    };
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.getElementById('lb-close-btn').addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

function openLightbox(src, caption) {
    initLightbox();
    const lb = document.getElementById('lightbox-overlay');
    const img = document.getElementById('lb-img');
    const cap = document.getElementById('lb-caption');
    img.src = src;
    img.alt = caption || 'Imagen';
    cap.textContent = caption || '';
    lb.classList.add('lb-visible');
    document.body.style.overflow = 'hidden';
}

// ─── Checklist field helpers ────────────────────────────────────────────────
const SKIP_KEYS = new Set(['id', 'photoURL', 'timestamp', 'syncState', 'user', 'userName']);

function fieldIcon(value) {
    const v = String(value).toLowerCase();
    if (['sí', 'si', 'true', 'bueno', 'good'].includes(v)) return 'check_circle';
    if (['no', 'false', 'malo', 'bad'].includes(v)) return 'cancel';
    return 'info';
}

function fieldClass(value) {
    const v = String(value).toLowerCase();
    if (['sí', 'si', 'true', 'bueno', 'good'].includes(v)) return 'check-ok';
    if (['no', 'false', 'malo', 'bad'].includes(v)) return 'check-bad';
    return 'check-info';
}

function formatKey(key) {
    return key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

// ─── Pagination helper ──────────────────────────────────────────────────────
/**
 * Renders a page of items and builds the pagination controls.
 * @param {Object}   opts
 * @param {Array}    opts.items       - All items (full dataset)
 * @param {number}   opts.page        - Current page (0-indexed)
 * @param {number}   opts.pageSize    - Items per page
 * @param {Element}  opts.gridEl      - The grid DOM element to render items into
 * @param {Element}  opts.wrapperEl   - Parent wrapper that also contains pagination
 * @param {Function} opts.renderPage  - fn(pageItems, gridEl) — renders one page of items
 * @param {Function} opts.onPageChange- fn(newPage) — called when user clicks a page btn
 */
function buildPagination(opts) {
    const { items, page, pageSize, gridEl, wrapperEl, renderPage, onPageChange } = opts;

    const totalPages = Math.ceil(items.length / pageSize);
    const start = page * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    // Render current page
    renderPage(pageItems, gridEl);

    // Remove any existing pagination
    const existing = wrapperEl.querySelector('.pagination-bar');
    if (existing) existing.remove();

    if (totalPages <= 1) return; // No pagination needed

    // Build pagination bar
    const bar = document.createElement('div');
    bar.className = 'pagination-bar';

    // ← Prev
    const prev = document.createElement('button');
    prev.className = 'pag-btn pag-prev';
    prev.disabled = page === 0;
    prev.setAttribute('aria-label', 'Página anterior');
    prev.innerHTML = `<span class="material-symbols-outlined">chevron_left</span>`;
    prev.addEventListener('click', () => onPageChange(page - 1));
    bar.appendChild(prev);

    // Page numbers (show max 7 around current)
    const range = getPageRange(page, totalPages);
    range.forEach(p => {
        if (p === '…') {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pag-ellipsis';
            ellipsis.textContent = '…';
            bar.appendChild(ellipsis);
        } else {
            const btn = document.createElement('button');
            btn.className = `pag-btn pag-num${p === page ? ' pag-active' : ''}`;
            btn.textContent = p + 1;
            btn.setAttribute('aria-label', `Página ${p + 1}`);
            btn.setAttribute('aria-current', p === page ? 'page' : 'false');
            if (p !== page) btn.addEventListener('click', () => onPageChange(p));
            bar.appendChild(btn);
        }
    });

    // → Next
    const next = document.createElement('button');
    next.className = 'pag-btn pag-next';
    next.disabled = page === totalPages - 1;
    next.setAttribute('aria-label', 'Página siguiente');
    next.innerHTML = `<span class="material-symbols-outlined">chevron_right</span>`;
    next.addEventListener('click', () => onPageChange(page + 1));
    bar.appendChild(next);

    // Info label
    const info = document.createElement('span');
    info.className = 'pag-info';
    const from = start + 1;
    const to = Math.min(start + pageSize, items.length);
    info.textContent = `${from}–${to} de ${items.length}`;
    bar.appendChild(info);

    wrapperEl.appendChild(bar);
}

/** Returns an array of page indices (0-based) and '…' ellipsis markers. */
function getPageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const range = new Set([0, total - 1, current]);
    for (let i = Math.max(0, current - 1); i <= Math.min(total - 1, current + 1); i++) range.add(i);
    const sorted = [...range].sort((a, b) => a - b);
    const result = [];
    let prev = -1;
    for (const p of sorted) {
        if (p - prev > 1) result.push('…');
        result.push(p);
        prev = p;
    }
    return result;
}

// ─── Renderer ───────────────────────────────────────────────────────────────
export const DashboardRenderer = {

    renderKPIs(container, stats) {
        if (!container) return;
        container.innerHTML = `
            <div class="kpi-card glass-neon-red">
                <span class="kpi-icon material-symbols-outlined neon-red-icon">shield_person</span>
                <div class="kpi-info">
                    <div class="kpi-number">${stats.resguardo}</div>
                    <div class="kpi-title">Resguardo</div>
                </div>
            </div>
            <div class="kpi-card glass-neon-cyan">
                <span class="kpi-icon material-symbols-outlined neon-cyan-icon">directions_car</span>
                <div class="kpi-info">
                    <div class="kpi-number">${stats.conductor}</div>
                    <div class="kpi-title">Conductor</div>
                </div>
            </div>
            <div class="kpi-card glass-neon-cyan">
                <span class="kpi-icon material-symbols-outlined neon-cyan-icon">fitness_center</span>
                <div class="kpi-info">
                    <div class="kpi-number">${stats.ejercicios}</div>
                    <div class="kpi-title">Ejercicios</div>
                </div>
            </div>
            <div class="kpi-card glass-neon-red">
                <span class="kpi-icon material-symbols-outlined neon-red-icon">report</span>
                <div class="kpi-info">
                    <div class="kpi-number">${stats.incidencias}</div>
                    <div class="kpi-title">Incidencias</div>
                </div>
            </div>
        `;
    },

    renderIncidentsList(container, incidents) {
        if (!container) return;
        container.innerHTML = incidents.length === 0
            ? '<li class="empty-msg">No hay incidencias registradas.</li>'
            : '';
        incidents.forEach(incident => {
            const li = document.createElement('li');
            li.className = 'details-list-item futuristic-card';
            const date = incident.timestamp
                ? (typeof incident.timestamp.toDate === 'function'
                    ? incident.timestamp.toDate().toLocaleDateString('es-PE')
                    : incident.timestamp)
                : 'Pendiente';
            li.innerHTML = `
                <div class="item-main">
                    <span class="item-title neon-text-cyan">${Security.sanitize(incident.descripción || 'Sin descripción')}</span>
                    <span class="item-subtitle">OPERADOR: ${Security.sanitize(incident.user || 'SISTEMA')}</span>
                </div>
                <div class="item-side neon-text-red">${date}</div>
            `;
            container.appendChild(li);
        });
    },

    renderRankingTable(container, rankingData) {
        if (!container) return;
        container.innerHTML = rankingData.length === 0
            ? '<tr><td colspan="3">Iniciado escaneo...</td></tr>'
            : '';
        rankingData.slice(0, 5).forEach((agent, index) => {
            const tr = document.createElement('tr');
            const rankClass = index === 0 ? 'neon-gold' : index === 1 ? 'neon-silver' : index === 2 ? 'neon-bronze' : '';
            tr.innerHTML = `
                <td><span class="rank-badge ${rankClass}">${index + 1}</span></td>
                <td class="neon-text-cyan">${Security.sanitize(agent.name)}</td>
                <td class="neon-text-red">${agent.count}</td>
            `;
            container.appendChild(tr);
        });
    },

    // ── Router ────────────────────────────────────────────────────────────
    renderDataGrid(container, items, collectionName) {
        if (!container) return;
        const col = collectionName.toLowerCase();
        if (col === 'incidencias' || col === 'ejercicios') {
            this._renderMediaGrid(container, items);
        } else if (col === 'checklists' || col === 'conductor') {
            this._renderChecklistGrid(container, items);
        } else {
            this._renderGenericGrid(container, items);
        }
    },

    // ── Media Grid (Incidencias / Ejercicios) — with pagination ───────────
    _renderMediaGrid(container, allItems) {
        container.innerHTML = `
            <div class="data-view-container">
                <div class="media-grid" id="modular-grid"></div>
            </div>`;
        const wrapper = container.querySelector('.data-view-container');
        const grid = container.querySelector('#modular-grid');

        if (allItems.length === 0) {
            grid.innerHTML = `<p class="empty-msg">No se encontraron registros.</p>`;
            return;
        }

        const renderPage = (pageItems, gridEl) => {
            gridEl.innerHTML = '';
            pageItems.forEach(item => {
                const card = document.createElement('div');
                card.className = 'media-card';

                const ts = item.timestamp
                    ? (typeof item.timestamp.toDate === 'function'
                        ? item.timestamp.toDate().toLocaleString('es-PE')
                        : item.timestamp)
                    : '--:--';
                const desc = Security.sanitize(item.descripción || item.rutina || item.descripcion || '');
                const user = Security.sanitize(item.user || item.userName || 'OPERADOR');

                const excludeFromBody = new Set(['id', 'photoURL', 'timestamp', 'user', 'userName', 'descripción', 'descripcion', 'syncState']);
                let detailRows = '';
                for (const [k, v] of Object.entries(item)) {
                    if (excludeFromBody.has(k)) continue;
                    detailRows += `<div class="mc-detail"><span class="mc-key">${Security.sanitize(formatKey(k))}:</span> <span class="mc-val">${Security.sanitize(String(v))}</span></div>`;
                }

                const imgHtml = item.photoURL
                    ? `<div class="mc-thumb-wrap">
                         <img src="${item.photoURL}" alt="${desc || 'Imagen'}" class="mc-thumb" loading="lazy"
                              data-src="${item.photoURL}" data-caption="${user} — ${desc}">
                         <div class="mc-thumb-overlay">
                             <span class="material-symbols-outlined">zoom_in</span>
                         </div>
                       </div>`
                    : `<div class="mc-no-img"><span class="material-symbols-outlined">image_not_supported</span></div>`;

                card.innerHTML = `
                    <div class="mc-header">
                        <h4 class="mc-user neon-text-red">${user}</h4>
                        <span class="mc-ts">${ts}</span>
                    </div>
                    ${imgHtml}
                    <div class="mc-body">
                        ${desc ? `<div class="mc-desc">${desc}</div>` : ''}
                        ${detailRows}
                    </div>
                `;

                const thumb = card.querySelector('.mc-thumb');
                if (thumb) {
                    card.querySelector('.mc-thumb-wrap').addEventListener('click', () =>
                        openLightbox(thumb.dataset.src, thumb.dataset.caption));
                }
                gridEl.appendChild(card);
            });
        };

        let currentPage = 0;
        const go = (page) => {
            currentPage = page;
            buildPagination({
                items: allItems, page: currentPage, pageSize: PAGE_SIZE,
                gridEl: grid, wrapperEl: wrapper,
                renderPage,
                onPageChange: go,
            });
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        go(0);
    },

    // ── Checklist Grid (Resguardo / Conductor) — with pagination ──────────
    _renderChecklistGrid(container, allItems) {
        container.innerHTML = `
            <div class="data-view-container">
                <div class="checklist-grid" id="modular-grid"></div>
            </div>`;
        const wrapper = container.querySelector('.data-view-container');
        const grid = container.querySelector('#modular-grid');

        if (allItems.length === 0) {
            grid.innerHTML = `<p class="empty-msg">No se encontraron registros.</p>`;
            return;
        }

        const renderPage = (pageItems, gridEl) => {
            gridEl.innerHTML = '';
            pageItems.forEach(item => {
                const card = document.createElement('div');
                card.className = 'cl-card futuristic-card';

                const ts = item.timestamp
                    ? (typeof item.timestamp.toDate === 'function'
                        ? item.timestamp.toDate().toLocaleString('es-PE')
                        : item.timestamp)
                    : '--:--';
                const user = Security.sanitize(item.user || item['Usuario Nombre'] || item.userName || 'OPERADOR');

                let goodFields = '', badFields = '', infoFields = '';
                let goodCount = 0, badCount = 0;

                for (const [k, v] of Object.entries(item)) {
                    if (SKIP_KEYS.has(k)) continue;
                    const cls = fieldClass(v);
                    const icon = fieldIcon(v);
                    const safeKey = Security.sanitize(formatKey(k));
                    const safeVal = Security.sanitize(String(v));
                    const html = `<div class="cl-field cl-field--${cls}">
                        <span class="material-symbols-outlined cl-field-icon">${icon}</span>
                        <span class="cl-field-key">${safeKey}</span>
                        <span class="cl-field-val">${safeVal}</span>
                    </div>`;
                    if (cls === 'check-ok') { goodFields += html; goodCount++; }
                    else if (cls === 'check-bad') { badFields += html; badCount++; }
                    else infoFields += html;
                }

                const statusClass = badCount > 0 ? 'cl-status--warn' : 'cl-status--ok';
                const statusText = badCount > 0 ? `${badCount} item(s) con problema` : 'Todo en orden';
                const statusIcon = badCount > 0 ? 'warning' : 'verified';
                const pct = goodCount + badCount > 0 ? Math.round(goodCount / (goodCount + badCount) * 100) : 0;

                card.innerHTML = `
                    <div class="cl-card-header">
                        <div class="cl-header-info">
                            <h4 class="cl-user">${user}</h4>
                            <span class="cl-ts">${ts}</span>
                        </div>
                        <div class="cl-status ${statusClass}">
                            <span class="material-symbols-outlined">${statusIcon}</span>
                            <span>${statusText}</span>
                        </div>
                    </div>
                    <div class="cl-progress-bar">
                        <div class="cl-progress-fill" style="width:${pct}%"></div>
                    </div>
                    <details class="cl-details"${badCount > 0 ? ' open' : ''}>
                        <summary class="cl-summary">Ver detalles <span class="cl-badge">${goodCount + badCount}</span></summary>
                        <div class="cl-fields-wrap">
                            ${badFields ? `<div class="cl-section-label cl-label--bad"><span class="material-symbols-outlined">warning</span>Con observaciones</div>${badFields}` : ''}
                            ${goodFields ? `<div class="cl-section-label cl-label--ok"><span class="material-symbols-outlined">check_circle</span>Conforme</div>${goodFields}` : ''}
                            ${infoFields ? `<div class="cl-section-label"><span class="material-symbols-outlined">info</span>Información</div>${infoFields}` : ''}
                        </div>
                    </details>
                `;
                gridEl.appendChild(card);
            });
        };

        let currentPage = 0;
        const go = (page) => {
            currentPage = page;
            buildPagination({
                items: allItems, page: currentPage, pageSize: PAGE_SIZE,
                gridEl: grid, wrapperEl: wrapper,
                renderPage,
                onPageChange: go,
            });
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        go(0);
    },

    // ── Generic fallback — with pagination ────────────────────────────────
    _renderGenericGrid(container, allItems) {
        container.innerHTML = `
            <div class="data-view-container">
                <div class="data-grid" id="modular-grid"></div>
            </div>`;
        const wrapper = container.querySelector('.data-view-container');
        const grid = container.querySelector('#modular-grid');

        if (allItems.length === 0) {
            grid.innerHTML = `<p class="empty-msg">No se encontraron registros.</p>`;
            return;
        }

        const renderPage = (pageItems, gridEl) => {
            gridEl.innerHTML = '';
            pageItems.forEach(item => {
                const card = document.createElement('div');
                card.className = 'content-card futuristic-card';
                let body = '';
                if (item.photoURL) {
                    body += `<div class="mc-thumb-wrap" style="cursor:pointer">
                        <img src="${item.photoURL}" class="mc-thumb" data-src="${item.photoURL}" data-caption="">
                        <div class="mc-thumb-overlay"><span class="material-symbols-outlined">zoom_in</span></div>
                    </div>`;
                }
                for (const [k, v] of Object.entries(item)) {
                    if (SKIP_KEYS.has(k) || k === 'photoURL') continue;
                    body += `<p class="item-detail"><strong class="neon-text-cyan">${k}:</strong> ${Security.sanitize(String(v))}</p>`;
                }
                const ts = item.timestamp
                    ? (typeof item.timestamp.toDate === 'function' ? item.timestamp.toDate().toLocaleString('es-PE') : item.timestamp)
                    : '--:--';
                card.innerHTML = `
                    <div class="card-header">
                        <h4 class="neon-text-red">${Security.sanitize(item.user || item.userName || 'OPERADOR')}</h4>
                        <span class="timestamp">${ts}</span>
                    </div>
                    <div class="card-body">${body}</div>
                `;
                const wrap = card.querySelector('.mc-thumb-wrap');
                if (wrap) {
                    wrap.addEventListener('click', () => {
                        const img = wrap.querySelector('img');
                        openLightbox(img.dataset.src, img.dataset.caption);
                    });
                }
                gridEl.appendChild(card);
            });
        };

        let currentPage = 0;
        const go = (page) => {
            currentPage = page;
            buildPagination({
                items: allItems, page: currentPage, pageSize: PAGE_SIZE,
                gridEl: grid, wrapperEl: wrapper,
                renderPage,
                onPageChange: go,
            });
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        go(0);
    }
};
