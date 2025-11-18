/**
 * 存储清理工具
 * 用于清理重复和过大的设计数据
 */

class StorageCleanup {
    constructor() {
        this.CLEANUP_KEY = 'sweets_storage_cleanup';
    }

    /**
     * 执行存储清理
     */
    async performCleanup() {
        console.log('开始执行存储清理...');
        
        try {
            // 1. 清理重复的 sweetsDesigns 数据
            await this.cleanupDuplicateDesigns();
            
            // 2. 压缩设计数据
            await this.compressDesignData();
            
            // 3. 清理旧数据
            await this.cleanupOldData();
            
            console.log('存储清理完成');
            return true;
        } catch (error) {
            console.error('存储清理失败:', error);
            return false;
        }
    }

    /**
     * 清理重复的设计数据
     */
    async cleanupDuplicateDesigns() {
        const storageKeys = [
            'sweetsDesigns',
            'sweets_designs', 
            'designs'
        ];

        let allDesigns = [];
        let keysToRemove = [];

        // 收集所有设计数据
        storageKeys.forEach(key => {
            try {
                const designs = JSON.parse(localStorage.getItem(key)) || [];
                if (designs.length > 0) {
                    console.log(`找到 ${key}: ${designs.length} 个设计`);
                    allDesigns = allDesigns.concat(designs);
                    keysToRemove.push(key);
                }
            } catch (error) {
                console.warn(`解析 ${key} 失败:`, error);
            }
        });

        // 去重处理（基于ID）
        const uniqueDesigns = [];
        const seenIds = new Set();

        allDesigns.forEach(design => {
            if (design.id && !seenIds.has(design.id)) {
                seenIds.add(design.id);
                uniqueDesigns.push(design);
            }
        });

        // 按创建时间排序，保留最新的
        uniqueDesigns.sort((a, b) => 
            new Date(b.createTime || 0) - new Date(a.createTime || 0)
        );

        // 保留最新的100个设计
        const designsToKeep = uniqueDesigns.slice(0, 100);
        
        console.log(`去重后保留 ${designsToKeep.length} 个设计`);

        // 使用统一存储管理器保存
        if (window.unifiedStorageManager) {
            await unifiedStorageManager.save(unifiedStorageManager.STORAGE_KEYS.DESIGNS, designsToKeep);
        } else {
            // 降级方案
            localStorage.setItem('sweets_designs', JSON.stringify(designsToKeep));
        }

        // 清理旧的键
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });

        return designsToKeep;
    }

    /**
     * 压缩设计数据
     */
    async compressDesignData() {
        try {
            const designs = await this.getDesigns();
            
            for (let design of designs) {
                // 压缩 canvasData
                if (design.canvasData && design.canvasData.length > 100000) {
                    const compressed = await this.compressImageData(design.canvasData);
                    design.canvasData = compressed;
                    design.compressed = true;
                }

                // 移除不必要的字段
                delete design.data; // 与 canvasData 重复
                delete design.history; // 历史记录数据通常很大
                
                // 压缩文本字段
                if (design.description && design.description.length > 500) {
                    design.description = design.description.substring(0, 500) + '...';
                }
            }

            // 保存压缩后的数据
            if (window.unifiedStorageManager) {
                await unifiedStorageManager.save(unifiedStorageManager.STORAGE_KEYS.DESIGNS, designs);
            }

            console.log('设计数据压缩完成');
            return designs;
        } catch (error) {
            console.error('压缩设计数据失败:', error);
            return [];
        }
    }

    /**
     * 压缩图片数据
     */
    async compressImageData(dataUrl, quality = 0.7) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 限制最大尺寸
                const maxSize = 600;
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
                    const compressed = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressed);
                } catch (error) {
                    console.warn('图片压缩失败:', error);
                    resolve(dataUrl);
                }
            };
            
            img.onerror = () => {
                console.warn('图片加载失败');
                resolve(dataUrl);
            };
            
            img.src = dataUrl;
        });
    }

    /**
     * 清理旧数据
     */
    async cleanupOldData() {
        const daysToKeep = 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        try {
            // 清理订单数据
            const orders = await this.getOrders();
            const filteredOrders = orders.filter(order => {
                const orderDate = new Date(order.createTime || 0);
                return orderDate >= cutoffDate;
            });

            if (filteredOrders.length < orders.length) {
                if (window.unifiedStorageManager) {
                    await unifiedStorageManager.save(unifiedStorageManager.STORAGE_KEYS.ORDERS, filteredOrders);
                }
                console.log(`清理了 ${orders.length - filteredOrders.length} 个旧订单`);
            }

            // 清理设计数据
            const designs = await this.getDesigns();
            const filteredDesigns = designs.filter(design => {
                const designDate = new Date(design.createTime || 0);
                return designDate >= cutoffDate;
            });

            if (filteredDesigns.length < designs.length) {
                if (window.unifiedStorageManager) {
                    await unifiedStorageManager.save(unifiedStorageManager.STORAGE_KEYS.DESIGNS, filteredDesigns);
                }
                console.log(`清理了 ${designs.length - filteredDesigns.length} 个旧设计`);
            }

        } catch (error) {
            console.error('清理旧数据失败:', error);
        }
    }

    /**
     * 获取设计列表
     */
    async getDesigns() {
        if (window.unifiedStorageManager) {
            return await unifiedStorageManager.getDesigns();
        }
        
        // 降级方案
        try {
            return JSON.parse(localStorage.getItem('sweets_designs')) || [];
        } catch (error) {
            return [];
        }
    }

    /**
     * 获取订单列表
     */
    async getOrders() {
        if (window.unifiedStorageManager) {
            return await unifiedStorageManager.getOrders();
        }
        
        // 降级方案
        try {
            return JSON.parse(localStorage.getItem('sweets_orders')) || [];
        } catch (error) {
            return [];
        }
    }

    /**
     * 获取存储统计信息
     */
    getStorageStats() {
        let totalSize = 0;
        let keys = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            const size = (key.length + value.length) * 2; // UTF-16 字符占2字节
            
            totalSize += size;
            keys.push({ key, size });
        }

        // 按大小排序
        keys.sort((a, b) => b.size - a.size);

        return {
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            keys: keys.slice(0, 10), // 显示前10个最大的键
            keyCount: localStorage.length
        };
    }
}

// 创建全局实例
window.StorageCleanup = StorageCleanup;