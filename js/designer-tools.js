/**
 * 甜点设计器 - 绘图工具模块
 * 负责画笔、橡皮擦、形状工具等绘图功能
 */

class DesignerTools {
    constructor(designer) {
        this.designer = designer;
        this.currentTool = 'brush';
        this.selectedShape = null;
        this.brushSize = 5;
        this.currentColor = '#3D2314';
    }

    /**
     * 选择工具
     */
    selectTool(tool) {
        console.log('选择工具:', tool);
        
        this.currentTool = tool;
        
        // 同步主设计器的工具状态
        this.designer.currentTool = tool;
        
        // 取消正在进行的拖动
        if (this.designer.isDragging) {
            this.designer.isDragging = false;
        }
        
        // 更新按钮状态
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.tool-btn[data-tool="${tool}"]`)?.classList.add('active');
        
        // 更新光标样式
        if (this.designer.canvas) {
            switch (tool) {
                case 'brush':
                    this.designer.canvas.style.cursor = 'crosshair';
                    break;
                case 'eraser':
                    this.designer.canvas.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"%3E%3Ccircle cx=\"12\" cy=\"12\" r=\"8\"/%3E%3C/svg%3E") 12 12, auto';
                    break;
                case 'shape':
                    this.designer.canvas.style.cursor = 'pointer';
                    break;
                case 'image':
                    // 图片工具统一使用移动光标
                    this.designer.canvas.style.cursor = 'move';
                    // 如果有上传的图片，使用正确的渲染顺序重新绘制
                    if (this.designer.uploadedImage) {
                        this.designer.renderElementsOnly();
                    }
                    break;
                default:
                    this.designer.canvas.style.cursor = 'crosshair';
            }
        }
        
        // 显示工具切换提示
        if (this.designer.events && this.designer.events.showToolSwitchedMessage) {
            this.designer.events.showToolSwitchedMessage(tool);
        }
        
        // 显示工具使用提示
        if (this.designer.events && this.designer.events.showToolUsageHint) {
            this.designer.events.showToolUsageHint(tool);
        }
        
        this.designer.updateDesignInfo();
    }

    /**
     * 开始绘图
     */
    startDrawing(e) {
        // 检查是否已选择模板 - 使用与主设计器一致的检查方式
        const isTemplateSelected = this.designer.templates ? this.designer.templates.isTemplateSelected() : this.designer.templateSelected;
        
        if ((this.currentTool === 'brush' || this.currentTool === 'eraser') && !isTemplateSelected) {
            console.log('画笔工具无法开始绘图：未选择模板');
            this.showTemplateRequiredMessage();
            return;
        }
        
        console.log(`开始绘图，工具: ${this.currentTool}, 模板选择状态: ${isTemplateSelected}`);
        
        this.designer.isDrawing = true;
        const pos = this.designer.getMousePos(e);
        this.designer.lastX = pos.x;
        this.designer.lastY = pos.y;
        
        // 确保离屏画布与主画布同步
        this.designer.syncOffscreenCanvas();
        
        // 设置绘图属性，确保合成模式正确
        if (this.currentTool === 'brush') {
            // 画笔模式 - 使用source-over确保新内容叠加在已有内容之上
            this.designer.ctx.strokeStyle = this.currentColor;
            this.designer.ctx.lineWidth = this.brushSize;
            this.designer.ctx.lineCap = 'round';
            this.designer.ctx.lineJoin = 'round';
            this.designer.ctx.globalCompositeOperation = 'source-over';
        } else if (this.currentTool === 'eraser') {
            // 橡皮擦模式 - 使用destination-out擦除内容
            this.designer.ctx.strokeStyle = 'rgba(255,255,255,1)'; // 使用不透明白色
            this.designer.ctx.lineWidth = this.brushSize * 2; // 橡皮擦更大一些
            this.designer.ctx.lineCap = 'round';
            this.designer.ctx.lineJoin = 'round';
            this.designer.ctx.globalCompositeOperation = 'destination-out';
        } else if (this.currentTool === 'shape' && this.selectedShape) {
            // 形状绘制
            this.drawShape(pos.x, pos.y);
            this.designer.isDrawing = false;
            this.designer.saveState();
            this.designer.updatePreview();
        }
        
        // 保存初始状态
        this.designer.saveState();
    }

    /**
     * 绘制过程
     */
    draw(e) {
        if (!this.designer.isDrawing) return;
        
        // 确保工具状态同步
        if (this.designer.currentTool !== this.currentTool) {
            console.warn('工具状态不同步，正在修复:', this.designer.currentTool, '->', this.currentTool);
            this.designer.currentTool = this.currentTool;
        }
        
        // 只有画笔和橡皮擦需要持续绘制
        if (this.currentTool !== 'brush' && this.currentTool !== 'eraser') {
            return;
        }
        
        const pos = this.designer.getMousePos(e);
        const currentX = pos.x;
        const currentY = pos.y;
        
        // 使用requestAnimationFrame确保浏览器正确渲染
        requestAnimationFrame(() => {
            // 首先确保离屏画布与主画布完全同步
            this.designer.syncOffscreenCanvas();
            
            // 在主画布上绘制当前线段
            this.designer.ctx.beginPath();
            this.designer.ctx.moveTo(this.designer.lastX, this.designer.lastY);
            this.designer.ctx.lineTo(currentX, currentY);
            
            // 设置绘制属性 - 确保橡皮擦工具正确使用destination-out模式
            if (this.currentTool === 'brush') {
                // 画笔模式 - 叠加内容
                this.designer.ctx.strokeStyle = this.currentColor;
                this.designer.ctx.globalCompositeOperation = 'source-over';
                this.designer.ctx.lineWidth = this.brushSize;
            } else if (this.currentTool === 'eraser') {
                // 橡皮擦模式 - 擦除内容
                this.designer.ctx.strokeStyle = 'rgba(255,255,255,1)'; // 使用不透明白色
                this.designer.ctx.globalCompositeOperation = 'destination-out';
                this.designer.ctx.lineWidth = this.brushSize * 2; // 橡皮擦更大一些
            }
            
            this.designer.ctx.lineCap = 'round';
            this.designer.ctx.lineJoin = 'round';
            this.designer.ctx.stroke();
            
            // 在离屏画布上绘制相同的内容，作为备份
            if (this.designer.offscreenCanvas && this.designer.offscreenCtx) {
                // 设置离屏画布的绘制属性
                this.designer.offscreenCtx.beginPath();
                this.designer.offscreenCtx.moveTo(this.designer.lastX, this.designer.lastY);
                this.designer.offscreenCtx.lineTo(currentX, currentY);
                
                if (this.currentTool === 'brush') {
                    this.designer.offscreenCtx.strokeStyle = this.currentColor;
                    this.designer.offscreenCtx.globalCompositeOperation = 'source-over';
                } else if (this.currentTool === 'eraser') {
                    // 橡皮擦模式 - 擦除内容
                    this.designer.offscreenCtx.strokeStyle = 'rgba(255,255,255,1)'; // 使用不透明白色
                    this.designer.offscreenCtx.globalCompositeOperation = 'destination-out';
                }
                
                this.designer.offscreenCtx.lineWidth = this.currentTool === 'eraser' ? this.brushSize * 2 : this.brushSize;
                this.designer.offscreenCtx.lineCap = 'round';
                this.designer.offscreenCtx.lineJoin = 'round';
                this.designer.offscreenCtx.stroke();
            }
            
            // 更新最后位置
            this.designer.lastX = currentX;
            this.designer.lastY = currentY;
            
            // 更新预览画布
            this.designer.updatePreview();
        });
    }

    /**
     * 停止绘图
     */
    stopDrawing() {
        if (this.designer.isDrawing) {
            this.designer.isDrawing = false;
            
            // 恢复默认合成模式
            this.designer.ctx.globalCompositeOperation = 'source-over';
            
            // 确保离屏画布与主画布完全同步
            this.designer.syncOffscreenCanvas();
            
            // 保存状态和更新预览
            this.designer.saveState();
            this.designer.updatePreview();
            
            // 强制从离屏画布恢复内容，确保绘制内容不会丢失
            this.designer.restoreFromOffscreen();
            
            // 清空点数组
            this.designer.points = [];
            
            // 只有画笔和橡皮擦工具才记录绘图停止信息
            if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
                console.log(`绘图停止，工具: ${this.currentTool}, 状态已保存`);
            }
        }
    }

    /**
     * 选择颜色
     */
    selectColor(color) {
        this.currentColor = color;
        
        // 更新按钮状态
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.color-btn[data-color="${color}"]`)?.classList.add('active');
        
