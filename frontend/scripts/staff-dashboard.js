// Staff Dashboard functionality

// Wait for DOM and API to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is staff
    const currentUser = window.API.getUser();
    if (!currentUser || currentUser.userType !== 'staff') {
        alert('Access denied! Only staff members can access this dashboard.');
        window.location.href = '/';
        return;
    }
    
    // Initialize dashboard
    initStaffDashboard();
});

function initStaffDashboard() {
    // Load pending requests
    loadPendingRequests();
    
    // Load reports
    loadReports();
    
    // Refresh every 15 seconds
    setInterval(loadPendingRequests, 15000);
    setInterval(loadReports, 15000);
}

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

// ---- Edit Lessons ----

function toggleEditLessonsPanel() {
    const panel = document.getElementById('editLessonsPanel');
    const btn = document.getElementById('toggleEditBtn');
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    btn.innerHTML = isHidden
        ? '<i class="fas fa-chevron-up"></i> Hide'
        : '<i class="fas fa-chevron-down"></i> Show';
    if (isHidden && !document.getElementById('editLessonsList').innerHTML) {
        searchLessonsForEdit();
    }
}

async function searchLessonsForEdit() {
    const query = document.getElementById('lessonSearchInput').value.trim();
    const list = document.getElementById('editLessonsList');
    list.innerHTML = '<p style="color:#666; font-size:14px;">Loading...</p>';

    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const url = query
            ? `${apiUrl}/search?q=${encodeURIComponent(query)}&type=lesson`
            : `${apiUrl}/lessons?status=published`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${window.API.getToken()}` }
        });
        const data = await response.json();
        const lessons = data.data || data.results || [];
        renderEditLessonsList(lessons.slice(0, 20));
    } catch (e) {
        list.innerHTML = '<p style="color:#dc3545; font-size:14px;">Error loading lessons</p>';
    }
}

function renderEditLessonsList(lessons) {
    const list = document.getElementById('editLessonsList');
    if (!lessons.length) {
        list.innerHTML = '<p style="color:#666; font-size:14px;">No lessons found</p>';
        return;
    }
    list.innerHTML = lessons.map(l => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border:1px solid #e9ecef; border-radius:8px; margin-bottom:8px;">
            <div>
                <div style="font-weight:600; font-size:14px; color:#333;">${l.title}</div>
                <div style="font-size:12px; color:#888; margin-top:2px;">${l.status} &bull; ${l.type}</div>
            </div>
            <button onclick="openEditModal('${l._id}')" style="background:#17a2b8; color:white; border:none; padding:7px 14px; border-radius:6px; cursor:pointer; font-size:13px; font-weight:600; white-space:nowrap;">
                <i class="fas fa-pen"></i> Edit
            </button>
        </div>
    `).join('');
}

async function openEditModal(lessonId) {
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/lessons/${lessonId}`, {
            headers: { 'Authorization': `Bearer ${window.API.getToken()}` }
        });
        const data = await response.json();
        if (!data.success) return alert('Could not load lesson');
        const l = data.data;

        document.getElementById('editLessonId').value = l._id;
        document.getElementById('editTitle').value = l.title;
        document.getElementById('editSlug').value = l.slug;
        document.getElementById('editDescription').value = l.description;
        document.getElementById('editContent').value = l.content;
        document.getElementById('editType').value = l.type;
        document.getElementById('editStatus').value = l.status;
        document.getElementById('editIsPremium').checked = l.isPremium;
        document.getElementById('editLanguage').value = l.language || 'română';
        document.getElementById('editLevel').value = l.level || 'beginner';

        // Load tags
        editTags = l.tags || [];
        renderEditTags();

        const modal = document.getElementById('editLessonModal');
        modal.style.display = 'flex';
    } catch (e) {
        alert('Error loading lesson: ' + e.message);
    }
}

function closeEditModal() {
    document.getElementById('editLessonModal').style.display = 'none';
}

async function saveLesson() {
    const id = document.getElementById('editLessonId').value;
    const body = {
        title: document.getElementById('editTitle').value,
        slug: document.getElementById('editSlug').value,
        description: document.getElementById('editDescription').value,
        content: document.getElementById('editContent').value,
        type: document.getElementById('editType').value,
        status: document.getElementById('editStatus').value,
        isPremium: document.getElementById('editIsPremium').checked,
        language: document.getElementById('editLanguage').value,
        level: document.getElementById('editLevel').value,
        tags: editTags
    };

    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/lessons/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.API.getToken()}`
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (data.success) {
            closeEditModal();
            searchLessonsForEdit();
            alert('Lesson updated successfully!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (e) {
        alert('Error saving lesson: ' + e.message);
    }
}

// Close modal on overlay click
document.getElementById('editLessonModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeEditModal();
});

