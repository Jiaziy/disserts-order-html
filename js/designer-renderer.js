/**
 * 甜点设计器 - 渲染引擎模块
 * 负责画布渲染、图层管理、背景处理等渲染相关功能
 */

class DesignerRenderer {
    constructor(designer) {
        this.designer = designer;
        this.backgroundCanvas = null;
        this.backgroundCtx = null;
        
        // 创建背景画布
        this.createBackgroundCanvas();
    }

    /**
     * 创建背景画布
     */
    createBackgroundCanvas() {
        this.backgroundCanvas = document.createElement('canvas');
        this.backgroundCanvas.width = this.designer.canvas.width;
        this.backgroundCanvas.height = this.designer.canvas.height;
        this.backgroundCtx = this.backgroundCanvas.getContext('2d');
    }

    /**
     * 渲染所有元素
     */
    renderAllElements() {
        // 如果正在绘图，不进行全量渲染，避免干扰用户操作
        if (this.designer.isDrawing) {
            return;
        }
        
        // 清空画布
        this.clearCanvas();
        
        // 1. 绘制背景（包含模板）
        // 只在有背景画布时绘制，避免重复渲染模板
        if (this.backgroundCanvas && this.backgroundCtx) {
            this.designer.ctx.drawImage(this.backgroundCanvas, 0, 0);
        }
        
        // 2. 使用元素管理器统一渲染所有元素（图片、文本等）
        if (this.designer.elements) {
            this.designer.elements.renderAllElements();
        }
        
        // 3. 绘制当前的画笔痕迹（在最上层）
        if (this.designer.isDrawing && this.designer.currentStep >= 0) {
            // 如果有当前绘图状态，直接绘制当前画布内容
            const currentState = this.designer.history[this.designer.currentStep];
            if (currentState && currentState.canvasData) {
                const currentCanvas = this.createCanvasFromData(currentState.canvasData);
                if (currentCanvas) {
                    this.designer.ctx.drawImage(currentCanvas, 0, 0);
                }
            }
        }
    }

    /**
     * 仅渲染元素（不清空背景）
     * 优化版本：避免不必要的全画布渲染，提高性能
     */
    renderElementsOnly() {
        // 如果正在绘图，不进行渲染
        if (this.designer.isDrawing) {
            return;
        }
        
        // 直接调用设计器的元素层渲染方法
        if (this.designer.renderElementsLayer) {
            this.designer.renderElementsLayer();
        } else {
            // 备用方案：调用设计器的全量渲染，但通过优化逻辑避免重复背景渲染
            this.designer.renderAllElements();
        }
    }

    /**
     * 清空画布
     */
    clearCanvas(fullClear = true) {
        if (fullClear) {
            // 完全清空画布
            this.designer.ctx.clearRect(0, 0, this.designer.canvas.width, this.designer.canvas.height);
        } else {
            // 保留背景和模板，只清空用户绘制的内容
            this.designer.ctx.clearRect(0, 0, this.designer.canvas.width, this.designer.canvas.height);
            
            // 重新绘制背景
            if (this.backgroundCanvas && this.backgroundCtx) {
                this.designer.ctx.drawImage(this.backgroundCanvas, 0, 0);
            }
        }
    }

    /**
     * 重置画布
     */
    resetCanvas() {
        // 清空画布
        this.designer.ctx.clearRect(0, 0, this.designer.canvas.width, this.designer.canvas.height);
        
        // 清空背景画布
        if (this.backgroundCtx) {
            this.backgroundCtx.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
        }
        
        // 重置模板状态
        this.designer.templates.resetTemplate();
        
        // 清空其他元素
        this.designer.text.clearAllText();
        this.designer.images.clearImage();
        
        // 清空历史记录
        this.designer.history = [];
        this.designer.currentStep = -1;
        
        // 清除画布预览
        this.designer.updatePreview();
        
        // 更新界面
        this.designer.updateUI();
        
        this.designer.showToast('画布已重置');
    }

