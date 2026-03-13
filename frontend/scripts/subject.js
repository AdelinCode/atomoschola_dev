// Subject page - SIMPLIFIED VERSION
let currentSubject = 'physics';
let currentDomain = null;
let currentCategory = null;
let lessonsData = [];
let subjectsData = {};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Get subject from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentSubject = urlParams.get('subject') || 'physics';
    
    // Load data
    await loadData();
    
    // Load sidebar
    await loadSidebar();
    
    // Setup sidebar toggle
    setupSidebarToggle();
    
    // Display domains
    displayDomains();
    
    // Setup event listeners
    setupEventListeners();
});

// Load all data from API
async function loadData() {
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        
        // Load subjects
        const subjectsResponse = await fetch(`${apiUrl}/subjects`);
        const subjectsJson = await subjectsResponse.json();
        
        if (subjectsJson.success) {
            // Transform data
            subjectsJson.data.forEach(subject => {
                const domains = {};
                
                if (subject.domains) {
                    subject.domains.forEach(domain => {
                        const categories = {};
                        
                        if (domain.categories) {
                            domain.categories.forEach(category => {
                                categories[category.slug] = {
                                    _id: category._id,
                                    name: category.name,
                                    description: category.description,
                                    lessonCount: category.lessons ? category.lessons.length : 0
                                };
                            });
                        }
                        
                        domains[domain.slug] = {
                            _id: domain._id,
                            name: domain.name,
                            description: domain.description,
                            categories: categories
                        };
                    });
                }
                
                subjectsData[subject.slug] = {
                    _id: subject._id,
                    name: subject.name,
                    icon: subject.icon,
                    domains: domains
                };
            });
        }
        
        // Load lessons
        const lessonsResponse = await fetch(`${apiUrl}/lessons?subject=${currentSubject}&status=published`);
        const lessonsJson = await lessonsResponse.json();
        
        if (lessonsJson.success) {
            lessonsData = lessonsJson.data;
        }
        
        // Update page title
        const subject = subjectsData[currentSubject];
        if (subject) {
            document.getElementById('subjectTitle').textContent = subject.name;
            document.title = `${subject.name} - Atomo Schola`;
        }
        
        // Show authentication status
        updateAuthStatus();
        
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading data. Please refresh the page.');
    }
}

// Load sidebar with all subjects
async function loadSidebar() {
    const sidebarNav = document.getElementById('sidebarNav');
    if (!sidebarNav) return;
    
    try {
        const response = await window.API.subjects.getAll();
        
        if (response.success && response.data.length > 0) {
            sidebarNav.innerHTML = '';
            response.data.forEach(subject => {
                const link = document.createElement('a');
                link.href = `subject.html?subject=${subject.slug}`;
                link.className = 'sidebar-item';
                if (subject.slug === currentSubject) {
                    link.classList.add('active');
                }
                link.innerHTML = `
                    <i class="${subject.icon}"></i>
                    <span>${subject.name}</span>
                `;
                sidebarNav.appendChild(link);
            });
        } else {
            sidebarNav.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No subjects yet</p>';
        }
    } catch (error) {
        console.error('Error loading sidebar:', error);
        sidebarNav.innerHTML = '<p style="text-align: center; color: #dc3545; padding: 20px;">Error loading</p>';
    }
}

