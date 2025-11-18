/**
 * 本地存储管理器 - 统一存储方案
 * 完全替代Supabase，提供规范化存储管理
 */

class LocalStorageManager {
    constructor() {
        // 存储键名常量 - 统一存储结构
        this.STORAGE_KEYS = {
            // 用户相关
            USERS: 'sweets_users',                    // 用户数据库
            CURRENT_USER: 'sweets_current_user',     // 当前登录用户
            
            // 设计相关
            DESIGNS: 'sweets_designs',               // 设计数据主存储
            LAST_DESIGN: 'sweets_last_design',       // 最后一次设计
            LAST_DESIGN_IMAGE: 'sweets_last_image',  // 最后一次设计图片
            
            // 订单相关
            ORDERS: 'sweets_orders',                 // 订单数据
            
            // 应用状态
            APP_SETTINGS: 'sweets_app_settings',     // 应用设置
            TUTORIAL_STATUS: 'sweets_tutorial',     // 教程状态
            
            // 会话状态（SessionStorage）
            SESSION_ID: 'sweets_session_id',         // 会话ID
            
            // 兼容性键名（用于平滑迁移）
            COMPATIBILITY: {
                DESIGNS_OLD: ['sweetsDesigns', 'designs'],
                ORDERS_OLD: 'orders',
                USERS_OLD: ['users', 'currentUser'],
                LAST_DESIGN_OLD: ['lastDesignImage', 'lastDesignType']
            }
        };
        
        // 初始化存储管理器
        this.initialize();
    }

    /**
     * 初始化存储管理器
     */
    initialize() {
        try {
            // 迁移旧数据到新格式
            this.migrateOldData();
            
            // 初始化默认设置
            this.initializeDefaultSettings();
            
            // 执行定期清理检查
            this.performScheduledCleanup();
            
            console.log('本地存储管理器初始化完成');
        } catch (error) {
            console.error('存储管理器初始化失败:', error);
        }
    }

    /**
     * 迁移旧数据到新格式
     */
    migrateOldData() {
        const migrationLog = [];
        
        try {
            // 迁移设计数据
            const compatDesigns = this.STORAGE_KEYS.COMPATIBILITY.DESIGNS_OLD;
            let migratedDesigns = [];
            
            for (const oldKey of compatDesigns) {
                const oldData = localStorage.getItem(oldKey);
                if (oldData) {
                    try {
                        const designs = JSON.parse(oldData);
                        if (Array.isArray(designs)) {
                            migratedDesigns = [...migratedDesigns, ...designs];
                            migrationLog.push(`从 ${oldKey} 迁移 ${designs.length} 个设计`);
                        }
                    } catch (e) {
                        console.warn(`无法解析 ${oldKey} 的数据:`, e);
                    }
                }
            }
            
            if (migratedDesigns.length > 0) {
                this.saveDesigns(migratedDesigns);
                migrationLog.push(`总共迁移 ${migratedDesigns.length} 个设计到新格式`);
            }
            
            // 迁移订单数据
            const oldOrders = localStorage.getItem(this.STORAGE_KEYS.COMPATIBILITY.ORDERS_OLD);
            if (oldOrders) {
                try {
                    const orders = JSON.parse(oldOrders);
                    if (Array.isArray(orders)) {
                        this.saveOrders(orders);
                        migrationLog.push(`迁移 ${orders.length} 个订单到新格式`);
                    }
                } catch (e) {
                    console.warn('无法解析旧订单数据:', e);
                }
            }
            
            // 迁移用户数据
            const userKeys = this.STORAGE_KEYS.COMPATIBILITY.USERS_OLD;
            for (const oldKey of userKeys) {
                const oldData = localStorage.getItem(oldKey);
                if (oldData) {
                    try {
                        const users = JSON.parse(oldData);
                        if (typeof users === 'object') {
                            // 处理用户数据库或当前用户
                            if (oldKey === 'users') {
                                this.saveUsers(users);
                                migrationLog.push(`迁移用户数据库到新格式`);
                            } else if (oldKey === 'currentUser') {
                                this.saveCurrentUser(users);
                                migrationLog.push(`迁移当前用户到新格式`);
                            }
                        }
                    } catch (e) {
                        console.warn(`无法解析 ${oldKey} 的用户数据:`, e);
                    }
                }
            }
            
            // 迁移最后设计数据
            const lastDesignKeys = this.STORAGE_KEYS.COMPATIBILITY.LAST_DESIGN_OLD;
            let lastDesignData = null;
            
            for (const oldKey of lastDesignKeys) {
                const oldData = localStorage.getItem(oldKey);
                if (oldData && oldKey === 'lastDesignImage') {
                    lastDesignData = {
                        image: oldData,
                        type: localStorage.getItem('lastDesignType') || 'chocolate'
                    };
                    this.saveLastDesign(lastDesignData);
                    migrationLog.push(`迁移最后设计数据到新格式`);
                    break;
                }
            }
            
            if (migrationLog.length > 0) {
                console.log('数据迁移完成:', migrationLog);
            }
            
        } catch (error) {
            console.error('数据迁移失败:', error);
        }
    }

