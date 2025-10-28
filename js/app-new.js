// 全局状态管理
const appState = {
    currentUser: null,
    designs: JSON.parse(localStorage.getItem('designs')) || [],
    users: JSON.parse(localStorage.getItem('users')) || {}
};

// 页面初始化
function initializeApp() {
    console.log('开始初始化应用...');
    initApp();
    setupEventListeners();
    checkLoginStatus();
    console.log('应用初始化完成');
}

// 确保DOM完全加载后初始化
document.addEventListener('DOMContentLoaded', initializeApp);

// 如果DOM已经加载完成，立即初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// 初始化应用
function initApp() {
    // 检查是否有保存的用户登录状态
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        appState.currentUser = JSON.parse(savedUser);
    }
}

// 设置事件监听器
function setupEventListeners() {
    console.log('开始设置事件监听器...');
    
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

    // 顶部导航菜单点击事件
    const navItems = document.querySelectorAll('.nav-item');
    console.log('找到顶部导航项数量:', navItems.length);
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            console.log('点击顶部导航:', this.getAttribute('data-page'));
            const page = this.getAttribute('data-page');
            navigateToPage(page);
        });
    });

    // 侧边栏菜单点击事件
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    console.log('找到侧边栏项数量:', sidebarItems.length);
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            console.log('点击侧边栏:', this.getAttribute('data-page'));
            const page = this.getAttribute('data-page');
            navigateToPage(page);
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
    
    console.log('事件监听器设置完成');
}

// 检查登录状态
function checkLoginStatus() {
    if (appState.currentUser) {
        showMainPage();
    } else {
        showLoginPage();
    }
}

// 显示登录页面
function showLoginPage() {
    const loginPage = document.getElementById('login-page');
    const mainPage = document.getElementById('main-page');
    
    if (loginPage) loginPage.classList.add('active');
    if (mainPage) mainPage.classList.remove('active');
}

// 显示主页面
function showMainPage() {
    const loginPage = document.getElementById('login-page');
    const mainPage = document.getElementById('main-page');
    
    if (loginPage) loginPage.classList.remove('active');
    if (mainPage) mainPage.classList.add('active');
    
    updateUserInfo();
    loadDesigns();
}