// Update authentication status in UI
function updateAuthStatus() {
    const token = localStorage.getItem('token');
    const isAuthenticated = !!token;
    
    // Add a notice if not authenticated
    if (!isAuthenticated) {
        const header = document.querySelector('.subject-header');
        if (header && !document.getElementById('authNotice')) {
            const notice = document.createElement('div');
            notice.id = 'authNotice';
            notice.style.cssText = 'background: #fff3cd; border: 1px solid #ffc107; padding: 12px 20px; border-radius: 6px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;';
            notice.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-info-circle" style="color: #856404;"></i>
                    <span style="color: #856404;">You are browsing as a guest. Login to access lessons.</span>
                </div>
                <a href="login.html" class="btn btn-primary" style="padding: 6px 16px; font-size: 14px;">Login</a>
            `;
            header.parentNode.insertBefore(notice, header);
        }
    }
}

// Display domains
function displayDomains() {
    const subject = subjectsData[currentSubject];
    
    if (!subject) {
        console.error('Subject not found:', currentSubject);
        return;
    }
    
    const grid = document.getElementById('domainsGrid');
    if (!grid) {
        console.error('domainsGrid not found');
        return;
    }
    
    grid.innerHTML = '';
    
    const domains = Object.entries(subject.domains);
    
    if (domains.length === 0) {
        grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No domains available</p>';
        return;
    }
    
    domains.forEach(([slug, domain]) => {
        const categoryCount = Object.keys(domain.categories).length;
        const lessonCount = Object.values(domain.categories).reduce((sum, cat) => sum + cat.lessonCount, 0);
        
        const card = document.createElement('div');
        card.className = 'domain-card';
        card.innerHTML = `
            <h3>${domain.name}</h3>
            <p>${domain.description}</p>
            <div class="domain-stats">
                <span><i class="fas fa-layer-group"></i> ${categoryCount} Categories</span>
                <span><i class="fas fa-book"></i> ${lessonCount} Lessons</span>
            </div>
        `;
        
        card.onclick = () => displayCategories(slug);
        card.style.cursor = 'pointer';
        grid.appendChild(card);
    });
}

// Display categories
function displayCategories(domainSlug) {
    currentDomain = domainSlug;
    
    const subject = subjectsData[currentSubject];
    const domain = subject.domains[domainSlug];
    
    if (!domain) {
        console.error('Domain not found:', domainSlug);
        return;
    }
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const isAuthenticated = !!token;
    
    // Show categories section
    const section = document.getElementById('categoriesSection');
    const title = document.getElementById('categoriesTitle');
    const grid = document.getElementById('categoriesGrid');
    
    section.style.display = 'block';
    title.textContent = `${domain.name} Categories`;
    grid.innerHTML = '';
    
    // Hide lessons section
    document.getElementById('lessonsSection').style.display = 'none';
    
    const categories = Object.entries(domain.categories);
    
    categories.forEach(([slug, category]) => {
        const card = document.createElement('div');
        card.className = 'category-card';
        
        if (isAuthenticated) {
            // Authenticated users see normal cards
            card.innerHTML = `
                <h3>${category.name}</h3>
                <p>${category.description}</p>
                <div class="category-stats">
                    <span><i class="fas fa-book"></i> ${category.lessonCount} Lessons</span>
                </div>
            `;
            card.onclick = () => displayLessons(slug, category);
        } else {
            // Non-authenticated users see locked cards
            card.innerHTML = `
                <h3>${category.name} <i class="fas fa-lock" style="font-size: 14px; color: #999; margin-left: 8px;"></i></h3>
                <p>${category.description}</p>
                <div class="category-stats">
                    <span><i class="fas fa-book"></i> ${category.lessonCount} Lessons</span>
                </div>
            `;
            card.style.opacity = '0.7';
            card.style.cursor = 'not-allowed';
            card.onclick = () => {
                if (confirm('You need to login to view lessons. Go to login page?')) {
                    window.location.href = 'login.html';
                }
            };
        }
        
        grid.appendChild(card);
    });
    
    // Scroll to section
    section.scrollIntoView({ behavior: 'smooth' });
}

// Display lessons
function displayLessons(categorySlug, category) {
    currentCategory = categorySlug;
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const isAuthenticated = !!token;
    
    // Show lessons section
    const section = document.getElementById('lessonsSection');
    const title = document.getElementById('lessonsTitle');
    const grid = document.getElementById('lessonsGrid');
    
    section.style.display = 'block';
    title.textContent = `${category.name} Lessons`;
    grid.innerHTML = '';
    
    // If not authenticated, show login message
    if (!isAuthenticated) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-lock" style="font-size: 48px; color: #6c757d; margin-bottom: 20px;"></i>
                <h3 style="color: #333; margin-bottom: 10px;">Login Required</h3>
                <p style="color: #6c757d; margin-bottom: 20px;">You need to be logged in to view lessons.</p>
                <a href="login.html" class="btn btn-primary" style="display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 6px;">
                    Login to Continue
                </a>
            </div>
        `;
        section.scrollIntoView({ behavior: 'smooth' });
        return;
    }
    
    // Filter lessons
    const filtered = lessonsData.filter(lesson => {
        if (typeof lesson.category === 'object' && lesson.category !== null) {
            return lesson.category._id === category._id;
        }
        return lesson.category === category._id;
    });
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No lessons available</p>';
        section.scrollIntoView({ behavior: 'smooth' });
        return;
    }
    
    // Apply filters
    const typeFilter = document.getElementById('filterType');
    let lessons = filtered;
    
    if (typeFilter && typeFilter.value !== 'all') {
        lessons = lessons.filter(l => l.type === typeFilter.value);
    }
    
    // Apply sorting
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        switch (sortBy.value) {
            case 'rating':
                lessons.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
                break;
            case 'newest':
                lessons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                lessons.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
        }
    }
    
    // Create lesson cards
    lessons.forEach(lesson => {
        const card = createLessonCard(lesson);
        grid.appendChild(card);
    });
    
    // Scroll to section
    section.scrollIntoView({ behavior: 'smooth' });
}

