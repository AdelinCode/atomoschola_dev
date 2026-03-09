// Dashboard functionality

// Wait for DOM and API to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is owner
    const currentUser = window.API.getUser();
    if (!currentUser || currentUser.userType !== 'owner') {
        alert('Access denied! Only owners can access this dashboard.');
        window.location.href = '/';
        return;
    }
    
    // Initialize dashboard
    initDashboard();
});

function initDashboard() {
    // Load codes immediately
    loadInviteCodes();
    
    // Setup form handler
    const form = document.getElementById('generateCodeForm');
    if (form) {
        form.addEventListener('submit', handleGenerateCode);
    }
    
    // Refresh codes every 10 seconds
    setInterval(loadInviteCodes, 10000);
    
    // Load users
    loadUsers();
    
    // Refresh users every 30 seconds
    setInterval(loadUsers, 30000);
    
    // Load content management
    loadContent();
    
    // Setup content filters
    const contentTypeFilter = document.getElementById('contentTypeFilter');
    const contentSearchInput = document.getElementById('contentSearchInput');
    
    if (contentTypeFilter) {
        contentTypeFilter.addEventListener('change', filterContent);
    }
    
    if (contentSearchInput) {
        contentSearchInput.addEventListener('input', filterContent);
    }
    
    // Refresh content every 30 seconds
    setInterval(loadContent, 30000);
    
    // Load pending requests
    loadPendingRequests();
    
    // Refresh pending requests every 15 seconds
    setInterval(loadPendingRequests, 15000);
}

// Load invite codes
async function loadInviteCodes() {
    try {
        const response = await window.API.inviteCodes.getAll();
        if (response.success) {
            displayInviteCodes(response.data);
            updateStats(response.data);
        }
    } catch (error) {
        console.error('Error loading invite codes:', error);
        document.getElementById('inviteCodesList').innerHTML = 
            '<p style="text-align: center; color: #dc3545;">Error loading codes</p>';
    }
}

function displayInviteCodes(codes) {
    const container = document.getElementById('inviteCodesList');
    
    // Filter out used codes (auto-delete from display)
    const activeCodes = codes.filter(code => !code.isUsed);
    
    if (activeCodes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d;">No active codes. Generate one above!</p>';
        return;
    }

    container.innerHTML = activeCodes.map(code => `
        <div class="invite-code-item">
            <div>
                <div class="code-text">${code.code}</div>
                <small style="color: #6c757d;">
                    ${code.userType.toUpperCase()} - 
                    Created: ${new Date(code.createdAt).toLocaleDateString('en-US')}
                    ${code.expiresAt ? ` - Expires: ${new Date(code.expiresAt).toLocaleDateString('en-US')}` : ' - No expiration'}
                </small>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <span class="code-status available">
                    Available
                </span>
                <button class="btn btn-secondary btn-small" onclick="copyCode('${code.code}')">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn btn-secondary btn-small" onclick="deleteCode('${code._id}')" style="background: #dc3545; color: white;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateStats(codes) {
    const activeCodes = codes.filter(c => !c.isUsed);
    const usedCodes = codes.filter(c => c.isUsed);
    
    document.getElementById('totalCodes').textContent = codes.length;
    document.getElementById('availableCodes').textContent = activeCodes.length;
    document.getElementById('usedCodes').textContent = usedCodes.length;
}

// Generate new code handler
async function handleGenerateCode(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        userType: formData.get('userType'),
        expiresInDays: formData.get('expiresInDays') ? parseInt(formData.get('expiresInDays')) : null
    };

    try {
        const response = await window.API.inviteCodes.create(data);
        if (response.success) {
            // Show success message with the code
            const codeDisplay = document.createElement('div');
            codeDisplay.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                z-index: 10000;
                text-align: center;
                border: 2px solid #000;
            `;
            codeDisplay.innerHTML = `
                <h3 style="margin: 0 0 16px 0; color: #000;">Code Generated Successfully!</h3>
                <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e0e0e0;">
                    <code style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #000;">${response.data.code}</code>
                </div>
                <p style="color: #666; margin: 16px 0;">Code has been copied to clipboard!</p>
                <button onclick="this.parentElement.remove()" style="background: #000; color: white; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-weight: 600;">Close</button>
            `;
            document.body.appendChild(codeDisplay);
            
            // Copy to clipboard
            navigator.clipboard.writeText(response.data.code);
            
            // Reset form and reload codes
            e.target.reset();
            
            // Reload codes immediately
            setTimeout(() => {
                loadInviteCodes();
            }, 500);
            
            // Auto-close after 5 seconds
            setTimeout(() => {
                if (codeDisplay.parentElement) {
                    codeDisplay.remove();
                }
            }, 5000);
        }
    } catch (error) {
        console.error('Error generating code:', error);
        alert('Error generating code: ' + error.message);
    }
}

