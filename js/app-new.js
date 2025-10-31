// 全局状态管理
const appState = {
    currentUser: null,
    designs: JSON.parse(localStorage.getItem('designs')) || [],
    users: JSON.parse(localStorage.getItem('users')) || {}
};

// 页面初始化
function initializeApp() {
    console.log('开始初始化应用...');
    initApp();
    setupEventListeners();
    checkLoginStatus();
    console.log('应用初始化完成');
}

// 确保DOM完全加载后初始化
document.addEventListener('DOMContentLoaded', initializeApp);

// 如果DOM已经加载完成，立即初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// 初始化应用
function initApp() {
    // 检查是否有保存的用户登录状态
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        appState.currentUser = JSON.parse(savedUser);
    }
}

// 设置事件监听器
function setupEventListeners() {
    console.log('开始设置事件监听器...');
    
    // 只在main.html页面中设置导航事件
    if (window.location.pathname.includes('main.html') || document.querySelector('.nav-item')) {
        // 顶部导航菜单点击事件
        const navItems = document.querySelectorAll('.nav-item');
        console.log('找到顶部导航项数量:', navItems.length);
        
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                console.log('点击顶部导航:', this.getAttribute('data-page'));
                const page = this.getAttribute('data-page');
                navigateToPage(page);
            });
        });

        // 侧边栏菜单点击事件
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        console.log('找到侧边栏项数量:', sidebarItems.length);
        
        sidebarItems.forEach(item => {
            item.addEventListener('click', function() {
                console.log('点击侧边栏:', this.getAttribute('data-page'));
                const page = this.getAttribute('data-page');
                navigateToPage(page);
            });
        });
    }
    
    // 登录标签页切换（适用于登录页面）
    const tabBtns = document.querySelectorAll('.tab-btn');
    console.log('找到标签页按钮数量:', tabBtns.length);
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('点击标签页:', this.getAttribute('data-tab'));
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    // 获取验证码按钮
    const smsBtn = document.getElementById('get-sms');
    console.log('找到验证码按钮:', !!smsBtn);
    if (smsBtn) {
        smsBtn.addEventListener('click', function() {
            console.log('点击获取验证码按钮');
            getSMSCode();
        });
    }

    // 登录按钮
    const phoneLoginBtn = document.getElementById('phone-login-btn');
    console.log('找到手机登录按钮:', !!phoneLoginBtn);
    if (phoneLoginBtn) {
        phoneLoginBtn.addEventListener('click', function() {
            console.log('点击手机登录按钮');
            loginWithPhone();
        });
    }

    const emailLoginBtn = document.getElementById('email-login-btn');
    console.log('找到邮箱登录按钮:', !!emailLoginBtn);
    if (emailLoginBtn) {
        emailLoginBtn.addEventListener('click', function() {
            console.log('点击邮箱登录按钮');
            loginWithEmail();
        });
    }

    const wechatLoginBtn = document.getElementById('wechat-login-btn');
    console.log('找到微信登录按钮:', !!wechatLoginBtn);
    if (wechatLoginBtn) {
        wechatLoginBtn.addEventListener('click', function() {
            console.log('点击微信登录按钮');
            loginWithWechat();
        });
    }

    // 输入框实时验证
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            console.log('手机号输入:', this.value);
            validatePhone();
        });
    }
    
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            console.log('邮箱输入:', this.value);
            validateEmail();
        });
    }
    
    console.log('事件监听器设置完成');
}

// 检查登录状态
function checkLoginStatus() {
    if (appState.currentUser) {
        showMainPage();
    } else {
        showLoginPage();
    }
}

// 显示登录页面
function showLoginPage() {
    const loginPage = document.getElementById('login-page');
    const mainPage = document.getElementById('main-page');
    
    if (loginPage) loginPage.classList.add('active');
    if (mainPage) mainPage.classList.remove('active');
}

// 显示主页面
function showMainPage() {
    const loginPage = document.getElementById('login-page');
    const mainPage = document.getElementById('main-page');
    
    if (loginPage) loginPage.classList.remove('active');
    if (mainPage) mainPage.classList.add('active');
    
    updateUserInfo();
    loadDesigns();
}

