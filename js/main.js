/**
 * TECH ROADMAP - MAIN CONTROLLER & CANVAS ANIMATION
 * 
 * Handles:
 * 1. Mobile navigation menu transitions
 * 2. Header blur style modification on scroll
 * 3. Smooth scrolling for internal anchor links (with header offsets)
 * 4. High-performance, theme-aware canvas particle star field animation
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. MOBILE NAVIGATION MENU
    // ==========================================
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (mobileToggle && navMenu) {
        // Toggle menu visibility
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on any navigation link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // ==========================================
    // 2. HEADER SCROLL EFFECT
    // ==========================================
    const header = document.querySelector('.header');
    
    function checkHeaderScroll() {
        if (header) {
            if (window.scrollY > 30) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    }
    
    // Attach scroll listener and trigger initially in case page loaded scrolled down
    window.addEventListener('scroll', checkHeaderScroll);
    checkHeaderScroll();

    // ==========================================
    // 3. SMOOTH SCROLLING FOR INTERNALS
    // ==========================================
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return; // Skip empty hash links
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                
                // Get header height for accurate scroll offset positioning
                const headerHeight = header ? header.offsetHeight : 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 16; // Add margin

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==========================================
    // 4. ANIMATED CANVAS PARTICLE STARS
    // ==========================================
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return; // Exit if canvas is missing on current page

    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    let mouse = {
        x: null,
        y: null,
        radius: 120 // Interaction distance threshold
    };

    // Tracks mouse coordinates from document scope to allow interaction over pointer-events: none canvas
    window.addEventListener('mousemove', (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });

    // Clear coordinates when mouse leaves viewport
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Color storage variables dynamically synced with theme CSS variables
    let themeAccent = '#6366f1';
    let themeGlow = 'rgba(99, 102, 241, 0.1)';

    function syncThemeColors() {
        // Read active CSS variables dynamically from body styles
        const bodyStyles = getComputedStyle(document.body);
        themeAccent = bodyStyles.getPropertyValue('--accent-primary').trim() || '#6366f1';
        themeGlow = bodyStyles.getPropertyValue('--accent-glow').trim() || 'rgba(99, 102, 241, 0.15)';
    }

    // Sync colors initially and update whenever theme changes
    syncThemeColors();
    document.addEventListener('themeChanged', syncThemeColors);

    // Particle Object Blueprint
    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
            this.baseSize = size;
        }

        // Draws the circle particle
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        // Updates position and checks boundary collision and mouse interaction
        update() {
            // Screen edge check: reverse direction upon collision
            if (this.x > canvas.width || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.directionY = -this.directionY;
            }

            // Move particle
            this.x += this.directionX;
            this.y += this.directionY;

            // Mouse proximity interaction (push away effect)
            if (mouse.x !== null && mouse.y !== null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    // Push particles away gently from cursor
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    // Max force closer to mouse center
                    const force = (mouse.radius - distance) / mouse.radius;
                    const directionX = forceDirectionX * force * 1.5;
                    const directionY = forceDirectionY * force * 1.5;

                    this.x -= directionX;
                    this.y -= directionY;
                    
                    // Grow particle size slightly near mouse to create glowing flare focus
                    if (this.size < this.baseSize * 1.8) {
                        this.size += 0.1;
                    }
                } else if (this.size > this.baseSize) {
                    this.size -= 0.1;
                }
            } else if (this.size > this.baseSize) {
                this.size -= 0.1;
            }

            this.draw();
        }
    }

    // Set canvas dimensions and populate particles based on viewport area
    function initParticles() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        particlesArray = [];
        
        // Performance optimization: limit particle density on mobile screens
        let numberOfParticles = Math.floor((canvas.width * canvas.height) / 14000);
        if (numberOfParticles > 90) numberOfParticles = 90; // Hard cap for desktop
        if (numberOfParticles < 15) numberOfParticles = 15; // Minimum particle flow

        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 0.8; // radius size 0.8 - 2.8px
            let x = Math.random() * (window.innerWidth - size * 2) + size * 2;
            let y = Math.random() * (window.innerHeight - size * 2) + size * 2;
            
            // Slow, professional drifting velocity speeds
            let directionX = (Math.random() * 0.4) - 0.2;
            let directionY = (Math.random() * 0.4) - 0.2;
            let color = 'rgba(255, 255, 255, 0.45)'; // Soft star colors

            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    // Connects close neighboring particles with fading web lines
    function connectParticles() {
        let maxDistance = 120;
        
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a + 1; b < particlesArray.length; b++) {
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    // Line opacity drops as nodes drift further apart
                    let opacity = 1 - (distance / maxDistance);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.12})`;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Continuous Animation Frame loop
    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        // Draw connections first (beneath stars)
        connectParticles();

        // Update particle drift coordinates
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
    }

    // Throttled resize handler to prevent CPU stress during window drags
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            initParticles();
        }, 150);
    });

    // Fire initial setup and trigger loop
    initParticles();
    animate();
});
