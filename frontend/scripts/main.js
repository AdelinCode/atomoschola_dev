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
        const isProtected = protectedPages.some(page => currentPath.includes(page));
        
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
            Login
        </a>
        <a href="register.html" class="nav-item">
            <i class="fas fa-user-plus"></i>
            Register
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
                <a href="profile.html"><i class="fas fa-user"></i> Profile</a>
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
            // Close account dropdown first
            document.getElementById('accountDropdown')?.classList.remove('show');
            showNotificationsModal();
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
        modal = document.createElement('div');
        modal.id = 'leaderboardModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.65); display: flex;
            align-items: center; justify-content: center; z-index: 10000;
            backdrop-filter: blur(3px);
        `;
        modal.innerHTML = `
            <style>
                .lb-row { transition: background 0.15s; cursor: default; }
                .lb-row:hover { background: #f9f9f9 !important; }
                .lb-avatar { transition: transform 0.15s; }
                .lb-row:hover .lb-avatar { transform: scale(1.08); }
            </style>
            <div style="background:#fff; border-radius:16px; width:92%; max-width:520px; max-height:88vh; display:flex; flex-direction:column; box-shadow:0 12px 40px rgba(0,0,0,0.15); overflow:hidden; font-family:'Inter',system-ui,sans-serif;">
                <div style="padding:28px 28px 0;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
                        <div>
                            <div style="font-size:22px; font-weight:800; color:#111; letter-spacing:-0.5px;">Leaderboard</div>
                            <div style="font-size:13px; color:#aaa; margin-top:4px;">Top contributors by score</div>
                            <div id="lbTimer" style="margin-top:6px; font-size:12px; color:#888; display:flex; align-items:center; gap:5px;">
                                <i class="fas fa-clock" style="font-size:11px;"></i>
                                <span id="lbTimerText">Loading...</span>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <button onclick="toggleScoreInfo()" style="background:#f5f5f5; border:none; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; color:#666; display:flex; align-items:center; gap:5px;" onmouseover="this.style.background='#eee'" onmouseout="this.style.background='#f5f5f5'">
                                <i class="fas fa-info-circle" style="font-size:11px;"></i> How rating works
                            </button>
                            <button onclick="document.getElementById('leaderboardModal').style.display='none'" style="background:#f5f5f5; border:none; width:32px; height:32px; border-radius:8px; font-size:18px; cursor:pointer; color:#888; display:flex; align-items:center; justify-content:center;" onmouseover="this.style.background='#eee'" onmouseout="this.style.background='#f5f5f5'">&times;</button>
                        </div>
                    </div>
                    <div id="lbScorePopup" style="display:none; background:#f9f9f9; border:1px solid #e9e9e9; border-radius:10px; padding:16px 18px; margin-bottom:16px; font-size:13px; color:#444; line-height:1.7;">
                        <div style="font-weight:700; margin-bottom:8px; color:#111;">Score formula</div>
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            <div><span style="display:inline-block; width:14px; height:14px; background:#4ade80; border-radius:3px; margin-right:8px; vertical-align:middle;"></span><strong>×15</strong> &nbsp;avg rating on lessons from the last 3 months</div>
                            <div><span style="display:inline-block; width:14px; height:14px; background:#facc15; border-radius:3px; margin-right:8px; vertical-align:middle;"></span><strong>×10</strong> &nbsp;avg rating on lessons from 3–12 months ago</div>
                            <div><span style="display:inline-block; width:14px; height:14px; background:#fb923c; border-radius:3px; margin-right:8px; vertical-align:middle;"></span><strong>×7.5</strong> &nbsp;avg rating on lessons older than 12 months</div>
                            <div><span style="display:inline-block; width:14px; height:14px; background:#94a3b8; border-radius:3px; margin-right:8px; vertical-align:middle;"></span><strong>×1</strong> &nbsp;total number of published lessons / approved edits</div>
                        </div>
                        <div style="margin-top:10px; padding-top:10px; border-top:1px solid #e9e9e9; color:#999; font-size:12px;">Recent content weighs more to reward active contributors.</div>
                    </div>
                    <div style="display:flex; gap:4px; border-bottom:1px solid #f0f0f0;">
                        <button id="lbTabCreators" onclick="switchLbTab('creators')" style="padding:10px 18px 11px; border:none; border-bottom:2px solid #111; margin-bottom:-1px; background:none; font-weight:700; font-size:14px; cursor:pointer; color:#111; letter-spacing:0.1px; transition:all 0.15s;">
                            Creators
                        </button>
                        <button id="lbTabEditors" onclick="switchLbTab('editors')" style="padding:10px 18px 11px; border:none; border-bottom:2px solid transparent; margin-bottom:-1px; background:none; font-weight:700; font-size:14px; cursor:pointer; color:#bbb; letter-spacing:0.1px; transition:all 0.15s;">
                            Editors
                        </button>
                    </div>
                </div>
                <div style="overflow-y:auto; flex:1;">
                    <div id="lbCreators" style="padding:4px 0;"></div>
                    <div id="lbEditors" style="display:none; padding:4px 0;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    loadLeaderboard();
    startLbTimer();

    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.style.display = 'none';
    });
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

