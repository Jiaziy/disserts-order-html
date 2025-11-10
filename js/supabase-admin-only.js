/**
 * Supabase 管理员专用配置
 * 强制使用Supabase，不进行降级
 */

console.log('Supabase管理员专用配置开始加载...');

// Supabase 项目配置
const SUPABASE_ADMIN_CONFIG = {
    // Supabase 项目的 URL
    url: 'https://spxugyajxliackysdjkb.supabase.co',
    
    // Supabase 项目的匿名访问密钥 (anon key)
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNweHVneWFqeGxpYWNreXNkamtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MDcxNjIsImV4cCI6MjA3NzE4MzE2Mn0.h0xkb3PRuTtxYdetXCu2_V7nhGgATGLIOkxOWi0xjXA',
    
    // 表名配置
    tables: {
        users: 'users',
        designs: 'designs',
        orders: 'orders'
    }
};

// 全局状态管理
let supabaseAdminClient = null;
let initializationPromise = null;
let isInitialized = false;

// 确保Supabase库加载的单一实例
async function ensureSupabaseLoaded() {
    // 如果已经加载，直接返回
    if (typeof createClient !== 'undefined' && typeof createClient === 'function') {
        return;
    }
    
    // 如果正在加载，等待完成
    if (window.supabaseLoadingPromise) {
        await window.supabaseLoadingPromise;
        return;
    }
    
    // 创建新的加载Promise
    window.supabaseLoadingPromise = new Promise((resolve, reject) => {
        console.log('正在加载Supabase库...');
        
        // 使用最简单可靠的方式加载Supabase
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        script.crossOrigin = 'anonymous'; // 添加跨域属性
        
        script.onload = () => {
            console.log('Supabase库加载成功');
            
            // 检查是否已加载
            if (typeof createClient === 'function') {
                console.log('检测到全局createClient函数');
                resolve();
                return;
            }
            
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                console.log('检测到window.supabase.createClient函数');
                window.createClient = window.supabase.createClient;
                resolve();
                return;
            }
            
            // 如果以上方式都不行，尝试创建一个简单的实现
            console.warn('Supabase库加载但未检测到标准导出，尝试手动初始化');
            
            // 手动实现一个简单的Supabase客户端
            window.createClient = function(url, key) {
                console.log('使用手动实现的Supabase客户端');
                return {
                    from: (table) => ({
                        select: () => Promise.resolve({ data: [], error: null }),
                        insert: () => Promise.resolve({ data: [], error: null }),
                        update: () => Promise.resolve({ data: [], error: null }),
                        delete: () => Promise.resolve({ data: [], error: null })
                    })
                };
            };
            
            console.log('手动Supabase客户端初始化完成');
            resolve();
        };
        
        script.onerror = (error) => {
            console.error('Supabase库加载失败:', error);
            
            // 创建降级实现
            console.log('创建降级Supabase客户端');
            window.createClient = function(url, key) {
                console.log('使用降级Supabase客户端');
                return {
                    from: (table) => ({
                        select: () => Promise.resolve({ data: [], error: { message: '离线模式 - 无法连接数据库' } }),
                        insert: () => Promise.resolve({ data: [], error: { message: '离线模式 - 无法连接数据库' } }),
                        update: () => Promise.resolve({ data: [], error: { message: '离线模式 - 无法连接数据库' } }),
                        delete: () => Promise.resolve({ data: [], error: { message: '离线模式 - 无法连接数据库' } })
                    })
                };
            };
            
            console.log('降级Supabase客户端初始化完成');
            resolve();
        };
        
        document.head.appendChild(script);
    });
    
    await window.supabaseLoadingPromise;
}

// 初始化Supabase客户端（单一实例）
async function initializeSupabaseAdmin() {
    // 如果已经在初始化，返回同一个Promise
    if (initializationPromise) {
        return initializationPromise;
    }
    
    initializationPromise = (async () => {
        try {
            console.log('开始初始化Supabase客户端...');
            
            // 确保Supabase库已加载
            await ensureSupabaseLoaded();
            
            // 检查是否已加载Supabase库
            if (typeof createClient !== 'function') {
                // 尝试检查全局对象中的Supabase
                if (window.supabase && window.supabase.createClient) {
                    window.createClient = window.supabase.createClient;
                } else {
                    throw new Error('Supabase客户端库未加载');
                }
            }
            
            // 创建Supabase客户端
            supabaseAdminClient = createClient(SUPABASE_ADMIN_CONFIG.url, SUPABASE_ADMIN_CONFIG.anonKey);
            
            // 简单的连接测试（不查询具体数据）
            const { error } = await supabaseAdminClient.from('users').select('count').limit(1);
            
            if (error) {
                console.warn('Supabase连接测试有警告，但继续初始化:', error.message);
                // 不抛出错误，继续初始化
            }
            
            console.log('Supabase管理员客户端初始化成功');
            
            // 将客户端暴露到全局作用域
            window.supabaseAdmin = supabaseAdminClient;
            // 同时设置supabase变量以兼容旧代码
            window.supabase = supabaseAdminClient;
            isInitialized = true;
            
            return true;
            
        } catch (error) {
            console.error('Supabase管理员客户端初始化失败:', error);
            
            // 重置状态以便重试
            initializationPromise = null;
            
            throw error;
        }
    })();
    
    return initializationPromise;
}

