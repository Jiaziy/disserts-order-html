// 登录功能相关的JavaScript代码

// 应用状态管理
const appState = {
    currentUser: null,
    isLoading: false
};

// 显示错误信息
function showErrorMessage(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

// 隐藏错误信息
function hideErrorMessage() {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

// 显示成功信息
function showSuccessMessage(message) {
    const successElement = document.getElementById('success-message');
    if (successElement) {
        successElement.textContent = message;
        successElement.classList.remove('hidden');
        
        // 3秒后自动隐藏
        setTimeout(() => {
            successElement.classList.add('hidden');
        }, 3000);
    }
}

// 切换登录注册模式
function toggleMode() {
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const loginModeBtn = document.getElementById('login-mode');
    const registerModeBtn = document.getElementById('register-mode');
    
    if (loginContainer && registerContainer && loginModeBtn && registerModeBtn) {
        loginContainer.classList.toggle('hidden');
        registerContainer.classList.toggle('hidden');
        
        loginModeBtn.classList.toggle('active');
        registerModeBtn.classList.toggle('active');
    }
}

// 切换登录方式
function toggleLoginMethod(method) {
    const emailLogin = document.getElementById('email-login');
    const phoneLogin = document.getElementById('phone-login');
    const emailLoginTab = document.getElementById('email-login-tab');
    const phoneLoginTab = document.getElementById('phone-login-tab');
    
    if (method === 'email') {
        if (emailLogin && phoneLogin && emailLoginTab && phoneLoginTab) {
            emailLogin.classList.remove('hidden');
            phoneLogin.classList.add('hidden');
            emailLoginTab.classList.add('active');
            phoneLoginTab.classList.remove('active');
        }
    } else if (method === 'phone') {
        if (emailLogin && phoneLogin && emailLoginTab && phoneLoginTab) {
            emailLogin.classList.add('hidden');
            phoneLogin.classList.remove('hidden');
            emailLoginTab.classList.remove('active');
            phoneLoginTab.classList.add('active');
        }
    }
}

// 切换注册方式
function toggleRegisterMethod(method) {
    const emailRegister = document.getElementById('email-register');
    const phoneRegister = document.getElementById('phone-register');
    const emailRegisterTab = document.getElementById('email-register-tab');
    const phoneRegisterTab = document.getElementById('phone-register-tab');
    
    if (method === 'email') {
        if (emailRegister && phoneRegister && emailRegisterTab && phoneRegisterTab) {
            emailRegister.classList.remove('hidden');
            phoneRegister.classList.add('hidden');
            emailRegisterTab.classList.add('active');
            phoneRegisterTab.classList.remove('active');
        }
    } else if (method === 'phone') {
        if (emailRegister && phoneRegister && emailRegisterTab && phoneRegisterTab) {
            emailRegister.classList.add('hidden');
            phoneRegister.classList.remove('hidden');
            emailRegisterTab.classList.remove('active');
            phoneRegisterTab.classList.add('active');
        }
    }
}

// 初始化登录页面
function initializeLogin() {
    // 绑定模式切换事件
    const loginModeBtn = document.getElementById('login-mode');
    const registerModeBtn = document.getElementById('register-mode');
    
    if (loginModeBtn) {
        loginModeBtn.addEventListener('click', () => toggleMode());
    }
    
    if (registerModeBtn) {
        registerModeBtn.addEventListener('click', () => toggleMode());
    }
    
    // 绑定登录方式切换事件
    const emailLoginTab = document.getElementById('email-login-tab');
    const phoneLoginTab = document.getElementById('phone-login-tab');
    
    if (emailLoginTab) {
        emailLoginTab.addEventListener('click', () => toggleLoginMethod('email'));
    }
    
    if (phoneLoginTab) {
        phoneLoginTab.addEventListener('click', () => toggleLoginMethod('phone'));
    }
    
    // 绑定注册方式切换事件
    const emailRegisterTab = document.getElementById('email-register-tab');
    const phoneRegisterTab = document.getElementById('phone-register-tab');
    
    if (emailRegisterTab) {
        emailRegisterTab.addEventListener('click', () => toggleRegisterMethod('email'));
    }
    
    if (phoneRegisterTab) {
        phoneRegisterTab.addEventListener('click', () => toggleRegisterMethod('phone'));
    }
    
    // 绑定登录表单提交事件
    const emailLoginForm = document.getElementById('email-login-form');
    const phoneLoginForm = document.getElementById('phone-login-form');
    
    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loginWithEmail();
        });
    }
    
    if (phoneLoginForm) {
        phoneLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loginWithPhone();
        });
    }
    
    // 绑定注册表单提交事件
    const emailRegisterForm = document.getElementById('email-register-form');
    const phoneRegisterForm = document.getElementById('phone-register-form');
    
    if (emailRegisterForm) {
        emailRegisterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            registerWithEmail();
        });
    }
    
    if (phoneRegisterForm) {
        phoneRegisterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            registerWithPhone();
        });
    }
    
    // 绑定验证码获取事件
    const getSmsBtn = document.getElementById('get-sms');
    const registerGetSmsBtn = document.getElementById('register-get-sms');
    
    if (getSmsBtn) {
        getSmsBtn.addEventListener('click', getSMSCode);
    }
    
    if (registerGetSmsBtn) {
        registerGetSmsBtn.addEventListener('click', getRegisterSMSCode);
    }
    
    // 绑定微信登录按钮
    const wechatLoginBtn = document.getElementById('wechat-login');
    if (wechatLoginBtn) {
        wechatLoginBtn.addEventListener('click', loginWithWechat);
    }
    
    // 绑定表单验证事件
    const loginEmailInput = document.getElementById('email');
    const loginPhoneInput = document.getElementById('phone');
    const registerEmailInput = document.getElementById('register-email');
    const registerPhoneInput = document.getElementById('register-phone');
    const registerPasswordInput = document.getElementById('register-email-password');
    const registerConfirmPasswordInput = document.getElementById('register-email-confirm-password');
    
    if (loginEmailInput) {
        loginEmailInput.addEventListener('input', () => validateEmail(loginEmailInput));
    }
    
    if (loginPhoneInput) {
        loginPhoneInput.addEventListener('input', () => validatePhone(loginPhoneInput));
    }
    
    if (registerEmailInput) {
        registerEmailInput.addEventListener('input', () => validateEmail(registerEmailInput));
    }
    
    if (registerPhoneInput) {
        registerPhoneInput.addEventListener('input', () => validatePhone(registerPhoneInput));
    }
    
    if (registerPasswordInput) {
        registerPasswordInput.addEventListener('input', validateRegisterPassword);
    }
    
    if (registerConfirmPasswordInput) {
        registerConfirmPasswordInput.addEventListener('input', validateConfirmPassword);
    }
}

