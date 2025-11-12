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
            saveBtn.addEventListener('click', () => {
                this.saveDesignToLibrary();
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
    saveToMyDesigns(designData) {
        try {
            // 优先使用StorageUtils
            if (window.StorageUtils) {
                return StorageUtils.addDesign(designData);
            } else {
                // 降级方案 - 直接保存到本地存储
                const designs = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
                designs.push(designData);
                localStorage.setItem('sweetsDesigns', JSON.stringify(designs));
                return designData;
            }
        } catch (error) {
            console.error('保存到我的设计失败:', error);
            return null;
        }
    }

    /**
     * 保存设计到设计库，并8秒后返回步骤页面
     */
    saveDesignToLibrary() {
        try {
            // 获取画布数据
            const canvasData = this.renderer.getCanvasData();
            
            // 创建设计数据
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
                status: 'saved',
                type: 'chocolate',
                data: canvasData,
                createdAt: new Date().toISOString()
            };
            
            // 保存设计到"我的设计"页面
            const savedToMyDesigns = this.saveToMyDesigns(designData);
            
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
                this.showToast('设计已保存到我的设计，8秒后返回定制页面');
                
                // 禁用保存按钮，防止重复点击
                const saveBtn = document.getElementById('save-design-btn');
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.textContent = '保存中...';
                }
                
                // 8秒后返回步骤页面
                setTimeout(() => {
                    // 检查是否存在导航管理器
                    if (window.NavigationManager) {
                        window.NavigationManager.navigateTo('customize');
                    } else {
                        // 如果没有导航管理器，返回到定制页面（步骤页面）
                        window.location.href = 'customize.html';
                    }
                }, 8000);
                
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
    saveToMyDesigns(designData) {
        try {
            // 优先使用StorageUtils
            if (window.StorageUtils) {
                return StorageUtils.addDesign(designData);
            } else {
                // 降级方案 - 直接保存到本地存储
                const designs = JSON.parse(localStorage.getItem('sweetsDesigns')) || [];
                designs.push(designData);
                localStorage.setItem('sweetsDesigns', JSON.stringify(designs));
                return designData;
            }
        } catch (error) {
            console.error('保存到我的设计失败:', error);
            return null;
        }
    }

    /**
     * 保存设计到设计库，并8秒后返回步骤页面
     */
    saveDesignToLibrary() {
        try {
            // 获取画布数据
            const canvasData = this.renderer.getCanvasData();
            
            // 创建设计数据
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
                status: 'saved',
                type: 'chocolate',
                data: canvasData,
                createdAt: new Date().toISOString()
            };
            
            // 保存设计到"我的设计"页面
            const savedToMyDesigns = this.saveToMyDesigns(designData);
            
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
                this.showToast('设计已保存到我的设计，8秒后返回定制页面');
                
                // 禁用保存按钮，防止重复点击
                const saveBtn = document.getElementById('save-design-btn');
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.textContent = '保存中...';
                }
                
                // 8秒后返回步骤页面
                setTimeout(() => {
                    // 检查是否存在导航管理器
                    if (window.NavigationManager) {
                        window.NavigationManager.navigateTo('customize');
                    } else {
                        // 如果没有导航管理器，返回到定制页面（步骤页面）
                        window.location.href = 'customize.html';
                    }
                }, 8000);
                
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