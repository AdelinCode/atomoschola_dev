// Global variables
let currentUser = null;

// DOM Elements
const accountBtn = document.getElementById('accountBtn');
const accountDropdown = document.getElementById('accountDropdown');
const searchInput = document.getElementById('searchInput');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateUIBasedOnUserType();
    setupMobileNav();
    
    // Only load homepage data on index.html
    const currentPath = window.location.pathname;
    if (currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/')) {
        loadHomepageData();
    }
});

function initializeApp() {
    // Check if user is logged in
    if (window.API && window.API.isAuthenticated()) {
        currentUser = window.API.getUser();
        renderAuthenticatedNav();
        // Hide guest-only CTA section
        const ctaSection = document.getElementById('ctaSection');
        if (ctaSection) ctaSection.style.display = 'none';
        // Hide footer register link when logged in
        const footerRegisterLink = document.getElementById('footerRegisterLink')
            || document.querySelector('.site-footer a[href="register.html"]');
        if (footerRegisterLink) footerRegisterLink.style.display = 'none';
    } else {
        currentUser = null;
        renderGuestNav();
        
        // Only redirect to login for protected pages
        const currentPath = window.location.pathname;
        const protectedPages = ['dashboard.html', 'profile.html', 'settings.html'];
        const isProtected = protectedPages.includes(currentPath.split('/').pop());
        
        if (isProtected) {
            alert('Please login to access this page');
            window.location.href = 'login.html';
        }
    }
}

function renderGuestNav() {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;
    
    navMenu.innerHTML = `
        <button class="theme-toggle-btn" id="themeToggle" title="Switch to Dark Mode">
            <i class="fas fa-moon"></i>
        </button>
        <div class="account-dropdown">
            <button class="account-btn" id="coursesBtn">
                <i class="fas fa-graduation-cap"></i>
                <span>Courses</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="dropdown-menu" id="coursesDropdown">
                <a href="index.html"><i class="fas fa-home"></i> Main Page</a>
                <a href="stem.html"><i class="fas fa-atom"></i> STEM</a>
                <a href="humanities.html"><i class="fas fa-book-reader"></i> Humanities</a>
            </div>
        </div>
        <div class="account-dropdown nav-hover-dropdown">
            <button class="account-btn" id="contributorsGuestBtn">
                <i class="fas fa-users-cog"></i>
                <span>Contributors</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="dropdown-menu" id="contributorsGuestDropdown">
                <a href="staff.html"><i class="fas fa-users-cog"></i> Contributors</a>
                <a href="#" onclick="showLeaderboardModal(); return false;"><i class="fas fa-trophy"></i> Leaderboard</a>
                <a href="events.html"><i class="fas fa-calendar-alt"></i> Events</a>
            </div>
        </div>
        <a href="login.html" class="nav-item">
            <i class="fas fa-sign-in-alt"></i>
            <span>Login</span>
        </a>
        <a href="register.html" class="nav-item">
            <i class="fas fa-user-plus"></i>
            <span>Register</span>
        </a>
    `;
    
    // Setup courses dropdown
    setupCoursesDropdown();
    setupHoverDropdowns();
    
    // Update theme toggle icon after nav is rendered
    if (window.themeManager) {
        window.themeManager.updateToggleButton();
    }
}