// 页面导航功能
function navigateToPage(page) {
    console.log('导航到页面:', page);
    
    // 检查是否在main.html页面中
    if (window.location.pathname.includes('main.html') || document.querySelector('.page-content')) {
        // 单页面应用导航：在main.html内部切换页面
        
        // 隐藏所有页面内容
        document.querySelectorAll('.page-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // 显示目标页面
        const targetPage = document.getElementById(page + '-page');
        if (targetPage) {
            targetPage.classList.add('active');
            console.log('显示页面:', page + '-page');
            
            // 根据页面类型加载相应数据
            if (page === 'orders') {
                loadOrders();
            } else if (page === 'designs') {
                loadDesigns();
            } else if (page === 'sweets-gallery') {
                // 如果是作品库页面，确保数据已加载
                setTimeout(() => {
                    if (window.gallery) {
                        window.gallery.loadDesigns();
                        window.gallery.renderDesigns();
                    }
                }, 100);
            }
        } else {
            console.warn('未找到页面:', page + '-page');
        }
        
        // 更新导航激活状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
        const sidebarItem = document.querySelector(`.sidebar-item[data-page="${page}"]`);
        
        if (navItem) {
            navItem.classList.add('active');
            console.log('激活顶部导航:', page);
        }
        if (sidebarItem) {
            sidebarItem.classList.add('active');
            console.log('激活侧边栏:', page);
        }
    } else {
        // 页面跳转导航：跳转到其他页面
        console.log('执行页面跳转到:', page);
        
        // 如果导航管理器可用，使用统一导航
        if (window.navigationManager) {
            window.navigationManager.navigateTo(`${page}.html`);
        } else {
            // 降级处理：直接跳转
            window.location.href = `${page}.html`;
        }
    }
}

// 标签页切换功能
function switchTab(tab) {
    console.log('切换到标签页:', tab);
    
    // 更新按钮状态
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    // 根据标签页加载相应数据
    if (tab === 'designs') {
        loadDesigns();
    } else if (tab === 'orders') {
        loadOrders();
    }
}

// 查看设计详情
function viewDesign(index) {
    console.log('查看设计:', index);
    
    // 从本地存储加载设计数据
    const sweetsDesigns = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
    const designs = JSON.parse(localStorage.getItem('designs')) || [];
    const allDesigns = [...sweetsDesigns, ...designs];
    
    if (index >= 0 && index < allDesigns.length) {
        const design = allDesigns[index];
        showToast(`查看设计: ${design.name || design.designName || '未命名设计'}`);
        
        // 这里可以跳转到设计详情页面或显示模态框
        // 暂时使用简单的提示
    } else {
        showToast('设计不存在');
    }
}

// 编辑设计
function editDesign(index) {
    console.log('编辑设计:', index);
    
    // 从本地存储加载设计数据
    const sweetsDesigns = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
    const designs = JSON.parse(localStorage.getItem('designs')) || [];
    const allDesigns = [...sweetsDesigns, ...designs];
    
    if (index >= 0 && index < allDesigns.length) {
        const design = allDesigns[index];
        showToast(`编辑设计: ${design.name || design.designName || '未命名设计'}`);
        
        // 跳转到设计器页面，携带设计数据
        if (window.navigationManager) {
            window.navigationManager.navigateTo(`sweets-designer.html?edit=${index}`);
        } else {
            window.location.href = `sweets-designer.html?edit=${index}`;
        }
    } else {
        showToast('设计不存在');
    }
}

// 删除设计
function deleteDesign(index) {
    console.log('删除设计:', index);
    
    if (confirm('确定要删除这个设计吗？')) {
        // 从本地存储加载设计数据
        const sweetsDesigns = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
        const designs = JSON.parse(localStorage.getItem('designs')) || [];
        
        // 根据索引删除对应的设计
        if (index < sweetsDesigns.length) {
            sweetsDesigns.splice(index, 1);
            localStorage.setItem('sweetsDesigns', JSON.stringify(sweetsDesigns));
        } else {
            const designIndex = index - sweetsDesigns.length;
            if (designIndex < designs.length) {
                designs.splice(designIndex, 1);
                localStorage.setItem('designs', JSON.stringify(designs));
            }
        }
        
        showToast('设计已删除');
        
        // 重新加载设计列表
        loadDesigns();
    }
}



// 关闭订单详情模态框
function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// 重新下单
function reorder(orderId) {
    console.log('重新下单:', orderId);
    
    // 从本地存储加载订单数据
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId || o.order_id === orderId);
    
    if (order) {
        // 将订单数据保存为重新下单数据
        localStorage.setItem('currentReorder', JSON.stringify(order));
        showToast('正在跳转到设计页面...');
        
        // 跳转到设计页面
        setTimeout(() => {
            if (window.navigationManager) {
                window.navigationManager.navigateTo('sweets-designer.html');
            } else {
                window.location.href = 'sweets-designer.html';
            }
        }, 1000);
    } else {
        showToast('订单不存在');
    }
}

