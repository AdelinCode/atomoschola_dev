// Report modal and functionality

// Create report modal on page load
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('reportModal')) {
        const modalHTML = `
            <div id="reportModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10000; align-items:center; justify-content:center;">
                <div style="background:white; border-radius:12px; padding:32px; max-width:500px; width:90%; position:relative;">
                    <button onclick="closeReportModal()" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:24px; cursor:pointer; color:#999;">&times;</button>
                    <h3 style="margin-bottom:20px; color:#dc3545;"><i class="fas fa-flag"></i> Report <span id="reportTargetType">Content</span></h3>
                    <p style="color:#666; font-size:14px; margin-bottom:20px;">Help us keep the platform safe. Please provide details about the issue.</p>
                    <input type="hidden" id="reportTargetId">
                    <input type="hidden" id="reportTargetTypeValue">
                    
                    <div style="margin-bottom:16px;">
                        <label style="display:block; font-weight:600; margin-bottom:8px; font-size:14px; color:#333;">Reason</label>
                        <select id="reportReason" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; font-size:14px;">
                            <option value="inappropriate_content">Inappropriate Content</option>
                            <option value="spam">Spam</option>
                            <option value="harassment">Harassment</option>
                            <option value="misinformation">Misinformation</option>
                            <option value="copyright_violation">Copyright Violation</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <label style="display:block; font-weight:600; margin-bottom:8px; font-size:14px; color:#333;">Description</label>
                        <textarea id="reportDescription" rows="4" placeholder="Please provide specific details..." style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; font-size:14px; resize:vertical; box-sizing:border-box;"></textarea>
                    </div>
                    
                    <div style="display:flex; gap:12px; justify-content:flex-end;">
                        <button onclick="closeReportModal()" style="background:#6c757d; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-size:14px;">Cancel</button>
                        <button onclick="submitReport()" style="background:#dc3545; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-size:14px; font-weight:600;">
                            <i class="fas fa-paper-plane"></i> Submit Report
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Close on overlay click
        document.getElementById('reportModal').addEventListener('click', function(e) {
            if (e.target === this) closeReportModal();
        });
    }
});

function openReportModal(targetType, targetId) {
    if (!window.API.isAuthenticated()) {
        alert('Please login to report content');
        window.location.href = 'login.html';
        return;
    }

    const modal = document.getElementById('reportModal');
    const typeLabel = document.getElementById('reportTargetType');
    document.getElementById('reportTargetTypeValue').value = targetType;

    // targetId can be passed directly, or derived from context
    if (!targetId) {
        if (targetType === 'lesson') {
            const urlParams = new URLSearchParams(window.location.search);
            targetId = urlParams.get('id');
        }
    }

    if (!targetId) {
        alert('Unable to identify target');
        return;
    }

    typeLabel.textContent = targetType === 'lesson' ? 'Lesson' : 'User';
    document.getElementById('reportTargetId').value = targetId;
    document.getElementById('reportReason').value = 'inappropriate_content';
    document.getElementById('reportDescription').value = '';

    modal.style.display = 'flex';
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

async function submitReport() {
    const targetType = document.getElementById('reportTargetTypeValue').value;
    const targetId = document.getElementById('reportTargetId').value;
    const reason = document.getElementById('reportReason').value;
    const description = document.getElementById('reportDescription').value.trim();
    
    if (!description) {
        alert('Please provide a description');
        return;
    }
    
    if (description.length < 10) {
        alert('Please provide more details (at least 10 characters)');
        return;
    }
    
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.API.getToken()}`
            },
            body: JSON.stringify({
                targetType,
                targetId,
                reason,
                description
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeReportModal();
            alert('Report submitted successfully. Thank you for helping us maintain the platform.');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (e) {
        alert('Error submitting report: ' + e.message);
    }
}

// Make functions global
window.openReportModal = openReportModal;
window.closeReportModal = closeReportModal;
window.submitReport = submitReport;