// Create lesson card
function createLessonCard(lesson) {
    const card = document.createElement('div');
    card.className = 'lesson-card';
    
    const typeIcons = {
        text: 'fas fa-file-alt',
        video: 'fas fa-video',
        audio: 'fas fa-headphones',
        presentation: 'fas fa-presentation'
    };
    
    const icon = typeIcons[lesson.type] || 'fas fa-file';
    const rating = lesson.averageRating || 0;
    const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
    
    // Get creator names
    let creators = 'Unknown';
    if (lesson.creators && lesson.creators.length > 0) {
        if (typeof lesson.creators[0] === 'object') {
            creators = lesson.creators.map(c => c.username || c.firstName || 'Unknown').join(', ');
        } else {
            creators = lesson.creators.join(', ');
        }
    }
    
    // Format date
    let date = 'Unknown';
    if (lesson.createdAt) {
        const d = new Date(lesson.createdAt);
        date = d.toLocaleDateString();
    }
    
    card.innerHTML = `
        <div class="lesson-header">
            <div class="lesson-type ${lesson.type}">
                <i class="${icon}"></i>
                ${lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}
            </div>
            <div class="lesson-title">${lesson.title}</div>
            <div class="lesson-description">${lesson.description}</div>
        </div>
        <div class="lesson-footer">
            <div class="lesson-rating">
                <div class="stars">${stars}</div>
                <span class="rating-value">${rating.toFixed(1)}</span>
            </div>
            <div class="lesson-meta">
                <div class="lesson-authors">
                    <i class="fas fa-user"></i>
                    ${creators}
                </div>
                <div class="lesson-date">
                    <i class="fas fa-calendar"></i>
                    ${date}
                </div>
            </div>
        </div>
    `;
    
    card.onclick = () => {
        window.location.href = `lesson.html?id=${lesson._id}`;
    };
    
    return card;
}

// Setup event listeners
function setupEventListeners() {
    const sortBy = document.getElementById('sortBy');
    const filterType = document.getElementById('filterType');
    
    if (sortBy) {
        sortBy.addEventListener('change', () => {
            if (currentCategory) {
                const subject = subjectsData[currentSubject];
                const domain = subject.domains[currentDomain];
                const category = domain.categories[currentCategory];
                displayLessons(currentCategory, category);
            }
        });
    }
    
    if (filterType) {
        filterType.addEventListener('change', () => {
            if (currentCategory) {
                const subject = subjectsData[currentSubject];
                const domain = subject.domains[currentDomain];
                const category = domain.categories[currentCategory];
                displayLessons(currentCategory, category);
            }
        });
    }
}


function setupSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const body = document.body;
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            body.classList.toggle('sidebar-collapsed');
            
            // Save state
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        });
        
        // Restore state
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState === 'true') {
            sidebar.classList.add('collapsed');
            body.classList.add('sidebar-collapsed');
        }
    }
}