// 查看订单详情
function viewOrder(orderId) {
    console.log('查看订单详情:', orderId);
    
    // 获取订单数据
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId || o.order_id === orderId);
    
    if (!order) {
        showToast('订单不存在');
        return;
    }
    
    // 显示订单详情模态框
    const modal = document.getElementById('order-modal');
    const modalTitle = document.getElementById('order-modal-title');
    const productType = document.getElementById('order-product-type');
    const orderStyle = document.getElementById('order-style');
    const orderQuantity = document.getElementById('order-quantity');
    const orderTotalPrice = document.getElementById('order-total-price');
    const orderStatus = document.getElementById('order-status');
    const orderCreateTime = document.getElementById('order-create-time');
    
    if (modal && modalTitle) {
        modalTitle.textContent = `订单详情 - ${orderId}`;
        productType.textContent = order.product_type || order.productType || '未知';
        orderStyle.textContent = order.selected_style || order.selectedStyle || '默认';
        orderQuantity.textContent = order.quantity || 1;
        orderTotalPrice.textContent = `¥${order.total_price || order.totalPrice || 0}`;
        
        // 状态显示
        const statusMap = {
            'pending': '待处理',
            'completed': '已完成',
            'cancelled': '已取消'
        };
        orderStatus.textContent = statusMap[order.status] || '未知状态';
        
        // 格式化时间
        const createTime = order.created_at || order.createTime;
        orderCreateTime.textContent = createTime ? new Date(createTime).toLocaleString('zh-CN') : '未知时间';
        
        modal.classList.add('show');
    } else {
        showToast(`查看订单: ${orderId}`);
    }
}

// 重新下单
function reorder(orderId) {
    console.log('重新下单:', orderId);
    
    // 获取订单数据
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId || o.order_id === orderId);
    
    if (!order) {
        showToast('订单不存在');
        return;
    }
    
    // 创建新订单（复制原订单信息）
    const newOrder = {
        id: 'order_' + Date.now(),
        user_id: order.user_id || order.userId,
        product_type: order.product_type || order.productType,
        selected_style: order.selected_style || order.selectedStyle,
        quantity: order.quantity || 1,
        total_price: order.total_price || order.totalPrice,
        status: 'pending',
        created_at: new Date().toISOString(),
        custom_text: order.custom_text || order.customText,
        selected_packaging: order.selected_packaging || order.selectedPackaging
    };
    
    // 保存新订单
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    showToast('重新下单成功！');
    
    // 重新加载订单列表
    loadOrders();
    
    // 关闭模态框
    closeOrderModal();
}

// 取消订单
function cancelOrder(orderId) {
    console.log('取消订单:', orderId);
    
    if (confirm('确定要取消这个订单吗？')) {
        // 获取订单数据
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const orderIndex = orders.findIndex(o => o.id === orderId || o.order_id === orderId);
        
        if (orderIndex === -1) {
            showToast('订单不存在');
            return;
        }
        
        // 更新订单状态为已取消
        orders[orderIndex].status = 'cancelled';
        orders[orderIndex].updated_at = new Date().toISOString();
        
        // 保存更新
        localStorage.setItem('orders', JSON.stringify(orders));
        
        showToast('订单已取消');
        
        // 重新加载订单列表
        loadOrders();
        
        // 关闭模态框
        closeOrderModal();
    }
}

// 关闭订单模态框
function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// 刷新数据
function refreshData() {
    console.log('刷新数据');
    
    // 获取当前激活的标签页
    const activeTabBtn = document.querySelector('.tab-btn.active');
    if (activeTabBtn) {
        const activeTab = activeTabBtn.getAttribute('data-tab');
        if (activeTab === 'designs') {
            loadDesigns();
        } else if (activeTab === 'orders') {
            loadOrders();
        }
    }
    
    showToast('数据已刷新');
}

