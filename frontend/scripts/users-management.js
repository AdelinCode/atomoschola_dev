// Users Management for Dashboard

let currentUpgradeUserId = null;
let allUsers = [];

// Load all users
async function loadUsers() {
    try {
        const response = await window.API.users.getAll();
        if (response.success) {
            allUsers = response.data;
            displayUsers(allUsers);
            updateUsersCount(allUsers.length);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersList').innerHTML = 
            '<p style="text-align: center; color: #dc3545;">Error loading users</p>';
    }
}

// Update users count
function updateUsersCount(count) {
    const countEl = document.getElementById('usersCount');
    if (countEl) {
        countEl.textContent = `${count} user${count !== 1 ? 's' : ''}`;
    }
}

// Search users
function searchUsers(query) {
    const filtered = allUsers.filter(user => {
        const searchTerm = query.toLowerCase();
        return user.username.toLowerCase().includes(searchTerm) ||
               user.email.toLowerCase().includes(searchTerm) ||
               user.userType.toLowerCase().includes(searchTerm);
    });
    
    displayUsers(filtered);
    updateUsersCount(filtered.length);
}

// Setup search listener
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('userSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchUsers(e.target.value);
        });
    }
});

function displayUsers(users) {
    const container = document.getElementById('usersList');
    
    if (users.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d;">No users found</p>';
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="user-item">
            <div class="user-info">
                <div class="user-name">
                    ${user.username}
                    ${user.isCreatorCommissionMember ? '<span style="background: #f57c00; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px; font-weight: 600;">CREATOR COMMISSION</span>' : ''}
                    ${user.isEditorCommissionMember ? '<span style="background: #6f42c1; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px; font-weight: 600;">EDITOR COMMISSION</span>' : ''}
                </div>
                <div class="user-email">${user.email}</div>
                <span class="user-type-badge ${user.userType}">${user.userType.toUpperCase()}</span>
            </div>
            <div class="user-actions">
                ${user.userType !== 'owner' ? `
                    <select onchange="changeUserType('${user._id}', this.value)" style="padding: 6px 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; cursor: pointer;">
                        <option value="">Change Type</option>
                        <option value="user">User</option>
                        <option value="creator">Creator</option>
                        <option value="editor">Editor</option>
                        <option value="staff">Staff</option>
                    </select>
                    ${['creator', 'editor', 'staff'].includes(user.userType) ? `
                        <button class="btn btn-secondary btn-small" onclick="toggleCreatorCommission('${user._id}', ${user.isCreatorCommissionMember})" style="background: ${user.isCreatorCommissionMember ? '#dc3545' : '#f57c00'}; color: white; border: none; white-space: nowrap; font-size: 12px;">
                            <i class="fas fa-${user.isCreatorCommissionMember ? 'user-minus' : 'user-plus'}"></i> ${user.isCreatorCommissionMember ? 'Remove C' : 'Creator C'}
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="toggleEditorCommission('${user._id}', ${user.isEditorCommissionMember})" style="background: ${user.isEditorCommissionMember ? '#dc3545' : '#6f42c1'}; color: white; border: none; white-space: nowrap; font-size: 12px;">
                            <i class="fas fa-${user.isEditorCommissionMember ? 'user-minus' : 'user-plus'}"></i> ${user.isEditorCommissionMember ? 'Remove E' : 'Editor C'}
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary btn-small" onclick="deleteUser('${user._id}', '${user.username}')" style="background: #dc3545; color: white; border: none;">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : '<span style="color: #666; font-size: 12px;">Protected</span>'}
            </div>
        </div>
    `).join('');
}



// Change user type directly (owner only)
window.changeUserType = async function(userId, newType) {
    if (!newType) return;
    
    if (!confirm(`Are you sure you want to change this user's type to ${newType.toUpperCase()}?`)) {
        return;
    }
    
    const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
    
    try {
        const response = await fetch(`${apiUrl}/users/${userId}/type`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ userType: newType })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('User type changed successfully!');
            loadUsers();
        } else {
            alert('Error changing user type: ' + result.message);
        }
    } catch (error) {
        console.error('Error changing user type:', error);
        alert('Error changing user type: ' + error.message);
    }
};

// Delete user
window.deleteUser = async function(userId, username) {
    if (!confirm(`⚠️ Are you sure you want to DELETE user "${username}"?\n\nThis will:\n- Delete the user account\n- Remove all their data\n- This action CANNOT be undone!\n\nType the username to confirm.`)) {
        return;
    }
    
    const confirmUsername = prompt(`Type "${username}" to confirm deletion:`);
    
    if (confirmUsername !== username) {
        alert('Username does not match. Deletion cancelled.');
        return;
    }
    
    const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
    
    try {
        const response = await fetch(`${apiUrl}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success message
            const msg = document.createElement('div');
            msg.textContent = `User "${username}" deleted successfully!`;
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
            setTimeout(() => msg.remove(), 3000);
            
            loadUsers();
        } else {
            alert('Error deleting user: ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + error.message);
    }
};

// Toggle creator commission membership
window.toggleCreatorCommission = async function(userId, isCurrentlyMember) {
    const action = isCurrentlyMember ? 'remove from' : 'add to';
    
    if (!confirm(`Are you sure you want to ${action} the Creator Commission?`)) {
        return;
    }
    
    const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
    
    try {
        const response = await fetch(`${apiUrl}/commission/toggle/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message + '\n\nNote: The user needs to logout and login again to see the Creator Commission Dashboard button.');
            loadUsers();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error toggling creator commission:', error);
        alert('Error: ' + error.message);
    }
};

// Toggle editor commission membership
window.toggleEditorCommission = async function(userId, isCurrentlyMember) {
    const action = isCurrentlyMember ? 'remove from' : 'add to';
    
    if (!confirm(`Are you sure you want to ${action} the Editor Commission?`)) {
        return;
    }
    
    const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
    
    try {
        const response = await fetch(`${apiUrl}/editor-commission/toggle/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message + '\n\nNote: The user needs to logout and login again to see the Editor Commission Dashboard button.');
            loadUsers();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error toggling editor commission:', error);
        alert('Error: ' + error.message);
    }
};

// Add getAll method to users API if not exists
if (window.API && window.API.users && !window.API.users.getAll) {
    window.API.users.getAll = () => {
        const apiUrl = window.CONFIG ? window.CONFIG.API_BASE_URL : 'http://localhost:5000/api';
        return fetch(`${apiUrl}/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        }).then(res => res.json());
    };
}
