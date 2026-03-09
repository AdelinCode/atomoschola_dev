// Editor Commission Dashboard functionality

let currentTab = 'pending';

// Wait for DOM and API to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is editor commission member
    const currentUser = window.API.getUser();
    if (!currentUser || !currentUser.isEditorCommissionMember) {
        alert('Access denied! Only editor commission members can access this dashboard.');
        window.location.href = '/';
        return;
    }
    
    // Initialize dashboard
    initEditorCommissionDashboard();
});

function initEditorCommissionDashboard() {
    // Load data
    loadPendingProposals();
    loadPendingLessons();
    loadApprovedEdits();
    
    // Refresh every 15 seconds
    setInterval(() => {
        if (currentTab === 'pending') {
            loadPendingProposals();
        } else if (currentTab === 'lessons') {
            loadPendingLessons();
        } else {
            loadApprovedEdits();
        }
    }, 15000);
}

// Switch tabs
window.switchTab = function(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tab}Tab`).classList.add('active');
    
    // Load data for active tab
    if (tab === 'pending') {
        loadPendingProposals();
    } else if (tab === 'lessons') {
        loadPendingLessons();
    } else {
        loadApprovedEdits();
    }
};

// Load pending proposals
async function loadPendingProposals() {
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/editor-commission/proposals`, {
            headers: {
                'Authorization': `Bearer ${window.API.getToken()}`
            }
        });
        const data = await response.json();

        if (data.success) {
            displayPendingProposals(data.data);
        }
    } catch (error) {
        console.error('Error loading proposals:', error);
        document.getElementById('pendingProposalsList').innerHTML = 
            '<p style="text-align: center; color: #dc3545;">Error loading proposals</p>';
    }
}

function displayPendingProposals(proposals) {
    const list = document.getElementById('pendingProposalsList');
    const badge = document.getElementById('pendingBadge');
    const currentUser = window.API.getUser();
    
    badge.textContent = proposals.length;

    if (proposals.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No pending proposals</p>';
        return;
    }

    list.innerHTML = proposals.map(proposal => {
        // Check if current user has voted
        const userVote = proposal.votes.find(v => v.user._id === currentUser._id);
        const hasVoted = !!userVote;
        
        // Count votes
        const yesVotes = proposal.votes.filter(v => v.vote === 'yes').length;
        const noVotes = proposal.votes.filter(v => v.vote === 'no').length;
        const totalVotes = proposal.votes.length;

        return `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #6f42c1;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="background: #6f42c1; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                                <i class="fas fa-edit"></i> EDIT PROPOSAL
                            </span>
                            <span style="color: #666; font-size: 14px;">
                                by <strong>${proposal.proposedBy.username}</strong>
                            </span>
                            <span style="color: #999; font-size: 12px;">
                                ${new Date(proposal.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        
                        <h4 style="margin: 12px 0 16px 0; color: #333;">3 Proposed Edits:</h4>
                        
                        ${proposal.edits.map((edit, index) => {
                            const lessonPath = edit.lesson.category && edit.lesson.category.domain && edit.lesson.category.domain.subject
                                ? `${edit.lesson.category.domain.subject.name} → ${edit.lesson.category.domain.name} → ${edit.lesson.category.name} → ${edit.lesson.title}`
                                : edit.lesson.title;
                            
                            return `
                            <div class="edit-detail">
                                <div style="font-weight: 600; color: #333; margin-bottom: 4px;">
                                    <span style="background: #6f42c1; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 8px;">${index + 1}</span>
                                    ${lessonPath}
                                </div>
                                <div style="font-size: 14px; color: #666; margin-bottom: 4px;">
                                    <strong>Description:</strong> ${edit.editDescription}
                                </div>
                                <div style="font-size: 14px; color: #666;">
                                    <strong>Content:</strong> ${edit.editContent.substring(0, 150)}${edit.editContent.length > 150 ? '...' : ''}
                                </div>
                            </div>
                        `}).join('')}
                        
                        <!-- Vote Progress -->
                        <div style="margin-top: 16px; padding: 12px; background: #f0f0f0; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-size: 14px; font-weight: 600; color: #333;">
                                    Votes: ${totalVotes}/7
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
                        </div>
                        
                        ${hasVoted ? `
                            <div style="margin-top: 12px; padding: 8px 12px; background: ${userVote.vote === 'yes' ? '#d4edda' : '#f8d7da'}; color: ${userVote.vote === 'yes' ? '#155724' : '#721c24'}; border-radius: 6px; font-size: 14px; font-weight: 600;">
                                <i class="fas fa-${userVote.vote === 'yes' ? 'check-circle' : 'times-circle'}"></i> You voted ${userVote.vote.toUpperCase()}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${!hasVoted ? `
                    <div class="vote-buttons">
                        <button class="vote-btn yes" onclick="voteOnProposal('${proposal._id}', 'yes')">
                            <i class="fas fa-check"></i> Vote YES
                        </button>
                        <button class="vote-btn no" onclick="voteOnProposal('${proposal._id}', 'no')">
                            <i class="fas fa-times"></i> Vote NO
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

async function voteOnProposal(proposalId, vote) {
    if (!confirm(`Are you sure you want to vote ${vote.toUpperCase()} on this proposal?`)) {
        return;
    }

    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/editor-commission/vote/${proposalId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.API.getToken()}`
            },
            body: JSON.stringify({ vote })
        });
        const data = await response.json();

        if (data.success) {
            if (data.status) {
                // Final decision made
                alert(`Proposal ${data.status}! Final vote: ${data.votes.yes}-${data.votes.no}`);
            } else {
                alert(`Vote recorded! (${data.votesCount}/${data.totalNeeded} votes)`);
            }
            loadPendingProposals();
            loadApprovedEdits(); // Refresh approved edits too
        } else {
            alert('Error voting: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error voting: ' + error.message);
    }
}

