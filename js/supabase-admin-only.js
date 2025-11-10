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

// 创建全局Supabase客户端
let supabaseAdminClient = null;

// 初始化Supabase客户端
async function initializeSupabaseAdmin() {
    try {
        // 检查是否已加载Supabase库
        if (typeof createClient !== 'function') {
            throw new Error('Supabase客户端库未加载');
        }
        
        // 创建Supabase客户端
        supabaseAdminClient = createClient(SUPABASE_ADMIN_CONFIG.url, SUPABASE_ADMIN_CONFIG.anonKey);
        
        // 测试连接
        const { error } = await supabaseAdminClient.from('users').select('count').limit(1);
        
        if (error) {
            throw new Error('Supabase连接测试失败: ' + error.message);
        }
        
        console.log('Supabase管理员客户端初始化成功');
        
        // 将客户端暴露到全局作用域
        window.supabaseAdmin = supabaseAdminClient;
        
        return true;
        
    } catch (error) {
        console.error('Supabase管理员客户端初始化失败:', error);
        
        // 显示错误信息给用户
        if (window.showConnectionError) {
            window.showConnectionError('Supabase连接失败: ' + error.message);
        }
        
        return false;
    }
}

// 强制管理员功能使用Supabase的API
const supabaseAdminAPI = {
    // 获取用户数据
    async getUsers(page = 1, limit = 10, filters = {}) {
        if (!supabaseAdminClient) {
            throw new Error('Supabase连接不可用');
        }
        
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
        if (!supabaseAdminClient) {
            throw new Error('Supabase连接不可用');
        }
        
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
        if (!supabaseAdminClient) {
            throw new Error('Supabase连接不可用');
        }
        
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
    
    // 更新订单状态
    async updateOrderStatus(orderId, newStatus) {
        if (!supabaseAdminClient) {
            throw new Error('Supabase连接不可用');
        }
        
        const { error } = await supabaseAdminClient
            .from(SUPABASE_ADMIN_CONFIG.tables.orders)
            .update({ 
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);
            
        if (error) {
            throw new Error('更新订单状态失败: ' + error.message);
        }
        
        return { success: true };
    },
    
    // 更新用户角色
    async updateUserRole(userId, newRole) {
        if (!supabaseAdminClient) {
            throw new Error('Supabase连接不可用');
        }
        
        const { error } = await supabaseAdminClient
            .from(SUPABASE_ADMIN_CONFIG.tables.users)
            .update({ 
                role: newRole,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
        if (error) {
            throw new Error('更新用户角色失败: ' + error.message);
        }
        
        return { success: true };
    },
    
    // 获取统计数据
    async getStatistics() {
        if (!supabaseAdminClient) {
            throw new Error('Supabase连接不可用');
        }
        
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

console.log('Supabase管理员专用配置加载完成');

// 自动初始化
if (window && typeof window !== 'undefined') {
    setTimeout(() => {
        initializeSupabaseAdmin();
    }, 100);
}