function renderAuthenticatedNav() {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;
    
    let navItems = '';

    // Theme toggle button (before Courses)
    navItems += `
        <button class="theme-toggle-btn" id="themeToggle" title="Switch to Dark Mode">
            <i class="fas fa-moon"></i>
        </button>
    `;
    
    // Add Courses dropdown for all users
    navItems += `
        <div class="account-dropdown">
            <button class="account-btn" id="coursesBtn">
                <i class="fas fa-graduation-cap"></i>
                <span>Courses</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="dropdown-menu" id="coursesDropdown">
                <a href="index.html"><i class="fas fa-home"></i> Main Page</a>
                <a href="stem.html"><i class="fas fa-atom"></i> STEM</a>
                <a href="humanities.html"><i class="fas fa-book-reader"></i> Humanities</a>
            </div>
        </div>
    `;
    
    // Add Staff button for all users
    navItems += `
        <div class="account-dropdown nav-hover-dropdown">
            <button class="account-btn" id="contributorsBtn">
                <i class="fas fa-users-cog"></i>
                <span>Contributors</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="dropdown-menu" id="contributorsDropdown">
                <a href="staff.html"><i class="fas fa-users-cog"></i> Contributors</a>
                <a href="#" onclick="showLeaderboardModal(); return false;"><i class="fas fa-trophy"></i> Leaderboard</a>
                <a href="events.html"><i class="fas fa-calendar-alt"></i> Events</a>
            </div>
        </div>
    `;
    
    // Build Dashboard dropdown (only if user has access to at least one dashboard)
    const hasDashboardAccess =
        ['creator', 'editor', 'staff', 'owner'].includes(currentUser.userType) ||
        currentUser.isCreatorCommissionMember ||
        currentUser.isEditorCommissionMember;

    if (hasDashboardAccess) {
        let dashboardItems = '';

        if (['creator', 'editor', 'staff', 'owner'].includes(currentUser.userType)) {
            dashboardItems += `<a href="create-content.html"><i class="fas fa-plus-circle"></i> Create Content</a>`;
            dashboardItems += `<a href="lesson-review.html"><i class="fas fa-clipboard-check"></i> Review Dashboard</a>`;
        }
        if (currentUser.userType === 'staff') {
            dashboardItems += `<a href="staff-dashboard.html"><i class="fas fa-tasks"></i> Staff Dashboard</a>`;
        }
        if (currentUser.isCreatorCommissionMember) {
            dashboardItems += `<a href="commission-dashboard.html"><i class="fas fa-gavel"></i> Creator Commission</a>`;
        }
        if (currentUser.isEditorCommissionMember) {
            dashboardItems += `<a href="editor-commission-dashboard.html"><i class="fas fa-pen-fancy"></i> Editor Commission</a>`;
        }
        if (currentUser.userType === 'owner') {
            dashboardItems += `<a href="dashboard.html"><i class="fas fa-crown"></i> Owner Dashboard</a>`;
        }

        navItems += `
            <div class="account-dropdown">
                <button class="account-btn" id="dashboardBtn">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="dropdown-menu" id="dashboardDropdown">
                    ${dashboardItems}
                </div>
            </div>
        `;
    }

    // Account dropdown
    navItems += `
        <div class="account-dropdown">
            <button class="account-btn" id="accountBtn">
                <i class="fas fa-user-circle"></i>
                <span>${currentUser.username}</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="dropdown-menu" id="accountDropdown">
                <div class="dropdown-header">
                    <strong>${currentUser.username}</strong>
                    <small>${capitalizeFirst(currentUser.userType)}</small>
                </div>
                <div class="dropdown-divider"></div>
                <a href="#" id="inboxBtn" style="position:relative;">
                    <i class="fas fa-envelope"></i> Inbox
                    <span id="notificationBadge" style="display: none; position: absolute; top: 50%; right: 12px; transform: translateY(-50%); background: #dc3545; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; font-weight: bold; align-items: center; justify-content: center;">0</span>
                </a>
                <a href="public-profile.html?id=${encodeURIComponent(currentUser._id)}" class="nav-profile-link"><i class="fas fa-user"></i> Profile</a>
                <a href="#" id="bookmarksBtn"><i class="fas fa-bookmark"></i> My Bookmarks</a>
                <a href="settings.html"><i class="fas fa-cog"></i> Settings</a>
                ${currentUser.userType === 'user' ? '<a href="#" id="useCodeBtn"><i class="fas fa-key"></i> Use Invite Code</a>' : ''}
                <div class="dropdown-divider"></div>
                <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</a>
            </div>
        </div>
    `;

    navMenu.innerHTML = navItems;
    
    // Setup event listeners
    setupNavEventListeners();
    setupCoursesDropdown();
    setupDashboardDropdown();
    setupHoverDropdowns();
}

function setupEventListeners() {
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });

        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', function() {
                performSearch(searchInput.value);
            });
        }
    }
}

function setupNavEventListeners() {
    // Account dropdown — hover + click fallback
    const accountBtn = document.getElementById('accountBtn');
    const accountDropdown = document.getElementById('accountDropdown');

    if (accountBtn && accountDropdown) {
        const wrapper = accountBtn.closest('.account-dropdown');

        if (wrapper) {
            wrapper.addEventListener('mouseenter', function() {
                accountDropdown.classList.add('show');
            });
            wrapper.addEventListener('mouseleave', function() {
                accountDropdown.classList.remove('show');
            });
        }

        accountBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            accountDropdown.classList.toggle('show');
            const coursesDropdown = document.getElementById('coursesDropdown');
            if (coursesDropdown) coursesDropdown.classList.remove('show');
        });

        document.addEventListener('click', function() {
            accountDropdown.classList.remove('show');
        });
    }
    
    // Bookmarks button
    const bookmarksBtn = document.getElementById('bookmarksBtn');
    if (bookmarksBtn) {
        bookmarksBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showBookmarksModal();
        });
    }

    // Inbox button
    const inboxBtn = document.getElementById('inboxBtn');
    if (inboxBtn) {
        inboxBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('accountDropdown')?.classList.remove('show');
            window.location.href = 'inbox.html';
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    
    // Use code button
    const useCodeBtn = document.getElementById('useCodeBtn');
    if (useCodeBtn) {
        useCodeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showUseCodeModal();
        });
    }

    // Initialize theme toggle after nav is rendered
    if (window.themeManager) {
        window.themeManager.updateToggleButton();
    }
}

