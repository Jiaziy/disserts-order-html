/**
 * 甜点设计器 - 事件管理模块
 * 负责鼠标事件、触摸事件、键盘事件等用户交互处理
 */

class DesignerEvents {
    constructor(designer) {
        this.designer = designer;
        this.isMouseDown = false;
        this.lastMousePos = { x: 0, y: 0 };
        
        // 初始化事件监听
        this.initEventListeners();
    }

    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        // 鼠标事件
        this.designer.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.designer.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.designer.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.designer.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // 触摸事件
        this.designer.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.designer.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.designer.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // 键盘事件
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // 滚轮事件
        this.designer.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        
        // 窗口大小变化事件
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    /**
     * 获取鼠标/触摸位置（带缩放处理）
     */
    getMousePos(e) {
        const rect = this.designer.canvas.getBoundingClientRect();
        
        // 计算画布的缩放比例
        const scaleX = this.designer.canvas.width / rect.width;
        const scaleY = this.designer.canvas.height / rect.height;
        
        if (e.touches) {
            // 触摸事件
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            };
        } else {
            // 鼠标事件
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        }
    }

    /**
     * 鼠标按下事件
     */
    handleMouseDown(e) {
        e.preventDefault();
        
        const pos = this.getMousePos(e);
        this.isMouseDown = true;
        this.lastMousePos = { ...pos };
        
        console.log(`鼠标按下事件，当前工具: ${this.designer.currentTool}`);
        
        // 根据当前工具类型决定处理优先级
        switch (this.designer.currentTool) {
            case 'brush':
            case 'eraser':
                // 画笔和橡皮擦工具：直接开始绘图，不检查元素选择
                console.log('画笔/橡皮擦工具，直接开始绘图');
                
                // 确保绘图状态正确重置
                if (this.designer.isDragging || this.designer.isDraggingText) {
                    this.designer.isDragging = false;
                    this.designer.isDraggingText = false;
                }
                
                this.designer.tools.startDrawing(e);
                break;
                
            case 'shape':
                // 形状工具：直接开始绘图
                console.log('形状工具，直接开始绘图');
                
                // 确保绘图状态正确重置
                if (this.designer.isDragging || this.designer.isDraggingText) {
                    this.designer.isDragging = false;
                    this.designer.isDraggingText = false;
                }
                
                this.designer.tools.startDrawing(e);
                break;
                
            case 'text':
            case 'image':
                // 文本和图片工具：先尝试选择元素
                console.log('文本/图片工具，尝试选择元素');
                const element = this.designer.elements.startDraggingElement(pos);
                if (element) {
                    console.log(`成功选中元素: ${element.type}, 开始拖动`);
                    // 如果选中了元素，保持当前工具类型，只设置拖动状态
                    if (this.designer.elements.selectedElement) {
                        this.designer.isDragging = true;
                    }
                    
                    // 显示选中元素的提示
                    this.showElementSelectedMessage(element.type);
                } else {
                    console.log('没有选中任何元素，取消选择');
                    this.designer.elements.deselectElement();
                    
                    // 如果没有选中元素，并且点击了元素区域外，自动切换到画笔工具
                    if (this.designer.currentTool === 'image' || this.designer.currentTool === 'text') {
                        console.log('图片/文字工具区域外点击，切换到画笔工具');
                        
                        // 立即更新工具状态，确保后续操作使用正确的工具
                        this.designer.currentTool = 'brush';
                        this.designer.tools.currentTool = 'brush';
                        
                        // 更新UI按钮状态
                        document.querySelectorAll('.tool-btn').forEach(btn => {
                            btn.classList.remove('active');
                        });
                        document.querySelector(`.tool-btn[data-tool="brush"]`)?.classList.add('active');
                        
                        // 更新光标样式
                        this.designer.canvas.style.cursor = 'crosshair';
                        
                        // 显示工具切换提示
                        this.showToolSwitchedMessage('brush');
                        
                        // 立即开始绘图，不再使用延迟
                        this.designer.tools.startDrawing(e);
                    }
                }
                break;
                
            default:
                // 其他工具：先尝试选择元素
                console.log('尝试选择元素');
                const defaultElement = this.designer.elements.startDraggingElement(pos);
                if (!defaultElement) {
                    console.log('没有选中任何元素');
                }
        }
        
        // 更新界面
        this.designer.updateUI();
    }

    /**
     * 鼠标移动事件
     */
    handleMouseMove(e) {
        e.preventDefault();
        
        const pos = this.getMousePos(e);
        
        if (this.isMouseDown) {
            // 根据当前工具类型处理不同的操作
            switch (this.designer.currentTool) {
                case 'brush':
                case 'eraser':
                case 'shape':
                    this.designer.tools.draw(e);
                    break;
                case 'text':
                case 'image':
                    // 统一使用元素管理器处理图片和文本的拖动
                    this.designer.elements.dragElement(pos);
                    break;
            }
        }
        
        // 保存最后鼠标位置
        this.lastMousePos = { ...pos };
    }

    /**
     * 鼠标松开事件
     */
    handleMouseUp(e) {
        e.preventDefault();
        
        const pos = this.getMousePos(e);
        
        if (this.isMouseDown) {
            this.isMouseDown = false;
            
            // 根据当前工具类型处理不同的操作
            switch (this.designer.currentTool) {
                case 'brush':
                case 'eraser':
                case 'shape':
                    this.designer.tools.stopDrawing();
                    this.designer.saveState();
                    break;
                case 'text':
                case 'image':
                    // 统一使用元素管理器处理图片和文本的拖动停止
                    this.designer.elements.stopDraggingElement();
                    this.designer.saveState();
                    break;
            }
        }
        
        // 恢复光标样式
        this.designer.canvas.style.cursor = 'default';
        
        // 更新界面
        this.designer.updateUI();
    }

    /**
     * 鼠标离开画布事件
     */
    handleMouseLeave(e) {
        if (this.isMouseDown) {
            this.handleMouseUp(e);
        }
        
        // 恢复光标样式
        this.designer.canvas.style.cursor = 'default';
    }

    /**
     * 触摸开始事件
     */
    handleTouchStart(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            // 单点触摸，模拟鼠标事件
            this.handleMouseDown(e);
        }
    }

    /**
     * 触摸移动事件
     */
    handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            // 单点触摸，模拟鼠标事件
            this.handleMouseMove(e);
        }
    }

    /**
     * 触摸结束事件
     */
    handleTouchEnd(e) {
        e.preventDefault();
        
        if (e.touches.length === 0) {
            // 触摸结束，模拟鼠标事件
            this.handleMouseUp(new MouseEvent('mouseup'));
        }
    }

    /**
     * 键盘按下事件
     */
    handleKeyDown(e) {
        // 快捷键处理
        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                if (this.designer.currentTool === 'text' || this.designer.currentTool === 'image') {
                    // 统一使用元素管理器删除选中的元素
                    this.designer.elements.deleteSelectedElement();
                }
                break;
            case 'z':
            case 'Z':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.designer.redo();
                    } else {
                        this.designer.undo();
                    }
                }
                break;
            case 'y':
            case 'Y':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.designer.redo();
                }
                break;
            case 'r':
            case 'R':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.designer.renderer.resetCanvas();
                }
                break;
        }
    }

    /**
     * 滚轮事件
     */
    handleWheel(e) {
        e.preventDefault();
        
        const pos = this.getMousePos(e);
        
        // 根据当前工具类型处理滚轮事件
        switch (this.designer.currentTool) {
            case 'text':
            case 'image':
                // 统一使用元素管理器处理缩放
                if (this.designer.elements.selectedElement) {
                    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
                    this.designer.elements.scaleElement(zoomFactor, pos.x, pos.y);
                }
                break;
        }
    }

    /**
     * 窗口大小变化事件
     */
    handleResize() {
        // 防抖处理，避免频繁调整
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.designer.renderer.resizeCanvas();
        }, 250);
    }

    /**
     * 清理事件监听器
     */
    cleanup() {
        // 在实际应用中，应该移除所有事件监听器
        // 这里简化处理，在实际项目中需要完整清理
        window.removeEventListener('resize', this.handleResize.bind(this));
    }

    /**
     * 显示元素选中状态提示
     */
    showElementSelectedMessage(elementType) {
        const elementNames = {
            'text': '文本',
            'image': '图片'
        };
        
        const name = elementNames[elementType] || elementType;
        this.designer.showToast(`${name}已选中，可拖动调整位置，按Delete删除`);
        
        // 更新状态栏显示
        this.updateStatusBar(`已选中${name} - 拖动调整位置，按Delete删除`);
    }

    /**
     * 显示工具切换提示
     */
    showToolSwitchedMessage(toolType) {
        const toolNames = {
            'brush': '画笔',
            'eraser': '橡皮擦',
            'shape': '形状',
            'text': '文本',
            'image': '图片'
        };
        
        const name = toolNames[toolType] || toolType;
        this.designer.showToast(`已切换到${name}工具`);
        
        // 更新状态栏显示
        this.updateStatusBar(`当前工具：${name}`);
    }

    /**
     * 更新状态栏显示
     */
    updateStatusBar(message) {
        // 查找状态栏元素 - 使用现有的状态元素
        const currentToolSpan = document.getElementById('current-tool');
        if (currentToolSpan) {
            currentToolSpan.textContent = message;
        } else {
            // 如果状态栏不存在，在控制台显示
            console.log(`状态: ${message}`);
        }
    }

    /**
     * 显示工具使用提示
     */
    showToolUsageHint(toolType) {
        const hints = {
            'brush': '点击并拖动使用画笔绘画',
            'eraser': '点击并拖动擦除内容',
            'shape': '点击并拖动绘制形状',
            'text': '点击画布添加文本，点击文本元素可编辑',
            'image': '点击画布添加图片，点击图片元素可调整'
        };
        
        const hint = hints[toolType] || '请选择工具开始创作';
        this.updateStatusBar(hint);
    }
}