// 切换登录标签页
function switchTab(tab) {
    // 更新按钮状态
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    // 更新内容显示
    const tabContents = document.querySelectorAll('.tab-content');
    if (tabContents.length > 0) {
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(`${tab}-tab`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }
}

// 标签页切换功能
function switchTab(tab) {
    console.log('切换到标签页:', tab);
    
    // 更新按钮状态
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    // 根据标签页加载相应数据
    if (tab === 'designs') {
        loadDesigns();
    } else if (tab === 'orders') {
        loadOrders();
    }
}

// 查看设计详情
function viewDesign(index) {
    console.log('查看设计:', index);
    
    // 从本地存储加载设计数据
    const sweetsDesigns = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
    const designs = JSON.parse(localStorage.getItem('designs')) || [];
    const allDesigns = [...sweetsDesigns, ...designs];
    
    if (index >= 0 && index < allDesigns.length) {
        const design = allDesigns[index];
        showToast(`查看设计: ${design.name || design.designName || '未命名设计'}`);
        
        // 这里可以跳转到设计详情页面或显示模态框
        // 暂时使用简单的提示
    } else {
        showToast('设计不存在');
    }
}

// 编辑设计
function editDesign(index) {
    console.log('编辑设计:', index);
    
    // 从本地存储加载设计数据
    const sweetsDesigns = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
    const designs = JSON.parse(localStorage.getItem('designs')) || [];
    const allDesigns = [...sweetsDesigns, ...designs];
    
    if (index >= 0 && index < allDesigns.length) {
        const design = allDesigns[index];
        showToast(`编辑设计: ${design.name || design.designName || '未命名设计'}`);
        
        // 跳转到设计器页面，携带设计数据
        if (window.navigationManager) {
            window.navigationManager.navigateTo(`sweets-designer.html?edit=${index}`);
        } else {
            window.location.href = `sweets-designer.html?edit=${index}`;
        }
    } else {
        showToast('设计不存在');
    }
}

// 删除设计
function deleteDesign(index) {
    console.log('删除设计:', index);
    
    if (confirm('确定要删除这个设计吗？')) {
        // 从本地存储加载设计数据
        const sweetsDesigns = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
        const designs = JSON.parse(localStorage.getItem('designs')) || [];
        
        // 根据索引删除对应的设计
        if (index < sweetsDesigns.length) {
            sweetsDesigns.splice(index, 1);
            localStorage.setItem('sweetsDesigns', JSON.stringify(sweetsDesigns));
        } else {
            const designIndex = index - sweetsDesigns.length;
            if (designIndex < designs.length) {
                designs.splice(designIndex, 1);
                localStorage.setItem('designs', JSON.stringify(designs));
            }
        }
        
        showToast('设计已删除');
        
        // 重新加载设计列表
        loadDesigns();
    }
}



// 关闭订单详情模态框
function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// 重新下单
function reorder(orderId) {
    console.log('重新下单:', orderId);
    
    // 从本地存储加载订单数据
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId || o.order_id === orderId);
    
    if (order) {
        // 将订单数据保存为重新下单数据
        localStorage.setItem('currentReorder', JSON.stringify(order));
        showToast('正在跳转到设计页面...');
        
        // 跳转到设计页面
        setTimeout(() => {
            if (window.navigationManager) {
                window.navigationManager.navigateTo('sweets-designer.html');
            } else {
                window.location.href = 'sweets-designer.html';
            }
        }, 1000);
    } else {
        showToast('订单不存在');
    }
}

// 查看订单详情
function viewOrder(orderId) {
    console.log('查看订单详情:', orderId);
    
    // 获取订单数据
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId || o.order_id === orderId);
    
    if (!order) {
        showToast('订单不存在');
        return;
    }
    
    // 显示订单详情模态框
    const modal = document.getElementById('order-modal');
    const modalTitle = document.getElementById('order-modal-title');
    const productType = document.getElementById('order-product-type');
    const orderStyle = document.getElementById('order-style');
    const orderQuantity = document.getElementById('order-quantity');
    const orderTotalPrice = document.getElementById('order-total-price');
    const orderStatus = document.getElementById('order-status');
    const orderCreateTime = document.getElementById('order-create-time');
    
    if (modal && modalTitle) {
        modalTitle.textContent = `订单详情 - ${orderId}`;
        productType.textContent = order.product_type || order.productType || '未知';
        orderStyle.textContent = order.selected_style || order.selectedStyle || '默认';
        orderQuantity.textContent = order.quantity || 1;
        orderTotalPrice.textContent = `¥${order.total_price || order.totalPrice || 0}`;
        
        // 状态显示
        const statusMap = {
            'pending': '待处理',
            'completed': '已完成',
            'cancelled': '已取消'
        };
        orderStatus.textContent = statusMap[order.status] || '未知状态';
        
        // 格式化时间
        const createTime = order.created_at || order.createTime;
        orderCreateTime.textContent = createTime ? new Date(createTime).toLocaleString('zh-CN') : '未知时间';
        
        modal.classList.add('show');
    } else {
        showToast(`查看订单: ${orderId}`);
    }
}

// 重新下单
function reorder(orderId) {
    console.log('重新下单:', orderId);
    
    // 获取订单数据
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId || o.order_id === orderId);
    
    if (!order) {
        showToast('订单不存在');
        return;
    }
    
    // 创建新订单（复制原订单信息）
    const newOrder = {
        id: 'order_' + Date.now(),
        user_id: order.user_id || order.userId,
        product_type: order.product_type || order.productType,
        selected_style: order.selected_style || order.selectedStyle,
        quantity: order.quantity || 1,
        total_price: order.total_price || order.totalPrice,
        status: 'pending',
        created_at: new Date().toISOString(),
        custom_text: order.custom_text || order.customText,
        selected_packaging: order.selected_packaging || order.selectedPackaging
    };
    
    // 保存新订单
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    showToast('重新下单成功！');
    
    // 重新加载订单列表
    loadOrders();
    
    // 关闭模态框
    closeOrderModal();
}

