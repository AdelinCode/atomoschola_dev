// API Configuration
const CONFIG = {
  // API URL - hardcoded for now, change this to your backend URL
  API_BASE_URL: 'https://atomoschola-backend.vercel.app/api',
  
  // Environment detection
  IS_DEVELOPMENT: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  IS_PRODUCTION: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
};

// Override for local development
if (CONFIG.IS_DEVELOPMENT) {
  CONFIG.API_BASE_URL = 'http://localhost:5000/api';
}

// Make config available globally
window.CONFIG = CONFIG;

// Log environment info in development
if (CONFIG.IS_DEVELOPMENT) {
  console.log('🔧 Development Mode');
  console.log('API URL:', CONFIG.API_BASE_URL);
} else {
  console.log('🚀 Production Mode');
  console.log('API URL:', CONFIG.API_BASE_URL);
}