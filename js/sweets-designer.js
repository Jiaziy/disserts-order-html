// 甜点设计平台 - 模块化实现
class SweetsDesigner {
    constructor() {
        // DOM引用
        this.canvas = null;
        this.ctx = null;
        this.previewCanvas = null;
        this.previewCtx = null;
        
        // 绘图状态
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.isRendering = false;
        this.points = []; // 存储点的数组，用于优化绘图
        
        // 设计参数
        this.currentColor = '#FF6B6B'; // 默认颜色
        this.brushSize = 5;
        this.dessertType = 'cake';
        this.canvasSize = { width: 1024, height: 768 };
        this.currentTool = 'brush';
        this.selectedShape = null;
        
        // 历史记录
        this.history = [];
        this.historyIndex = 0;
        
        // 初始化
        this.init();
    }


    /**
     * 初始化应用
     */
    init() {
        this.setupCanvas();
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
        
        this.updateUI();
    }

    /**
     * 设置主画布
     */
    setupCanvas() {
        this.canvas = document.getElementById('design-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
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
        
        // 更新canvasSize对象
        this.canvasSize = { width: this.canvas.width, height: this.canvas.height };
        
        // 清空画布（初始化时不显示确认框）
        this.clearCanvas(false);
        
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
        const aspectRatio = 4 / 3;
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 保存当前画布内容
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // 计算新尺寸
        let newWidth, newHeight;
        if (containerWidth / containerHeight > aspectRatio) {
            newHeight = containerHeight;
            newWidth = newHeight * aspectRatio;
        } else {
            newWidth = containerWidth;
            newHeight = newWidth / aspectRatio;
        }
        
        // 更新尺寸
        this.canvas.width = Math.floor(newWidth);
        this.canvas.height = Math.floor(newHeight);
        
        // 更新canvasSize对象
        this.canvasSize = { width: this.canvas.width, height: this.canvas.height };
        
        // 尝试绘制回之前的内容（会按新尺寸缩放）
        if (imageData) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imageData.width;
            tempCanvas.height = imageData.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(imageData, 0, 0);
            
            // 按新尺寸绘制内容
            this.ctx.drawImage(tempCanvas, 0, 0, this.canvas.width, this.canvas.height);
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
            
            // 设置预览画布尺寸（按比例缩小）
            const scale = 0.25;
            this.previewCanvas.width = this.canvasSize.width * scale;
            this.previewCanvas.height = this.canvasSize.height * scale;
            
            // 清空预览画布
            this.previewCtx.fillStyle = '#FFFFFF';
            this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        if (!this.canvas) return;
        
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // 触摸事件（移动端支持）
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 防止页面滚动
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault(); // 防止页面滚动
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
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
     * 开始绘图
     */
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        this.points = [{x: this.lastX, y: this.lastY}];
        
        if (this.currentTool === 'brush') {
            // 画笔模式
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.brushSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.globalCompositeOperation = 'source-over';
        } else if (this.currentTool === 'eraser') {
            // 橡皮擦模式
            this.ctx.strokeStyle = '#FFFFFF';
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
        
        // 如果points数组为空，添加最后一个已知点作为起点
        if (this.points.length === 0) {
            this.points.push({x: this.lastX, y: this.lastY});
        }
        
        // 添加新点
        this.points.push({x: currentX, y: currentY});
        
        // 使用requestAnimationFrame优化渲染
        if (!this.isRendering) {
            this.isRendering = true;
            requestAnimationFrame(() => this.render());
        }
        
        // 更新最后位置
        this.lastX = currentX;
        this.lastY = currentY;
    }

    /**
     * 渲染方法 - 使用高效路径管理
     */
    render() {
        if (this.points.length < 2) {
            // 单个点绘制
            if (this.points.length === 1) {
                if (this.currentTool === 'brush') {
                    this.ctx.strokeStyle = this.currentColor;
                    this.ctx.lineWidth = this.brushSize;
                } else if (this.currentTool === 'eraser') {
                    this.ctx.strokeStyle = '#FFFFFF';
                    this.ctx.lineWidth = this.brushSize * 2;
                }
                this.ctx.lineCap = 'round';
                
                // 使用小线段绘制单个点
                const point = this.points[0];
                this.ctx.beginPath();
                this.ctx.moveTo(point.x, point.y);
                this.ctx.lineTo(point.x + 0.1, point.y);
                this.ctx.stroke();
            }
            this.isRendering = false;
            return;
        }
        
        // 根据工具设置不同的绘图属性
        if (this.currentTool === 'brush') {
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.brushSize;
            this.ctx.globalCompositeOperation = 'source-over';
        } else if (this.currentTool === 'eraser') {
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = this.brushSize * 2;
            this.ctx.globalCompositeOperation = 'destination-out';
        }
        
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // 一次性绘制所有线段
        this.ctx.beginPath();
        this.ctx.moveTo(this.points[0].x, this.points[0].y);
        
        // 绘制所有点之间的线段
        for (let i = 1; i < this.points.length; i++) {
            this.ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        
        this.ctx.stroke();
        
        // 清空点数组
        this.points = [];
        
        this.isRendering = false;
    }

    /**
     * 停止绘图
     */
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            
            // 确保所有点都被渲染
            if (this.points.length > 0) {
                this.render();
            }
            
            // 恢复默认合成模式
            this.ctx.globalCompositeOperation = 'source-over';
            
            this.saveState();
            this.updatePreview();
        }
    }

    /**
     * 选择工具
     */
    selectTool(tool) {
        this.currentTool = tool;
        
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
                default:
                    this.canvas.style.cursor = 'crosshair';
            }
        }
        