// 检查登录状态
async function checkLoginStatus() {
    try {
        // 使用Supabase auth检查登录状态
        const currentUser = await document.supabase.auth.getCurrentUser();
        if (currentUser) {
            appState.currentUser = currentUser;
            console.log('已登录用户:', appState.currentUser);
            window.location.href = 'main.html';
            return;
        }
        
        // 兼容旧版本，检查本地存储中的登录状态
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            appState.currentUser = JSON.parse(storedUser);
            console.log('已登录用户(本地):', appState.currentUser);
            window.location.href = 'main.html';
            return;
        }
    } catch (error) {
        console.error('检查登录状态失败:', error);
        // 继续执行，不影响页面加载
    }
}

// 通用手机号验证
function validatePhone(inputElement) {
    const phone = inputElement.value;
    const phoneRegex = /^1[3-9]\d{9}$/;
    
    if (!phoneRegex.test(phone)) {
        inputElement.style.borderColor = '#ff6b6b';
        return false;
    }
    
    inputElement.style.borderColor = '#28a745';
    return true;
}

// 通用邮箱验证
function validateEmail(inputElement) {
    const email = inputElement.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        inputElement.style.borderColor = '#ff6b6b';
        return false;
    }
    
    inputElement.style.borderColor = '#28a745';
    return true;
}

// 注册密码验证
function validateRegisterPassword() {
    const password = document.getElementById('register-email-password')?.value || document.getElementById('register-phone-password')?.value;
    const inputElement = document.getElementById('register-email-password') || document.getElementById('register-phone-password');
    
    if (!inputElement) return false;
    
    // 密码长度6-20位
    if (password.length < 6 || password.length > 20) {
        inputElement.style.borderColor = '#ff6b6b';
        return false;
    }
    
    inputElement.style.borderColor = '#28a745';
    validateConfirmPassword(); // 触发确认密码验证
    return true;
}

