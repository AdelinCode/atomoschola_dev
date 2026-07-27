// Commission Dashboard functionality

let currentRequests = [];

document.addEventListener('DOMContentLoaded', function () {
    const currentUser = window.API.getUser();
    if (!currentUser || !currentUser.isCreatorCommissionMember) {
        alert('Access denied! Only creator commission members can access this dashboard.');
        window.location.href = '/';
        return;
    }
    initCommissionDashboard();
});

function initCommissionDashboard() {
    loadPendingRequests();
    setInterval(loadPendingRequests, 15000);
}

async function loadPendingRequests() {
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/commission/pending-requests`, {
            headers: { 'Authorization': `Bearer ${window.API.getToken()}` }
        });
        const data = await response.json();

        if (data.success) {
            displayPendingRequests(data.data);
        } else {
            document.getElementById('pendingRequestsList').innerHTML =
                `<p style="text-align:center;color:#dc3545;">Error: ${data.message}</p>`;
        }
    } catch (error) {
        console.error('Error loading pending requests:', error);
        document.getElementById('pendingRequestsList').innerHTML =
            `<p style="text-align:center;color:#dc3545;">Error loading requests: ${error.message}</p>`;
    }
}

function displayPendingRequests(requests) {
    const list = document.getElementById('pendingRequestsList');
    const count = document.getElementById('pendingCount');
    const currentUser = window.API.getUser();

    const lessonRequests = requests.filter(req => req.type === 'lesson');
    currentRequests = lessonRequests;
    count.textContent = lessonRequests.length;

    if (lessonRequests.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#6c757d;padding:20px;">No pending lesson requests</p>';
        return;
    }

    try {
        list.innerHTML = lessonRequests.map(req => {
            const userVote = req.votes.find(v =>
                v.user && (v.user._id?.toString() === currentUser._id?.toString() || v.user === currentUser._id)
            );
            const hasVoted = !!userVote;
            const yesVotes = req.votes.filter(v => v.vote === 'yes').length;
            const noVotes  = req.votes.filter(v => v.vote === 'no').length;
            const totalVotes = req.votes.length;

            return `
                <div style="background:var(--bg-secondary);padding:16px;border-radius:8px;margin-bottom:12px;border-left:4px solid #f57c00;">
                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
                        <div style="flex:1;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                                <span style="background:#f57c00;color:white;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">
                                    <i class="fas fa-book"></i> LESSON
                                </span>
                                <span style="color:var(--text-secondary);font-size:14px;">
                                    by <strong style="color:var(--text-primary);">${req.requestedBy?.username || 'Unknown'}</strong>
                                </span>
                                <span style="color:var(--text-secondary);font-size:12px;">
                                    ${new Date(req.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div style="font-size:16px;font-weight:600;color:var(--text-primary);margin-bottom:4px;">
                                ${req.data?.title || '—'}
                            </div>
                            <div style="font-size:14px;color:var(--text-secondary);margin-bottom:12px;">
                                ${req.data?.description || ''}
                            </div>

                            <button onclick="showLessonPreview('${req._id}')" style="background:#17a2b8;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;margin-bottom:12px;">
                                <i class="fas fa-eye"></i> Preview Lesson
                            </button>

                            <div class="vote-progress">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                    <span style="font-size:14px;font-weight:600;color:var(--text-primary);">Votes: ${totalVotes}/7</span>
                                    <div style="display:flex;gap:16px;font-size:14px;">
                                        <span style="color:#28a745;font-weight:600;"><i class="fas fa-check"></i> ${yesVotes}</span>
                                        <span style="color:#dc3545;font-weight:600;"><i class="fas fa-times"></i> ${noVotes}</span>
                                    </div>
                                </div>
                                <div class="vote-bar">
                                    ${Array(7).fill(0).map((_, i) =>
                                        `<div class="vote-bar-item ${i < totalVotes ? 'voted' : ''}"></div>`
                                    ).join('')}
                                </div>
                            </div>

                            ${hasVoted ? `
                                <div style="margin-top:12px;padding:8px 12px;background:${userVote.vote === 'yes' ? '#d4edda' : '#f8d7da'};color:${userVote.vote === 'yes' ? '#155724' : '#721c24'};border-radius:6px;font-size:14px;font-weight:600;">
                                    <i class="fas fa-${userVote.vote === 'yes' ? 'check-circle' : 'times-circle'}"></i> You voted ${userVote.vote.toUpperCase()}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    ${!hasVoted ? `
                        <div class="vote-buttons">
                            <button class="vote-btn yes" onclick="voteOnRequest('${req._id}', 'yes')">
                                <i class="fas fa-check"></i> Vote YES
                            </button>
                            <button class="vote-btn no" onclick="voteOnRequest('${req._id}', 'no')">
                                <i class="fas fa-times"></i> Vote NO
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Error rendering requests:', err);
        list.innerHTML = `<p style="text-align:center;color:#dc3545;">Error rendering requests: ${err.message}</p>`;
    }
}

async function voteOnRequest(requestId, vote) {
    if (!confirm(`Are you sure you want to vote ${vote.toUpperCase()} on this request?`)) return;

    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/commission/vote/${requestId}`, {
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
                alert(`Request ${data.status}! Final vote: ${data.votes.yes}-${data.votes.no}`);
            } else {
                alert(`Vote recorded! (${data.votesCount}/${data.totalNeeded} votes)`);
            }
            loadPendingRequests();
        } else {
            alert('Error voting: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error voting: ' + error.message);
    }
}

window.voteOnRequest = voteOnRequest;

function showLessonPreview(requestId) {
    const request = currentRequests.find(r => r._id === requestId);
    if (!request) { alert('Lesson not found'); return; }

    const lessonData = request.data;
    const modal = document.createElement('div');
    modal.id = 'lessonPreviewModal';
    modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px;overflow-y:auto;`;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `background:var(--bg-primary);border-radius:12px;max-width:1000px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 10px 40px rgba(0,0,0,0.3);position:relative;`;

    let contentHTML = '';
    let typeBadge = '';
    let typeIcon = '';

    if (lessonData.type === 'text') {
        typeBadge = 'text'; typeIcon = 'file-alt';
        contentHTML = `
            <div class="text-content">${lessonData.content || '<p style="color:#999;">No content available</p>'}</div>
            ${lessonData.attachments?.length ? `
                <div style="margin-top:30px;padding-top:30px;border-top:1px solid var(--border-primary);">
                    <h3 style="font-size:20px;font-weight:600;margin-bottom:16px;color:var(--text-primary);">Attachments</h3>
                    ${lessonData.attachments.map(att => `
                        <div style="margin-bottom:12px;">
                            <a href="${att.url}" target="_blank" style="color:#007bff;text-decoration:none;font-size:16px;">
                                <i class="fas fa-paperclip"></i> ${att.name}
                            </a>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    } else if (lessonData.type === 'video') {
        typeBadge = 'video'; typeIcon = 'play-circle';
        const videoId = lessonData.videoUrl ? lessonData.videoUrl.split('v=')[1]?.split('&')[0] : null;
        contentHTML = `
            <div class="video-content" style="text-align:center;">
                ${videoId ? `
                    <div style="position:relative;width:100%;max-width:800px;margin:0 auto 20px;">
                        <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">
                            <iframe src="https://www.youtube.com/embed/${videoId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:8px;" allowfullscreen></iframe>
                        </div>
                    </div>
                ` : '<div style="width:100%;max-width:800px;height:450px;background:#000;border-radius:8px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;">No video URL provided</div>'}
                ${lessonData.content ? `<div class="text-content" style="margin-top:30px;text-align:left;">${lessonData.content}</div>` : ''}
            </div>
        `;
    } else if (lessonData.type === 'presentation') {
        typeBadge = 'presentation'; typeIcon = 'chalkboard';
        contentHTML = `
            <div class="presentation-content" style="text-align:center;">
                ${lessonData.presentationUrl ? `
                    <div style="position:relative;width:100%;height:500px;border:1px solid var(--border-primary);border-radius:8px;background:var(--bg-secondary);overflow:hidden;margin-bottom:20px;">
                        <iframe src="${lessonData.presentationUrl}" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>
                    </div>
                ` : `<div style="width:100%;height:500px;border:1px solid var(--border-primary);border-radius:8px;background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;color:var(--text-secondary);font-size:18px;margin-bottom:20px;">No presentation URL provided</div>`}
                ${lessonData.content ? `<div class="text-content" style="margin-top:30px;text-align:left;">${lessonData.content}</div>` : ''}
            </div>
        `;
    }

    modalContent.innerHTML = `
        <button onclick="closeLessonPreview()" style="position:absolute;top:20px;right:20px;background:var(--bg-secondary);border:none;color:var(--text-primary);width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.15);z-index:10;">
            <i class="fas fa-times"></i>
        </button>
        <div style="padding:40px;">
            <div style="background:var(--bg-primary);border:1px solid var(--border-primary);border-radius:12px;padding:40px;margin-bottom:30px;box-shadow:0 2px 8px var(--shadow-light);">
                <div style="display:inline-flex;align-items:center;padding:6px 12px;border-radius:20px;font-size:14px;font-weight:500;margin-bottom:16px;background:${typeBadge === 'video' ? '#fce4ec' : typeBadge === 'presentation' ? '#e8f5e8' : '#e3f2fd'};color:${typeBadge === 'video' ? '#c2185b' : typeBadge === 'presentation' ? '#388e3c' : '#1976d2'};">
                    <i class="fas fa-${typeIcon}" style="margin-right:6px;"></i>
                    ${lessonData.type.charAt(0).toUpperCase() + lessonData.type.slice(1)} Lesson
                </div>
                <h1 style="font-size:32px;font-weight:700;color:var(--text-primary);margin-bottom:16px;line-height:1.2;">${lessonData.title}</h1>
                <p style="font-size:18px;color:var(--text-secondary);line-height:1.6;margin-bottom:30px;">${lessonData.description || ''}</p>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    <div style="display:flex;align-items:center;font-size:14px;color:var(--text-muted);">
                        <i class="fas fa-user" style="margin-right:8px;width:16px;color:var(--text-secondary);"></i>
                        Created by: <strong style="margin-left:4px;">${request.requestedBy?.username || 'Unknown'}</strong>
                    </div>
                    <div style="display:flex;align-items:center;font-size:14px;color:var(--text-muted);">
                        <i class="fas fa-calendar" style="margin-right:8px;width:16px;color:var(--text-secondary);"></i>
                        Submitted: <strong style="margin-left:4px;">${new Date(request.createdAt).toLocaleDateString()}</strong>
                    </div>
                </div>
            </div>
            <div style="background:var(--bg-primary);border:1px solid var(--border-primary);border-radius:12px;padding:40px;box-shadow:0 2px 8px var(--shadow-light);">
                ${contentHTML}
            </div>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeLessonPreview(); });
}

function closeLessonPreview() {
    document.getElementById('lessonPreviewModal')?.remove();
}

window.showLessonPreview = showLessonPreview;
window.closeLessonPreview = closeLessonPreview;
