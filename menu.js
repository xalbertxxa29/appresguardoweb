document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. INICIALIZACIÓN DE FIREBASE ---
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Registrar el plugin de datalabels globalmente
    Chart.register(ChartDataLabels);

    // --- 2. SELECCIÓN DE ELEMENTOS DEL DOM ---
    const userNameDisplay = document.getElementById('user-name-display');
    const mainTitle = document.getElementById('main-title');
    const contentArea = document.getElementById('content-area');
    const navLinks = document.querySelectorAll('.nav-item');
    const currentDateElement = document.getElementById('current-date');
    const searchInput = document.getElementById('search-input');
    const logoutBtn = document.getElementById('logout-btn');

    // --- 3. LÓGICA DE AUTENTICACIÓN Y SEGURIDAD DE PÁGINA ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // Si el usuario está conectado, obtenemos sus datos
            const userKey = user.email.split('@')[0];
            db.collection('userMap').doc(userKey).get().then(doc => {
                userNameDisplay.textContent = doc.exists ? doc.data().nombre.split(' ')[0] : userKey;
            });

            // **MEJORA DE SEGURIDAD**: Mostramos el contenido solo si el usuario está verificado
            document.body.style.opacity = '1';

            displayCurrentDate();
            loadDashboard(); // Carga inicial del dashboard
        } else {
            // Si no hay usuario, redirigimos inmediatamente
            window.location.href = 'index.html';
        }
    });

    // **ARREGLO**: Añadimos el evento para cerrar sesión
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut().catch(error => {
            console.error("Error al cerrar sesión:", error);
        });
        // onAuthStateChanged se encargará de la redirección
    });

    // --- Plugin personalizado para fondo del canvas ---
    const customCanvasBackgroundColor = {
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart, args, options) => {
            const { ctx } = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = options.color || '#FFFFFF'; // Fondo blanco
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    };


    // --- 4. FUNCIONES DE RENDERIZADO DEL DASHBOARD ---

    // Dibuja el gráfico de Donut para las rutinas
    function renderRoutinesChart(routinesData) {
        const ctx = document.getElementById('routines-chart')?.getContext('2d');
        if (!ctx) return;
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(routinesData),
                datasets: [{
                    data: Object.values(routinesData),
                    backgroundColor: ['#D62828', '#000000', '#FFFFFF', '#ffc107', '#17a2b8'], // Updated colors
                    borderColor: 'var(--dark-bg-secondary)',
                    borderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#000000' } }, // Color de las etiquetas de la leyenda en negro
                    datalabels: {
                        color: '#000000', // Color del texto de las etiquetas (negro para contraste con fondo blanco)
                        formatter: (value, context) => {
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            if (total === 0) return '0%'; // Evitar división por cero
                            const percentage = Math.round((value / total) * 100) + '%';
                            return percentage;
                        },
                        font: {
                            weight: 'bold'
                        }
                    },
                    customCanvasBackgroundColor: {
                        color: '#FFFFFF' // Pasar la opción de color blanco al plugin
                    }
                }
            },
            plugins: [customCanvasBackgroundColor] // Registrar el plugin aquí
        });
    }

    // Dibuja el gráfico de Barras para las incidencias
    function renderIncidentsChart(incidentsData) {
        const ctx = document.getElementById('incidents-chart')?.getContext('2d');
        if (!ctx) return;
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: incidentsData.labels,
                datasets: [{
                    label: 'Nº de Incidencias',
                    data: incidentsData.data,
                    backgroundColor: 'rgba(214, 40, 40, 0.5)', // Updated color
                    borderColor: 'var(--primary-red)', // Updated color
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { ticks: { color: '#000000', stepSize: 1 } }, // Color de los ticks del eje Y en negro
                    x: { ticks: { color: '#000000' } } // Color de los ticks del eje X en negro
                },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        color: '#000000', // Color del texto de las etiquetas (negro)
                        anchor: 'end', // Posición de la etiqueta (al final de la barra)
                        align: 'top', // Alineación de la etiqueta (arriba de la barra)
                        formatter: (value) => value, // Muestra el valor numérico directamente
                        font: {
                            weight: 'bold'
                        }
                    },
                    customCanvasBackgroundColor: {
                        color: '#FFFFFF' // Pasar la opción de color blanco al plugin
                    }
                },
                layout: {
                    padding: {
                        left: 0,
                        right: 0,
                        top: 20, // Ajuste para que las etiquetas no se salgan
                        bottom: 0
                    }
                }
            },
            plugins: [customCanvasBackgroundColor] // Registrar el plugin aquí
        });
    }

    function renderIncidentsList(incidents) {
        const list = document.getElementById('incidents-list');
        if (!list) return;
        list.innerHTML = '';
        if (incidents.length === 0) {
            const emptyLi = document.createElement('li');
            emptyLi.textContent = 'No hay incidencias recientes.';
            list.appendChild(emptyLi);
            return;
        }
        incidents.forEach(incident => {
            const li = document.createElement('li');
            li.className = 'details-list-item';

            const mainDiv = document.createElement('div');
            mainDiv.className = 'item-main';

            const titleSpan = document.createElement('span');
            titleSpan.className = 'item-title';
            titleSpan.textContent = incident.descripción || "Descripción no disponible";

            const subSpan = document.createElement('span');
            subSpan.className = 'item-subtitle';
            subSpan.textContent = `Por: ${incident.user || "Desconocido"}`;

            mainDiv.appendChild(titleSpan);
            mainDiv.appendChild(subSpan);

            const sideDiv = document.createElement('div');
            sideDiv.className = 'item-side';
            const date = incident.timestamp ? new Date(incident.timestamp.seconds * 1000).toLocaleDateString('es-PE') : 'Fecha desc.';
            sideDiv.textContent = date;

            li.appendChild(mainDiv);
            li.appendChild(sideDiv);
            list.appendChild(li);
        });
    }

    // Renderiza la tabla de ranking de agentes
    function renderRankingTable(rankingData) {
        const tableBody = document.getElementById('ranking-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (rankingData.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="3">No hay datos de checklists.</td>'; // Static HTML safe
            tableBody.appendChild(tr);
            return;
        }
        rankingData.slice(0, 5).forEach((agent, index) => {
            const tr = document.createElement('tr');
            const rankClass = index < 3 ? `rank-${index + 1}` : '';

            // Safe manual construction
            const rankTd = document.createElement('td');
            rankTd.innerHTML = `<span class="rank-badge ${rankClass}">${index + 1}</span>`;

            const nameTd = document.createElement('td');
            nameTd.textContent = agent.name;

            const countTd = document.createElement('td');
            countTd.textContent = agent.count;

            tr.appendChild(rankTd);
            tr.appendChild(nameTd);
            tr.appendChild(countTd);

            tableBody.appendChild(tr);
        });
    }

    async function loadDashboard() {
        mainTitle.textContent = 'Panel de Operaciones';
        contentArea.innerHTML = `
            <div id="dashboard-view" class="dashboard-view">
                <div class="kpi-row">
                    <div class="kpi-card skeleton"><span class="kpi-icon material-symbols-outlined" style="opacity:0">shield_person</span><div class="kpi-info"><div class="kpi-number">--</div><div class="kpi-title">Cargando...</div></div></div>
                    <div class="kpi-card skeleton"><span class="kpi-icon material-symbols-outlined" style="opacity:0">directions_car</span><div class="kpi-info"><div class="kpi-number">--</div><div class="kpi-title">Cargando...</div></div></div>
                    <div class="kpi-card skeleton"><span class="kpi-icon material-symbols-outlined" style="opacity:0">fitness_center</span><div class="kpi-info"><div class="kpi-number">--</div><div class="kpi-title">Cargando...</div></div></div>
                    <div class="kpi-card skeleton"><span class="kpi-icon material-symbols-outlined" style="opacity:0">report</span><div class="kpi-info"><div class="kpi-number">--</div><div class="kpi-title">Cargando...</div></div></div>
                </div>
                <div class="charts-row">
                    <div class="widget" id="incidents-chart-widget">
                        <div class="widget-header">Incidencias en los Últimos 7 Días</div>
                        <div class="chart-container">
                            <canvas id="incidents-chart"></canvas>
                        </div>
                    </div>
                    <div class="widget" id="chart-widget">
                        <div class="widget-header">Distribución de Rutinas</div>
                        <div class="chart-container">
                            <canvas id="routines-chart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="details-row">
                    <div class="widget"><div class="widget-header">Últimas Incidencias</div><ul class="details-list" id="incidents-list"><li class="details-list-item skeleton"><div class="skeleton-text"></div></li><li class="details-list-item skeleton"><div class="skeleton-text"></div></li></ul></div>
                    <div class="widget"><div class="widget-header">Ranking de Agentes por Checklists</div><table class="custom-table"><thead><tr><th>Rango</th><th>Agente</th><th>Total</th></tr></thead><tbody id="ranking-table-body"><tr><td colspan="3" class="skeleton skeleton-text"></td></tr><tr><td colspan="3" class="skeleton skeleton-text"></td></tr></tbody></table></div>
                </div>
            </div>
            <div id="data-view" class="hidden"></div>`;

        // --- PROCESAMIENTO DE DATOS OPTIMIZADO ---

        // 1. Obtener conteos (KPIs) de manera segura
        let resguardoCount, conductorCount, ejerciciosCount, incidenciasCount;

        try {
            // Intentar usar count() (Optimizado)
            const results = await Promise.all([
                db.collection('checklists').count().get(),
                db.collection('conductor').count().get(),
                db.collection('ejercicios').count().get(),
                db.collection('incidencias').count().get()
            ]);

            resguardoCount = results[0].data().count;
            conductorCount = results[1].data().count;
            ejerciciosCount = results[2].data().count;
            incidenciasCount = results[3].data().count;

        } catch (e) {
            console.warn("Optimización 'count()' no soportada o falló. Usando método legacy (lento).", e);
            // Fallback a método antiguo (Lento pero seguro)
            const results = await Promise.all([
                db.collection('checklists').get(),
                db.collection('conductor').get(),
                db.collection('ejercicios').get(),
                db.collection('incidencias').get()
            ]);

            resguardoCount = results[0].size;
            conductorCount = results[1].size;
            ejerciciosCount = results[2].size;
            incidenciasCount = results[3].size;
        }

        // Actualizar UI de KPIs
        // Actualizar UI de KPIs (Reemplazar skeletons con datos reales)
        const kpiRow = document.querySelector('.kpi-row');
        if (kpiRow) {
            kpiRow.innerHTML = `
                <div class="kpi-card"><span class="kpi-icon material-symbols-outlined" style="background-color: rgba(40, 167, 69, 0.2); color: var(--status-green);">shield_person</span><div class="kpi-info"><div id="kpi-resguardo" class="kpi-number">${resguardoCount}</div><div class="kpi-title">Checklists Resguardo</div></div></div>
                <div class="kpi-card"><span class="kpi-icon material-symbols-outlined" style="background-color: rgba(0, 123, 255, 0.2); color: var(--primary-blue);">directions_car</span><div class="kpi-info"><div id="kpi-conductor" class="kpi-number">${conductorCount}</div><div class="kpi-title">Checklists Conductor</div></div></div>
                <div class="kpi-card"><span class="kpi-icon material-symbols-outlined" style="background-color: rgba(23, 162, 184, 0.2); color: #17a2b8;">fitness_center</span><div class="kpi-info"><div id="kpi-ejercicios" class="kpi-number">${ejerciciosCount}</div><div class="kpi-title">Ejercicios Registrados</div></div></div>
                <div class="kpi-card"><span class="kpi-icon material-symbols-outlined" style="background-color: rgba(220, 53, 69, 0.2); color: var(--status-red);">report</span><div class="kpi-info"><div id="kpi-incidencias" class="kpi-number">${incidenciasCount}</div><div class="kpi-title">Total Incidencias</div></div></div>
            `;
        }

        // 2. Obtener solo los datos necesarios para gráficos y tablas (Limitado o consultado específicamente)
        // Para gráficos, aún necesitamos algunos datos. 
        // OPTIMIZACIÓN: Si son muchos datos, idealmente deberíamos tener una colección de "stats" pre-calculada.
        // Por ahora, limitaremos las consultas donde sea posible o mantendremos la lógica si es necesaria para los gráficos actuales.

        // Para Gráfico de Rutinas (Necesitamos todos los ejercicios para calcular distribución real, o un límite alto)
        const ejerciciosSnap = await db.collection('ejercicios').limit(1000).get();

        // Para Gráfico de Incidencias (Últimos 7 días - Filtro por fecha sería mejor, pero por ahora traemos las recientes)
        // Optimizamos trayendo solo incidencias recientes (ej. últimas 100)
        const incidenciasSnap = await db.collection('incidencias').orderBy('timestamp', 'desc').limit(100).get();

        // Para Ranking (Necesitamos checklists - esto sigue siendo pesado si hay muchos. Limitemos a 1000 por ahora)
        const resguardoSnap = await db.collection('checklists').limit(1000).get();
        const conductorSnap = await db.collection('conductor').limit(1000).get();

        // Gráfico de Rutinas
        const routineCounts = {};
        ejerciciosSnap.forEach(doc => {
            const routine = doc.data().rutina || "No especificada";
            routineCounts[routine] = (routineCounts[routine] || 0) + 1;
        });
        renderRoutinesChart(routineCounts);

        // Gráfico de Incidencias
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const last7DaysLabels = [];
        const last7DaysData = Array(7).fill(0);
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            last7DaysLabels.push(days[d.getDay()]);
        }
        incidenciasSnap.forEach(doc => {
            const data = doc.data();
            if (data.timestamp) {
                const incidentDate = data.timestamp.toDate();
                const diffDays = Math.floor((today - incidentDate) / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays < 7) {
                    last7DaysData[6 - diffDays]++;
                }
            }
        });
        renderIncidentsChart({ labels: last7DaysLabels, data: last7DaysData });

        // Lista de incidencias (Ya tenemos incidenciasSnap ordenado)
        const recentIncidents = incidenciasSnap.docs.slice(0, 5).map(doc => doc.data());
        renderIncidentsList(recentIncidents);

        // Ranking de Agentes
        const agentCounts = {};
        const processSnapshot = (snap) => {
            snap.forEach(doc => {
                const user = doc.data().user || doc.data().userName || "Desconocido";
                if (user !== "Desconocido") {
                    agentCounts[user] = (agentCounts[user] || 0) + 1;
                }
            });
        };
        processSnapshot(resguardoSnap);
        processSnapshot(conductorSnap);
        const sortedAgents = Object.entries(agentCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        renderRankingTable(sortedAgents);
    }

    // --- Function to load external HTML content using an iframe ---
    function loadIframeContent(url) {
        mainTitle.textContent = "Cambio de Led Estado"; // Update title immediately
        contentArea.innerHTML = `<div style="position: relative; width: 100%; height: 100%;">
                                    <div class="loader" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
                                    <iframe id="external-iframe" src="${url}" style="width: 100%; height: 100%; border: none; visibility: hidden;" onload="this.style.visibility='visible'; this.previousElementSibling.style.display='none';"></iframe>
                                </div>`;
        // The onload attribute on the iframe will hide the loader once the iframe content is loaded.
    }

    // --- 6. LÓGICA DE NAVEGACIÓN Y VISTAS DE DATOS ---

    function displayCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = now.toLocaleDateString('es-ES', options);
    }

    async function loadCollectionData(collectionName) {
        contentArea.innerHTML = '<div id="dashboard-view" class="hidden"></div><div id="data-view"><div class="loader"></div></div>';
        try {
            // Modificación aquí: Añadir .orderBy('timestamp', 'desc') a las consultas
            const snapshot = await db.collection(collectionName).orderBy('timestamp', 'desc').get();
            const dataView = document.getElementById('data-view');
            if (snapshot.empty) {
                dataView.innerHTML = `<p>No hay datos disponibles en ${collectionName}.</p>`;
                return;
            }

            dataView.innerHTML = '<div class="data-grid"></div>';
            const grid = dataView.querySelector('.data-grid');
            snapshot.forEach(doc => {
                const card = createCard(doc.data(), collectionName);
                grid.appendChild(card);
            });

        } catch (error) {
            console.error("Error cargando la colección: ", error);
            document.getElementById('data-view').innerHTML = `<p>Error al cargar los datos.</p>`;
        }
    }

    function createCard(data, collectionName) {
        const card = document.createElement('div');
        card.className = 'content-card';
        let bodyContent = '';
        const timestamp = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleString('es-PE') : 'No disponible';

        const renderStatusIcon = (value) => {
            if (typeof value !== 'string') return value;
            if (value.toLowerCase() === 'si' || value.toLowerCase() === 'sí') return `<span class="material-symbols-outlined status-icon status-success">check_circle</span>`;
            if (value.toLowerCase() === 'no') return `<span class="material-symbols-outlined status-icon status-danger">cancel</span>`;
            return value;
        };

        switch (collectionName) {
            case 'checklists':
            case 'conductor':
                for (const [key, value] of Object.entries(data)) {
                    if (!['Usuario Nombre', 'userName', 'user', 'timestamp'].includes(key)) {
                        bodyContent += `<p><strong>${key}:</strong> ${renderStatusIcon(value)}</p>`;
                    }
                }
                break;
            case 'ejercicios':
                if (data.rutina) bodyContent += `<p><strong>Rutina:</strong> ${data.rutina}</p>`;
                if (data.photoURL) bodyContent += `<img src="${data.photoURL}" alt="Imagen de ejercicio" class="card-image">`;
                break;
            case 'incidencias':
                if (data.descripción) bodyContent += `<p>${data.descripción}</p>`;
                if (data.photoURL) bodyContent += `<img src="${data.photoURL}" alt="Imagen de incidencia" class="card-image">`;
                break;
            default: bodyContent = '<p>Contenido no especificado.</p>';
        }
        const nombreUsuario = data['Usuario Nombre'] || data.userName || data.user || 'Usuario Desconocido';
        card.innerHTML = `<div class="card-header"><div><h4>${nombreUsuario}</h4><span class="timestamp">${timestamp}</span></div></div><div class="card-body">${bodyContent}</div>`;
        return card;
    }

    // --- 7. MANEJADORES DE EVENTOS ---
    const checklistToggle = document.getElementById('checklist-toggle');
    const checklistSubmenu = document.getElementById('checklist-submenu');
    checklistToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        checklistSubmenu.classList.toggle('open');
        checklistToggle.classList.toggle('active');
    });

    navLinks.forEach(link => {
        if (link.id === 'checklist-toggle') return;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const collection = link.dataset.collection;

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            if (checklistSubmenu.classList.contains('open')) {
                checklistSubmenu.classList.remove('open');
                checklistToggle.classList.remove('active');
            }

            if (collection === 'panel') {
                loadDashboard();
            } else if (collection === 'cambio-led') {
                loadIframeContent('https://xalbertxxa29.github.io/app-resguardo/control.html');
            }
            else {
                mainTitle.textContent = link.querySelector('span:last-child').textContent;
                loadCollectionData(collection);
            }
        });
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const dataGrid = document.querySelector('.data-grid');
        if (!dataGrid) return;
        const cards = dataGrid.querySelectorAll('.content-card');
        cards.forEach(card => {
            card.style.display = card.innerText.toLowerCase().includes(searchTerm) ? 'flex' : 'none';
        });
    });
});