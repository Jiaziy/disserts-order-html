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
     * 获取鼠标/触摸位置
     */
    getMousePos(e) {
        const rect = this.designer.canvas.getBoundingClientRect();
        
        if (e.touches) {
            // 触摸事件
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        } else {
            // 鼠标事件
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
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
        
        // 根据当前工具类型处理不同的操作
        switch (this.designer.currentTool) {
            case 'brush':
                this.designer.tools.startDrawing(pos);
                break;
            case 'text':
            case 'image':
                // 统一使用元素管理器处理图片和文本的选择和拖动
                const element = this.designer.elements.startDraggingElement(pos);
                if (element) {
                    // 如果选中了元素，切换到对应的工具
                    this.designer.setCurrentTool(element.type);
                }
                break;
            case 'shape':
                this.designer.tools.startDrawing(pos);
                break;
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
                case 'shape':
                    this.designer.tools.draw(pos);
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
            const pos = this.getMousePos(e);
            this.handleMouseDown(new MouseEvent('mousedown', {
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            }));
        }
    }

    /**
     * 触摸移动事件
     */
    handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            // 单点触摸，模拟鼠标事件
            const pos = this.getMousePos(e);
            this.handleMouseMove(new MouseEvent('mousemove', {
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            }));
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
}