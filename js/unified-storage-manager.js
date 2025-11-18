/**
 * 统一存储管理器 - 替换原有的 LocalStorageManager 和 StorageUtils
 * 提供单一API，支持数据压缩和多种存储策略
 */

class UnifiedStorageManager {
    constructor() {
        // 存储配置
        this.config = {
            maxStorageSize: 5 * 1024 * 1024, // 5MB
            maxDesigns: 200,
            maxOrders: 500,
            maxHistorySteps: 50,
            autoSaveInterval: 30000, // 30秒自动保存
            compressionQuality: 0.7, // 图片压缩质量
            cleanupAge: 30 * 24 * 60 * 60 * 1000 // 30天清理旧数据
        };

        // 存储键名统一
        this.STORAGE_KEYS = {
            // 核心数据
            USERS: 'sweets_users',
            CURRENT_USER: 'sweets_current_user',
            DESIGNS: 'sweets_designs',
            ORDERS: 'sweets_orders',
            
            // 应用状态
            APP_SETTINGS: 'sweets_app_settings',
            SESSION_ID: 'sweets_session_id',
            
            // 临时数据
            LAST_DESIGN: 'sweets_last_design',
            LAST_DESIGN_IMAGE: 'sweets_last_image',
            
            // 统计信息
            STORAGE_STATS: 'sweets_storage_stats',
            LAST_CLEANUP: 'sweets_last_cleanup'
        };

        // 存储策略
        this.storageStrategies = {
            local: this.localStorageStrategy,
            session: this.sessionStorageStrategy,
            indexedDB: this.indexedDBStrategy
        };

        // 异步初始化，不阻塞构造函数
        setTimeout(() => {
            this.initialize().catch(error => {
                console.error('统一存储管理器异步初始化失败:', error);
            });
        }, 0);
    }

    /**
     * 初始化存储管理器
     */
    async initialize() {
        try {
            // 检查浏览器支持
            this.checkStorageSupport();
            
            // 迁移旧数据
            await this.migrateOldData();
            
            // 初始化默认设置
            this.initializeDefaultSettings();
            
            // 执行清理检查
            this.performCleanupCheck();
            
            console.log('统一存储管理器初始化完成');
        } catch (error) {
            console.error('存储管理器初始化失败:', error);
        }
    }

    // ==================== 数据压缩方法 ====================

    /**
     * 压缩图片数据
     */
    async compressImageData(imageData, quality = this.config.compressionQuality) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 限制最大尺寸
                const maxSize = 800;
                let { width, height } = img;
                
                if (width > maxSize || height > maxSize) {
                    const scale = maxSize / Math.max(width, height);
                    width *= scale;
                    height *= scale;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                
                try {
                    const compressedData = canvas.toDataURL('image/jpeg', quality);
                    resolve({
                        data: compressedData,
                        originalSize: imageData.length,
                        compressedSize: compressedData.length,
                        compressionRatio: (compressedData.length / imageData.length).toFixed(2)
                    });
                } catch (error) {
                    console.warn('图片压缩失败，使用原始数据:', error);
                    resolve({
                        data: imageData,
                        originalSize: imageData.length,
                        compressedSize: imageData.length,
                        compressionRatio: 1
                    });
                }
            };
            
            img.onerror = () => {
                console.warn('图片加载失败，使用原始数据');
                resolve({
                    data: imageData,
                    originalSize: imageData.length,
                    compressedSize: imageData.length,
                    compressionRatio: 1
                });
            };
            
