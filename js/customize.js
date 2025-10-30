// 定制页面状态管理
const customizeState = {
    currentStep: 1,
    productType: 'chocolate',
    selectedStyle: null,
    flavorIndex: 0,
    customText: '',
    quantity: 1,
    selectedPackaging: null,
    designType: 'text',
    designImage: null,
    
    // 产品数据
    dataMap: {
        chocolate: {
            styles: [
                { id: 1, emoji: '🍫', name: '基础巧克力', price: 88 },
                { id: 2, emoji: '🍩', name: '夹心巧克力', price: 108 },
                { id: 3, emoji: '🍮', name: '造型巧克力', price: 128 }
            ],
            flavors: ['黑巧克力', '牛奶巧克力', '白巧克力', '坚果巧克力'],
            packaging: [
                { id: 1, emoji: '🎁', name: '精美礼盒', price: 30 },
                { id: 2, emoji: '📦', name: '普通包装', price: 0 }
            ]
        }
    }
};

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    initCustomizePage();
    setupCustomizeEventListeners();
    checkDesignResult();
});

// 初始化定制页面
function initCustomizePage() {
    // 从URL参数获取产品类型，默认使用chocolate
    const urlParams = new URLSearchParams(window.location.search);
    const productType = urlParams.get('type') || 'chocolate';
    
    // 强制使用chocolate类型
    customizeState.productType = 'chocolate';
    updateProductTypeDisplay();
    initData();
    renderStep1();
    updateStepIndicator();
}

// 设置事件监听器
function setupCustomizeEventListeners() {
    // 设计选项切换
    document.querySelectorAll('.design-option').forEach(option => {
        option.addEventListener('click', function() {
            const designType = this.getAttribute('data-type');
            setDesignType(designType);
        });
    });
    
    // 定制文字输入
    document.getElementById('custom-text')?.addEventListener('input', function() {
        customizeState.customText = this.value;
    });
    
    // 口味选择
    document.getElementById('flavor-select')?.addEventListener('change', function() {
        customizeState.flavorIndex = parseInt(this.value);
    });
}

// 更新产品类型显示
function updateProductTypeDisplay() {
    const productTypeElement = document.getElementById('product-type');
    const pageTitle = document.getElementById('page-title');
    
    const typeName = '巧克力';
    
    if (productTypeElement) {
        productTypeElement.textContent = typeName;
    }
    
    if (pageTitle) {
        pageTitle.textContent = `${typeName}定制`;
    }
}

// 初始化数据
function initData() {
    const data = customizeState.dataMap.chocolate;
    
    // 设置默认选择
    if (data.styles.length > 0) {
        customizeState.selectedStyle = data.styles[0].id;
    }
    if (data.packaging.length > 1) {
        customizeState.selectedPackaging = data.packaging[1].id;
    } else if (data.packaging.length > 0) {
        customizeState.selectedPackaging = data.packaging[0].id;
    }
}

