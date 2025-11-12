/**
 * 甜点设计器 - 元素管理器模块
 * 统一管理图片和文本元素，提供统一的缩放、拖动、选择等操作
 */

class DesignerElementsManager {
    constructor(designer) {
        this.designer = designer;
        this.elements = []; // 所有元素（图片和文本）
        this.selectedElement = null; // 当前选中的元素
        this.zIndexCounter = 0; // Z轴索引计数器
    }

    /**
     * 添加元素
     */
    addElement(element) {
        // 设置Z轴索引
        element.zIndex = this.zIndexCounter++;
        
        this.elements.push(element);
        this.designer.renderElementsOnly();
        
        return element;
    }

    /**
     * 根据ID获取元素
     */
    getElementById(id) {
        return this.elements.find(element => element.id === id);
    }

    /**
     * 根据类型获取元素列表
     */
    getElementsByType(type) {
        return this.elements.filter(element => element.type === type);
    }

    /**
     * 选择元素
     */
    selectElement(element) {
        // 取消之前选中的元素
        if (this.selectedElement) {
            this.selectedElement.isSelected = false;
        }
        
        // 选择新元素
        this.selectedElement = element;
        if (element) {
            element.isSelected = true;
            
            // 将选中元素置顶
            this.bringToFront(element);
        }
        
        this.designer.renderElementsOnly();
    }

    /**
     * 取消选择元素
     */
    deselectElement() {
        if (this.selectedElement) {
            this.selectedElement.isSelected = false;
            this.selectedElement = null;
            this.designer.renderElementsOnly();
        }
    }

    /**
     * 检查鼠标位置上的元素
     */
    getElementAtPosition(x, y) {
        console.log(`=== 开始检查元素位置 ===`);
        console.log(`鼠标坐标: x=${x.toFixed(1)}, y=${y.toFixed(1)}`);
        console.log(`总元素数量: ${this.elements.length}`);
        
        // 从后往前检查，优先选择顶层的元素
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i];
            
            // 详细的调试信息
            console.log(`检查元素 #${i}: ${element.type} (${element.id})`);
            
            const bounds = element.getBounds();
            console.log(`元素位置: x=${element.x.toFixed(1)}, y=${element.y.toFixed(1)}, 缩放: ${element.scale}`);
            console.log(`元素边界: 左上(${bounds.x.toFixed(1)},${bounds.y.toFixed(1)}) 右下(${(bounds.x + bounds.width).toFixed(1)},${(bounds.y + bounds.height).toFixed(1)})`);
            console.log(`边界尺寸: ${bounds.width.toFixed(1)}x${bounds.height.toFixed(1)}`);
            
            const isInElement = element.isPointInElement(x, y);
            console.log(`是否在元素范围内: ${isInElement}`);
            
            if (isInElement) {
                console.log(`✓ 选中元素: ${element.id} (${element.type})`);
                console.log(`=== 结束检查 ===`);
                return element;
            }
            
