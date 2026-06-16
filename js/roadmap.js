/**
 * TECH ROADMAP - ROADMAP & MIND MAP CONTROLLER
 * 
 * Handles:
 * 1. Progress tracker checkboxes, percentages, and localStorage syncing
 * 2. Side detail drawer updates and toggles
 * 3. Collapsible stage columns
 * 4. SVG mind map constellation line drawings with hover highlights
 */

document.addEventListener('DOMContentLoaded', () => {
    // Determine the active course identifier from the filename (e.g. "web-development")
    const courseId = getCourseId();
    const storageKey = `tech-roadmap-progress-${courseId}`;

    // ==========================================
    // 1. DYNAMIC DETAIL DRAWER POPULATION
    // ==========================================
    const detailDrawer = document.getElementById('detail-drawer');
    const drawerClose = document.getElementById('drawer-close');
    const nodes = document.querySelectorAll('.mindmap-node');
    
    // Parse the embedded JSON database
    let roadmapData = {};
    const dataElement = document.getElementById('roadmap-data');
    if (dataElement) {
        try {
            roadmapData = JSON.parse(dataElement.textContent);
        } catch (e) {
            console.error("Failed to parse roadmap JSON database: ", e);
        }
    }

    // Opens the drawer and populates it with JSON data
    function openDrawer(topicKey) {
        const data = roadmapData[topicKey];
        if (!data || !detailDrawer) return;

        // Set drawer DOM elements
        document.getElementById('drawer-title').textContent = data.title;
        document.getElementById('drawer-desc').textContent = data.desc;
        document.getElementById('drawer-order').textContent = `#${data.order}`;
        document.getElementById('drawer-time').textContent = `⏱️ ${data.time}`;

        // Set difficulty level badge with appropriate CSS class
        const badge = document.getElementById('drawer-level-badge');
        badge.textContent = data.level;
        badge.className = 'drawer-badge'; // Reset classes
        const levelLower = data.level.toLowerCase();
        badge.classList.add(`level-${levelLower}`);

        // Populate study links list
        const resourcesList = document.getElementById('drawer-resources');
        resourcesList.innerHTML = ''; // Clear old lists
        
        if (data.resources && data.resources.length > 0) {
            data.resources.forEach(res => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = res.url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = res.name;
                li.appendChild(a);
                resourcesList.appendChild(li);
            });
        } else {
            resourcesList.innerHTML = '<li>No resources listed for this topic.</li>';
        }

        // Slide the drawer onto screen
        detailDrawer.classList.add('open');
        detailDrawer.setAttribute('aria-hidden', 'false');
    }

    // Closes the detail drawer
    function closeDrawer() {
        if (detailDrawer) {
            detailDrawer.classList.remove('open');
            detailDrawer.setAttribute('aria-hidden', 'true');
        }
        // Remove active node card outline highlighting
        nodes.forEach(n => n.classList.remove('active-node'));
    }

    // Attach click listeners to all node cards
    nodes.forEach(node => {
        node.addEventListener('click', (e) => {
            // Prevent drawer trigger if clicking the progress checkbox
            if (e.target.type === 'checkbox') return;

            const topicKey = node.getAttribute('data-topic');
            if (topicKey) {
                // Remove active classes from all cards, then highlight clicked card
                nodes.forEach(n => n.classList.remove('active-node'));
                node.classList.add('active-node');
                
                openDrawer(topicKey);
            }
        });
    });

    if (drawerClose) {
        drawerClose.addEventListener('click', closeDrawer);
    }

    // Close drawer when clicking outside the drawer boundaries
    document.addEventListener('click', (e) => {
        if (detailDrawer && detailDrawer.classList.contains('open')) {
            // Click target must not be a node card, or inside the drawer itself
            let isClickOnNode = false;
            nodes.forEach(node => {
                if (node.contains(e.target)) isClickOnNode = true;
            });

            if (!detailDrawer.contains(e.target) && !isClickOnNode) {
                closeDrawer();
            }
        }
    });

    // Close drawer on hitting escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDrawer();
        }
    });

    // ==========================================
    // 2. PROGRESS TRACKING & LOCALSTORAGE SYNC
    // ==========================================
    const checkboxes = document.querySelectorAll('.node-checkbox');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    const progressBadge = document.getElementById('progress-percentage-badge');

    // Retrieve previous completions or initialize empty tracker object
    let completedTopics = {};
    try {
        const savedProgress = localStorage.getItem(storageKey);
        if (savedProgress) {
            completedTopics = JSON.parse(savedProgress);
        }
    } catch (e) {
        console.error("Failed to read progress storage: ", e);
    }

    // Updates progress percentages on GUI elements
    function calculateProgress() {
        const total = checkboxes.length;
        if (total === 0) return;

        let completed = 0;
        checkboxes.forEach(chk => {
            const topicId = chk.getAttribute('data-topic-id');
            const parentNode = chk.closest('.mindmap-node');
            
            if (completedTopics[topicId]) {
                chk.checked = true;
                completed++;
                if (parentNode) parentNode.classList.add('completed-node');
            } else {
                chk.checked = false;
                if (parentNode) parentNode.classList.remove('completed-node');
            }
        });

        const percentage = Math.round((completed / total) * 100);

        // Update progress bar width
        if (progressBarFill) {
            progressBarFill.style.width = `${percentage}%`;
        }

        // Update progress indicators text
        if (progressText) {
            progressText.textContent = `${completed} of ${total} Topics Completed (${percentage}%)`;
        }

        if (progressBadge) {
            progressBadge.textContent = `${percentage}%`;
        }
    }

    // Checkbox toggling event listener
    checkboxes.forEach(chk => {
        chk.addEventListener('change', () => {
            const topicId = chk.getAttribute('data-topic-id');
            const parentNode = chk.closest('.mindmap-node');
            
            if (chk.checked) {
                completedTopics[topicId] = true;
                if (parentNode) parentNode.classList.add('completed-node');
            } else {
                delete completedTopics[topicId];
                if (parentNode) parentNode.classList.remove('completed-node');
            }

            // Sync states to local storage
            localStorage.setItem(storageKey, JSON.stringify(completedTopics));

            // Recalculate percent stats
            calculateProgress();
            
            // Refresh SVG connection active line highlight states
            updateSVGActiveLines();
        });
    });

    // Run initial progress restore
    calculateProgress();

    // ==========================================
    // 3. COLLAPSIBLE LEVEL SECTIONS
    // ==========================================
    const columnHeaders = document.querySelectorAll('.column-header');
    
    columnHeaders.forEach(header => {
        // Accessibility attribute setting
        header.setAttribute('role', 'button');
        header.setAttribute('aria-expanded', 'true');
        header.style.cursor = 'pointer';

        header.addEventListener('click', () => {
            const columnNodes = header.nextElementSibling;
            if (columnNodes) {
                const isCollapsed = columnNodes.classList.toggle('collapsed-column');
                header.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');

                // Animate transition using simple JS inline max heights
                if (isCollapsed) {
                    columnNodes.style.display = 'none';
                } else {
                    columnNodes.style.display = 'flex';
                }
                
                // Recalculate SVG connection endpoints since nodes shifted positions
                setTimeout(drawConnectingLines, 50);
            }
        });
    });

    // ==========================================
    // 4. SVG MIND MAP CONNECTION LINES
    // ==========================================
    const svgCanvas = document.getElementById('mindmap-svg');
    const container = document.querySelector('.mindmap-container');

    // Defines parent-to-child map references (Matches html topic attributes)
    const connections = [
        { parent: 'html', child: 'git' },
        { parent: 'css', child: 'responsive' },
        { parent: 'javascript', child: 'apis' },
        { parent: 'javascript', child: 'devtools' },
        { parent: 'git', child: 'deployment' },
        { parent: 'apis', child: 'react' },
        { parent: 'apis', child: 'nodejs' },
        { parent: 'responsive', child: 'react' },
        { parent: 'devtools', child: 'performance' },
        { parent: 'react', child: 'deployment' },
        { parent: 'react', child: 'performance' },
        { parent: 'nodejs', child: 'database' },
        { parent: 'nodejs', child: 'auth' },
        { parent: 'database', child: 'deployment' },
        { parent: 'auth', child: 'deployment' }
    ];

    // Draws SVG bezier curves connecting parent/child nodes
    function drawConnectingLines() {
        if (!svgCanvas || !container) return;

        // Clear previous lines
        svgCanvas.innerHTML = '';

        // Adjust SVG viewport boundaries to fit full container height
        svgCanvas.style.width = `${container.scrollWidth}px`;
        svgCanvas.style.height = `${container.scrollHeight}px`;

        const containerRect = container.getBoundingClientRect();

        connections.forEach((conn, index) => {
            const parentElement = document.querySelector(`.mindmap-node[data-topic="${conn.parent}"]`);
            const childElement = document.querySelector(`.mindmap-node[data-topic="${conn.child}"]`);

            // If either column is collapsed, hide connection lines
            if (!parentElement || !childElement) return;
            if (parentElement.closest('.column-nodes').classList.contains('collapsed-column')) return;
            if (childElement.closest('.column-nodes').classList.contains('collapsed-column')) return;

            const parentRect = parentElement.getBoundingClientRect();
            const childRect = childElement.getBoundingClientRect();

            // Calculate starting coordinates relative to the mindmap container
            const startX = parentRect.right - containerRect.left + container.scrollLeft;
            const startY = parentRect.top + (parentRect.height / 2) - containerRect.top + container.scrollTop;

            // Calculate ending coordinates relative to the mindmap container
            const endX = childRect.left - containerRect.left + container.scrollLeft;
            const endY = childRect.top + (childRect.height / 2) - containerRect.top + container.scrollTop;

            // Draw a smooth cubic bezier curve between nodes
            const controlOffset = Math.abs(endX - startX) * 0.5;
            const pathData = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;

            // Create SVG path element
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('class', 'mindmap-line');
            path.setAttribute('id', `line-${conn.parent}-${conn.child}`);
            path.setAttribute('data-parent', conn.parent);
            path.setAttribute('data-child', conn.child);

            svgCanvas.appendChild(path);
        });

        // Set active line glows if connections represent completed tasks
        updateSVGActiveLines();
    }

    // Highlights lines connecting completed nodes
    function updateSVGActiveLines() {
        const lines = document.querySelectorAll('.mindmap-line');
        lines.forEach(line => {
            const parent = line.getAttribute('data-parent');
            const child = line.getAttribute('data-child');

            // If both parent and child topics are completed, light up the line!
            if (completedTopics[parent] && completedTopics[child]) {
                line.classList.add('active');
            } else {
                line.classList.remove('active');
            }
        });
    }

    // Highlight connecting lines on hover
    nodes.forEach(node => {
        node.addEventListener('mouseenter', () => {
            const topic = node.getAttribute('data-topic');
            const lines = document.querySelectorAll('.mindmap-line');
            
            lines.forEach(line => {
                const parent = line.getAttribute('data-parent');
                const child = line.getAttribute('data-child');
                
                // If this line connects to the hovered node, highlight it
                if (parent === topic || child === topic) {
                    line.style.stroke = 'var(--accent-primary)';
                    line.style.strokeWidth = '3.5';
                }
            });
        });

        node.addEventListener('mouseleave', () => {
            const lines = document.querySelectorAll('.mindmap-line');
            lines.forEach(line => {
                // Reset styles to default (CSS handles class state overrides)
                line.style.stroke = '';
                line.style.strokeWidth = '';
            });
        });
    });

    // Redraw connections on browser resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(drawConnectingLines, 150);
    });

    // Run initial canvas lines layout draw after rendering completes
    setTimeout(drawConnectingLines, 200);

    // ==========================================
    // UTILITY HELPER FUNCTIONS
    // ==========================================

    // Extract course ID string from active URL path (e.g. pages/web-development.html -> "web-development")
    function getCourseId() {
        const path = window.location.pathname;
        const page = path.substring(path.lastIndexOf('/') + 1);
        return page.replace('.html', '');
    }
});
