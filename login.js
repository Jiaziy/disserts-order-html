// 最基础的登录功能实现
console.log('登录功能脚本已加载');

// 为所有按钮添加onclick属性
function setupButtonActions() {
  console.log('开始设置按钮点击事件');
  
  // 查找登录/注册模式切换按钮
  const loginModeBtn = document.getElementById('login-mode') || document.getElementById('loginMode');
  const registerModeBtn = document.getElementById('register-mode') || document.getElementById('registerMode');
  
  if (loginModeBtn) {
    loginModeBtn.setAttribute('onclick', "switchToLoginMode()");
    console.log('设置了登录模式切换按钮');
  }
  
  if (registerModeBtn) {
    registerModeBtn.setAttribute('onclick', "switchToRegisterMode()");
    console.log('设置了注册模式切换按钮');
  }
  
  // 查找登录方式切换按钮
  const phoneTabBtn = document.getElementById('phone-tab-btn');
  const emailTabBtn = document.getElementById('email-tab-btn');
  const wechatTabBtn = document.getElementById('wechat-tab-btn');
  
  if (phoneTabBtn) {
    phoneTabBtn.setAttribute('onclick', "switchToPhoneLogin()");
    console.log('设置了手机登录切换按钮');
  }
  
  if (emailTabBtn) {
    emailTabBtn.setAttribute('onclick', "switchToEmailLogin()");
    console.log('设置了邮箱登录切换按钮');
  }
  
  if (wechatTabBtn) {
    wechatTabBtn.setAttribute('onclick', "switchToWechatLogin()");
    console.log('设置了微信登录切换按钮');
  }
  
  // 查找注册方式切换按钮
  const registerPhoneTabBtn = document.getElementById('register-phone-tab-btn');
  const registerEmailTabBtn = document.getElementById('register-email-tab-btn');
  
  if (registerPhoneTabBtn) {
    registerPhoneTabBtn.setAttribute('onclick', "switchToPhoneRegister()");
    console.log('设置了手机注册切换按钮');
  }
  
  if (registerEmailTabBtn) {
    registerEmailTabBtn.setAttribute('onclick', "switchToEmailRegister()");
    console.log('设置了邮箱注册切换按钮');
  }
  
  // 查找验证码按钮
  const getSmsBtn = document.getElementById('get-sms');
  const registerGetSmsBtn = document.getElementById('register-get-sms');
  
  if (getSmsBtn) {
    getSmsBtn.setAttribute('onclick', "getLoginSmsCode()");
    console.log('设置了登录验证码按钮');
  }
  
  if (registerGetSmsBtn) {
    registerGetSmsBtn.setAttribute('onclick', "getRegisterSmsCode()");
    console.log('设置了注册验证码按钮');
  }
  
  // 查找登录/注册按钮
  const phoneLoginBtn = document.getElementById('phone-login-btn');
  const emailLoginBtn = document.getElementById('email-login-btn');
  const wechatLoginBtn = document.getElementById('wechat-login-btn');
  const phoneRegisterBtn = document.getElementById('phone-register-btn');
  const emailRegisterBtn = document.getElementById('email-register-btn');
  
  if (phoneLoginBtn) {
    phoneLoginBtn.setAttribute('onclick', "doPhoneLogin()");
    console.log('设置了手机登录按钮');
  }
  
  if (emailLoginBtn) {
    emailLoginBtn.setAttribute('onclick', "doEmailLogin()");
    console.log('设置了邮箱登录按钮');
  }
  
  if (wechatLoginBtn) {
    wechatLoginBtn.setAttribute('onclick', "doWechatLogin()");
    console.log('设置了微信登录按钮');
  }
  
  if (phoneRegisterBtn) {
    phoneRegisterBtn.setAttribute('onclick', "doPhoneRegister()");
    console.log('设置了手机注册按钮');
  }
  
  if (emailRegisterBtn) {
    emailRegisterBtn.setAttribute('onclick', "doEmailRegister()");
    console.log('设置了邮箱注册按钮');
  }
  
  console.log('按钮点击事件设置完成');
}