// 页面导航功能
function navigateToPage(page) {
    // 隐藏所有页面内容
    document.querySelectorAll('.page-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(page + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // 更新导航激活状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    const sidebarItem = document.querySelector(`.sidebar-item[data-page="${page}"]`);
    
    if (navItem) navItem.classList.add('active');
    if (sidebarItem) sidebarItem.classList.add('active');
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
    document.getElementById(`${tab}-tab`).classList.add('active');
}

// 手机号验证
function validatePhone() {
    const phone = document.getElementById('phone').value;
    const smsBtn = document.getElementById('get-sms');
    
    if (/^1[3-9]\d{9}$/.test(phone)) {
        smsBtn.disabled = false;
        return true;
    } else {
        smsBtn.disabled = true;
        return false;
    }
}

// 邮箱验证
function validateEmail() {
    const email = document.getElementById('email').value;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 获取短信验证码
function getSMSCode() {
    if (!validatePhone()) {
        showToast('请输入正确的手机号');
        return;
    }

    const phone = document.getElementById('phone').value;
    const smsBtn = document.getElementById('get-sms');
    
    // 模拟发送验证码
    smsBtn.disabled = true;
    smsBtn.textContent = '60秒后重试';
    
    let countdown = 60;
    const timer = setInterval(() => {
        countdown--;
        smsBtn.textContent = `${countdown}秒后重试`;
        
        if (countdown <= 0) {
            clearInterval(timer);
            smsBtn.disabled = false;
            smsBtn.textContent = '获取验证码';
        }
    }, 1000);
    
    // 模拟验证码发送成功
    setTimeout(() => {
        showToast('验证码已发送到您的手机');
    }, 1000);
}

// 手机号登录
function loginWithPhone() {
    const phone = document.getElementById('phone').value;
    const smsCode = document.getElementById('sms-code').value;
    
    if (!validatePhone()) {
        showToast('请输入正确的手机号');
        return;
    }
    
    if (!smsCode) {
        showToast('请输入验证码');
        return;
    }
    
    // 模拟登录验证
    if (smsCode === '123456') { // 测试用验证码
        const user = {
            id: generateUserId(),
            phone: phone,
            name: `用户${phone.slice(-4)}`,
            loginType: 'phone',
            loginTime: new Date().toISOString()
        };
        
        loginSuccess(user);
    } else {
        showToast('验证码错误，请重新输入');
    }
}

// 邮箱登录
function loginWithEmail() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('email-password').value;
    
    if (!validateEmail()) {
        showToast('请输入正确的邮箱地址');
        return;
    }
    
    if (!password) {
        showToast('请输入密码');
        return;
    }
    
    // 检查是否已注册
    if (appState.users[email]) {
        if (appState.users[email].password === password) {
            loginSuccess(appState.users[email]);
        } else {
            showToast('密码错误');
        }
    } else {
        // 新用户自动注册
        const user = {
            id: generateUserId(),
            email: email,
            name: email.split('@')[0],
            password: password,
            loginType: 'email',
            loginTime: new Date().toISOString()
        };
        
        // 保存用户信息
        appState.users[email] = user;
        localStorage.setItem('users', JSON.stringify(appState.users));
        
        loginSuccess(user);
    }
}

// 微信登录（模拟）
function loginWithWechat() {
    // 模拟微信登录过程
    setTimeout(() => {
        const user = {
            id: generateUserId(),
            name: '微信用户',
            loginType: 'wechat',
            loginTime: new Date().toISOString()
        };
        
        loginSuccess(user);
    }, 2000);
}

// 登录成功处理
function loginSuccess(user) {
    appState.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    showMainPage();
    showToast(`欢迎回来，${user.name}！`);
}

// 退出登录
function logout() {
    appState.currentUser = null;
    localStorage.removeItem('currentUser');
    
    showLoginPage();
    showToast('已退出登录');
}

// 更新用户信息显示
function updateUserInfo() {
    if (!appState.currentUser) return;
    
    const userName = document.getElementById('user-name');
    const profileName = document.getElementById('profile-name');
    const profilePhone = document.getElementById('profile-phone');
    const profileEmail = document.getElementById('profile-email');
    
    if (userName) userName.textContent = appState.currentUser.name;
    if (profileName) profileName.textContent = appState.currentUser.name;
    if (profilePhone) profilePhone.textContent = appState.currentUser.phone || '未绑定';
    if (profileEmail) profileEmail.textContent = appState.currentUser.email || '未绑定';
}

// 导航到定制页面
function navigateToCustomize(type) {
    window.location.href = `customize.html?type=${type}`;
}

// 加载设计列表
function loadDesigns() {
    const designsList = document.getElementById('designs-list');
    if (!designsList) return;
    
    if (appState.designs.length === 0) {
        designsList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无设计作品</p>';
        return;
    }
    
    designsList.innerHTML = appState.designs.map((design, index) => `
        <div class="design-item" onclick="viewDesign(${index})">
            <div style="background: #f0f0f0; height: 150px; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #999;">
                <i class="fas fa-image" style="font-size: 48px;"></i>
            </div>
            <div class="design-title">${design.name}</div>
            <div style="font-size: 12px; color: #999;">${design.date}</div>
        </div>
    `).join('');
}

// 查看设计详情
function viewDesign(index) {
    const design = appState.designs[index];
    showToast(`查看设计: ${design.name}`);
    // 这里可以跳转到设计详情页面
}

// 生成用户ID
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 显示提示消息
function showToast(message) {
    // 创建或获取toast容器
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // 创建toast元素
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: #FF6B95;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // 3秒后自动移除
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 添加CSS动画
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}