function setupCoursesDropdown() {
    const wrapper = document.getElementById('coursesBtn')?.closest('.account-dropdown');
    const coursesDropdown = document.getElementById('coursesDropdown');

    if (!wrapper || !coursesDropdown) return;

    // Hover
    wrapper.addEventListener('mouseenter', function() {
        coursesDropdown.classList.add('show');
    });
    wrapper.addEventListener('mouseleave', function() {
        coursesDropdown.classList.remove('show');
    });

    // Click (fallback / mobile)
    document.getElementById('coursesBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        coursesDropdown.classList.toggle('show');
        const accountDropdown = document.getElementById('accountDropdown');
        const dashboardDropdown = document.getElementById('dashboardDropdown');
        if (accountDropdown) accountDropdown.classList.remove('show');
        if (dashboardDropdown) dashboardDropdown.classList.remove('show');
    });

    document.addEventListener('click', function() {
        coursesDropdown.classList.remove('show');
    });
}

function setupDashboardDropdown() {
    const dashboardBtn = document.getElementById('dashboardBtn');
    const dashboardDropdown = document.getElementById('dashboardDropdown');

    if (!dashboardBtn || !dashboardDropdown) return;

    const wrapper = dashboardBtn.closest('.account-dropdown');

    // Hover
    if (wrapper) {
        wrapper.addEventListener('mouseenter', function() {
            dashboardDropdown.classList.add('show');
        });
        wrapper.addEventListener('mouseleave', function() {
            dashboardDropdown.classList.remove('show');
        });
    }

    // Click (fallback / mobile)
    dashboardBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dashboardDropdown.classList.toggle('show');
        const accountDropdown = document.getElementById('accountDropdown');
        const coursesDropdown = document.getElementById('coursesDropdown');
        if (accountDropdown) accountDropdown.classList.remove('show');
        if (coursesDropdown) coursesDropdown.classList.remove('show');
    });

    document.addEventListener('click', function() {
        dashboardDropdown.classList.remove('show');
    });
}

function setupHoverDropdowns() {
    document.querySelectorAll('.nav-hover-dropdown').forEach(wrapper => {
        const dropdown = wrapper.querySelector('.dropdown-menu');
        if (!dropdown) return;

        wrapper.addEventListener('mouseenter', () => dropdown.classList.add('show'));
        wrapper.addEventListener('mouseleave', () => dropdown.classList.remove('show'));
    });
}

function showLeaderboardModal() {
    let modal = document.getElementById('leaderboardModal');
    if (!modal) {
        modal = document.createElement('dialog');
        modal.id = 'leaderboardModal';
        modal.className = 'contributors-leaderboard';
        modal.setAttribute('aria-labelledby', 'lbTitle');
        modal.innerHTML = `
            <header class="lb-heading">
                <div>
                    <h2 id="lbTitle">Leaderboard</h2>
                    <p class="lb-timer"><i class="fas fa-clock" aria-hidden="true"></i> <span id="lbTimerText">Loading...</span></p>
                </div>
                <form method="dialog"><button class="contributors-button" autofocus aria-label="Close leaderboard">&times;</button></form>
            </header>
            <details class="lb-score-info">
                <summary>How rating works</summary>
                <ul>
                    <li><strong>×15</strong> Average rating on lessons from the last 3 months</li>
                    <li><strong>×10</strong> Average rating on lessons from 3–12 months ago</li>
                    <li><strong>×7.5</strong> Average rating on lessons older than 12 months</li>
                    <li><strong>×1</strong> Total published lessons or approved edits</li>
                </ul>
            </details>
            <div class="lb-columns">
                <section class="contributors-group accent-creator">
                    <div class="contributors-group-heading"><span class="contributors-role-icon" aria-hidden="true"><i class="fas fa-edit"></i></span><h3>Creators</h3></div>
                    <ol class="lb-list" id="lbCreators" aria-live="polite"></ol>
                </section>
                <section class="contributors-group accent-editor">
                    <div class="contributors-group-heading"><span class="contributors-role-icon" aria-hidden="true"><i class="fas fa-pen-fancy"></i></span><h3>Editors</h3></div>
                    <ol class="lb-list" id="lbEditors" aria-live="polite"></ol>
                </section>
            </div>
        `;

        modal.addEventListener('click', event => {
            if (event.target !== modal) return;
            const bounds = modal.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right ||
                event.clientY < bounds.top || event.clientY > bounds.bottom) modal.close();
        });
        modal.addEventListener('close', () => {
            if (modal.open) return;
            clearInterval(_lbTimerInterval);
            leaderboardRequest?.abort();
        });
        document.body.append(modal);
    }

    if (modal.open) return;
    modal.showModal();
    modal.scrollTop = 0;
    loadLeaderboard();
    startLbTimer();
}

