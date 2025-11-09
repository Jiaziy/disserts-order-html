// 注意：supabase.js 已更新为使用全局对象 document.supabase

// 全局状态管理
const appState = {
    currentUser: null,
    designs: [],
    users: {},
    // 移除 isSupabaseReady 标志，因为现在使用全局对象
};

// 页面初始化
async function initializeApp() {
    console.log('开始初始化应用...');
    
    // 初始化应用
    // 现在 supabase.js 会自动初始化并挂载到 document.supabase
    
    // 检查用户会话 - 添加错误处理
    try {
        let user = null;
        // 尝试使用document.supabase.auth
        try {
            if (document.supabase && document.supabase.auth && typeof document.supabase.auth.getCurrentUser === 'function') {
                user = document.supabase.auth.getCurrentUser();
                console.log('通过supabase.auth获取用户');
            }
        } catch (e) {
            console.error('调用supabase.auth.getCurrentUser出错:', e);
            user = null;
        }
        
        if (!user) {
            // 直接从 localStorage 恢复用户（更可靠的方式）
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                try {
                    user = JSON.parse(savedUser);
                    console.log('从 localStorage 恢复用户数据');
                } catch (e) {
                    console.error('解析用户数据失败', e);
                }
            }
        }
        
        if (user) {
            appState.currentUser = user;
        }
    } catch (error) {
        console.error('获取用户会话失败:', error);
        // 尝试直接从localStorage恢复
        try {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                appState.currentUser = JSON.parse(savedUser);
                console.log('从localStorage恢复用户数据');
            }
        } catch (e) {
            console.error('localStorage解析失败:', e);
        }
    }
    
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

    // 底部导航切换
    const tabbarItems = document.querySelectorAll('.tabbar-item');
    console.log('找到底部导航项数量:', tabbarItems.length);
    
    tabbarItems.forEach(item => {
        item.addEventListener('click', function() {
            console.log('点击底部导航:', this.getAttribute('data-page'));
            const page = this.getAttribute('data-page');
            showPage(page);
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
    const tabContent = document.getElementById(`${tab}-tab`);
    if (tabContent) {
        tabContent.classList.add('active');
    }
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
async function loginSuccess(user) {
    appState.currentUser = user;
    
    try {
        // 使用 document.supabase.auth 进行身份验证
        console.log('从 supabase 恢复用户状态');
        // 手动更新 appState.currentUser
        if (localStorage.currentUser) {
            try {
                appState.currentUser = JSON.parse(localStorage.currentUser);
                console.log('从本地存储恢复用户:', appState.currentUser);
            } catch (e) {
                console.error('解析本地存储的用户数据失败:', e);
                localStorage.removeItem('currentUser');
            }
        }
        
        // 保持向后兼容，仍然存储到本地存储
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        showMainPage();
        showToast(`欢迎回来，${user.name}！`);
    } catch (error) {
        console.error('登录成功处理错误:', error);
        showToast('登录成功，但同步到 Supabase 失败');
    }
}

// 退出登录
async function logout() {
    try {
        // 退出登录 - 添加错误处理
        try {
            if (document.supabase && document.supabase.auth && typeof document.supabase.auth.signOut === 'function') {
                await document.supabase.auth.signOut();
                console.log('成功调用supabase.auth.signOut');
            }
        } catch (error) {
            console.error('退出登录出错:', error);
        }
        
        appState.currentUser = null;
        localStorage.removeItem('currentUser');
        
        // 跳转到用户登录页面
        window.location.href = 'user-login.html';
        showToast('已退出登录');
    } catch (error) {
        console.error('退出登录错误:', error);
        // 即使 Supabase 退出失败，仍然清除本地状态
        appState.currentUser = null;
        localStorage.removeItem('currentUser');
        showLoginPage();
        showToast('已退出登录');
    }
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

// 显示页面
function showPage(pageName) {
    // 更新导航状态
    document.querySelectorAll('.tabbar-item').forEach(item => {
        item.classList.remove('active');
    });
    const navItem = document.querySelector(`[data-page="${pageName}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // 更新页面内容
    document.querySelectorAll('.page-content').forEach(content => {
        content.classList.remove('active');
    });
    const pageContent = document.getElementById(`${pageName}-page`);
    if (pageContent) {
        pageContent.classList.add('active');
    }
    
    // 页面特定初始化
    if (pageName === 'designs') {
        loadDesigns();
    }
}

// 开始定制
function startCustomize(productType) {
    showPage('customize');
    // 这里可以跳转到具体的定制页面
    showToast(`开始${productType}定制`);
}

// 加载设计列表
async function loadDesigns() {
    const designsList = document.getElementById('designs-list');
    if (!designsList) return;
    
    try {
        // 从 document.supabase 获取设计列表
        if (appState.currentUser) {
            try {
                // 使用 document.supabase.designs 获取用户设计
                const userDesigns = document.supabase.designs.getUserDesigns(appState.currentUser.id);
                console.log('获取到用户设计:', userDesigns);
                appState.designs = userDesigns;
            } catch (error) {
                console.error('获取设计列表失败:', error);
                showToast('获取设计列表失败');
            }
        }
        
        if (appState.designs.length === 0) {
            designsList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无设计作品</p>';
            return;
        }
        
        designsList.innerHTML = appState.designs.map((design, index) => `
            <div class="design-item" onclick="viewDesign(${index})">
                <img src="${design.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNGOUY5RjkiLz4KICA8dGV4dCB4PSI2MCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+5pys56e75YqgPC90ZXh0Pgo8L3N2Zz4K'}" alt="设计作品">
                <p>设计 ${index + 1}</p>
                <small>${new Date(design.createTime || design.created_at).toLocaleDateString()}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载设计列表错误:', error);
        designsList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">加载设计失败</p>';
    }
}

// 查看设计
function viewDesign(index) {
    const design = appState.designs[index];
    showToast(`查看设计 ${index + 1}`);
    // 这里可以打开设计详情页面
}

// 生成用户ID
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 显示提示信息
function showToast(message) {
    // 移除现有的toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 创建新的toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        z-index: 10000;
        font-size: 14px;
        animation: fadeInOut 2s ease-in-out;
    `;
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -40px); }
            20% { opacity: 1; transform: translate(-50%, -50%); }
            80% { opacity: 1; transform: translate(-50%, -50%); }
            100% { opacity: 0; transform: translate(-50%, -60px); }
        }
    `;
    document.head.appendChild(style);
    
    // 添加toast到页面
    document.body.appendChild(toast);
    
    // 2秒后自动移除
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 2000);
}

// 导航到定制页面
function navigateToCustomize(productType) {
    if (!appState.currentUser) {
        showToast('请先登录');
        return;
    }
    
    if (window.navigationManager) {
        window.navigationManager.navigateTo(`customize.html?type=${productType}`);
    } else {
        window.location.href = `customize.html?type=${productType}`;
    }
}

// 检查登录状态并跳转
function checkAuthAndNavigate(page) {
    if (!appState.currentUser) {
        showLoginPage();
        showToast('请先登录');
        return false;
    }
    return true;
}

// 微信登录二维码生成（模拟）
function generateWechatQRCode() {
    // 这里可以集成真实的微信登录API
    console.log('生成微信登录二维码');
}

// 页面加载完成后的初始化
window.addEventListener('load', function() {
    // 初始化微信登录（如果需要）
    generateWechatQRCode();
});