// 模式切换函数 - 全局函数可以被内联onclick调用
function switchToLoginMode() {
  console.log('切换到登录模式');
  const loginForm = document.getElementById('login-form-container');
  const registerForm = document.getElementById('register-form-container');
  
  if (loginForm) loginForm.style.display = 'block';
  if (registerForm) registerForm.style.display = 'none';
  
  // 激活按钮状态
  const loginModeBtn = document.getElementById('login-mode') || document.getElementById('loginMode');
  const registerModeBtn = document.getElementById('register-mode') || document.getElementById('registerMode');
  
  if (loginModeBtn) loginModeBtn.classList.add('active');
  if (registerModeBtn) registerModeBtn.classList.remove('active');
  
  alert('已切换到登录模式');
}

function switchToRegisterMode() {
  console.log('切换到注册模式');
  const loginForm = document.getElementById('login-form-container');
  const registerForm = document.getElementById('register-form-container');
  
  if (loginForm) loginForm.style.display = 'none';
  if (registerForm) registerForm.style.display = 'block';
  
  // 激活按钮状态
  const loginModeBtn = document.getElementById('login-mode') || document.getElementById('loginMode');
  const registerModeBtn = document.getElementById('register-mode') || document.getElementById('registerMode');
  
  if (loginModeBtn) loginModeBtn.classList.remove('active');
  if (registerModeBtn) registerModeBtn.classList.add('active');
  
  alert('已切换到注册模式');
}

// 登录方式切换函数
function switchToPhoneLogin() {
  console.log('切换到手机登录');
  const phoneTab = document.getElementById('phone-login-form') || document.getElementById('phone-tab');
  const emailTab = document.getElementById('email-login-form') || document.getElementById('email-tab');
  const wechatTab = document.getElementById('wechat-login-form') || document.getElementById('wechat-tab');
  
  if (phoneTab) phoneTab.style.display = 'block';
  if (emailTab) emailTab.style.display = 'none';
  if (wechatTab) wechatTab.style.display = 'none';
  
  // 激活按钮状态
  const phoneTabBtn = document.getElementById('phone-tab-btn');
  const emailTabBtn = document.getElementById('email-tab-btn');
  const wechatTabBtn = document.getElementById('wechat-tab-btn');
  
  if (phoneTabBtn) phoneTabBtn.classList.add('active');
  if (emailTabBtn) emailTabBtn.classList.remove('active');
  if (wechatTabBtn) wechatTabBtn.classList.remove('active');
  
  alert('已切换到手机登录');
}

function switchToEmailLogin() {
  console.log('切换到邮箱登录');
  const phoneTab = document.getElementById('phone-login-form') || document.getElementById('phone-tab');
  const emailTab = document.getElementById('email-login-form') || document.getElementById('email-tab');
  const wechatTab = document.getElementById('wechat-login-form') || document.getElementById('wechat-tab');
  
  if (phoneTab) phoneTab.style.display = 'none';
  if (emailTab) emailTab.style.display = 'block';
  if (wechatTab) wechatTab.style.display = 'none';
  
  // 激活按钮状态
  const phoneTabBtn = document.getElementById('phone-tab-btn');
  const emailTabBtn = document.getElementById('email-tab-btn');
  const wechatTabBtn = document.getElementById('wechat-tab-btn');
  
  if (phoneTabBtn) phoneTabBtn.classList.remove('active');
  if (emailTabBtn) emailTabBtn.classList.add('active');
  if (wechatTabBtn) wechatTabBtn.classList.remove('active');
  
  alert('已切换到邮箱登录');
}

function switchToWechatLogin() {
  console.log('切换到微信登录');
  const phoneTab = document.getElementById('phone-login-form') || document.getElementById('phone-tab');
  const emailTab = document.getElementById('email-login-form') || document.getElementById('email-tab');
  const wechatTab = document.getElementById('wechat-login-form') || document.getElementById('wechat-tab');
  
  if (phoneTab) phoneTab.style.display = 'none';
  if (emailTab) emailTab.style.display = 'none';
  if (wechatTab) wechatTab.style.display = 'block';
  
  // 激活按钮状态
  const phoneTabBtn = document.getElementById('phone-tab-btn');
  const emailTabBtn = document.getElementById('email-tab-btn');
  const wechatTabBtn = document.getElementById('wechat-tab-btn');
  
  if (phoneTabBtn) phoneTabBtn.classList.remove('active');
  if (emailTabBtn) emailTabBtn.classList.remove('active');
  if (wechatTabBtn) wechatTabBtn.classList.add('active');
  
  alert('已切换到微信登录');
}

