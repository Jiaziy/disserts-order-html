/**
 * 本地存储工具类
 * 统一管理应用中的所有本地存储操作
 */
class StorageUtils {
    // 存储键名常量
    static STORAGE_KEYS = {
        DESIGNS: 'sweetsDesigns',        // 设计数据主存储键
        USER: 'currentUser',             // 当前用户
        LAST_DESIGN_IMAGE: 'lastDesignImage',  // 最后一次设计的图片
        LAST_DESIGN_TYPE: 'lastDesignType',    // 最后一次设计的类型
        DESIGN_RESULT: 'sweetsDesignResult',   // 设计结果
        ORDERS: 'orders',                // 订单数据
        USERS: 'users',                  // 用户数据（本地注册）
        TUTORIAL_VISIT: 'hasVisitedTutorial'   // 教程访问标记
    };

    /**
     * 初始化存储 - 迁移旧数据
     */
    static initializeStorage() {
        try {
            // 迁移旧的designs键数据到sweetsDesigns
            this.migrateOldDesigns();
            console.log('存储初始化完成');
        } catch (error) {
            console.error('存储初始化失败:', error);
        }
    }

    /**
     * 迁移旧的designs键数据到sweetsDesigns
     */
    static migrateOldDesigns() {
        try {
            const oldDesigns = JSON.parse(localStorage.getItem('designs')) || [];
            if (oldDesigns.length > 0) {
                const currentDesigns = this.getDesigns() || [];
                
                // 将旧格式的数据转换为主格式
                const migratedDesigns = oldDesigns.map(oldDesign => {
                    // 如果已经是主格式，直接返回
                    if (oldDesign.canvasData) return oldDesign;
                    
                    // 转换旧格式到主格式
                    return {
                        id: oldDesign.id || 'design_' + Date.now(),
                        userId: oldDesign.user_id || oldDesign.userId || 'anonymous',
                        userName: oldDesign.userName || '匿名用户',
                        name: oldDesign.name || '未命名设计',
                        description: oldDesign.description || '',
                        canvasData: oldDesign.canvas_data || oldDesign.data || '',
                        dessertType: oldDesign.dessert_type || oldDesign.type || '',
                        elements: oldDesign.elements || '[]',
                        imagePosition: typeof oldDesign.image_position === 'string' 
                            ? JSON.parse(oldDesign.image_position) 
                            : (oldDesign.imagePosition || { x: 0, y: 0 }),
                        imageScale: oldDesign.imageScale || 1,
                        createTime: oldDesign.created_at || oldDesign.createTime || oldDesign.createdAt || new Date().toISOString(),
                        status: oldDesign.status || 'saved'
                    };
                });
                
                // 合并并去重
                const allDesigns = [...currentDesigns, ...migratedDesigns];
                const uniqueDesigns = this.removeDuplicateDesigns(allDesigns);
                
                // 保存合并后的数据
                this.saveDesigns(uniqueDesigns);
                
                console.log(`成功迁移 ${migratedDesigns.length} 个旧设计数据`);
            }
        } catch (error) {
            console.error('迁移旧设计数据失败:', error);
        }
    }

    /**
     * 移除重复的设计数据
     */
    static removeDuplicateDesigns(designs) {
        const uniqueIds = new Set();
        return designs.filter(design => {
            if (uniqueIds.has(design.id)) {
                return false;
            }
            uniqueIds.add(design.id);
            return true;
        });
    }

