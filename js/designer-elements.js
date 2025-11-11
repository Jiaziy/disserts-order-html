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
        this.isDragging = true;
        this.dragOffset.x = pos.x - this.x;
        this.dragOffset.y = pos.y - this.y;
        this.designer.canvas.style.cursor = 'move';
        
        // 通知设计器元素开始拖动
        if (this.designer.elements) {
            this.designer.elements.onElementDragStart(this);
        }
    }

    /**
     * 拖动元素
     */
    drag(pos) {
        if (!this.isDragging) return;
        
        // 如果正在绘图，不允许拖动元素
        if (this.designer.isDrawing) {
            return;
        }
        
        // 更新元素位置
        this.x = pos.x - this.dragOffset.x;
        this.y = pos.y - this.dragOffset.y;
        
        // 限制元素在画布范围内
        this.constrainToCanvas();
        
        // 通知设计器元素正在拖动
        if (this.designer.elements) {
            this.designer.elements.onElementDrag(this);
        }
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
    }

    /**
     * 检查鼠标是否在图片范围内
     */
    isPointInElement(x, y) {
        const scaledWidth = this.width * this.scale;
        const scaledHeight = this.height * this.scale;
        
        return x >= this.x && 
               x <= this.x + scaledWidth && 
               y >= this.y && 
               y <= this.y + scaledHeight;
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
        
        // 如果元素被选中，绘制边框
        if (this.isSelected) {
            this.drawSelectionBox();
        }
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
    }

    /**
     * 检查鼠标是否在文本范围内
     */
    isPointInElement(x, y) {
        // 测量文本尺寸
        this.designer.ctx.font = `${this.fontSize * this.scale}px ${this.fontFamily}`;
        const metrics = this.designer.ctx.measureText(this.text);
        const textHeight = this.fontSize * this.scale;
        const padding = 5;
        
        const left = this.x - metrics.width / 2 - padding;
        const right = this.x + metrics.width / 2 + padding;
        const top = this.y - textHeight / 2 - padding;
        const bottom = this.y + textHeight / 2 + padding;
        
        return x >= left && x <= right && y >= top && y <= bottom;
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
        
        // 如果元素被选中，绘制边框
        if (this.isSelected) {
            this.drawSelectionBox();
        }
    }
}