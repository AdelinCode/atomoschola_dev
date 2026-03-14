// Search functionality
let searchTimeout;
let searchResults = {};
let isSearchVisible = false;

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupSearchFunctionality();
});

function setupSearchFunctionality() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');
    
    if (!searchInput) return;
    
    // Create search results container
    createSearchResultsContainer();
    
    // Search input events - doar Enter și focus/blur
    searchInput.addEventListener('focus', handleSearchFocus);
    searchInput.addEventListener('blur', handleSearchBlur);
    searchInput.addEventListener('keydown', handleSearchKeydown);
    
    // Search button click - aici facem search-ul
    if (searchBtn) {
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                showSearchLoading();
                performSearch(query);
            } else {
                hideSearchResults();
            }
        });
    }
    
    // Close search when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-bar') && !e.target.closest('.search-results')) {
            hideSearchResults();
        }
    });
}

function createSearchResultsContainer() {
    // Remove existing container
    const existing = document.getElementById('searchResults');
    if (existing) existing.remove();
    
    const searchBar = document.querySelector('.search-bar');
    if (!searchBar) return;
    
    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'searchResults';
    resultsContainer.className = 'search-results';
    resultsContainer.innerHTML = `
        <div class="search-results-content">
            <div class="search-loading" id="searchLoading" style="display: none;">
                <i class="fas fa-spinner fa-spin"></i> Searching...
            </div>
            <div class="search-results-list" id="searchResultsList"></div>
        </div>
    `;
    
    searchBar.appendChild(resultsContainer);
}

function handleSearchInput(e) {
    const query = e.target.value.trim();
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    if (query.length < 2) {
        hideSearchResults();
        return;
    }
    
    // Show loading
    showSearchLoading();
    
    // Debounce search
    searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 300);
}

function handleSearchFocus(e) {
    // Nu afișăm rezultate automat la focus
    // Utilizatorul trebuie să dea click pe iconița de search
}

function handleSearchBlur(e) {
    // Delay hiding to allow clicking on results
    setTimeout(() => {
        if (!document.querySelector('.search-results:hover')) {
            hideSearchResults();
        }
    }, 150);
}

function handleSearchKeydown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const query = e.target.value.trim();
        if (query.length >= 2) {
            showSearchLoading();
            performSearch(query);
        } else {
            hideSearchResults();
        }
    } else if (e.key === 'Escape') {
        hideSearchResults();
        e.target.blur();
    }
}

function handleSearchSubmit() {
    const query = document.getElementById('searchInput').value.trim();
    if (query.length >= 2) {
        window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
    }
}

