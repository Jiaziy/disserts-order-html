// 增强版设计库功能 - 完全替代侧边栏作品库
class SweetsGallery {
    constructor() {
        this.designs = [];
        this.filteredDesigns = [];
        this.orders = [];
        this.filteredOrders = [];
        this.currentDesign = null;
        this.currentOrder = null;
        this.currentTab = 'designs'; // designs 或 orders
        
        this.init();
    }

    init() {
        this.loadDesigns();
        this.loadOrders();
        this.setupEventListeners();
        this.renderContent();
    }

    /**
     * 加载设计列表
     */
    loadDesigns() {
        try {
            // 优先使用StorageUtils获取设计数据
            if (window.StorageUtils) {
                this.designs = StorageUtils.getDesigns();
                // 统一数据字段
                this.designs = this.designs.map(design => ({
                    ...design,
                    data: design.canvasData || design.data,
                    type: design.dessertType || design.type || 'chocolate'
                }));
            } else {
                // 降级方案 - 兼容两种存储键名
                const sweetsDesigns = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
                const designs = JSON.parse(localStorage.getItem('designs')) || [];
                this.designs = [...sweetsDesigns, ...designs];
                // 统一数据字段
                this.designs = this.designs.map(design => ({
                    ...design,
                    data: design.canvasData || design.data,
                    type: design.dessertType || design.type || 'chocolate'
                }));
            }
            this.filteredDesigns = [...this.designs];
            console.log('加载设计数据:', this.designs.length, '个设计');
        } catch (error) {
            console.error('加载设计失败:', error);
            this.designs = [];
            this.filteredDesigns = [];
        }
    }

    /**
     * 加载订单列表
     */
    loadOrders() {
        try {
            if (window.StorageUtils) {
                this.orders = StorageUtils.getOrders();
            } else {
                this.orders = JSON.parse(localStorage.getItem('orders')) || [];
            }
            this.filteredOrders = [...this.orders];
            console.log('加载订单数据:', this.orders.length, '个订单');
        } catch (error) {
            console.error('加载订单失败:', error);
            this.orders = [];
            this.filteredOrders = [];
        }
    }

