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
    loadApprovedEdits();
    
    // Refresh every 15 seconds
    setInterval(() => {
        if (currentTab === 'pending') {
            loadPendingProposals();
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
        } else {
            document.getElementById('pendingProposalsList').innerHTML =
                '<p style="text-align: center; color: #dc3545;">Error loading proposals</p>';
        }
    } catch (error) {
        console.error('Error loading proposals:', error);
        document.getElementById('pendingProposalsList').innerHTML =
            `<p style="text-align: center; color: #dc3545;">Error loading proposals: ${error.message}</p>`;
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

    try {
        list.innerHTML = proposals.map(proposal => {
            // Check if current user has voted
            const userVote = proposal.votes.find(v =>
                v.user && (v.user._id?.toString() === currentUser._id?.toString() || v.user === currentUser._id)
            );
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
                                    by <strong>${proposal.proposedBy?.username || 'Unknown'}</strong>
                                </span>
                                <span style="color: #999; font-size: 12px;">
                                    ${new Date(proposal.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h4 style="margin: 12px 0 16px 0; color: #333;">Proposed Edits (${proposal.edits.length}):</h4>

                            ${proposal.edits.map((edit, index) => {
                                const lesson = edit.lesson;
                                const lessonPath = lesson?.category?.domain?.subject
                                    ? `${lesson.category.domain.subject.name} → ${lesson.category.domain.name} → ${lesson.category.name} → ${lesson.title}`
                                    : (lesson?.title || 'Unknown lesson');
                                const content = edit.editContent || '';

                                return `
                                <div class="edit-detail">
                                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">
                                        <span style="background: #6f42c1; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 8px;">${index + 1}</span>
                                        ${lessonPath}
                                    </div>
                                    <div style="font-size: 14px; color: #666; margin-bottom: 4px;">
                                        <strong>Description:</strong> ${edit.editDescription || '—'}
                                    </div>
                                    <div style="font-size: 14px; color: #666;">
                                        <strong>Content:</strong> ${content.substring(0, 150)}${content.length > 150 ? '...' : ''}
                                    </div>
                                </div>
                            `}).join('')}

                            <!-- Vote Progress -->
                            <div style="margin-top: 16px; padding: 12px; background: #f0f0f0; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <span style="font-size: 14px; font-weight: 600; color: #333;">Votes: ${totalVotes}/7</span>
                                    <div style="display: flex; gap: 16px; font-size: 14px;">
                                        <span style="color: #28a745; font-weight: 600;"><i class="fas fa-check"></i> ${yesVotes}</span>
                                        <span style="color: #dc3545; font-weight: 600;"><i class="fas fa-times"></i> ${noVotes}</span>
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
    } catch (err) {
        console.error('Error rendering proposals:', err);
        list.innerHTML = `<p style="text-align: center; color: #dc3545;">Error rendering proposals: ${err.message}</p>`;
    }
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