        // 如果当前工具是画笔，更新光标预览
        if (this.currentTool === 'brush' && this.designer.canvas) {
            this.designer.canvas.style.cursor = 'crosshair';
        }
    }

    /**
     * 设置画笔大小
     */
    setBrushSize(size) {
        this.brushSize = size;
        
        // 更新UI显示
        const brushSizeElement = document.getElementById('brush-size');
        if (brushSizeElement) {
            brushSizeElement.textContent = size;
        }
    }

    /**
     * 绘制形状
     */
    drawShape(x, y) {
        if (!this.selectedShape) return;
        
        this.designer.ctx.save();
        
        // 设置绘图属性
        this.designer.ctx.fillStyle = this.currentColor;
        this.designer.ctx.strokeStyle = this.currentColor;
        this.designer.ctx.lineWidth = 2;
        
        const size = Math.min(this.designer.canvas.width, this.designer.canvas.height) * 0.1;
        
        switch (this.selectedShape) {
            case 'circle':
                this.designer.ctx.beginPath();
                this.designer.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
                this.designer.ctx.fill();
                break;
            case 'square':
                this.designer.ctx.fillRect(x - size / 2, y - size / 2, size, size);
                break;
            case 'heart':
                // 简单的心形
                this.designer.ctx.beginPath();
                this.designer.ctx.moveTo(x, y + size / 4);
                this.designer.ctx.bezierCurveTo(x + size / 2, y - size / 2, x + size, y + size / 4, x, y + size);
                this.designer.ctx.bezierCurveTo(x - size, y + size / 4, x - size / 2, y - size / 2, x, y + size / 4);
                this.designer.ctx.fill();
                break;
        }
        
        this.designer.ctx.restore();
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
            
            this.designer.canvas.parentElement.appendChild(messageElement);
            
            // 3秒后自动消失
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 3000);
        }
    }

    /**
     * 获取当前工具状态
     */
    getToolState() {
        return {
            currentTool: this.currentTool,
            brushSize: this.brushSize,
            currentColor: this.currentColor,
            selectedShape: this.selectedShape
        };
    }

    /**
     * 设置工具状态（用于恢复状态）
     */
    setToolState(state) {
        if (state.currentTool) this.currentTool = state.currentTool;
        if (state.brushSize) this.brushSize = state.brushSize;
        if (state.currentColor) this.currentColor = state.currentColor;
        if (state.selectedShape) this.selectedShape = state.selectedShape;
    }
}