window.toggleEditLessonsPanel = toggleEditLessonsPanel;
window.searchLessonsForEdit = searchLessonsForEdit;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveLesson = saveLesson;

// ---- Reports ----

async function loadReports() {
    const filter = document.getElementById('reportsFilter')?.value || 'pending';
    const list = document.getElementById('reportsList');
    const count = document.getElementById('reportsCount');
    if (!list) return;
    list.innerHTML = '<p style="text-align:center; color:#6c757d; font-size:14px;">Loading...</p>';

    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const query = filter === 'all' ? '' : `?status=${filter}`;
        const response = await fetch(`${apiUrl}/reports${query}`, {
            headers: { 'Authorization': `Bearer ${window.API.getToken()}` }
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message);

        const reports = data.data || [];
        count.textContent = reports.length;

        if (!reports.length) {
            list.innerHTML = '<p style="text-align:center; color:#6c757d; padding:20px;">No reports found</p>';
            return;
        }

        const reasonLabels = {
            inappropriate_content: 'Inappropriate Content',
            spam: 'Spam',
            harassment: 'Harassment',
            misinformation: 'Misinformation',
            copyright_violation: 'Copyright Violation',
            other: 'Other'
        };

        const statusColors = {
            pending: '#ffc107',
            reviewed: '#17a2b8',
            resolved: '#28a745',
            dismissed: '#6c757d'
        };

        list.innerHTML = reports.map(r => {
            const targetName = r.targetId?.title || r.targetId?.username || 'Unknown';
            const targetLink = r.targetType === 'lesson'
                ? `<a href="lesson.html?id=${r.targetId?._id}" target="_blank" style="color:#17a2b8; text-decoration:none; font-weight:600;">${targetName} <i class="fas fa-external-link-alt" style="font-size:10px;"></i></a>`
                : `<a href="public-profile.html?id=${r.targetId?._id}" target="_blank" style="color:#17a2b8; text-decoration:none; font-weight:600;">${targetName} <i class="fas fa-external-link-alt" style="font-size:10px;"></i></a>`;

            const reporterLink = r.reportedBy?._id
                ? `<a href="public-profile.html?id=${r.reportedBy._id}" target="_blank" style="color:#333; text-decoration:none; font-weight:600;">${r.reportedBy.username}</a>`
                : r.reportedBy?.username || 'Unknown';

            return `
                <div style="background:#fff; border:1px solid #e9ecef; padding:16px; border-radius:8px; margin-bottom:10px; border-left:4px solid #dc3545;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                            <span style="background:#dc3545; color:white; padding:3px 10px; border-radius:12px; font-size:12px; font-weight:600;">
                                <i class="fas fa-${r.targetType === 'lesson' ? 'book' : 'user'}"></i> ${r.targetType}
                            </span>
                            <span style="background:${statusColors[r.status]}; color:${r.status === 'pending' ? '#000' : 'white'}; padding:3px 10px; border-radius:12px; font-size:12px; font-weight:600;">
                                ${r.status}
                            </span>
                            <span style="background:#f0f0f0; color:#555; padding:3px 10px; border-radius:12px; font-size:12px;">
                                ${reasonLabels[r.reason] || r.reason}
                            </span>
                        </div>
                        <span style="font-size:12px; color:#999; white-space:nowrap;">${new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
                        <div style="font-size:13px; color:#666;">
                            <span style="color:#999; text-transform:uppercase; font-size:11px; display:block; margin-bottom:2px;">Reported ${r.targetType}</span>
                            ${targetLink}
                        </div>
                        <div style="font-size:13px; color:#666;">
                            <span style="color:#999; text-transform:uppercase; font-size:11px; display:block; margin-bottom:2px;">Reported by</span>
                            ${reporterLink}
                        </div>
                    </div>

                    <div style="font-size:13px; color:#444; background:#f8f9fa; padding:10px 12px; border-radius:6px; margin-bottom:10px; line-height:1.5;">
                        ${r.description}
                    </div>

                    ${r.status === 'pending' ? `
                        <div style="display:flex; gap:8px;">
                            <button onclick="reviewReport('${r._id}', 'resolved')" style="background:#28a745; color:white; border:none; padding:7px 16px; border-radius:6px; cursor:pointer; font-size:13px; font-weight:600;">
                                <i class="fas fa-check"></i> Resolve
                            </button>
                            <button onclick="reviewReport('${r._id}', 'dismissed')" style="background:#6c757d; color:white; border:none; padding:7px 16px; border-radius:6px; cursor:pointer; font-size:13px;">
                                <i class="fas fa-times"></i> Dismiss
                            </button>
                        </div>
                    ` : `<div style="font-size:12px; color:#888; font-style:italic;">Reviewed by ${r.reviewedBy?.username || 'staff'}</div>`}
                </div>
            `;
        }).join('');
    } catch (e) {
        list.innerHTML = `<p style="text-align:center; color:#dc3545; font-size:14px;">Error loading reports: ${e.message}</p>`;
    }
}