// Countdown timer until next commission rotation (1st of next month)
let _lbTimerInterval = null;

function startLbTimer() {
    const el = document.getElementById('lbTimerText');
    if (!el) return;

    // Clear any existing interval
    if (_lbTimerInterval) clearInterval(_lbTimerInterval);

    function getNextRotation() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 5, 0);
    }

    function formatCountdown(ms) {
        if (ms <= 0) return 'Rotation imminent';
        const d = Math.floor(ms / 86400000);
        const h = Math.floor((ms % 86400000) / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        if (d > 0) return `Next rotation in ${d}d ${h}h ${m}m`;
        if (h > 0) return `Next rotation in ${h}h ${m}m ${s}s`;
        return `Next rotation in ${m}m ${s}s`;
    }

    function tick() {
        const el = document.getElementById('lbTimerText');
        if (!el) { clearInterval(_lbTimerInterval); return; }
        const ms = getNextRotation() - Date.now();
        el.textContent = formatCountdown(ms);
    }

    tick();
    _lbTimerInterval = setInterval(tick, 1000);
}

let leaderboardRequest;

function setLeaderboardMessage(list, message) {
    const item = document.createElement('li');
    item.className = 'contributors-state';
    item.textContent = message;
    list.replaceChildren(item);
}

async function loadLeaderboard() {
    const creators = document.getElementById('lbCreators');
    const editors = document.getElementById('lbEditors');
    setLeaderboardMessage(creators, 'Loading...');
    setLeaderboardMessage(editors, 'Loading...');
    leaderboardRequest?.abort();
    const controller = new AbortController();
    leaderboardRequest = controller;

    try {
        const apiUrl = window.CONFIG?.API_BASE_URL || 'http://localhost:5000/api';
        const response = await fetch(apiUrl + '/leaderboard', { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error('Could not load leaderboard.');
        if (controller.signal.aborted) return;
        renderLeaderboardList(creators, result.data.creators, 'creator');
        renderLeaderboardList(editors, result.data.editors, 'editor');
    } catch (error) {
        if (controller.signal.aborted) return;
        setLeaderboardMessage(creators, 'Could not load leaderboard.');
        setLeaderboardMessage(editors, 'Could not load leaderboard.');
    }
}

function renderLeaderboardList(list, users, type) {
    if (!users?.length) {
        setLeaderboardMessage(list, 'No entries yet.');
        return;
    }

    list.replaceChildren();
    const isCreator = type === 'creator';
    const medals = ['gold', 'silver', 'bronze'];
    for (const user of users) {
        const item = document.createElement('li');
        item.className = 'lb-entry';
        const medal = medals[user.rank - 1];
        if (medal) item.classList.add('lb-' + medal);
        item.innerHTML = `
            <a class="lb-person">
                <span class="lb-rank"></span>
                <span class="lb-identity"><strong></strong><span class="lb-meta"></span></span>
                <span class="lb-score"><strong></strong><small>pts</small></span>
            </a>
        `;
        item.firstElementChild.href = 'public-profile.html?id=' + encodeURIComponent(user._id);
        item.querySelector('.lb-rank').textContent = user.rank;
        item.querySelector('.lb-identity strong').textContent = user.displayName || user.username || 'Contributor';
        const activity = isCreator ? (user.lessonsCount ?? 0) + ' lessons' : (user.editsCount ?? 0) + ' edits';
        const rating = isCreator && user.avgRating > 0 ? ' · ★ ' + user.avgRating.toFixed(1) : '';
        item.querySelector('.lb-meta').textContent = activity + rating;
        item.querySelector('.lb-score strong').textContent = user.score ?? 0;
        list.append(item);
    }
}

// Show bookmarks modal
async function showBookmarksModal() {
    try {
        const response = await window.API.users.getProfile();
        
        if (!response.success) {
            alert('Error loading bookmarks');
            return;
        }
        
        const bookmarkedLessons = response.data.bookmarkedLessons || [];
        
        let modal = document.getElementById('bookmarksModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'bookmarksModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        let lessonsHTML = '';
        if (bookmarkedLessons.length === 0) {
            lessonsHTML = '<p style="text-align: center; color: #999; padding: 40px;">No bookmarked lessons yet</p>';
        } else {
            lessonsHTML = '<div style="display: grid; gap: 15px;">';
            bookmarkedLessons.forEach(lesson => {
                lessonsHTML += `
                    <div style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; cursor: pointer;" onclick="window.location.href='lesson.html?id=${lesson._id}'">
                        <h4 style="margin: 0 0 8px 0;">${lesson.title}</h4>
                        <p style="margin: 0; color: #666; font-size: 14px;">${lesson.description}</p>
                    </div>
                `;
            });
            lessonsHTML += '</div>';
        }
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fas fa-bookmark"></i> My Bookmarks</h3>
                    <button class="modal-close" onclick="document.getElementById('bookmarksModal').style.display='none'">&times;</button>
                </div>
                <div class="modal-body">
                    ${lessonsHTML}
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading bookmarks:', error);
        alert('Error loading bookmarks');
    }
}

// Show use code modal for current user
function showUseCodeModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('userUpgradeModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'userUpgradeModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 0; max-width: 500px; width: 90%; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); border: 2px solid #000;">
                <div style="padding: 20px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #000;">Upgrade Account</h3>
                    <button onclick="closeUserUpgradeModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <p style="color: #666; margin-bottom: 16px;">Enter an invite code to upgrade your account to Creator or Editor.</p>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-weight: 600; color: #000; margin-bottom: 8px;">Invite Code:</label>
                        <input type="text" id="userUpgradeCode" placeholder="Enter 16-digit code" maxlength="16" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 15px; box-sizing: border-box;">
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button onclick="closeUserUpgradeModal()" style="flex: 1; padding: 12px; background: #f5f5f5; color: #000; border: 2px solid #e0e0e0; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
                        <button onclick="applyUserUpgradeCode()" style="flex: 1; padding: 12px; background: #000; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Apply Code</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    modal.style.display = 'flex';
    document.getElementById('userUpgradeCode').value = '';
}

// Close use code modal
window.closeUserUpgradeModal = function() {
    const modal = document.getElementById('userUpgradeModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Apply upgrade code for current user
window.applyUserUpgradeCode = async function() {
    const code = document.getElementById('userUpgradeCode').value.trim();
    
    if (!code) {
        alert('Please enter an invite code');
        return;
    }
    
    if (code.length !== 16) {
        alert('Invite code must be 16 characters');
        return;
    }
    
    try {
        // Validate code first
        const validateResponse = await window.API.inviteCodes.validate(code);
        
        if (!validateResponse.success) {
            alert('Invalid or expired invite code');
            return;
        }
        
        const newType = validateResponse.data.userType;
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        
        // Update current user
        const updateResponse = await fetch(`${apiUrl}/users/${currentUser._id}/upgrade`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                userType: newType,
                inviteCode: code 
            })
        });
        
        const result = await updateResponse.json();
        
        if (result.success) {
            alert(`Account upgraded to ${newType.toUpperCase()} successfully! Please login again.`);
            closeUserUpgradeModal();
            
            // Logout and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        } else {
            alert('Error upgrading account: ' + result.message);
        }
    } catch (error) {
        console.error('Error applying code:', error);
        alert('Error applying code: ' + error.message);
    }
}

function updateUIBasedOnUserType() {
    const creatorTools = document.getElementById('creatorTools');
    
    if (creatorTools && currentUser) {
        if (currentUser.userType === 'creator' || currentUser.userType === 'editor' || currentUser.userType === 'owner') {
            creatorTools.style.display = 'flex';
            creatorTools.addEventListener('click', function(e) {
                e.preventDefault();
                showCreatorModal();
            });
        } else {
            creatorTools.style.display = 'none';
        }
    }
    
    // Update logout link
    const logoutLinks = document.querySelectorAll('a[href="login.html"]');
    logoutLinks.forEach(link => {
        if (link.textContent.includes('Logout')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                window.API.auth.logout();
            });
        }
    });
}