// 取消订单
function cancelOrder(orderId) {
    console.log('取消订单:', orderId);
    
    if (confirm('确定要取消这个订单吗？')) {
        // 获取订单数据
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const orderIndex = orders.findIndex(o => o.id === orderId || o.order_id === orderId);
        
        if (orderIndex === -1) {
            showToast('订单不存在');
            return;
        }
        
        // 更新订单状态为已取消
        orders[orderIndex].status = 'cancelled';
        orders[orderIndex].updated_at = new Date().toISOString();
        
        // 保存更新
        localStorage.setItem('orders', JSON.stringify(orders));
        
        showToast('订单已取消');
        
        // 重新加载订单列表
        loadOrders();
        
        // 关闭模态框
        closeOrderModal();
    }
}

// 关闭订单模态框
function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// 刷新数据
function refreshData() {
    console.log('刷新数据');
    
    // 获取当前激活的标签页
    const activeTabBtn = document.querySelector('.tab-btn.active');
    if (activeTabBtn) {
        const activeTab = activeTabBtn.getAttribute('data-tab');
        if (activeTab === 'designs') {
            loadDesigns();
        } else if (activeTab === 'orders') {
            loadOrders();
        }
    }
    
    showToast('数据已刷新');
}

// 手机号验证
function validatePhone() {
    const phone = document.getElementById('phone').value;
    const smsBtn = document.getElementById('get-sms');
    
    if (/^1[3-9]\d{9}$/.test(phone)) {
        smsBtn.disabled = false;
        return true;
    } else {
        smsBtn.disabled = true;
        return false;
    }
}

// 邮箱验证
function validateEmail() {
    const email = document.getElementById('email').value;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 获取短信验证码
function getSMSCode() {
    if (!validatePhone()) {
        showToast('请输入正确的手机号');
        return;
    }

    const phone = document.getElementById('phone').value;
    const smsBtn = document.getElementById('get-sms');
    
    // 模拟发送验证码
    smsBtn.disabled = true;
    smsBtn.textContent = '60秒后重试';
    
    let countdown = 60;
    const timer = setInterval(() => {
        countdown--;
        smsBtn.textContent = `${countdown}秒后重试`;
        
        if (countdown <= 0) {
            clearInterval(timer);
            smsBtn.disabled = false;
            smsBtn.textContent = '获取验证码';
        }
    }, 1000);
    
    // 模拟验证码发送成功
    setTimeout(() => {
        showToast('验证码已发送到您的手机');
    }, 1000);
}

// 手机号登录
function loginWithPhone() {
    const phone = document.getElementById('phone').value;
    const smsCode = document.getElementById('sms-code').value;
    
    if (!validatePhone()) {
        showToast('请输入正确的手机号');
        return;
    }
    
    if (!smsCode) {
        showToast('请输入验证码');
        return;
    }
    
    // 模拟登录验证
    if (smsCode === '123456') { // 测试用验证码
        const user = {
            id: generateUserId(),
            phone: phone,
            name: `用户${phone.slice(-4)}`,
            loginType: 'phone',
            loginTime: new Date().toISOString()
        };
        
        loginSuccess(user);
    } else {
        showToast('验证码错误，请重新输入');
    }
}

// 邮箱登录
function loginWithEmail() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('email-password').value;
    
    if (!validateEmail()) {
        showToast('请输入正确的邮箱地址');
        return;
    }
    
    if (!password) {
        showToast('请输入密码');
        return;
    }
    
    // 检查是否已注册
    if (appState.users[email]) {
        if (appState.users[email].password === password) {
            loginSuccess(appState.users[email]);
        } else {
            showToast('密码错误');
        }
    } else {
        // 新用户自动注册
        const user = {
            id: generateUserId(),
            email: email,
            name: email.split('@')[0],
            password: password,
            loginType: 'email',
            loginTime: new Date().toISOString()
        };
        
        // 保存用户信息
        appState.users[email] = user;
        localStorage.setItem('users', JSON.stringify(appState.users));
        
        loginSuccess(user);
    }
}

// 微信登录（模拟）
function loginWithWechat() {
    // 模拟微信登录过程
    setTimeout(() => {
        const user = {
            id: generateUserId(),
            name: '微信用户',
            loginType: 'wechat',
            loginTime: new Date().toISOString()
        };
        
        loginSuccess(user);
    }, 2000);
}

// 登录成功处理
function loginSuccess(user) {
    appState.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    showMainPage();
    showToast(`欢迎回来，${user.name}！`);
}

// 退出登录
function logout() {
    appState.currentUser = null;
    localStorage.removeItem('currentUser');
    
    showLoginPage();
    showToast('已退出登录');
}