        this.updateDesignInfo();
    }

    /**
     * 选择甜点类型
     */
    selectDessertType(type) {
        this.dessertType = type;
        
        // 更新按钮状态
        document.querySelectorAll('.dessert-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.dessert-type-btn[data-type="${type}"]`)?.classList.add('active');
        
        // 这里可以添加甜点类型改变后的处理逻辑
        this.updateDesignInfo();
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
        this.brushSize = size;
        
        // 更新按钮状态
        document.querySelectorAll('.size-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`.size-option[data-size="${size}"]`)?.classList.add('active');
        
        this.updateDesignInfo();
    }

    /**
     * 形状选择
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
     * 绘制形状
     */
    drawShape(x, y) {
        const size = this.brushSize * 10; // 形状大小基于画笔大小
        
        this.ctx.fillStyle = this.currentColor;
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = 2;
        
        switch (this.selectedShape) {
            case 'heart':
                this.drawHeart(x, y, size);
                break;
            case 'star':
                this.drawStar(x, y, size);
                break;
            case 'circle':
                this.drawCircle(x, y, size);
                break;
            case 'square':
                this.drawSquare(x, y, size);
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
        // 实现添加文本功能
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = this.currentColor;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x || this.canvas.width / 2, y || this.canvas.height / 2);
        
        this.saveState();
        this.updatePreview();
    }

    /**
     * 处理图片上传
     */
    handleImageUpload(file) {
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
                
                // 在画布中心绘制图片
                const x = (this.canvas.width - width) / 2;
                const y = (this.canvas.height - height) / 2;
                this.ctx.drawImage(img, x, y, width, height);
                
                this.saveState();
                this.updatePreview();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    /**
     * 更新预览
     */
    updatePreview() {
        if (!this.previewCanvas || !this.previewCtx) return;
        
        // 清空预览画布
        this.previewCtx.fillStyle = '#FFFFFF';
        this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        
        // 从主画布复制内容到预览画布（按比例缩小）
        const scale = this.previewCanvas.width / this.canvas.width;
        this.previewCtx.drawImage(
            this.canvas,
            0, 0, this.canvas.width, this.canvas.height,
            0, 0, this.previewCanvas.width, this.previewCanvas.height
        );
    }

    /**
     * 保存当前状态到历史记录
     */
    saveState() {
        // 确保ctx存在
        if (!this.ctx) return;
        
        // 移除历史记录中当前索引之后的所有状态
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // 保存当前画布状态
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.history.push(imageData);
        this.historyIndex = this.history.length - 1;
        
        // 限制历史记录数量
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
        
        this.updateHistoryButtons();
        console.log('状态已保存，历史记录数量:', this.history.length);
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
    clearCanvas(showConfirm = true) {
        console.log('清空按钮点击，显示确认框:', showConfirm);
        if (this.ctx) {
            // 只有在需要显示确认框且用户确认的情况下才继续，或者直接清空（初始化时）
            if (!showConfirm || confirm('确定要清空画布吗？此操作不可撤销。')) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.saveState();
                this.updatePreview();
                console.log('画布已清空');
            }
        }
    }

    /**
     * 保存画布内容
     */
    saveCanvas() {
        // 转换为Blob对象
        this.canvas.toBlob((blob) => {
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.dessertType}-design-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);
        }, 'image/png');
    }

    /**
     * 导出画布内容
     */
    exportCanvas() {
        // 直接使用保存功能
        this.saveCanvas();
    }

    /**
     * 提交设计（示例实现）
     */
    submitDesign() {
        // 转换为Base64编码
        const imageData = this.canvas.toDataURL('image/png');
        
        // 这里可以添加提交到服务器的逻辑
        console.log('提交设计:', {
            dessertType: this.dessertType,
            imageData: imageData
        });
        
        // 显示成功消息
        alert('设计提交成功！');
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
     * 更新UI状态
     */
    updateUI() {
        // 更新画布尺寸显示
        const canvasSizeElement = document.getElementById('canvas-size');
        if (canvasSizeElement) {
            canvasSizeElement.textContent = `${this.canvasSize.width} × ${this.canvasSize.height}`;
        }
        
        // 保存初始状态
        this.saveState();
        
        // 初始化历史记录按钮状态
        this.updateHistoryButtons();
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
    if (!designer) return;
    
    // 初始化绘图工具按钮事件
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(button => {
        button.addEventListener('click', function() {
            const toolType = this.dataset.tool;
            designer.selectTool(toolType);
        });
    });
    
    // 初始化形状按钮事件
    const shapeButtons = document.querySelectorAll('.shape-btn');
    shapeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const shapeType = this.dataset.shape;
            designer.selectShape(shapeType);
        });
    });
    
    // 初始化颜色选择器事件
    const colorSwatches = document.querySelectorAll('.color-swatch');
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', function() {
            const color = this.dataset.color;
            designer.selectColor(color);
        });
    });
    
    // 初始化画笔大小选择器事件
    const sizeOptions = document.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const size = parseInt(this.dataset.size);
            designer.selectBrushSize(size);
        });
    });
    
    // 初始化甜点类型选择器事件
    const dessertButtons = document.querySelectorAll('.dessert-type-btn');
    dessertButtons.forEach(button => {
        button.addEventListener('click', function() {
            const dessertType = this.dataset.type;
            designer.selectDessertType(dessertType);
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
    document.getElementById('reset-view-btn')?.addEventListener('click', () => designer.resetView());
    
    // 初始化保存按钮
    document.getElementById('save-btn')?.addEventListener('click', () => designer.saveCanvas());
    
    // 初始化图片上传
    const uploadInput = document.getElementById('image-upload');
    if (uploadInput) {
        uploadInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                designer.handleImageUpload(e.target.files[0]);
            }
        });
    }
    
    // 设置默认工具为画笔
    designer.selectTool('brush');
    
    // 设置默认颜色为第一个颜色
    if (colorSwatches.length > 0) {
        const defaultColor = colorSwatches[0].dataset.color;
        designer.selectColor(defaultColor);
    }
    
    // 设置默认画笔大小
    if (sizeOptions.length > 0) {
        const defaultSize = parseInt(sizeOptions[1].dataset.size);
        designer.selectBrushSize(defaultSize);
    }
    
    // 设置默认甜点类型
    if (dessertButtons.length > 0) {
        const defaultType = dessertButtons[0].dataset.type;
        designer.selectDessertType(defaultType);
    }
}

// 导出全局方法供HTML使用
window.undo = () => designer?.undo();
window.redo = () => designer?.redo();
window.clearCanvas = () => designer?.clearCanvas();
window.saveDesign = () => designer?.saveCanvas();
window.exportDesign = () => designer?.exportCanvas();
window.generatePreview = () => designer?.updatePreview();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeDesigner();
    // 延迟一下，确保designer对象已经创建
    setTimeout(initializeTools, 100);
});