// 更新步骤指示器
function updateStepIndicator() {
    // 更新步骤数字
    document.getElementById('step-indicator').textContent = `步骤 ${customizeState.currentStep}/4`;
    
    // 更新步骤激活状态
    document.querySelectorAll('.step-item').forEach((item, index) => {
        const stepNumber = index + 1;
        if (stepNumber <= customizeState.currentStep) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// 渲染步骤1：选择样式
function renderStep1() {
    const styleList = document.getElementById('style-list');
    const data = customizeState.dataMap.chocolate;
    
    styleList.innerHTML = data.styles.map(style => `
        <div class="style-item ${customizeState.selectedStyle === style.id ? 'selected' : ''}" 
             onclick="selectStyle(${style.id})">
            <div class="style-emoji">${style.emoji}</div>
            <span class="style-name">${style.name}</span>
            <span class="style-price">¥${style.price}</span>
        </div>
    `).join('');
}

// 选择样式
function selectStyle(styleId) {
    customizeState.selectedStyle = styleId;
    renderStep1();
    
    // 显示选中效果
    showToast('样式选择成功');
}

// 打开甜点设计器
function openSweetsDesigner() {
    // 保存当前定制状态
    localStorage.setItem('customizeState', JSON.stringify(customizeState));
    
    // 跳转到甜点设计器页面
    window.location.href = 'sweets-designer.html';
}

// 检查设计结果
function checkDesignResult() {
    const savedDesign = localStorage.getItem('sweetsDesignResult');
    
    if (savedDesign) {
        try {
            const designData = JSON.parse(savedDesign);
            
            // 更新定制状态
            customizeState.designImage = designData.imageData;
            customizeState.designData = designData;
            
            // 更新预览显示
            updateDesignPreview();
            
            // 清除存储的设计结果
            localStorage.removeItem('sweetsDesignResult');
            
            showToast('设计已加载完成！');
        } catch (error) {
            console.error('解析设计数据失败:', error);
        }
    }
}

// 渲染步骤2：甜点设计器
function renderStep2() {
    // 检查是否有设计数据
    if (customizeState.designData) {
        updateDesignPreview();
    }
}

// 渲染步骤3：选择包装
function renderStep3() {
    const packagingList = document.getElementById('packaging-list');
    const data = customizeState.dataMap[customizeState.productType] || customizeState.dataMap.candy;
    
    packagingList.innerHTML = data.packaging.map(packaging => `
        <div class="packaging-item ${customizeState.selectedPackaging === packaging.id ? 'selected' : ''}" 
             onclick="selectPackaging(${packaging.id})">
            <div class="packaging-emoji">${packaging.emoji}</div>
            <span class="packaging-name">${packaging.name}</span>
            <span class="packaging-price">${packaging.price > 0 ? '¥' + packaging.price : '免费'}</span>
        </div>
    `).join('');
}

// 选择包装
function selectPackaging(packagingId) {
    customizeState.selectedPackaging = packagingId;
    renderStep3();
    showToast('包装选择成功');
}

// 改变数量
function changeQuantity(delta) {
    const newQuantity = customizeState.quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 10) {
        customizeState.quantity = newQuantity;
        document.getElementById('quantity').textContent = newQuantity;
    }
}

// 下一步
function nextStep() {
    if (customizeState.currentStep < 4) {
        customizeState.currentStep++;
        updateStepIndicator();
        showCurrentStep();
    }
}

// 上一步
function prevStep() {
    if (customizeState.currentStep > 1) {
        customizeState.currentStep--;
        updateStepIndicator();
        showCurrentStep();
    }
}

// 显示当前步骤
function showCurrentStep() {
    // 隐藏所有步骤内容
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 显示当前步骤内容
    const currentStepElement = document.getElementById(`step-${customizeState.currentStep}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
    
    // 根据步骤渲染内容
    switch (customizeState.currentStep) {
        case 1:
            renderStep1();
            break;
        case 2:
            renderStep2();
            break;
        case 3:
            renderStep3();
            break;
        case 4:
            renderStep4();
            break;
    }
}

// 渲染步骤4：确认订单
function renderStep4() {
    const data = customizeState.dataMap[customizeState.productType] || customizeState.dataMap.candy;
    const selectedStyle = data.styles.find(style => style.id === customizeState.selectedStyle);
    const selectedPackaging = data.packaging.find(pkg => pkg.id === customizeState.selectedPackaging);
    
    // 计算总价
    const basePrice = selectedStyle ? selectedStyle.price : 0;
    const packagingPrice = selectedPackaging ? selectedPackaging.price : 0;
    const totalPrice = (basePrice + packagingPrice) * customizeState.quantity;
    
    // 更新订单摘要
    document.getElementById('summary-product-type').textContent = 
        customizeState.productType === 'candy' ? '糖果' : 
        customizeState.productType === 'cookie' ? '曲奇' : '巧克力';
    
    document.getElementById('summary-style').textContent = 
        selectedStyle ? selectedStyle.name : '未选择';
    
    document.getElementById('summary-flavor').textContent = 
        data.flavors[customizeState.flavorIndex] || '未选择';
    
    document.getElementById('summary-custom-text').textContent = 
        customizeState.designData ? '已设计' : '无';
    
    document.getElementById('summary-quantity').textContent = 
        customizeState.quantity + '份';
    
    document.getElementById('summary-packaging').textContent = 
        selectedPackaging ? selectedPackaging.name : '未选择';
    
    document.getElementById('summary-total-price').textContent = 
        '¥' + totalPrice;
}

// 更新设计预览
function updateDesignPreview() {
    const previewArea = document.getElementById('design-preview-area');
    const designInfo = document.getElementById('design-info');
    
    if (customizeState.designData) {
        // 显示设计预览
        previewArea.innerHTML = `
            <div class="design-preview-content">
                <div class="preview-image">
                    <img src="${customizeState.designImage}" alt="设计预览" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                </div>
                <div class="preview-actions">
                    <button class="btn secondary-btn" onclick="openSweetsDesigner()">
                        <i class="fas fa-edit"></i> 修改设计
                    </button>
                    <button class="btn danger-btn" onclick="clearDesign()">
                        <i class="fas fa-trash"></i> 清除设计
                    </button>
                </div>
            </div>
        `;
        
        // 显示设计信息
        designInfo.style.display = 'block';
        document.getElementById('info-dessert-type').textContent = customizeState.designData.dessertType || '糖果';
        document.getElementById('info-shape').textContent = customizeState.designData.shape || '圆形';
        document.getElementById('info-size').textContent = customizeState.designData.size || 'M';
        document.getElementById('info-status').textContent = '已完成';
    } else {
        // 显示空状态
        previewArea.innerHTML = `
            <div class="empty-preview">
                <i class="fas fa-palette fa-3x"></i>
                <p>尚未开始设计</p>
                <button class="btn primary-btn" onclick="openSweetsDesigner()">
                    开始设计
                </button>
            </div>
        `;
        
        // 隐藏设计信息
        designInfo.style.display = 'none';
    }
}

// 注意：使用全局对象 document.supabase

// 提交订单
async function submitOrder() {
    if (!customizeState.selectedStyle) {
        showToast('请先选择产品样式');
        return;
    }
    
    try {
        // 获取当前用户信息
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // 创建订单数据
        const orderData = {
            user_id: currentUser?.id || 'anonymous',
            product_type: customizeState.productType,
            selected_style: customizeState.selectedStyle,
            flavor_index: customizeState.flavorIndex,
            custom_text: customizeState.customText,
            quantity: customizeState.quantity,
            selected_packaging: customizeState.selectedPackaging,
            design_image: customizeState.designImage,
            total_price: calculateTotalPrice(),
            customer_info: {
                name: currentUser?.name || '',
                email: currentUser?.email || ''
            }
        };
        
        // 使用 document.supabase 创建订单
        const newOrder = document.supabase.orders.createOrder(orderData);
        
        if (newOrder) {
            // 保持向后兼容，同时保存到本地存储
            let localOrders = JSON.parse(localStorage.getItem('orders')) || [];
            localOrders.push({
                ...newOrder,
                id: newOrder.id || 'order_' + Date.now(),
                userId: newOrder.user_id,
                selectedStyle: newOrder.selected_style,
                flavorIndex: newOrder.flavor_index,
                customText: newOrder.custom_text,
                selectedPackaging: newOrder.selected_packaging,
                designImage: newOrder.design_image,
                createTime: newOrder.created_at || new Date().toISOString()
            });
            localStorage.setItem('orders', JSON.stringify(localOrders));
            
            showToast('订单提交成功！');
            
            // 2秒后返回主页
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 2000);
        } else {
            showToast('订单提交失败，请稍后重试');
        }
    } catch (error) {
        console.error('提交订单错误:', error);
        // 即使 Supabase 失败，仍然尝试保存到本地
        try {
            const fallbackOrder = {
                id: 'order_' + Date.now(),
                productType: customizeState.productType,
                selectedStyle: customizeState.selectedStyle,
                flavorIndex: customizeState.flavorIndex,
                customText: customizeState.customText,
                quantity: customizeState.quantity,
                selectedPackaging: customizeState.selectedPackaging,
                designImage: customizeState.designImage,
                createTime: new Date().toISOString(),
                status: 'pending'
            };
            
            let orders = JSON.parse(localStorage.getItem('orders')) || [];
            orders.push(fallbackOrder);
            localStorage.setItem('orders', JSON.stringify(orders));
            
            showToast('订单已保存到本地，网络恢复后将同步');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } catch (fallbackError) {
            showToast('订单保存失败，请检查网络连接');
        }
    }
}

// 改变数量
function changeQuantity(delta) {
    const newQuantity = customizeState.quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 100) {
        customizeState.quantity = newQuantity;
        document.getElementById('quantity').textContent = newQuantity;
    }
}

// 下一步
function nextStep() {
    if (!validateCurrentStep()) {
        return;
    }
    
    if (customizeState.currentStep < 4) {
        customizeState.currentStep++;
        showCurrentStep();
        updateStepIndicator();
    } else {
        submitOrder();
    }
}

// 上一步
function prevStep() {
    if (customizeState.currentStep > 1) {
        customizeState.currentStep--;
        showCurrentStep();
        updateStepIndicator();
    }
}

// 显示当前步骤
function showCurrentStep() {
    // 隐藏所有步骤内容
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 显示当前步骤内容
    const currentStepElement = document.getElementById(`step-${customizeState.currentStep}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
    
    // 根据步骤渲染内容
    switch (customizeState.currentStep) {
        case 1:
            renderStep1();
            break;
        case 2:
            renderStep2();
            break;
        case 3:
            renderStep3();
            break;
        case 4:
            renderStep4();
            break;
    }
}

// 验证当前步骤
function validateCurrentStep() {
    switch (customizeState.currentStep) {
        case 1:
            if (!customizeState.selectedStyle) {
                showToast('请先选择样式');
                return false;
            }
            break;
        case 2:
            if (!customizeState.designData) {
                showToast('请先完成甜点设计');
                return false;
            }
            break;
        case 3:
            if (!customizeState.selectedPackaging) {
                showToast('请选择包装');
                return false;
            }
            break;
    }
    return true;
}

// 计算总价
function calculateTotalPrice() {
    const data = customizeState.dataMap[customizeState.productType] || customizeState.dataMap.candy;
    const style = data.styles.find(s => s.id === customizeState.selectedStyle);
    const pack = data.packaging.find(p => p.id === customizeState.selectedPackaging);
    
    const stylePrice = style ? style.price : 0;
    const packPrice = pack ? pack.price : 0;
    
    return (stylePrice + packPrice) * customizeState.quantity;
}

// 清除设计
function clearDesign() {
    customizeState.designImage = null;
    customizeState.designData = null;
    updateDesignPreview();
    showToast('设计已清除');
}

// 检查设计结果
function checkDesignResult() {
    const savedDesign = localStorage.getItem('sweetsDesignResult');
    
    if (savedDesign) {
        try {
            const designData = JSON.parse(savedDesign);
            
            // 更新定制状态
            customizeState.designImage = designData.imageData;
            customizeState.designData = designData;
            
            // 更新预览显示
            updateDesignPreview();
            
            // 清除存储的设计结果
            localStorage.removeItem('sweetsDesignResult');
            
            showToast('设计已加载完成！');
        } catch (error) {
            console.error('解析设计数据失败:', error);
        }
    }
}

// 返回上一页
function goBack() {
    // 直接返回主页，不检查步骤
    window.location.href = 'main.html';
}

// 显示提示信息
function showToast(message) {
    // 检查是否在主应用中（主应用有toast-container）
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
        // 使用主应用的toast系统
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        // 3秒后自动移除
        setTimeout(() => {
            toast.remove();
        }, 3000);
    } else {
        // 简单的alert作为备用
        alert(message);
    }
}