    /**
     * 初始化默认设置
     */
    initializeDefaultSettings() {
        const defaultSettings = {
            theme: 'light',
            language: 'zh-CN',
            autoSave: true,
            maxHistorySteps: 50,
            imageQuality: 0.9,
            notifications: {
                saveSuccess: true,
                errorAlerts: true
            }
        };
        
        const currentSettings = this.getAppSettings();
        if (!currentSettings) {
            this.saveAppSettings(defaultSettings);
        }
    }

    // ==================== 用户管理 ====================

    /**
     * 获取所有用户
     */
    getUsers() {
        try {
            const users = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USERS)) || {};
            
            // 如果是对象格式，转换为数组格式
            if (users && typeof users === 'object' && !Array.isArray(users)) {
                return Object.values(users);
            }
            
            return Array.isArray(users) ? users : [];
        } catch (error) {
            console.error('获取用户数据失败:', error);
            return [];
        }
    }

    /**
     * 保存用户数据库
     */
    saveUsers(users) {
        try {
            if (Array.isArray(users)) {
                // 将数组转换为对象格式，以用户ID为键
                const usersObject = {};
                users.forEach(user => {
                    if (user.id) {
                        usersObject[user.id] = user;
                    }
                });
                localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(usersObject));
            } else {
                localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
            }
            return true;
        } catch (error) {
            console.error('保存用户数据失败:', error);
            return false;
        }
    }

    /**
     * 获取当前登录用户
     */
    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER)) || null;
        } catch (error) {
            console.error('获取当前用户失败:', error);
            return null;
        }
    }

    /**
     * 保存当前用户
     */
    saveCurrentUser(user) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
            return true;
        } catch (error) {
            console.error('保存当前用户失败:', error);
            return false;
        }
    }

    /**
     * 清除当前用户
     */
    clearCurrentUser() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
            return true;
        } catch (error) {
            console.error('清除当前用户失败:', error);
            return false;
        }
    }

    // ==================== 设计管理 ====================

    /**
     * 获取所有设计
     */
    getDesigns() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.DESIGNS)) || [];
        } catch (error) {
            console.error('获取设计数据失败:', error);
            return [];
        }
    }

    /**
     * 保存设计列表
     */
    saveDesigns(designs) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.DESIGNS, JSON.stringify(designs));
            return true;
        } catch (error) {
            console.error('保存设计数据失败:', error);
            return false;
        }
    }

    /**
     * 添加设计
     */
    addDesign(designData) {
        try {
            const designs = this.getDesigns();
            
            // 标准化设计数据格式
            const standardizedDesign = {
                id: designData.id || 'design_' + Date.now(),
                userId: designData.userId || 'anonymous',
                userName: designData.userName || '匿名用户',
                name: designData.name || `设计_${new Date().toLocaleString()}`,
                description: designData.description || '',
                canvasData: designData.canvasData || '',
                dessertType: designData.dessertType || 'chocolate',
                elements: designData.elements || '[]',
                imagePosition: designData.imagePosition || { x: 0, y: 0 },
                imageScale: designData.imageScale || 1,
                createTime: designData.createTime || new Date().toISOString(),
                status: designData.status || 'saved',
                // 兼容字段
                type: designData.dessertType || designData.type || '',
                data: designData.canvasData || designData.data || '',
                createdAt: designData.createTime || designData.createdAt || new Date().toISOString()
            };
            
            designs.push(standardizedDesign);
            
            if (this.saveDesigns(designs)) {
                return standardizedDesign;
            }
            
            return null;
        } catch (error) {
            console.error('添加设计失败:', error);
            return null;
        }
    }

    /**
     * 获取用户的设计列表
     */
    getUserDesigns(userId) {
        const designs = this.getDesigns();
        return designs.filter(design => design.userId === userId);
    }

    /**
     * 删除设计
     */
    deleteDesign(designId) {
        try {
            const designs = this.getDesigns();
            const filteredDesigns = designs.filter(design => design.id !== designId);
            return this.saveDesigns(filteredDesigns);
        } catch (error) {
            console.error('删除设计失败:', error);
            return false;
        }
    }

    /**
     * 更新设计
     */
    updateDesign(designId, updates) {
        try {
            const designs = this.getDesigns();
            const index = designs.findIndex(design => design.id === designId);
            
            if (index !== -1) {
                designs[index] = {
                    ...designs[index],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                return this.saveDesigns(designs) ? designs[index] : null;
            }
            return null;
        } catch (error) {
            console.error('更新设计失败:', error);
            return null;
        }
    }

    /**
     * 保存最后设计
     */
    saveLastDesign(lastDesign) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.LAST_DESIGN, JSON.stringify(lastDesign));
            return true;
        } catch (error) {
            console.error('保存最后设计失败:', error);
            return false;
        }
    }

    /**
     * 获取最后设计
     */
    getLastDesign() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.LAST_DESIGN)) || null;
        } catch (error) {
            console.error('获取最后设计失败:', error);
            return null;
        }
    }

    /**
     * 保存最后设计图片
     */
    saveLastDesignImage(imageData) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.LAST_DESIGN_IMAGE, imageData);
            return true;
        } catch (error) {
            console.error('保存最后设计图片失败:', error);
            return false;
        }
    }

    /**
     * 获取最后设计图片
     */
    getLastDesignImage() {
        return localStorage.getItem(this.STORAGE_KEYS.LAST_DESIGN_IMAGE) || null;
    }

    // ==================== 订单管理 ====================

    /**
     * 获取所有订单
     */
    getOrders() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ORDERS)) || [];
        } catch (error) {
            console.error('获取订单数据失败:', error);
            return [];
        }
    }

    /**
     * 保存订单列表
     */
    saveOrders(orders) {
        try {
            // 检查存储配额，限制订单数量
            const MAX_ORDERS = 1000; // 最大订单数量
            
            if (orders.length > MAX_ORDERS) {
                // 如果订单数量超过限制，只保留最近的数据
                const sortedOrders = orders.sort((a, b) => {
                    const timeA = new Date(a.createdAt || a.createTime || 0);
                    const timeB = new Date(b.createdAt || b.createTime || 0);
                    return timeB - timeA; // 降序排列，最新的在前
                });
                
                orders = sortedOrders.slice(0, MAX_ORDERS);
                console.log(`订单数量超过限制，已保留最新的 ${MAX_ORDERS} 个订单`);
            }
            
            // 优化数据大小：移除不必要的大字段
            const optimizedOrders = orders.map(order => {
                // 创建一个精简版的订单对象
                const optimizedOrder = { ...order };
                
                // 限制designImage的大小（如果太大）
                if (optimizedOrder.designImage && optimizedOrder.designImage.length > 10000) {
                    optimizedOrder.designImage = null; // 移除过大的设计图片
                }
                
                // 限制customText的长度
                if (optimizedOrder.customText && optimizedOrder.customText.length > 500) {
                    optimizedOrder.customText = optimizedOrder.customText.substring(0, 500) + '...';
                }
                
                return optimizedOrder;
            });
            
            localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(optimizedOrders));
            return true;
        } catch (error) {
            console.error('保存订单数据失败:', error);
            
            // 如果还是配额不足，尝试清理部分数据
            if (error.name === 'QuotaExceededError') {
                console.warn('存储配额不足，尝试清理部分数据...');
                return this.handleStorageQuotaError();
            }
            
            return false;
        }
    }

    /**
     * 处理存储配额不足错误
     */
    handleStorageQuotaError() {
        try {
            console.log('开始清理存储空间...');
            
            // 1. 清理旧的订单数据
            const orders = this.getOrders();
            if (orders.length > 500) {
                // 只保留最近的500个订单
                const sortedOrders = orders.sort((a, b) => {
                    const timeA = new Date(a.createdAt || a.createTime || 0);
                    const timeB = new Date(b.createdAt || b.createTime || 0);
                    return timeB - timeA;
                });
                
                const cleanedOrders = sortedOrders.slice(0, 500);
                
                // 进一步优化数据大小
                const optimizedOrders = cleanedOrders.map(order => {
                    const optimizedOrder = { ...order };
                    
                    // 移除所有大型数据字段
                    delete optimizedOrder.designImage;
                    delete optimizedOrder.canvasData;
                    delete optimizedOrder.elements;
                    
                    // 限制文本长度
                    if (optimizedOrder.customText) {
                        optimizedOrder.customText = optimizedOrder.customText.substring(0, 200) + '...';
                    }
                    
                    return optimizedOrder;
                });
                
                localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(optimizedOrders));
                console.log('清理完成：订单数据已精简');
            }
            
            // 2. 清理设计数据
            const designs = this.getDesigns();
            if (designs.length > 200) {
                // 只保留最近的设计
                const sortedDesigns = designs.sort((a, b) => {
                    const timeA = new Date(a.createdAt || a.createTime || 0);
                    const timeB = new Date(b.createdAt || b.createTime || 0);
                    return timeB - timeA;
                });
                
                const cleanedDesigns = sortedDesigns.slice(0, 200);
                
                // 移除大字段
                const optimizedDesigns = cleanedDesigns.map(design => {
                    const optimizedDesign = { ...design };
                    delete optimizedDesign.canvasData;
                    delete optimizedDesign.imageData;
                    return optimizedDesign;
                });
                
                localStorage.setItem(this.STORAGE_KEYS.DESIGNS, JSON.stringify(optimizedDesigns));
                console.log('清理完成：设计数据已精简');
            }
            
            // 3. 清理旧的应用数据
            localStorage.removeItem('sweets_last_design');
            localStorage.removeItem('sweets_last_image');
            
            console.log('存储空间清理完成');
            return true;
            
        } catch (error) {
            console.error('清理存储空间失败:', error);
            return false;
        }
    }

    /**
     * 处理存储配额不足错误
     */
    handleStorageQuotaError() {
        try {
            console.log('开始清理存储空间...');
            
            // 1. 清理旧的订单数据
            const orders = this.getOrders();
            if (orders.length > 500) {
                // 只保留最近的500个订单
                const sortedOrders = orders.sort((a, b) => {
                    const timeA = new Date(a.createdAt || a.createTime || 0);
                    const timeB = new Date(b.createdAt || b.createTime || 0);
                    return timeB - timeA;
                });
                
                const cleanedOrders = sortedOrders.slice(0, 500);
                
                // 进一步优化数据大小
                const optimizedOrders = cleanedOrders.map(order => {
                    const optimizedOrder = { ...order };
                    
                    // 移除所有大型数据字段
                    delete optimizedOrder.designImage;
                    delete optimizedOrder.canvasData;
                    delete optimizedOrder.elements;
                    
                    // 限制文本长度
                    if (optimizedOrder.customText) {
                        optimizedOrder.customText = optimizedOrder.customText.substring(0, 200) + '...';
                    }
                    
                    return optimizedOrder;
                });
                
                localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(optimizedOrders));
                console.log('清理完成：订单数据已精简');
            }
            
            // 2. 清理设计数据
            const designs = this.getDesigns();
            if (designs.length > 200) {
                // 只保留最近的设计
                const sortedDesigns = designs.sort((a, b) => {
                    const timeA = new Date(a.createdAt || a.createTime || 0);
                    const timeB = new Date(b.createdAt || b.createTime || 0);
                    return timeB - timeA;
                });
                
                const cleanedDesigns = sortedDesigns.slice(0, 200);
                
                // 移除大字段
                const optimizedDesigns = cleanedDesigns.map(design => {
                    const optimizedDesign = { ...design };
                    delete optimizedDesign.canvasData;
                    delete optimizedDesign.imageData;
                    return optimizedDesign;
                });
                
                localStorage.setItem(this.STORAGE_KEYS.DESIGNS, JSON.stringify(optimizedDesigns));
                console.log('清理完成：设计数据已精简');
            }
            
            // 3. 清理旧的应用数据
            localStorage.removeItem('sweets_last_design');
            localStorage.removeItem('sweets_last_image');
            
            console.log('存储空间清理完成');
            return true;
            
        } catch (error) {
            console.error('清理存储空间失败:', error);
            return false;
        }
    }

    /**
     * 添加订单
     */
    addOrder(orderData) {
        try {
            const orders = this.getOrders();
            
            const newOrder = {
                id: orderData.id || 'order_' + Date.now(),
                userId: orderData.userId || 'anonymous',
                productType: orderData.productType || '',
                selectedStyle: orderData.selectedStyle || '',
                flavorIndex: orderData.flavorIndex || 0,
                customText: orderData.customText || '',
                quantity: orderData.quantity || 1,
                selectedPackaging: orderData.selectedPackaging || '',
                designImage: orderData.designImage || '',
                totalPrice: orderData.totalPrice || 0,
                customerInfo: orderData.customerInfo || {},
                status: orderData.status || 'pending',
                createTime: orderData.createTime || new Date().toISOString()
            };
            
            orders.push(newOrder);
            
            if (this.saveOrders(orders)) {
                return newOrder;
            }
            
            return null;
        } catch (error) {
            console.error('添加订单失败:', error);
            return null;
        }
    }

    /**
     * 获取用户的订单列表
     */
    getUserOrders(userId) {
        const orders = this.getOrders();
        return orders.filter(order => order.userId === userId);
    }

    // ==================== 应用设置 ====================

    /**
     * 获取应用设置
     */
    getAppSettings() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.APP_SETTINGS)) || null;
        } catch (error) {
            console.error('获取应用设置失败:', error);
            return null;
        }
    }

    /**
     * 保存应用设置
     */
    saveAppSettings(settings) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('保存应用设置失败:', error);
            return false;
        }
    }

    /**
     * 获取教程状态
     */
    getTutorialStatus() {
        return localStorage.getItem(this.STORAGE_KEYS.TUTORIAL_STATUS) || 'not_started';
    }

    /**
     * 保存教程状态
     */
    saveTutorialStatus(status) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.TUTORIAL_STATUS, status);
            return true;
        } catch (error) {
            console.error('保存教程状态失败:', error);
            return false;
        }
    }

    // ==================== 工具方法 ====================

    /**
     * 清除所有应用数据
     */
    clearAllData() {
        try {
            // 清除所有新格式的存储键
            Object.values(this.STORAGE_KEYS).forEach(key => {
                if (typeof key === 'string' && !key.startsWith('COMPATIBILITY')) {
                    localStorage.removeItem(key);
                }
            });
            
            // 清除旧格式的存储键（可选）
            const oldKeys = [
                'sweetsDesigns', 'designs', 'orders', 'users', 'currentUser',
                'lastDesignImage', 'lastDesignType'
            ];
            
            oldKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('所有应用数据已清除');
            return true;
        } catch (error) {
            console.error('清除数据失败:', error);
            return false;
        }
    }

    /**
     * 获取存储统计信息
     */
    getStorageStats() {
        const stats = {
            users: 0,
            designs: 0,
            orders: 0,
            totalSize: 0
        };
        
        try {
            stats.users = Object.keys(this.getUsers()).length;
            stats.designs = this.getDesigns().length;
            stats.orders = this.getOrders().length;
            
            // 计算总存储大小（近似值）
            let totalSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('sweets_')) {
                    totalSize += (localStorage.getItem(key) || '').length;
                }
            }
            
            stats.totalSize = totalSize;
            
        } catch (error) {
            console.error('获取存储统计失败:', error);
        }
        
        return stats;
    }

    /**
     * 导出数据
     */
    exportData() {
        return {
            users: this.getUsers(),
            designs: this.getDesigns(),
            orders: this.getOrders(),
            appSettings: this.getAppSettings(),
            exportTime: new Date().toISOString(),
            version: '1.0'
        };
    }

    /**
     * 导入数据
     */
    importData(data) {
        try {
            if (data.users) this.saveUsers(data.users);
            if (data.designs) this.saveDesigns(data.designs);
            if (data.orders) this.saveOrders(data.orders);
            if (data.appSettings) this.saveAppSettings(data.appSettings);
            
            console.log('数据导入成功');
            return true;
        } catch (error) {
            console.error('数据导入失败:', error);
            return false;
        }
    }

    /**
     * 执行定期清理检查
     */
    performScheduledCleanup() {
        try {
            const LAST_CLEANUP_KEY = 'sweets_last_cleanup';
            const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
            const now = Date.now();
            const ONE_DAY = 24 * 60 * 60 * 1000; // 24小时
            
            // 如果距离上次清理超过24小时，执行清理
            if (!lastCleanup || (now - parseInt(lastCleanup)) > ONE_DAY) {
                console.log('执行定期存储清理...');
                
                // 检查存储大小
                const stats = this.getStorageStats();
                
                // 如果总大小超过1MB，或者数据量过大，执行清理
                if (stats.totalSize > 1024 * 1024 || stats.orders > 800 || stats.designs > 300) {
                    this.handleStorageQuotaError();
                }
                
                // 清理超过30天的旧数据
                this.cleanupOldData(30);
                
                // 更新清理时间
                localStorage.setItem(LAST_CLEANUP_KEY, now.toString());
                console.log('定期清理完成');
            }
            
        } catch (error) {
            console.warn('定期清理检查失败:', error);
        }
    }

    /**
     * 清理指定天数前的旧数据
     */
    cleanupOldData(days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            // 清理旧订单
            const orders = this.getOrders();
            const filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt || order.createTime || 0);
                return orderDate >= cutoffDate;
            });
            
            if (filteredOrders.length < orders.length) {
                this.saveOrders(filteredOrders);
                console.log(`清理了 ${orders.length - filteredOrders.length} 个超过 ${days} 天的旧订单`);
            }
            
            // 清理旧设计
            const designs = this.getDesigns();
            const filteredDesigns = designs.filter(design => {
                const designDate = new Date(design.createdAt || design.createTime || 0);
                return designDate >= cutoffDate;
            });
            
            if (filteredDesigns.length < designs.length) {
                this.saveDesigns(filteredDesigns);
                console.log(`清理了 ${designs.length - filteredDesigns.length} 个超过 ${days} 天的旧设计`);
            }
            
        } catch (error) {
            console.error('清理旧数据失败:', error);
        }
    }

    /**
     * 执行定期清理检查
     */
    performScheduledCleanup() {
        try {
            const LAST_CLEANUP_KEY = 'sweets_last_cleanup';
            const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
            const now = Date.now();
            const ONE_DAY = 24 * 60 * 60 * 1000; // 24小时
            
            // 如果距离上次清理超过24小时，执行清理
            if (!lastCleanup || (now - parseInt(lastCleanup)) > ONE_DAY) {
                console.log('执行定期存储清理...');
                
                // 检查存储大小
                const stats = this.getStorageStats();
                
                // 如果总大小超过1MB，或者数据量过大，执行清理
                if (stats.totalSize > 1024 * 1024 || stats.orders > 800 || stats.designs > 300) {
                    this.handleStorageQuotaError();
                }
                
                // 清理超过30天的旧数据
                this.cleanupOldData(30);
                
                // 更新清理时间
                localStorage.setItem(LAST_CLEANUP_KEY, now.toString());
                console.log('定期清理完成');
            }
            
        } catch (error) {
            console.warn('定期清理检查失败:', error);
        }
    }

    /**
     * 清理指定天数前的旧数据
     */
    cleanupOldData(days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            // 清理旧订单
            const orders = this.getOrders();
            const filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt || order.createTime || 0);
                return orderDate >= cutoffDate;
            });
            
            if (filteredOrders.length < orders.length) {
                this.saveOrders(filteredOrders);
                console.log(`清理了 ${orders.length - filteredOrders.length} 个超过 ${days} 天的旧订单`);
            }
            
            // 清理旧设计
            const designs = this.getDesigns();
            const filteredDesigns = designs.filter(design => {
                const designDate = new Date(design.createdAt || design.createTime || 0);
                return designDate >= cutoffDate;
            });
            
            if (filteredDesigns.length < designs.length) {
                this.saveDesigns(filteredDesigns);
                console.log(`清理了 ${designs.length - filteredDesigns.length} 个超过 ${days} 天的旧设计`);
            }
            
        } catch (error) {
            console.error('清理旧数据失败:', error);
        }
    }
}

// 创建全局实例
document.localStorageManager = new LocalStorageManager();

// 兼容原有代码的全局访问方式
if (window && typeof window !== 'undefined') {
    window.LocalStorageManager = LocalStorageManager;
    window.StorageManager = document.localStorageManager;
}