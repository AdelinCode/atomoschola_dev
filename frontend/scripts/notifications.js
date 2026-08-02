// Notifications system

let notificationsData = [];
let unreadCount = 0;

// Initialize notifications
async function initNotifications() {
    if (!window.API || !window.API.isAuthenticated()) {
        return;
    }

    // Load initial notifications
    await loadNotifications();
    
    // Poll for new notifications every 30 seconds
    setInterval(loadNotifications, 30000);
}

// Load notifications
async function loadNotifications() {
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/notifications`, {
            headers: {
                'Authorization': `Bearer ${window.API.getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            notificationsData = data.data;
            unreadCount = data.unreadCount;
            updateNotificationBadge();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Update notification badge
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Show notifications modal
async function showNotificationsModal() {
    // Ensure we have latest data
    await loadNotifications();
    
    let modal = document.getElementById('notificationsModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'notificationsModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    let notificationsHTML = '';
    
    if (notificationsData.length === 0) {
        notificationsHTML = '<div class="notif-empty"><i class="fas fa-bell-slash"></i>No notifications yet</div>';
    } else {
        notificationsHTML = '<div style="display:flex;flex-direction:column;gap:10px;">';
        notificationsData.forEach(notification => {
            const icon = getNotificationIcon(notification.type);
            const color = getNotificationColor(notification.type);
            const isUnread = !notification.isRead;
            const url = getNotificationUrl(notification);

            notificationsHTML += `
                <div class="notification-item ${isUnread ? 'unread' : ''}" style="border-left-color:${color};">
                    ${isUnread ? '<div class="notif-unread-dot"></div>' : ''}
                    <button onclick="deleteNotification('${notification._id}', event)" class="notif-delete-btn" title="Delete notification">
                        <i class="fas fa-trash"></i>
                    </button>
                    <div class="notif-body"
                         data-notif-id="${notification._id}"
                         data-notif-url="${url || ''}"
                         onclick="handleNotificationClick(this)">
                        <div class="notif-icon" style="background:${color};">
                            <i class="${icon}"></i>
                        </div>
                        <div class="notif-text">
                            <div class="notif-title">${notification.title}</div>
                            <div class="notif-message">${notification.message}</div>
                            <div class="notif-meta">
                                <span><i class="fas fa-clock"></i>${formatNotificationTime(notification.createdAt)}</span>
                                ${notification.reviewedBy ? `<span><i class="fas fa-user"></i>${notification.reviewedBy.username}</span>` : ''}
                                ${url ? '<span class="notif-link-hint"><i class="fas fa-arrow-right"></i>View</span>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        notificationsHTML += '</div>';
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-bell"></i> Notifications</h3>
                <div style="display:flex;gap:10px;align-items:center;">
                    ${notificationsData.length > 0 && unreadCount > 0 ? '<button onclick="markAllAsRead()" class="notif-mark-all-btn">Mark all read</button>' : ''}
                    <button class="modal-close" onclick="closeNotificationsModal()">&times;</button>
                </div>
            </div>
            <div class="modal-body">
                ${notificationsHTML}
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Close notifications modal
window.closeNotificationsModal = function() {
    const modal = document.getElementById('notificationsModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Handle notification click — mark as read then navigate
window.handleNotificationClick = async function(el) {
    const notificationId = el.dataset.notifId;
    const url = el.dataset.notifUrl || null;

    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        await fetch(`${apiUrl}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${window.API.getToken()}` }
        });
        await loadNotifications();
    } catch (e) { /* ignore */ }

    if (url) {
        window.location.href = url;
    } else {
        showNotificationsModal();
    }
};

// Mark notification as read
window.markAsRead = async function(notificationId) {
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        await fetch(`${apiUrl}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${window.API.getToken()}`
            }
        });
        
        // Reload notifications
        await loadNotifications();
        showNotificationsModal();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

// Mark all as read
window.markAllAsRead = async function() {
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        await fetch(`${apiUrl}/notifications/mark-all-read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${window.API.getToken()}`
            }
        });
        
        // Reload notifications
        await loadNotifications();
        showNotificationsModal();
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
};

// Delete notification
window.deleteNotification = async function(notificationId, event) {
    // Stop propagation to prevent marking as read
    if (event) {
        event.stopPropagation();
    }
    
    if (!confirm('Are you sure you want to delete this notification?')) {
        return;
    }
    
    try {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${window.API.getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Reload notifications
            await loadNotifications();
            showNotificationsModal();
        } else {
            alert('Error deleting notification: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        alert('Error deleting notification');
    }
};

// Get notification navigation URL
function getNotificationUrl(notification) {
    const { type, relatedItem } = notification;

    // Rejected notifications and password reset have no meaningful destination
    if (!relatedItem || type.includes('rejected') || type === 'password_reset_request') return null;

    // relatedItem may be a populated object or just an ID string (old notifications)
    const itemId = relatedItem._id || relatedItem;

    if (type === 'lesson_approved') {
        return `lesson.html?id=${itemId}`;
    }

    if (type === 'domain_approved') {
        const subjectSlug = relatedItem.subject?.slug;
        if (subjectSlug) return `subject.html?subject=${subjectSlug}`;
        return null;
    }

    if (type === 'category_approved') {
        const subjectSlug = relatedItem.domain?.subject?.slug;
        if (subjectSlug) return `subject.html?subject=${subjectSlug}`;
        return null;
    }

    return null;
}

// Get notification icon
function getNotificationIcon(type) {
    const icons = {
        lesson_approved: 'fas fa-check-circle',
        lesson_rejected: 'fas fa-times-circle',
        domain_approved: 'fas fa-check-circle',
        domain_rejected: 'fas fa-times-circle',
        category_approved: 'fas fa-check-circle',
        category_rejected: 'fas fa-times-circle',
        password_reset_request: 'fas fa-key'
    };
    return icons[type] || 'fas fa-bell';
}

// Get notification color
function getNotificationColor(type) {
    if (type === 'password_reset_request') return '#f59e0b';
    if (type.includes('approved')) {
        return '#28a745';
    } else if (type.includes('rejected')) {
        return '#dc3545';
    }
    return '#667eea';
}

// Format notification time
function formatNotificationTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

// Export functions
window.showNotificationsModal = showNotificationsModal;
window.initNotifications = initNotifications;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
} else {
    initNotifications();
}