// Load approved edits
async function loadApprovedEdits() {
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/editor-commission/approved-edits`, {
            headers: {
                'Authorization': `Bearer ${window.API.getToken()}`
            }
        });
        const data = await response.json();

        if (data.success) {
            displayApprovedEdits(data.data);
        }
    } catch (error) {
        console.error('Error loading approved edits:', error);
        document.getElementById('approvedEditsList').innerHTML = 
            '<p style="text-align: center; color: #dc3545;">Error loading approved edits</p>';
    }
}

function displayApprovedEdits(edits) {
    const list = document.getElementById('approvedEditsList');
    const badge = document.getElementById('approvedBadge');
    
    badge.textContent = edits.length;

    if (edits.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No approved edits yet</p>';
        return;
    }

    list.innerHTML = edits.map(edit => {
        const lessonPath = edit.lesson.category && edit.lesson.category.domain && edit.lesson.category.domain.subject
            ? `${edit.lesson.category.domain.subject.name} → ${edit.lesson.category.domain.name} → ${edit.lesson.category.name} → ${edit.lesson.title}`
            : edit.lesson.title;
        
        return `
        <div class="approved-edit-item">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                            <i class="fas fa-check-circle"></i> APPROVED
                        </span>
                        <span style="color: #666; font-size: 14px;">
                            by <strong>${edit.proposedBy.username}</strong>
                        </span>
                        <span style="color: #999; font-size: 12px;">
                            ${new Date(edit.approvedAt).toLocaleDateString()}
                        </span>
                        <span style="color: #666; font-size: 12px;">
                            Vote: ${edit.votes.yes}-${edit.votes.no}
                        </span>
                    </div>
                    <div style="font-weight: 600; color: #333; margin-bottom: 8px; font-size: 16px;">
                        ${lessonPath}
                    </div>
                    <div style="font-size: 14px; color: #666; margin-bottom: 4px;">
                        <strong>Description:</strong> ${edit.editDescription}
                    </div>
                    <div style="font-size: 14px; color: #666;">
                        <strong>Content:</strong> ${edit.editContent}
                    </div>
                </div>
                <button onclick="deleteApprovedEdit('${edit._id}')" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-left: 16px;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `}).join('');
}

async function deleteApprovedEdit(editId) {
    if (!confirm('Are you sure you want to delete this approved edit?')) {
        return;
    }

    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/editor-commission/approved-edits/${editId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${window.API.getToken()}`
            }
        });
        const data = await response.json();

        if (data.success) {
            alert('Edit deleted successfully!');
            loadApprovedEdits();
        } else {
            alert('Error deleting edit: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting edit: ' + error.message);
    }
}

