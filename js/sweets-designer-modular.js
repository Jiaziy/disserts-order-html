/**
 * 甜点设计器 - 主控制器模块
 * 负责协调各个模块的工作，提供统一的接口
 */

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
        
        // 立即创建window.designer对象并添加getState方法
        window.designer = window.designer || {};
        window.designer.getState = function() {
            return {};
        };
        
        // 核心状态
        this.isDrawing = false;
        this.currentColor = '#3D2314'; // 默认巧克力棕色
        this.brushSize = 5;
        this.dessertType = 'chocolate'; // 固定为巧克力类型
        this.canvasSize = { width: 1440, height: 900 };
        this.currentTool = 'brush';
        this.templateSelected = false; // 跟踪是否已选择模板
        this.previewZoomLevel = 1; // 预览画布的缩放级别
        
        // 图片相关状态
        this.uploadedImage = null; // 上传的图片对象
        this.imageConfirmed = false; // 图片是否已确认固定
        
        // 历史记录
        this.history = [];
        this.currentStep = -1;
        
        // 模块实例
        this.tools = null;
        this.templates = null;
        this.text = null;
        this.images = null;
        this.renderer = null;
        this.events = null;
        this.storage = null;
        this.elements = null; // 元素管理器
        
        // 延迟初始化模块，直到init()方法被调用
        // this.initModules();
    }

    /**
     * 初始化所有模块
     */
    initModules() {
        // 检查模块是否已加载
        if (typeof DesignerTools === 'undefined' ||
            typeof DesignerTemplates === 'undefined' ||
            typeof DesignerText === 'undefined' ||
            typeof DesignerImages === 'undefined' ||
            typeof DesignerRenderer === 'undefined' ||
            typeof DesignerEvents === 'undefined' ||
            typeof DesignerStorage === 'undefined' ||
            typeof DesignerElementsManager === 'undefined') {
            console.error('模块未正确加载，请检查脚本引用顺序');
            return;
        }
        
        // 检查统一存储管理器是否已加载
        if (typeof UnifiedStorageManager === 'undefined') {
            console.warn('统一存储管理器未加载，将使用备用存储方案');
        }
        
        // 初始化统一存储管理器
        if (typeof UnifiedStorageManager !== 'undefined') {
            window.unifiedStorageManager = new UnifiedStorageManager();
            console.log('统一存储管理器已初始化');
            
            // 检查是否需要执行存储清理
            const lastCleanup = localStorage.getItem('sweets_last_cleanup');
            const now = Date.now();
            const ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // 一周
            
            if (!lastCleanup || (now - parseInt(lastCleanup)) > ONE_WEEK) {
                console.log('执行定期存储清理...');
                setTimeout(async () => {
                    if (window.StorageCleanup) {
                        const cleanup = new StorageCleanup();
                        await cleanup.performCleanup();
                        localStorage.setItem('sweets_last_cleanup', now.toString());
                    }
                }, 2000); // 延迟2秒执行，避免阻塞初始化
            }
        } else {
            console.warn('统一存储管理器未加载，将使用备用存储方案');
        }
        
        // 创建模块实例
        this.tools = new DesignerTools(this);
        this.templates = new DesignerTemplates(this);
        this.text = new DesignerText(this);
        this.images = new DesignerImages(this);
        this.renderer = new DesignerRenderer(this);
        this.storage = new DesignerStorage(this);
        this.events = new DesignerEvents(this);
        this.elements = new DesignerElementsManager(this);
        
        console.log('甜点设计器模块已初始化');
    }

    /**
     * 初始化设计器
     */
    init() {
        // 获取DOM元素
        this.canvas = document.getElementById('design-canvas');
        this.previewCanvas = document.getElementById('preview-canvas');
        
        if (!this.canvas || !this.previewCanvas) {
            console.error('画布元素未找到');
            return;
        }
        
        // 设置画布上下文
        this.ctx = this.canvas.getContext('2d');
        this.previewCtx = this.previewCanvas.getContext('2d');
        
        // 设置画布尺寸（使用预设尺寸）
        this.canvas.width = this.canvasSize.width;
        this.canvas.height = this.canvasSize.height;
        this.previewCanvas.width = this.previewCanvas.offsetWidth;
        this.previewCanvas.height = this.previewCanvas.offsetHeight;
        
        // 创建离屏画布用于存储绘制内容，防止笔画消失
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        
        // 设置离屏画布尺寸与主画布一致
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        console.log('离屏画布创建完成，尺寸:', this.offscreenCanvas.width, '×', this.offscreenCanvas.height);
        
        // 设置初始样式
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 现在初始化模块（确保画布已设置）
        this.initModules();
        
        // 初始化事件监听器（必须在模块初始化后调用）
        this.events.initEventListeners();
        
        // 初始化画布（在模块初始化之后）
        this.clearCanvas();
        this.clearPreview();
        
        // 初始化事件监听器
        this.initEventListeners();
        
        // 初始化UI
        this.updateUI();
        
        console.log('甜点设计器已初始化');
        
        // 诊断信息
        this.diagnoseStorageSetup();
        
        this.showToast('甜点设计器已准备就绪');
    }

    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        // 文件上传事件
        const uploadInput = document.getElementById('image-upload-input');
        if (uploadInput) {
            uploadInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.handleImageUpload(e.target.files[0]);
                }
            });
        }
        
        // 上传区域事件
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            // 阻止默认拖拽行为
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });
            
            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    this.handleImageUpload(e.dataTransfer.files[0]);
                }
            });
        }
        
        // 文本添加事件
        const addTextBtn = document.getElementById('add-text-btn');
        if (addTextBtn) {
            addTextBtn.addEventListener('click', () => {
                this.text.addText();
            });
        }
        
        // 重置画布事件
        const resetViewBtn = document.getElementById('reset-view-btn');
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                // 这里应该是重置视图的逻辑，而不是重置画布
                // this.renderer.resetCanvas();
                console.log('重置视图按钮点击');
            });
        }
        
        // 清空画布事件
        const clearCanvasBtn = document.getElementById('clear-canvas-action-btn');
        if (clearCanvasBtn) {
            clearCanvasBtn.addEventListener('click', () => {
                this.renderer.resetCanvas();
            });
        }
        
        // 保存设计事件
        const saveBtn = document.getElementById('save-design-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                console.log('保存设计按钮被点击');
                
                // 防止重复点击
                if (saveBtn.disabled) {
                    console.log('保存按钮已禁用，跳过点击');
                    return;
                }
                
                // 立即禁用按钮
                saveBtn.disabled = true;
                const originalText = saveBtn.textContent;
                saveBtn.textContent = '保存中...';
                
                try {
                    await this.saveDesignToLibrary();
                } catch (error) {
                    console.error('保存设计失败:', error);
                    // 恢复按钮状态
                    saveBtn.disabled = false;
                    saveBtn.textContent = originalText;
                }
            });
        }
        
        // 撤销重做事件
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.storage.undo();
            });
        }
        
        const redoBtn = document.getElementById('redo-btn');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                this.storage.redo();
            });
        }
        
        // 工具切换事件
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.target.dataset.tool;
                if (tool) {
                    this.setCurrentTool(tool);
                }
            });
        });
        
        // 模板选择事件
        const templateButtons = document.querySelectorAll('.template-btn');
        templateButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateType = e.target.dataset.template;
                if (templateType) {
                    this.templates.selectTemplate(templateType);
                }
            });
        });
        
        // 事件监听器由designer-events.js处理，这里不需要重复绑定
        // 事件处理逻辑通过events对象进行
        
        console.log('事件监听器已初始化');
    }

    /**
     * 设置当前工具
     */
    setCurrentTool(tool) {
        this.currentTool = tool;
        
        // 更新UI
        this.updateUI();
        
        // 设置光标样式
        switch (tool) {
            case 'brush':
                this.canvas.style.cursor = 'crosshair';
                break;
            case 'text':
                this.canvas.style.cursor = 'text';
                break;
            case 'image':
                this.canvas.style.cursor = 'move';
                break;
            case 'shape':
                this.canvas.style.cursor = 'crosshair';
                break;
            default:
                this.canvas.style.cursor = 'default';
        }
        
        console.log('当前工具:', tool);
    }

    /**
     * 处理图片上传
     */
    async handleImageUpload(file) {
        return this.images.handleImageUpload(file);
    }

    /**
     * 渲染所有元素
     */
    renderAllElements() {
        this.renderer.renderAllElements();
    }

    /**
     * 仅渲染元素（不清空背景）
     */
    renderElementsOnly() {
        this.renderer.renderElementsOnly();
    }

    /**
     * 清空画布
     */
    clearCanvas(fullClear = true) {
        this.renderer.clearCanvas(fullClear);
    }

    /**
     * 清空预览画布
     */
    clearPreview() {
        if (this.previewCtx) {
            this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
            this.previewCtx.fillStyle = '#ffffff';
            this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        }
    }

    /**
     * 更新预览画布
     */
    updatePreview() {
        if (!this.previewCanvas || !this.previewCtx) return;
        
        // 清空预览画布
        this.clearPreview();
        
        // 如果选择了模板，绘制模板预览
        if (this.templates.isTemplateSelected()) {
            this.previewCtx.fillStyle = '#f8f9fa';
            this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
            
            // 这里可以添加预览逻辑
            // 目前简化为绘制边框
            this.previewCtx.strokeStyle = '#dee2e6';
            this.previewCtx.lineWidth = 2;
            this.previewCtx.strokeRect(10, 10, this.previewCanvas.width - 20, this.previewCanvas.height - 20);
        }
    }

    /**
     * 更新UI界面
     */
    updateUI() {
        // 更新工具按钮状态
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            if (btn.dataset.tool === this.currentTool) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 更新其他UI状态
        // 这里可以根据需要添加更多的UI更新逻辑
    }

    /**
     * 更新设计信息（用于模板和工具模块）
     */
    updateDesignInfo() {
        // 更新设计信息显示
        const designInfoElement = document.getElementById('design-info');
        if (designInfoElement) {
            let infoText = '';
            
            if (this.templates && this.templates.isTemplateSelected()) {
                const templateName = this.templates.getCurrentTemplate();
                infoText += `模板: ${templateName} | `;
            }
            
            if (this.currentTool) {
                infoText += `工具: ${this.currentTool} | `;
            }
            
            if (this.brushSize) {
                infoText += `画笔大小: ${this.brushSize}px`;
            }
            
            designInfoElement.textContent = infoText || '开始设计...';
        }
        
        // 更新UI状态
        this.updateUI();
    }

    /**
     * 显示提示消息
     */
    showToast(message, duration = 3000) {
        // 创建或获取toast容器
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 300px;
            `;
            document.body.appendChild(toastContainer);
        }
        
        // 创建toast元素
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 4px;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;
        
        // 添加动画样式
        if (!document.querySelector('#toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        toastContainer.appendChild(toast);
        
        // 自动移除toast
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    /**
     * 保存当前状态
     */
    saveState(state = 'user-action') {
        this.storage.saveState(state);
    }

    /**
     * 撤销操作
     */
    undo() {
        this.storage.undo();
    }

    /**
     * 重做操作
     */
    redo() {
        this.storage.redo();
    }

    /**
     * 重置设计器
     */
    reset() {
        this.renderer.resetCanvas();
    }

    /**
     * 获取设计器状态
     */
    getState() {
        return {
            currentTool: this.currentTool,
            templateSelected: this.templates ? this.templates.isTemplateSelected() : false,
            currentTemplateId: this.templates ? this.templates.getCurrentTemplate() : null,
            uploadedImage: this.uploadedImage ? true : false,
            imageConfirmed: this.imageConfirmed,
            textElementsCount: this.text ? this.text.textElements.length : 0
        };
    }

    /**
     * 获取鼠标/触摸位置（带缩放处理）
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
     * 同步离屏画布
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
                console.error('同步离屏画布失败:', error);
            }
        }
    }

    /**
     * 从离屏画布恢复内容
     */
    restoreFromOffscreen() {
        if (this.offscreenCanvas && this.offscreenCtx && this.ctx) {
            try {
                // 将离屏画布内容复制回主画布
                const imageData = this.offscreenCtx.getImageData(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
                this.ctx.putImageData(imageData, 0, 0);
            } catch (error) {
                console.error('从离屏画布恢复失败:', error);
            }
        }
    }

    /**
     * 保存设计到"我的设计"页面
     */
    async saveToMyDesigns(designData) {
        console.log('saveToMyDesigns 开始执行，设计数据:', designData.name);
        
        try {
            // 优先使用统一存储管理器
            if (window.unifiedStorageManager) {
                console.log('使用统一存储管理器保存设计');
                let result = false;
                try {
                    // 直接保存，不使用优化和压缩
                    const designs = await unifiedStorageManager.getDesigns();
                    designs.push(designData);
                    result = await unifiedStorageManager.save(unifiedStorageManager.STORAGE_KEYS.DESIGNS, designs, { 
                        compress: false, 
                        optimize: false 
                    });
                    console.log('统一存储管理器保存结果:', result);
                } catch (error) {
                    console.error('统一存储管理器保存失败:', error);
                    this.showToast('保存设计失败: ' + error.message);
                    return false;
                }
                return result;
            }
            // 备选方案：StorageUtils
            else if (window.StorageUtils) {
                console.log('使用 StorageUtils 保存设计');
                const result = StorageUtils.addDesign(designData);
                console.log('StorageUtils 保存结果:', result);
                return result;
            } else {
                // 最后降级方案 - 直接保存到本地存储
                console.log('使用降级方案保存设计');
                const designs = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
                designs.push(designData);
                localStorage.setItem('sweetsDesigns', JSON.stringify(designs));
                console.log('降级方案保存成功');
                return designData;
            }
        } catch (error) {
            console.error('保存到我的设计失败:', error);
            console.error('错误类型:', error.name);
            console.error('错误信息:', error.message);
            
            // 如果是配额错误，尝试清理旧数据后重试
            if (error.name === 'QuotaExceededError' || error.message.includes('STORAGE_QUOTA_EXCEEDED') || error.message.includes('quota')) {
                console.log('存储空间不足，尝试清理旧数据...');
                try {
                    const result = await this.performCleanupAndRetry(designData);
                    console.log('清理重试成功:', result);
                    return result;
                } catch (cleanupError) {
                    console.error('清理重试失败:', cleanupError);
                    this.showToast('存储空间不足，请清理旧设计后重试');
                    return null;
                }
            }
            
            // 其他类型的错误
            this.showToast('保存设计失败: ' + error.message);
            return null;
        }
    }

    /**
     * 清理旧数据并重试保存
     */
    async performCleanupAndRetry(designData) {
        try {
            // 优先使用存储清理工具
            if (window.StorageCleanup) {
                console.log('使用存储清理工具进行清理...');
                const cleanup = new StorageCleanup();
                await cleanup.performCleanup();
                
                // 清理完成后，再次尝试保存
                if (window.unifiedStorageManager) {
                    return await unifiedStorageManager.saveDesign(designData);
                }
            }
            // 如果有统一存储管理器，使用其自动清理功能
            else if (window.unifiedStorageManager) {
                await unifiedStorageManager.performAutomaticCleanup();
                return await unifiedStorageManager.saveDesign(designData);
            }
            
            // 最后的降级方案 - 手动清理
            console.log('使用手动清理方案...');
            
            // 清理所有可能的设计存储键
            const storageKeys = ['sweetsDesigns', 'sweets_designs', 'designs'];
            
            for (const key of storageKeys) {
                try {
                    const designs = JSON.parse(localStorage.getItem(key)) || [];
                    
                    // 保留最新的30个设计（更激进的清理）
                    if (designs.length > 30) {
                        const sortedDesigns = designs.sort((a, b) => 
                            new Date(b.createTime || 0) - new Date(a.createTime || 0)
                        );
                        const designsToKeep = sortedDesigns.slice(0, 30);
                        
                        localStorage.setItem(key, JSON.stringify(designsToKeep));
                        console.log(`清理了 ${key} 中的 ${designs.length - 30} 个旧设计`);
                    }
                } catch (error) {
                    console.warn(`清理 ${key} 失败:`, error);
                }
            }
            
            // 再次尝试保存到统一存储
            if (window.unifiedStorageManager) {
                return await unifiedStorageManager.saveDesign(designData);
            }
            
            // 最后的降级方案
            const designs = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
            designs.push(designData);
            localStorage.setItem('sweetsDesigns', JSON.stringify(designs));
            
            return designData;
        } catch (error) {
            console.error('清理重试失败:', error);
            this.showToast('存储空间严重不足，请手动清理浏览器数据');
            throw error;
        }
    }

    /**
     * 保存设计到设计库，并2秒后返回步骤页面
     */
    async saveDesignToLibrary() {
        console.log('saveDesignToLibrary方法开始执行');
        try {
            // 检查渲染器是否已初始化
            if (!this.renderer) {
                console.error('渲染器未初始化，无法保存设计');
                this.showToast('设计器未完全加载，请刷新页面后重试');
                return false;
            }
            
            // 检查画布是否存在
            if (!this.canvas) {
                console.error('画布未找到，无法保存设计');
                this.showToast('画布未找到，请刷新页面后重试');
                return false;
            }
            
            // 获取画布数据
            let canvasData;
            try {
                canvasData = this.renderer.getCanvasData();
                console.log('画布数据获取成功，大小:', canvasData ? canvasData.length : 0, '字符');
            } catch (error) {
                console.error('获取画布数据失败:', error);
                this.showToast('无法获取画布数据，请重试');
                return false;
            }
            
            // 检查画布数据是否有效
            if (!canvasData || canvasData.length < 100) {
                console.warn('画布数据可能为空或无效，大小:', canvasData ? canvasData.length : 0);
                this.showToast('画布数据为空，请先进行绘制后再保存');
                return false;
            }
            
            // 创建设计数据（优化数据大小）
            const designData = {
                id: 'design_' + Date.now(),
                userId: 'current',
                userName: '当前用户',
                name: '设计_' + new Date().toLocaleString(),
                description: '自定义设计',
                canvasData: canvasData,
                dessertType: 'chocolate',
                elements: '[]',
                imagePosition: { x: 0, y: 0 },
                imageScale: 1,
                createTime: new Date().toISOString(),
                status: 'saved'
            };
            
            // 保存设计到"我的设计"页面
            let savedToMyDesigns;
            try {
                console.log('开始保存设计到存储...', designData.name);
                savedToMyDesigns = await this.saveToMyDesigns(designData);
                console.log('设计保存结果:', savedToMyDesigns ? '成功' : '失败');
            } catch (error) {
                console.error('保存设计时发生错误:', error);
                this.showToast('保存设计失败: ' + error.message);
                return false;
            }
            
            if (savedToMyDesigns) {
                // 保存设计结果到步骤页面
                const designResult = {
                    imageData: canvasData,
                    designName: designData.name,
                    dessertType: designData.dessertType,
                    shape: '圆形',
                    size: 'M',
                    createTime: new Date().toISOString()
                };
                
                // 保存设计结果，供步骤页面使用
                if (window.StorageUtils) {
                    StorageUtils.saveDesignResult(designResult);
                } else {
                    localStorage.setItem('sweetsDesignResult', JSON.stringify(designResult));
                }
                
                // 保存成功，显示提示信息
                console.log('设计保存成功，即将显示toast消息');
                try {
                    this.showToast('设计已保存到我的设计，2秒后返回定制页面');
                    console.log('toast消息显示成功');
                } catch (error) {
                    console.error('显示toast消息失败:', error);
                }
                
                console.log('保存按钮已在事件处理中禁用');
                
                // 2秒后返回步骤页面
                console.log('设置2秒延迟跳转...');
                
                // 检查并移除可能阻止跳转的事件监听器
                console.log('检查页面卸载事件监听器...');
                if (window.onbeforeunload) {
                    console.log('发现beforeunload监听器，尝试移除');
                    window.onbeforeunload = null;
                }
                
                const timeoutId = setTimeout(() => {
                    console.log('延迟结束，开始执行跳转到customize.html');
                    console.log('当前页面URL:', window.location.href);
                    
                    try {
                        // 清理可能的定时器
                        for (let i = 1; i < 99999; i++) {
                            clearTimeout(i);
                        }
                        
                        // 强制跳转
                        window.location.href = 'customize.html';
                        console.log('window.location.href 已调用');
                    } catch (error) {
                        console.error('直接跳转失败，尝试使用location.assign:', error);
                        window.location.assign('customize.html');
                        console.log('window.location.assign 已调用');
                    }
                }, 2000);
                console.log('setTimeout已设置，ID:', timeoutId);
                
                // 立即测试跳转机制
                console.log('测试：当前URL:', window.location.href);
                console.log('测试：尝试直接跳转');
                
                // 检查是否是本地文件协议
                const isLocalFile = window.location.protocol === 'file:';
                console.log('是否本地文件协议:', isLocalFile);
                
                if (isLocalFile) {
                    console.log('本地文件协议，跳过自动跳转，显示手动跳转提示');
                    // 显示手动跳转提示而不是自动跳转
                    this.showToast('设计已保存！请手动点击"返回定制页面"按钮', 5000);
                    
                    // 创建返回按钮
                    const returnBtn = document.createElement('div');
                    returnBtn.innerHTML = `
                        <div style="
                            position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background: white;
                            padding: 30px;
                            border-radius: 15px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                            text-align: center;
                            z-index: 10000;
                        ">
                            <h3 style="margin: 0 0 20px 0; color: #333;">✅ 设计保存成功！</h3>
                            <p style="margin: 0 0 20px 0; color: #666;">请点击下方按钮返回定制页面</p>
                            <button onclick="window.location.href='customize.html'" style="
                                background: #FF6B95;
                                color: white;
                                border: none;
                                padding: 15px 30px;
                                border-radius: 8px;
                                font-size: 16px;
                                cursor: pointer;
                                font-weight: bold;
                            ">返回定制页面</button>
                        </div>
                    `;
                    returnBtn.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.5);
                        z-index: 9999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    `;
                    
                    // 点击背景关闭
                    returnBtn.addEventListener('click', function(e) {
                        if (e.target === returnBtn) {
                            returnBtn.remove();
                        }
                    });
                    
                    document.body.appendChild(returnBtn);
                    
                } else {
                    // HTTP/HTTPS协议，正常跳转
                    try {
                        // 使用最激进的跳转方式
                        console.log('尝试方式1: window.location.href');
                        window.location.href = 'customize.html';
                        
                        // 延迟100ms尝试其他方式
                        setTimeout(() => {
                            console.log('尝试方式2: window.location.assign');
                            window.location.assign('customize.html');
                        }, 100);
                        
                        // 延迟200ms尝试replace
                        setTimeout(() => {
                            console.log('尝试方式3: window.location.replace');
                            window.location.replace('customize.html');
                        }, 200);
                        
                        // 延迟300ms尝试强制跳转
                        setTimeout(() => {
                            console.log('尝试方式4: window.open');
                            window.open('customize.html', '_self');
                        }, 300);
                        
                        // 延迟400ms尝试表单提交方式
                        setTimeout(() => {
                            console.log('尝试方式5: 表单提交');
                            const form = document.createElement('form');
                            form.method = 'GET';
                            form.action = 'customize.html';
                            document.body.appendChild(form);
                            form.submit();
                        }, 400);
                        
                        console.log('所有跳转方式已调用');
                    } catch (error) {
                        console.error('直接跳转失败:', error);
                    }
                }
                
                // 备用跳转方案：如果3秒后还没跳转，强制跳转
                setTimeout(() => {
                    if (window.location.href.includes('sweets-designer.html')) {
                        console.log('3秒后仍未跳转，执行强制跳转');
                        try {
                            window.location.replace('customize.html');
                            console.log('replace跳转调用成功');
                        } catch (error) {
                            console.error('replace跳转失败:', error);
                        }
                    }
                }, 3000);
                
                return true;
            } else {
                this.showToast('保存设计失败，请重试');
                return false;
            }
            
        } catch (error) {
            console.error('保存设计到设计库失败:', error);
            this.showToast('保存设计失败，请重试');
            return false;
        }
    }

    /**
     * 保存设计到"我的设计"页面
     */
    async saveToMyDesigns(designData) {
        console.log('saveToMyDesigns 开始执行，设计数据:', designData.name);
        
        try {
            // 优先使用统一存储管理器
            if (window.unifiedStorageManager) {
                console.log('使用统一存储管理器保存设计');
                let result = false;
                try {
                    // 直接保存，不使用优化和压缩
                    const designs = await unifiedStorageManager.getDesigns();
                    designs.push(designData);
                    result = await unifiedStorageManager.save(unifiedStorageManager.STORAGE_KEYS.DESIGNS, designs, { 
                        compress: false, 
                        optimize: false 
                    });
                    console.log('统一存储管理器保存结果:', result);
                } catch (error) {
                    console.error('统一存储管理器保存失败:', error);
                    this.showToast('保存设计失败: ' + error.message);
                    return false;
                }
                return result;
            }
            // 备选方案：StorageUtils
            else if (window.StorageUtils) {
                console.log('使用 StorageUtils 保存设计');
                const result = StorageUtils.addDesign(designData);
                console.log('StorageUtils 保存结果:', result);
                return result;
            } else {
                // 最后降级方案 - 直接保存到本地存储
                console.log('使用降级方案保存设计');
                const designs = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
                designs.push(designData);
                localStorage.setItem('sweetsDesigns', JSON.stringify(designs));
                console.log('降级方案保存成功');
                return designData;
            }
        } catch (error) {
            console.error('保存到我的设计失败:', error);
            console.error('错误类型:', error.name);
            console.error('错误信息:', error.message);
            
            // 如果是配额错误，尝试清理旧数据后重试
            if (error.name === 'QuotaExceededError' || error.message.includes('STORAGE_QUOTA_EXCEEDED') || error.message.includes('quota')) {
                console.log('存储空间不足，尝试清理旧数据...');
                try {
                    const result = await this.performCleanupAndRetry(designData);
                    console.log('清理重试成功:', result);
                    return result;
                } catch (cleanupError) {
                    console.error('清理重试失败:', cleanupError);
                    this.showToast('存储空间不足，请清理旧设计后重试');
                    return null;
                }
            }
            
            // 其他类型的错误
            this.showToast('保存设计失败: ' + error.message);
            return null;
        }
    }

    /**
     * 清理旧数据并重试保存
     */
    async performCleanupAndRetry(designData) {
        try {
            // 优先使用存储清理工具
            if (window.StorageCleanup) {
                console.log('使用存储清理工具进行清理...');
                const cleanup = new StorageCleanup();
                await cleanup.performCleanup();
                
                // 清理完成后，再次尝试保存
                if (window.unifiedStorageManager) {
                    return await unifiedStorageManager.saveDesign(designData);
                }
            }
            // 如果有统一存储管理器，使用其自动清理功能
            else if (window.unifiedStorageManager) {
                await unifiedStorageManager.performAutomaticCleanup();
                return await unifiedStorageManager.saveDesign(designData);
            }
            
            // 最后的降级方案 - 手动清理
            console.log('使用手动清理方案...');
            
            // 清理所有可能的设计存储键
            const storageKeys = ['sweetsDesigns', 'sweets_designs', 'designs'];
            
            for (const key of storageKeys) {
                try {
                    const designs = JSON.parse(localStorage.getItem(key)) || [];
                    
                    // 保留最新的30个设计（更激进的清理）
                    if (designs.length > 30) {
                        const sortedDesigns = designs.sort((a, b) => 
                            new Date(b.createTime || 0) - new Date(a.createTime || 0)
                        );
                        const designsToKeep = sortedDesigns.slice(0, 30);
                        
                        localStorage.setItem(key, JSON.stringify(designsToKeep));
                        console.log(`清理了 ${key} 中的 ${designs.length - 30} 个旧设计`);
                    }
                } catch (error) {
                    console.warn(`清理 ${key} 失败:`, error);
                }
            }
            
            // 再次尝试保存到统一存储
            if (window.unifiedStorageManager) {
                return await unifiedStorageManager.saveDesign(designData);
            }
            
            // 最后的降级方案
            const designs = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
            designs.push(designData);
            localStorage.setItem('sweetsDesigns', JSON.stringify(designs));
            
            return designData;
        } catch (error) {
            console.error('清理重试失败:', error);
            this.showToast('存储空间严重不足，请手动清理浏览器数据');
            throw error;
        }
    }

    /**
     * 保存设计到设计库，并2秒后返回步骤页面
     */
    async saveDesignToLibrary() {
        console.log('saveDesignToLibrary方法开始执行');
        try {
            // 检查渲染器是否已初始化
            if (!this.renderer) {
                console.error('渲染器未初始化，无法保存设计');
                this.showToast('设计器未完全加载，请刷新页面后重试');
                return false;
            }
            
            // 检查画布是否存在
            if (!this.canvas) {
                console.error('画布未找到，无法保存设计');
                this.showToast('画布未找到，请刷新页面后重试');
                return false;
            }
            
            // 获取画布数据
            let canvasData;
            try {
                canvasData = this.renderer.getCanvasData();
                console.log('画布数据获取成功，大小:', canvasData ? canvasData.length : 0, '字符');
            } catch (error) {
                console.error('获取画布数据失败:', error);
                this.showToast('无法获取画布数据，请重试');
                return false;
            }
            
            // 检查画布数据是否有效
            if (!canvasData || canvasData.length < 100) {
                console.warn('画布数据可能为空或无效，大小:', canvasData ? canvasData.length : 0);
                this.showToast('画布数据为空，请先进行绘制后再保存');
                return false;
            }
            
            // 创建设计数据（优化数据大小）
            const designData = {
                id: 'design_' + Date.now(),
                userId: 'current',
                userName: '当前用户',
                name: '设计_' + new Date().toLocaleString(),
                description: '自定义设计',
                canvasData: canvasData,
                dessertType: 'chocolate',
                elements: '[]',
                imagePosition: { x: 0, y: 0 },
                imageScale: 1,
                createTime: new Date().toISOString(),
                status: 'saved'
            };
            
            // 保存设计到"我的设计"页面
            let savedToMyDesigns;
            try {
                console.log('开始保存设计到存储...', designData.name);
                savedToMyDesigns = await this.saveToMyDesigns(designData);
                console.log('设计保存结果:', savedToMyDesigns ? '成功' : '失败');
            } catch (error) {
                console.error('保存设计时发生错误:', error);
                this.showToast('保存设计失败: ' + error.message);
                return false;
            }
            
            if (savedToMyDesigns) {
                // 保存设计结果到步骤页面
                const designResult = {
                    imageData: canvasData,
                    designName: designData.name,
                    dessertType: designData.dessertType,
                    shape: '圆形',
                    size: 'M',
                    createTime: new Date().toISOString()
                };
                
                // 保存设计结果，供步骤页面使用
                if (window.StorageUtils) {
                    StorageUtils.saveDesignResult(designResult);
                } else {
                    localStorage.setItem('sweetsDesignResult', JSON.stringify(designResult));
                }
                
                // 保存成功，显示提示信息
                console.log('设计保存成功，即将显示toast消息');
                try {
                    this.showToast('设计已保存到我的设计，2秒后返回定制页面');
                    console.log('toast消息显示成功');
                } catch (error) {
                    console.error('显示toast消息失败:', error);
                }
                
                console.log('保存按钮已在事件处理中禁用');
                
                // 2秒后返回步骤页面
                console.log('设置2秒延迟跳转...');
                
                // 检查并移除可能阻止跳转的事件监听器
                console.log('检查页面卸载事件监听器...');
                if (window.onbeforeunload) {
                    console.log('发现beforeunload监听器，尝试移除');
                    window.onbeforeunload = null;
                }
                
                const timeoutId = setTimeout(() => {
                    console.log('延迟结束，开始执行跳转到customize.html');
                    console.log('当前页面URL:', window.location.href);
                    
                    try {
                        // 清理可能的定时器
                        for (let i = 1; i < 99999; i++) {
                            clearTimeout(i);
                        }
                        
                        // 强制跳转
                        window.location.href = 'customize.html';
                        console.log('window.location.href 已调用');
                    } catch (error) {
                        console.error('直接跳转失败，尝试使用location.assign:', error);
                        window.location.assign('customize.html');
                        console.log('window.location.assign 已调用');
                    }
                }, 2000);
                console.log('setTimeout已设置，ID:', timeoutId);
                
                // 立即测试跳转机制
                console.log('测试：当前URL:', window.location.href);
                console.log('测试：尝试直接跳转');
                
                // 检查是否是本地文件协议
                const isLocalFile = window.location.protocol === 'file:';
                console.log('是否本地文件协议:', isLocalFile);
                
                if (isLocalFile) {
                    console.log('本地文件协议，跳过自动跳转，显示手动跳转提示');
                    // 显示手动跳转提示而不是自动跳转
                    this.showToast('设计已保存！请手动点击"返回定制页面"按钮', 5000);
                    
                    // 创建返回按钮
                    const returnBtn = document.createElement('div');
                    returnBtn.innerHTML = `
                        <div style="
                            position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background: white;
                            padding: 30px;
                            border-radius: 15px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                            text-align: center;
                            z-index: 10000;
                        ">
                            <h3 style="margin: 0 0 20px 0; color: #333;">✅ 设计保存成功！</h3>
                            <p style="margin: 0 0 20px 0; color: #666;">请点击下方按钮返回定制页面</p>
                            <button onclick="window.location.href='customize.html'" style="
                                background: #FF6B95;
                                color: white;
                                border: none;
                                padding: 15px 30px;
                                border-radius: 8px;
                                font-size: 16px;
                                cursor: pointer;
                                font-weight: bold;
                            ">返回定制页面</button>
                        </div>
                    `;
                    returnBtn.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.5);
                        z-index: 9999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    `;
                    
                    // 点击背景关闭
                    returnBtn.addEventListener('click', function(e) {
                        if (e.target === returnBtn) {
                            returnBtn.remove();
                        }
                    });
                    
                    document.body.appendChild(returnBtn);
                    
                } else {
                    // HTTP/HTTPS协议，正常跳转
                    try {
                        // 使用最激进的跳转方式
                        console.log('尝试方式1: window.location.href');
                        window.location.href = 'customize.html';
                        
                        // 延迟100ms尝试其他方式
                        setTimeout(() => {
                            console.log('尝试方式2: window.location.assign');
                            window.location.assign('customize.html');
                        }, 100);
                        
                        // 延迟200ms尝试replace
                        setTimeout(() => {
                            console.log('尝试方式3: window.location.replace');
                            window.location.replace('customize.html');
                        }, 200);
                        
                        // 延迟300ms尝试强制跳转
                        setTimeout(() => {
                            console.log('尝试方式4: window.open');
                            window.open('customize.html', '_self');
                        }, 300);
                        
                        // 延迟400ms尝试表单提交方式
                        setTimeout(() => {
                            console.log('尝试方式5: 表单提交');
                            const form = document.createElement('form');
                            form.method = 'GET';
                            form.action = 'customize.html';
                            document.body.appendChild(form);
                            form.submit();
                        }, 400);
                        
                        console.log('所有跳转方式已调用');
                    } catch (error) {
                        console.error('直接跳转失败:', error);
                    }
                }
                
                // 备用跳转方案：如果3秒后还没跳转，强制跳转
                setTimeout(() => {
                    if (window.location.href.includes('sweets-designer.html')) {
                        console.log('3秒后仍未跳转，执行强制跳转');
                        try {
                            window.location.replace('customize.html');
                            console.log('replace跳转调用成功');
                        } catch (error) {
                            console.error('replace跳转失败:', error);
                        }
                    }
                }, 3000);
                
                return true;
            } else {
                this.showToast('保存设计失败，请重试');
                return false;
            }
            
        } catch (error) {
            console.error('保存设计到设计库失败:', error);
            this.showToast('保存设计失败，请重试');
            return false;
        }
    }

    /**
     * 诊断存储设置
     */
    diagnoseStorageSetup() {
        console.log('=== 存储设置诊断 ===');
        console.log('UnifiedStorageManager 类:', typeof UnifiedStorageManager);
        console.log('unifiedStorageManager 实例:', window.unifiedStorageManager ? '已初始化' : '未初始化');
        console.log('StorageUtils 类:', typeof StorageUtils);
        console.log('localStorage 可用性:', typeof localStorage !== 'undefined' ? '可用' : '不可用');
        
        // 检查现有存储键
        const storageKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.includes('sweets') || key.includes('design')) {
                storageKeys.push(key);
            }
        }
        console.log('相关存储键:', storageKeys);
        
        // 估算存储使用量
        let totalSize = 0;
        storageKeys.forEach(key => {
            const value = localStorage.getItem(key);
            totalSize += (key.length + value.length) * 2;
        });
        console.log('相关数据大小:', (totalSize / 1024).toFixed(2), 'KB');
        
        // 测试统一存储管理器功能
        if (window.unifiedStorageManager) {
            console.log('统一存储管理器配置:', unifiedStorageManager.config);
        }
        
        console.log('=== 诊断完成 ===');
    }

    /**
     * 清理资源
     */
    destroy() {
        if (this.events) {
            this.events.cleanup();
        }
        
        // 清理其他资源
        console.log('甜点设计器已销毁');
    }
}

// 全局访问
window.SweetsDesigner = SweetsDesigner;