/**
 * Supabase 配置和工具函数
 * 用于连接到 Supabase 数据库并提供数据操作接口
 */

// 导入 Supabase 配置
import SUPABASE_CONFIG from './supabase-config.js';

// 从配置中提取所需参数
const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;
const ENABLE_DEBUG = SUPABASE_CONFIG.debug;
const TABLES = SUPABASE_CONFIG.tables || {
    users: 'users',
    designs: 'designs',
    orders: 'orders'
};
const FALLBACK_TO_LOCAL_STORAGE = SUPABASE_CONFIG.fallbackToLocalStorage !== false;

// 初始化 Supabase 客户端
const { createClient } = window.supabase || (await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'));
let supabaseClient = null;

/**
 * 初始化 Supabase 客户端
 */
export async function initSupabase() {
  try {
    // 动态加载 Supabase 客户端库
    if (!window.supabase) {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      window.supabase = { createClient };
    }
    
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase 客户端初始化成功');
    return supabaseClient;
  } catch (error) {
    console.error('Supabase 初始化失败:', error);
    // 降级到 localStorage 模式
    if (FALLBACK_TO_LOCAL_STORAGE) {
      return null;
    }
    throw error;
  }
}

/**
 * 获取 Supabase 客户端实例
 */
export function getSupabase() {
  if (!supabaseClient) {
    console.warn('Supabase 客户端未初始化，返回 null');
  }
  return supabaseClient;
}

/**
 * 用户认证相关函数
 */
export const auth = {
  /**
   * 用户登录
   */
  async signIn(email, password) {
    if (!supabaseClient && FALLBACK_TO_LOCAL_STORAGE) {
      console.warn('使用 localStorage 模式登录');
      // 降级到 localStorage 登录
      return localStorageAuth.signIn(email, password);
    }
    
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // 保存用户信息到本地存储
      const userData = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.name || data.user.email.split('@')[0],
        avatar: data.user.user_metadata?.avatar_url || ''
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // 同步用户到 users 表
      try {
        await supabaseClient
          .from(TABLES.users)
          .upsert({
            id: data.user.id,
            email: data.user.email,
            name: userData.displayName,
            avatar_url: userData.avatar,
            last_login_at: new Date().toISOString()
          });
      } catch (syncError) {
        console.error('同步用户信息失败:', syncError);
      }
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('登录失败:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 用户注册
   */
  async signUp(email, password, userData) {
    if (!supabaseClient && FALLBACK_TO_LOCAL_STORAGE) {
      console.warn('使用 localStorage 模式注册');
      // 降级到 localStorage 注册
      return localStorageAuth.signUp(email, password, userData);
    }
    
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) throw error;
      
      // 保存用户信息到本地存储
      const userDataToSave = {
        id: data.user.id,
        email: data.user.email,
        displayName: userData?.name || data.user.email.split('@')[0]
      };
      localStorage.setItem('currentUser', JSON.stringify(userDataToSave));
      
      // 创建用户记录
      try {
        await supabaseClient
          .from(TABLES.users)
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: userDataToSave.displayName,
            created_at: new Date().toISOString()
          });
      } catch (syncError) {
        console.error('创建用户记录失败:', syncError);
      }
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('注册失败:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 用户登出
   */
  async signOut() {
    if (!supabaseClient && FALLBACK_TO_LOCAL_STORAGE) {
      console.warn('使用 localStorage 模式登出');
      // 降级到 localStorage 登出
      return localStorageAuth.signOut();
    }
    
    try {
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('登出失败:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 获取当前用户
   */
  async getCurrentUser() {
    if (!supabaseClient && FALLBACK_TO_LOCAL_STORAGE) {
      console.warn('使用 localStorage 获取用户');
      // 降级到 localStorage 获取用户
      return localStorageAuth.getCurrentUser();
    }
    
    try {
      const { data, error } = await supabaseClient.auth.getSession();
      
      if (error || !data.session) {
        return null;
      }
      
      return data.session.user;
    } catch (error) {
      console.error('获取用户失败:', error);
      return null;
    }
  }
};

/**
 * 设计相关函数
 */
export const designs = {
  /**
   * 获取用户的所有设计
   */
  async getUserDesigns(userId) {
    if (!supabaseClient && FALLBACK_TO_LOCAL_STORAGE) {
      console.warn('使用 localStorage 获取设计');
      // 降级到 localStorage 获取设计
      return localStorageDesigns.getUserDesigns(userId);
    }
    
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.designs)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('获取设计失败:', error);
      return [];
    }
  },

  /**
   * 创建新设计
   */
  async createDesign(designData) {
    if (!supabaseClient && FALLBACK_TO_LOCAL_STORAGE) {
      console.warn('使用 localStorage 创建设计');
      // 降级到 localStorage 创建设计
      return localStorageDesigns.createDesign(designData);
    }
    
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.designs)
        .insert([{
          ...designData,
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('创建设计失败:', error);
      return null;
    }
  },

  /**
   * 更新设计
   */
  async updateDesign(designId, updates) {
    if (!supabaseClient && FALLBACK_TO_LOCAL_STORAGE) {
      console.warn('使用 localStorage 更新设计');
      // 降级到 localStorage 更新设计
      return localStorageDesigns.updateDesign(designId, updates);
    }
    
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.designs)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', designId)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('更新设计失败:', error);
      return null;
    }
  },

  /**
   * 删除设计
   */
  async deleteDesign(designId) {
    if (!supabaseClient && FALLBACK_TO_LOCAL_STORAGE) {
      console.warn('使用 localStorage 删除设计');
      // 降级到 localStorage 删除设计
      return localStorageDesigns.deleteDesign(designId);
    }
    
    try {
      const { error } = await supabaseClient
        .from(TABLES.designs)
        .delete()
        .eq('id', designId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('删除设计失败:', error);
      return false;
    }
  }
};

/**
 * 订单相关函数
 */
export const orders = {
  /**
   * 获取用户的所有订单
   */
  async getUserOrders(userId) {
    if (!supabaseClient && FALLBACK_TO_LOCAL_STORAGE) {
      console.warn('使用 localStorage 获取订单');
      // 降级到 localStorage 获取订单
      const orders = JSON.parse(localStorage.getItem('orders')) || [];
      return orders.filter(order => order.userId === userId);
    }
    
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.orders)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('获取订单失败:', error);
      return [];
    }
  },

  /**
   * 创建新订单
   */
  async createOrder(orderData) {
    if (!supabaseClient && FALLBACK_TO_LOCAL_STORAGE) {
      console.warn('使用 localStorage 创建订单');
      // 降级到 localStorage 创建订单
      const orders = JSON.parse(localStorage.getItem('orders')) || [];
      const newOrder = {
        ...orderData,
        id: 'order_' + Date.now(),
        userId: orderData.userId || 'anonymous',
        createTime: new Date().toISOString(),
        status: 'pending'
      };
      orders.push(newOrder);
      localStorage.setItem('orders', JSON.stringify(orders));
      return newOrder;
    }
    
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.orders)
        .insert([{
          ...orderData,
          created_at: new Date().toISOString(),
          status: 'pending'
        }])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('创建订单失败:', error);
      return null;
    }
  }
};