// Make functions global for onclick handlers
window.voteOnProposal = voteOnProposal;
window.deleteApprovedEdit = deleteApprovedEdit;

// Load pending lessons (created by creators only)
async function loadPendingLessons() {
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/editor-commission/pending-lessons`, {
            headers: {
                'Authorization': `Bearer ${window.API.getToken()}`
            }
        });
        const data = await response.json();

        if (data.success) {
            displayPendingLessons(data.data);
        }
    } catch (error) {
        console.error('Error loading pending lessons:', error);
        document.getElementById('pendingLessonsList').innerHTML = 
            '<p style="text-align: center; color: #dc3545;">Error loading lessons</p>';
    }
}

function displayPendingLessons(lessons) {
    const list = document.getElementById('pendingLessonsList');
    const badge = document.getElementById('lessonsBadge');
    const currentUser = window.API.getUser();
    
    badge.textContent = lessons.length;

    if (lessons.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No pending lessons from creators</p>';
        return;
    }

    list.innerHTML = lessons.map(req => {
        const typeColor = '#f57c00';
        const typeIcon = 'book';

        // Check if current user has voted
        const userVote = req.votes.find(v => v.user._id === currentUser._id);
        const hasVoted = !!userVote;
        
        // Count votes
        const yesVotes = req.votes.filter(v => v.vote === 'yes').length;
        const noVotes = req.votes.filter(v => v.vote === 'no').length;
        const totalVotes = req.votes.length;

        return `
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid ${typeColor};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="background: ${typeColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                                <i class="fas fa-${typeIcon}"></i> LESSON
                            </span>
                            <span style="color: #666; font-size: 14px;">
                                by <strong>${req.requestedBy.username}</strong> (Creator)
                            </span>
                            <span style="color: #999; font-size: 12px;">
                                ${new Date(req.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 4px;">
                            ${req.data.title}
                        </div>
                        <div style="font-size: 14px; color: #666; margin-bottom: 12px;">
                            ${req.data.description || ''}
                        </div>
                        
                        <!-- Vote Progress -->
                        <div style="margin-top: 16px; padding: 12px; background: #f0f0f0; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-size: 14px; font-weight: 600; color: #333;">
                                    Votes: ${totalVotes}/7
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
                                    `<div style="height: 6px; flex: 1; border-radius: 3px; background: ${i < totalVotes ? '#f57c00' : '#e0e0e0'};"></div>`
                                ).join('')}
                            </div>
                        </div>
                        
                        ${hasVoted ? `
                            <div style="margin-top: 12px; padding: 8px 12px; background: ${userVote.vote === 'yes' ? '#d4edda' : '#f8d7da'}; color: ${userVote.vote === 'yes' ? '#155724' : '#721c24'}; border-radius: 6px; font-size: 14px; font-weight: 600;">
                                <i class="fas fa-${userVote.vote === 'yes' ? 'check-circle' : 'times-circle'}"></i> You voted ${userVote.vote.toUpperCase()}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${!hasVoted ? `
                    <div class="vote-buttons">
                        <button class="vote-btn yes" onclick="voteOnLesson('${req._id}', 'yes')">
                            <i class="fas fa-check"></i> Vote YES
                        </button>
                        <button class="vote-btn no" onclick="voteOnLesson('${req._id}', 'no')">
                            <i class="fas fa-times"></i> Vote NO
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

async function voteOnLesson(requestId, vote) {
    if (!confirm(`Are you sure you want to vote ${vote.toUpperCase()} on this lesson?`)) {
        return;
    }

    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/editor-commission/vote-lesson/${requestId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.API.getToken()}`
            },
            body: JSON.stringify({ vote })
        });
        const data = await response.json();

        if (data.success) {
            if (data.status) {
                // Final decision made
                alert(`Lesson ${data.status}! Final vote: ${data.votes.yes}-${data.votes.no}`);
            } else {
                alert(`Vote recorded! (${data.votesCount}/${data.totalNeeded} votes)`);
            }
            loadPendingLessons();
        } else {
            alert('Error voting: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error voting: ' + error.message);
    }
}

// Make function global for onclick handlers
window.voteOnLesson = voteOnLesson;

// Store lessons globally for preview
let currentLessons = [];

function displayPendingLessons(lessons) {
    const list = document.getElementById('pendingLessonsList');
    const badge = document.getElementById('lessonsBadge');
    const currentUser = window.API.getUser();
    
    currentLessons = lessons; // Store for preview
    badge.textContent = lessons.length;

    if (lessons.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No pending lessons from creators</p>';
        return;
    }

    list.innerHTML = lessons.map(req => {
        const typeColor = '#f57c00';
        const typeIcon = 'book';

        // Check if current user has voted
        const userVote = req.votes.find(v => v.user._id === currentUser._id);
        const hasVoted = !!userVote;
        
        // Count votes
        const yesVotes = req.votes.filter(v => v.vote === 'yes').length;
        const noVotes = req.votes.filter(v => v.vote === 'no').length;
        const totalVotes = req.votes.length;

        return `
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid ${typeColor};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="background: ${typeColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                                <i class="fas fa-${typeIcon}"></i> LESSON
                            </span>
                            <span style="color: #666; font-size: 14px;">
                                by <strong>${req.requestedBy.username}</strong> (Creator)
                            </span>
                            <span style="color: #999; font-size: 12px;">
                                ${new Date(req.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 4px;">
                            ${req.data.title}
                        </div>
                        <div style="font-size: 14px; color: #666; margin-bottom: 12px;">
                            ${req.data.description || ''}
                        </div>
                        
                        <!-- Preview Button -->
                        <button onclick="showLessonPreview('${req._id}')" style="background: #17a2b8; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 12px;">
                            <i class="fas fa-eye"></i> Preview Lesson
                        </button>
                        
                        <!-- Vote Progress -->
                        <div style="margin-top: 16px; padding: 12px; background: #f0f0f0; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-size: 14px; font-weight: 600; color: #333;">
                                    Votes: ${totalVotes}/7
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
                                    `<div style="height: 6px; flex: 1; border-radius: 3px; background: ${i < totalVotes ? '#f57c00' : '#e0e0e0'};"></div>`
                                ).join('')}
                            </div>
                        </div>
                        
                        ${hasVoted ? `
                            <div style="margin-top: 12px; padding: 8px 12px; background: ${userVote.vote === 'yes' ? '#d4edda' : '#f8d7da'}; color: ${userVote.vote === 'yes' ? '#155724' : '#721c24'}; border-radius: 6px; font-size: 14px; font-weight: 600;">
                                <i class="fas fa-${userVote.vote === 'yes' ? 'check-circle' : 'times-circle'}"></i> You voted ${userVote.vote.toUpperCase()}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${!hasVoted ? `
                    <div class="vote-buttons">
                        <button class="vote-btn yes" onclick="voteOnLesson('${req._id}', 'yes')">
                            <i class="fas fa-check"></i> Vote YES
                        </button>
                        <button class="vote-btn no" onclick="voteOnLesson('${req._id}', 'no')">
                            <i class="fas fa-times"></i> Vote NO
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Show lesson preview in modal
function showLessonPreview(requestId) {
    const request = currentLessons.find(r => r._id === requestId);
    if (!request) {
        alert('Lesson not found');
        return;
    }

    const lessonData = request.data;
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'lessonPreviewModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        overflow-y: auto;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #f8f9fa;
        border-radius: 12px;
        max-width: 1000px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        position: relative;
    `;
    
    // Build content based on lesson type
    let contentHTML = '';
    let typeBadge = '';
    let typeIcon = '';
    
    if (lessonData.type === 'text') {
        typeBadge = 'text';
        typeIcon = 'file-alt';
        contentHTML = `
            <div class="text-content">
                ${lessonData.content || '<p style="color: #999;">No content available</p>'}
            </div>
            ${lessonData.attachments && lessonData.attachments.length > 0 ? `
                <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e9ecef;">
                    <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #212529;">Attachments</h3>
                    ${lessonData.attachments.map(att => `
                        <div style="margin-bottom: 12px;">
                            <a href="${att.url}" target="_blank" style="color: #007bff; text-decoration: none; font-size: 16px;">
                                <i class="fas fa-paperclip"></i> ${att.name}
                            </a>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    } else if (lessonData.type === 'video') {
        typeBadge = 'video';
        typeIcon = 'play-circle';
        const videoId = lessonData.videoUrl ? lessonData.videoUrl.split('v=')[1]?.split('&')[0] : null;
        contentHTML = `
            <div class="video-content" style="text-align: center;">
                ${videoId ? `
                    <div style="position: relative; width: 100%; max-width: 800px; margin: 0 auto 20px;">
                        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
                            <iframe 
                                src="https://www.youtube.com/embed/${videoId}" 
                                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 8px;"
                                allowfullscreen>
                            </iframe>
                        </div>
                    </div>
                ` : '<div style="width: 100%; max-width: 800px; height: 450px; background: #000; border-radius: 8px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">No video URL provided</div>'}
                ${lessonData.content ? `
                    <div class="text-content" style="margin-top: 30px; text-align: left;">
                        ${lessonData.content}
                    </div>
                ` : ''}
            </div>
        `;
    } else if (lessonData.type === 'presentation') {
        typeBadge = 'presentation';
        typeIcon = 'presentation';
        contentHTML = `
            <div class="presentation-content" style="text-align: center;">
                ${lessonData.presentationUrl ? `
                    <div style="position: relative; width: 100%; height: 500px; border: 1px solid #dee2e6; border-radius: 8px; background: #f8f9fa; overflow: hidden; margin-bottom: 20px;">
                        <iframe 
                            src="${lessonData.presentationUrl}" 
                            style="width: 100%; height: 100%; border: none;"
                            allowfullscreen>
                        </iframe>
                    </div>
                ` : '<div style="width: 100%; height: 500px; border: 1px solid #dee2e6; border-radius: 8px; background: #f8f9fa; display: flex; align-items: center; justify-content: center; color: #6c757d; font-size: 18px; margin-bottom: 20px;">No presentation URL provided</div>'}
                ${lessonData.content ? `
                    <div class="text-content" style="margin-top: 30px; text-align: left;">
                        ${lessonData.content}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    modalContent.innerHTML = `
        <button onclick="closeLessonPreview()" style="position: absolute; top: 20px; right: 20px; background: white; border: none; color: #495057; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10; transition: all 0.2s;">
            <i class="fas fa-times"></i>
        </button>
        
        <div style="padding: 40px;">
            <!-- Lesson Header Section -->
            <div style="background: #ffffff; border-radius: 12px; padding: 40px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                <div style="display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; margin-bottom: 16px; background: ${typeBadge === 'video' ? '#fce4ec' : typeBadge === 'presentation' ? '#e8f5e8' : '#e3f2fd'}; color: ${typeBadge === 'video' ? '#c2185b' : typeBadge === 'presentation' ? '#388e3c' : '#1976d2'};">
                    <i class="fas fa-${typeIcon}" style="margin-right: 6px;"></i>
                    ${lessonData.type.charAt(0).toUpperCase() + lessonData.type.slice(1)} Lesson
                </div>
                <h1 style="font-size: 32px; font-weight: 700; color: #212529; margin-bottom: 16px; line-height: 1.2;">${lessonData.title}</h1>
                <p style="font-size: 18px; color: #6c757d; line-height: 1.6; margin-bottom: 30px;">${lessonData.description || ''}</p>
                
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; align-items: center; font-size: 14px; color: #495057;">
                            <i class="fas fa-user" style="margin-right: 8px; width: 16px; color: #6c757d;"></i>
                            <span>Created by: <strong>${request.requestedBy.username}</strong></span>
                        </div>
                        <div style="display: flex; align-items: center; font-size: 14px; color: #495057;">
                            <i class="fas fa-calendar" style="margin-right: 8px; width: 16px; color: #6c757d;"></i>
                            <span>Submitted: <strong>${new Date(request.createdAt).toLocaleDateString()}</strong></span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Lesson Content Section -->
            <div style="background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                ${contentHTML}
            </div>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Add hover effect to close button
    const closeBtn = modalContent.querySelector('button');
    closeBtn.addEventListener('mouseenter', function() {
        this.style.background = '#f8f9fa';
        this.style.transform = 'scale(1.1)';
    });
    closeBtn.addEventListener('mouseleave', function() {
        this.style.background = 'white';
        this.style.transform = 'scale(1)';
    });
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeLessonPreview();
        }
    });
}

function closeLessonPreview() {
    const modal = document.getElementById('lessonPreviewModal');
    if (modal) {
        modal.remove();
    }
}

// Make functions global
window.showLessonPreview = showLessonPreview;
window.closeLessonPreview = closeLessonPreview;
