class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.body = document.body;
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        this.init();
    }

    init() {
        // Set initial theme
        this.setTheme(this.currentTheme);
        
        // Add event listener
        this.themeToggle.addEventListener('click', () => {
            this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            this.setTheme(this.currentTheme);
        });
    }

    setTheme(theme) {
        if (theme === 'dark') {
            this.body.classList.add('dark-mode');
            this.body.classList.remove('light-mode');
        } else {
            this.body.classList.add('light-mode');
            this.body.classList.remove('dark-mode');
        }
        localStorage.setItem('theme', theme);
    }
}

// Initialize theme manager
new ThemeManager();