// 注册方式切换函数
function switchToPhoneRegister() {
  console.log('切换到手机注册');
  const phoneRegTab = document.getElementById('phone-register-form') || document.getElementById('register-phone-tab');
  const emailRegTab = document.getElementById('email-register-form') || document.getElementById('register-email-tab');
  
  if (phoneRegTab) phoneRegTab.style.display = 'block';
  if (emailRegTab) emailRegTab.style.display = 'none';
  
  // 激活按钮状态
  const registerPhoneTabBtn = document.getElementById('register-phone-tab-btn');
  const registerEmailTabBtn = document.getElementById('register-email-tab-btn');
  
  if (registerPhoneTabBtn) registerPhoneTabBtn.classList.add('active');
  if (registerEmailTabBtn) registerEmailTabBtn.classList.remove('active');
  
  alert('已切换到手机注册');
}

function switchToEmailRegister() {
  console.log('切换到邮箱注册');
  const phoneRegTab = document.getElementById('phone-register-form') || document.getElementById('register-phone-tab');
  const emailRegTab = document.getElementById('email-register-form') || document.getElementById('register-email-tab');
  
  if (phoneRegTab) phoneRegTab.style.display = 'none';
  if (emailRegTab) emailRegTab.style.display = 'block';
  
  // 激活按钮状态
  const registerPhoneTabBtn = document.getElementById('register-phone-tab-btn');
  const registerEmailTabBtn = document.getElementById('register-email-tab-btn');
  
  if (registerPhoneTabBtn) registerPhoneTabBtn.classList.remove('active');
  if (registerEmailTabBtn) registerEmailTabBtn.classList.add('active');
  
  alert('已切换到邮箱注册');
}

// 验证码功能函数
function getLoginSmsCode() {
  console.log('获取登录验证码');
  alert('正在发送登录验证码...');
}

function getRegisterSmsCode() {
  console.log('获取注册验证码');
  alert('正在发送注册验证码...');
}

// 登录功能函数
function doPhoneLogin() {
  console.log('执行手机登录');
  alert('手机登录功能执行中...');
}

function doEmailLogin() {
  console.log('执行邮箱登录');
  alert('邮箱登录功能执行中...');
}

function doWechatLogin() {
  console.log('执行微信登录');
  alert('微信登录功能执行中...');
}

// 注册功能函数
function doPhoneRegister() {
  console.log('执行手机注册');
  alert('手机注册功能执行中...');
}

function doEmailRegister() {
  console.log('执行邮箱注册');
  alert('邮箱注册功能执行中...');
}

// 页面加载完成后执行初始化
window.onload = function() {
  console.log('页面加载完成');
  
  // 设置初始显示状态
  const loginForm = document.getElementById('login-form-container');
  const registerForm = document.getElementById('register-form-container');
  const phoneLogin = document.getElementById('phone-login-form') || document.getElementById('phone-tab');
  const emailLogin = document.getElementById('email-login-form') || document.getElementById('email-tab');
  const wechatLogin = document.getElementById('wechat-login-form') || document.getElementById('wechat-tab');
  
  if (loginForm) loginForm.style.display = 'block';
  if (registerForm) registerForm.style.display = 'none';
  if (phoneLogin) phoneLogin.style.display = 'block';
  if (emailLogin) emailLogin.style.display = 'none';
  if (wechatLogin) wechatLogin.style.display = 'none';
  
  // 设置按钮点击事件
  setupButtonActions();
  
  console.log('登录功能初始化完成');
};

// 添加全局的错误信息显示函数
function showError(message) {
  const errorEl = document.getElementById('error-message');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
  console.error(message);
}