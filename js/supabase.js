/**
 * Supabase 配置和工具函数
 * 提供认证和数据操作功能
 * 优先使用Supabase，降级到本地存储
 */

// 全局变量
let supabaseClient = null;
let usingLocalStorage = true;

// 尝试初始化Supabase客户端
try {
  // 尝试直接使用全局的createClient函数（如果已加载）
  if (typeof createClient === 'function') {
    // 简单的配置（不依赖导入）
    const SUPABASE_CONFIG = {
      url: 'https://default-url.supabase.co', // 占位符URL
      anonKey: 'default-anon-key' // 占位符密钥
    };
    supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    usingLocalStorage = false;
    console.log('使用全局createClient函数初始化Supabase客户端');
  } else {
    console.warn('未找到createClient函数，将使用本地存储');
  }
} catch (error) {
  console.warn('Supabase初始化失败，将使用本地存储:', error);
}
const localStorageAuth = {
  // 本地存储登录功能
  signIn(email, password) {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const user = users[email];
    
    if (user && user.password === password) {
      // 更新登录时间
      user.lastLoginAt = new Date().toISOString();
      users[email] = user;
      localStorage.setItem('users', JSON.stringify(users));
      
      // 保存当前用户
      const userData = {
        id: user.id,
        email: user.email,
        displayName: user.name || email.split('@')[0],
        loginType: user.loginType || 'email'
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      return { success: true, user: userData };
    }
    
    return { success: false, error: '邮箱或密码错误' };
  },
  
  // 本地存储注册功能
  signUp(email, password, userData = {}) {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    if (users[email]) {
      return { success: false, error: 'User already registered' };
    }
    
    // 创建新用户
    const newUser = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      email,
      password,
      name: userData.name || email.split('@')[0],
      loginType: 'email',
      createdAt: new Date().toISOString()
    };
    
    users[email] = newUser;
    localStorage.setItem('users', JSON.stringify(users));
    
    // 保存当前用户
    const userDataToSave = {
      id: newUser.id,
      email: newUser.email,
      displayName: newUser.name
    };
    localStorage.setItem('currentUser', JSON.stringify(userDataToSave));
    
    return { success: true, user: userDataToSave };
  },
  
  // 退出登录
  signOut() {
    localStorage.removeItem('currentUser');
    return { success: true };
  },
  
  // 获取当前用户
  getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  },
  
  // 手机登录（模拟）
  signInWithPhone(phone, code) {
    // 模拟手机登录成功
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const phoneUsers = Object.values(users).filter(user => user.phone === phone);
    
    if (phoneUsers.length > 0) {
      const user = phoneUsers[0];
      user.lastLoginAt = new Date().toISOString();
      user.loginType = 'phone';
      users[user.email] = user;
      localStorage.setItem('users', JSON.stringify(users));
      
      const userData = {
        id: user.id,
        phone: user.phone,
        displayName: user.name || phone,
        loginType: 'phone'
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } else {
      // 创建新用户
      const newUser = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        phone,
        email: phone + '@phone.user',
        password: '',
        name: phone,
        loginType: 'phone',
        createdAt: new Date().toISOString()
      };
      
      users[newUser.email] = newUser;
      localStorage.setItem('users', JSON.stringify(users));
      
      const userDataToSave = {
        id: newUser.id,
        phone: newUser.phone,
        displayName: newUser.name
      };
      localStorage.setItem('currentUser', JSON.stringify(userDataToSave));
      
      return { success: true, user: userDataToSave };
    }
  },
  
  // 微信登录（模拟）
  signInWithWechat() {
    // 模拟微信登录成功
    const wechatId = 'wx_' + Date.now();
    const userData = {
      id: 'user_' + wechatId,
      displayName: '微信用户' + wechatId.substr(-4),
      loginType: 'wechat',
      wechatId
    };
    
    localStorage.setItem('currentUser', JSON.stringify(userData));
    return { success: true, user: userData };
  }
};

