// 登录页面专用JavaScript
const appState = {
    currentUser: null
};

// 页面初始化
function initializeLogin() {
    console.log('开始初始化登录页面...');
    setupLoginEventListeners();
    checkLoginStatus();
    console.log('登录页面初始化完成');
}

// 设置登录页面事件监听器
function setupLoginEventListeners() {
    console.log('开始设置登录页面事件监听器...');
    
    // 登录标签页切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    console.log('找到标签页按钮数量:', tabBtns.length);
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('点击标签页:', this.getAttribute('data-tab'));
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    // 获取验证码按钮
    const smsBtn = document.getElementById('get-sms');
    console.log('找到验证码按钮:', !!smsBtn);
    if (smsBtn) {
        smsBtn.addEventListener('click', function() {
            console.log('点击获取验证码按钮');
            getSMSCode();
        });
    }

    // 登录按钮
    const phoneLoginBtn = document.getElementById('phone-login-btn');
    console.log('找到手机登录按钮:', !!phoneLoginBtn);
    if (phoneLoginBtn) {
        phoneLoginBtn.addEventListener('click', function() {
            console.log('点击手机登录按钮');
            loginWithPhone();
        });
    }

    const emailLoginBtn = document.getElementById('email-login-btn');
    console.log('找到邮箱登录按钮:', !!emailLoginBtn);
    if (emailLoginBtn) {
        emailLoginBtn.addEventListener('click', function() {
            console.log('点击邮箱登录按钮');
            loginWithEmail();
        });
    }

    const wechatLoginBtn = document.getElementById('wechat-login-btn');
    console.log('找到微信登录按钮:', !!wechatLoginBtn);
    if (wechatLoginBtn) {
        wechatLoginBtn.addEventListener('click', function() {
            console.log('点击微信登录按钮');
            loginWithWechat();
        });
    }

    // 输入框实时验证
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            console.log('手机号输入:', this.value);
            validatePhone();
        });
    }
    
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            console.log('邮箱输入:', this.value);
            validateEmail();
        });
    }
    
    console.log('登录页面事件监听器设置完成');
}

// 检查登录状态
function checkLoginStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        appState.currentUser = JSON.parse(savedUser);
        // 如果已登录，直接跳转到主页面
        window.location.href = 'main.html';
    }
}

// 切换登录标签页
function switchTab(tab) {
    // 更新按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // 更新内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tab + '-tab').classList.add('active');
}

// 获取验证码
function getSMSCode() {
    const phone = document.getElementById('phone').value;
    
    if (!validatePhone()) {
        alert('请输入正确的手机号');
        return;
    }
    
    // 模拟发送验证码
    console.log('发送验证码到手机:', phone);
    
    // 禁用按钮并开始倒计时
    const smsBtn = document.getElementById('get-sms');
    smsBtn.disabled = true;
    smsBtn.textContent = '60秒后重试';
    
    let countdown = 60;
    const timer = setInterval(() => {
        countdown--;
        smsBtn.textContent = countdown + '秒后重试';
        
        if (countdown <= 0) {
            clearInterval(timer);
            smsBtn.disabled = false;
            smsBtn.textContent = '获取验证码';
        }
    }, 1000);
    
    alert('验证码已发送到您的手机');
}

// 手机号验证
function validatePhone() {
    const phone = document.getElementById('phone').value;
    const phoneRegex = /^1[3-9]\d{9}$/;
    
    if (!phoneRegex.test(phone)) {
        document.getElementById('phone').style.borderColor = '#ff6b6b';
        return false;
    }
    
    document.getElementById('phone').style.borderColor = '#28a745';
    return true;
}

// 邮箱验证
function validateEmail() {
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        document.getElementById('email').style.borderColor = '#ff6b6b';
        return false;
    }
    
    document.getElementById('email').style.borderColor = '#28a745';
    return true;
}

// 手机登录
function loginWithPhone() {
    const phone = document.getElementById('phone').value;
    const smsCode = document.getElementById('sms-code').value;
    
    if (!validatePhone()) {
        alert('请输入正确的手机号');
        return;
    }
    
    if (!smsCode) {
        alert('请输入验证码');
        return;
    }
    
    // 模拟登录成功
    const user = {
        id: Date.now(),
        phone: phone,
        name: '用户' + phone.slice(-4),
        loginTime: new Date().toISOString()
    };
    
    appState.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    alert('登录成功！');
    window.location.href = 'main.html';
}

// 邮箱登录
function loginWithEmail() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('email-password').value;
    
    if (!validateEmail()) {
        alert('请输入正确的邮箱地址');
        return;
    }
    
    if (!password) {
        alert('请输入密码');
        return;
    }
    
    // 模拟登录成功
    const user = {
        id: Date.now(),
        email: email,
        name: email.split('@')[0],
        loginTime: new Date().toISOString()
    };
    
    appState.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    alert('登录成功！');
    window.location.href = 'main.html';
}

// 微信登录
function loginWithWechat() {
    // 模拟微信登录
    const user = {
        id: Date.now(),
        name: '微信用户' + Math.floor(Math.random() * 10000),
        loginTime: new Date().toISOString(),
        type: 'wechat'
    };
    
    appState.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    alert('微信登录成功！');
    window.location.href = 'main.html';
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeLogin);

// 如果DOM已经加载完成，立即初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLogin);
} else {
    initializeLogin();
}