            img.src = imageData;
        });
    }

    /**
     * 压缩文本数据
     */
    compressTextData(text, maxLength = 1000) {
        if (text && text.length > maxLength) {
            return {
                data: text.substring(0, maxLength) + '...',
                originalLength: text.length,
                compressedLength: maxLength + 3,
                truncated: true
            };
        }
        return {
            data: text,
            originalLength: text.length,
            compressedLength: text.length,
            truncated: false
        };
    }

    /**
     * 优化设计数据
     */
    async optimizeDesignData(designData) {
        const optimized = { ...designData };
        
        // 压缩图片数据
        if (designData.canvasData && designData.canvasData.startsWith('data:image')) {
            const compressionResult = await this.compressImageData(designData.canvasData);
            optimized.canvasData = compressionResult.data;
            optimized.compressionInfo = compressionResult;
        }
        
        // 压缩文本字段
        if (designData.description) {
            const textResult = this.compressTextData(designData.description, 500);
            optimized.description = textResult.data;
        }
        
        // 移除不必要的大字段
        delete optimized.elements; // 可以在需要时重新生成
        delete optimized.imagePosition; // 可以在需要时重新计算
        
        return optimized;
    }

    /**
     * 优化订单数据
     */
    optimizeOrderData(orderData) {
        const optimized = { ...orderData };
        
        // 压缩设计图片
        if (optimized.designImage && optimized.designImage.length > 50000) {
            optimized.designImage = null; // 移除过大的设计图片
        }
        
        // 压缩自定义文本
        if (optimized.customText) {
            const textResult = this.compressTextData(optimized.customText, 200);
            optimized.customText = textResult.data;
        }
        
        return optimized;
    }

    // ==================== 统一API接口 ====================

    /**
     * 保存数据（统一接口）
     */
    async save(key, data, options = {}) {
        try {
            const {
                compress = true,
                strategy = 'local',
                ttl = null, // 生存时间（毫秒）
                optimize = true
            } = options;

            let dataToSave = data;

            // 数据优化
            if (optimize) {
                if (key === this.STORAGE_KEYS.DESIGNS) {
                    dataToSave = await this.optimizeDesignData(data);
                } else if (key === this.STORAGE_KEYS.ORDERS) {
                    dataToSave = this.optimizeOrderData(data);
                }
            }

            // 检查存储空间
            if (!this.checkStorageSpace(JSON.stringify(dataToSave).length)) {
                await this.performAutomaticCleanup();
            }

            // 使用指定策略保存
            const result = await this.storageStrategies[strategy].call(this, key, dataToSave, 'set');
            
            // 更新统计信息
            this.updateStorageStats();
            
            return result;
        } catch (error) {
            console.error(`保存数据失败 (${key}):`, error);
            throw error;
        }
    }

    /**
     * 加载数据（统一接口）
     */
    async load(key, strategy = 'local') {
        try {
            const data = await this.storageStrategies[strategy].call(this, key, null, 'get');
            
            // 数据验证和修复
            if (data) {
                return this.validateAndRepairData(key, data);
            }
            
            return null;
        } catch (error) {
            console.error(`加载数据失败 (${key}):`, error);
            return null;
        }
    }

    /**
     * 删除数据（统一接口）
     */
    async delete(key, strategy = 'local') {
        try {
            await this.storageStrategies[strategy].call(this, key, null, 'delete');
            this.updateStorageStats();
            return true;
        } catch (error) {
            console.error(`删除数据失败 (${key}):`, error);
            return false;
        }
    }

    // ==================== 存储策略实现 ====================

    /**
     * LocalStorage 存储策略
     */
    async localStorageStrategy(key, data = null, operation = 'get') {
        switch (operation) {
            case 'get':
                try {
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : null;
                } catch (error) {
                    console.warn(`解析 ${key} 数据失败:`, error);
                    return null;
                }
            
            case 'set':
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                    return true;
                } catch (error) {
                    if (error.name === 'QuotaExceededError') {
                        throw new Error('STORAGE_QUOTA_EXCEEDED');
                    }
                    throw error;
                }
            
            case 'delete':
                localStorage.removeItem(key);
                return true;
        }
    }

    /**
     * SessionStorage 存储策略（临时数据）
     */
    async sessionStorageStrategy(key, data = null, operation = 'get') {
        switch (operation) {
            case 'get':
                try {
                    const item = sessionStorage.getItem(key);
                    return item ? JSON.parse(item) : null;
                } catch (error) {
                    return null;
                }
            
            case 'set':
                sessionStorage.setItem(key, JSON.stringify(data));
                return true;
            
            case 'delete':
                sessionStorage.removeItem(key);
                return true;
        }
    }

    /**
     * IndexedDB 存储策略（大容量数据）
     */
    async indexedDBStrategy(key, data = null, operation = 'get') {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SweetsDesignerDB', 1);
            
            request.onerror = () => reject(new Error('IndexedDB打开失败'));
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                
                const transaction = db.transaction(['storage'], 'readwrite');
                const objectStore = transaction.objectStore('storage');
                
                switch (operation) {
                    case 'get':
                        const getRequest = objectStore.get(key);
                        getRequest.onsuccess = () => resolve(getRequest.result);
                        getRequest.onerror = () => resolve(null);
                        break;
                    
                    case 'set':
                        const putRequest = objectStore.put(data, key);
                        putRequest.onsuccess = () => resolve(true);
                        putRequest.onerror = () => reject(new Error('保存失败'));
                        break;
                    
                    case 'delete':
                        const deleteRequest = objectStore.delete(key);
                        deleteRequest.onsuccess = () => resolve(true);
                        deleteRequest.onerror = () => reject(new Error('删除失败'));
                        break;
                }
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('storage')) {
                    db.createObjectStore('storage');
                }
            };
        });
    }

    // ==================== 业务特定方法 ====================

    /**
     * 保存设计（带压缩和优化）
     */
    async saveDesign(designData) {
        const designs = await this.getDesigns();
        
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
            status: designData.status || 'saved'
        };
        
        designs.push(standardizedDesign);
        
        // 根据数据大小选择存储策略
        const dataSize = JSON.stringify(designs).length;
        const strategy = dataSize > 100000 ? 'indexedDB' : 'local';
        
        return this.save(this.STORAGE_KEYS.DESIGNS, designs, { strategy });
    }

    /**
     * 获取所有设计
     */
    async getDesigns() {
        const designs = await this.load(this.STORAGE_KEYS.DESIGNS) || [];
        return Array.isArray(designs) ? designs : [];
    }

    /**
     * 获取用户的设计列表
     */
    async getUserDesigns(userId) {
        const designs = await this.getDesigns();
        return designs.filter(design => design.userId === userId);
    }

    /**
     * 保存订单（带优化）
     */
    async saveOrder(orderData) {
        const orders = await this.getOrders();
        
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
        
        return this.save(this.STORAGE_KEYS.ORDERS, orders);
    }

    /**
     * 获取所有订单
     */
    async getOrders() {
        const orders = await this.load(this.STORAGE_KEYS.ORDERS) || [];
        return Array.isArray(orders) ? orders : [];
    }

    /**
     * 获取用户的订单列表
     */
    async getUserOrders(userId) {
        const orders = await this.getOrders();
        return orders.filter(order => order.userId === userId);
    }

    /**
     * 保存当前用户
     */
    async saveCurrentUser(userData) {
        return this.save(this.STORAGE_KEYS.CURRENT_USER, userData);
    }

    /**
     * 获取当前用户
     */
    async getCurrentUser() {
        return this.load(this.STORAGE_KEYS.CURRENT_USER);
    }

    /**
     * 保存应用设置
     */
    async saveAppSettings(settings) {
        return this.save(this.STORAGE_KEYS.APP_SETTINGS, settings);
    }

    /**
     * 获取应用设置
     */
    async getAppSettings() {
        return this.load(this.STORAGE_KEYS.APP_SETTINGS);
    }

    // ==================== 状态同步机制 ====================

    /**
     * 生成数据同步包
     */
    async generateSyncPackage() {
        const syncData = {
            users: await this.load(this.STORAGE_KEYS.USERS),
            designs: await this.getDesigns(),
            orders: await this.getOrders(),
            timestamp: Date.now(),
            version: '1.0'
        };
        
        // 计算哈希用于数据完整性验证
        const hash = this.calculateHash(JSON.stringify(syncData));
        syncData.hash = hash;
        
        return syncData;
    }

    /**
     * 应用同步包
     */
    async applySyncPackage(syncData) {
        try {
            // 验证数据完整性
            const expectedHash = syncData.hash;
            delete syncData.hash;
            
            const actualHash = this.calculateHash(JSON.stringify(syncData));
            
            if (expectedHash !== actualHash) {
                throw new Error('数据完整性验证失败');
            }
            
            // 应用同步数据
            if (syncData.users) await this.save(this.STORAGE_KEYS.USERS, syncData.users);
            if (syncData.designs) await this.save(this.STORAGE_KEYS.DESIGNS, syncData.designs);
            if (syncData.orders) await this.save(this.STORAGE_KEYS.ORDERS, syncData.orders);
            
            console.log('数据同步完成');
            return true;
        } catch (error) {
            console.error('数据同步失败:', error);
            return false;
        }
    }

    // ==================== 工具方法 ====================

    calculateHash(str) {
        // 简单的哈希计算
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return hash.toString(16);
    }

    checkStorageSupport() {
        if (!window.localStorage) {
            throw new Error('浏览器不支持localStorage');
        }
        
        if (!window.sessionStorage) {
            console.warn('浏览器不支持sessionStorage');
        }
        
        if (!window.indexedDB) {
            console.warn('浏览器不支持IndexedDB');
        }
    }

    /**
     * 检查存储空间
     */
    checkStorageSpace(requiredSize) {
        try {
            let usedSpace = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                usedSpace += key.length + value.length;
            }
            
            const remainingSpace = this.config.maxStorageSize - usedSpace;
            return remainingSpace >= requiredSize;
        } catch (error) {
            console.warn('检查存储空间失败，继续尝试保存:', error);
            return true;
        }
    }

    /**
     * 执行自动清理
     */
    async performAutomaticCleanup() {
        console.log('存储空间不足，开始自动清理...');
        
        try {
            // 清理旧的设计数据
            const designs = await this.getDesigns();
            if (designs.length > this.config.maxDesigns) {
                const sortedDesigns = designs.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
                const designsToKeep = sortedDesigns.slice(0, this.config.maxDesigns);
                await this.save(this.STORAGE_KEYS.DESIGNS, designsToKeep);
                console.log(`清理了 ${designs.length - this.config.maxDesigns} 个旧设计`);
            }
            
            // 清理旧订单数据
            const orders = await this.getOrders();
            if (orders.length > this.config.maxOrders) {
                const sortedOrders = orders.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
                const ordersToKeep = sortedOrders.slice(0, this.config.maxOrders);
                await this.save(this.STORAGE_KEYS.ORDERS, ordersToKeep);
                console.log(`清理了 ${orders.length - this.config.maxOrders} 个旧订单`);
            }
            
            console.log('自动清理完成');
        } catch (error) {
            console.error('自动清理失败:', error);
        }
    }

    /**
     * 更新存储统计信息
     */
    async updateStorageStats() {
        try {
            const stats = {
                totalKeys: localStorage.length,
                totalSize: 0,
                designsCount: (await this.getDesigns()).length,
                ordersCount: (await this.getOrders()).length,
                lastUpdate: Date.now()
            };
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                stats.totalSize += key.length + value.length;
            }
            
            stats.totalSizeKB = (stats.totalSize / 1024).toFixed(2);
            stats.remainingSpace = ((this.config.maxStorageSize - stats.totalSize) / 1024).toFixed(2);
            
            await this.save(this.STORAGE_KEYS.STORAGE_STATS, stats);
        } catch (error) {
            console.error('更新存储统计失败:', error);
        }
    }

    /**
     * 验证和修复数据
     */
    validateAndRepairData(key, data) {
        // 基本的数据完整性检查
        if (data === null || data === undefined) {
            return null;
        }
        
        // 针对不同类型的数据进行验证
        switch (key) {
            case this.STORAGE_KEYS.DESIGNS:
                if (!Array.isArray(data)) {
                    console.warn(`设计数据格式错误，重置为数组`);
                    return [];
                }
                break;
                
            case this.STORAGE_KEYS.ORDERS:
                if (!Array.isArray(data)) {
                    console.warn(`订单数据格式错误，重置为数组`);
                    return [];
                }
                break;
        }
        
        return data;
    }

    /**
     * 迁移旧数据
     */
    async migrateOldData() {
        try {
            console.log('开始迁移旧数据...');
            
            // 迁移 StorageUtils 的数据
            if (window.StorageUtils) {
                const oldDesigns = StorageUtils.getDesigns();
                if (oldDesigns.length > 0) {
                    await this.save(this.STORAGE_KEYS.DESIGNS, oldDesigns);
                    console.log(`迁移了 ${oldDesigns.length} 个设计`);
                }
                
                const oldOrders = StorageUtils.getOrders();
                if (oldOrders.length > 0) {
                    await this.save(this.STORAGE_KEYS.ORDERS, oldOrders);
                    console.log(`迁移了 ${oldOrders.length} 个订单`);
                }
            }
            
            // 迁移 LocalStorageManager 的数据
            if (window.LocalStorageManager) {
                const oldUser = LocalStorageManager.getCurrentUser();
                if (oldUser) {
                    await this.save(this.STORAGE_KEYS.CURRENT_USER, oldUser);
                    console.log('迁移了当前用户数据');
                }
            }
            
            console.log('旧数据迁移完成');
        } catch (error) {
            console.error('迁移旧数据失败:', error);
        }
    }

    /**
     * 初始化默认设置
     */
    async initializeDefaultSettings() {
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
        
        const currentSettings = await this.getAppSettings();
        if (!currentSettings) {
            await this.save(this.STORAGE_KEYS.APP_SETTINGS, defaultSettings);
        }
    }

    /**
     * 执行清理检查
     */
    async performCleanupCheck() {
        try {
            const lastCleanup = await this.load(this.STORAGE_KEYS.LAST_CLEANUP);
            const now = Date.now();
            const ONE_DAY = 24 * 60 * 60 * 1000;
            
            if (!lastCleanup || (now - parseInt(lastCleanup)) > ONE_DAY) {
                console.log('执行定期存储清理...');
                
                // 清理超过30天的旧数据
                await this.cleanupOldData(30);
                
                // 更新清理时间
                await this.save(this.STORAGE_KEYS.LAST_CLEANUP, now.toString());
                console.log('定期清理完成');
            }
        } catch (error) {
            console.warn('定期清理检查失败:', error);
        }
    }

    /**
     * 清理指定天数前的旧数据
     */
    async cleanupOldData(days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            // 清理旧订单
            const orders = await this.getOrders();
            const filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.createTime || 0);
                return orderDate >= cutoffDate;
            });
            
            if (filteredOrders.length < orders.length) {
                await this.save(this.STORAGE_KEYS.ORDERS, filteredOrders);
                console.log(`清理了 ${orders.length - filteredOrders.length} 个超过 ${days} 天的旧订单`);
            }
            
            // 清理旧设计
            const designs = await this.getDesigns();
            const filteredDesigns = designs.filter(design => {
                const designDate = new Date(design.createTime || 0);
                return designDate >= cutoffDate;
            });
            
            if (filteredDesigns.length < designs.length) {
                await this.save(this.STORAGE_KEYS.DESIGNS, filteredDesigns);
                console.log(`清理了 ${designs.length - filteredDesigns.length} 个超过 ${days} 天的旧设计`);
            }
        } catch (error) {
            console.error('清理旧数据失败:', error);
        }
    }

    /**
     * 获取存储统计信息
     */
    async getStorageStats() {
        return await this.load(this.STORAGE_KEYS.STORAGE_STATS) || {
            totalKeys: 0,
            totalSize: 0,
            designsCount: 0,
            ordersCount: 0,
            lastUpdate: 0
        };
    }

    /**
     * 导出所有数据
     */
    async exportAllData() {
        return {
            users: await this.load(this.STORAGE_KEYS.USERS),
            designs: await this.getDesigns(),
            orders: await this.getOrders(),
            appSettings: await this.getAppSettings(),
            exportTime: new Date().toISOString(),
            version: '1.0'
        };
    }

    /**
     * 导入数据
     */
    async importData(data) {
        try {
            if (data.users) await this.save(this.STORAGE_KEYS.USERS, data.users);
            if (data.designs) await this.save(this.STORAGE_KEYS.DESIGNS, data.designs);
            if (data.orders) await this.save(this.STORAGE_KEYS.ORDERS, data.orders);
            if (data.appSettings) await this.save(this.STORAGE_KEYS.APP_SETTINGS, data.appSettings);
            
            console.log('数据导入成功');
            return true;
        } catch (error) {
            console.error('数据导入失败:', error);
            return false;
        }
    }

    /**
     * 清除所有应用数据
     */
    async clearAllData() {
        try {
            for (const key of Object.values(this.STORAGE_KEYS)) {
                await this.delete(key);
            }
            console.log('所有应用数据已清除');
            return true;
        } catch (error) {
            console.error('清除数据失败:', error);
            return false;
        }
    }
}

// 导出构造函数
window.UnifiedStorageManager = UnifiedStorageManager;