function performSearch(query) {
    if (!query.trim()) return;
    
    // Redirect to search results page
    window.location.href = `search-results.html?q=${encodeURIComponent(query.trim())}`;
}

function showCreatorModal() {
    const modal = document.getElementById('creatorModal');
    if (modal) {
        modal.classList.add('show');
        setupModalEventListeners();
    }
}

function hideCreatorModal() {
    const modal = document.getElementById('creatorModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function setupModalEventListeners() {
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const submitBtn = document.getElementById('submitBtn');
    const contentType = document.getElementById('contentType');

    if (closeModal) {
        closeModal.addEventListener('click', hideCreatorModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideCreatorModal);
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', handleContentSubmission);
    }

    if (contentType) {
        contentType.addEventListener('change', function() {
            const lessonSpecific = document.querySelector('.lesson-specific');
            if (lessonSpecific) {
                lessonSpecific.style.display = this.value === 'lesson' ? 'block' : 'none';
            }
        });
    }

    // Close modal when clicking outside
    const modal = document.getElementById('creatorModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideCreatorModal();
            }
        });
    }
}

function handleContentSubmission() {
    const contentType = document.getElementById('contentType').value;
    const title = document.getElementById('contentTitle').value;
    const description = document.getElementById('contentDescription').value;
    const lessonType = document.getElementById('lessonType')?.value;

    if (!title.trim() || !description.trim()) {
        alert('Please fill in all required fields.');
        return;
    }

    // Simulate submission
    const submission = {
        type: contentType,
        title: title.trim(),
        description: description.trim(),
        lessonType: lessonType,
        creator: currentUser.username,
        status: 'pending_review',
        createdAt: new Date().toISOString()
    };

    console.log('Content submitted for review:', submission);
    alert(`${capitalizeFirst(contentType)} "${title}" has been submitted for review by editors.`);
    
    hideCreatorModal();
    clearModalForm();
}