    /**
     * 调整画布大小
     */
    resizeCanvas() {
        // 保存旧画布内容
        const oldCanvas = document.createElement('canvas');
        oldCanvas.width = this.designer.canvas.width;
        oldCanvas.height = this.designer.canvas.height;
        const oldCtx = oldCanvas.getContext('2d');
        oldCtx.drawImage(this.designer.canvas, 0, 0);
        
        // 更新画布尺寸
        this.designer.canvas.width = this.designer.canvas.offsetWidth;
        this.designer.canvas.height = this.designer.canvas.offsetHeight;
        
        // 清空画布并重新绘制背景
        this.clearCanvas(false);
        
        // 如果有模板，仅重新绘制背景画布内容（不重新调用模板渲染）
        if (this.designer.templates.isTemplateSelected() && this.backgroundCanvas) {
            // 确保背景画布内容正确显示到主画布
            this.designer.ctx.drawImage(this.backgroundCanvas, 0, 0);
        }
        
        // 恢复旧画布内容
        this.designer.ctx.drawImage(oldCanvas, 0, 0);
        
        // 更新背景画布尺寸
        this.updateBackgroundCanvasSize();
        
        // 更新预览画布
        this.designer.updatePreview();
        
        console.log('画布尺寸已调整:', this.designer.canvas.width, 'x', this.designer.canvas.height);
    }

    /**
     * 更新背景画布尺寸
     */
    updateBackgroundCanvasSize() {
        if (this.backgroundCanvas) {
            this.backgroundCanvas.width = this.designer.canvas.width;
            this.backgroundCanvas.height = this.designer.canvas.height;
        }
    }

    /**
     * 获取图片上传前的状态
     */
    getPreImageState() {
        for (let i = this.designer.history.length - 1; i >= 0; i--) {
            if (this.designer.history[i].state === 'pre-image-upload') {
                return this.designer.history[i];
            }
        }
        return null;
    }

    /**
     * 从数据创建画布
     */
    createCanvasFromData(canvasData) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = this.designer.canvas.width;
            canvas.height = this.designer.canvas.height;
            const ctx = canvas.getContext('2d');
            
            // 恢复画布内容
            const img = new Image();
            img.src = canvasData;
            
            ctx.drawImage(img, 0, 0);
            return canvas;
        } catch (error) {
            console.error('恢复画布数据失败:', error);
            return null;
        }
    }

    /**
     * 绘制图片到画布
     */
    drawImageOnCanvas(image, x, y, width, height) {
        this.designer.ctx.drawImage(image, x, y, width, height);
    }

    /**
     * 绘制线条到画布
     */
    drawLineOnCanvas(x1, y1, x2, y2, color = '#3D2314', lineWidth = 2) {
        this.designer.ctx.beginPath();
        this.designer.ctx.moveTo(x1, y1);
        this.designer.ctx.lineTo(x2, y2);
        this.designer.ctx.strokeStyle = color;
        this.designer.ctx.lineWidth = lineWidth;
        this.designer.ctx.stroke();
    }

    /**
     * 绘制矩形到画布
     */
    drawRectangleOnCanvas(x, y, width, height, color = '#3D2314', lineWidth = 2) {
        this.designer.ctx.strokeStyle = color;
        this.designer.ctx.lineWidth = lineWidth;
        this.designer.ctx.strokeRect(x, y, width, height);
    }

    /**
     * 绘制圆形到画布
     */
    drawCircleOnCanvas(x, y, radius, color = '#3D2314', lineWidth = 2) {
        this.designer.ctx.beginPath();
        this.designer.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.designer.ctx.strokeStyle = color;
        this.designer.ctx.lineWidth = lineWidth;
        this.designer.ctx.stroke();
    }

    /**
     * 获取画布数据
     */
    getCanvasData() {
        return this.designer.canvas.toDataURL('image/png');
    }

    /**
     * 获取背景画布数据
     */
    getBackgroundCanvasData() {
        return this.backgroundCanvas ? this.backgroundCanvas.toDataURL('image/png') : null;
    }

    /**
     * 设置背景画布内容
     */
    setBackgroundCanvas(dataUrl) {
        if (!this.backgroundCanvas || !this.backgroundCtx) return;
        
        const img = new Image();
        img.onload = () => {
            this.backgroundCtx.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
            this.backgroundCtx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
    }

    /**
     * 获取渲染器状态
     */
    getRendererState() {
        return {
            backgroundCanvasData: this.getBackgroundCanvasData()
        };
    }

    /**
     * 设置渲染器状态（用于恢复状态）
     */
    setRendererState(state) {
        if (state.backgroundCanvasData) {
            this.setBackgroundCanvas(state.backgroundCanvasData);
        }
    }
}