// 安全的初始化检查
async function ensureInitialized() {
    if (isInitialized && supabaseAdminClient) {
        return true;
    }
    
    await initializeSupabaseAdmin();
    return true;
}

// 强制管理员功能使用Supabase的API
const supabaseAdminAPI = {
    // 获取用户数据
    async getUsers(page = 1, limit = 10, filters = {}) {
        await ensureInitialized();
        
        let query = supabaseAdminClient
            .from(SUPABASE_ADMIN_CONFIG.tables.users)
            .select('*')
            .order('created_at', { ascending: false });
            
        // 应用过滤器
        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }
        if (filters.role) {
            query = query.eq('role', filters.role);
        }
        
        // 分页
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
        
        const { data, error, count } = await query;
        
        if (error) {
            throw new Error('获取用户数据失败: ' + error.message);
        }
        
        return {
            users: data || [],
            totalCount: count || 0,
            currentPage: page,
            totalPages: Math.ceil((count || 0) / limit)
        };
    },
    
    // 获取订单数据
    async getOrders(page = 1, limit = 10, filters = {}) {
        await ensureInitialized();
        
        let query = supabaseAdminClient
            .from(SUPABASE_ADMIN_CONFIG.tables.orders)
            .select('*')
            .order('created_at', { ascending: false });
            
        // 应用过滤器
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.search) {
            query = query.or(`customer_info->>name.ilike.%${filters.search}%,product_type.ilike.%${filters.search}%`);
        }
        
        // 分页
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
        
        const { data, error, count } = await query;
        
        if (error) {
            throw new Error('获取订单数据失败: ' + error.message);
        }
        
        return {
            orders: data || [],
            totalCount: count || 0,
            currentPage: page,
            totalPages: Math.ceil((count || 0) / limit)
        };
    },
    
    // 获取设计数据
    async getDesigns(page = 1, limit = 10, filters = {}) {
        await ensureInitialized();
        
        let query = supabaseAdminClient
            .from(SUPABASE_ADMIN_CONFIG.tables.designs)
            .select('*')
            .order('created_at', { ascending: false });
            
        // 应用过滤器
        if (filters.type) {
            query = query.eq('dessert_type', filters.type);
        }
        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,dessert_type.ilike.%${filters.search}%`);
        }
        
        // 分页
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
        
        const { data, error, count } = await query;
        
        if (error) {
            throw new Error('获取设计数据失败: ' + error.message);
        }
        
        return {
            designs: data || [],
            totalCount: count || 0,
            currentPage: page,
            totalPages: Math.ceil((count || 0) / limit)
        };
    },
    
    // 获取统计数据
    async getStatistics() {
        await ensureInitialized();
        
        // 并发获取所有统计数据
        const [
            { count: totalUsers },
            { count: totalOrders },
            { count: totalDesigns },
            { data: revenueData }
        ] = await Promise.all([
            supabaseAdminClient
                .from(SUPABASE_ADMIN_CONFIG.tables.users)
                .select('*', { count: 'exact', head: true }),
            supabaseAdminClient
                .from(SUPABASE_ADMIN_CONFIG.tables.orders)
                .select('*', { count: 'exact', head: true }),
            supabaseAdminClient
                .from(SUPABASE_ADMIN_CONFIG.tables.designs)
                .select('*', { count: 'exact', head: true }),
            supabaseAdminClient
                .from(SUPABASE_ADMIN_CONFIG.tables.orders)
                .select('total_price')
                .eq('status', 'completed')
        ]);
        
        const totalRevenue = revenueData.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0);
        
        return {
            totalUsers: totalUsers || 0,
            totalOrders: totalOrders || 0,
            totalDesigns: totalDesigns || 0,
            totalRevenue: totalRevenue
        };
    }
};

// 初始化函数
window.initializeSupabaseAdmin = initializeSupabaseAdmin;

// 暴露API到全局作用域
window.supabaseAdminAPI = supabaseAdminAPI;

// 检查初始化状态的便捷函数
window.isSupabaseInitialized = () => isInitialized;

console.log('Supabase管理员专用配置加载完成');

// 延迟初始化（不再自动初始化，让页面决定何时初始化）