    /**
     * 获取所有设计
     */
    static getDesigns() {
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
    static saveDesigns(designs) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.DESIGNS, JSON.stringify(designs));
            return true;
        } catch (error) {
            console.error('保存设计数据失败:', error);
            return false;
        }
    }

    /**
     * 添加一个设计
     */
    static addDesign(designData) {
        try {
            const designs = this.getDesigns();
            
            // 确保设计数据包含所有必要字段
            const newDesign = {
                id: designData.id || 'design_' + Date.now(),
                userId: designData.userId || 'anonymous',
                userName: designData.userName || '匿名用户',
                name: designData.name || `设计_${new Date().toLocaleString()}`,
                description: designData.description || '',
                canvasData: designData.canvasData,
                dessertType: designData.dessertType || '',
                elements: designData.elements || '[]',
                imagePosition: designData.imagePosition || { x: 0, y: 0 },
                imageScale: designData.imageScale || 1,
                createTime: designData.createTime || new Date().toISOString(),
                status: designData.status || 'saved',
                // 添加兼容字段
                type: designData.dessertType || designData.type || '',
                data: designData.canvasData || designData.data || ''
            };
            
            designs.push(newDesign);
            return this.saveDesigns(designs) ? newDesign : null;
        } catch (error) {
            console.error('添加设计失败:', error);
            return null;
        }
    }

    /**
     * 获取用户的设计列表
     */
    static getUserDesigns(userId) {
        const designs = this.getDesigns();
        return designs.filter(design => design.userId === userId);
    }

    /**
     * 删除设计
     */
    static deleteDesign(designId) {
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
    static updateDesign(designId, updates) {
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
     * 获取当前用户
     */
    static getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USER)) || null;
        } catch (error) {
            console.error('获取当前用户失败:', error);
            return null;
        }
    }

    /**
     * 保存当前用户
     */
    static saveCurrentUser(userData) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(userData));
            return true;
        } catch (error) {
            console.error('保存当前用户失败:', error);
            return false;
        }
    }

    /**
     * 清除当前用户
     */
    static clearCurrentUser() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.USER);
            return true;
        } catch (error) {
            console.error('清除当前用户失败:', error);
            return false;
        }
    }

    /**
     * 保存最后设计的图片
     */
    static saveLastDesignImage(imageData) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.LAST_DESIGN_IMAGE, imageData);
            return true;
        } catch (error) {
            console.error('保存最后设计图片失败:', error);
            return false;
        }
    }

    /**
     * 获取最后设计的图片
     */
    static getLastDesignImage() {
        return localStorage.getItem(this.STORAGE_KEYS.LAST_DESIGN_IMAGE) || null;
    }

    /**
     * 保存最后设计的类型
     */
    static saveLastDesignType(designType) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.LAST_DESIGN_TYPE, designType);
            return true;
        } catch (error) {
            console.error('保存最后设计类型失败:', error);
            return false;
        }
    }

    /**
     * 获取最后设计的类型
     */
    static getLastDesignType() {
        return localStorage.getItem(this.STORAGE_KEYS.LAST_DESIGN_TYPE) || null;
    }

    /**
     * 保存设计结果
     */
    static saveDesignResult(result) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.DESIGN_RESULT, JSON.stringify(result));
            return true;
        } catch (error) {
            console.error('保存设计结果失败:', error);
            return false;
        }
    }

    /**
     * 获取设计结果
     */
    static getDesignResult() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.DESIGN_RESULT)) || null;
        } catch (error) {
            console.error('获取设计结果失败:', error);
            return null;
        }
    }

    /**
     * 清除设计结果
     */
    static clearDesignResult() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.DESIGN_RESULT);
            return true;
        } catch (error) {
            console.error('清除设计结果失败:', error);
            return false;
        }
    }

    /**
     * 获取所有订单
     */
    static getOrders() {
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
    static saveOrders(orders) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(orders));
            return true;
        } catch (error) {
            console.error('保存订单数据失败:', error);
            return false;
        }
    }

    /**
     * 添加订单
     */
    static addOrder(orderData) {
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
            return this.saveOrders(orders) ? newOrder : null;
        } catch (error) {
            console.error('添加订单失败:', error);
            return null;
        }
    }

    /**
     * 获取用户的订单列表
     */
    static getUserOrders(userId) {
        const orders = this.getOrders();
        return orders.filter(order => order.userId === userId);
    }

    /**
     * 清除所有应用数据
     */
    static clearAllAppData() {
        try {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            // 也清除旧的兼容键
            localStorage.removeItem('designs');
            return true;
        } catch (error) {
            console.error('清除应用数据失败:', error);
            return false;
        }
    }
}

// 导出工具类
window.StorageUtils = StorageUtils;