// 确认密码验证
function validateConfirmPassword() {
    const password = document.getElementById('register-email-password')?.value || document.getElementById('register-phone-password')?.value;
    const confirmPassword = document.getElementById('register-email-confirm-password')?.value || document.getElementById('register-phone-confirm-password')?.value;
    const inputElement = document.getElementById('register-email-confirm-password') || document.getElementById('register-phone-confirm-password');
    
    if (!inputElement) return false;
    
    if (confirmPassword && password !== confirmPassword) {
        inputElement.style.borderColor = '#ff6b6b';
        return false;
    }
    
    if (confirmPassword) {
        inputElement.style.borderColor = '#28a745';
    }
    return true;
}

// 获取登录验证码（模拟）
function getSMSCode() {
    const phone = document.getElementById('phone').value;
    
    if (!validatePhone(document.getElementById('phone'))) {
        alert('请输入正确的手机号');
        return;
    }
    
    // 模拟发送验证码
    console.log('发送验证码到手机:', phone);
    
    // 禁用按钮并开始倒计时
    const smsBtn = document.getElementById('get-sms');
    startSmsCountdown(smsBtn);
    
    alert('验证码已发送到您的手机');
}

// 获取注册验证码（模拟）
function getRegisterSMSCode() {
    const phone = document.getElementById('register-phone').value;
    
    if (!validatePhone(document.getElementById('register-phone'))) {
        alert('请输入正确的手机号');
        return;
    }
    
    // 模拟发送验证码
    console.log('发送注册验证码到手机:', phone);
    
    // 禁用按钮并开始倒计时
    const smsBtn = document.getElementById('register-get-sms');
    startSmsCountdown(smsBtn);
    
    alert('注册验证码已发送到您的手机');
}

// 验证码倒计时
function startSmsCountdown(button) {
    button.disabled = true;
    button.textContent = '60秒后重试';
    
    let countdown = 60;
    const timer = setInterval(() => {
        countdown--;
        button.textContent = countdown + '秒后重试';
        
        if (countdown <= 0) {
            clearInterval(timer);
            button.disabled = false;
            button.textContent = '获取验证码';
        }
    }, 1000);
}

// 手机登录（使用localStorage模拟）
async function loginWithPhone() {
    hideErrorMessage();
    const phone = document.getElementById('phone').value;
    const smsCode = document.getElementById('sms-code').value;
    
    if (!validatePhone(document.getElementById('phone'))) {
        showErrorMessage('请输入正确的手机号');
        return;
    }
    
    if (!smsCode) {
        showErrorMessage('请输入验证码');
        return;
    }
    
    try {
        // 使用document.supabase.auth进行手机登录
        const result = await document.supabase.auth.signInWithPhone(phone, smsCode);
        
        if (result.success) {
            console.log('手机登录成功，用户信息:', result.user);
            
            showSuccessMessage('登录成功！');
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 1500);
        } else {
            console.error('手机登录失败:', result.error);
            showErrorMessage('登录失败: ' + (result.error || '验证码错误'));
        }
    } catch (error) {
        console.error('手机登录异常:', error);
        showErrorMessage('登录失败: 请稍后重试');
    }
}

// 邮箱登录
async function loginWithEmail() {
    hideErrorMessage();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!validateEmail(document.getElementById('email'))) {
        showErrorMessage('请输入正确的邮箱地址');
        return;
    }
    
    if (!password) {
        showErrorMessage('请输入密码');
        return;
    }
    
    try {
        // 使用document.supabase.auth进行登录
        const result = await document.supabase.auth.signIn(email, password);
        
        if (result.success) {
            console.log('登录成功，用户信息:', result.user);
            // 同时保存到localStorage
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            
            showSuccessMessage('登录成功！');
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 1500);
        } else {
            console.error('登录失败:', result.error);
            
            // 提供更友好的错误信息
            let errorMessage = '登录失败: ';
            if (result.error && result.error.includes('Invalid login credentials')) {
                errorMessage += '邮箱或密码错误';
            } else if (result.error && result.error.includes('User not confirmed')) {
                errorMessage += '请先验证您的邮箱';
            } else {
                errorMessage += result.error || '网络错误，请稍后重试';
            }
            
            showErrorMessage(errorMessage);
        }
    } catch (error) {
        console.error('登录异常:', error);
        showErrorMessage('登录失败: ' + (error.message || '网络错误，请稍后重试'));
    }
}

