/**
 * TECH ROADMAP - THEME CONTROLLER
 * 
 * Handles theme switching between:
 * 1. Dark Theme (theme-dark)
 * 2. Light Yellow Theme (theme-yellow)
 * 3. Light Green Theme (theme-green)
 * 
 * Automatically reads/writes preference to localStorage so user settings
 * persist after browser refreshes. Works defensively across pages.
 */

// Theme names constant list
const THEMES = ['dark', 'yellow', 'green'];
const STORAGE_KEY = 'tech-roadmap-theme';
const DEFAULT_THEME = 'dark';

// This function runs immediately to set the theme class on the body before the layout draws.
// This prevents a brief screen flash of the wrong theme on slow connections.
function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    // If user has a preference, apply it. Otherwise, use default (dark).
    const themeToApply = savedTheme && THEMES.includes(savedTheme) ? savedTheme : DEFAULT_THEME;
    
    // Apply the class directly to the body element
    applyThemeClass(themeToApply);
}

// Helper function to remove old themes and add the new body theme class
function applyThemeClass(themeName) {
    THEMES.forEach(t => {
        document.body.classList.remove(`theme-${t}`);
    });
    document.body.classList.add(`theme-${themeName}`);
}

// Run the immediate initialization
initTheme();

// Set up UI interactions once the DOM content has fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // 1. SELECT DOM ELEMENTS (Defensively, check if they exist on the page first)
    const themeBtn = document.getElementById('theme-btn');
    const themeDropdown = document.getElementById('theme-dropdown');
    const themeOptions = document.querySelectorAll('.theme-opt-btn');
    const footerThemeButtons = document.querySelectorAll('[data-theme-footer]');
    const themeBtnIcon = document.getElementById('theme-btn-icon');

    // 2. APPLY SAVED STYLING STATE ON DROPDOWN BUTTONS
    const currentTheme = localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
    updateActiveUIElements(currentTheme);

    // 3. DROPDOWN TOGGLE INTERACTION
    if (themeBtn && themeDropdown) {
        themeBtn.addEventListener('click', (e) => {
            // Stop click event from bubbling up to document (which closes dropdown)
            e.stopPropagation();
            const isOpen = themeDropdown.classList.contains('show');
            
            if (isOpen) {
                closeThemeDropdown();
            } else {
                openThemeDropdown();
            }
        });
    }

    // 4. THEME SELECT BUTTONS (From the Header Dropdown)
    themeOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedTheme = btn.getAttribute('data-theme');
            if (selectedTheme) {
                changeTheme(selectedTheme);
                closeThemeDropdown();
            }
        });
    });

    // 5. THEME SELECT BUTTONS (From the Footer Quick Links)
    footerThemeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedTheme = btn.getAttribute('data-theme-footer');
            if (selectedTheme) {
                changeTheme(selectedTheme);
                // Scroll page back to top to let user enjoy the visual transition immediately
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    // 6. DETECT CLICKS OUTSIDE THE DROP-DOWN TO CLOSE IT
    document.addEventListener('click', (event) => {
        if (themeDropdown && themeDropdown.classList.contains('show')) {
            // If the user clicks outside the switcher button and dropdown list, close it
            if (!themeDropdown.contains(event.target) && !themeBtn.contains(event.target)) {
                closeThemeDropdown();
            }
        }
    });

    // 7. HANDLE ESCAPE KEY TO CLOSE THE THEME SELECTOR DROPDOWN
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeThemeDropdown();
        }
    });

    // ==========================================
    // UTILITY HELPER FUNCTIONS
    // ==========================================

    // Opens the dropdown with animation state
    function openThemeDropdown() {
        themeDropdown.classList.add('show');
        themeBtn.setAttribute('aria-expanded', 'true');
    }

    // Closes the dropdown
    function closeThemeDropdown() {
        if (themeDropdown) {
            themeDropdown.classList.remove('show');
            themeBtn.setAttribute('aria-expanded', 'false');
        }
    }

    // Changes theme globally
    function changeTheme(themeName) {
        if (!THEMES.includes(themeName)) return;

        // Apply theme class to the body
        applyThemeClass(themeName);

        // Save selection in localStorage
        localStorage.setItem(STORAGE_KEY, themeName);

        // Update active class indicators in header dropdown and footer list
        updateActiveUIElements(themeName);

        // Dispatch a custom event in case other scripts need to react to theme change (e.g. Canvas repaint)
        const event = new CustomEvent('themeChanged', { detail: { theme: themeName } });
        document.dispatchEvent(event);
    }

    // Sync active selection classes across navigation menu dropdown buttons
    function updateActiveUIElements(activeTheme) {
        // Update header dropdown button text indicator
        if (themeBtnIcon) {
            if (activeTheme === 'dark') themeBtnIcon.textContent = '🌙';
            else if (activeTheme === 'yellow') themeBtnIcon.textContent = '☀️';
            else if (activeTheme === 'green') themeBtnIcon.textContent = '🌱';
        }

        // Add/remove '.active' class on dropdown selection buttons
        themeOptions.forEach(btn => {
            const btnTheme = btn.getAttribute('data-theme');
            if (btnTheme === activeTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
});