window.switchLbTab = function(tab) {
    const creatorsEl = document.getElementById('lbCreators');
    const editorsEl  = document.getElementById('lbEditors');
    const tabC = document.getElementById('lbTabCreators');
    const tabE = document.getElementById('lbTabEditors');

    if (tab === 'creators') {
        creatorsEl.style.display = 'block';
        editorsEl.style.display  = 'none';
        tabC.style.borderBottomColor = '#111';
        tabC.style.color = '#111';
        tabE.style.borderBottomColor = 'transparent';
        tabE.style.color = '#bbb';
    } else {
        creatorsEl.style.display = 'none';
        editorsEl.style.display  = 'block';
        tabE.style.borderBottomColor = '#111';
        tabE.style.color = '#111';
        tabC.style.borderBottomColor = 'transparent';
        tabC.style.color = '#bbb';
    }
};

async function loadLeaderboard() {
    const creatorsEl = document.getElementById('lbCreators');
    const editorsEl = document.getElementById('lbEditors');

    creatorsEl.innerHTML = '<p style="text-align:center;color:#bbb;padding:40px 0;font-size:14px;">Loading...</p>';

    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/leaderboard`);
        const data = await response.json();

        if (data.success) {
            creatorsEl.innerHTML = renderLeaderboardList(data.data.creators, 'creator');
            editorsEl.innerHTML = renderLeaderboardList(data.data.editors, 'editor');
        } else {
            throw new Error('API error');
        }
    } catch (e) {
        const err = '<p style="text-align:center;color:#dc3545;padding:40px 0;font-size:14px;">Could not load leaderboard.</p>';
        creatorsEl.innerHTML = err;
        editorsEl.innerHTML = err;
    }
}

function renderScoreInfo(type) {
    return '';
}

window.toggleScoreInfo = function() {
    const popup = document.getElementById('lbScorePopup');
    if (!popup) return;
    popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
};

function renderLeaderboardList(users, type) {
    if (!users || users.length === 0) {
        return '<p style="text-align:center;color:#bbb;padding:48px 0;font-size:15px;">No entries yet.</p>';
    }

    const statLabel = type === 'creator' ? 'lessons' : 'edits';
    const statKey   = type === 'creator' ? 'lessonsCount' : 'editsCount';

    // Top 3: gold / silver / bronze gradient avatars
    const top3 = [
        { grad: 'linear-gradient(135deg,#f6d365,#c9922a)', label: '1', textColor: '#7a4800' },
        { grad: 'linear-gradient(135deg,#d4d4d4,#8e8e8e)', label: '2', textColor: '#444'    },
        { grad: 'linear-gradient(135deg,#e8a87c,#a0522d)', label: '3', textColor: '#5c2700' },
    ];

    return users.map((u, i) => {
        const isTop3   = i < 3;
        const initials = (u.username || '?').slice(0, 2).toUpperCase();
        const name     = u.displayName || u.username;

        const avatarStyle = isTop3
            ? `background:${top3[i].grad}; color:${top3[i].textColor};`
            : 'background:#f0eeff; color:#7c5cbf;';

        const rankBadge = isTop3
            ? `<div style="width:20px; height:20px; border-radius:50%; background:${top3[i].grad}; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; color:${top3[i].textColor}; position:absolute; bottom:-3px; right:-3px; box-shadow:0 1px 4px rgba(0,0,0,0.2);">${top3[i].label}</div>`
            : '';

        const ratingBit = type === 'creator' && u.avgRating > 0
            ? `<span style="font-size:12px; color:#f59e0b; font-weight:600;">&#9733; ${u.avgRating.toFixed(1)}</span>`
            : '';

        const rowBg = isTop3 ? '#fdfbff' : '#fff';

        return `
            <div class="lb-row" style="display:flex; align-items:center; gap:16px; padding:16px 24px; background:${rowBg}; border-bottom:1px solid #f2f2f2;">
                <div style="width:18px; text-align:right; font-size:12px; font-weight:700; color:#ccc; flex-shrink:0;">${isTop3 ? '' : '#' + u.rank}</div>
                <div style="position:relative; flex-shrink:0;">
                    <div class="lb-avatar" style="width:44px; height:44px; border-radius:50%; ${avatarStyle} display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px;">${initials}</div>
                    ${rankBadge}
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:700; font-size:17px; color:#111; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        <a href="public-profile.html?id=${u._id}" style="color:#111; text-decoration:none;" onmouseover="this.style.color='#555'" onmouseout="this.style.color='#111'">${name}</a>
                    </div>
                    <div style="font-size:12px; color:#bbb; margin-top:3px; display:flex; align-items:center; gap:8px;">
                        <span>${u[statKey] ?? 0} ${statLabel}</span>
                        ${ratingBit}
                    </div>
                </div>
                <div style="text-align:right; flex-shrink:0;">
                    <div style="font-size:20px; font-weight:800; color:#111; letter-spacing:-0.5px;">${u.score ?? 0}</div>
                    <div style="font-size:10px; color:#ccc; text-transform:uppercase; letter-spacing:1px;">pts</div>
                </div>
            </div>
        `;
    }).join('');
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
                <button class="mobile-nav-item" onclick="showNotificationsModal(); closeMobileNav();">
                    <i class="fas fa-envelope"></i> Inbox
                </button>
                <a href="profile.html" class="mobile-nav-item"><i class="fas fa-user"></i> Profile</a>
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