// Copy code to clipboard
window.copyCode = function(code) {
    navigator.clipboard.writeText(code).then(() => {
        // Show temporary success message
        const msg = document.createElement('div');
        msg.textContent = 'Code copied to clipboard!';
        msg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #000;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
        `;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    });
};

// Delete code
window.deleteCode = async function(id) {
    if (!confirm('Are you sure you want to delete this code?')) return;
    
    try {
        await window.API.inviteCodes.delete(id);
        
        // Show success message
        const msg = document.createElement('div');
        msg.textContent = 'Code deleted successfully!';
        msg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #000;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
        `;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
        
        loadInviteCodes();
    } catch (error) {
        alert('Error deleting code: ' + error.message);
    }
};



// Global content data
let allContent = {
    subjects: [],
    domains: [],
    categories: [],
    lessons: []
};

// Load content management data
async function loadContent() {
    try {
        const response = await window.API.admin.getContent();
        if (response.success) {
            allContent = response.data;
            updateContentStats(response.data.stats);
            displayContent();
        }
    } catch (error) {
        console.error('Error loading content:', error);
        document.getElementById('contentList').innerHTML = 
            '<p style="text-align: center; color: #dc3545;">Error loading content</p>';
    }
}

function updateContentStats(stats) {
    document.getElementById('subjectsCount').textContent = stats.totalSubjects;
    document.getElementById('domainsCount').textContent = stats.totalDomains;
    document.getElementById('categoriesCount').textContent = stats.totalCategories;
    document.getElementById('lessonsCount').textContent = stats.totalLessons;
}

function displayContent() {
    const container = document.getElementById('contentList');
    const typeFilter = document.getElementById('contentTypeFilter').value;
    const searchTerm = document.getElementById('contentSearchInput').value.toLowerCase();
    
    let itemsToShow = [];
    
    // Collect items based on filter
    if (typeFilter === 'all' || typeFilter === 'subjects') {
        itemsToShow.push(...allContent.subjects.map(item => ({...item, type: 'subject'})));
    }
    if (typeFilter === 'all' || typeFilter === 'domains') {
        itemsToShow.push(...allContent.domains.map(item => ({...item, type: 'domain'})));
    }
    if (typeFilter === 'all' || typeFilter === 'categories') {
        itemsToShow.push(...allContent.categories.map(item => ({...item, type: 'category'})));
    }
    if (typeFilter === 'all' || typeFilter === 'lessons') {
        itemsToShow.push(...allContent.lessons.map(item => ({...item, type: 'lesson'})));
    }
    
    // Filter by search term
    if (searchTerm) {
        itemsToShow = itemsToShow.filter(item => 
            item.name?.toLowerCase().includes(searchTerm) || 
            item.title?.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort by creation date (newest first)
    itemsToShow.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (itemsToShow.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d;">No content found</p>';
        return;
    }
    
    container.innerHTML = itemsToShow.map(item => {
        const title = item.name || item.title;
        const meta = getContentMeta(item);
        
        return `
            <div class="content-item">
                <div class="content-info">
                    <div class="content-title">
                        <span class="content-type-badge ${item.type}">${item.type.toUpperCase()}</span>
                        ${title}
                    </div>
                    <div class="content-meta">${meta}</div>
                </div>
                <div class="content-actions">
                    <button class="btn-danger" onclick="deleteContent('${item.type}', '${item._id}', '${title.replace(/'/g, "\\'")}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getContentMeta(item) {
    const createdDate = new Date(item.createdAt).toLocaleDateString('en-US');
    
    switch (item.type) {
        case 'subject':
            return `Created: ${createdDate} • Managed by: ${item.managedBy?.map(u => u.username).join(', ') || 'None'}`;
        case 'domain':
            return `Created: ${createdDate} • Subject: ${item.subject?.name || 'Unknown'}`;
        case 'category':
            return `Created: ${createdDate} • Domain: ${item.domain?.name || 'Unknown'}`;
        case 'lesson':
            return `Created: ${createdDate} • Category: ${item.category?.name || 'Unknown'} • Status: ${item.status} • Creators: ${item.creators?.map(u => u.username).join(', ') || 'None'}`;
        default:
            return `Created: ${createdDate}`;
    }
}

function filterContent() {
    displayContent();
}

// Delete content function
window.deleteContent = async function(type, id, title) {
    const typeNames = {
        subject: 'Subject',
        domain: 'Domain', 
        category: 'Category',
        lesson: 'Lesson'
    };
    
    const warnings = {
        subject: 'This will delete the subject and ALL related domains, categories, and lessons!',
        domain: 'This will delete the domain and ALL related categories and lessons!',
        category: 'This will delete the category and ALL related lessons!',
        lesson: 'This will delete the lesson permanently!'
    };
    
    if (!confirm(`Are you sure you want to delete this ${typeNames[type]}?\n\n"${title}"\n\n⚠️ WARNING: ${warnings[type]}\n\nThis action cannot be undone!`)) {
        return;
    }
    
    try {
        let response;
        switch (type) {
            case 'subject':
                response = await window.API.admin.deleteSubject(id);
                break;
            case 'domain':
                response = await window.API.admin.deleteDomain(id);
                break;
            case 'category':
                response = await window.API.admin.deleteCategory(id);
                break;
            case 'lesson':
                response = await window.API.admin.deleteLesson(id);
                break;
        }
        
        if (response.success) {
            // Show success message
            const msg = document.createElement('div');
            msg.textContent = response.message;
            msg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 5000);
            
            // Reload content
            loadContent();
        }
    } catch (error) {
        alert('Error deleting content: ' + error.message);
    }
};

// Load pending requests
async function loadPendingRequests() {
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/pending-requests?status=pending`, {
            headers: {
                'Authorization': `Bearer ${window.API.getToken()}`
            }
        });
        const data = await response.json();

        if (data.success) {
            displayPendingRequests(data.data);
        }
    } catch (error) {
        console.error('Error loading pending requests:', error);
        document.getElementById('pendingRequestsList').innerHTML = 
            '<p style="text-align: center; color: #dc3545;">Error loading requests</p>';
    }
}

function displayPendingRequests(requests) {
    const list = document.getElementById('pendingRequestsList');
    const count = document.getElementById('pendingCount');
    
    count.textContent = requests.length;

    if (requests.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No pending requests</p>';
        return;
    }

    list.innerHTML = requests.map(req => {
        const typeColors = {
            domain: '#7b1fa2',
            category: '#388e3c',
            lesson: '#f57c00'
        };
        const typeIcons = {
            domain: 'layer-group',
            category: 'folder',
            lesson: 'book'
        };

        // Check if lesson requires commission vote
        const requiresCommissionVote = req.requiresCommissionVote && req.type === 'lesson';
        const yesVotes = req.votes ? req.votes.filter(v => v.vote === 'yes').length : 0;
        const noVotes = req.votes ? req.votes.filter(v => v.vote === 'no').length : 0;
        const totalVotes = req.votes ? req.votes.length : 0;

        return `
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid ${typeColors[req.type]};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="background: ${typeColors[req.type]}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                                <i class="fas fa-${typeIcons[req.type]}"></i> ${req.type.toUpperCase()}
                            </span>
                            ${requiresCommissionVote ? '<span style="background: #6f42c1; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;"><i class="fas fa-gavel"></i> COMMISSION VOTE</span>' : ''}
                            <span style="color: #666; font-size: 14px;">
                                by <strong>${req.requestedBy.username}</strong>
                            </span>
                            <span style="color: #999; font-size: 12px;">
                                ${new Date(req.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 4px;">
                            ${req.data.name || req.data.title}
                        </div>
                        <div style="font-size: 14px; color: #666;">
                            ${req.data.description || ''}
                        </div>
                        
                        ${requiresCommissionVote ? `
                            <div style="margin-top: 12px; padding: 12px; background: #f0f0f0; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <span style="font-size: 14px; font-weight: 600; color: #333;">
                                        Commission Votes: ${totalVotes}/7
                                    </span>
                                    <div style="display: flex; gap: 16px; font-size: 14px;">
                                        <span style="color: #28a745; font-weight: 600;">
                                            <i class="fas fa-check"></i> ${yesVotes}
                                        </span>
                                        <span style="color: #dc3545; font-weight: 600;">
                                            <i class="fas fa-times"></i> ${noVotes}
                                        </span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 4px;">
                                    ${Array(7).fill(0).map((_, i) => 
                                        `<div style="height: 6px; flex: 1; border-radius: 3px; background: ${i < totalVotes ? '#6f42c1' : '#e0e0e0'};"></div>`
                                    ).join('')}
                                </div>
                                <div style="margin-top: 8px; font-size: 12px; color: #666; font-style: italic;">
                                    Waiting for commission decision...
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    ${!requiresCommissionVote ? `
                        <div style="display: flex; gap: 8px;">
                            <button onclick="approveRequest('${req._id}')" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button onclick="rejectRequest('${req._id}')" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function approveRequest(id) {
    if (!confirm('Are you sure you want to approve this request?')) return;

    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/pending-requests/${id}/approve`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.API.getToken()}`
            }
        });
        const data = await response.json();

        if (data.success) {
            alert('Request approved successfully!');
            loadPendingRequests();
            loadContent(); // Refresh content list
        } else {
            alert('Error approving request: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error approving request: ' + error.message);
    }
}

async function rejectRequest(id) {
    const note = prompt('Reason for rejection (optional):');
    if (note === null) return; // User cancelled

    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/pending-requests/${id}/reject`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.API.getToken()}`
            },
            body: JSON.stringify({ note })
        });
        const data = await response.json();

        if (data.success) {
            alert('Request rejected');
            loadPendingRequests();
        } else {
            alert('Error rejecting request: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error rejecting request: ' + error.message);
    }
}

// Make functions global for onclick handlers
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
