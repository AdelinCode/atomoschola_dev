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
        notificationsHTML = '<div style="text-align: center; padding: 40px; color: #999;">No notifications yet</div>';
    } else {
        notificationsHTML = '<div style="display: flex; flex-direction: column; gap: 12px;">';
        notificationsData.forEach(notification => {
            const icon = getNotificationIcon(notification.type);
            const color = getNotificationColor(notification.type);
            const isUnread = !notification.isRead;
            
            notificationsHTML += `
                <div class="notification-item ${isUnread ? 'unread' : ''}" style="padding: 16px; border-radius: 8px; background: ${isUnread ? '#f0f7ff' : '#f8f9fa'}; border-left: 4px solid ${color}; position: relative;">
                    ${isUnread ? '<div style="position: absolute; top: 16px; right: 48px; width: 8px; height: 8px; background: #dc3545; border-radius: 50%;"></div>' : ''}
                    <button onclick="deleteNotification('${notification._id}', event)" style="position: absolute; top: 12px; right: 12px; background: #dc3545; color: white; border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: all 0.3s ease;" title="Delete notification">
                        <i class="fas fa-trash"></i>
                    </button>
                    <div onclick="markAsRead('${notification._id}')" style="cursor: pointer; padding-right: 40px;">
                        <div style="display: flex; align-items: start; gap: 12px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
                                <i class="${icon}"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${notification.title}</div>
                                <div style="color: #666; font-size: 14px; margin-bottom: 8px;">${notification.message}</div>
                                <div style="display: flex; align-items: center; gap: 12px; font-size: 12px; color: #999;">
                                    <span><i class="fas fa-clock"></i> ${formatNotificationTime(notification.createdAt)}</span>
                                    ${notification.reviewedBy ? `<span><i class="fas fa-user"></i> ${notification.reviewedBy.username}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        notificationsHTML += '</div>';
    }
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
            <div class="modal-header" style="flex-shrink: 0;">
                <h3><i class="fas fa-bell"></i> Notifications</h3>
                <div style="display: flex; gap: 12px; align-items: center;">
                    ${notificationsData.length > 0 && unreadCount > 0 ? '<button onclick="markAllAsRead()" style="background: #667eea; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">Mark all read</button>' : ''}
                    <button class="modal-close" onclick="closeNotificationsModal()">&times;</button>
                </div>
            </div>
            <div class="modal-body" style="flex: 1; overflow-y: auto;">
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

// Get notification icon
function getNotificationIcon(type) {
    const icons = {
        lesson_approved: 'fas fa-check-circle',
        lesson_rejected: 'fas fa-times-circle',
        domain_approved: 'fas fa-check-circle',
        domain_rejected: 'fas fa-times-circle',
        category_approved: 'fas fa-check-circle',
        category_rejected: 'fas fa-times-circle'
    };
    return icons[type] || 'fas fa-bell';
}

// Get notification color
function getNotificationColor(type) {
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
