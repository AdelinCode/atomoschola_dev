// Authentication functionality
document.addEventListener('DOMContentLoaded', function() {
    setupAuthEventListeners();
});

function setupAuthEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        setupAccountTypeSelection();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showMessage('Please fill in all fields.', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);
    
    try {
        const response = await window.API.auth.login(email, password);
        
        if (response.success) {
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    } catch (error) {
        hideLoading(submitBtn);
        showMessage(error.message || 'Login failed. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Validation
    if (!data.email || !data.password || !data.username) {
        showMessage('Please fill in all required fields.', 'error');
        return;
    }
    
    if (data.password !== data.confirmPassword) {
        showMessage('Passwords do not match.', 'error');
        return;
    }
    
    if (data.password.length < 6) {
        showMessage('Password must be at least 6 characters long.', 'error');
        return;
    }
    
    if (!data.accountType) {
        showMessage('Please select an account type.', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);
    
    try {
        const userData = {
            username: data.username,
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            userType: data.accountType,
            inviteCode: data.inviteCode
        };
        
        const response = await window.API.auth.register(userData);
        
        if (response.success) {
            showMessage('Registration successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    } catch (error) {
        hideLoading(submitBtn);
        showMessage(error.message || 'Registration failed. Please try again.', 'error');
    }
}

function setupAccountTypeSelection() {
    const accountTypeOptions = document.querySelectorAll('.account-type-option');
    const accountTypeInput = document.getElementById('accountType');
    const inviteCodeGroup = document.getElementById('inviteCodeGroup');
    
    accountTypeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            accountTypeOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Update hidden input value
            if (accountTypeInput) {
                accountTypeInput.value = this.dataset.type;
            }
            
            // Show/hide invite code field
            if (inviteCodeGroup) {
                if (this.dataset.type === 'creator' || this.dataset.type === 'editor') {
                    inviteCodeGroup.style.display = 'block';
                    document.getElementById('inviteCode').required = true;
                } else {
                    inviteCodeGroup.style.display = 'none';
                    document.getElementById('inviteCode').required = false;
                }
            }
        });
    });
}



function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessage = document.querySelector('.auth-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `auth-message auth-message-${type}`;
    messageEl.textContent = message;
    
    // Style the message
    messageEl.style.cssText = `
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
        animation: slideIn 0.3s ease;
    `;
    
    // Set colors based on type
    switch (type) {
        case 'success':
            messageEl.style.background = '#d4edda';
            messageEl.style.color = '#155724';
            messageEl.style.border = '1px solid #c3e6cb';
            break;
        case 'error':
            messageEl.style.background = '#f8d7da';
            messageEl.style.color = '#721c24';
            messageEl.style.border = '1px solid #f5c6cb';
            break;
        case 'info':
            messageEl.style.background = '#d1ecf1';
            messageEl.style.color = '#0c5460';
            messageEl.style.border = '1px solid #bee5eb';
            break;
    }
    
    // Insert message at the top of the form
    const form = document.querySelector('.auth-form') || document.querySelector('.demo-accounts');
    if (form) {
        form.parentNode.insertBefore(messageEl, form);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 5000);
}

function showLoading(button) {
    if (!button) return;
    
    button.disabled = true;
    button.classList.add('loading');
    button.dataset.originalText = button.textContent;
}

function hideLoading(button) {
    if (!button) return;
    
    button.disabled = false;
    button.classList.remove('loading');
    if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
    }
}

// Add CSS animation for message slide-in
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
