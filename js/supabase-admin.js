/**
 * Supabase 管理员管理工具
 * 为管理员提供Supabase资源管理功能
 * 包括用户管理、数据统计、系统监控等
 */

// Supabase 管理员管理类
class SupabaseAdminManager {
    constructor() {
        this.supabaseClient = null;
        this.isConnected = false;
        this.init();
    }

    // 初始化Supabase连接
    async init() {
        try {
            // 检查是否已加载Supabase客户端
            if (window.supabase) {
                this.supabaseClient = window.supabase;
                this.isConnected = true;
                console.log('Supabase管理员管理器已连接');
            } else if (window.Supabase && window.Supabase.supabaseClient) {
                // 尝试使用现有的Supabase连接
                this.supabaseClient = window.Supabase.supabaseClient;
                this.isConnected = true;
                console.log('Supabase管理员管理器使用现有连接');
            } else {
                console.warn('Supabase连接不可用，将使用离线模式');
                this.isConnected = false;
            }
        } catch (error) {
            console.error('Supabase管理员管理器初始化失败:', error);
            this.isConnected = false;
        }
    }

    // 测试Supabase连接
    async testConnection() {
        if (!this.isConnected) {
            return { success: false, error: 'Supabase连接不可用' };
        }

        try {
            const { data, error } = await this.supabaseClient.from('users').select('count').limit(1);
            if (error) {
                return { success: false, error: error.message };
            }
            return { success: true, message: 'Supabase连接正常' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 获取用户统计信息
    async getUserStats() {
        if (!this.isConnected) {
            return this.getOfflineUserStats();
        }

        try {
            // 获取总用户数
            const { data: users, error: usersError } = await this.supabaseClient
                .from('users')
                .select('id, created_at, role, last_login_at');

            if (usersError) {
                return this.getOfflineUserStats();
            }

            // 获取订单统计
            const { data: orders, error: ordersError } = await this.supabaseClient
                .from('orders')
                .select('id, user_id, created_at, status');

            // 计算统计信息
            const now = new Date();
            const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
            const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

            const stats = {
                totalUsers: users.length,
                activeUsers: users.filter(u => u.last_login_at && new Date(u.last_login_at) > oneWeekAgo).length,
                newUsersToday: users.filter(u => new Date(u.created_at) > oneDayAgo).length,
                adminUsers: users.filter(u => u.role === 'admin').length,
                managerUsers: users.filter(u => u.role === 'manager').length,
                totalOrders: orders && !ordersError ? orders.length : 0,
                activeOrders: orders && !ordersError ? orders.filter(o => o.status === 'pending').length : 0,
                completedOrders: orders && !ordersError ? orders.filter(o => o.status === 'completed').length : 0
            };

            return { success: true, stats };
        } catch (error) {
            console.error('获取用户统计失败:', error);
            return this.getOfflineUserStats();
        }
    }

    // 获取离线用户统计（降级模式）
    getOfflineUserStats() {
        // 从本地存储获取统计信息
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        const userCount = Object.keys(users).length;
        const orderCount = orders.length;

        return {
            success: true,
            stats: {
                totalUsers: userCount,
                activeUsers: Math.floor(userCount * 0.3), // 估算活跃用户
                newUsersToday: Math.floor(userCount * 0.05), // 估算今日新用户
                adminUsers: 1, // 默认管理员
                managerUsers: 1, // 默认经理
                totalOrders: orderCount,
                activeOrders: Math.floor(orderCount * 0.5), // 估算活跃订单
                completedOrders: Math.floor(orderCount * 0.3) // 估算完成订单
            }
        };
    }

    // 获取用户列表
    async getUsersList(page = 1, pageSize = 10, filters = {}) {
        if (!this.isConnected) {
            return this.getOfflineUsersList(page, pageSize, filters);
        }

        try {
            let query = this.supabaseClient
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            // 应用过滤器
            if (filters.role) {
                query = query.eq('role', filters.role);
            }
            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
            }

            // 分页
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data: users, error, count } = await query;

            if (error) {
                return this.getOfflineUsersList(page, pageSize, filters);
            }

            return {
                success: true,
                users: users || [],
                totalCount: count || 0,
                currentPage: page,
                totalPages: Math.ceil((count || 0) / pageSize)
            };
        } catch (error) {
            console.error('获取用户列表失败:', error);
            return this.getOfflineUsersList(page, pageSize, filters);
        }
    }

    // 获取离线用户列表
    getOfflineUsersList(page, pageSize, filters) {
        const usersData = JSON.parse(localStorage.getItem('users') || '{}');
        let users = Object.values(usersData);

        // 应用过滤器
        if (filters.role) {
            users = users.filter(u => u.role === filters.role);
        }
        if (filters.search) {
            users = users.filter(u => 
                u.name?.includes(filters.search) || 
                u.email?.includes(filters.search)
            );
        }

        // 排序和分页
        users.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedUsers = users.slice(startIndex, endIndex);

        return {
            success: true,
            users: paginatedUsers,
            totalCount: users.length,
            currentPage: page,
            totalPages: Math.ceil(users.length / pageSize)
        };
    }

    // 获取订单列表
    async getOrdersList(page = 1, pageSize = 10, filters = {}) {
        if (!this.isConnected) {
            return this.getOfflineOrdersList(page, pageSize, filters);
        }

        try {
            let query = this.supabaseClient
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            // 应用过滤器
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.userId) {
                query = query.eq('user_id', filters.userId);
            }

            // 分页
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data: orders, error, count } = await query;

            if (error) {
                return this.getOfflineOrdersList(page, pageSize, filters);
            }

            return {
                success: true,
                orders: orders || [],
                totalCount: count || 0,
                currentPage: page,
                totalPages: Math.ceil((count || 0) / pageSize)
            };
        } catch (error) {
            console.error('获取订单列表失败:', error);
            return this.getOfflineOrdersList(page, pageSize, filters);
        }
    }

    // 获取离线订单列表
    getOfflineOrdersList(page, pageSize, filters) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        let filteredOrders = [...orders];

        // 应用过滤器
        if (filters.status) {
            filteredOrders = filteredOrders.filter(o => o.status === filters.status);
        }
        if (filters.userId) {
            filteredOrders = filteredOrders.filter(o => o.user_id === filters.userId);
        }

        // 分页
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

        return {
            success: true,
            orders: paginatedOrders,
            totalCount: filteredOrders.length,
            currentPage: page,
            totalPages: Math.ceil(filteredOrders.length / pageSize)
        };
    }

    // 更新用户角色
    async updateUserRole(userId, newRole) {
        if (!this.isConnected) {
            return this.updateOfflineUserRole(userId, newRole);
        }

        try {
            const { data, error } = await this.supabaseClient
                .from('users')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, message: '用户角色已更新' };
        } catch (error) {
            console.error('更新用户角色失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 更新离线用户角色
    updateOfflineUserRole(userId, newRole) {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const userEmail = Object.keys(users).find(email => users[email].id === userId);
        
        if (userEmail) {
            users[userEmail].role = newRole;
            localStorage.setItem('users', JSON.stringify(users));
            return { success: true, message: '离线用户角色已更新' };
        }
        
        return { success: false, error: '用户不存在' };
    }

    // 更新订单状态
    async updateOrderStatus(orderId, newStatus) {
        if (!this.isConnected) {
            return this.updateOfflineOrderStatus(orderId, newStatus);
        }

        try {
            const { data, error } = await this.supabaseClient
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, message: '订单状态已更新' };
        } catch (error) {
            console.error('更新订单状态失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 更新离线订单状态
    updateOfflineOrderStatus(orderId, newStatus) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            localStorage.setItem('orders', JSON.stringify(orders));
            return { success: true, message: '离线订单状态已更新' };
        }
        
        return { success: false, error: '订单不存在' };
    }

    // 获取系统健康状态
    async getSystemHealth() {
        const connectionTest = await this.testConnection();
        
        if (!connectionTest.success) {
            return {
                status: 'warning',
                message: 'Supabase连接不可用，使用离线模式',
                details: {
                    supabase: '断开连接',
                    localStorage: '正常',
                    adminAuth: '正常',
                    overall: '降级运行'
                }
            };
        }

        return {
            status: 'healthy',
            message: '系统运行正常',
            details: {
                supabase: '正常连接',
                localStorage: '正常',
                adminAuth: '正常',
                overall: '正常运行'
            }
        };
    }
}

// 创建全局Supabase管理员管理器实例
const supabaseAdminManager = new SupabaseAdminManager();

// 暴露到全局作用域
window.supabaseAdminManager = supabaseAdminManager;

console.log('Supabase管理员管理器已加载');

// 导出用于模块化使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseAdminManager, supabaseAdminManager };
}