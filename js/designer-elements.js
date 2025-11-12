/**
 * 甜点设计器 - 元素基类模块
 * 提供图片和文本元素共用的缩放、拖动、选择等基础功能
 */

class DesignerElement {
    constructor(designer, config) {
        this.designer = designer;
        this.id = config.id || this.generateId();
        this.type = config.type; // 'image' 或 'text'
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.scale = config.scale || 1.0;
        this.rotation = config.rotation || 0;
        this.isSelected = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.zIndex = config.zIndex || 0;
        this.createdAt = config.createdAt || new Date().toISOString();
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return this.type + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 检查鼠标是否在元素范围内
     */
    isPointInElement(x, y) {
        // 子类必须实现此方法
        throw new Error('子类必须实现 isPointInElement 方法');
    }

    /**
     * 绘制元素
     */
    draw() {
        // 子类必须实现此方法
        throw new Error('子类必须实现 draw 方法');
    }

    /**
     * 绘制选中边框
     */
    drawSelectionBox() {
        this.designer.ctx.save();
        
        // 获取元素边界
        const bounds = this.getBounds();
        if (!bounds) return;
        
        // 绘制边框
        this.designer.ctx.strokeStyle = '#3498db';
        this.designer.ctx.lineWidth = 2;
        this.designer.ctx.setLineDash([5, 5]);
        this.designer.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        
        // 绘制缩放控制点
        this.drawControlPoints(bounds);
        
        this.designer.ctx.restore();
    }

    /**
     * 获取元素边界
     */
    getBounds() {
        // 子类必须实现此方法
        throw new Error('子类必须实现 getBounds 方法');
    }

    /**
     * 绘制缩放控制点
     */
    drawControlPoints(bounds) {
        const controlSize = 8;
        const padding = 5;
        
        const points = [
            {x: bounds.x, y: bounds.y}, // 左上
            {x: bounds.x + bounds.width / 2, y: bounds.y}, // 上中
            {x: bounds.x + bounds.width, y: bounds.y}, // 右上
            {x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2}, // 右中
            {x: bounds.x + bounds.width, y: bounds.y + bounds.height}, // 右下
            {x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height}, // 下中
            {x: bounds.x, y: bounds.y + bounds.height}, // 左下
            {x: bounds.x, y: bounds.y + bounds.height / 2} // 左中
        ];
        
        points.forEach(point => {
            this.designer.ctx.fillStyle = '#3498db';
            this.designer.ctx.fillRect(point.x - controlSize/2, point.y - controlSize/2, controlSize, controlSize);
        });
    }

    /**
     * 开始拖动元素
     */
    startDrag(pos) {
        console.log(`开始拖动元素 ${this.type}:`);
        console.log(`元素位置: x=${this.x}, y=${this.y}`);
        console.log(`鼠标位置: x=${pos.x}, y=${pos.y}`);
        
        this.isDragging = true;
        this.dragOffset.x = pos.x - this.x;
        this.dragOffset.y = pos.y - this.y;
        
        console.log(`拖动偏移量: x=${this.dragOffset.x}, y=${this.dragOffset.y}`);
        
        this.designer.canvas.style.cursor = 'move';
        
        // 通知设计器元素开始拖动
        if (this.designer.elements) {
            this.designer.elements.onElementDragStart(this);
        }
        
        console.log('拖动开始成功');
    }

    /**
     * 拖动元素
     */
    drag(pos) {
        if (!this.isDragging) {
            console.log(`拖动失败: 元素 ${this.type} 的 isDragging = false`);
            return;
        }
        
        console.log(`拖动元素 ${this.type}: 鼠标位置 x=${pos.x}, y=${pos.y}`);
        
        // 如果正在绘图，不允许拖动元素
        if (this.designer.isDrawing) {
            console.log('拖动失败: 正在绘图中，不允许拖动元素');
            return;
        }
        
        // 更新元素位置
        const oldX = this.x;
        const oldY = this.y;
        this.x = pos.x - this.dragOffset.x;
        this.y = pos.y - this.dragOffset.y;
        
        console.log(`位置更新: 从 (${oldX.toFixed(1)}, ${oldY.toFixed(1)}) 到 (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
        
        // 限制元素在画布范围内
        this.constrainToCanvas();
        
        // 通知设计器元素正在拖动
        if (this.designer.elements) {
            this.designer.elements.onElementDrag(this);
        }
        
        console.log('拖动更新成功');
    }

    /**
     * 停止拖动元素
     */
    stopDrag() {
        this.isDragging = false;
        this.designer.canvas.style.cursor = 'default';
        
        // 保存状态
        this.designer.saveState();
        
        // 通知设计器元素停止拖动
        if (this.designer.elements) {
            this.designer.elements.onElementDragEnd(this);
        }
        
        console.log(`${this.type} 拖动完成，位置已保存`);
    }

    /**
     * 缩放元素
     */
    scaleAtPoint(scaleFactor, centerX, centerY) {
        const oldScale = this.scale;
        const newScale = Math.max(0.1, Math.min(5.0, this.scale * scaleFactor));
        
        if (newScale !== oldScale) {
            // 计算基于中心点的缩放变换
            const scaleRatio = newScale / oldScale;
            
            // 更新元素位置，使缩放以指定点为中心
            this.x = centerX - (centerX - this.x) * scaleRatio;
            this.y = centerY - (centerY - this.y) * scaleRatio;
            
            this.scale = newScale;
            
            // 通知设计器元素已缩放
            if (this.designer.elements) {
                this.designer.elements.onElementScale(this);
            }
        }
    }

    /**
     * 旋转元素
     */
    rotate(angle) {
        this.rotation = (this.rotation + angle) % 360;
        
        // 通知设计器元素已旋转
        if (this.designer.elements) {
            this.designer.elements.onElementRotate(this);
        }
    }

    /**
     * 限制元素在画布范围内
     */
    constrainToCanvas() {
        const bounds = this.getBounds();
        if (!bounds) return;
        
        // 确保元素不会完全移出画布
        const margin = 20;
        
        if (bounds.x + bounds.width < margin) {
            this.x += margin - (bounds.x + bounds.width);
        }
        if (bounds.x > this.designer.canvas.width - margin) {
            this.x -= bounds.x - (this.designer.canvas.width - margin);
        }
        if (bounds.y + bounds.height < margin) {
            this.y += margin - (bounds.y + bounds.height);
        }
        if (bounds.y > this.designer.canvas.height - margin) {
            this.y -= bounds.y - (this.designer.canvas.height - margin);
        }
    }

    /**
     * 获取元素状态（用于保存和恢复）
     */
    getState() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            scale: this.scale,
            rotation: this.rotation,
            zIndex: this.zIndex,
            createdAt: this.createdAt,
            isSelected: this.isSelected
        };
    }

    /**
     * 从状态恢复元素
     */
    setState(state) {
        this.x = state.x || this.x;
        this.y = state.y || this.y;
        this.scale = state.scale || this.scale;
        this.rotation = state.rotation || this.rotation;
        this.zIndex = state.zIndex || this.zIndex;
        this.isSelected = state.isSelected || false;
    }

    /**
     * 删除元素
     */
    remove() {
        // 通知设计器元素被删除
        if (this.designer.elements) {
            this.designer.elements.onElementRemove(this);
        }
    }
}

/**
 * 图片元素类
 */
class ImageElement extends DesignerElement {
    constructor(designer, config) {
        super(designer, { ...config, type: 'image' });
        
        this.img = config.img;
        this.width = config.width || 0;
        this.height = config.height || 0;
        this.originalWidth = config.width || 0;
        this.originalHeight = config.height || 0;
        this.isProcessed = config.isProcessed || false;
        this.originalDataUrl = config.originalDataUrl || null;
        
        // 确认/取消状态
        this.confirmed = false;
        this.confirmationButtons = {
            confirm: { x: 0, y: 0, width: 80, height: 30, text: '确定' },
            cancel: { x: 0, y: 0, width: 80, height: 30, text: '取消' }
        };
    }

    /**
     * 检查鼠标是否在元素范围内
     */
    isPointInElement(x, y) {
        // 检查图片主体
        const scaledWidth = this.width * this.scale;
        const scaledHeight = this.height * this.scale;
        
        const isInBounds = x >= this.x && 
               x <= this.x + scaledWidth && 
               y >= this.y && 
               y <= this.y + scaledHeight;
        
        // 调试信息
        if (this.isSelected && !this.isDragging) {
            console.log(`图片边界检查: x=${this.x.toFixed(1)}, y=${this.y.toFixed(1)}, 宽度=${scaledWidth.toFixed(1)}, 高度=${scaledHeight.toFixed(1)}`);
            console.log(`鼠标位置: x=${x.toFixed(1)}, y=${y.toFixed(1)}`);
            console.log(`是否在范围内: ${isInBounds}`);
        }
        
        return isInBounds;
    }

    /**
     * 检查鼠标是否在按钮区域内（单独调用，不干扰元素选择）
     */
    isPointInButtonArea(x, y) {
        if (!this.isSelected) return false;
        
        if (this.isPointInButton(x, y, 'confirm')) {
            console.log('鼠标在确认按钮上');
            return true;
        }
        if (this.isPointInButton(x, y, 'cancel')) {
            console.log('鼠标在取消按钮上');
            return true;
        }
        
        return false;
    }

    /**
     * 检查鼠标是否在按钮范围内
     */
    isPointInButton(x, y, buttonType) {
        const button = this.confirmationButtons[buttonType];
        if (!button) return false;
        
        return x >= button.x && 
               x <= button.x + button.width && 
               y >= button.y && 
               y <= button.y + button.height;
    }

    /**
     * 获取图片边界
     */
    getBounds() {
        const scaledWidth = this.width * this.scale;
        const scaledHeight = this.height * this.scale;
        
        return {
            x: this.x,
            y: this.y,
            width: scaledWidth,
            height: scaledHeight
        };
    }

    /**
     * 绘制图片元素
     */
    draw() {
        if (!this.img || !this.img.complete) return;
        
        const scaledWidth = this.width * this.scale;
        const scaledHeight = this.height * this.scale;
        
        // 保存当前合成模式
        const originalCompositeOperation = this.designer.ctx.globalCompositeOperation;
        
        // 设置图片合成模式
        this.designer.ctx.globalCompositeOperation = 'source-over';
        
        // 绘制图片
        this.designer.ctx.drawImage(
            this.img,
            this.x,
            this.y,
            scaledWidth,
            scaledHeight
        );
        
        // 恢复原始合成模式
        this.designer.ctx.globalCompositeOperation = originalCompositeOperation;
        
        // 如果元素被选中，绘制边框和按钮
        if (this.isSelected && !this.confirmed) {
            this.drawSelectionBox();
            // 绘制确认取消按钮
            this.drawConfirmationButtons();
        }
    }

    /**
     * 绘制确认取消按钮
     */
    drawConfirmationButtons() {
        const bounds = this.getBounds();
        const buttonY = bounds.y + bounds.height + 10;
        
        // 确认按钮位置 - 调整为相对于文本中心位置
        this.confirmationButtons.confirm.x = this.x - 90;
        this.confirmationButtons.confirm.y = buttonY;
        
        // 取消按钮位置
        this.confirmationButtons.cancel.x = this.x + 10;
        this.confirmationButtons.cancel.y = buttonY;
        
        // 绘制确认按钮
        this.drawButton('confirm');
        
        // 绘制取消按钮
        this.drawButton('cancel');
        
        // 调试按钮位置
        console.log(`文本按钮位置 - 确认: (${this.confirmationButtons.confirm.x.toFixed(1)}, ${this.confirmationButtons.confirm.y.toFixed(1)})`);
        console.log(`文本按钮位置 - 取消: (${this.confirmationButtons.cancel.x.toFixed(1)}, ${this.confirmationButtons.cancel.y.toFixed(1)})`);
    }

    /**
     * 绘制单个按钮
     */
    drawButton(buttonType) {
        const button = this.confirmationButtons[buttonType];
        
        // 按钮背景
        this.designer.ctx.fillStyle = buttonType === 'confirm' ? '#27ae60' : '#e74c3c';
        this.designer.ctx.fillRect(button.x, button.y, button.width, button.height);
        
        // 按钮边框
        this.designer.ctx.strokeStyle = '#2c3e50';
        this.designer.ctx.lineWidth = 2;
        this.designer.ctx.strokeRect(button.x, button.y, button.width, button.height);
        
        // 按钮文字
        this.designer.ctx.fillStyle = 'white';
        this.designer.ctx.font = '14px Arial';
        this.designer.ctx.textAlign = 'center';
        this.designer.ctx.textBaseline = 'middle';
        this.designer.ctx.fillText(
            button.text, 
            button.x + button.width/2, 
            button.y + button.height/2
        );
    }

    /**
     * 处理按钮点击
     */
    handleButtonClick(x, y) {
        console.log(`=== 文本按钮点击检查 ===`);
        console.log(`鼠标坐标: x=${x.toFixed(1)}, y=${y.toFixed(1)}`);
        
        const confirmButton = this.confirmationButtons.confirm;
        const cancelButton = this.confirmationButtons.cancel;
        
        console.log(`确认按钮范围: (${confirmButton.x.toFixed(1)}, ${confirmButton.y.toFixed(1)}) 到 (${(confirmButton.x + confirmButton.width).toFixed(1)}, ${(confirmButton.y + confirmButton.height).toFixed(1)})`);
        console.log(`取消按钮范围: (${cancelButton.x.toFixed(1)}, ${cancelButton.y.toFixed(1)}) 到 (${(cancelButton.x + cancelButton.width).toFixed(1)}, ${(cancelButton.y + cancelButton.height).toFixed(1)})`);
        
        if (this.isPointInButton(x, y, 'confirm')) {
            console.log('✓ 点击确认按钮');
            this.confirm();
            return true;
        }
        
        if (this.isPointInButton(x, y, 'cancel')) {
            console.log('✓ 点击取消按钮');
            this.cancel();
            return true;
        }
        
        console.log('✗ 没有点击任何按钮');
        console.log(`=== 结束按钮检查 ===`);
        return false;
    }

    /**
     * 确认使用图片
     */
    confirm() {
        console.log('确认使用图片');
        this.confirmed = true;
        
        // 取消选择
        if (this.designer.elements) {
            this.designer.elements.deselectElement();
        }
        
        // 保存状态
        this.designer.saveState();
        
        // 显示确认消息
        this.designer.showToast('图片已确认并固定');
    }

    /**
     * 取消使用图片
     */
    cancel() {
        console.log('取消使用图片');
        
        // 从元素管理器中删除元素
        if (this.designer.elements) {
            this.designer.elements.elements = this.designer.elements.elements.filter(
                element => element.id !== this.id
            );
            this.designer.elements.deselectElement();
        }
        
        // 重新渲染
        this.designer.renderElementsOnly();
        this.designer.saveState();
        
        // 清空上传input的值
        const uploadInput = document.getElementById('image-upload-input');
        if (uploadInput) {
            uploadInput.value = '';
        }
        
        this.designer.showToast('图片上传已取消');
    }

    /**
     * 获取元素状态（用于保存和恢复）
     */
    getState() {
        const state = super.getState();
        state.confirmed = this.confirmed;
        state.originalWidth = this.originalWidth;
        state.originalHeight = this.originalHeight;
        state.isProcessed = this.isProcessed;
        return state;
    }

    /**
     * 从状态恢复元素
     */
    setState(state) {
        super.setState(state);
        this.confirmed = state.confirmed || false;
        this.originalWidth = state.originalWidth || this.width;
        this.originalHeight = state.originalHeight || this.height;
        this.isProcessed = state.isProcessed || false;
    }
}

/**
 * 文本元素类
 */
class TextElement extends DesignerElement {
    constructor(designer, config) {
        super(designer, { ...config, type: 'text' });
        
        this.text = config.text || '';
        this.fontSize = config.fontSize || 24;
        this.fontFamily = config.fontFamily || 'Arial';
        this.color = config.color || '#3D2314';
        
        // 确认/取消状态
        this.confirmed = false;
        this.confirmationButtons = {
            confirm: { x: 0, y: 0, width: 80, height: 30, text: '确定' },
            cancel: { x: 0, y: 0, width: 80, height: 30, text: '取消' }
        };
    }

    /**
     * 检查鼠标是否在元素范围内（不包含按钮区域）
     */
    isPointInElement(x, y) {
        // 只检查文本主体，不检查按钮区域
        this.designer.ctx.font = `${this.fontSize * this.scale}px ${this.fontFamily}`;
        const metrics = this.designer.ctx.measureText(this.text);
        const textHeight = this.fontSize * this.scale;
        const padding = 5;
        
        const left = this.x - metrics.width / 2 - padding;
        const right = this.x + metrics.width / 2 + padding;
        const top = this.y - textHeight / 2 - padding;
        const bottom = this.y + textHeight / 2 + padding;
        
        const isInBounds = x >= left && x <= right && y >= top && y <= bottom;
        
        // 调试信息
        if (this.isSelected && !this.isDragging) {
            console.log(`文本边界检查: x=${this.x.toFixed(1)}, y=${this.y.toFixed(1)}, 宽度=${metrics.width.toFixed(1)}, 高度=${textHeight.toFixed(1)}`);
            console.log(`鼠标位置: x=${x.toFixed(1)}, y=${y.toFixed(1)}`);
            console.log(`是否在范围内: ${isInBounds}`);
        }
        
        return isInBounds;
    }

    /**
     * 检查鼠标是否在按钮区域内（单独调用，不干扰元素选择）
     */
    isPointInButtonArea(x, y) {
        if (!this.isSelected) return false;
        
        if (this.isPointInButton(x, y, 'confirm')) {
            console.log('鼠标在确认按钮上');
            return true;
        }
        if (this.isPointInButton(x, y, 'cancel')) {
            console.log('鼠标在取消按钮上');
            return true;
        }
        
        return false;
    }

    /**
     * 检查鼠标是否在按钮范围内
     */
    isPointInButton(x, y, buttonType) {
        const button = this.confirmationButtons[buttonType];
        if (!button) return false;
        
        return x >= button.x && 
               x <= button.x + button.width && 
               y >= button.y && 
               y <= button.y + button.height;
    }

    /**
     * 获取文本边界
     */
    getBounds() {
        this.designer.ctx.font = `${this.fontSize * this.scale}px ${this.fontFamily}`;
        const metrics = this.designer.ctx.measureText(this.text);
        const textHeight = this.fontSize * this.scale;
        const padding = 5;
        
        return {
            x: this.x - metrics.width / 2 - padding,
            y: this.y - textHeight / 2 - padding,
            width: metrics.width + padding * 2,
            height: textHeight + padding * 2
        };
    }

    /**
     * 绘制文本元素
     */
    draw() {
        this.designer.ctx.save();
        
        // 设置字体和颜色
        this.designer.ctx.font = `${this.fontSize * this.scale}px ${this.fontFamily}`;
        this.designer.ctx.fillStyle = this.color;
        this.designer.ctx.textAlign = 'center';
        this.designer.ctx.textBaseline = 'middle';
        
        // 应用变换
        this.designer.ctx.translate(this.x, this.y);
        this.designer.ctx.rotate(this.rotation * Math.PI / 180);
        
        // 绘制文本
        this.designer.ctx.fillText(this.text, 0, 0);
        
        this.designer.ctx.restore();
        
        // 如果元素被选中，绘制边框和按钮
        if (this.isSelected && !this.confirmed) {
            this.drawSelectionBox();
            // 绘制确认取消按钮
            this.drawConfirmationButtons();
        }
    }

    /**
     * 绘制确认取消按钮
     */
    drawConfirmationButtons() {
        const bounds = this.getBounds();
        const buttonY = bounds.y + bounds.height + 10;
        
        // 确认按钮位置 - 调整为相对于文本中心位置
        this.confirmationButtons.confirm.x = this.x - 90;
        this.confirmationButtons.confirm.y = buttonY;
        
        // 取消按钮位置
        this.confirmationButtons.cancel.x = this.x + 10;
        this.confirmationButtons.cancel.y = buttonY;
        
        // 绘制确认按钮
        this.drawButton('confirm');
        
        // 绘制取消按钮
        this.drawButton('cancel');
        
        // 调试按钮位置
        console.log(`文本按钮位置 - 确认: (${this.confirmationButtons.confirm.x.toFixed(1)}, ${this.confirmationButtons.confirm.y.toFixed(1)})`);
        console.log(`文本按钮位置 - 取消: (${this.confirmationButtons.cancel.x.toFixed(1)}, ${this.confirmationButtons.cancel.y.toFixed(1)})`);
    }

    /**
     * 绘制单个按钮
     */
    drawButton(buttonType) {
        const button = this.confirmationButtons[buttonType];
        
        // 按钮背景
        this.designer.ctx.fillStyle = buttonType === 'confirm' ? '#27ae60' : '#e74c3c';
        this.designer.ctx.fillRect(button.x, button.y, button.width, button.height);
        
        // 按钮边框
        this.designer.ctx.strokeStyle = '#2c3e50';
        this.designer.ctx.lineWidth = 2;
        this.designer.ctx.strokeRect(button.x, button.y, button.width, button.height);
        
        // 按钮文字
        this.designer.ctx.fillStyle = 'white';
        this.designer.ctx.font = '14px Arial';
        this.designer.ctx.textAlign = 'center';
        this.designer.ctx.textBaseline = 'middle';
        this.designer.ctx.fillText(
            button.text, 
            button.x + button.width/2, 
            button.y + button.height/2
        );
    }

    /**
     * 处理按钮点击
     */
    handleButtonClick(x, y) {
        console.log(`=== 文本按钮点击检查 ===`);
        console.log(`鼠标坐标: x=${x.toFixed(1)}, y=${y.toFixed(1)}`);
        
        const confirmButton = this.confirmationButtons.confirm;
        const cancelButton = this.confirmationButtons.cancel;
        
        console.log(`确认按钮范围: (${confirmButton.x.toFixed(1)}, ${confirmButton.y.toFixed(1)}) 到 (${(confirmButton.x + confirmButton.width).toFixed(1)}, ${(confirmButton.y + confirmButton.height).toFixed(1)})`);
        console.log(`取消按钮范围: (${cancelButton.x.toFixed(1)}, ${cancelButton.y.toFixed(1)}) 到 (${(cancelButton.x + cancelButton.width).toFixed(1)}, ${(cancelButton.y + cancelButton.height).toFixed(1)})`);
        
        if (this.isPointInButton(x, y, 'confirm')) {
            console.log('✓ 点击确认按钮');
            this.confirm();
            return true;
        }
        
        if (this.isPointInButton(x, y, 'cancel')) {
            console.log('✓ 点击取消按钮');
            this.cancel();
            return true;
        }
        
        console.log('✗ 没有点击任何按钮');
        console.log(`=== 结束按钮检查 ===`);
        return false;
    }

    /**
     * 确认使用文本
     */
    confirm() {
        console.log('确认使用文本');
        this.confirmed = true;
        
        // 取消选择
        if (this.designer.elements) {
            this.designer.elements.deselectElement();
        }
        
        // 保存状态
        this.designer.saveState();
        
        // 显示确认消息
        this.designer.showToast('文本已确认并固定');
    }

    /**
     * 取消使用文本
     */
    cancel() {
        console.log('取消使用文本');
        
        // 从元素管理器中删除元素
        if (this.designer.elements) {
            this.designer.elements.elements = this.designer.elements.elements.filter(
                element => element.id !== this.id
            );
            this.designer.elements.deselectElement();
        }
        
        // 重新渲染
        this.designer.renderElementsOnly();
        this.designer.saveState();
        
        // 清空文本输入框
        const textInput = document.getElementById('text-input');
        if (textInput) {
            textInput.value = '';
        }
        
        this.designer.showToast('文本添加已取消');
    }

    /**
     * 获取元素状态（用于保存和恢复）
     */
    getState() {
        const state = super.getState();
        state.confirmed = this.confirmed;
        state.text = this.text;
        state.fontSize = this.fontSize;
        state.fontFamily = this.fontFamily;
        state.color = this.color;
        return state;
    }

    /**
     * 从状态恢复元素
     */
    setState(state) {
        super.setState(state);
        this.confirmed = state.confirmed || false;
        this.text = state.text || '';
        this.fontSize = state.fontSize || 24;
        this.fontFamily = state.fontFamily || 'Arial';
        this.color = state.color || '#3D2314';
    }
}