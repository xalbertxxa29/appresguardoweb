import { AuthManager } from '../auth/authManager.js';
import { FirestoreService } from '../../core/firestoreService.js';
import { DashboardRenderer } from '../../ui/dashboardRenderer.js';
import { ChartManager } from '../../ui/chartManager.js';
import { Loader } from '../../ui/loader.js';

/**
 * Dashboard Orchestrator
 * Coordina los servicios y el renderizado del Dashboard central.
 */

export const DashboardModule = {
    async init() {
        const userNameDisplay = document.getElementById('user-name-display');
        const mainTitle = document.getElementById('main-title');
        const contentArea = document.getElementById('content-area');
        const currentDateElement = document.getElementById('current-date');

        AuthManager.watchAuthState(async (user) => {
            if (user) {
                Loader.show();
                try {
                    const userKey = user.email.split('@')[0];
                    const userData = await FirestoreService.getDocument('userMap', userKey);
                    if (userData) {
                        userNameDisplay.textContent = userData.nombre.split(' ')[0];
                    }

                    this.displayDate(currentDateElement);
                    this.setupNavigation(mainTitle, contentArea);
                    await this.loadDashboard(contentArea, mainTitle);
                } catch (err) {
                    console.error('Error durante la inicialización del dashboard:', err);
                } finally {
                    Loader.hide();
                }
            } else {
                window.location.href = 'index.html';
            }
        });
    },

    displayDate(element) {
        if (!element) return;
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        element.textContent = now.toLocaleDateString('es-ES', options);
    },

    setupNavigation(mainTitle, contentArea) {
        const navLinks = document.querySelectorAll('.nav-item');
        const checklistToggle = document.getElementById('checklist-toggle');
        const checklistSubmenu = document.getElementById('checklist-submenu');

        if (checklistToggle) {
            checklistToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                checklistSubmenu.classList.toggle('open');
                checklistToggle.classList.toggle('active');
            });
        }

        navLinks.forEach(link => {
            if (link.id === 'checklist-toggle' || link.id === 'logout-btn') return;
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const collectionName = link.dataset.collection;

                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                Loader.show();

                try {
                    if (collectionName === 'panel') {
                        await this.loadDashboard(contentArea, mainTitle);
                    } else if (collectionName === 'cambio-led') {
                        mainTitle.textContent = "Cambio de Led Estado";
                        contentArea.innerHTML = `<iframe src="https://xalbertxxa29.github.io/app-resguardo/control.html" style="width: 100%; height: 80vh; border: 1px solid var(--glass-border); border-radius: 20px;"></iframe>`;
                    } else if (collectionName === 'conexiones') {
                        mainTitle.textContent = "Control de Asistencia";
                        await this.loadCollectionData(contentArea, collectionName);
                    } else {
                        mainTitle.textContent = link.querySelector('span:last-child').textContent;
                        await this.loadCollectionData(contentArea, collectionName);
                    }
                } finally {
                    Loader.hide();
                }
            });
        });
    },

    async loadCollectionData(contentArea, collectionName) {
        try {
            const data = await FirestoreService.getCollection(collectionName, { limitCount: 500 });
            DashboardRenderer.renderDataGrid(contentArea, data, collectionName);
        } catch (error) {
            console.error('Error loading collection:', error);
            contentArea.innerHTML = `<p class="error">Error al cargar datos de ${collectionName}</p>`;
        }
    },



    /**
     * Procesa los datos de incidencias en 3 agrupaciones para gráficos.
     */
    _processIncidenciasData(incData) {
        const byUser = {};
        const byMonth = {};
        const byHour = {};

        const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        incData.forEach(doc => {
            // --- Por usuario ---
            const user = (doc.user || 'Desconocido').trim();
            // Acortar nombre largo: tomar primeras 2 palabras
            const shortUser = user.split(' ').slice(0, 2).join(' ');
            byUser[shortUser] = (byUser[shortUser] || 0) + 1;

            // --- Por mes ---
            let month = null;
            if (doc.timestamp?.toDate) {
                month = MONTHS[doc.timestamp.toDate().getMonth()];
            } else if (doc.date) {
                // "8/8/2025" o "2025-08-08"
                const parts = doc.date.split(/[\/\-]/);
                if (parts.length >= 2) {
                    const mIdx = parseInt(parts[1]) - 1;
                    month = MONTHS[mIdx] || null;
                }
            }
            if (month) {
                byMonth[month] = (byMonth[month] || 0) + 1;
            }

            // --- Por hora ---
            let hour = null;
            if (doc.timestamp?.toDate) {
                hour = doc.timestamp.toDate().getHours();
            } else if (doc.time) {
                // "14:20" o "14%20" (sanitized colon)
                const clean = doc.time.replace(/%3A|:/g, ':');
                const h = parseInt(clean.split(':')[0]);
                if (!isNaN(h)) hour = h;
            }
            if (hour !== null) {
                const label = `${String(hour).padStart(2, '0')}h`;
                byHour[label] = (byHour[label] || 0) + 1;
            }
        });

        // Ordenar horas cronológicamente
        const sortedByHour = Object.fromEntries(
            Object.entries(byHour).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        );

        // Ordenar meses cronológicamente
        const monthOrder = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const sortedByMonth = Object.fromEntries(
            Object.entries(byMonth).sort((a, b) => monthOrder.indexOf(a[0]) - monthOrder.indexOf(b[0]))
        );

        return { byUser, byMonth: sortedByMonth, byHour: sortedByHour };
    },

    async loadDashboard(contentArea, mainTitle) {
        mainTitle.textContent = 'Panel de Operaciones';
        contentArea.innerHTML = this.getDashboardTemplate();

        try {
            // 1. KPIs en paralelo
            const [incidenciasCount, resguardoCount, conductorCount, ejerciciosCount] = await Promise.all([
                FirestoreService.getCount('incidencias'),
                FirestoreService.getCount('checklists'),
                FirestoreService.getCount('conductor'),
                FirestoreService.getCount('ejercicios'),
            ]);
            DashboardRenderer.renderKPIs(document.querySelector('.kpi-row'), {
                resguardo: resguardoCount,
                conductor: conductorCount,
                ejercicios: ejerciciosCount,
                incidencias: incidenciasCount,
            });

            // 2. Datos de incidencias (todos para gráficos, pocos para lista)
            const [incDataAll, incDataList] = await Promise.all([
                FirestoreService.getCollection('incidencias', { limitCount: 500 }),
                FirestoreService.getCollection('incidencias', { limitCount: 5 }),
            ]);

            // 3. Graficar incidencias
            const { byUser, byMonth, byHour } = this._processIncidenciasData(incDataAll);
            ChartManager.renderIncidentsByUserChart('chart-inc-user', byUser);
            ChartManager.renderIncidentsByMonthChart('chart-inc-month', byMonth);
            ChartManager.renderIncidentsByHourChart('chart-inc-hour', byHour);

            // 4. Lista de últimas incidencias
            DashboardRenderer.renderIncidentsList(document.getElementById('incidents-list'), incDataList);

            // 5. Gráfico de rutinas
            const ejData = await FirestoreService.getCollection('ejercicios', { limitCount: 500 });
            const routineCounts = {};
            ejData.forEach(item => {
                const routine = item.rutina || 'No especificada';
                routineCounts[routine] = (routineCounts[routine] || 0) + 1;
            });
            ChartManager.renderRoutinesChart('routines-chart', routineCounts);

            // 6. Ranking
            const resData = await FirestoreService.getCollection('checklists', { limitCount: 200 });
            const agentCounts = {};
            resData.forEach(doc => {
                const user = doc.user || doc.userName || 'Desconocido';
                agentCounts[user] = (agentCounts[user] || 0) + 1;
            });
            const sortedAgents = Object.entries(agentCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);
            DashboardRenderer.renderRankingTable(document.getElementById('ranking-table-body'), sortedAgents);

        } catch (error) {
            console.error('Error cargando dashboard modular:', error);
        }
    },

    getDashboardTemplate() {
        return `
        <div id="dashboard-view" class="dashboard-view">

            <!-- KPI Row -->
            <div class="kpi-row"></div>

            <!-- Incidencias Charts Section -->
            <div class="section-header-label">
                <span class="material-symbols-outlined">report</span>
                Análisis de Incidencias
            </div>
            <div class="incidents-charts-row">
                <div class="widget">
                    <div class="widget-header">Por Usuario</div>
                    <div class="chart-container chart-container--sm">
                        <canvas id="chart-inc-user"></canvas>
                    </div>
                </div>
                <div class="widget">
                    <div class="widget-header">Por Mes</div>
                    <div class="chart-container chart-container--sm">
                        <canvas id="chart-inc-month"></canvas>
                    </div>
                </div>
                <div class="widget">
                    <div class="widget-header">Por Hora del Día</div>
                    <div class="chart-container chart-container--sm">
                        <canvas id="chart-inc-hour"></canvas>
                    </div>
                </div>
            </div>

            <!-- Rutinas + Últimas Incidencias + Ranking -->
            <div class="section-header-label">
                <span class="material-symbols-outlined">fitness_center</span>
                Ejercicios & Actividad
            </div>
            <div class="charts-row">
                <div class="widget">
                    <div class="widget-header">Últimas Incidencias</div>
                    <ul class="details-list" id="incidents-list"></ul>
                </div>
                <div class="widget">
                    <div class="widget-header">Rutinas</div>
                    <div class="chart-container">
                        <canvas id="routines-chart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Ranking -->
            <div class="details-row">
                <div class="widget" style="grid-column: 1 / -1;">
                    <div class="widget-header">Ranking de Agentes</div>
                    <table class="custom-table">
                        <thead><tr><th>Rango</th><th>Agente</th><th>Total</th></tr></thead>
                        <tbody id="ranking-table-body"></tbody>
                    </table>
                </div>
            </div>

        </div>`;
    }
};
