// Theme Management System
class ThemeManager {
    constructor() {
        this.storageKey = 'atomo-schola-theme';
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupThemeToggleListener();
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    getStoredTheme() {
        return localStorage.getItem(this.storageKey);
    }

    storeTheme(theme) {
        localStorage.setItem(this.storageKey, theme);
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
        this.currentTheme = theme;
        this.storeTheme(theme);
        this.updateToggleButton();
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    updateToggleButton() {
        const toggleBtn = document.getElementById('themeToggle');
        if (!toggleBtn) return;

        const icon = toggleBtn.querySelector('i');
        // Preserve animation classes when updating icon
        const animClasses = [...icon.classList].filter(c => c.startsWith('anim-'));
        if (this.currentTheme === 'dark') {
            icon.className = 'fas fa-sun';
            toggleBtn.setAttribute('title', 'Switch to Light Mode');
        } else {
            icon.className = 'fas fa-moon';
            toggleBtn.setAttribute('title', 'Switch to Dark Mode');
        }
        animClasses.forEach(c => icon.classList.add(c));
    }

    setupThemeToggleListener() {
        // Listen for theme toggle button clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('#themeToggle')) {
                e.preventDefault();
                this.toggleTheme();
            }
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!this.getStoredTheme()) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Initialize theme manager when DOM is loaded
let themeManager;

// Early theme application to prevent flash
(function() {
    const storedTheme = localStorage.getItem('atomo-schola-theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark-mode');
    }
})();

// Initialize theme manager after DOM loads
document.addEventListener('DOMContentLoaded', function() {
    themeManager = new ThemeManager();
    window.themeManager = themeManager;
    
    // Update button after nav renders (main.js runs after this)
    // Use MutationObserver to catch dynamically injected nav
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        const observer = new MutationObserver(function() {
            const btn = document.getElementById('themeToggle');
            if (btn) {
                themeManager.updateToggleButton();
                observer.disconnect();
            }
        });
        observer.observe(navMenu, { childList: true, subtree: true });
    }
});

// Export for use in other scripts
window.ThemeManager = ThemeManager;