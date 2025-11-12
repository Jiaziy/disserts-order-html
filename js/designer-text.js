/**
 * 甜点设计器 - 文本管理模块
 * 负责文本添加、编辑等文本相关功能
 * 使用新的元素管理架构，统一处理缩放和拖动
 */

class DesignerText {
    constructor(designer) {
        this.designer = designer;
    }

    /**
     * 添加文本元素
     */
    addText(text = '') {
        if (!text) {
            // 如果没有提供文本，尝试从输入框获取
            const textInput = document.getElementById('text-input');
            if (textInput) {
                text = textInput.value.trim();
            }
        }
        
        if (!text) {
            this.designer.showToast('请输入文本内容');
            return null;
        }
        
        // 确保模板已选择
        if (!this.designer.templates.isTemplateSelected()) {
            this.designer.showToast('请先选择模板再添加文本');
            return null;
        }
        
        // 创建文本元素
        const textElement = new TextElement(this.designer, {
            text: text,
            x: this.designer.canvas.width / 2,
            y: this.designer.canvas.height / 2,
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#3D2314'
        });
        
        // 添加到元素管理器
        this.designer.elements.addElement(textElement);
        
        // 选中新添加的文本元素
        this.designer.elements.selectElement(textElement);
        
        // 切换到文本工具（同步两个工具状态）
        this.designer.tools.selectTool('text');
        this.designer.currentTool = 'text';
        
        // 清空输入框
        const textInput = document.getElementById('text-input');
        if (textInput) {
            textInput.value = '';
        }
        
        this.designer.showToast('文本已添加');
        
        return textElement;
    }

    /**
     * 处理文本元素的鼠标滚轮缩放
     */
    handleTextWheel(e) {
        // 使用元素管理器统一处理缩放
        const selectedElement = this.designer.elements.selectedElement;
        if (selectedElement && selectedElement.type === 'text') {
            e.preventDefault();
            
            // 计算鼠标在画布上的坐标
            const rect = this.designer.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // 检查鼠标是否在选中的文本元素范围内
            if (selectedElement.isPointInElement(mouseX, mouseY)) {
                // 计算缩放方向和缩放因子
                const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
                
                // 使用元素管理器的缩放方法
                this.designer.elements.scaleElement(zoomFactor, mouseX, mouseY);
                
                console.log('文本缩放:', selectedElement.scale);
            }
        }
    }

    /**
     * 删除选中的文本元素
     */
    deleteSelectedText() {
        const selectedElement = this.designer.elements.selectedElement;
        if (!selectedElement || selectedElement.type !== 'text') {
            this.designer.showToast('请先选择一个文本元素');
            return;
        }
        
        this.designer.elements.deleteSelectedElement();
        
        // 文本删除后恢复笔刷工具
        this.restoreBrushToolAfterTextAction();
        
        this.designer.showToast('文本已删除，可以继续使用笔刷');
    }

    /**
     * 清空所有文本元素
     */
    clearAllText() {
        // 检查元素管理器是否已初始化
        if (!this.designer.elements || !this.designer.elements.getElementsByType) {
            console.warn('元素管理器未初始化');
            return;
        }
        
        // 过滤出文本元素并删除
        const textElements = this.designer.elements.getElementsByType('text');
        this.designer.elements.elements = this.designer.elements.elements.filter(
            element => element.type !== 'text'
        );
        
        // 如果选中的是文本元素，取消选择
        if (this.designer.elements.selectedElement && 
            this.designer.elements.selectedElement.type === 'text') {
            this.designer.elements.deselectElement();
        }
        
        this.designer.renderElementsOnly();
        this.designer.updatePreview();
        this.designer.saveState();
        
        this.designer.showToast('所有文本已清除');
    }

    /**
     * 获取文本状态
     */
    getTextState() {
        // 检查元素管理器是否已初始化
        if (!this.designer.elements || !this.designer.elements.getElementsByType) {
            console.warn('元素管理器未初始化');
            return {
                textElements: [],
                selectedTextElement: null
            };
        }
        
        const textElements = this.designer.elements.getElementsByType('text');
        return {
            textElements: textElements,
            selectedTextElement: this.designer.elements.selectedElement && 
                                this.designer.elements.selectedElement.type === 'text' ? 
                                this.designer.elements.selectedElement : null
        };
    }

    /**
     * 设置文本状态（用于恢复状态）
     */
    setTextState(state) {
        // 文本元素会通过元素管理器统一恢复
        // 这里只需要处理特定的文本相关状态
        if (state.selectedTextElement) {
            const element = this.designer.elements.getElementById(state.selectedTextElement.id);
            if (element && element.type === 'text') {
                this.designer.elements.selectElement(element);
            }
        }
    }

    /**
     * 恢复笔刷工具状态（文本操作后调用）
     */
    restoreBrushToolAfterTextAction() {
        console.log('正在恢复笔刷工具状态（文本操作后）...');
        
        // 1. 切换回画笔工具
        this.designer.tools.selectTool('brush');
        
        // 2. 重置鼠标状态
        if (this.designer.events) {
            this.designer.events.isMouseDown = false;
            this.designer.events.lastMousePos = { x: 0, y: 0 };
        }
        
        // 3. 重置拖动状态
        this.designer.isDragging = false;
        this.designer.isDraggingText = false;
        
        // 4. 重置当前工具状态
        this.designer.currentTool = 'brush';
        
        // 5. 更新光标样式为画笔
        if (this.designer.canvas) {
            this.designer.canvas.style.cursor = 'crosshair';
        }
        
        // 6. 强制刷新画布状态，确保鼠标事件能正确响应
        setTimeout(() => {
            if (this.designer.canvas) {
                // 触发一个小的鼠标移动事件来更新光标状态
                const event = new MouseEvent('mousemove', {
                    clientX: 0,
                    clientY: 0
                });
                this.designer.canvas.dispatchEvent(event);
            }
        }, 10);
        
        console.log('笔刷工具状态恢复完成（文本操作后）');
    }
}