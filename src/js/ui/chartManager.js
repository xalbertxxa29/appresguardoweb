import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);

// Paleta de colores consistente y premium
const COLORS = {
    cyan: '#00f2ff',
    red: '#D62828',
    cyanAlpha: (a) => `rgba(0, 242, 255, ${a})`,
    redAlpha: (a) => `rgba(214, 40, 40, ${a})`,
    glass: 'rgba(30, 41, 59, 0.4)',
    textSecondary: '#94a3b8',
    grid: 'rgba(255, 255, 255, 0.05)',
};

const BASE_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeInOutQuart' },
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                color: COLORS.textSecondary,
                font: { family: 'Inter', size: 11 },
                padding: 16,
                boxWidth: 12,
                usePointStyle: true,
            }
        },
        datalabels: { display: false },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: COLORS.cyanAlpha(0.3),
            borderWidth: 1,
            titleColor: COLORS.cyan,
            bodyColor: '#e2e8f0',
            padding: 10,
            cornerRadius: 8,
        }
    }
};

/**
 * Chart Manager
 * Encapsula la lógica de creación de gráficos de Chart.js.
 */
export const ChartManager = {
    _charts: {},

    _destroy(id) {
        if (this._charts[id]) {
            this._charts[id].destroy();
            delete this._charts[id];
        }
    },

    /**
     * Gráfico de Dona — Incidencias por Usuario.
     */
    renderIncidentsByUserChart(elementId, data) {
        this._destroy(elementId);
        const ctx = document.getElementById(elementId)?.getContext('2d');
        if (!ctx) return null;

        const labels = Object.keys(data);
        const values = Object.values(data);

        // Gradient palette: alternating cyan/red shades
        const palette = labels.map((_, i) =>
            i % 2 === 0
                ? `hsl(${183 + i * 15}, 100%, ${50 - i * 3}%)`
                : `hsl(${0 + i * 8}, ${80 - i * 3}%, ${45 + i * 2}%)`
        );

        this._charts[elementId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: palette.map(c => c + 'CC'),
                    borderColor: palette,
                    borderWidth: 2,
                    hoverOffset: 8,
                }]
            },
            options: {
                ...BASE_OPTIONS,
                cutout: '68%',
                plugins: {
                    ...BASE_OPTIONS.plugins,
                    datalabels: {
                        display: true,
                        color: '#ffffff',
                        font: { weight: 'bold', size: 11 },
                        formatter: (value, ctx) => {
                            const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const pct = Math.round((value / total) * 100);
                            return pct >= 10 ? pct + '%' : '';
                        },
                    }
                }
            }
        });
        return this._charts[elementId];
    },

    /**
     * Gráfico de Barras — Incidencias por Mes.
     */
    renderIncidentsByMonthChart(elementId, data) {
        this._destroy(elementId);
        const ctx = document.getElementById(elementId)?.getContext('2d');
        if (!ctx) return null;

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, COLORS.cyanAlpha(0.8));
        gradient.addColorStop(1, COLORS.cyanAlpha(0.05));

        this._charts[elementId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: 'Incidencias',
                    data: Object.values(data),
                    backgroundColor: gradient,
                    borderColor: COLORS.cyan,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                ...BASE_OPTIONS,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: COLORS.grid, drawBorder: false },
                        ticks: { color: COLORS.textSecondary, stepSize: 1, font: { size: 11 } },
                        border: { display: false },
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: COLORS.textSecondary, font: { size: 11 } },
                        border: { display: false },
                    }
                },
                plugins: {
                    ...BASE_OPTIONS.plugins,
                    legend: { display: false },
                    datalabels: {
                        display: true,
                        color: COLORS.cyan,
                        anchor: 'end',
                        align: 'top',
                        font: { weight: 'bold', size: 11 },
                        formatter: (v) => v > 0 ? v : '',
                    }
                }
            }
        });
        return this._charts[elementId];
    },

    /**
     * Gráfico de Línea — Incidencias por Hora del Día.
     */
    renderIncidentsByHourChart(elementId, data) {
        this._destroy(elementId);
        const ctx = document.getElementById(elementId)?.getContext('2d');
        if (!ctx) return null;

        const gradient = ctx.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, COLORS.redAlpha(0.4));
        gradient.addColorStop(1, COLORS.redAlpha(0.01));

        this._charts[elementId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: 'Incidencias',
                    data: Object.values(data),
                    backgroundColor: gradient,
                    borderColor: COLORS.red,
                    borderWidth: 2.5,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: COLORS.red,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                }]
            },
            options: {
                ...BASE_OPTIONS,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: COLORS.grid, drawBorder: false },
                        ticks: { color: COLORS.textSecondary, stepSize: 1, font: { size: 11 } },
                        border: { display: false },
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: COLORS.textSecondary, font: { size: 11 } },
                        border: { display: false },
                    }
                },
                plugins: {
                    ...BASE_OPTIONS.plugins,
                    legend: { display: false },
                }
            }
        });
        return this._charts[elementId];
    },

    /**
     * Gráfico de Dona — Distribución por Rutinas (existente mejorado).
     */
    renderRoutinesChart(elementId, routinesData) {
        this._destroy(elementId);
        const ctx = document.getElementById(elementId)?.getContext('2d');
        if (!ctx) return null;

        const labels = Object.keys(routinesData);
        const palette = ['#D62828', '#00f2ff', '#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981'];

        this._charts[elementId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: Object.values(routinesData),
                    backgroundColor: palette.map(c => c + 'CC'),
                    borderColor: palette,
                    borderWidth: 2,
                    hoverOffset: 8,
                }]
            },
            options: {
                ...BASE_OPTIONS,
                cutout: '68%',
                plugins: {
                    ...BASE_OPTIONS.plugins,
                    datalabels: {
                        display: true,
                        color: '#fff',
                        font: { weight: 'bold', size: 12 },
                        formatter: (value, ctx) => {
                            const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const pct = Math.round((value / total) * 100);
                            return pct >= 10 ? pct + '%' : '';
                        },
                    }
                }
            }
        });
        return this._charts[elementId];
    },

    /**
     * Gráfico de barras genérico (legacy).
     */
    renderIncidentsChart(elementId, incidentsData) {
        return this.renderIncidentsByMonthChart(elementId, Object.fromEntries(
            incidentsData.labels.map((l, i) => [l, incidentsData.data[i]])
        ));
    }
};