function clearModalForm() {
    const inputs = document.querySelectorAll('#creatorModal input, #creatorModal textarea, #creatorModal select');
    inputs.forEach(input => {
        if (input.type === 'select-one') {
            input.selectedIndex = 0;
        } else {
            input.value = '';
        }
    });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Rating system
function createStarRating(rating) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars.push('<i class="fas fa-star star"></i>');
        } else if (i === fullStars && hasHalfStar) {
            stars.push('<i class="fas fa-star-half-alt star"></i>');
        } else {
            stars.push('<i class="far fa-star star empty"></i>');
        }
    }
    
    return stars.join('');
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getTypeIcon(type) {
    const icons = {
        text: 'fas fa-file-text',
        video: 'fas fa-play-circle',
        audio: 'fas fa-volume-up',
        presentation: 'fas fa-presentation'
    };
    return icons[type] || 'fas fa-file';
}

// Load homepage data
async function loadHomepageData() {
    try {
        // Load stats for both categories in real-time
        const steamResponse = await window.API.subjects.getAll({ majorCategory: 'STEAM' });
        const humanitiesResponse = await window.API.subjects.getAll({ majorCategory: 'Humanities' });
        
        console.log('STEAM subjects:', steamResponse.data);
        console.log('Humanities subjects:', humanitiesResponse.data);
        
        // Calculate STEAM stats
        let steamLessons = 0, steamDomains = 0;
        if (steamResponse.success) {
            steamResponse.data.forEach(subject => {
                if (subject.domains) {
                    steamDomains += subject.domains.length;
                    subject.domains.forEach(domain => {
                        if (domain.categories) {
                            domain.categories.forEach(category => {
                                if (category.lessons) {
                                    steamLessons += category.lessons.length;
                                }
                            });
                        }
                    });
                }
            });
            
            const steamLessonsEl = document.getElementById('steamLessons');
            const steamSubjectsEl = document.getElementById('steamSubjects');
            const steamDomainsEl = document.getElementById('steamDomains');
            
            if (steamLessonsEl) steamLessonsEl.textContent = steamLessons;
            if (steamSubjectsEl) steamSubjectsEl.textContent = steamResponse.data.length;
            if (steamDomainsEl) steamDomainsEl.textContent = steamDomains;
        }
        
        // Calculate Humanities stats
        let humanitiesLessons = 0, humanitiesDomains = 0;
        if (humanitiesResponse.success) {
            humanitiesResponse.data.forEach(subject => {
                if (subject.domains) {
                    humanitiesDomains += subject.domains.length;
                    subject.domains.forEach(domain => {
                        if (domain.categories) {
                            domain.categories.forEach(category => {
                                if (category.lessons) {
                                    humanitiesLessons += category.lessons.length;
                                }
                            });
                        }
                    });
                }
            });
            
            const humanitiesLessonsEl = document.getElementById('humanitiesLessons');
            const humanitiesSubjectsEl = document.getElementById('humanitiesSubjects');
            const humanitiesDomainsEl = document.getElementById('humanitiesDomains');
            
            if (humanitiesLessonsEl) humanitiesLessonsEl.textContent = humanitiesLessons;
            if (humanitiesSubjectsEl) humanitiesSubjectsEl.textContent = humanitiesResponse.data.length;
            if (humanitiesDomainsEl) humanitiesDomainsEl.textContent = humanitiesDomains;
        }
        
        // Update hero stats (total) in real-time
        const totalLessons = steamLessons + humanitiesLessons;
        const totalSubjects = (steamResponse.data?.length || 0) + (humanitiesResponse.data?.length || 0);
        const totalDomains = steamDomains + humanitiesDomains;
        
        const totalLessonsEl = document.getElementById('totalLessons');
        const totalSubjectsEl = document.getElementById('totalSubjects');
        const totalDomainsEl = document.getElementById('totalDomains');
        
        if (totalLessonsEl) totalLessonsEl.textContent = totalLessons;
        if (totalSubjectsEl) totalSubjectsEl.textContent = totalSubjects;
        if (totalDomainsEl) totalDomainsEl.textContent = totalDomains;

        // Load archive problem count for the banner
        const archiveCountEl = document.getElementById('archiveProblemCount');
        if (archiveCountEl) {
            try {
                const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
                const archiveRes = await fetch(`${apiUrl}/problems`);
                const archiveData = await archiveRes.json();
                if (archiveData.success) {
                    const count = archiveData.count ?? archiveData.data.length;
                    archiveCountEl.textContent = `${count} problem${count !== 1 ? 's' : ''} available.`;
                }
            } catch (e) { /* silent */ }
        }
        
    } catch (error) {
        console.error('Error loading homepage data:', error);
    }
}