// 更新用户信息显示
function updateUserInfo() {
    if (!appState.currentUser) return;
    
    const userName = document.getElementById('user-name');
    const profileName = document.getElementById('profile-name');
    const profilePhone = document.getElementById('profile-phone');
    const profileEmail = document.getElementById('profile-email');
    
    if (userName) userName.textContent = appState.currentUser.name;
    if (profileName) profileName.textContent = appState.currentUser.name;
    if (profilePhone) profilePhone.textContent = appState.currentUser.phone || '未绑定';
    if (profileEmail) profileEmail.textContent = appState.currentUser.email || '未绑定';
}

// 导航到定制页面
function navigateToCustomize(type) {
    // 如果导航管理器可用，使用统一导航
    if (window.navigationManager) {
        window.navigationManager.navigateTo(`customize.html?type=${type}`);
        return;
    }
    
    // 降级处理
    window.location.href = `customize.html?type=${type}`;
}

// 加载设计列表
function loadDesigns() {
    console.log('开始加载设计数据...');
    
    const designsGrid = document.getElementById('designs-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (!designsGrid) {
        console.error('未找到设计网格容器');
        return;
    }
    
    // 从本地存储加载设计数据（兼容两种存储键名）
    const sweetsDesigns = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
    const designs = JSON.parse(localStorage.getItem('designs')) || [];
    const allDesigns = [...sweetsDesigns, ...designs];
    
    console.log('从本地存储获取到的设计数据:', allDesigns);
    
    if (allDesigns.length === 0) {
        designsGrid.innerHTML = '';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <i class="fas fa-palette"></i>
                <h3>还没有设计作品</h3>
                <p>开始您的第一个甜点设计吧！</p>
                <button class="primary-btn" data-navigate="sweets-designer.html">
                    开始设计
                </button>
            `;
        }
        return;
    }
    
    // 隐藏空状态
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // 生成设计卡片HTML
    designsGrid.innerHTML = allDesigns.map((design, index) => {
        const designName = design.name || design.designName || '未命名设计';
        const createDate = design.createTime || design.created_at || design.date;
        const formattedDate = createDate ? new Date(createDate).toLocaleDateString('zh-CN') : '未知日期';
        const designType = design.type || design.dessertType || '甜点';
        const imageData = design.imageData || design.canvasData;
        
        return `
            <div class="design-card">
                <div class="design-image">
                    ${imageData ? 
                        `<img src="${imageData}" alt="${designName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` :
                        `<i class="fas fa-image" style="font-size: 32px; color: #999;"></i>`
                    }
                </div>
                <div class="design-info">
                    <div class="design-title">${designName}</div>
                    <div class="design-meta">
                        <span class="design-type">${designType}</span>
                        <span class="design-date">${formattedDate}</span>
                    </div>
                    <div class="design-actions">
                        <button class="primary" onclick="viewDesign(${index})">查看</button>
                        <button class="secondary" onclick="editDesign(${index})">编辑</button>
                        <button class="danger" onclick="deleteDesign(${index})">删除</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('设计列表生成完成');
}

// 查看设计详情
function viewDesign(index) {
    const design = appState.designs[index];
    showToast(`查看设计: ${design.name}`);
    // 这里可以跳转到设计详情页面
}

// 生成用户ID
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 显示提示消息
function showToast(message) {
    // 创建或获取toast容器
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // 创建toast元素
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: #FF6B95;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // 3秒后自动移除
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 添加CSS动画
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// 加载订单数据
async function loadOrders() {
    console.log('开始加载订单数据...');
    
    const designsGrid = document.getElementById('designs-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (!designsGrid) {
        console.error('未找到设计网格容器');
        return;
    }
    
    // 获取当前用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        console.error('未找到当前用户信息');
        designsGrid.innerHTML = '';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <i class="fas fa-shopping-cart"></i>
                <h3>请先登录查看订单</h3>
                <p>登录后可以查看您的订单信息</p>
            `;
        }
        return;
    }
    
    try {
        // 使用Supabase获取用户订单
        let orders = [];
        
        if (document.supabase && document.supabase.orders) {
            orders = await document.supabase.orders.getUserOrders(currentUser.id);
            console.log('从Supabase获取到订单:', orders);
        } else {
            // 降级到本地存储
            const localOrders = JSON.parse(localStorage.getItem('orders')) || [];
            console.log('本地存储中的所有订单:', localOrders);
            orders = localOrders.filter(order => {
                const userId = order.userId || order.user_id;
                return userId === currentUser.id;
            });
            console.log('从本地存储获取到用户订单:', orders);
        }
        
        // 按创建时间排序（最新的在前）
        orders.sort((a, b) => {
            const dateA = new Date(a.created_at || a.createTime);
            const dateB = new Date(b.created_at || b.createTime);
            return dateB - dateA;
        });
        
        if (orders.length === 0) {
            designsGrid.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
                emptyState.innerHTML = `
                    <i class="fas fa-shopping-cart"></i>
                    <h3>还没有订单</h3>
                    <p>您还没有任何订单，快去定制您的专属甜点吧！</p>
                    <button class="primary-btn" data-navigate="customize.html">
                        <i class="fas fa-palette"></i> 开始定制
                    </button>
                `;
            }
            return;
        }
        
        // 隐藏空状态
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // 生成订单卡片HTML
        designsGrid.innerHTML = orders.map(order => {
            const orderId = order.id || order.order_id;
            const productType = order.product_type || order.productType;
            const selectedStyle = order.selected_style || order.selectedStyle;
            const quantity = order.quantity;
            const totalPrice = order.total_price || order.totalPrice;
            const status = order.status || 'pending';
            const createTime = order.created_at || order.createTime;
            const customText = order.custom_text || order.customText;
            const selectedPackaging = order.selected_packaging || order.selectedPackaging;
            
            // 格式化日期
            const createDate = new Date(createTime).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // 状态显示文本
            let statusText = '待处理';
            let statusClass = 'status-pending';
            
            if (status === 'completed') {
                statusText = '已完成';
                statusClass = 'status-completed';
            } else if (status === 'cancelled') {
                statusText = '已取消';
                statusClass = 'status-cancelled';
            }
            
            return `
                <div class="order-card">
                    <div class="order-image">
                        <i class="fas fa-shopping-bag" style="font-size: 32px; color: #999;"></i>
                    </div>
                    <div class="order-info">
                        <div class="order-title">订单号: ${orderId}</div>
                        <div class="order-meta">
                            <span class="order-type">${productType}</span>
                            <span class="order-status ${statusClass}">${statusText}</span>
                            <span class="order-date">${createDate}</span>
                        </div>
                        <div class="order-actions">
                            <button class="primary" onclick="viewOrder('${orderId}')">查看详情</button>
                            <button class="secondary" onclick="reorder('${orderId}')">重新下单</button>
                            <button class="danger" onclick="cancelOrder('${orderId}')">取消订单</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('订单列表生成完成');
        
    } catch (error) {
        console.error('加载订单失败:', error);
        designsGrid.innerHTML = '';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <h3>加载订单失败</h3>
                <p>请稍后重试</p>
            `;
        }
    }
}

// 标签页切换功能
function switchTab(tab) {
    console.log('切换到标签页:', tab);
    
    // 更新按钮状态
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    // 根据标签页加载相应数据
    if (tab === 'designs') {
        loadDesigns();
    } else if (tab === 'orders') {
        loadOrders();
    }
}

// 查看设计详情
function viewDesign(index) {
    console.log('查看设计:', index);
    
    // 从本地存储加载设计数据
    const sweetsDesigns = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
    const designs = JSON.parse(localStorage.getItem('designs')) || [];
    const allDesigns = [...sweetsDesigns, ...designs];
    
    if (index >= 0 && index < allDesigns.length) {
        const design = allDesigns[index];
        showToast(`查看设计: ${design.name || design.designName || '未命名设计'}`);
        
        // 这里可以跳转到设计详情页面或显示模态框
        // 暂时使用简单的提示
    } else {
        showToast('设计不存在');
    }
}

// 编辑设计
function editDesign(index) {
    console.log('编辑设计:', index);
    
    // 从本地存储加载设计数据
    const sweetsDesigns = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
    const designs = JSON.parse(localStorage.getItem('designs')) || [];
    const allDesigns = [...sweetsDesigns, ...designs];
    
    if (index >= 0 && index < allDesigns.length) {
        const design = allDesigns[index];
        showToast(`编辑设计: ${design.name || design.designName || '未命名设计'}`);
        
        // 跳转到设计器页面，携带设计数据
        if (window.navigationManager) {
            window.navigationManager.navigateTo(`sweets-designer.html?edit=${index}`);
        } else {
            window.location.href = `sweets-designer.html?edit=${index}`;
        }
    } else {
        showToast('设计不存在');
    }
}

// 删除设计
function deleteDesign(index) {
    console.log('删除设计:', index);
    
    if (confirm('确定要删除这个设计吗？')) {
        // 从本地存储加载设计数据
        const sweetsDesigns = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
        const designs = JSON.parse(localStorage.getItem('designs')) || [];
        
        // 根据索引删除对应的设计
        if (index < sweetsDesigns.length) {
            sweetsDesigns.splice(index, 1);
            localStorage.setItem('sweetsDesigns', JSON.stringify(sweetsDesigns));
        } else {
            const designIndex = index - sweetsDesigns.length;
            if (designIndex < designs.length) {
                designs.splice(designIndex, 1);
                localStorage.setItem('designs', JSON.stringify(designs));
            }
        }
        
        showToast('设计已删除');
        
        // 重新加载设计列表
        loadDesigns();
    }
}



// 关闭订单详情模态框
function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// 重新下单
function reorder(orderId) {
    console.log('重新下单:', orderId);
    
    // 从本地存储加载订单数据
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId || o.order_id === orderId);
    
    if (order) {
        // 将订单数据保存为重新下单数据
        localStorage.setItem('currentReorder', JSON.stringify(order));
        showToast('正在跳转到设计页面...');
        
        // 跳转到设计页面
        setTimeout(() => {
            if (window.navigationManager) {
                window.navigationManager.navigateTo('sweets-designer.html');
            } else {
                window.location.href = 'sweets-designer.html';
            }
        }, 1000);
    } else {
        showToast('订单不存在');
    }
}

// 查看订单详情
function viewOrder(orderId) {
    console.log('查看订单详情:', orderId);
    
    // 获取订单数据
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId || o.order_id === orderId);
    
    if (!order) {
        showToast('订单不存在');
        return;
    }
    
    // 显示订单详情模态框
    const modal = document.getElementById('order-modal');
    const modalTitle = document.getElementById('order-modal-title');
    const productType = document.getElementById('order-product-type');
    const orderStyle = document.getElementById('order-style');
    const orderQuantity = document.getElementById('order-quantity');
    const orderTotalPrice = document.getElementById('order-total-price');
    const orderStatus = document.getElementById('order-status');
    const orderCreateTime = document.getElementById('order-create-time');
    
    if (modal && modalTitle) {
        modalTitle.textContent = `订单详情 - ${orderId}`;
        productType.textContent = order.product_type || order.productType || '未知';
        orderStyle.textContent = order.selected_style || order.selectedStyle || '默认';
        orderQuantity.textContent = order.quantity || 1;
        orderTotalPrice.textContent = `¥${order.total_price || order.totalPrice || 0}`;
        
        // 状态显示
        const statusMap = {
            'pending': '待处理',
            'completed': '已完成',
            'cancelled': '已取消'
        };
        orderStatus.textContent = statusMap[order.status] || '未知状态';
        
        // 格式化时间
        const createTime = order.created_at || order.createTime;
        orderCreateTime.textContent = createTime ? new Date(createTime).toLocaleString('zh-CN') : '未知时间';
        
        modal.classList.add('show');
    } else {
        showToast(`查看订单: ${orderId}`);
    }
}

// 重新下单
function reorder(orderId) {
    console.log('重新下单:', orderId);
    
    // 获取订单数据
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId || o.order_id === orderId);
    
    if (!order) {
        showToast('订单不存在');
        return;
    }
    
    // 创建新订单（复制原订单信息）
    const newOrder = {
        id: 'order_' + Date.now(),
        user_id: order.user_id || order.userId,
        product_type: order.product_type || order.productType,
        selected_style: order.selected_style || order.selectedStyle,
        quantity: order.quantity || 1,
        total_price: order.total_price || order.totalPrice,
        status: 'pending',
        created_at: new Date().toISOString(),
        custom_text: order.custom_text || order.customText,
        selected_packaging: order.selected_packaging || order.selectedPackaging
    };
    
    // 保存新订单
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    showToast('重新下单成功！');
    
    // 重新加载订单列表
    loadOrders();
    
    // 关闭模态框
    closeOrderModal();
}

// 取消订单
function cancelOrder(orderId) {
    console.log('取消订单:', orderId);
    
    if (confirm('确定要取消这个订单吗？')) {
        // 获取订单数据
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const orderIndex = orders.findIndex(o => o.id === orderId || o.order_id === orderId);
        
        if (orderIndex === -1) {
            showToast('订单不存在');
            return;
        }
        
        // 更新订单状态为已取消
        orders[orderIndex].status = 'cancelled';
        orders[orderIndex].updated_at = new Date().toISOString();
        
        // 保存更新
        localStorage.setItem('orders', JSON.stringify(orders));
        
        showToast('订单已取消');
        
        // 重新加载订单列表
        loadOrders();
        
        // 关闭模态框
        closeOrderModal();
    }
}

// 关闭订单模态框
function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// 刷新数据
function refreshData() {
    console.log('刷新数据');
    
    // 获取当前激活的标签页
    const activeTabBtn = document.querySelector('.tab-btn.active');
    if (activeTabBtn) {
        const activeTab = activeTabBtn.getAttribute('data-tab');
        if (activeTab === 'designs') {
            loadDesigns();
        } else if (activeTab === 'orders') {
            loadOrders();
        }
    }
    
    showToast('数据已刷新');
}