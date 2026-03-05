/**
 * Universal Loading Overlay
 * Provee el efecto futurista con orbitales, partículas y energía.
 * Compatible con overlay pre-renderizado en HTML o creación dinámica.
 */
export const Loader = {
    _safetyTimer: null,
    _initialized: false,

    _getOverlayHTML() {
        return `
            <div class="hypervelocity-bg" id="stars-container"></div>
            <div class="hex-grid-bg"></div>
            <div class="energy-waves">
                <div class="energy-wave"></div>
                <div class="energy-wave"></div>
                <div class="energy-wave"></div>
            </div>
            <div class="logo-container">
                <div class="orbital-system">
                    <div class="orbital-ring orbital-ring-1"></div>
                    <div class="orbital-ring orbital-ring-2"></div>
                    <div class="orbital-ring orbital-ring-3"></div>
                    <div class="energy-core"></div>
                    <div class="energy-core-inner"></div>
                </div>
                <img src="imagenes/logo.webp" class="loading-logo" alt="Logo">
            </div>
            <div class="loading-text" data-text="INICIALIZANDO SISTEMA...">INICIALIZANDO SISTEMA...</div>
            <div class="loading-progress-bar"><div class="loading-progress-fill"></div></div>
        `;
    },

    show() {
        let overlay = document.getElementById('global-loader');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'global-loader';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = this._getOverlayHTML();
            document.body.appendChild(overlay);
        }

        if (!this._initialized) {
            this.createParticles();
            this._initialized = true;
        }

        overlay.classList.remove('hidden');
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
        document.body.style.overflow = 'hidden';

        // Safety timeout: fuerza el cierre después de 10 segundos
        if (this._safetyTimer) clearTimeout(this._safetyTimer);
        this._safetyTimer = setTimeout(() => {
            console.warn('Loader safety timeout: forzando cierre del overlay.');
            this.hide();
        }, 10000);
    },

    hide() {
        if (this._safetyTimer) {
            clearTimeout(this._safetyTimer);
            this._safetyTimer = null;
        }
        const overlay = document.getElementById('global-loader');
        if (overlay) {
            overlay.style.transition = 'opacity 0.6s ease, visibility 0.6s';
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            document.body.style.overflow = '';

            // Mostrar el contenido del dashboard
            const dashContainer = document.querySelector('.dashboard-container');
            if (dashContainer) {
                dashContainer.style.opacity = '1';
            }

            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                this._initialized = false;
            }, 700);
        }
    },

    createParticles() {
        const container = document.getElementById('stars-container');
        if (!container) return;
        container.innerHTML = '';
        // Crear partículas de energía
        for (let i = 0; i < 80; i++) {
            const particle = document.createElement('div');
            particle.className = 'energy-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 3}s`;
            particle.style.animationDuration = `${1.5 + Math.random() * 3}s`;
            const size = 1 + Math.random() * 3;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            // Alternar colores entre cyan y rojo
            particle.style.background = Math.random() > 0.7 
                ? 'var(--primary-red)' 
                : 'var(--neon-cyan)';
            particle.style.boxShadow = Math.random() > 0.7
                ? '0 0 6px var(--primary-red), 0 0 12px var(--primary-red)'
                : '0 0 6px var(--neon-cyan), 0 0 12px var(--neon-cyan)';
            container.appendChild(particle);
        }
    }
};