async function reviewReport(id, status) {
    const note = status === 'dismissed' ? prompt('Reason for dismissal (optional):') : null;
    if (note === null && status === 'dismissed' && note !== '') {
        // user cancelled prompt for dismissed - still allow empty
    }

    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/reports/${id}/review`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.API.getToken()}`
            },
            body: JSON.stringify({ status, reviewNote: note || '' })
        });
        const data = await response.json();
        if (data.success) {
            loadReports();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

window.loadReports = loadReports;
window.reviewReport = reviewReport;

// ---- Edit Modal Tags ----

let editTags = [];

document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('editTagInput');
    if (!input) return;
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = this.value.trim();
            if (val && !editTags.includes(val) && editTags.length < 10) {
                editTags.push(val);
                renderEditTags();
            }
            this.value = '';
        }
        if (e.key === 'Backspace' && this.value === '' && editTags.length > 0) {
            editTags.pop();
            renderEditTags();
        }
    });
});

function renderEditTags() {
    const container = document.getElementById('editTagsContainer');
    const input = document.getElementById('editTagInput');
    if (!container || !input) return;
    container.querySelectorAll('.edit-tag-pill').forEach(el => el.remove());
    editTags.forEach(tag => {
        const pill = document.createElement('span');
        pill.className = 'edit-tag-pill';
        pill.style.cssText = 'display:inline-flex;align-items:center;gap:5px;background:#e9ecef;color:#333;padding:4px 10px;border-radius:20px;font-size:13px;';
        pill.innerHTML = `${tag} <span onclick="removeEditTag('${tag}')" style="cursor:pointer;font-size:16px;color:#888;">&times;</span>`;
        container.insertBefore(pill, input);
    });
}

function removeEditTag(tag) {
    editTags = editTags.filter(t => t !== tag);
    renderEditTags();
}

window.removeEditTag = removeEditTag;