    setupEventListeners() {
        // 标签页切换
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // 搜索功能
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (this.currentTab === 'designs') {
                    this.filterDesigns();
                } else {
                    this.filterOrders();
                }
            });
        }

        // 类型筛选
        const typeFilter = document.getElementById('type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                if (this.currentTab === 'designs') {
                    this.filterDesigns();
                }
            });
        }

        // 排序筛选
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                if (this.currentTab === 'designs') {
                    this.sortDesigns();
                } else {
                    this.sortOrders();
                }
            });
        }

        // 点击模态框外部关闭
        const modal = document.getElementById('design-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        const orderModal = document.getElementById('order-modal');
        if (orderModal) {
            orderModal.addEventListener('click', (e) => {
                if (e.target === orderModal) {
                    this.closeOrderModal();
                }
            });
        }
    }

    renderContent() {
        if (this.currentTab === 'designs') {
            this.renderDesigns();
        } else {
            this.renderOrders();
        }
    }

    switchTab(tab) {
        // 更新标签页状态
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
        });

        // 更新当前标签页
        this.currentTab = tab;

        // 更新页面标题和筛选器
        this.updateTabContent();

        // 渲染对应内容
        this.renderContent();
    }

    updateTabContent() {
        const header = document.querySelector('.gallery-header h2');
        const typeFilter = document.getElementById('type-filter');
        
        if (this.currentTab === 'designs') {
            if (header) header.textContent = '我的设计作品';
            if (typeFilter) typeFilter.style.display = 'block';
        } else {
            if (header) header.textContent = '我的订单';
            if (typeFilter) typeFilter.style.display = 'none';
        }
    }

    renderContent() {
        if (this.currentTab === 'designs') {
            this.renderDesigns();
        } else {
            this.renderOrders();
        }
    }

    switchTab(tab) {
        // 更新标签页状态
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
        });

        // 更新当前标签页
        this.currentTab = tab;

        // 更新页面标题和筛选器
        this.updateTabContent();

        // 渲染对应内容
        this.renderContent();
    }

    updateTabContent() {
        const header = document.querySelector('.gallery-header h2');
        const typeFilter = document.getElementById('type-filter');
        
        if (this.currentTab === 'designs') {
            if (header) header.textContent = '我的设计作品';
            if (typeFilter) typeFilter.style.display = 'block';
        } else {
            if (header) header.textContent = '我的订单';
            if (typeFilter) typeFilter.style.display = 'none';
        }
    }

    filterDesigns() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();

        // 只显示巧克力类型的设计
        this.filteredDesigns = this.designs.filter(design => {
            const matchesSearch = design.name.toLowerCase().includes(searchTerm);
            const matchesType = design.type === 'chocolate'; // 只筛选巧克力类型
            
            return matchesSearch && matchesType;
        });

        this.sortDesigns();
    }

    sortDesigns() {
        const sortBy = document.getElementById('sort-filter').value;

        this.filteredDesigns.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        this.renderDesigns();
    }

    renderDesigns() {
        const grid = document.getElementById('designs-grid');
        const emptyState = document.getElementById('empty-state');

        if (!grid) return;

        if (this.filteredDesigns.length === 0) {
            grid.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        grid.innerHTML = this.filteredDesigns.map(design => this.createDesignCard(design)).join('');
        
        // 添加卡片事件监听器
        this.attachCardEvents();
    }

    createDesignCard(design) {
        const typeNames = {
            'chocolate': '巧克力'
        };

        const shapeNames = {
            'circle': '圆形',
            'square': '方形',
            'heart': '心形',
            'star': '星形'
        };

        const date = new Date(design.createdAt).toLocaleDateString('zh-CN');

        return `
            <div class="design-card" data-id="${design.id}">
                <div class="design-image">
                    <img src="${design.data}" alt="${design.name}">
                </div>
                <div class="design-info">
                    <div class="design-title">${design.name}</div>
                    <div class="design-meta">
                        <span class="design-type">${typeNames[design.type] || design.type}</span>
                        <span class="design-date">${date}</span>
                    </div>
                    <div class="design-actions">
                        <button class="primary" onclick="event.stopPropagation(); gallery.viewDesign('${design.id}')">
                            <i class="fas fa-eye"></i>查看
                        </button>
                        <button class="secondary" onclick="event.stopPropagation(); gallery.editDesign('${design.id}')">
                            <i class="fas fa-edit"></i>编辑
                        </button>
                        <button class="danger" onclick="event.stopPropagation(); gallery.deleteDesign('${design.id}')">
                            <i class="fas fa-trash"></i>删除
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachCardEvents() {
        const cards = document.querySelectorAll('.design-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const designId = card.getAttribute('data-id');
                    this.viewDesign(designId);
                }
            });
        });
    }

    viewDesign(designId) {
        this.currentDesign = this.designs.find(d => d.id == designId);
        if (!this.currentDesign) return;

        this.showModal();
        this.updateModalContent();
    }

    showModal() {
        const modal = document.getElementById('design-modal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.getElementById('design-modal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
        this.currentDesign = null;
    }

    updateModalContent() {
        if (!this.currentDesign) return;

        const typeNames = {
            'chocolate': '巧克力'
        };

        const shapeNames = {
            'circle': '圆形',
            'square': '方形', 
            'heart': '心形',
            'star': '星形'
        };

        const date = new Date(this.currentDesign.createdAt).toLocaleString('zh-CN');

        document.getElementById('modal-title').textContent = this.currentDesign.name;
        document.getElementById('modal-image').src = this.currentDesign.data;
        document.getElementById('info-name').textContent = this.currentDesign.name;
        document.getElementById('info-type').textContent = typeNames[this.currentDesign.type] || this.currentDesign.type;
        document.getElementById('info-shape').textContent = shapeNames[this.currentDesign.shape] || this.currentDesign.shape;
        document.getElementById('info-date').textContent = date;
    }

    editDesign(designId) {
        const design = this.designs.find(d => d.id == designId);
        if (design) {
            // 将设计数据传递到设计页面
            localStorage.setItem('currentEditDesign', JSON.stringify(design));
            if (window.navigationManager) {
                window.navigationManager.navigateTo('sweets-designer.html');
            } else {
                window.location.href = 'sweets-designer.html';
            }
        }
    }

    exportDesign() {
        if (!this.currentDesign) return;

        const link = document.createElement('a');
        link.download = `${this.currentDesign.name}.png`;
        link.href = this.currentDesign.data;
        link.click();
    }

    deleteDesign(designId) {
        if (!confirm('确定要删除这个设计吗？此操作不可撤销。')) {
            return;
        }

        this.designs = this.designs.filter(d => d.id != designId);
        this.filteredDesigns = this.filteredDesigns.filter(d => d.id != designId);
        
        localStorage.setItem('sweetsDesigns', JSON.stringify(this.designs));
        
        if (this.currentDesign && this.currentDesign.id == designId) {
            this.closeModal();
        }
        
        this.renderDesigns();
        
        // 显示删除成功提示
        this.showToast('设计已删除');
    }

    showToast(message) {
        // 创建临时提示元素
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1001;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }

    // 批量操作
    exportAllDesigns() {
        if (this.designs.length === 0) {
            alert('没有可导出的设计');
            return;
        }

        // 创建ZIP文件（简化版：逐个下载）
        this.designs.forEach((design, index) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.download = `${design.name}_${index + 1}.png`;
                link.href = design.data;
                link.click();
            }, index * 100);
        });
    }

    clearAllDesigns() {
        if (this.designs.length === 0) {
            alert('没有可删除的设计');
            return;
        }

        if (!confirm(`确定要删除所有 ${this.designs.length} 个设计吗？此操作不可撤销。`)) {
            return;
        }

        this.designs = [];
        this.filteredDesigns = [];
        localStorage.removeItem('sweetsDesigns');
        this.renderDesigns();
        this.showToast('所有设计已删除');
    }

    // 订单管理功能
    filterOrders() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        
        this.filteredOrders = this.orders.filter(order => {
            const matchesSearch = order.productType.toLowerCase().includes(searchTerm) ||
                               order.selectedStyle.toLowerCase().includes(searchTerm);
            return matchesSearch;
        });
        
        this.sortOrders();
    }

    sortOrders() {
        const sortBy = document.getElementById('sort-filter').value;
        
        this.filteredOrders.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createTime) - new Date(a.createTime);
                case 'oldest':
                    return new Date(a.createTime) - new Date(b.createTime);
                case 'status':
                    return a.status.localeCompare(b.status);
                default:
                    return 0;
            }
        });
        
        this.renderOrders();
    }

    renderOrders() {
        const grid = document.getElementById('content-grid');
        const emptyState = document.getElementById('empty-state');
        
        if (!grid) return;
        
        if (this.filteredOrders.length === 0) {
            grid.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
                emptyState.innerHTML = `
                    <i class="fas fa-shopping-cart"></i>
                    <h3>还没有订单</h3>
                    <p>去设计中心创建您的第一个订单吧！</p>
                    <button class="primary-btn" data-navigate="sweets-designer.html">
                        开始设计
                    </button>
                `;
            }
            return;
        }
        
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        grid.innerHTML = this.filteredOrders.map(order => this.createOrderCard(order)).join('');
        
        // 添加订单卡片事件监听器
        this.attachOrderCardEvents();
    }

    createOrderCard(order) {
        const statusInfo = {
            'pending': { text: '待处理', class: 'pending' },
            'confirmed': { text: '已确认', class: 'confirmed' },
            'shipped': { text: '已发货', class: 'shipped' },
            'completed': { text: '已完成', class: 'completed' },
            'cancelled': { text: '已取消', class: 'cancelled' }
        };
        
        const status = statusInfo[order.status] || { text: order.status, class: 'pending' };
        const date = new Date(order.createTime).toLocaleDateString('zh-CN');
        
        return `
            <div class="order-card" data-id="${order.id}">
                <div class="order-image">
                    <img src="${order.designImage || 'images/default-order.png'}" alt="${order.productType}">
                </div>
                <div class="order-info">
                    <div class="order-title">${order.productType} - ${order.selectedStyle}</div>
                    <div class="order-meta">
                        <span class="order-status ${status.class}">${status.text}</span>
                        <span class="order-date">${date}</span>
                        <span class="order-price">¥${order.totalPrice}</span>
                    </div>
                    <div class="order-actions">
                        <button class="primary" onclick="event.stopPropagation(); gallery.viewOrder('${order.id}')">
                            <i class="fas fa-eye"></i>查看
                        </button>
                        <button class="secondary" onclick="event.stopPropagation(); gallery.reorder('${order.id}')">
                            <i class="fas fa-redo"></i>重新下单
                        </button>
                        ${order.status === 'pending' ? `
                        <button class="danger" onclick="event.stopPropagation(); gallery.cancelOrder('${order.id}')">
                            <i class="fas fa-times"></i>取消
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    attachOrderCardEvents() {
        const cards = document.querySelectorAll('.order-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const orderId = card.getAttribute('data-id');
                    this.viewOrder(orderId);
                }
            });
        });
    }

    viewOrder(orderId) {
        this.currentOrder = this.orders.find(o => o.id == orderId);
        if (!this.currentOrder) return;
        
        this.showOrderModal();
        this.updateOrderModalContent();
    }

    showOrderModal() {
        const modal = document.getElementById('order-modal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeOrderModal() {
        const modal = document.getElementById('order-modal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
        this.currentOrder = null;
    }

    updateOrderModalContent() {
        if (!this.currentOrder) return;
        
        const statusInfo = {
            'pending': { text: '待处理', class: 'pending' },
            'confirmed': { text: '已确认', class: 'confirmed' },
            'shipped': { text: '已发货', class: 'shipped' },
            'completed': { text: '已完成', class: 'completed' },
            'cancelled': { text: '已取消', class: 'cancelled' }
        };
        
        const status = statusInfo[this.currentOrder.status] || { text: this.currentOrder.status, class: 'pending' };
        const date = new Date(this.currentOrder.createTime).toLocaleString('zh-CN');
        
        document.getElementById('order-modal-title').textContent = `订单详情 - ${this.currentOrder.productType}`;
        document.getElementById('order-product-type').textContent = this.currentOrder.productType;
        document.getElementById('order-style').textContent = this.currentOrder.selectedStyle;
        document.getElementById('order-quantity').textContent = this.currentOrder.quantity;
        document.getElementById('order-total-price').textContent = `¥${this.currentOrder.totalPrice}`;
        document.getElementById('order-status').textContent = status.text;
        document.getElementById('order-create-time').textContent = date;
    }

    reorder(orderId) {
        const order = this.orders.find(o => o.id == orderId);
        if (order) {
            // 将订单数据传递到设计页面
            localStorage.setItem('currentReorder', JSON.stringify(order));
            if (window.navigationManager) {
                window.navigationManager.navigateTo('sweets-designer.html');
            } else {
                window.location.href = 'sweets-designer.html';
            }
        }
    }

    cancelOrder(orderId) {
        if (!confirm('确定要取消这个订单吗？此操作不可撤销。')) {
            return;
        }
        
        const orderIndex = this.orders.findIndex(o => o.id == orderId);
        if (orderIndex !== -1) {
            this.orders[orderIndex].status = 'cancelled';
            this.filteredOrders = this.filteredOrders.map(o => 
                o.id == orderId ? { ...o, status: 'cancelled' } : o
            );
            
            // 保存到本地存储
            if (window.StorageUtils) {
                StorageUtils.saveOrders(this.orders);
            } else {
                localStorage.setItem('orders', JSON.stringify(this.orders));
            }
            
            if (this.currentOrder && this.currentOrder.id == orderId) {
                this.closeOrderModal();
            }
            
            this.renderOrders();
            this.showToast('订单已取消');
        }
    }
}

// 全局函数
let gallery;

function initializeGallery() {
    gallery = new SweetsGallery();
}

function closeModal() {
    if (gallery) {
        gallery.closeModal();
    }
}

function editDesign() {
    if (gallery && gallery.currentDesign) {
        gallery.editDesign(gallery.currentDesign.id);
    }
}

function exportDesign() {
    if (gallery) {
        gallery.exportDesign();
    }
}

function deleteDesign() {
    if (gallery && gallery.currentDesign) {
        gallery.deleteDesign(gallery.currentDesign.id);
    }
}

function closeOrderModal() {
    if (gallery) {
        gallery.closeOrderModal();
    }
}

function reorder() {
    if (gallery && gallery.currentOrder) {
        gallery.reorder(gallery.currentOrder.id);
    }
}

function cancelOrder() {
    if (gallery && gallery.currentOrder) {
        gallery.cancelOrder(gallery.currentOrder.id);
    }
}

function refreshData() {
    if (gallery) {
        gallery.loadDesigns();
        gallery.loadOrders();
        gallery.renderContent();
        gallery.showToast('数据已刷新');
    }
}

function useDesign() {
    if (gallery && gallery.currentDesign) {
        // 将设计数据传递到定制页面
        localStorage.setItem('currentUseDesign', JSON.stringify(gallery.currentDesign));
        if (window.navigationManager) {
            window.navigationManager.navigateTo('customize.html');
        } else {
            window.location.href = 'customize.html';
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeGallery);