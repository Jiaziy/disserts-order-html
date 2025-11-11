// 甜点设计平台 - 模块化实现

// 为NavigationManager提供的全局getState函数
window.getState = function() {
    return {};
};

class SweetsDesigner {
    constructor() {
        // DOM引用
        this.canvas = null;
        this.ctx = null;
        this.previewCanvas = null;
        this.previewCtx = null;
        this.backgroundCanvas = null;
        this.backgroundCtx = null;
        
        // 立即创建window.designer对象并添加getState方法
        window.designer = window.designer || {};
        window.designer.getState = function() {
            return {};
        };
        
        // 绘图状态
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.isRendering = false;
        this.points = []; // 存储点的数组，用于优化绘图
        
        // 设计参数
        this.currentColor = '#3D2314'; // 默认巧克力棕色
        this.brushSize = 5;
        this.dessertType = 'chocolate'; // 固定为巧克力类型
        this.canvasSize = { width: 1024, height: 768 };
        this.currentTool = 'brush';
        this.selectedShape = null;
        this.templateSelected = false; // 跟踪是否已选择模板
        this.previewZoomLevel = 1; // 预览画布的缩放级别
        
        // 图片相关状态
        this.uploadedImage = null; // 上传的图片对象
        this.imagePosition = { x: 0, y: 0 }; // 图片位置
        this.imageScale = 1.0; // 图片缩放比例
        this.isDragging = false; // 是否正在拖动图片
        this.dragOffset = { x: 0, y: 0 }; // 拖动偏移量
        this.imageConfirmed = false; // 图片是否已确认固定
        
        // 文本元素相关状态
        this.textElements = []; // 存储所有文本元素
        this.selectedTextElement = null; // 当前选中的文本元素
        this.isDraggingText = false; // 是否正在拖动文本
        
        // 历史记录
        this.history = [];
        this.historyIndex = 0;
        
        // 渲染优化状态变量
        this.lastBackgroundRendered = false; // 背景是否已渲染
        this.lastTemplateSelected = false;   // 上次模板选择状态
        
        // 初始化
        this.init();
    }


    /**
     * 初始化应用
     */
    init() {
        this.setupCanvas();
        
        // 确保画布比例正确，防止渲染变形
        this.ensureCanvasProportions();
        
        this.setupPreview();
        this.setupEventListeners();
        
        // 初始化历史记录（确保在updateUI之前已经有初始状态）
        if (this.ctx) {
            // 创建初始空白画布状态
            const initialState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.history = [initialState];
            this.historyIndex = 0;
            console.log('历史记录初始化完成，当前索引:', this.historyIndex, '历史记录数量:', this.history.length);
        }
        
        // 延迟加载设计数据，确保画布完全初始化
        setTimeout(() => {
            this.loadDesignFromStorage();
        }, 300);
        
        this.updateUI();
    }
    
/**
 * 从localStorage加载设计数据
 */
loadDesignFromStorage() {
    try {
        // 检查URL参数，看是否是编辑模式
        const urlParams = new URLSearchParams(window.location.search);
        const editIndex = urlParams.get('edit');
        
        if (editIndex !== null) {
            console.log('编辑模式，加载指定设计，索引:', editIndex);
            
            // 从本地存储加载设计数据
            const designs = window.StorageManager.getDesigns();
            
            if (editIndex >= 0 && editIndex < designs.length) {
                const design = designs[editIndex];
                console.log('找到要编辑的设计:', design.name || '未命名设计');
                
                // 设置编辑模式标识
                this.isEditMode = true;
                this.editIndex = parseInt(editIndex);
                
                // 加载设计数据
                this.loadDesign(design);
                console.log('编辑设计数据加载完成');
                return;
            } else {
                console.error('指定的设计索引不存在:', editIndex);
            }
        }
        
        // 检查是否有待编辑的设计（从我的设计页面）
        const savedDesign = localStorage.getItem('currentEditDesign');
        if (savedDesign) {
            console.log('发现待编辑的设计数据:', savedDesign.substring(0, 100) + '...');
            const design = JSON.parse(savedDesign);
            this.loadDesign(design);
            
            // 加载后清除临时存储，避免重复加载
            localStorage.removeItem('currentEditDesign');
            console.log('设计数据加载完成并已清除临时存储');
            return;
        }
        
        // 检查是否有重新下单的设计（从我的订单页面）
        const reorderDesign = localStorage.getItem('currentReorder');
        if (reorderDesign) {
            console.log('发现重新下单的设计数据:', reorderDesign.substring(0, 100) + '...');
            const order = JSON.parse(reorderDesign);
            
            // 从订单数据中提取设计信息
            const design = {
                id: order.id,
                name: `${order.productType} - ${order.selectedStyle}`,
                type: 'chocolate',
                shape: this.extractShapeFromOrder(order),
                data: order.designImage || '',
                createdAt: order.createTime || new Date().toISOString(),
                // 其他设计相关字段
                canvasData: order.designImage || '',
                dessertType: 'chocolate'
            };
            
            this.loadDesign(design);
            
            // 加载后清除临时存储，避免重复加载
            localStorage.removeItem('currentReorder');
            console.log('重新下单设计数据加载完成并已清除临时存储');
            return;
        }
        
        // 检查是否有上次保存的设计数据
        const lastDesign = window.StorageManager.getLastDesign();
        
        // 检查是否是全新的设计会话（通过URL参数或sessionStorage标记）
        const isNewDesign = urlParams.has('new') || sessionStorage.getItem('isNewDesignSession') === 'true';
        
        if (lastDesign && !isNewDesign) {
            console.log('发现上次保存的设计数据，自动加载');
            const design = {
                id: 'last_design_' + Date.now(),
                name: '上次的设计',
                type: lastDesign.type || 'chocolate',
                shape: 'circle',
                data: lastDesign.image || '',
                createdAt: new Date().toISOString(),
                canvasData: lastDesign.image || '',
                dessertType: lastDesign.type || 'chocolate'
            };
            
            this.loadDesign(design);
            console.log('上次设计数据加载完成');
            return;
        } else if (lastDesign && isNewDesign) {
            console.log('发现上次保存的设计数据，但当前是全新设计会话，不自动加载');
            // 清除sessionStorage标记，避免影响后续会话
            sessionStorage.removeItem('isNewDesignSession');
        }
        
        console.log('没有发现待加载的设计数据');
    } catch (error) {
        console.error('加载设计失败:', error);
    }
}
    
    /**
     * 从订单数据中提取形状信息
     */
    extractShapeFromOrder(order) {
        // 根据订单的样式信息推断形状
        const style = order.selectedStyle || '';
        
        // 确保style是字符串
        const styleString = String(style);
        
        if (styleString.includes('圆形') || styleString.includes('circle')) {
            return 'circle';
        } else if (styleString.includes('方形') || styleString.includes('square')) {
            return 'square';
        } else if (styleString.includes('心形') || styleString.includes('heart')) {
            return 'heart';
        } else if (styleString.includes('星形') || styleString.includes('star')) {
            return 'star';
        }
        
        // 默认返回圆形
        return 'circle';
    }
    
    /**
     * 加载指定设计数据
     */
    loadDesign(design) {
        try {
            console.log('开始加载设计:', design.name || '未命名');
            
            // 设置设计名称
            if (design.name) {
                this.setDesignName(design.name);
            }
            
            // 加载画布数据
            if (design.canvasData) {
                this.restoreCanvasState(design.canvasData);
            } else if (design.data) {
                // 兼容旧版本数据格式
                this.restoreCanvasState(design.data);
            }
            
            // 加载图片（如果有）
            if (design.imageData) {
                const img = new Image();
                img.onload = () => {
                    this.uploadedImage = img;
                    this.imagePosition = { ...(design.imagePosition || { x: 0, y: 0 }) };
                    this.imageScale = design.imageScale || 1.0;
                    this.imageConfirmed = design.imageConfirmed || false;
                    this.updateUI();
                    console.log('图片已加载并渲染');
                };
                img.src = design.imageData;
            }
            
            // 加载文本元素
            if (design.textElements && Array.isArray(design.textElements)) {
                this.textElements = [...design.textElements];
                console.log('文本元素已加载:', this.textElements.length, '个');
            }
            
            // 加载绘图点数据
            if (design.points && Array.isArray(design.points)) {
                this.points = [...design.points];
                console.log('绘图点数据已加载:', this.points.length, '个');
            }
            
            // 加载形状选择
            if (design.shape) {
                this.selectedShape = design.shape;
                console.log('形状已加载:', design.shape);
            }
            
            // 加载模板选择状态
            if (design.templateSelected) {
                this.templateSelected = design.templateSelected;
                console.log('模板状态已加载:', design.templateSelected);
                // 如果加载了模板，尝试重新渲染模板
                this.displayChocolateTemplates();
            }
            
            // 加载甜点类型
            if (design.dessertType) {
                this.dessertType = design.dessertType;
                console.log('甜点类型已加载:', design.dessertType);
            } else if (design.type) {
                // 兼容旧版本的类型字段
                this.dessertType = design.type;
                console.log('甜点类型(兼容模式)已加载:', design.type);
            }
            
            // 加载设计元素
            if (design.elements) {
                try {
                    this.designElements = JSON.parse(design.elements);
                    console.log('设计元素已加载');
                } catch (e) {
                    console.warn('无法解析设计元素:', e);
                }
            }
            
            // 更新UI
            this.updateUI();
            
            console.log('设计加载完成');
        } catch (error) {
            console.error('加载设计失败:', error);
            this.showNotification('设计加载失败，请重试', 'error');
        }
    }
    
    /**
     * 还原画布状态
     */
    restoreCanvasState(canvasData) {
        try {
            const img = new Image();
            img.onload = () => {
                // 清空画布
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                // 绘制保存的图像
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                // 更新离屏画布
                this.syncOffscreenCanvas();
                // 保存这个状态到历史记录
                this.saveState();
                // 更新UI
                this.updateUI();
                
                // 标记模板已选择，允许绘图
                this.templateSelected = true;
                console.log('画布状态还原完成，templateSelected设置为:', this.templateSelected);
            };
            img.src = canvasData;
        } catch (error) {
            console.error('还原画布失败:', error);
        }
    }

    /**
     * 设置主画布
     */
    setupCanvas() {
        // 获取主画布
        this.canvas = document.getElementById('design-canvas');
        if (!this.canvas) {
            console.error('找不到主画布元素！');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        console.log('主画布初始化完成');
        
        // 创建离屏画布用于存储绘制内容，防止笔画消失
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        
        // 设置离屏画布尺寸与主画布一致
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        console.log('离屏画布创建完成，尺寸:', this.offscreenCanvas.width, '×', this.offscreenCanvas.height);
        
        // 创建背景画布
        // 移除任何已存在的背景画布（防止重复）
        const canvasContainer = this.canvas.parentElement;
        if (!canvasContainer) {
            console.error('找不到画布容器！');
            return;
        }
        
        const existingBgCanvas = canvasContainer.querySelector('.background-canvas');
        if (existingBgCanvas) {
            console.log('移除已存在的背景画布');
            existingBgCanvas.remove();
        }
        
        this.backgroundCanvas = document.createElement('canvas');
        this.backgroundCanvas.id = 'background-canvas'; // 添加唯一ID
        this.backgroundCanvas.className = 'background-canvas';
        this.backgroundCtx = this.backgroundCanvas.getContext('2d');
        console.log('背景画布创建完成');
        
        // 设置背景画布样式
        this.backgroundCanvas.style.position = 'absolute';
        this.backgroundCanvas.style.top = '0';
        this.backgroundCanvas.style.left = '0';
        this.backgroundCanvas.style.zIndex = '1';
        this.backgroundCanvas.style.display = 'block';
        this.backgroundCanvas.style.opacity = '1';
        this.backgroundCanvas.style.pointerEvents = 'none'; // 防止背景画布接收鼠标事件
        this.backgroundCanvas.style.backgroundColor = 'transparent';
        
        // 确保主画布样式正确
        this.canvas.style.position = 'relative';
        this.canvas.style.zIndex = '2';
        this.canvas.style.backgroundColor = 'transparent';
        
        // 在主画布之前插入背景画布
        canvasContainer.insertBefore(this.backgroundCanvas, this.canvas);
        console.log('背景画布已插入到DOM中，位置在主画布之前');
        
        // 全局可访问，方便调试和NavigationManager使用
        window.dessertDesigner = this;
        window.designer = this;
        console.log('甜点设计器实例已暴露到window.dessertDesigner和window.designer');
        
        // 设置固定比例的画布尺寸 (4:3)
        const aspectRatio = 4 / 3;
        
        // 获取容器尺寸以确定最佳画布大小
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 计算适合容器的画布尺寸，保持4:3比例
        let width, height;
        if (containerWidth / containerHeight > aspectRatio) {
            // 容器更宽，以高度为准
            height = containerHeight;
            width = height * aspectRatio;
        } else {
            // 容器更高，以宽度为准
            width = containerWidth;
            height = width / aspectRatio;
        }
        
        // 应用计算出的尺寸
        this.canvas.width = Math.floor(width);
        this.canvas.height = Math.floor(height);
        
        // 背景画布使用相同尺寸
        this.backgroundCanvas.width = this.canvas.width;
        this.backgroundCanvas.height = this.canvas.height;
        
        // 更新canvasSize对象
        this.canvasSize = { width: this.canvas.width, height: this.canvas.height };
        
        // 清空画布（初始化时不显示确认框）
        this.clearCanvas(false);
        // 清空背景画布，使用透明背景
        this.backgroundCtx.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
        
        // 更新状态栏显示的画布尺寸
        const canvasSizeElement = document.getElementById('canvas-size');
        if (canvasSizeElement) {
            canvasSizeElement.textContent = `${this.canvas.width} × ${this.canvas.height}`;
        }
        
        // 添加窗口调整事件监听器
        window.addEventListener('resize', this.resizeCanvas.bind(this));
    }
    
    /**
     * 调整画布尺寸，保持4:3比例
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 使用固定比例 4:3，但保持容器边界
        const aspectRatio = 4 / 3;
        let newWidth, newHeight;
        
        // 计算基于容器尺寸的合适尺寸
        if (containerWidth / containerHeight > aspectRatio) {
            // 容器较宽，以高度为基准
            newHeight = Math.min(containerHeight, 600);
            newWidth = newHeight * aspectRatio;
        } else {
            // 容器较高，以宽度为基准
            newWidth = Math.min(containerWidth, 800);
            newHeight = newWidth / aspectRatio;
        }
        
        // 确保最小尺寸
        newWidth = Math.max(newWidth, 400);
        newHeight = Math.max(newHeight, 300);
        
        // 更新尺寸（确保使用整数像素值）
        newWidth = Math.floor(newWidth);
        newHeight = Math.floor(newHeight);
        
        // 设置Canvas的CSS尺寸，确保它在页面中正确显示
        this.canvas.style.width = `${newWidth}px`;
        this.canvas.style.height = `${newHeight}px`;
        
        // 保存当前绘制内容
        let currentImageData = null;
        if (this.ctx) {
            currentImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // 然后设置物理尺寸
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        
        // 更新背景画布尺寸
        this.backgroundCanvas.width = newWidth;
        this.backgroundCanvas.height = newHeight;
        this.backgroundCanvas.style.width = `${newWidth}px`;
        this.backgroundCanvas.style.height = `${newHeight}px`;
        
        // 更新离屏画布尺寸
        if (this.offscreenCanvas) {
            this.offscreenCanvas.width = newWidth;
            this.offscreenCanvas.height = newHeight;
        }
        
        // 更新canvasSize对象
        this.canvasSize = { width: newWidth, height: newHeight };
        
        // 清空画布并重新绘制背景
        this.clearCanvas(false);
        
        // 如果有模板，仅重新绘制背景画布内容（不重新调用模板渲染）
        if (this.templateSelected && this.backgroundCanvas) {
            // 确保背景画布内容正确显示到主画布
            this.ctx.drawImage(this.backgroundCanvas, 0, 0);
        }
        
        // 更新状态栏
        const canvasSizeElement = document.getElementById('canvas-size');
        if (canvasSizeElement) {
            canvasSizeElement.textContent = `${this.canvas.width} × ${this.canvas.height}`;
        }
        
        // 更新预览
        if (this.updatePreview) {
            this.updatePreview();
        }
    }

    /**
     * 设置预览画布
     */
    setupPreview() {
        this.previewCanvas = document.getElementById('preview-canvas');
        if (this.previewCanvas) {
            this.previewCtx = this.previewCanvas.getContext('2d');
            
            // 设置预览画布尺寸
            const baseScale = 0.25;
            this.previewCanvas.width = this.canvasSize.width * baseScale;
            this.previewCanvas.height = this.canvasSize.height * baseScale;
            
            // 清空预览画布
            this.previewCtx.fillStyle = '#FFFFFF';
            this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
            
            // 设置预览缩放控制
            this.setupPreviewZoomControls();
        }
    }
    
    /**
     * 设置预览缩放控制
     */
    setupPreviewZoomControls() {
        // 放大按钮
        const zoomInBtn = document.createElement('button');
        zoomInBtn.className = 'btn-secondary';
        zoomInBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
        zoomInBtn.title = '放大';
        zoomInBtn.addEventListener('click', () => this.zoomPreview(1.2));
        
        // 缩小按钮
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.className = 'btn-secondary';
        zoomOutBtn.innerHTML = '<i class="fas fa-search-minus"></i>';
        zoomOutBtn.title = '缩小';
        zoomOutBtn.addEventListener('click', () => this.zoomPreview(0.8));
        
        // 重置缩放按钮
        const resetZoomBtn = document.createElement('button');
        resetZoomBtn.className = 'btn-secondary';
        resetZoomBtn.innerHTML = '<i class="fas fa-expand"></i>';
        resetZoomBtn.title = '重置缩放';
        resetZoomBtn.addEventListener('click', () => this.resetPreviewZoom());
        
        // 添加到预览控制区域
        const previewControls = document.querySelector('.preview-controls');
        if (previewControls) {
            // 插入到现有按钮之前
            previewControls.insertBefore(zoomInBtn, previewControls.firstChild);
            previewControls.insertBefore(zoomOutBtn, previewControls.firstChild);
            previewControls.insertBefore(resetZoomBtn, previewControls.firstChild);
        }
    }
    
    /**
     * 缩放预览
     */
    zoomPreview(factor) {
        this.previewZoomLevel = Math.max(0.5, Math.min(3, this.previewZoomLevel * factor));
        this.updatePreview();
        
        // 显示当前缩放级别
        const zoomLevelElement = document.createElement('span');
        zoomLevelElement.className = 'zoom-level-indicator';
        zoomLevelElement.textContent = `${Math.round(this.previewZoomLevel * 100)}%`;
        zoomLevelElement.style.marginLeft = '10px';
        
        // 移除旧的缩放级别指示器
        const oldIndicator = document.querySelector('.zoom-level-indicator');
        if (oldIndicator) oldIndicator.remove();
        
        // 添加新的缩放级别指示器
        const previewControls = document.querySelector('.preview-controls');
        if (previewControls) {
            previewControls.appendChild(zoomLevelElement);
        }
    }
    
    /**
     * 重置预览缩放
     */
    resetPreviewZoom() {
        this.previewZoomLevel = 1;
        this.updatePreview();
        
        // 移除缩放级别指示器
        const indicator = document.querySelector('.zoom-level-indicator');
        if (indicator) indicator.remove();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        console.log('设置事件监听器...');
        
        if (!this.canvas) {
            console.error('找不到主画布元素，无法设置事件监听器！');
            return;
        }
        
        console.log('主画布找到，开始添加事件监听器');
        
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => {
            console.log('鼠标按下事件触发');
            this.handleMouseDown(e);
        });
        this.canvas.addEventListener('mousemove', (e) => {
            // 减少控制台输出，只记录重要事件
            if (this.isDrawing || this.isDragging || this.isDraggingText) {
                console.log('鼠标移动事件触发（绘图/拖动状态）');
            }
            this.handleMouseMove(e);
        });
        this.canvas.addEventListener('mouseup', () => {
            console.log('鼠标松开事件触发');
            this.handleMouseUp();
        });
        this.canvas.addEventListener('mouseout', () => {
            console.log('鼠标移出画布事件触发');
            this.handleMouseUp();
        });
        
        // 鼠标滚轮事件 - 图片缩放
        this.canvas.addEventListener('wheel', (e) => {
            console.log('鼠标滚轮事件触发');
            this.handleWheel(e);
        });
        
        // 触摸事件（移动端支持）
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 防止页面滚动
            console.log('触摸开始事件触发');
            this.handleMouseDown(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault(); // 防止页面滚动
            console.log('触摸移动事件触发');
            this.handleMouseMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => {
            console.log('触摸结束事件触发');
            this.handleMouseUp();
        });
        
        // 检查模板按钮
        const templateButtons = document.querySelectorAll('.template-btn');
        console.log('找到模板按钮:', templateButtons.length, '个');
        
        // 模板按钮事件监听
        templateButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('模板按钮点击:', btn.getAttribute('data-template'));
                
                // 获取模板类型
                const template = btn.getAttribute('data-template');
                
                // 如果是点击当前已选中的模板，不做任何操作
                if (this.currentTemplateId === template) {
                    console.log('模板已选中，跳过');
                    return;
                }
                
                // 直接调用selectTemplate方法切换模板
                this.selectTemplate(template);
            });
        });
        
        // 检查工具按钮
        const toolButtons = document.querySelectorAll('.tool-btn');
        console.log('找到工具按钮:', toolButtons.length, '个');
        
        // 工具按钮事件监听
        toolButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tool = btn.getAttribute('data-tool');
                console.log('工具按钮点击:', tool);
                this.selectTool(tool);
            });
        });
        
        // 检查颜色选择器
        const colorButtons = document.querySelectorAll('.color-btn');
        console.log('找到颜色按钮:', colorButtons.length, '个');
        
        // 颜色按钮事件监听
        colorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const color = btn.getAttribute('data-color');
                console.log('颜色按钮点击:', color);
                this.selectColor(color);
            });
        });
        
        // 图片上传事件
        const imageUploadInput = document.getElementById('image-upload-input');
        if (imageUploadInput) {
            imageUploadInput.addEventListener('change', (e) => {
                console.log('图片上传选择事件触发');
                if (e.target.files && e.target.files[0]) {
                    this.handleImageUpload(e.target.files[0]);
                }
            });
        } else {
            console.error('图片上传输入框未找到！');
        }
        
        // 拖拽上传事件
        const uploadLabel = document.querySelector('.upload-label');
        if (uploadLabel) {
            uploadLabel.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadLabel.classList.add('drag-over');
                console.log('拖拽进入区域');
            });
            
            uploadLabel.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadLabel.classList.remove('drag-over');
                console.log('拖拽离开区域');
            });
            
            uploadLabel.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadLabel.classList.remove('drag-over');
                console.log('文件拖放事件触发');
                
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    this.handleImageUpload(e.dataTransfer.files[0]);
                }
            });
        } else {
            console.error('上传标签未找到！');
        }
        
        // 为所有按钮添加点击事件日志
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', function(e) {
                console.log('按钮点击:', this.id, this.className, this.textContent.trim());
            });
        });
        
        console.log('事件监听器设置完成');
    }

    /**
     * 获取鼠标在画布上的位置
     */
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        
        // 计算画布的缩放比例
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        // 根据缩放比例映射鼠标坐标到画布坐标系
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    /**
     * 处理鼠标按下事件
     */
    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        
        // 检查是否点击了按钮
        if (this.uploadedImage && !this.imageConfirmed && this.buttonPositions) {
            // 检查是否点击了取消按钮
            const cancelBtn = this.buttonPositions.cancel;
            const cancelDistance = Math.sqrt(
                Math.pow(pos.x - (cancelBtn.x + cancelBtn.size / 2), 2) +
                Math.pow(pos.y - (cancelBtn.y + cancelBtn.size / 2), 2)
            );
            
            if (cancelDistance <= cancelBtn.size / 2) {
                this.cancelImage();
                return;
            }
            
            // 检查是否点击了确认按钮
            const confirmBtn = this.buttonPositions.confirm;
            const confirmDistance = Math.sqrt(
                Math.pow(pos.x - (confirmBtn.x + confirmBtn.size / 2), 2) +
                Math.pow(pos.y - (confirmBtn.y + confirmBtn.size / 2), 2)
            );
            
            if (confirmDistance <= confirmBtn.size / 2) {
                this.confirmImage();
                return;
            }
        }
        
        // 检查是否点击在文本元素上
        const clickedTextElement = this.getTextElementAtPosition(pos.x, pos.y);
        if (clickedTextElement) {
            // 选中文本元素
            this.selectedTextElement = clickedTextElement;
            
            // 开始拖动文本
            this.isDraggingText = true;
            this.dragOffset.x = pos.x - clickedTextElement.x;
            this.dragOffset.y = pos.y - clickedTextElement.y;
            this.canvas.style.cursor = 'move';
            
            // 重新渲染以显示选中状态，但不清空画布
            this.renderElementsOnly();
            return;
        }
        
        // 如果有上传的图片，检查是否点击在图片上（无论当前工具是什么）
        if (this.uploadedImage) {
            // 考虑图片缩放
            const scaledWidth = this.uploadedImage.width * this.imageScale;
            const scaledHeight = this.uploadedImage.height * this.imageScale;
            
            if (pos.x >= this.imagePosition.x && 
                pos.x <= this.imagePosition.x + scaledWidth && 
                pos.y >= this.imagePosition.y && 
                pos.y <= this.imagePosition.y + scaledHeight) {
                
                // 自动切换到图片工具并开始拖动
                if (this.currentTool !== 'image') {
                    this.selectTool('image');
                }
                
                // 开始拖动图片
                this.isDragging = true;
                this.dragOffset.x = pos.x - this.imagePosition.x;
                this.dragOffset.y = pos.y - this.imagePosition.y;
                this.canvas.style.cursor = 'move';
                console.log('开始拖动图片');
                return;
            }
        }
        
        // 如果点击空白区域，取消选中
        this.selectedTextElement = null;
        
        // 其他情况正常开始绘图
        this.startDrawing(e);
    }
    
    /**
     * 处理鼠标移动事件
     */
    handleMouseMove(e) {
        // 如果正在拖动文本
        if (this.isDraggingText && this.selectedTextElement) {
            // 如果正在绘图，不允许拖动文本
            if (this.isDrawing) {
                return;
            }
            
            const pos = this.getMousePos(e);
            
            // 更新文本位置
            this.selectedTextElement.x = pos.x - this.dragOffset.x;
            this.selectedTextElement.y = pos.y - this.dragOffset.y;
            
            // 仅重新渲染元素层，避免重绘背景
            this.renderElementsOnly();
            
            return;
        }
        
        // 如果正在拖动图片
        if (this.isDragging) {
            // 如果正在绘图，不允许拖动图片
            if (this.isDrawing) {
                return;
            }
            
            const pos = this.getMousePos(e);
            
            // 更新图片位置
            this.imagePosition.x = pos.x - this.dragOffset.x;
            this.imagePosition.y = pos.y - this.dragOffset.y;
            
            // 仅重新渲染元素层，避免重绘背景
            this.renderElementsOnly();
            
            return;
        }
        
        // 检查鼠标是否悬停在文本元素上
        const pos = this.getMousePos(e);
        const hoveredTextElement = this.getTextElementAtPosition(pos.x, pos.y);
        if (hoveredTextElement) {
            this.canvas.style.cursor = 'move';
            return;
        }
        
        // 如果鼠标悬停在图片上，改变光标样式
        if (this.uploadedImage) {
            // 考虑图片缩放
            const scaledWidth = this.uploadedImage.width * this.imageScale;
            const scaledHeight = this.uploadedImage.height * this.imageScale;
            
            if (pos.x >= this.imagePosition.x && 
                pos.x <= this.imagePosition.x + scaledWidth && 
                pos.y >= this.imagePosition.y && 
                pos.y <= this.imagePosition.y + scaledHeight) {
                this.canvas.style.cursor = 'move';
            } else if (this.currentTool === 'image') {
                this.canvas.style.cursor = 'move'; // 图片工具统一使用移动光标
            } else {
                this.canvas.style.cursor = this.currentTool === 'brush' ? 'crosshair' : 'default';
            }
        } else {
            this.canvas.style.cursor = this.currentTool === 'brush' ? 'crosshair' : 'default';
        }
        
        // 其他情况正常绘图
        this.draw(e);
    }
    
    /**
     * 处理鼠标松开事件
     */
    handleMouseUp() {
        // 如果正在拖动文本
        if (this.isDraggingText) {
            this.isDraggingText = false;
            this.saveState();
            console.log('文本拖动完成，位置已保存');
            return;
        }
        
        // 如果正在拖动图片
        if (this.isDragging) {
            this.isDragging = false;
            this.canvas.style.cursor = this.currentTool === 'image' ? 'move' : 'default';
            this.saveState();
            console.log('图片拖动完成，位置已保存');
            return;
        }
        
        // 其他情况正常停止绘图
        this.stopDrawing();
        
        // 立即再次从离屏画布恢复内容，确保绘制的内容正确显示
        // 使用setTimeout稍微延迟，确保浏览器渲染完成
        setTimeout(() => {
            this.restoreFromOffscreen();
        }, 0);
    }
    
    /**
     * 开始绘图
     */
    startDrawing(e) {
        // 检查是否已选择模板
        if ((this.currentTool === 'brush' || this.currentTool === 'eraser') && !this.templateSelected) {
            this.showTemplateRequiredMessage();
            return;
        }
        
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        // 确保离屏画布与主画布同步
        this.syncOffscreenCanvas();
        
        // 设置绘图属性，确保合成模式正确
        if (this.currentTool === 'brush') {
            // 画笔模式 - 使用source-over确保新内容叠加在已有内容之上
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.brushSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.globalCompositeOperation = 'source-over';
        } else if (this.currentTool === 'eraser') {
            // 橡皮擦模式 - 使用destination-out擦除内容
            this.ctx.strokeStyle = 'rgba(255,255,255,1)'; // 使用不透明白色
            this.ctx.lineWidth = this.brushSize * 2; // 橡皮擦更大一些
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.globalCompositeOperation = 'destination-out';
        } else if (this.currentTool === 'shape' && this.selectedShape) {
            // 形状绘制
            this.drawShape(pos.x, pos.y);
            this.isDrawing = false;
            this.saveState();
            this.updatePreview();
        }
        
        // 保存初始状态
        this.saveState();
    }
    
    /**
      * 显示需要选择模板的提示消息
      */
     showTemplateRequiredMessage() {
         // 检查是否已有提示
         let messageElement = document.getElementById('template-required-message');
         if (!messageElement) {
             messageElement = document.createElement('div');
             messageElement.id = 'template-required-message';
             messageElement.className = 'template-required-message';
             messageElement.style.position = 'absolute';
             messageElement.style.top = '50%';
             messageElement.style.left = '50%';
             messageElement.style.transform = 'translate(-50%, -50%)';
             messageElement.style.background = 'rgba(255, 99, 71, 0.9)';
             messageElement.style.color = 'white';
             messageElement.style.padding = '15px 25px';
             messageElement.style.borderRadius = '8px';
             messageElement.style.fontSize = '16px';
             messageElement.style.zIndex = '1000';
             messageElement.style.textAlign = 'center';
             messageElement.textContent = '请先选择一个模板，然后再开始绘画';
             
             this.canvas.parentElement.appendChild(messageElement);
             
             // 3秒后自动消失
             setTimeout(() => {
                 if (messageElement.parentNode) {
                     messageElement.parentNode.removeChild(messageElement);
                 }
             }, 3000);
         }
     }

    /**
     * 绘制过程
     */
    draw(e) {
        if (!this.isDrawing) return;
        
        // 只有画笔和橡皮擦需要持续绘制
        if (this.currentTool !== 'brush' && this.currentTool !== 'eraser') {
            return;
        }
        
        const pos = this.getMousePos(e);
        const currentX = pos.x;
        const currentY = pos.y;
        
        // 使用requestAnimationFrame确保浏览器正确渲染
        requestAnimationFrame(() => {
            // 首先确保离屏画布与主画布完全同步
            this.syncOffscreenCanvas();
            
            // 在主画布上绘制当前线段
            this.ctx.beginPath();
            this.ctx.moveTo(this.lastX, this.lastY);
            this.ctx.lineTo(currentX, currentY);
            
            // 设置绘制属性
            if (this.currentTool === 'brush') {
                this.ctx.strokeStyle = this.currentColor;
                this.ctx.globalCompositeOperation = 'source-over'; // 画笔模式：叠加内容
            } else if (this.currentTool === 'eraser') {
                // 橡皮擦模式 - 使用白色绘制并设置destination-out模式
                this.ctx.strokeStyle = 'rgba(255,255,255,1)'; // 使用不透明白色
                this.ctx.globalCompositeOperation = 'destination-out'; // 橡皮擦模式：擦除内容
            }
            
            this.ctx.lineWidth = this.currentTool === 'eraser' ? this.brushSize * 2 : this.brushSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
            
            // 在离屏画布上绘制相同的内容，作为备份
            if (this.offscreenCanvas && this.offscreenCtx) {
                // 设置离屏画布的绘制属性
                this.offscreenCtx.beginPath();
                this.offscreenCtx.moveTo(this.lastX, this.lastY);
                this.offscreenCtx.lineTo(currentX, currentY);
                
                if (this.currentTool === 'brush') {
                    this.offscreenCtx.strokeStyle = this.currentColor;
                    this.offscreenCtx.globalCompositeOperation = 'source-over';
                } else if (this.currentTool === 'eraser') {
                    // 橡皮擦模式 - 使用白色绘制并设置destination-out模式
                    this.offscreenCtx.strokeStyle = 'rgba(255,255,255,1)'; // 使用不透明白色
                    this.offscreenCtx.globalCompositeOperation = 'destination-out';
                }
                
                this.offscreenCtx.lineWidth = this.currentTool === 'eraser' ? this.brushSize * 2 : this.brushSize;
                this.offscreenCtx.lineCap = 'round';
                this.offscreenCtx.lineJoin = 'round';
                this.offscreenCtx.stroke();
            }
            
            // 更新最后位置
            this.lastX = currentX;
            this.lastY = currentY;
            
            // 更新预览画布
            this.updatePreview();
        });
    }

    /**
     * 渲染方法 - 使用高效路径管理
     */
    render() {
        // 保存当前上下文状态，确保不会影响其他绘制
        this.ctx.save();
        
        // 根据工具设置不同的绘图属性
        if (this.currentTool === 'brush') {
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.brushSize;
            this.ctx.globalCompositeOperation = 'source-over'; // 确保线条在已有内容之上
        } else if (this.currentTool === 'eraser') {
            this.ctx.strokeStyle = 'rgba(255,255,255,1)';
            this.ctx.lineWidth = this.brushSize * 2;
            this.ctx.globalCompositeOperation = 'destination-out';
        }
        
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (this.points.length < 2) {
            // 单个点绘制
            if (this.points.length === 1) {
                // 使用小线段绘制单个点
                const point = this.points[0];
                this.ctx.beginPath();
                this.ctx.moveTo(point.x, point.y);
                this.ctx.lineTo(point.x + 0.1, point.y);
                this.ctx.stroke();
            }
        } else {
            // 一次性绘制所有线段
            this.ctx.beginPath();
            this.ctx.moveTo(this.points[0].x, this.points[0].y);
            
            // 绘制所有点之间的线段
            for (let i = 1; i < this.points.length; i++) {
                this.ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            
            this.ctx.stroke();
        }
        
        // 恢复上下文状态
        this.ctx.restore();
        
        // 清空点数组
        this.points = [];
        
        this.isRendering = false;
        // 更新预览
        this.updatePreview();
    }

    /**
     * 停止绘图
     */
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            
            // 恢复默认合成模式
            this.ctx.globalCompositeOperation = 'source-over';
            
            // 确保离屏画布与主画布完全同步
            this.syncOffscreenCanvas();
            
            // 保存状态和更新预览
            this.saveState();
            this.updatePreview();
            
            // 强制从离屏画布恢复内容，确保绘制内容不会丢失
            this.restoreFromOffscreen();
            
            // 清空点数组
            this.points = [];
            
            console.log('绘图停止，状态已保存');
        }
    }

    /**
     * 选择工具
     */
    selectTool(tool) {
        console.log('选择工具:', tool);
        
        this.currentTool = tool;
        
        // 取消正在进行的拖动
        if (this.isDragging) {
            this.isDragging = false;
        }
        
        // 更新按钮状态
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.tool-btn[data-tool="${tool}"]`)?.classList.add('active');
        
        // 更新光标样式
        if (this.canvas) {
            switch (tool) {
                case 'brush':
                    this.canvas.style.cursor = 'crosshair';
                    break;
                case 'eraser':
                    this.canvas.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"%3E%3Ccircle cx=\"12\" cy=\"12\" r=\"8\"/%3E%3C/svg%3E") 12 12, auto';
                    break;
                case 'shape':
                    this.canvas.style.cursor = 'pointer';
                    break;
                case 'image':
                    // 图片工具统一使用移动光标
                    this.canvas.style.cursor = 'move';
                    // 如果有上传的图片，使用正确的渲染顺序重新绘制
                    if (this.uploadedImage) {
                        this.renderElementsOnly();
                    }
                    break;
                default:
                    this.canvas.style.cursor = 'crosshair';
            }
        }
        
        this.updateDesignInfo();
    }
    
    /**
     * 处理鼠标滚轮事件 - 实现图片缩放
     */
    handleWheel(e) {
        // 优先处理文本元素的缩放
        if (this.selectedTextElement) {
            e.preventDefault();
            
            // 计算鼠标在画布上的坐标
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // 检查鼠标是否在选中的文本元素范围内
            this.ctx.font = `${this.selectedTextElement.fontSize * this.selectedTextElement.scale}px ${this.selectedTextElement.fontFamily}`;
            const metrics = this.ctx.measureText(this.selectedTextElement.text);
            const textHeight = this.selectedTextElement.fontSize * this.selectedTextElement.scale;
            const padding = 5;
            
            const left = this.selectedTextElement.x - metrics.width / 2 - padding;
            const right = this.selectedTextElement.x + metrics.width / 2 + padding;
            const top = this.selectedTextElement.y - textHeight / 2 - padding;
            const bottom = this.selectedTextElement.y + textHeight / 2 + padding;
            
            if (mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom) {
                // 计算缩放方向和缩放因子
                const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
                
                // 应用缩放，限制在合理范围内
                const newScale = Math.max(0.1, Math.min(5.0, this.selectedTextElement.scale * zoomFactor));
                
                if (newScale !== this.selectedTextElement.scale) {
                    this.selectedTextElement.scale = newScale;
                    
                    // 重新渲染所有元素，但不清空画布
                    this.renderElementsOnly();
                    
                    // 更新预览
                    this.updatePreview();
                    
                    // 保存状态
                    this.saveState();
                    
                    console.log('文本缩放:', this.selectedTextElement.scale);
                }
            }
            return; // 文本缩放处理完成，不再处理图片缩放
        }
        
        // 原有的图片缩放逻辑
        if (this.currentTool === 'image' && this.uploadedImage) {
            e.preventDefault();
            
            // 计算鼠标在画布上的坐标
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // 检查鼠标是否在图片范围内
            const scaledWidth = this.uploadedImage.width * this.imageScale;
            const scaledHeight = this.uploadedImage.height * this.imageScale;
            
            if (mouseX >= this.imagePosition.x && mouseX <= this.imagePosition.x + scaledWidth &&
                mouseY >= this.imagePosition.y && mouseY <= this.imagePosition.y + scaledHeight) {
                
                // 计算缩放方向和缩放因子
                const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
                
                // 保存缩放前的鼠标相对于图片中心的位置
                const beforeZoomRelX = mouseX - (this.imagePosition.x + scaledWidth / 2);
                const beforeZoomRelY = mouseY - (this.imagePosition.y + scaledHeight / 2);
                
                // 应用缩放
                this.imageScale = Math.max(0.1, Math.min(5.0, this.imageScale * zoomFactor));
                
                // 计算缩放后的图片尺寸
                const newScaledWidth = this.uploadedImage.width * this.imageScale;
                const newScaledHeight = this.uploadedImage.height * this.imageScale;
                
                // 调整图片位置，使缩放以鼠标位置为中心
                this.imagePosition.x = mouseX - (beforeZoomRelX * zoomFactor + newScaledWidth / 2);
                this.imagePosition.y = mouseY - (beforeZoomRelY * zoomFactor + newScaledHeight / 2);
                
                console.log('图片缩放:', this.imageScale);
                
                // 使用requestAnimationFrame确保平滑缩放
                requestAnimationFrame(() => {
                    // 首先保存当前画布内容到临时画布
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = this.canvas.width;
                    tempCanvas.height = this.canvas.height;
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCtx.drawImage(this.canvas, 0, 0);
                    
                    // 清空主画布
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    // 重新绘制图片（在背景之上，用户内容之下）
                    if (this.uploadedImage) {
                        this.drawProcessedImage();
                    }
                    
                    // 恢复用户绘制的内容（包括文本、绘图等所有内容）
                    this.ctx.drawImage(tempCanvas, 0, 0);
                    
                    // 更新预览
                    this.updatePreview();
                });
            }
        }
    }

    /**
     * 初始化巧克力设计
     * 由于只支持巧克力类型，这个方法替代了之前的selectDessertType
     */
    initChocolateDesign() {
        // 显示巧克力形状模板
        this.displayChocolateTemplates();
        this.updateDesignInfo();
    }
    
    /**
     * 显示巧克力形状模板提示
     */
    displayChocolateTemplates() {
        // 清空画布并保持透明
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 重置模板选择状态
        this.templateSelected = false;
        
        // 重置模板按钮状态
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 保存这个状态到历史记录
        this.saveState();
    }
    
    /**
     * 绘制巧克力样式的形状
     */
    drawChocolateShape(x, y, shapeType, asTemplate = false) {
        // 计算适合画布的最大尺寸，保持形状比例
        const maxSize = Math.min(this.canvas.width, this.canvas.height) * 0.6; // 最大为画布的60%
        const size = maxSize;
        
        if (asTemplate) {
            // 在背景画布上绘制模板（不可擦除）
            // 清空背景画布
            this.backgroundCtx.fillStyle = '#ffffff';
            this.backgroundCtx.fillRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
            
            // 设置巧克力颜色
            this.backgroundCtx.fillStyle = '#3D2314';
            
            // 绘制基本形状
            switch (shapeType) {
                case 'circle':
                    this.drawCircleOnBackground(x, y, size);
                    break;
                case 'square':
                    this.drawSquareOnBackground(x, y, size);
                    break;
                case 'heart':
                    this.drawHeartOnBackground(x, y, size);
                    break;
            }
            
            // 添加巧克力纹理效果（简单的线条图案）
            this.backgroundCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.backgroundCtx.lineWidth = 2;
            
            // 绘制一些随机的细线条作为纹理
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const startRadius = size * 0.2;
                const endRadius = size * 0.4;
                
                const startX = x + startRadius * Math.cos(angle);
                const startY = y + startRadius * Math.sin(angle);
                const endX = x + endRadius * Math.cos(angle);
                const endY = y + endRadius * Math.sin(angle);
                
                this.backgroundCtx.beginPath();
                this.backgroundCtx.moveTo(startX, startY);
                this.backgroundCtx.lineTo(endX, endY);
                this.backgroundCtx.stroke();
            }
            
            // 添加形状标签到背景画布
            this.backgroundCtx.fillStyle = '#ffffff';
            this.backgroundCtx.font = '14px Arial';
            this.backgroundCtx.textAlign = 'center';
            
            let label = '';
            switch (shapeType) {
                case 'circle': label = '圆形巧克力'; break;
                case 'square': label = '方形巧克力'; break;
                case 'heart': label = '心形巧克力'; break;
            }
            
            this.backgroundCtx.fillText(label, x, y + size / 2 + 30);
        } else {
            // 在主画布上绘制（仅用于预览选择）
            const previewSize = 80;
            
            // 设置巧克力颜色
            this.ctx.fillStyle = '#3D2314';
            
            // 绘制基本形状
            switch (shapeType) {
                case 'circle':
                    this.drawCircle(x, y, previewSize);
                    break;
                case 'square':
                    this.drawSquare(x, y, previewSize);
                    break;
                case 'heart':
                    this.drawHeart(x, y, previewSize);
                    break;
            }
            
            // 添加巧克力纹理效果
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 2;
            
            // 绘制一些随机的细线条作为纹理
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const startRadius = previewSize * 0.2;
                const endRadius = previewSize * 0.4;
                
                const startX = x + startRadius * Math.cos(angle);
                const startY = y + startRadius * Math.sin(angle);
                const endX = x + endRadius * Math.cos(angle);
                const endY = y + endRadius * Math.sin(angle);
                
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
            }
            
            // 添加形状标签
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            
            let label = '';
            switch (shapeType) {
                case 'circle': label = '圆形巧克力'; break;
                case 'square': label = '方形巧克力'; break;
                case 'heart': label = '心形巧克力'; break;
            }
            
            this.ctx.fillText(label, x, y + previewSize / 2 + 30);
        }
    }

    /**
     * 选择颜色
     */
    selectColor(color) {
        this.currentColor = color;
        
        // 更新按钮状态
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.remove('active');
        });
        document.querySelector(`.color-swatch[data-color="${color}"]`)?.classList.add('active');
        
        this.updateDesignInfo();
    }

    /**
     * 选择画笔大小
     */
    selectBrushSize(size) {
        this.brushSize = parseInt(size);
        
        // 更新滑块值
        const brushSizeSlider = document.getElementById('brush-size');
        if (brushSizeSlider) {
            brushSizeSlider.value = this.brushSize;
        }
        
        // 更新大小显示
        const sizeValueElement = document.getElementById('size-value');
        if (sizeValueElement) {
            sizeValueElement.textContent = `${this.brushSize}px`;
        }
        
        // 更新按钮状态
        document.querySelectorAll('.size-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`.size-option[data-size="${this.brushSize}"]`)?.classList.add('active');
        
        this.updateDesignInfo();
    }

    /**
     * 选择形状
     */
    selectShape(shape) {
        // 设置当前工具为形状
        this.currentTool = 'shape';
        this.selectedShape = shape;
        
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.shape-btn[data-shape="${shape}"]`)?.classList.add('active');
        
        // 更新工具按钮状态
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.tool-btn[data-tool="shape"]`)?.classList.add('active');
        
        this.updateDesignInfo();
    }
    
    /**
     * 选择巧克力模板（从外部按钮）
     * 注意：此方法只在用户确认后被调用，执行实际的模板切换操作，且不清空画布
     */
    selectTemplate(templateType) {
        this.addLog('selectTemplate方法调用，模板类型: ' + templateType);
        
        // 检查模板类型是否有效
        const validTemplates = ['circle', 'square', 'heart'];
        if (!validTemplates.includes(templateType)) {
            this.addLog('无效的模板类型: ' + templateType);
            return;
        }
        
        // 如果用户正在点击当前已选中的模板，则不做任何操作
        if (this.currentTemplateId === templateType) {
            this.addLog('点击的是当前已选中的模板，不做操作');
            return;
        }
        
        // 重要：在进行任何操作前，先保存当前状态
        // 记录当前选中的模板ID
        this.currentTemplateId = templateType;
        this.addLog('设置当前模板ID为: ' + templateType);
        
        // 更新按钮状态
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeButton = document.querySelector(`.template-btn[data-template="${templateType}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
            this.addLog('更新按钮状态，激活模板按钮');
        }
        
        // 确保canvas和ctx可用
        if (!this.canvas || !this.ctx || !this.backgroundCanvas || !this.backgroundCtx) {
            this.addLog('错误: canvas或ctx不可用');
            return;
        }
        
        // 确保背景画布尺寸与主画布完全匹配
        this.backgroundCanvas.width = this.canvas.width;
        this.backgroundCanvas.height = this.canvas.height;
        this.backgroundCanvas.style.width = '100%';
        this.backgroundCanvas.style.height = '100%';
        
        // 确保背景画布正确添加到DOM且可见
        const canvasContainer = this.canvas.parentElement;
        if (canvasContainer) {
            // 确保背景画布在DOM中
            if (!this.backgroundCanvas.parentElement) {
                canvasContainer.appendChild(this.backgroundCanvas);
                this.addLog('背景画布添加到DOM');
            }
            
            // 确保z-index设置正确，背景画布在主画布下方
            this.backgroundCanvas.style.position = 'absolute';
            this.backgroundCanvas.style.top = '0';
            this.backgroundCanvas.style.left = '0';
            this.backgroundCanvas.style.zIndex = '1';
            this.backgroundCanvas.style.display = 'block';
            this.backgroundCanvas.style.opacity = '1';
            
            this.canvas.style.position = 'relative';
            this.canvas.style.zIndex = '2';
            this.canvas.style.backgroundColor = 'transparent'; // 确保主画布透明
        }
        
        // 保存主画布当前内容到临时画布
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.canvas, 0, 0);
        this.addLog('已保存主画布当前内容到临时画布');
        
        // 清空背景画布，使用透明背景
        this.backgroundCtx.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
        
        // 计算画布中心位置和模板大小
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxSize = Math.min(this.canvas.width, this.canvas.height) * 0.7; // 正常大小的模板
        
        // 绘制模板形状，使用巧克力棕色
        this.backgroundCtx.fillStyle = '#D2691E'; // 巧克力棕色作为模板颜色
        
        switch (templateType) {
            case 'circle':
                this.backgroundCtx.beginPath();
                this.backgroundCtx.arc(centerX, centerY, maxSize / 2, 0, Math.PI * 2);
                this.backgroundCtx.fill();
                break;
            case 'square':
                this.backgroundCtx.fillRect(centerX - maxSize / 2, centerY - maxSize / 2, maxSize, maxSize);
                break;
            case 'heart':
                // 绘制心形
                this.backgroundCtx.beginPath();
                const topCurveHeight = maxSize * 0.3;
                this.backgroundCtx.moveTo(centerX, centerY - maxSize / 4);
                this.backgroundCtx.bezierCurveTo(
                    centerX - maxSize / 2, centerY - maxSize / 2 - topCurveHeight,
                    centerX - maxSize / 2, centerY + maxSize / 4,
                    centerX, centerY + maxSize / 2
                );
                this.backgroundCtx.bezierCurveTo(
                    centerX + maxSize / 2, centerY + maxSize / 4,
                    centerX + maxSize / 2, centerY - maxSize / 2 - topCurveHeight,
                    centerX, centerY - maxSize / 4
                );
                this.backgroundCtx.fill();
                break;
        }
        
        // 使用细线边框，更自然的外观
        this.backgroundCtx.strokeStyle = '#8B4513'; // 深棕色边框
        this.backgroundCtx.lineWidth = 2; // 细线边框
        
        switch (templateType) {
            case 'circle':
                this.backgroundCtx.beginPath();
                this.backgroundCtx.arc(centerX, centerY, maxSize / 2, 0, Math.PI * 2);
                this.backgroundCtx.stroke();
                break;
            case 'square':
                this.backgroundCtx.strokeRect(centerX - maxSize / 2, centerY - maxSize / 2, maxSize, maxSize);
                break;
            case 'heart':
                // 再次绘制心形边框
                this.backgroundCtx.beginPath();
                const topCurveHeight = maxSize * 0.3;
                this.backgroundCtx.moveTo(centerX, centerY - maxSize / 4);
                this.backgroundCtx.bezierCurveTo(
                    centerX - maxSize / 2, centerY - maxSize / 2 - topCurveHeight,
                    centerX - maxSize / 2, centerY + maxSize / 4,
                    centerX, centerY + maxSize / 2
                );
                this.backgroundCtx.bezierCurveTo(
                    centerX + maxSize / 2, centerY + maxSize / 4,
                    centerX + maxSize / 2, centerY - maxSize / 2 - topCurveHeight,
                    centerX, centerY - maxSize / 4
                );
                this.backgroundCtx.stroke();
                break;
        }
        this.addLog('已绘制模板形状: ' + templateType);
        
        // 在主画布上恢复之前保存的内容（不清空画布）
        this.ctx.drawImage(tempCanvas, 0, 0);
        
        // 保存状态
        this.saveState();
        this.templateSelected = true; // 标记已选择模板
        this.addLog('模板选择成功，templateSelected设置为: ' + this.templateSelected + '，当前模板ID: ' + this.currentTemplateId);
        
        // 创建模板名称映射
        const templateNames = {
            'circle': '圆形',
            'square': '方形',
            'heart': '心形'
        };
        
        // 显示已选择模板的提示
        this.showTemplateSelectedMessage(templateNames[templateType] || templateType);
        
        // 更新预览
        this.updatePreview();
        
        // 确保当前工具保持为画笔模式
        this.selectTool('brush');
    }
    
    /**
      * 显示已选择模板的提示消息
      */
    showTemplateSelectedMessage(shapeName) {
        // 移除之前的提示
        const oldMessage = document.getElementById('template-selected-message');
        if (oldMessage && oldMessage.parentNode) {
            oldMessage.parentNode.removeChild(oldMessage);
        }
        
        const messageElement = document.createElement('div');
        messageElement.id = 'template-selected-message';
        messageElement.className = 'template-selected-message';
        messageElement.style.position = 'absolute';
        messageElement.style.top = '10px';
        messageElement.style.right = '10px';
        messageElement.style.background = 'rgba(76, 175, 80, 0.9)';
        messageElement.style.color = 'white';
        messageElement.style.padding = '10px 15px';
        messageElement.style.borderRadius = '6px';
        messageElement.style.fontSize = '14px';
        messageElement.style.zIndex = '1000';
        messageElement.style.textAlign = 'center';
        messageElement.textContent = `已选择${shapeName}模板，现在可以使用画笔进行创作了！`;
        
        this.canvas.parentElement.appendChild(messageElement);
        
        // 3秒后自动消失
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 3000);
    }
    
    /**
     * 检查点是否在形状内
     */
    isPointInShape(pointX, pointY, shapeX, shapeY, shapeType, size) {
        // 对于简单形状，使用边界框进行检查
        const halfSize = size / 2;
        
        // 为每种形状定义一个稍微大一点的点击区域
        const padding = 20;
        
        // 圆形的边界框检查
        if (shapeType === 'circle') {
            const distance = Math.sqrt(Math.pow(pointX - shapeX, 2) + Math.pow(pointY - shapeY, 2));
            return distance <= halfSize + padding;
        }
        
        // 方形的边界框检查
        if (shapeType === 'square' || shapeType === 'heart') {
            return pointX >= shapeX - halfSize - padding &&
                   pointX <= shapeX + halfSize + padding &&
                   pointY >= shapeY - halfSize - padding &&
                   pointY <= shapeY + halfSize + padding;
        }
        
        return false;
    }
    
    // 在背景画布上绘制圆形
    drawCircleOnBackground(x, y, size) {
        this.backgroundCtx.beginPath();
        this.backgroundCtx.arc(x, y, size / 2, 0, Math.PI * 2);
        this.backgroundCtx.fill();
    }
    
    // 在背景画布上绘制方形
    drawSquareOnBackground(x, y, size) {
        this.backgroundCtx.beginPath();
        this.backgroundCtx.rect(x - size / 2, y - size / 2, size, size);
        this.backgroundCtx.fill();
    }
    
    // 在背景画布上绘制心形
    drawHeartOnBackground(x, y, size) {
        const scaling = size / 100;
        this.backgroundCtx.beginPath();
        this.backgroundCtx.moveTo(x, y - 25 * scaling);
        this.backgroundCtx.bezierCurveTo(
            x - 50 * scaling, y - 50 * scaling, 
            x - 50 * scaling, y - 5 * scaling, 
            x, y + 20 * scaling
        );
        this.backgroundCtx.bezierCurveTo(
            x - 50 * scaling, y - 50 * scaling, 
            x + 50 * scaling, y - 50 * scaling, 
            x, y - 25 * scaling
        );
        this.backgroundCtx.fill();
    }
    
    /**
     * 绘制形状
     */
    drawShape(x, y) {
        const size = this.brushSize * 10; // 形状大小基于画笔大小
        
        // 使用当前选中的颜色
        this.ctx.fillStyle = this.currentColor;
        
        // 根据选中的形状调用相应的绘制方法
        switch (this.selectedShape) {
            case 'circle':
                this.drawCircle(x, y, size);
                break;
            case 'square':
                this.drawSquare(x, y, size);
                break;
            case 'heart':
                this.drawHeart(x, y, size);
                break;
            case 'star':
                this.drawStar(x, y, size);
                break;
            default:
                console.warn('未知形状:', this.selectedShape);
                break;
        }
    }
    
    /**
     * 绘制心形
     */
    drawHeart(x, y, size) {
        this.ctx.beginPath();
        const topCurveHeight = size * 0.3;
        // 左上部曲线
        this.ctx.moveTo(x, y - topCurveHeight);
        // 左下半部曲线
        this.ctx.bezierCurveTo(
            x - size / 2, y - size / 2,
            x - size, y + topCurveHeight,
            x, y + size / 3
        );
        // 右下半部曲线
        this.ctx.bezierCurveTo(
            x + size, y + topCurveHeight,
            x + size / 2, y - size / 2,
            x, y - topCurveHeight
        );
        this.ctx.fill();
    }
    
    /**
     * 绘制星形
     */
    drawStar(x, y, size) {
        this.ctx.beginPath();
        const spikes = 5;
        const outerRadius = size / 2;
        const innerRadius = size / 4;
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const pointX = x + radius * Math.cos(angle);
            const pointY = y + radius * Math.sin(angle);
            
            if (i === 0) {
                this.ctx.moveTo(pointX, pointY);
            } else {
                this.ctx.lineTo(pointX, pointY);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    /**
     * 绘制圆形
     */
    drawCircle(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * 绘制方形
     */
    drawSquare(x, y, size) {
        this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }

    /**
     * 重置视图
     */
    resetView() {
        // 重置画布缩放和位置
        this.canvas.style.transform = 'none';
        this.canvas.style.transformOrigin = 'center';
    }

    /**
     * 添加文本
     */
    addText(text, x, y) {
        // 获取字体设置
        const fontFamily = document.getElementById('font-family')?.value || 'Arial';
        const fontSize = parseInt(document.getElementById('font-size')?.value || '24');
        
        // 创建文本元素对象
        const textElement = {
            id: Date.now(), // 唯一ID
            text: text,
            x: x || this.canvas.width / 2,
            y: y || this.canvas.height / 2,
            color: this.currentColor,
            fontFamily: fontFamily,
            fontSize: fontSize,
            scale: 1.0,
            rotation: 0
        };
        
        // 添加到文本元素数组
        this.textElements.push(textElement);
        
        // 选中新添加的文本元素
        this.selectedTextElement = textElement;
        
        // 绘制所有元素，但不清空画布
        this.renderElementsOnly();
        
        // 保存状态并更新预览
        this.saveState();
        this.updatePreview();
        
        return textElement;
    }
    
    /**
     * 渲染所有元素（文本、图片等）
     * 优化版本：避免清空画布和重新绘制背景，只更新动态内容
     */
    renderAllElements() {
        // 如果正在绘图，不进行全量渲染，避免干扰用户操作
        if (this.isDrawing) {
            return;
        }
        
        // 检测是否需要重绘背景模板
        let needRedrawBackground = false;
        if (!this.lastBackgroundRendered || this.templateSelected !== this.lastTemplateSelected) {
            needRedrawBackground = true;
            this.lastTemplateSelected = this.templateSelected;
        }
        
        // 如果不需要重绘背景，只更新元素层
        if (!needRedrawBackground) {
            this.renderElementsLayer();
            return;
        }
        
        // 需要重绘背景时，执行完整渲染
        // 注意：这里不再清空画布，而是使用分层渲染
        
        // 1. 绘制背景（包含模板）
        // 只在有背景画布时绘制，避免重复渲染模板
        if (this.backgroundCanvas && this.backgroundCtx) {
            // 使用临时画布来绘制背景，不影响已有内容
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // 在临时画布上绘制背景
            tempCtx.drawImage(this.backgroundCanvas, 0, 0);
            
            // 将背景绘制到主画布，使用source-over模式，避免覆盖已有内容
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.drawImage(tempCanvas, 0, 0);
            
            this.lastBackgroundRendered = true;
        }
        
        // 2. 绘制图片上传前的旧笔画（在图片之下）
        // 仅在第一次上传图片时显示旧笔画，避免重复渲染
        if (this.history.length > 0 && this.uploadedImage && !this.imageConfirmed) {
            // 获取图片上传前的历史状态
            const preImageState = this.getPreImageState();
            if (preImageState && preImageState.canvasData) {
                const oldCanvas = this.createCanvasFromData(preImageState.canvasData);
                if (oldCanvas) {
                    this.ctx.drawImage(oldCanvas, 0, 0);
                }
            }
        }
        
        // 3. 绘制未确认的图片（在旧笔画之上，新笔画之下）
        if (this.uploadedImage && !this.imageConfirmed) {
            this.drawProcessedImage();
        }
        
        // 4. 绘制当前所有用户绘制内容（不包括历史状态）
        if (this.offscreenCanvas && this.offscreenCtx) {
            this.ctx.drawImage(this.offscreenCanvas, 0, 0);
        }
        
        // 5. 文本元素（在最上层）
        this.renderTextElements();
    }
    
    /**
     * 渲染元素层（仅更新动态内容）
     * 优化版本：保留已有笔画和背景，只添加新元素
     */
    renderElementsLayer() {
        // 创建临时画布来组合新内容
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 1. 在临时画布上绘制主画布的当前内容（保留已有笔画）
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // 2. 在临时画布上绘制背景（如果已缓存且需要更新）
        if (this.backgroundCanvas && this.backgroundCtx) {
            // 使用globalCompositeOperation确保背景只在透明区域显示
            tempCtx.globalCompositeOperation = 'destination-over';
            tempCtx.drawImage(this.backgroundCanvas, 0, 0);
            tempCtx.globalCompositeOperation = 'source-over';
        }
        
        // 3. 绘制动态内容到临时画布（在背景之上，已有内容之下）
        this.renderDynamicContentToCanvas(tempCtx);
        
        // 4. 将组合后的内容绘制回主画布，覆盖已有内容但保留笔画
        // 使用destination-over模式，确保新内容不会覆盖已有笔画
        this.ctx.globalCompositeOperation = 'destination-over';
        this.ctx.drawImage(tempCanvas, 0, 0);
        this.ctx.globalCompositeOperation = 'source-over';
    }
    
    /**
     * 渲染动态内容到指定画布
     */
    renderDynamicContentToCanvas(targetCtx) {
        // 1. 绘制图片上传前的旧笔画（在图片之下）
        if (this.history.length > 0 && this.uploadedImage && !this.imageConfirmed) {
            const preImageState = this.getPreImageState();
            if (preImageState && preImageState.canvasData) {
                const oldCanvas = this.createCanvasFromData(preImageState.canvasData);
                if (oldCanvas) {
                    targetCtx.drawImage(oldCanvas, 0, 0);
                }
            }
        }
        
        // 2. 绘制未确认的图片（在旧笔画之上，新笔画之下）
        if (this.uploadedImage && !this.imageConfirmed) {
            // 直接绘制图片到目标画布
            if (this.uploadedImage.img && this.uploadedImage.img.complete) {
                // 计算缩放后的图片尺寸
                const scaledWidth = this.uploadedImage.width * this.imageScale;
                const scaledHeight = this.uploadedImage.height * this.imageScale;
                
                // 保存当前合成模式
                const originalCompositeOperation = targetCtx.globalCompositeOperation;
                
                // 设置图片合成模式为 source-over（叠加模式）
                targetCtx.globalCompositeOperation = 'source-over';
                
                // 绘制图片
                targetCtx.drawImage(
                    this.uploadedImage.img,
                    this.imagePosition.x,
                    this.imagePosition.y,
                    scaledWidth,
                    scaledHeight
                );
                
                // 恢复原始合成模式
                targetCtx.globalCompositeOperation = originalCompositeOperation;
            }
        }
        
        // 3. 绘制当前用户绘制内容
        if (this.offscreenCanvas && this.offscreenCtx) {
            targetCtx.drawImage(this.offscreenCanvas, 0, 0);
        }
        
        // 4. 渲染文本元素
        this.renderTextElements();
    }
    
    /**
     * 渲染动态内容（图片、绘图、文本）
     */
    renderDynamicContent() {
        // 1. 绘制图片上传前的旧笔画（在图片之下）
        if (this.history.length > 0 && this.uploadedImage && !this.imageConfirmed) {
            const preImageState = this.getPreImageState();
            if (preImageState && preImageState.canvasData) {
                const oldCanvas = this.createCanvasFromData(preImageState.canvasData);
                if (oldCanvas) {
                    this.ctx.drawImage(oldCanvas, 0, 0);
                }
            }
        }
        
        // 2. 绘制未确认的图片（在旧笔画之上，新笔画之下）
        if (this.uploadedImage && !this.imageConfirmed) {
            this.drawProcessedImage();
        }
        
        // 3. 绘制当前用户绘制内容
        if (this.offscreenCanvas && this.offscreenCtx) {
            this.ctx.drawImage(this.offscreenCanvas, 0, 0);
        }
        
        // 4. 渲染文本元素
        this.renderTextElements();
    }
    
    /**
     * 渲染文本元素
     */
    renderTextElements() {
        this.textElements.forEach(element => {
            this.ctx.save();
            
            // 设置字体和颜色
            this.ctx.font = `${element.fontSize * element.scale}px ${element.fontFamily}`;
            this.ctx.fillStyle = element.color;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 应用变换
            this.ctx.translate(element.x, element.y);
            this.ctx.rotate(element.rotation * Math.PI / 180);
            
            // 绘制文本
            this.ctx.fillText(element.text, 0, 0);
            
            // 如果是选中的元素，绘制边框
            if (this.selectedTextElement && this.selectedTextElement.id === element.id) {
                this.drawSelectionBox(element);
            }
            
            this.ctx.restore();
        });
    }
    
    /**
     * 获取图片上传前的历史状态
     */
    getPreImageState() {
        // 查找图片上传前的最后一个状态
        for (let i = this.history.length - 1; i >= 0; i--) {
            if (this.history[i] && !this.history[i].hasImageUpload) {
                return this.history[i];
            }
        }
        return null;
    }
    
    /**
     * 从画布数据创建canvas元素
     */
    createCanvasFromData(canvasData) {
        if (!canvasData) return null;
        
        const img = new Image();
        img.src = canvasData;
        
        const canvas = document.createElement('canvas');
        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;
        const ctx = canvas.getContext('2d');
        
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
        };
        
        return canvas;
    }
    
    /**
     * 渲染所有元素但不清空画布（保留用户绘制内容）
     * 优化版本：仅更新元素层，避免全画布重绘
     */
    renderElementsOnly() {
        // 如果正在绘图，不进行渲染
        if (this.isDrawing) {
            return;
        }
        
        // 仅渲染元素层，不重新绘制背景
        this.renderElementsLayer();
    }
    
    /**
     * 绘制选中边框
     */
    drawSelectionBox(element) {
        this.ctx.save();
        
        // 测量文本尺寸
        this.ctx.font = `${element.fontSize * element.scale}px ${element.fontFamily}`;
        const metrics = this.ctx.measureText(element.text);
        const textHeight = element.fontSize * element.scale;
        const padding = 5;
        
        // 绘制边框
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(
            -metrics.width / 2 - padding,
            -textHeight / 2 - padding,
            metrics.width + padding * 2,
            textHeight + padding * 2
        );
        
        // 绘制缩放控制点
        const controlSize = 8;
        const points = [
            {x: -metrics.width/2 - padding, y: -textHeight/2 - padding}, // 左上
            {x: 0, y: -textHeight/2 - padding}, // 上中
            {x: metrics.width/2 + padding, y: -textHeight/2 - padding}, // 右上
            {x: metrics.width/2 + padding, y: 0}, // 右中
            {x: metrics.width/2 + padding, y: textHeight/2 + padding}, // 右下
            {x: 0, y: textHeight/2 + padding}, // 下中
            {x: -metrics.width/2 - padding, y: textHeight/2 + padding}, // 左下
            {x: -metrics.width/2 - padding, y: 0} // 左中
        ];
        
        points.forEach(point => {
            this.ctx.fillStyle = '#3498db';
            this.ctx.fillRect(point.x - controlSize/2, point.y - controlSize/2, controlSize, controlSize);
        });
        
        this.ctx.restore();
    }
    
    /**
     * 检查点击是否在文本元素上
     */
    getTextElementAtPosition(x, y) {
        for (let i = this.textElements.length - 1; i >= 0; i--) { // 从后往前检查，优先选择顶层元素
            const element = this.textElements[i];
            
            // 测量文本尺寸
            this.ctx.font = `${element.fontSize * element.scale}px ${element.fontFamily}`;
            const metrics = this.ctx.measureText(element.text);
            const textHeight = element.fontSize * element.scale;
            const padding = 5;
            
            // 计算文本边界
            const left = element.x - metrics.width / 2 - padding;
            const right = element.x + metrics.width / 2 + padding;
            const top = element.y - textHeight / 2 - padding;
            const bottom = element.y + textHeight / 2 + padding;
            
            if (x >= left && x <= right && y >= top && y <= bottom) {
                return element;
            }
        }
        return null;
    }

    /**
     * 添加日志到控制台（隐藏界面显示）
     */
    addLog(message) {
        // 只输出到控制台，不创建界面元素
        console.log(`[Designer] ${message}`);
    }
    
    /**
     * 处理图片上传并自动进行线条提取
     */
    handleImageUpload(file) {
        // 检查是否已选择模板
        if (!this.templateSelected) {
            alert('请先选择一个模板再上传图片');
            return;
        }
        
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件');
            return;
        }
        
        this.showToast('正在处理图片...');
        
        // 重置图片相关状态，允许重新上传
        this.uploadedImage = null;
        this.imageConfirmed = false;
        this.isDragging = false;
        
        // 保存图片上传前的状态到历史记录
        this.saveState();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const img = new Image();
                
                img.onload = () => {
                    // 计算合适的缩放比例
                    const maxWidth = this.canvas.width * 0.8;
                    const maxHeight = this.canvas.height * 0.8;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }
                    
                    // 保存原始图片信息
                    this.originalImage = {
                        img: img,
                        width: width,
                        height: height,
                        originalDataUrl: event.target.result
                    };
                    
                    // 自动进行线条提取
                    this.extractImageEdges(img, width, height).then(processedImage => {
                        // 保存处理后的线条图片
                        this.uploadedImage = {
                            img: processedImage,
                            width: width,
                            height: height,
                            isProcessed: true
                        };
                        
                        // 初始化缩放比例和位置
                        this.imageScale = 1.0;
                        this.imagePosition = {
                            x: (this.canvas.width - width) / 2,
                            y: (this.canvas.height - height) / 2
                        };
                        
                        // 自动切换到图片工具
                        this.selectTool('image');
                        
                        // 重新绘制所有元素
                        this.renderElementsOnly();
                        
                        // 显示线条编辑控制面板
                        this.showEdgeEditingPanel();
                        
                        // 更新预览
                        this.updatePreview();
                        
                        this.showToast('线条提取完成！');
                        resolve();
                    }).catch(error => {
                        console.error('线条提取失败:', error);
                        this.showToast('图片处理失败，请重试');
                        reject(error);
                    });
                };
                
                img.onerror = () => {
                    alert('图片加载失败，请重试');
                    reject(new Error('Image loading failed'));
                };
                
                img.src = event.target.result;
            };
            
            reader.onerror = () => {
                alert('文件读取失败，请重试');
                reject(new Error('File reading failed'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * 显示线条编辑控制面板
     */
    showEdgeEditingPanel() {
        // 检查是否已有编辑面板
        let editingPanel = document.getElementById('edge-editing-panel');
        if (editingPanel) {
            editingPanel.remove();
        }
        
        // 创建编辑面板
        editingPanel = document.createElement('div');
        editingPanel.id = 'edge-editing-panel';
        editingPanel.className = 'edge-editing-panel';
        editingPanel.innerHTML = `
            <div class="editing-header">
                <h4><i class="fas fa-paint-brush"></i> 线条编辑</h4>
                <button class="close-btn" onclick="document.getElementById('edge-editing-panel').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="editing-options">
                <div class="option-group">
                    <label>线条颜色：</label>
                    <input type="color" id="line-color" value="#000000">
                </div>
                <div class="option-group">
                    <label>线条粗细：</label>
                    <input type="range" id="line-thickness" min="1" max="10" value="2">
                    <span id="thickness-value">2px</span>
                </div>
                <div class="option-group">
                    <label>线条透明度：</label>
                    <input type="range" id="line-opacity" min="10" max="100" value="100">
                    <span id="opacity-value">100%</span>
                </div>
                <div class="processing-buttons">
                    <button id="reprocess-btn" class="btn-secondary">
                        <i class="fas fa-sync"></i> 重新处理
                    </button>
                    <button id="save-edges-btn" class="btn-success">
                        <i class="fas fa-save"></i> 确认使用
                    </button>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(editingPanel);
        
        // 添加事件监听器
        this.setupEdgeEditingEvents();
    }
    
    /**
     * 设置线条编辑事件监听器
     */
    setupEdgeEditingEvents() {
        // 线条粗细滑块
        const thicknessSlider = document.getElementById('line-thickness');
        const thicknessValue = document.getElementById('thickness-value');
        if (thicknessSlider) {
            thicknessSlider.addEventListener('input', () => {
                thicknessValue.textContent = thicknessSlider.value + 'px';
                this.updateLineStyle();
            });
        }
        
        // 透明度滑块
        const opacitySlider = document.getElementById('line-opacity');
        const opacityValue = document.getElementById('opacity-value');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', () => {
                opacityValue.textContent = opacitySlider.value + '%';
                this.updateLineStyle();
            });
        }
        
        // 颜色选择器
        const colorPicker = document.getElementById('line-color');
        if (colorPicker) {
            colorPicker.addEventListener('input', () => {
                this.updateLineStyle();
            });
        }
        
        // 重新处理按钮
        const reprocessBtn = document.getElementById('reprocess-btn');
        if (reprocessBtn) {
            reprocessBtn.addEventListener('click', () => {
                this.reprocessImage();
            });
        }
        
        // 保存按钮
        const saveBtn = document.getElementById('save-edges-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.confirmImage();
            });
        }
    }
    
    /**
     * 专业的灰度化处理
     */
    grayscale(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const grayData = new Uint8ClampedArray(width * height);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 使用标准灰度化公式：Gray = 0.299*R + 0.587*G + 0.114*B
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            grayData[i / 4] = gray;
        }
        
        return grayData;
    }
    
    /**
     * 改进的高斯模糊算法
     */
    improvedGaussianBlur(grayData, width, height, sigma = 1.4) {
        const kernelSize = 5;
        const kernelRadius = Math.floor(kernelSize / 2);
        const kernel = this.createGaussianKernel(kernelSize, sigma);
        
        const blurredData = new Uint8ClampedArray(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sum = 0;
                let weightSum = 0;
                
                for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
                    for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
                        const pixelX = Math.max(0, Math.min(width - 1, x + kx));
                        const pixelY = Math.max(0, Math.min(height - 1, y + ky));
                        const pixelValue = grayData[pixelY * width + pixelX];
                        const weight = kernel[ky + kernelRadius][kx + kernelRadius];
                        
                        sum += pixelValue * weight;
                        weightSum += weight;
                    }
                }
                
                blurredData[y * width + x] = Math.round(sum / weightSum);
            }
        }
        
        return blurredData;
    }
    
    /**
     * 创建高斯核
     */
    createGaussianKernel(size, sigma) {
        const kernel = [];
        const radius = Math.floor(size / 2);
        let sum = 0;
        
        for (let y = -radius; y <= radius; y++) {
            const row = [];
            for (let x = -radius; x <= radius; x++) {
                const value = (1 / (2 * Math.PI * sigma * sigma)) * 
                              Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
                row.push(value);
                sum += value;
            }
            kernel.push(row);
        }
        
        // 标准化核
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                kernel[y][x] /= sum;
            }
        }
        
        return kernel;
    }
    
    /**
     * 改进的Canny边缘检测
     */
    improvedCannyEdgeDetection(grayData, width, height, lowThreshold = 20, highThreshold = 60) {
        // 1. 高斯模糊
        const blurredData = this.improvedGaussianBlur(grayData, width, height);
        
        // 2. 计算梯度强度和方向
        const { magnitude, direction } = this.calculateGradient(blurredData, width, height);
        
        // 3. 非极大值抑制
        const suppressed = this.nonMaximumSuppression(magnitude, direction, width, height);
        
        // 4. 双阈值检测和边缘连接
        const edges = this.doubleThreshold(suppressed, width, height, lowThreshold, highThreshold);
        
        return edges;
    }
    
    /**
     * 计算梯度强度和方向
     */
    calculateGradient(grayData, width, height) {
        const magnitude = new Float32Array(width * height);
        const direction = new Float32Array(width * height);
        
        // Sobel算子
        const sobelX = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        
        const sobelY = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1]
        ];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;
                
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixelValue = grayData[(y + ky) * width + (x + kx)];
                        gx += pixelValue * sobelX[ky + 1][kx + 1];
                        gy += pixelValue * sobelY[ky + 1][kx + 1];
                    }
                }
                
                magnitude[y * width + x] = Math.sqrt(gx * gx + gy * gy);
                direction[y * width + x] = Math.atan2(gy, gx) * 180 / Math.PI;
            }
        }
        
        return { magnitude, direction };
    }
    
    /**
     * 非极大值抑制
     */
    nonMaximumSuppression(magnitude, direction, width, height) {
        const suppressed = new Float32Array(width * height);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const angle = direction[y * width + x];
                const mag = magnitude[y * width + x];
                
                let q = 255, r = 255;
                
                // 将角度量化到4个方向
                if ((angle >= -22.5 && angle < 22.5) || (angle >= 157.5 || angle < -157.5)) {
                    q = magnitude[y * width + (x + 1)];
                    r = magnitude[y * width + (x - 1)];
                } else if ((angle >= 22.5 && angle < 67.5) || (angle >= -157.5 && angle < -112.5)) {
                    q = magnitude[(y + 1) * width + (x + 1)];
                    r = magnitude[(y - 1) * width + (x - 1)];
                } else if ((angle >= 67.5 && angle < 112.5) || (angle >= -112.5 && angle < -67.5)) {
                    q = magnitude[(y + 1) * width + x];
                    r = magnitude[(y - 1) * width + x];
                } else {
                    q = magnitude[(y + 1) * width + (x - 1)];
                    r = magnitude[(y - 1) * width + (x + 1)];
                }
                
                suppressed[y * width + x] = (mag >= q && mag >= r) ? mag : 0;
            }
        }
        
        return suppressed;
    }
    
    /**
     * 双阈值检测和边缘连接
     */
    doubleThreshold(suppressed, width, height, lowThreshold, highThreshold) {
        const edges = new Uint8ClampedArray(width * height);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const mag = suppressed[y * width + x];
                
                if (mag >= highThreshold) {
                    edges[y * width + x] = 255; // 强边缘
                } else if (mag >= lowThreshold) {
                    edges[y * width + x] = 128; // 弱边缘
                } else {
                    edges[y * width + x] = 0;   // 非边缘
                }
            }
        }
        
        // 连接弱边缘
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (edges[y * width + x] === 128) {
                    // 检查周围是否有强边缘
                    let hasStrongNeighbor = false;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (edges[(y + dy) * width + (x + dx)] === 255) {
                                hasStrongNeighbor = true;
                                break;
                            }
                        }
                        if (hasStrongNeighbor) break;
                    }
                    
                    edges[y * width + x] = hasStrongNeighbor ? 255 : 0;
                }
            }
        }
        
        return edges;
    }
    
    /**
     * 高斯模糊（降噪）
     */
    gaussianBlur(imageData, radius = 1) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const blurredData = new Uint8ClampedArray(width * height * 4);
        
        // 简化版高斯核（3x3）
        const kernel = [
            [1/16, 2/16, 1/16],
            [2/16, 4/16, 2/16],
            [1/16, 2/16, 1/16]
        ];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let r = 0, g = 0, b = 0, a = 0;
                
                // 3x3卷积
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
                        const weight = kernel[ky + 1][kx + 1];
                        
                        r += data[pixelIndex] * weight;
                        g += data[pixelIndex + 1] * weight;
                        b += data[pixelIndex + 2] * weight;
                        a += data[pixelIndex + 3] * weight;
                    }
                }
                
                const resultIndex = (y * width + x) * 4;
                blurredData[resultIndex] = Math.round(r);
                blurredData[resultIndex + 1] = Math.round(g);
                blurredData[resultIndex + 2] = Math.round(b);
                blurredData[resultIndex + 3] = Math.round(a);
            }
        }
        
        return new ImageData(blurredData, width, height);
    }
    
    /**
     * Canny边缘检测算法
     */
    cannyEdgeDetection(imageData, lowThreshold = 50, highThreshold = 100) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // 步骤1：灰度化
        const grayImageData = this.grayscale(imageData);
        
        // 步骤2：高斯模糊降噪
        const blurredImageData = this.gaussianBlur(grayImageData);
        
        // 步骤3：计算梯度强度和方向
        const gradientData = new Uint8ClampedArray(width * height * 4);
        const gradientMagnitude = new Float32Array(width * height);
        const gradientDirection = new Float32Array(width * height);
        
        // Sobel算子核
        const sobelX = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        
        const sobelY = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1]
        ];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;
                
                // 应用Sobel算子
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
                        const gray = blurredImageData.data[pixelIndex];
                        
                        gx += gray * sobelX[ky + 1][kx + 1];
                        gy += gray * sobelY[ky + 1][kx + 1];
                    }
                }
                
                // 计算梯度幅度和方向
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                const direction = Math.atan2(gy, gx) * 180 / Math.PI;
                
                gradientMagnitude[y * width + x] = magnitude;
                gradientDirection[y * width + x] = direction;
            }
        }
        
        // 步骤4：非极大值抑制
        const suppressedData = new Uint8ClampedArray(width * height * 4);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const angle = gradientDirection[y * width + x];
                const magnitude = gradientMagnitude[y * width + x];
                
                // 将角度量化到4个方向
                let qx = 0, qy = 0;
                if ((angle >= -22.5 && angle < 22.5) || (angle >= 157.5 || angle < -157.5)) {
                    qx = 1; qy = 0; // 水平方向
                } else if ((angle >= 22.5 && angle < 67.5) || (angle >= -157.5 && angle < -112.5)) {
                    qx = 1; qy = 1; // 45度方向
                } else if ((angle >= 67.5 && angle < 112.5) || (angle >= -112.5 && angle < -67.5)) {
                    qx = 0; qy = 1; // 垂直方向
                } else {
                    qx = -1; qy = 1; // 135度方向
                }
                
                // 比较相邻像素
                const mag1 = gradientMagnitude[(y + qy) * width + (x + qx)];
                const mag2 = gradientMagnitude[(y - qy) * width + (x - qx)];
                
                let edgeValue = 0;
                if (magnitude >= mag1 && magnitude >= mag2 && magnitude > lowThreshold) {
                    edgeValue = magnitude > highThreshold ? 255 : 128; // 强边缘和弱边缘
                }
                
                const pixelIndex = (y * width + x) * 4;
                suppressedData[pixelIndex] = edgeValue;
                suppressedData[pixelIndex + 1] = edgeValue;
                suppressedData[pixelIndex + 2] = edgeValue;
                suppressedData[pixelIndex + 3] = 255;
            }
        }
        
        return new ImageData(suppressedData, width, height);
    }
    
    /**
     * 提取图片边缘（新版本）
     */
    extractImageEdges(img, width, height) {
        return new Promise((resolve, reject) => {
            try {
                // 创建临时画布
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = width;
                tempCanvas.height = height;
                
                // 绘制原始图片
                tempCtx.drawImage(img, 0, 0, width, height);
                
                // 获取图像数据
                const imageData = tempCtx.getImageData(0, 0, width, height);
                
                // 1. 灰度化
                const grayData = this.grayscale(imageData);
                
                // 2. 改进的Canny边缘检测
                const edgeData = this.improvedCannyEdgeDetection(grayData, width, height);
                
                // 3. 创建边缘图像
                const edgeImageData = this.createEdgeImage(edgeData, width, height);
                
                // 4. 转换为图片
                tempCtx.putImageData(edgeImageData, 0, 0);
                
                const processedImg = new Image();
                processedImg.onload = () => {
                    resolve(processedImg);
                };
                processedImg.onerror = () => {
                    reject(new Error('处理后的图片加载失败'));
                };
                processedImg.src = tempCanvas.toDataURL();
                
            } catch (error) {
                console.error('边缘检测失败:', error);
                reject(error);
            }
        });
    }
    
    /**
     * 创建边缘图像
     */
    createEdgeImage(edgeData, width, height) {
        const imageData = new ImageData(width, height);
        
        for (let i = 0; i < edgeData.length; i++) {
            const value = edgeData[i];
            const pixelIndex = i * 4;
            
            if (value === 255) {
                // 边缘像素 - 黑色
                imageData.data[pixelIndex] = 0;     // R
                imageData.data[pixelIndex + 1] = 0; // G
                imageData.data[pixelIndex + 2] = 0; // B
                imageData.data[pixelIndex + 3] = 255; // Alpha
            } else {
                // 非边缘像素 - 白色透明
                imageData.data[pixelIndex] = 255;     // R
                imageData.data[pixelIndex + 1] = 255; // G
                imageData.data[pixelIndex + 2] = 255; // B
                imageData.data[pixelIndex + 3] = 0;   // Alpha
            }
        }
        
        return imageData;
    }
    
    /**
     * 更新线条样式
     */
    updateLineStyle() {
        if (!this.uploadedImage || !this.uploadedImage.isProcessed) return;
        
        const colorPicker = document.getElementById('line-color');
        const thicknessSlider = document.getElementById('line-thickness');
        const opacitySlider = document.getElementById('line-opacity');
        
        if (!colorPicker || !thicknessSlider || !opacitySlider) return;
        
        // 在这里可以实现线条样式的实时更新
        // 由于性能考虑，可以优化为只在保存时应用样式
        this.showToast('线条样式已更新');
    }
    
    /**
     * 重新处理图片
     */
    reprocessImage() {
        if (!this.originalImage) {
            this.showToast('没有原始图片数据');
            return;
        }
        
        this.showToast('正在重新处理图片...');
        
        this.extractImageEdges(
            this.originalImage.img, 
            this.originalImage.width, 
            this.originalImage.height
        ).then(processedImage => {
            this.uploadedImage.img = processedImage;
            this.renderElementsOnly();
            this.updatePreview();
            this.showToast('重新处理完成！');
        }).catch(error => {
            console.error('重新处理失败:', error);
            this.showToast('重新处理失败，请重试');
        });
    }
    
    /**
     * 重置图片到原始状态
     */
    resetImageToOriginal() {
        if (!this.uploadedImage || !this.uploadedImage.originalDataUrl) {
            alert('没有原始图片数据');
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            this.uploadedImage.img = img;
            this.renderElementsOnly();
            this.updatePreview();
            this.showToast('图片已重置到原始状态');
        };
        img.src = this.uploadedImage.originalDataUrl;
    }
    
    /**
     * 保存提取的线条
     */
    saveExtractedEdges() {
        if (!this.uploadedImage) {
            alert('请先上传图片并提取线条');
            return;
        }
        
        // 将线条图片绘制到背景画布上，使其成为设计的一部分
        this.confirmImage();
        this.showToast('线条已保存为设计元素');
    }
    
    /**
     * 绘制上传的图片
     */
    drawProcessedImage() {
        // 确保有上传的图片
        if (!this.uploadedImage || !this.uploadedImage.img) {
            return;
        }
        
        // 确保图片加载完成
        if (!this.uploadedImage.img.complete) {
            return;
        }
        
        // 确保有有效的缩放比例和位置
        if (typeof this.imageScale !== 'number' || isNaN(this.imageScale)) {
            this.imageScale = 1.0;
        }
        
        if (!this.imagePosition || typeof this.imagePosition.x !== 'number' || typeof this.imagePosition.y !== 'number') {
            this.imagePosition = {
                x: (this.canvas.width - this.uploadedImage.width) / 2,
                y: (this.canvas.height - this.uploadedImage.height) / 2
            };
        }
        
        // 计算缩放后的图片尺寸
        const scaledWidth = this.uploadedImage.width * this.imageScale;
        const scaledHeight = this.uploadedImage.height * this.imageScale;
        
        // 保存当前合成模式
        const originalCompositeOperation = this.ctx.globalCompositeOperation;
        
        // 设置图片合成模式为 source-over（叠加模式，不覆盖背景）
        this.ctx.globalCompositeOperation = 'source-over';
        
        // 绘制图片
        this.ctx.drawImage(
            this.uploadedImage.img,
            this.imagePosition.x,
            this.imagePosition.y,
            scaledWidth,
            scaledHeight
        );
        
        // 恢复原始合成模式
        this.ctx.globalCompositeOperation = originalCompositeOperation;
        
        // 如果图片未确认，绘制确认和取消按钮
        if (!this.imageConfirmed) {
            this.drawImageButtons(this.imagePosition.x, this.imagePosition.y, scaledWidth, scaledHeight);
        }
    }
    
    /**
     * 绘制图片的确认和取消按钮
     */
    drawImageButtons(x, y, width, height) {
        const buttonSize = 30;
        const buttonSpacing = 10;
        
        // 确认按钮 (✓) - 移到左边
        const confirmButtonX = x + width - buttonSize * 2 - buttonSpacing * 2;
        const confirmButtonY = y - buttonSize - buttonSpacing;
        
        // 绘制确认按钮背景
        this.ctx.save();
        this.ctx.fillStyle = '#44ff44';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(confirmButtonX + buttonSize / 2, confirmButtonY + buttonSize / 2, buttonSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 绘制✓符号
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(confirmButtonX + buttonSize * 0.25, confirmButtonY + buttonSize * 0.5);
        this.ctx.lineTo(confirmButtonX + buttonSize * 0.45, confirmButtonY + buttonSize * 0.7);
        this.ctx.lineTo(confirmButtonX + buttonSize * 0.75, confirmButtonY + buttonSize * 0.3);
        this.ctx.stroke();
        
        // 取消按钮 (X) - 移到右边
        const cancelButtonX = x + width - buttonSize - buttonSpacing;
        const cancelButtonY = y - buttonSize - buttonSpacing;
        
        // 绘制取消按钮背景
        this.ctx.fillStyle = '#ff4444';
        this.ctx.beginPath();
        this.ctx.arc(cancelButtonX + buttonSize / 2, cancelButtonY + buttonSize / 2, buttonSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 绘制X符号
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(cancelButtonX + buttonSize * 0.25, cancelButtonY + buttonSize * 0.25);
        this.ctx.lineTo(cancelButtonX + buttonSize * 0.75, cancelButtonY + buttonSize * 0.75);
        this.ctx.moveTo(cancelButtonX + buttonSize * 0.75, cancelButtonY + buttonSize * 0.25);
        this.ctx.lineTo(cancelButtonX + buttonSize * 0.25, cancelButtonY + buttonSize * 0.75);
        this.ctx.stroke();
        

        
        this.ctx.restore();
        
        // 保存按钮位置信息以便后续检测点击
        this.buttonPositions = {
            cancel: { x: cancelButtonX, y: cancelButtonY, size: buttonSize },
            confirm: { x: confirmButtonX, y: confirmButtonY, size: buttonSize }
        };
    }
    
    /**
      * 确认图片 - 将图片固定为画布的一部分
      */
     confirmImage() {
         console.log('确认图片，固定到画布');
         this.addLog('用户确认图片，已固定到画布');
         
         // 设置图片已确认状态
         this.imageConfirmed = true;
         
         // 将图片绘制到背景画布上，使其成为画布的一部分
         if (this.backgroundCtx && this.uploadedImage) {
             const scaledWidth = this.uploadedImage.width * this.imageScale;
             const scaledHeight = this.uploadedImage.height * this.imageScale;
             
             this.backgroundCtx.save();
             this.backgroundCtx.drawImage(
                 this.uploadedImage.img,
                 this.imagePosition.x,
                 this.imagePosition.y,
                 scaledWidth,
                 scaledHeight
             );
             this.backgroundCtx.restore();
         }
         
         // 清除上传的图片信息，准备下一次上传
         this.uploadedImage = null;
         this.isDragging = false;
         
         // 重新渲染所有元素，显示正确的图层顺序
         this.renderAllElements();
         
         // 切换回画笔工具
         this.selectTool('brush');
         
         // 更新历史记录
         this.saveState();
         
         // 清空上传input的值，允许再次上传新图片
         const uploadInput = document.getElementById('image-upload-input');
         if (uploadInput) {
             uploadInput.value = '';
             console.log('已清空上传input的值');
         }
     }
    
    /**
      * 取消图片上传
      */
     cancelImage() {
         console.log('取消图片上传');
         this.addLog('用户取消图片上传');
         
         // 清除上传的图片信息
         this.uploadedImage = null;
         this.isDragging = false;
         this.imageConfirmed = false;
         
         // 清空画布并重新渲染背景
         this.clearCanvas();
         this.renderBackground();
         
         // 切换回画笔工具
         this.selectTool('brush');
         
         // 清空上传input的值，允许再次上传同一张图片
         const uploadInput = document.getElementById('image-upload-input');
         if (uploadInput) {
             uploadInput.value = '';
             console.log('已清空上传input的值');
         }
     }

    /**
     * 更新预览
     */
    updatePreview() {
        if (!this.previewCanvas || !this.previewCtx) return;
        
        // 清空预览画布
        this.previewCtx.fillStyle = '#FFFFFF';
        this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        
        // 确保预览画布保持与主画布相同的宽高比
        const aspectRatio = this.canvas.width / this.canvas.height;
        
        // 计算预览画布中能容纳的最大尺寸，保持比例
        let previewWidth = this.previewCanvas.width;
        let previewHeight = previewWidth / aspectRatio;
        
        // 如果计算出的高度超过预览画布高度，则以高度为基准
        if (previewHeight > this.previewCanvas.height) {
            previewHeight = this.previewCanvas.height;
            previewWidth = previewHeight * aspectRatio;
        }
        
        // 应用缩放级别
        previewWidth *= this.previewZoomLevel;
        previewHeight *= this.previewZoomLevel;
        
        // 计算居中显示时的偏移量
        const offsetX = (this.previewCanvas.width - previewWidth) / 2;
        const offsetY = (this.previewCanvas.height - previewHeight) / 2;
        
        // 绘制缩放后的内容，确保比例正确
        this.previewCtx.drawImage(
            this.canvas,
            0, 0, this.canvas.width, this.canvas.height,
            offsetX, offsetY, previewWidth, previewHeight
        );
    }
    
    /**
     * 确保Canvas元素的物理尺寸和CSS尺寸一致，防止图像变形
     */
    ensureCanvasProportions() {
        if (!this.canvas) return;
        
        // 获取Canvas的计算样式
        const computedStyle = window.getComputedStyle(this.canvas);
        const displayWidth = parseInt(computedStyle.width, 10);
        const displayHeight = parseInt(computedStyle.height, 10);
        
        // 仅在实际显示尺寸与物理尺寸不同时进行调整
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            // 保存当前内容
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // 更新物理尺寸
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            
            // 更新backgroundCanvas尺寸
            if (this.backgroundCanvas) {
                this.backgroundCanvas.width = displayWidth;
                this.backgroundCanvas.height = displayHeight;
            }
            
            // 恢复内容
            this.ctx.putImageData(imageData, 0, 0);
            
            // 更新canvasSize对象
            this.canvasSize = { width: displayWidth, height: displayHeight };
        }
    }

    /**
     * 保存当前状态到历史记录
     */
    saveState() {
        // 确保ctx存在
        if (!this.ctx) return;
        
        // 检查画布尺寸是否有效
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            console.warn('无法保存状态：画布尺寸无效');
            return;
        }
        
        // 移除历史记录中当前索引之后的所有状态
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        try {
            // 保存当前画布状态
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.history.push(imageData);
            this.historyIndex = this.history.length - 1;
            
            // 同时确保离屏画布与主画布保持同步
            if (this.offscreenCanvas && this.offscreenCtx) {
                this.offscreenCtx.putImageData(imageData, 0, 0);
            }
            
            // 限制历史记录数量
            if (this.history.length > 50) {
                this.history.shift();
                this.historyIndex--;
            }
            
            this.updateHistoryButtons();
            console.log('状态已保存，历史记录数量:', this.history.length);
        } catch (error) {
            console.error('保存状态时出错:', error);
        }
    }
    
    /**
     * 从离屏画布恢复内容到主画布
     */
    restoreFromOffscreen() {
        if (this.offscreenCanvas && this.offscreenCtx && this.ctx) {
            try {
                // 首先清空主画布
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                // 从离屏画布获取图像数据
                const imageData = this.offscreenCtx.getImageData(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
                // 将数据绘制到主画布
                this.ctx.putImageData(imageData, 0, 0);
                console.log('从离屏画布恢复了绘制内容');
                // 更新预览画布
                this.updatePreview();
            } catch (error) {
                console.error('恢复绘制内容时出错:', error);
            }
        }
    }
    
    /**
     * 同步离屏画布与主画布内容
     */
    syncOffscreenCanvas() {
        if (this.offscreenCanvas && this.offscreenCtx && this.ctx) {
            try {
                // 确保离屏画布尺寸与主画布一致
                if (this.offscreenCanvas.width !== this.canvas.width || this.offscreenCanvas.height !== this.canvas.height) {
                    this.offscreenCanvas.width = this.canvas.width;
                    this.offscreenCanvas.height = this.canvas.height;
                    console.log('离屏画布尺寸已同步:', this.offscreenCanvas.width, '×', this.offscreenCanvas.height);
                }
                
                // 将主画布内容复制到离屏画布
                const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                this.offscreenCtx.putImageData(imageData, 0, 0);
            } catch (error) {
                console.error('同步离屏画布时出错:', error);
            }
        }
    }

    /**
     * 撤销操作
     */
    undo() {
        console.log('撤销按钮点击，当前索引:', this.historyIndex, '历史记录长度:', this.history.length);
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState();
            console.log('撤销操作成功，当前历史索引:', this.historyIndex);
        } else {
            console.log('没有更多可撤销的操作');
        }
    }

    /**
     * 重做操作
     */
    redo() {
        console.log('重做按钮点击，当前索引:', this.historyIndex, '历史记录长度:', this.history.length);
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState();
            console.log('重做操作成功，当前历史索引:', this.historyIndex);
        } else {
            console.log('没有更多可重做的操作');
        }
    }

    /**
     * 恢复指定的历史状态
     */
    restoreState() {
        if (this.ctx && this.historyIndex >= 0 && this.historyIndex < this.history.length) {
            this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
            this.updatePreview();
            this.updateHistoryButtons();
        }
    }
    
    /**
     * 获取当前设计状态，供NavigationManager使用
     */
    getState() {
        return {
            templateSelected: this.templateSelected,
            selectedShape: this.selectedShape,
            currentTool: this.currentTool,
            currentColor: this.currentColor,
            brushSize: this.brushSize
        };
    }

    /**
     * 更新历史记录按钮状态
     */
    updateHistoryButtons() {
        // 获取底部状态栏的按钮
        const undoBtn = document.getElementById('undo-action-btn');
        const redoBtn = document.getElementById('redo-action-btn');
        
        if (undoBtn) {
            undoBtn.disabled = this.historyIndex <= 0 || this.history.length <= 1;
        }
        if (redoBtn) {
            redoBtn.disabled = this.historyIndex >= this.history.length - 1;
        }
    }

    /**
     * 清空画布
     * @param {boolean} showConfirm - 是否显示确认对话框
     */
    clearCanvas(showConfirm = false) {
        console.log('清空按钮点击，不显示确认框');
        if (this.ctx) {
            // 直接清空主画布，不显示确认提示
            // 注意：此方法只清空主画布，不会清除背景画布上的模板
            // 使用clearRect方法清空画布，保持透明度
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveState();
            this.updatePreview();
            console.log('主画布已清空，背景模板保持不变');
        }
    }
    
    /**
     * 重绘画布背景和模板（不清空用户绘制的内容）
     */
    renderBackgroundOnly() {
        if (this.ctx) {
            // 如果有背景画布，将其内容绘制到主画布
            if (this.backgroundCanvas && this.backgroundCtx) {
                this.ctx.drawImage(this.backgroundCanvas, 0, 0, this.canvas.width, this.canvas.height);
            } else {
                // 否则绘制白色背景
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }
    
    /**
     * 重绘画布背景和模板
     */
    renderBackground() {
        if (this.ctx) {
            // 如果有背景画布，将其内容绘制到主画布
            if (this.backgroundCanvas && this.backgroundCtx) {
                this.ctx.drawImage(this.backgroundCanvas, 0, 0, this.canvas.width, this.canvas.height);
            } else {
                // 否则绘制白色背景
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }

    /**
     * 保存画布内容到本地存储
     */
    async saveCanvas() {
        try {
            // 获取画布数据
            const canvasData = this.canvas.toDataURL('image/png');
            
            // 获取设计名称
            const designNameElement = document.getElementById('design-name');
            const designName = designNameElement ? designNameElement.value.trim() : `设计_${new Date().toLocaleString()}`;
            
            // 从localStorage获取用户信息
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            // 保存图片数据（如果有）
            let imageData = null;
            if (this.uploadedImage) {
                imageData = this.uploadedImage.src;
            }
            
            // 创建设计数据 - 包含完整的设计状态
            const designData = {
                id: 'design_' + Date.now(),
                userId: currentUser?.id || 'anonymous',
                userName: currentUser?.displayName || currentUser?.email || '匿名用户',
                name: designName,
                description: '',
                canvasData: canvasData,
                dessertType: this.dessertType,
                elements: JSON.stringify(this.designElements || []),
                imageData: imageData, // 保存上传的图片
                imagePosition: this.imagePosition || { x: 0, y: 0 },
                imageScale: this.imageScale || 1,
                imageConfirmed: this.imageConfirmed || false,
                textElements: this.textElements || [], // 保存文本元素
                points: this.points || [], // 保存绘图点数据
                shape: this.selectedShape || null,
                templateSelected: this.templateSelected,
                createTime: new Date().toISOString(),
                createdAt: new Date().toISOString(), // 兼容gallery.js中使用的字段
                status: 'saved',
                // 兼容旧版本的数据格式
                data: canvasData, // 用于兼容旧版本
                type: this.dessertType // 用于兼容旧版本
            };
            
            // 检查是否是编辑模式
            if (this.isEditMode && this.editIndex !== undefined) {
                console.log('编辑模式，更新原有设计，索引:', this.editIndex);
                
                // 从本地存储加载设计数据
                const designs = window.StorageManager.getDesigns();
                
                if (this.editIndex >= 0 && this.editIndex < designs.length) {
                    // 更新原有设计数据
                    designs[this.editIndex] = designData;
                    
                    // 保存回本地存储
                    window.StorageManager.saveDesigns(designs);
                    
                    // 保存当前设计为最近设计
                    window.StorageManager.saveLastDesign({
                        image: canvasData,
                        type: this.dessertType
                    });
                    
                    // 显示成功消息
                    this.showNotification('设计已更新！', 'success');
                    console.log('设计更新完成');
                } else {
                    console.error('指定的设计索引不存在:', this.editIndex);
                    this.showNotification('设计更新失败，索引不存在', 'error');
                }
            } else {
                // 正常模式，创建新设计
                console.log('正常模式，创建新设计');
                
                // 使用本地存储管理器保存设计
                const savedDesign = window.StorageManager.addDesign(designData);
                
                if (savedDesign) {
                    // 保存当前设计为最近设计
                    window.StorageManager.saveLastDesign({
                        image: canvasData,
                        type: this.dessertType
                    });
                    
                    // 显示成功消息
                    this.showNotification('设计已保存！', 'success');
                    console.log('设计保存成功:', savedDesign);
                } else {
                    this.showNotification('设计保存失败，请重试', 'error');
                }
            }
            
        } catch (error) {
            console.error('保存设计失败:', error);
            this.showNotification('设计保存失败，请重试', 'error');
        }
    }
    
    /**
     * 保存设计到"我的设计"中
     */
    saveToMyDesigns() {
        this.saveCanvas();
    }

    /**
     * 导出画布内容
     * @param {string} format - 导出格式，支持 'png', 'jpeg', 'webp'
     * @param {boolean} withTemplate - 是否包含模板底图
     */
    exportCanvas(format = 'png', withTemplate = false) {
        // 验证格式
        const validFormats = ['png', 'jpeg', 'webp'];
        if (!validFormats.includes(format)) {
            format = 'png';
        }
        
        // 设置MIME类型
        const mimeType = `image/${format}`;
        
        // 获取设计名称
        const designNameElement = document.getElementById('design-name');
        const designName = designNameElement ? designNameElement.textContent.trim() : '设计';
        const safeFileName = designName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
        
        // 创建导出画布
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = this.canvas.width;
        exportCanvas.height = this.canvas.height;
        const exportCtx = exportCanvas.getContext('2d');
        
        // 绘制白色背景
        exportCtx.fillStyle = '#FFFFFF';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        
        // 如果包含模板底图，绘制模板
        if (withTemplate && this.templateSelected) {
            this.drawTemplate(exportCtx);
        }
        
        // 绘制用户设计内容
        exportCtx.drawImage(this.canvas, 0, 0);
        
        // 转换为Blob对象
        exportCanvas.toBlob((blob) => {
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeFileName}-${withTemplate ? '带模板' : ''}-${Date.now()}.${format}`;
            document.body.appendChild(a);
            
            // 触发下载
            a.click();
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);
            
            // 显示导出成功消息
            this.showNotification(`设计已导出为${format.toUpperCase()}格式${withTemplate ? '（含模板）' : ''}！`, 'success');
        }, mimeType);
    }
    
    /**
     * 导出带模板底图的图片
     */
    exportWithTemplate() {
        this.exportCanvas('png', true);
    }

    /**
     * 提交设计到存储
     */
    async submitDesign() {
        try {
            // 转换为Base64编码
            const canvasData = this.canvas.toDataURL('image/png');
            
            // 从localStorage获取用户信息
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            // 获取设计名称
            const designNameElement = document.getElementById('design-name');
            const designName = designNameElement ? designNameElement.textContent.trim() : `设计_${new Date().toLocaleString()}`;
            
            // 保存图片数据（如果有）
            let imageData = null;
            if (this.uploadedImage) {
                imageData = this.uploadedImage.src;
            }
            
            // 创建设计数据 - 包含完整的设计状态
            const designData = {
                id: 'design_' + Date.now(),
                userId: currentUser?.id || 'anonymous',
                userName: currentUser?.displayName || currentUser?.email || '匿名用户',
                name: designName,
                description: '',
                canvasData: canvasData,
                dessertType: this.dessertType,
                elements: JSON.stringify(this.designElements || []),
                imageData: imageData, // 保存上传的图片
                imagePosition: this.imagePosition || { x: 0, y: 0 },
                imageScale: this.imageScale || 1,
                imageConfirmed: this.imageConfirmed || false,
                textElements: this.textElements || [], // 保存文本元素
                points: this.points || [], // 保存绘图点数据
                shape: this.selectedShape || null,
                templateSelected: this.templateSelected,
                createTime: new Date().toISOString(),
                createdAt: new Date().toISOString(), // 兼容gallery.js中使用的字段
                status: 'saved',
                // 兼容旧版本的数据格式
                data: canvasData, // 用于兼容旧版本
                type: this.dessertType // 用于兼容旧版本
            };
            
            // 优先使用StorageUtils保存设计
            if (window.StorageUtils) {
                await StorageUtils.addDesign(designData);
                StorageUtils.saveLastDesignImage(canvasData);
                StorageUtils.saveLastDesignType(this.dessertType);
            } else {
                // 降级保存到本地存储 - 确保使用'sweetsDesigns'键
                let designs = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
                designs.push(designData);
                localStorage.setItem('sweetsDesigns', JSON.stringify(designs));
                
                // 同时保存到'designs'键，确保兼容性
                let altDesigns = JSON.parse(localStorage.getItem('designs')) || [];
                // 转换为altDesigns期望的格式
                const altDesign = {
                    ...designData,
                    user_id: designData.userId,
                    canvas_data: designData.canvasData,
                    dessert_type: designData.dessertType,
                    image_position: JSON.stringify(designData.imagePosition),
                    created_at: designData.createTime
                };
                altDesigns.push(altDesign);
                localStorage.setItem('designs', JSON.stringify(altDesigns));
                
                // 保存当前设计为最近设计
                localStorage.setItem('lastDesignImage', canvasData);
                localStorage.setItem('lastDesignType', this.dessertType);
            }
            
            // 显示成功消息
            this.showNotification('设计保存成功！', 'success');
            
            // 延迟后跳转到定制页面
            setTimeout(() => {
                if (window.navigationManager) {
                    window.navigationManager.navigateTo('customize.html');
                } else {
                    window.location.href = 'customize.html';
                }
            }, 1500);
        } catch (error) {
            console.error('保存设计错误:', error);
            this.showNotification('设计保存失败，请重试', 'error');
        }
    }

    /**
     * 更新设计信息
     */
    updateDesignInfo() {
        // 更新状态栏信息
        const statusInfo = document.getElementById('design-info');
        if (statusInfo) {
            statusInfo.textContent = `工具: ${this.getToolName()}, 颜色: ${this.currentColor}, 大小: ${this.brushSize}px`;
        }
    }

    /**
     * 获取工具的中文名称
     */
    getToolName() {
        const toolNames = {
            'brush': '画笔',
            'eraser': '橡皮擦',
            'shape': '形状'
        };
        return toolNames[this.currentTool] || this.currentTool;
    }

    /**
     * 显示通知消息
     * @param {string} message 通知消息内容
     * @param {string} type 通知类型：success, error, info, warning
     * @param {number} duration 显示持续时间（毫秒）
     */
    showNotification(message, type = 'info', duration = 3000) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 设置样式
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '8px';
        notification.style.color = 'white';
        notification.style.fontSize = '14px';
        notification.style.fontWeight = '500';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.zIndex = '10000';
        notification.style.transition = 'all 0.3s ease';
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        // 根据类型设置背景色
        const typeColors = {
            success: '#4CAF50',
            error: '#F44336',
            info: '#2196F3',
            warning: '#FF9800'
        };
        notification.style.backgroundColor = typeColors[type] || typeColors.info;
        
        // 添加到文档
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // 自动消失
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    /**
     * 显示Toast消息（兼容方法）
     * @param {string} message 消息内容
     */
    showToast(message) {
        this.showNotification(message, 'info', 3000);
    }
    
    /**
     * 设计完成 - 保存设计并返回步骤二
     */
    async designComplete() {
        try {
            // 先保存设计到用户设计库（我的设计页面）
            await this.saveCanvas();
            
            // 获取画布数据
            const canvasData = this.canvas.toDataURL('image/png');
            
            // 获取设计名称
            const designNameElement = document.getElementById('design-name');
            const designName = designNameElement ? designNameElement.value.trim() : `设计_${new Date().toLocaleString()}`;
            
            // 从localStorage获取用户信息
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            // 创建订单数据
            const orderData = {
                id: 'order_' + Date.now(),
                userId: currentUser?.id || 'anonymous',
                userName: currentUser?.displayName || currentUser?.email || '匿名用户',
                productType: this.dessertType,
                designImage: canvasData,
                designName: designName,
                selectedStyle: this.currentTemplateId || 'circle',
                size: 'M',
                createTime: new Date().toISOString(),
                status: 'pending'
            };
            
            // 保存订单到订单页面
            if (window.StorageUtils) {
                // 使用StorageUtils保存订单
                const savedOrder = await StorageUtils.addOrder(orderData);
                if (!savedOrder) {
                    // 降级保存到localStorage
                    let orders = JSON.parse(localStorage.getItem('orders')) || [];
                    orders.push(orderData);
                    localStorage.setItem('orders', JSON.stringify(orders));
                }
            } else {
                // 降级保存到localStorage
                let orders = JSON.parse(localStorage.getItem('orders')) || [];
                orders.push(orderData);
                localStorage.setItem('orders', JSON.stringify(orders));
            }
            
            // 保存设计结果到localStorage，供步骤二页面使用
            const designResult = {
                imageData: canvasData,
                designName: designName,
                dessertType: this.dessertType,
                createTime: new Date().toISOString(),
                shape: this.currentTemplateId || 'circle',
                size: 'M',
                status: 'completed'
            };
            
            // 优先使用StorageUtils保存设计结果
            if (window.StorageUtils) {
                StorageUtils.saveDesignResult(designResult);
            } else {
                // 降级保存设计结果
                localStorage.setItem('sweetsDesignResult', JSON.stringify(designResult));
            }
            
            // 显示成功消息
            this.showNotification('设计已完成！已保存到我的设计和订单页面，正在返回定制页面...', 'success');
            
            // 2秒后返回步骤二页面
            setTimeout(() => {
                if (window.navigationManager) {
                    window.navigationManager.navigateTo('customize.html?step=2');
                } else {
                    window.location.href = 'customize.html?step=2';
                }
            }, 2000);
            
        } catch (error) {
            console.error('设计完成失败:', error);
            this.showNotification('设计完成失败，请重试', 'error');
        }
    }
    
    /**
     * 降级创建订单
     */
    fallbackCreateOrder(orderData) {
        try {
            const fallbackOrder = {
                id: 'order_' + Date.now(),
                productType: orderData.product_type,
                designImage: orderData.design_image,
                createTime: new Date().toISOString(),
                status: 'pending'
            };
            
            let orders = JSON.parse(localStorage.getItem('orders')) || [];
            orders.push(fallbackOrder);
            localStorage.setItem('orders', JSON.stringify(orders));
            
            this.showNotification('订单已保存到本地，正在跳转到定制页面...', 'success', 2000);
            
            setTimeout(() => {
                window.location.href = 'customize.html';
            }, 2000);
        } catch (error) {
            console.error('降级创建订单失败:', error);
            this.showNotification('订单创建失败，请先保存设计', 'error');
        }
    }

    /**
     * 更新预览画布
     */
    updatePreview() {
        // 检查预览画布是否存在
        if (!this.previewCanvas || !this.previewCtx) {
            console.warn('预览画布未初始化');
            return;
        }
        
        // 清空预览画布
        this.previewCtx.fillStyle = '#FFFFFF';
        this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        
        // 创建一个临时画布用于组合主画布和背景画布的内容
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 首先绘制背景画布内容（包含模板）
        if (this.backgroundCanvas) {
            tempCtx.drawImage(this.backgroundCanvas, 0, 0);
        }
        
        // 然后绘制主画布内容（用户绘制的内容）
        if (this.canvas) {
            tempCtx.drawImage(this.canvas, 0, 0);
        }
        
        // 计算预览缩放后的尺寸
        const scale = 0.25 * this.previewZoomLevel;
        const previewWidth = this.canvas.width * scale;
        const previewHeight = this.canvas.height * scale;
        
        // 计算居中位置
        const offsetX = (this.previewCanvas.width - previewWidth) / 2;
        const offsetY = (this.previewCanvas.height - previewHeight) / 2;
        
        // 将组合内容绘制到预览画布上
        this.previewCtx.drawImage(tempCanvas, offsetX, offsetY, previewWidth, previewHeight);
    }
    
    /**
     * 更新UI状态
     */
    updateUI() {
        // 更新画布尺寸显示
        const canvasSizeElement = document.getElementById('canvas-size');
        if (canvasSizeElement) {
            canvasSizeElement.textContent = `${this.canvasSize.width} × ${this.canvasSize.height}`;
        }
        
        // 更新元素数量
        const elementsCountElement = document.getElementById('elements-count');
        if (elementsCountElement) {
            const count = this.designElements ? this.designElements.length : 0;
            elementsCountElement.textContent = count;
        }
        
        // 保存初始状态
        this.saveState();
        
        // 初始化历史记录按钮状态
        this.updateHistoryButtons();
        
        // 更新预览
        this.updatePreview();
    }
    
    /**
     * 设置设计名称
     * @param {string} name - 设计名称
     * @param {boolean} allowEmpty - 是否允许空名称
     */
    setDesignName(name, allowEmpty = false) {
        // 只有在不允许空名称且名称为空时才生成默认名称
        if (!allowEmpty && (!name || name.trim() === '')) {
            name = `设计_${new Date().toLocaleString()}`;
        }
        
        const designNameElement = document.getElementById('design-name');
        if (designNameElement) {
            // 检查是否为输入元素
            if (designNameElement.tagName === 'INPUT') {
                designNameElement.value = name;
            } else {
                designNameElement.textContent = name;
            }
        }
        
        return name;
    }
}

// 全局变量
let designer;

/**
 * 初始化设计师
 */
function initializeDesigner() {
    designer = new SweetsDesigner();
    // 将designer赋值给window对象，确保全局可访问
    window.designer = designer;
    console.log('设计师初始化完成，window.designer已设置');
}

/**
 * 初始化所有工具事件监听器
 */
function initializeTools() {
    // 使用window.designer确保全局访问
    const designer = window.designer;
    if (!designer) {
        console.warn('designer对象未找到，延迟重试...');
        setTimeout(initializeTools, 200);
        return;
    }
    
    // 初始化绘图工具按钮事件
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(button => {
        button.addEventListener('click', function() {
            const toolType = this.dataset.tool;
            if (designer && designer.selectTool) {
                designer.selectTool(toolType);
            }
        });
    });
    
    // 初始化形状按钮事件
    const shapeButtons = document.querySelectorAll('.shape-btn');
    shapeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const shapeType = this.dataset.shape;
            if (designer && designer.selectShape) {
                designer.selectShape(shapeType);
            }
        });
    });
    
    // 初始化颜色选择器事件
    const colorSwatches = document.querySelectorAll('.color-swatch');
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', function() {
            const color = this.dataset.color;
            if (designer && designer.selectColor) {
                designer.selectColor(color);
            }
        });
    });
    
    // 初始化画笔大小选择器事件
    const sizeOptions = document.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const size = parseInt(this.dataset.size);
            if (designer && designer.selectBrushSize) {
                designer.selectBrushSize(size);
            }
        });
    });
    
    // 初始化画笔大小滑块事件
    const brushSizeSlider = document.getElementById('brush-size');
    if (brushSizeSlider) {
        brushSizeSlider.addEventListener('input', function() {
            const size = parseInt(this.value);
            if (designer && designer.selectBrushSize) {
                designer.selectBrushSize(size);
            }
        });
        brushSizeSlider.addEventListener('change', function() {
            const size = parseInt(this.value);
            if (designer && designer.selectBrushSize) {
                designer.selectBrushSize(size);
            }
        });
    }
    
    // 初始化甜点类型选择器事件
    const dessertButtons = document.querySelectorAll('.dessert-type-btn');
    dessertButtons.forEach(button => {
        button.addEventListener('click', function() {
            const dessertType = this.dataset.type;
            if (designer && designer.selectDessertType) {
                designer.selectDessertType(dessertType);
            }
        });
    });
    
    // 初始化底部状态栏历史记录按钮事件（所有操作按钮已移至画布外）
    const undoActionBtn = document.getElementById('undo-action-btn');
    const redoActionBtn = document.getElementById('redo-action-btn');
    const clearCanvasActionBtn = document.getElementById('clear-canvas-action-btn');
    
    // 添加直接的视觉反馈函数
    function addButtonFeedback(button) {
        if (button) {
            const originalText = button.innerHTML;
            button.innerHTML = '✓'; // 临时显示对勾
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 300);
        }
    }
    
    // 确保按钮存在并直接调用方法，不依赖于designer变量
    if (undoActionBtn) {
        undoActionBtn.addEventListener('click', function() {
            addButtonFeedback(this);
            if (window.designer) {
                window.designer.undo();
            }
        });
    }
    
    if (redoActionBtn) {
        redoActionBtn.addEventListener('click', function() {
            addButtonFeedback(this);
            if (window.designer) {
                window.designer.redo();
            }
        });
    }
    
    if (clearCanvasActionBtn) {
        clearCanvasActionBtn.addEventListener('click', function() {
            addButtonFeedback(this);
            if (window.designer) {
                window.designer.clearCanvas();
            }
        });
    }
    
    // 初始化重置视图按钮
    document.getElementById('reset-view-btn')?.addEventListener('click', () => {
        if (designer && designer.resetView) designer.resetView();
    });
    
    // 初始化保存设计按钮
    document.getElementById('save-design-btn')?.addEventListener('click', async () => {
        if (!designer || !designer.saveCanvas) return;
        
        console.log('开始保存设计...');
        console.log('检查StorageUtils是否可用:', !!window.StorageUtils);
        
        try {
            await designer.saveCanvas();
            console.log('设计保存完成，等待5秒后跳转...');
            
            // 延迟5秒再跳转，让您有时间查看控制台日志
            setTimeout(() => {
                console.log('5秒后自动跳转...');
                window.location.href = 'customize.html';
            }, 5000);
            
        } catch (error) {
            console.error('保存设计失败:', error);
            if (designer.showNotification) {
                designer.showNotification('保存失败，请查看控制台', 'error');
            }
        }
    });
    
    // 初始化保存设计按钮（移动端）
    document.getElementById('save-design-btn-mobile')?.addEventListener('click', async () => {
        if (!designer || !designer.saveCanvas) return;
        
        console.log('开始保存设计（移动端）...');
        console.log('检查StorageUtils是否可用:', !!window.StorageUtils);
        
        try {
            await designer.saveCanvas();
            console.log('设计保存完成（移动端），等待5秒后跳转...');
            
            // 延迟5秒再跳转，让您有时间查看控制台日志
            setTimeout(() => {
                console.log('5秒后自动跳转...');
                window.location.href = 'customize.html';
            }, 5000);
            
        } catch (error) {
            console.error('保存设计失败（移动端）:', error);
            if (designer.showNotification) {
                designer.showNotification('保存失败，请查看控制台', 'error');
            }
        }
    });
    
    // 初始化导出图片按钮
    document.getElementById('export-image-btn')?.addEventListener('click', () => {
        if (!designer || !designer.exportCanvas) return;
        try {
            // 显示格式选择对话框
            const format = prompt('请选择导出格式：\npng (默认)\njpeg\nwebp', 'png').toLowerCase();
            if (format && ['png', 'jpeg', 'webp'].includes(format)) {
                designer.exportCanvas(format);
            } else {
                designer.exportCanvas('png');
            }
        } catch (error) {
            // 如果用户取消提示，默认导出png格式
            designer.exportCanvas('png');
        }
    });
    
    // 初始化导出带模板按钮
    document.getElementById('export-with-template-btn')?.addEventListener('click', () => {
        if (designer && designer.exportWithTemplate) designer.exportWithTemplate();
    });
    
    // 初始化导出图片按钮（移动端）
    document.getElementById('export-image-btn-mobile')?.addEventListener('click', () => {
        if (!designer || !designer.exportCanvas) return;
        try {
            // 显示格式选择对话框
            const format = prompt('请选择导出格式：\npng (默认)\njpeg\nwebp', 'png').toLowerCase();
            if (format && ['png', 'jpeg', 'webp'].includes(format)) {
                designer.exportCanvas(format);
            } else {
                designer.exportCanvas('png');
            }
        } catch (error) {
            // 如果用户取消提示，默认导出png格式
            designer.exportCanvas('png');
        }
    });
    
    // 初始化导出带模板按钮（移动端）
    document.getElementById('export-with-template-btn-mobile')?.addEventListener('click', () => {
        if (designer && designer.exportWithTemplate) designer.exportWithTemplate();
    });
    
    // 初始化设计完成按钮
    document.getElementById('design-complete-btn')?.addEventListener('click', () => {
        if (!designer || !designer.canvas || !designer.designComplete) return;
        
        // 检查设计是否为空
        const context = designer.canvas.getContext('2d');
        const imageData = context.getImageData(0, 0, designer.canvas.width, designer.canvas.height).data;
        let isEmpty = true;
        
        for (let i = 0; i < imageData.length; i += 4) {
            // 检查是否有非透明像素（α通道大于0）或非白色像素
            if (imageData[i + 3] > 0 || 
                imageData[i] < 255 || 
                imageData[i + 1] < 255 || 
                imageData[i + 2] < 255) {
                isEmpty = false;
                break;
            }
        }
        
        if (isEmpty) {
            alert('请先在画布上创建设计！');
            return;
        }
        
        designer.designComplete();
    });
    
    // 初始化设计完成按钮（移动端）
    document.getElementById('design-complete-btn-mobile')?.addEventListener('click', () => {
        if (!designer || !designer.canvas || !designer.designComplete) return;
        
        // 检查设计是否为空
        const context = designer.canvas.getContext('2d');
        const imageData = context.getImageData(0, 0, designer.canvas.width, designer.canvas.height).data;
        let isEmpty = true;
        
        for (let i = 0; i < imageData.length; i += 4) {
            // 检查是否有非透明像素（α通道大于0）或非白色像素
            if (imageData[i + 3] > 0 || 
                imageData[i] < 255 || 
                imageData[i + 1] < 255 || 
                imageData[i + 2] < 255) {
                isEmpty = false;
                break;
            }
        }
        
        if (isEmpty) {
            alert('请先在画布上创建设计！');
            return;
        }
        
        designer.designComplete();
    });
    
    // 初始化提交订单按钮
    document.getElementById('create-order-btn')?.addEventListener('click', () => {
        if (!designer || !designer.canvas || !designer.designComplete) return;
        
        // 检查设计是否为空
        const context = designer.canvas.getContext('2d');
        const imageData = context.getImageData(0, 0, designer.canvas.width, designer.canvas.height).data;
        let isEmpty = true;
        
        // 检查画布是否有内容
        for (let i = 0; i < imageData.length; i += 4) {
            // 如果像素不是完全透明（alpha > 0），则认为有内容
            if (imageData[i + 3] > 0) {
                isEmpty = false;
                break;
            }
        }
        
        if (isEmpty) {
            alert('请先在画布上创建设计！');
            return;
        }
        
        designer.designComplete();
    });
    
    // 初始化文字添加按钮事件
    const addTextBtn = document.getElementById('add-text-btn');
    if (addTextBtn) {
        addTextBtn.addEventListener('click', () => {
            if (!designer || !designer.addText || !designer.saveState) return;
            
            // 检查是否已选择模板
            if (!designer.templateSelected) {
                alert('请先选择一个模板再添加文字');
                return;
            }
            
            const textInput = document.getElementById('text-input');
            const text = textInput.value.trim();
            
            if (!text) {
                alert('请输入要添加的文字');
                return;
            }
            
            // 在画布中心添加文字
            const centerX = designer.canvas.width / 2;
            const centerY = designer.canvas.height / 2;
            
            designer.addText(text, centerX, centerY);
            textInput.value = ''; // 清空输入框
            
            // 保存当前状态
            designer.saveState();
        });
    }
    
    // 初始化设计名称更改事件
    const designNameElement = document.getElementById('design-name');
    if (designNameElement && designNameElement.tagName === 'INPUT') {
        designNameElement.addEventListener('input', (e) => {
            // 实时更新设计名称，但不保存
            const newName = e.target.value.trim();
            // 不再自动设置默认值，让用户可以输入空值，但保存时会检查
        });
        
        // 为设计名称添加保存按钮事件
        const saveDesignNameBtn = document.getElementById('save-design-name-btn');
        if (saveDesignNameBtn) {
            saveDesignNameBtn.addEventListener('click', () => {
                if (!designer || !designer.setDesignName || !designer.showNotification) return;
                
                const newName = designNameElement.value.trim();
                
                if (newName === '') {
                    alert('设计名称不能为空，请输入名称');
                    designNameElement.focus();
                    return;
                }
                
                designer.setDesignName(newName, false); // 保存时不允许空名称
                designer.showNotification('设计名称已保存');
            });
        }
        
        // 保留失焦时的保存功能，但增加空值检查
        designNameElement.addEventListener('blur', (e) => {
            if (!designer || !designer.setDesignName) return;
            
            const newName = e.target.value.trim();
            if (newName !== '') {
                designer.setDesignName(newName, false); // 失焦时保存也不允许空名称
            }
            // 当失焦时如果输入框为空，不做任何处理，保持为空状态
        });
    }
    
    // 初始化重命名按钮（如果存在）
    const renameDesignBtn = document.getElementById('rename-design');
    if (renameDesignBtn) {
        renameDesignBtn.addEventListener('click', () => {
            const designNameElement = document.getElementById('design-name');
            if (designNameElement) {
                if (designNameElement.tagName === 'INPUT') {
                    designNameElement.focus();
                }
            }
        });
    }
    
    // 图片上传事件已经在setupEventListeners中初始化，这里不需要重复初始化
    
    // 设置默认工具为画笔
    if (designer && designer.selectTool) {
        designer.selectTool('brush');
    }
    
    // 设置默认颜色为第一个颜色
    if (colorSwatches.length > 0 && designer && designer.selectColor) {
        const defaultColor = colorSwatches[0].dataset.color;
        designer.selectColor(defaultColor);
    }
    
    // 设置默认画笔大小
    if (sizeOptions.length > 0 && designer && designer.selectBrushSize) {
        const defaultSize = parseInt(sizeOptions[1].dataset.size);
        designer.selectBrushSize(defaultSize);
    }
    
    // 初始化巧克力设计
    if (designer && designer.initChocolateDesign) {
        designer.initChocolateDesign();
    }
}

// 导出全局方法供HTML使用
window.undo = () => designer?.undo();
window.redo = () => designer?.redo();
window.clearCanvas = () => designer?.clearCanvas();
window.saveDesign = () => designer?.saveCanvas();
window.exportDesign = () => designer?.exportCanvas();
window.exportWithTemplate = () => designer?.exportWithTemplate();
window.generatePreview = () => designer?.updatePreview();
window.designComplete = () => designer?.designComplete();
window.submitDesign = () => designer?.submitDesign();

window.saveToMyDesigns = () => designer?.saveToMyDesigns();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeDesigner();
    // 延迟一下，确保designer对象已经创建
    setTimeout(initializeTools, 100);
    
    // 注意：设计数据的加载现在在designer.init()方法中处理
    // 这里不再重复加载，避免数据被覆盖
    console.log('设计器页面初始化完成，数据加载由designer.init()处理');
});