            console.log('---');
        }
        
        console.log('✗ 没有找到任何元素');
        console.log(`=== 结束检查 ===`);
        return null;
    }

    /**
     * 开始拖动元素
     */
    startDraggingElement(pos) {
        console.log('开始拖动元素检查，位置:', pos);
        
        // 先检查是否有元素在鼠标位置
        const element = this.getElementAtPosition(pos.x, pos.y);
        
        if (element) {
            console.log(`找到元素: ${element.type} (${element.id})`);
            
            // 如果是图片或文本元素，先检查按钮区域（在选中元素之前）
            if ((element.type === 'image' || element.type === 'text') && element.isPointInButtonArea) {
                console.log('检查元素按钮区域');
                const isInButtonArea = element.isPointInButtonArea(pos.x, pos.y);
                
                if (isInButtonArea) {
                    console.log('在按钮区域，先处理按钮点击');
                    
                    // 选择这个元素，然后处理按钮点击
                    this.selectElement(element);
                    
                    if (element.handleButtonClick) {
                        const buttonClicked = element.handleButtonClick(pos.x, pos.y);
                        if (buttonClicked) {
                            console.log('按钮被点击，不进行拖动');
                            return null;
                        }
                    }
                }
            }
            
            // 如果元素已经被选中，只需要检查是否允许拖动
            if (this.selectedElement && this.selectedElement.id === element.id) {
                console.log('元素已被选中');
            } else {
                // 选择新元素
                this.selectElement(element);
            }
            
            // 如果元素已经确认，不允许拖动
            if (element.confirmed) {
                console.log('元素已确认，不允许拖动');
                return null;
            }
            
            element.startDrag(pos);
            return element;
        }
        
        console.log('没有找到任何元素');
        return null;
    }

    /**
     * 拖动元素
     */
    dragElement(pos) {
        if (this.selectedElement && this.selectedElement.isDragging) {
            this.selectedElement.drag(pos);
            this.designer.renderElementsOnly();
        }
    }

    /**
     * 停止拖动元素
     */
    stopDraggingElement() {
        if (this.selectedElement && this.selectedElement.isDragging) {
            this.selectedElement.stopDrag();
        }
    }

    /**
     * 缩放元素
     */
    scaleElement(scaleFactor, centerX, centerY) {
        if (this.selectedElement) {
            this.selectedElement.scaleAtPoint(scaleFactor, centerX, centerY);
            this.designer.renderElementsOnly();
        }
    }

    /**
     * 旋转元素
     */
    rotateElement(angle) {
        if (this.selectedElement) {
            this.selectedElement.rotate(angle);
            this.designer.renderElementsOnly();
        }
    }

    /**
     * 删除选中元素
     */
    deleteSelectedElement() {
        if (!this.selectedElement) {
            this.designer.showToast('请先选择一个元素');
            return;
        }
        
        const element = this.selectedElement;
        this.elements = this.elements.filter(el => el.id !== element.id);
        this.deselectElement();
        
        this.designer.renderElementsOnly();
        this.designer.updatePreview();
        this.designer.saveState();
        
        this.designer.showToast('元素已删除');
    }

    /**
     * 清空所有元素
     */
    clearAllElements() {
        this.elements = [];
        this.deselectElement();
        
        this.designer.renderElementsOnly();
        this.designer.updatePreview();
        this.designer.saveState();
        
        this.designer.showToast('所有元素已清除');
    }

    /**
     * 将元素置顶
     */
    bringToFront(element) {
        const index = this.elements.indexOf(element);
        if (index !== -1) {
            // 移除元素并重新添加到末尾（最顶层）
            this.elements.splice(index, 1);
            this.elements.push(element);
            
            // 更新Z轴索引
            element.zIndex = this.zIndexCounter++;
        }
    }

    /**
     * 将元素置底
     */
    sendToBack(element) {
        const index = this.elements.indexOf(element);
        if (index !== -1) {
            // 移除元素并重新添加到开头（最底层）
            this.elements.splice(index, 1);
            this.elements.unshift(element);
            
            // 更新Z轴索引
            element.zIndex = 0;
            
            // 调整其他元素的Z轴索引
            this.elements.forEach((el, idx) => {
                if (el !== element) {
                    el.zIndex = idx + 1;
                }
            });
        }
    }

    /**
     * 绘制所有元素
     */
    drawElements() {
        // 按Z轴索引排序（从低到高）
        const sortedElements = [...this.elements].sort((a, b) => a.zIndex - b.zIndex);
        
        sortedElements.forEach(element => {
            element.draw();
        });
    }

    /**
     * 渲染所有元素（兼容renderAllElements调用）
     */
    renderAllElements() {
        this.drawElements();
    }

    /**
     * 获取元素管理器状态
     */
    getState() {
        return {
            elements: this.elements.map(element => element.getState()),
            selectedElementId: this.selectedElement ? this.selectedElement.id : null,
            zIndexCounter: this.zIndexCounter
        };
    }

    /**
     * 设置元素管理器状态（用于恢复状态）
     */
    setState(state) {
        if (state.elements) {
            this.elements = [];
            
            state.elements.forEach(elementState => {
                let element;
                
                if (elementState.type === 'image') {
                    // 恢复图片元素
                    element = new ImageElement(this.designer, elementState);
                } else if (elementState.type === 'text') {
                    // 恢复文本元素
                    element = new TextElement(this.designer, elementState);
                }
                
                if (element) {
                    this.elements.push(element);
                    
                    // 恢复选中状态
                    if (state.selectedElementId === elementState.id) {
                        this.selectElement(element);
                    }
                }
            });
        }
        
        if (state.zIndexCounter) {
            this.zIndexCounter = state.zIndexCounter;
        }
    }

    /**
     * 事件回调 - 元素开始拖动
     */
    onElementDragStart(element) {
        console.log(`开始拖动 ${element.type} 元素`);
    }

    /**
     * 事件回调 - 元素正在拖动
     */
    onElementDrag(element) {
        // 可以在这里实现拖动时的实时效果
    }

    /**
     * 事件回调 - 元素停止拖动
     */
    onElementDragEnd(element) {
        console.log(`停止拖动 ${element.type} 元素`);
    }

    /**
     * 事件回调 - 元素缩放
     */
    onElementScale(element) {
        console.log(`缩放 ${element.type} 元素，缩放比例: ${element.scale}`);
    }

    /**
     * 事件回调 - 元素旋转
     */
    onElementRotate(element) {
        console.log(`旋转 ${element.type} 元素，角度: ${element.rotation}°`);
    }

    /**
     * 事件回调 - 元素删除
     */
    onElementRemove(element) {
        console.log(`删除 ${element.type} 元素`);
    }
}