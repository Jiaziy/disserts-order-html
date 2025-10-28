/**
 * Supabase 配置和工具函数
 * 提供认证和数据操作功能
 * 使用本地存储实现
 */

// 使用本地存储作为默认认证方式
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
        // 使用本地存储认证
        return localStorageAuth.signIn(email, password);
      } catch (error) {
        console.error('登录失败:', error);
        return { success: false, error: '登录失败，请稍后重试' };
      }
    },

    // 用户注册
    async signUp(email, password, userData = {}) {
      try {
        // 使用本地存储注册
        return localStorageAuth.signUp(email, password, userData);
      } catch (error) {
        console.error('注册失败:', error);
        return { success: false, error: '注册失败，请稍后重试' };
      }
    },
    
    // 退出登录
    signOut() {
      return localStorageAuth.signOut();
    },
    
    // 获取当前用户
    getCurrentUser() {
      return localStorageAuth.getCurrentUser();
    },
    
    // 手机登录
    signInWithPhone(phone, code) {
      return localStorageAuth.signInWithPhone(phone, code);
    },
    
    // 微信登录
    signInWithWechat() {
      return localStorageAuth.signInWithWechat();
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
    console.log('Supabase 本地存储初始化成功');
    return true;
  }
};

// 初始化
if (window && typeof window !== 'undefined') {
  // 确保不会与其他代码冲突
  window.Supabase = document.supabase;
}