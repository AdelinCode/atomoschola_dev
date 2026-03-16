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
        <div class="account-dropdown">
            <button class="account-btn" id="coursesBtn">
                <i class="fas fa-graduation-cap"></i>
                <span>Courses</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="dropdown-menu" id="coursesDropdown">
                <a href="index.html"><i class="fas fa-home"></i> Main Page</a>
                <a href="steam.html"><i class="fas fa-atom"></i> STEM</a>
                <a href="humanities.html"><i class="fas fa-book-reader"></i> Humanities</a>
            </div>
        </div>
        <a href="staff.html" class="nav-item">
            <i class="fas fa-users-cog"></i>
            Contributors
        </a>
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
}

function renderAuthenticatedNav() {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;
    
    let navItems = '';
    
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
                <a href="steam.html"><i class="fas fa-atom"></i> STEM</a>
                <a href="humanities.html"><i class="fas fa-book-reader"></i> Humanities</a>
            </div>
        </div>
    `;
    
    // Add Staff button for all users
    navItems += `
        <a href="staff.html" class="nav-item">
            <i class="fas fa-users-cog"></i>
            Contributors
        </a>
    `;
    
    // Add Events button for all users
    navItems += `
        <a href="events.html" class="nav-item">
            <i class="fas fa-calendar-alt"></i>
            Events
        </a>
    `;
    
    // Add Notifications button for authenticated users
    navItems += `
        <button class="nav-item" onclick="showNotificationsModal()" style="background: none; border: none; cursor: pointer; position: relative; padding: 8px 16px;">
        <i class="fa-solid fa-envelope"></i>
            <strong>Inbox</strong>
            <span id="notificationBadge" style="display: none; position: absolute; top: 4px; right: 8px; background: #dc3545; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; font-weight: bold; align-items: center; justify-content: center;">0</span>
        </button>
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
    // Account dropdown toggle
    const accountBtn = document.getElementById('accountBtn');
    const accountDropdown = document.getElementById('accountDropdown');
    
    if (accountBtn && accountDropdown) {
        accountBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            accountDropdown.classList.toggle('show');
            // Close courses dropdown if open
            const coursesDropdown = document.getElementById('coursesDropdown');
            if (coursesDropdown) coursesDropdown.classList.remove('show');
        });

        // Close dropdown when clicking outside
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
}

function setupCoursesDropdown() {
    const coursesBtn = document.getElementById('coursesBtn');
    const coursesDropdown = document.getElementById('coursesDropdown');
    
    if (coursesBtn && coursesDropdown) {
        coursesBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            coursesDropdown.classList.toggle('show');
            // Close other dropdowns
            const accountDropdown = document.getElementById('accountDropdown');
            const dashboardDropdown = document.getElementById('dashboardDropdown');
            if (accountDropdown) accountDropdown.classList.remove('show');
            if (dashboardDropdown) dashboardDropdown.classList.remove('show');
        });

        document.addEventListener('click', function() {
            coursesDropdown.classList.remove('show');
        });
    }
}

function setupDashboardDropdown() {
    const dashboardBtn = document.getElementById('dashboardBtn');
    const dashboardDropdown = document.getElementById('dashboardDropdown');

    if (dashboardBtn && dashboardDropdown) {
        dashboardBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dashboardDropdown.classList.toggle('show');
            // Close other dropdowns
            const accountDropdown = document.getElementById('accountDropdown');
            const coursesDropdown = document.getElementById('coursesDropdown');
            if (accountDropdown) accountDropdown.classList.remove('show');
            if (coursesDropdown) coursesDropdown.classList.remove('show');
        });

        document.addEventListener('click', function() {
            dashboardDropdown.classList.remove('show');
        });
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
        
    } catch (error) {
        console.error('Error loading homepage data:', error);
    }
}

// Export functions for use in other scripts
window.EduPlatform = {
    currentUser,
    createStarRating,
    formatDate,
    getTypeIcon,
    capitalizeFirst
};