// 调试日志
function debugLog(message, data = null) {
    if (ENABLE_DEBUG) {
        console.log(`[Supabase] ${message}`, data || '');
    }
}

// 添加重试机制函数
async function withRetry(fn, maxAttempts = SUPABASE_CONFIG.retry?.maxAttempts || 3, delay = SUPABASE_CONFIG.retry?.delay || 1000) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            return await fn();
        } catch (error) {
            attempts++;
            debugLog(`尝试 ${attempts}/${maxAttempts} 失败，${delay}ms 后重试`, error);
            
            if (attempts >= maxAttempts) {
                throw error;
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// 降级到 localStorage 的备用实现
const localStorageAuth = {
  signIn(email, password) {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const user = users[email];
    
    if (user && user.password === password) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true, user };
    }
    
    return { success: false, error: '邮箱或密码错误' };
  },
  
  signUp(email, password, userData) {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    if (users[email]) {
      return { success: false, error: '该邮箱已被注册' };
    }
    
    const user = {
      email,
      password,
      ...userData,
      id: 'user_' + Date.now()
    };
    
    users[email] = user;
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return { success: true, user };
  },
  
  signOut() {
    localStorage.removeItem('currentUser');
    return { success: true };
  },
  
  getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  }
};

const localStorageDesigns = {
  getUserDesigns(userId) {
    const designs = JSON.parse(localStorage.getItem('designs')) || [];
    return designs.filter(design => design.userId === userId);
  },
  
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
  
  updateDesign(designId, updates) {
    const designs = JSON.parse(localStorage.getItem('designs')) || [];
    const index = designs.findIndex(d => d.id === designId);
    
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
  
  deleteDesign(designId) {
    let designs = JSON.parse(localStorage.getItem('designs')) || [];
    designs = designs.filter(d => d.id !== designId);
    localStorage.setItem('designs', JSON.stringify(designs));
    return true;
  }
};

// 自动初始化 Supabase
initSupabase();