// 微信登录（使用localStorage模拟）
async function loginWithWechat() {
    hideErrorMessage();
    try {
        // 使用document.supabase.auth进行微信登录
        const result = await document.supabase.auth.signInWithWechat();
        
        if (result.success) {
            console.log('微信登录成功，用户信息:', result.user);
            
            showSuccessMessage('微信登录成功！');
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 1500);
        } else {
            console.error('微信登录失败:', result.error);
            showErrorMessage('微信登录失败: ' + (result.error || '登录失败'));
        }
    } catch (error) {
        console.error('微信登录异常:', error);
        showErrorMessage('微信登录失败: 请稍后重试');
    }
}

// 手机注册（使用localStorage模拟）
async function registerWithPhone() {
    hideErrorMessage();
    const phone = document.getElementById('register-phone').value;
    const smsCode = document.getElementById('register-sms-code').value;
    const password = document.getElementById('register-phone-password').value;
    const confirmPassword = document.getElementById('register-phone-confirm-password').value;
    
    if (!validatePhone(document.getElementById('register-phone'))) {
        showErrorMessage('请输入正确的手机号');
        return;
    }
    
    if (!smsCode) {
        showErrorMessage('请输入验证码');
        return;
    }
    
    if (!password || password.length < 6) {
        showErrorMessage('密码长度至少为6位');
        return;
    }
    
    if (password !== confirmPassword) {
        showErrorMessage('两次输入的密码不一致');
        return;
    }
    
    try {
        // 准备用户数据
        const userData = {
            phone: phone,
            name: '用户' + phone.slice(-4)
        };
        
        // 使用document.supabase.auth进行注册
        const email = `phone_${phone}@example.com`;
        const result = await document.supabase.auth.signUp(email, password, userData);
        
        if (result.success) {
            console.log('手机注册成功，用户信息:', result.user);
            
            showSuccessMessage('注册成功！');
            
            // 切换到登录模式并自动填充手机号
            setTimeout(() => {
                document.getElementById('login-mode').click();
                document.getElementById('phone').value = phone;
            }, 1500);
        } else {
            console.error('手机注册失败:', result.error);
            showErrorMessage('注册失败: ' + (result.error || '注册失败'));
        }
    } catch (error) {
        console.error('手机注册异常:', error);
        showErrorMessage('注册失败: 请稍后重试');
    }
}

// 邮箱注册
async function registerWithEmail() {
    hideErrorMessage();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-email-password').value;
    const confirmPassword = document.getElementById('register-email-confirm-password').value;
    
    if (!validateEmail(document.getElementById('register-email'))) {
        showErrorMessage('请输入正确的邮箱地址');
        return;
    }
    
    if (!password || password.length < 6) {
        showErrorMessage('请设置6-20位的密码');
        return;
    }
    
    if (password !== confirmPassword) {
        showErrorMessage('两次输入的密码不一致');
        return;
    }
    
    try {
        // 准备用户数据
        const userData = {
            name: email.split('@')[0]
        };
        
        // 使用document.supabase.auth进行注册
         const result = await document.supabase.auth.signUp(email, password, userData);
        
        if (result.success) {
            console.log('注册成功，用户信息:', result.user);
            showSuccessMessage('注册成功！请检查邮箱完成验证');
            
            // 切换到登录模式并自动填充邮箱
            setTimeout(() => {
                document.getElementById('register-mode').click();
                document.getElementById('email').value = email;
            }, 2000);
        } else {
            console.error('注册失败:', result.error);
            
            // 提供更友好的错误信息
            let errorMessage = '注册失败: ';
            if (result.error && result.error.includes('User already registered')) {
                errorMessage += '该邮箱已被注册';
            } else if (result.error && result.error.includes('Password should be at least')) {
                errorMessage += '密码长度不符合要求';
            } else {
                errorMessage += result.error || '网络错误，请稍后重试';
            }
            
            showErrorMessage(errorMessage);
        }
    } catch (error) {
        console.error('注册异常:', error);
        showErrorMessage('注册失败: ' + (error.message || '网络错误，请稍后重试'));
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeLogin);

// 如果DOM已经加载完成，立即初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLogin);
} else {
    initializeLogin();
}

// 检查登录状态
checkLoginStatus();