async function performSearch(query) {
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/search?q=${encodeURIComponent(query)}&limit=8`);
        const data = await response.json();
        
        if (data.success) {
            searchResults = data.data;
            displaySearchResults(query);
        } else {
            showSearchError('Search failed');
        }
    } catch (error) {
        console.error('Search error:', error);
        showSearchError('Search unavailable');
    }
}

function displaySearchResults(query) {
    const resultsList = document.getElementById('searchResultsList');
    const loading = document.getElementById('searchLoading');
    
    if (!resultsList) return;
    
    loading.style.display = 'none';
    
    const { lessons, subjects, domains, categories } = searchResults;
    const totalResults = lessons.length + subjects.length + domains.length + categories.length;
    
    if (totalResults === 0) {
        resultsList.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search"></i>
                <p>No results found for "${query}"</p>
                <small>Try different keywords or check spelling</small>
            </div>
        `;
        showSearchResults();
        return;
    }
    
    let html = '';
    
    // Lessons
    if (lessons.length > 0) {
        html += `<div class="search-section">
            <h4><i class="fas fa-book"></i> Lessons</h4>
            <div class="search-items">`;
        
        lessons.forEach(lesson => {
            const stars = '★'.repeat(Math.round(lesson.averageRating || 0)) + '☆'.repeat(5 - Math.round(lesson.averageRating || 0));
            html += `
                <div class="search-item" onclick="window.location.href='lesson.html?id=${lesson._id}'">
                    <div class="search-item-icon">
                        <i class="fas fa-${getTypeIcon(lesson.type)}"></i>
                    </div>
                    <div class="search-item-content">
                        <div class="search-item-title">${highlightMatch(lesson.title, query)}</div>
                        <div class="search-item-meta">
                            <span class="search-item-path">${lesson.subject} → ${lesson.domain} → ${lesson.category}</span>
                            <span class="search-item-rating">${stars} ${(lesson.averageRating || 0).toFixed(1)}</span>
                        </div>
                        <div class="search-item-desc">${highlightMatch(lesson.description, query)}</div>
                    </div>
                    ${lesson.isPremium ? '<div class="search-item-premium"><i class="fas fa-crown"></i></div>' : ''}
                </div>
            `;
        });
        
        html += `</div></div>`;
    }
    
    // Subjects
    if (subjects.length > 0) {
        html += `<div class="search-section">
            <h4><i class="fas fa-graduation-cap"></i> Subjects</h4>
            <div class="search-items">`;
        
        subjects.forEach(subject => {
            html += `
                <div class="search-item" onclick="window.location.href='subject.html?subject=${subject.slug}'">
                    <div class="search-item-icon">
                        <i class="${subject.icon}"></i>
                    </div>
                    <div class="search-item-content">
                        <div class="search-item-title">${highlightMatch(subject.name, query)}</div>
                        <div class="search-item-desc">${highlightMatch(subject.description, query)}</div>
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
    }
    
    // Domains & Categories (combined for space)
    if (domains.length > 0 || categories.length > 0) {
        html += `<div class="search-section">
            <h4><i class="fas fa-layer-group"></i> Topics</h4>
            <div class="search-items">`;
        
        domains.forEach(domain => {
            html += `
                <div class="search-item" onclick="window.location.href='subject.html?subject=${domain.subjectSlug}'">
                    <div class="search-item-icon">
                        <i class="fas fa-layer-group"></i>
                    </div>
                    <div class="search-item-content">
                        <div class="search-item-title">${highlightMatch(domain.name, query)} <small>(Domain)</small></div>
                        <div class="search-item-meta">
                            <span class="search-item-path">${domain.subject}</span>
                        </div>
                        <div class="search-item-desc">${highlightMatch(domain.description, query)}</div>
                    </div>
                </div>
            `;
        });
        
        categories.forEach(category => {
            html += `
                <div class="search-item" onclick="window.location.href='subject.html?subject=${category.subjectSlug}'">
                    <div class="search-item-icon">
                        <i class="fas fa-folder"></i>
                    </div>
                    <div class="search-item-content">
                        <div class="search-item-title">${highlightMatch(category.name, query)} <small>(Category)</small></div>
                        <div class="search-item-meta">
                            <span class="search-item-path">${category.subject} → ${category.domain}</span>
                        </div>
                        <div class="search-item-desc">${highlightMatch(category.description, query)}</div>
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
    }
    
    // Show all results link
    if (totalResults > 0) {
        html += `
            <div class="search-footer">
                <a href="search-results.html?q=${encodeURIComponent(query)}" class="search-view-all">
                    <i class="fas fa-search"></i> View all ${totalResults} results
                </a>
            </div>
        `;
    }
    
    resultsList.innerHTML = html;
    showSearchResults();
}

function showSearchLoading() {
    const loading = document.getElementById('searchLoading');
    const resultsList = document.getElementById('searchResultsList');
    
    if (loading) loading.style.display = 'block';
    if (resultsList) resultsList.innerHTML = '';
    
    showSearchResults();
}

function showSearchError(message) {
    const loading = document.getElementById('searchLoading');
    const resultsList = document.getElementById('searchResultsList');
    
    if (loading) loading.style.display = 'none';
    if (resultsList) {
        resultsList.innerHTML = `
            <div class="search-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
    
    showSearchResults();
}

function showSearchResults() {
    const container = document.getElementById('searchResults');
    if (container) {
        container.style.display = 'block';
        isSearchVisible = true;
    }
}

function hideSearchResults() {
    const container = document.getElementById('searchResults');
    if (container) {
        container.style.display = 'none';
        isSearchVisible = false;
    }
}

function highlightMatch(text, query) {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function getTypeIcon(type) {
    const icons = {
        text: 'file-alt',
        video: 'video',
        audio: 'headphones',
        presentation: 'presentation'
    };
    return icons[type] || 'file';
}


// Load sidebar with all subjects
async function loadSearchSidebar() {
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
    }
}

// Load sidebar when page loads - ONLY on search.html
const currentPath = window.location.pathname;
if (document.getElementById('sidebarNav') && currentPath.includes('search.html')) {
    loadSearchSidebar();
    setupSearchSidebarToggle();
}

function setupSearchSidebarToggle() {
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