// 本地存储设计功能
const localStorageDesigns = {
  // 获取用户设计列表
  getUserDesigns(userId) {
    const designs = JSON.parse(localStorage.getItem('designs')) || [];
    return designs.filter(design => design.userId === userId);
  },
  
  // 创建设计
  createDesign(designData) {
    const designs = JSON.parse(localStorage.getItem('designs')) || [];
    const newDesign = {
      ...designData,
      id: 'design_' + Date.now(),
      created_at: new Date().toISOString()
    };
    designs.push(newDesign);
    localStorage.setItem('designs', JSON.stringify(designs));
    return newDesign;
  },
  
  // 更新设计
  updateDesign(designId, updates) {
    const designs = JSON.parse(localStorage.getItem('designs')) || [];
    const index = designs.findIndex(design => design.id === designId);
    
    if (index !== -1) {
      designs[index] = {
        ...designs[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('designs', JSON.stringify(designs));
      return designs[index];
    }
    return null;
  },
  
  // 删除设计
  deleteDesign(designId) {
    const designs = JSON.parse(localStorage.getItem('designs')) || [];
    const filteredDesigns = designs.filter(design => design.id !== designId);
    localStorage.setItem('designs', JSON.stringify(filteredDesigns));
    return true;
  }
};

// 本地存储订单功能
const localStorageOrders = {
  // 创建订单
  createOrder(orderData) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const newOrder = {
      ...orderData,
      id: 'order_' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    return newOrder;
  },
  
  // 获取用户订单
  getUserOrders(userId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    return orders.filter(order => order.userId === userId).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }
};

// 全局对象
document.supabase = {
  auth: {
    // 用户登录
    async signIn(email, password) {
      try {
        if (!usingLocalStorage && supabaseClient) {
          // 使用Supabase登录
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
          });
          
          if (error) {
            console.error('Supabase登录失败:', error.message);
            // 降级到本地存储
            return localStorageAuth.signIn(email, password);
          }
          
          return { success: true, user: {
            id: data.user.id,
            email: data.user.email,
            displayName: data.user.user_metadata?.name || data.user.email.split('@')[0],
            loginType: 'email'
          }};
        } else {
          // 使用本地存储认证
          return localStorageAuth.signIn(email, password);
        }
      } catch (error) {
        console.error('登录失败:', error);
        // 降级到本地存储
        return localStorageAuth.signIn(email, password);
      }
    },

    // 用户注册
    async signUp(email, password, userData = {}) {
      try {
        if (!usingLocalStorage && supabaseClient) {
          // 使用Supabase注册
          const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
              data: userData
            }
          });
          
          if (error) {
            console.error('Supabase注册失败:', error.message);
            // 降级到本地存储
            return localStorageAuth.signUp(email, password, userData);
          }
          
          return { 
            success: true, 
            user: {
              id: data.user.id,
              email: data.user.email,
              displayName: data.user.user_metadata?.name || data.user.email.split('@')[0],
              loginType: 'email'
            },
            message: '注册成功，请查收邮箱验证邮件'
          };
        } else {
          // 使用本地存储注册
          return localStorageAuth.signUp(email, password, userData);
        }
      } catch (error) {
        console.error('注册失败:', error);
        // 降级到本地存储
        return localStorageAuth.signUp(email, password, userData);
      }
    },
    
    // 退出登录
    async signOut() {
      try {
        if (!usingLocalStorage && supabaseClient) {
          const { error } = await supabaseClient.auth.signOut();
          if (error) {
            console.error('Supabase退出登录失败:', error);
          }
        }
        // 同时清理本地存储
        return localStorageAuth.signOut();
      } catch (error) {
        console.error('退出登录失败:', error);
        return { success: false, error: '退出登录失败' };
      }
    },
    
    // 获取当前用户
    async getCurrentUser() {
      try {
        if (!usingLocalStorage && supabaseClient) {
          const { data: { user } } = await supabaseClient.auth.getUser();
          if (user) {
            return {
              id: user.id,
              email: user.email,
              displayName: user.user_metadata?.name || user.email.split('@')[0],
              loginType: 'email'
            };
          }
        }
        // 降级到本地存储
        return localStorageAuth.getCurrentUser();
      } catch (error) {
        console.error('获取用户失败:', error);
        return localStorageAuth.getCurrentUser();
      }
    },
    
    // 手机登录（支持验证码验证）
    async signInWithPhone(phone, code) {
      try {
        // 先验证验证码
        const verifyResult = await this.verifyPhoneCode(phone, code);
        if (!verifyResult.success) {
          return verifyResult;
        }
        
        // 验证码验证成功后进行登录
        return localStorageAuth.signInWithPhone(phone, code);
      } catch (error) {
        console.error('手机登录失败:', error);
        return { success: false, error: '手机登录失败' };
      }
    },
    
    // 模拟发送手机验证码（开发环境）
    async sendPhoneVerification(phone) {
      try {
        // 生成随机6位验证码
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 存储验证码与手机号的关联（开发环境使用localStorage）
        const verificationData = JSON.parse(localStorage.getItem('phoneVerifications') || '{}');
        verificationData[phone] = {
          code: verificationCode,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5分钟过期
        };
        localStorage.setItem('phoneVerifications', JSON.stringify(verificationData));
        
        // 在控制台显示验证码（仅开发环境）
        console.log('发送验证码到手机:', phone);
        console.log('【开发环境】验证码:', verificationCode, '(5分钟内有效)');
        
        return { 
          success: true, 
          message: '验证码已发送，请注意查收',
          code: verificationCode // 开发环境下返回验证码，实际生产环境不应该返回
        };
      } catch (error) {
        console.error('发送验证码失败:', error);
        return { success: false, error: '发送验证码失败，请稍后重试' };
      }
    },
    
    // 验证手机验证码
    async verifyPhoneCode(phone, code) {
      try {
        const verificationData = JSON.parse(localStorage.getItem('phoneVerifications') || '{}');
        const storedData = verificationData[phone];
        
        if (!storedData) {
          return { success: false, error: '未找到验证码记录' };
        }
        
        const now = new Date();
        const expiresAt = new Date(storedData.expiresAt);
        
        if (now > expiresAt) {
          // 验证码已过期
          delete verificationData[phone];
          localStorage.setItem('phoneVerifications', JSON.stringify(verificationData));
          return { success: false, error: '验证码已过期，请重新获取' };
        }
        
        if (storedData.code !== code) {
          return { success: false, error: '验证码错误' };
        }
        
        // 验证成功，清除验证码记录
        delete verificationData[phone];
        localStorage.setItem('phoneVerifications', JSON.stringify(verificationData));
        
        return { success: true, message: '验证码验证成功' };
      } catch (error) {
        console.error('验证码验证失败:', error);
        return { success: false, error: '验证码验证失败' };
      }
    }
  },
  
  designs: {
    // 获取用户设计列表
    getUserDesigns(userId) {
      return localStorageDesigns.getUserDesigns(userId);
    },
    
    // 创建设计
    createDesign(designData) {
      return localStorageDesigns.createDesign(designData);
    },
    
    // 更新设计
    updateDesign(designId, updates) {
      return localStorageDesigns.updateDesign(designId, updates);
    },
    
    // 删除设计
    deleteDesign(designId) {
      return localStorageDesigns.deleteDesign(designId);
    }
  },
  
  orders: {
    // 创建订单
    createOrder(orderData) {
      return localStorageOrders.createOrder(orderData);
    },
    
    // 获取用户订单
    getUserOrders(userId) {
      return localStorageOrders.getUserOrders(userId);
    }
  },
  
  // 初始化函数
  async init() {
    try {
      // 检查是否已有登录用户
      const user = await this.auth.getCurrentUser();
      if (user) {
        console.log('检测到已登录用户:', user.displayName);
      }
      
      console.log(`Supabase初始化成功，使用${usingLocalStorage ? '本地存储' : 'Supabase服务'}`);
      return true;
    } catch (error) {
      console.error('初始化失败:', error);
      return false;
    }
  }
};

// 初始化
if (window && typeof window !== 'undefined') {
  // 确保不会与其他代码冲突
  window.Supabase = document.supabase;
}