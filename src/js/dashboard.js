import { DashboardModule } from './modules/operations/dashboardModule.js';

/**
 * Main Entry Point
 */
document.addEventListener('DOMContentLoaded', () => {
    DashboardModule.init().catch(err => {
        console.error('Critical error during Dashboard initialization:', err);
    });

    // ── Hamburger sidebar toggle ─────────────────────────────────────────
    const sidebar = document.getElementById('sidebar');
    const hamBtn = document.getElementById('hamburger-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');
    const backdrop = document.getElementById('sidebar-backdrop');

    function openSidebar() {
        if (!sidebar) return;
        sidebar.classList.add('sidebar--open');
        backdrop.classList.add('backdrop--visible');
        hamBtn.setAttribute('aria-expanded', 'true');
        hamBtn.classList.add('is-active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        if (!sidebar) return;
        sidebar.classList.remove('sidebar--open');
        backdrop.classList.remove('backdrop--visible');
        hamBtn.setAttribute('aria-expanded', 'false');
        hamBtn.classList.remove('is-active');
        document.body.style.overflow = '';
    }

    if (hamBtn) hamBtn.addEventListener('click', () => sidebar.classList.contains('sidebar--open') ? closeSidebar() : openSidebar());
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (backdrop) backdrop.addEventListener('click', closeSidebar);

    // Auto-close sidebar on nav link click (mobile)
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 1024) closeSidebar();
        });
    });
});