// ============================================
// MOBILE NAV
// ============================================

function setupMobileNav() {
    const hamburger = document.getElementById('navHamburger');
    if (!hamburger) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-nav-overlay';
    overlay.id = 'mobileNavOverlay';
    document.body.appendChild(overlay);

    // Create panel
    const panel = document.createElement('div');
    panel.className = 'mobile-nav-panel';
    panel.id = 'mobileNavPanel';
    document.body.appendChild(panel);

    // Build panel content after nav is rendered (slight delay)
    setTimeout(() => buildMobilePanel(panel), 100);

    // Toggle
    hamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = panel.classList.contains('open');
        if (isOpen) closeMobileNav();
        else openMobileNav();
    });

    overlay.addEventListener('click', closeMobileNav);

    // Re-build panel if nav re-renders
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        new MutationObserver(() => {
            setTimeout(() => buildMobilePanel(panel), 50);
        }).observe(navMenu, { childList: true, subtree: true });
    }
}

function openMobileNav() {
    const hamburger = document.getElementById('navHamburger');
    const panel = document.getElementById('mobileNavPanel');
    const overlay = document.getElementById('mobileNavOverlay');
    if (!panel) return;
    hamburger?.classList.add('open');
    panel.classList.add('open');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeMobileNav() {
    const hamburger = document.getElementById('navHamburger');
    const panel = document.getElementById('mobileNavPanel');
    const overlay = document.getElementById('mobileNavOverlay');
    hamburger?.classList.remove('open');
    panel?.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
}

function buildMobilePanel(panel) {
    const currentPath = window.location.pathname;
    const isDark = document.documentElement.classList.contains('dark-mode');

    // Search bar
    let html = `
        <div class="mobile-search">
            <input type="text" placeholder="Search for lessons, topics..." id="mobileSearchInput">
            <button onclick="if(document.getElementById('mobileSearchInput').value.trim()) window.location.href='search-results.html?q='+encodeURIComponent(document.getElementById('mobileSearchInput').value.trim())">
                <i class="fas fa-search"></i>
            </button>
        </div>
    `;

    // Courses section
    html += `
        <div class="mobile-nav-section-label">Courses</div>
        <a href="index.html" class="mobile-nav-item"><i class="fas fa-home"></i> Main Page</a>
        <a href="stem.html" class="mobile-nav-item"><i class="fas fa-atom"></i> STEM</a>
        <a href="humanities.html" class="mobile-nav-item"><i class="fas fa-book-reader"></i> Humanities</a>
    `;

    // Community
    html += `
        <div class="mobile-nav-section mobile-nav-section-label">Community</div>
        <a href="staff.html" class="mobile-nav-item"><i class="fas fa-users-cog"></i> Contributors</a>
        <a href="events.html" class="mobile-nav-item"><i class="fas fa-calendar-alt"></i> Events</a>
        <a href="#" class="mobile-nav-item" onclick="showLeaderboardModal(); closeMobileNav(); return false;"><i class="fas fa-trophy"></i> Leaderboard</a>
    `;

    if (currentUser) {
        // Dashboard links
        const hasDash = ['creator','editor','staff','owner'].includes(currentUser.userType)
            || currentUser.isCreatorCommissionMember
            || currentUser.isEditorCommissionMember;

        if (hasDash) {
            html += `<div class="mobile-nav-section-label" style="margin-top:8px;">Dashboard</div>`;
            if (['creator','editor','staff','owner'].includes(currentUser.userType))
                html += `<a href="create-content.html" class="mobile-nav-item"><i class="fas fa-plus-circle"></i> Create Content</a>`;
            if (['creator','editor','staff','owner'].includes(currentUser.userType))
                html += `<a href="lesson-review.html" class="mobile-nav-item"><i class="fas fa-clipboard-check"></i> Review Dashboard</a>`;
            if (currentUser.userType === 'staff')
                html += `<a href="staff-dashboard.html" class="mobile-nav-item"><i class="fas fa-tasks"></i> Staff Dashboard</a>`;
            if (currentUser.isCreatorCommissionMember)
                html += `<a href="commission-dashboard.html" class="mobile-nav-item"><i class="fas fa-gavel"></i> Creator Commission</a>`;
            if (currentUser.isEditorCommissionMember)
                html += `<a href="editor-commission-dashboard.html" class="mobile-nav-item"><i class="fas fa-pen-fancy"></i> Editor Commission</a>`;
            if (currentUser.userType === 'owner')
                html += `<a href="dashboard.html" class="mobile-nav-item"><i class="fas fa-crown"></i> Owner Dashboard</a>`;
        }

        // Account
        html += `
            <div class="mobile-nav-section">
                <div class="mobile-nav-section-label">Account — ${currentUser.username}</div>
                <button class="mobile-nav-item" onclick="window.location.href='inbox.html'; closeMobileNav();">
                    <i class="fas fa-envelope"></i> Inbox
                </button>
                <a href="public-profile.html?id=${encodeURIComponent(currentUser._id)}" class="mobile-nav-item nav-profile-link"><i class="fas fa-user"></i> Profile</a>
                <a href="settings.html" class="mobile-nav-item"><i class="fas fa-cog"></i> Settings</a>
                <button class="mobile-nav-item" style="color:#dc3545;" onclick="localStorage.removeItem('token');localStorage.removeItem('user');window.location.href='index.html';">
                    <i class="fas fa-sign-out-alt" style="color:#dc3545;"></i> Logout
                </button>
            </div>
        `;
    } else {
        html += `
            <div class="mobile-nav-section">
                <a href="login.html" class="mobile-nav-item"><i class="fas fa-sign-in-alt"></i> Login</a>
                <a href="register.html" class="mobile-nav-item"><i class="fas fa-user-plus"></i> Register</a>
            </div>
        `;
    }

    // Theme toggle — always last
    html += `
        <div class="mobile-nav-section">
            <button class="mobile-nav-item" onclick="if(window.themeManager){window.themeManager.toggleTheme();this.querySelector('i').className='fas fa-'+(document.documentElement.classList.contains('dark-mode')?'sun':'moon');this.querySelector('span').textContent=document.documentElement.classList.contains('dark-mode')?'Light Mode':'Dark Mode';}">
                <i class="fas fa-${isDark ? 'sun' : 'moon'}"></i>
                <span>${isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
        </div>
    `;

    panel.innerHTML = html;

    // Mobile search enter key
    const msi = document.getElementById('mobileSearchInput');
    if (msi) {
        msi.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim()) {
                window.location.href = 'search-results.html?q=' + encodeURIComponent(this.value.trim());
            }
        });
    }
}

window.closeMobileNav = closeMobileNav;

// Heartbeat — keeps lastSeen updated every 30s for authenticated users
function startHeartbeat() {
    if (!window.API || !window.API.isAuthenticated()) return;
    // Send immediately on load, then every 30 seconds
    window.API.users.heartbeat().catch(() => {});
    setInterval(() => {
        if (window.API.isAuthenticated()) {
            window.API.users.heartbeat().catch(() => {});
        }
    }, 30000);
}

document.addEventListener('DOMContentLoaded', function() {
    startHeartbeat();
});

// Export functions for use in other scripts
window.EduPlatform = {
    currentUser,
    createStarRating,
    formatDate,
    getTypeIcon,
    capitalizeFirst
};
