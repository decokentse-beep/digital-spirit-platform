// Navigation Authentication Script
// Add this to all pages for consistent login-aware navigation

function checkLogin() {
    const user = localStorage.getItem('user');
    const userArea = document.getElementById('userArea');
    const loginPrompt = document.getElementById('loginPrompt');
    
    if (user) {
        const userData = JSON.parse(user);
        if (userArea) {
            userArea.innerHTML = '<span>' + userData.name + '</span> | <a href="/profile">個人檔案</a> | <a href="#" onclick="logout()">登出</a>';
        }
        if (loginPrompt) loginPrompt.style.display = 'none';
        // Enable posting features
        document.querySelectorAll('.btn-reply.disabled').forEach(btn => {
            btn.classList.remove('disabled');
        });
    } else {
        if (userArea) {
            userArea.innerHTML = '<a href="/login">登入</a>';
        }
        if (loginPrompt) loginPrompt.style.display = 'block';
        // Disable posting features
        document.querySelectorAll('.btn-reply').forEach(btn => {
            btn.classList.add('disabled');
        });
    }
}

function logout() {
    localStorage.removeItem('user');
    location.reload();
}

// Run on page load
document.addEventListener('DOMContentLoaded', checkLogin);
