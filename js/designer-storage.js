/**
 * 甜点设计器 - 存储管理模块
 * 负责历史记录、状态保存、本地存储等数据管理功能
 */

class DesignerStorage {
    constructor(designer) {
        this.designer = designer;
        this.history = [];
        this.currentStep = -1;
        this.maxHistorySteps = 50; // 最大历史记录步数
    }

    /**
     * 保存当前状态到历史记录
     */
    saveState(state = 'user-action') {
        // 如果当前不是最新状态，删除后续的历史记录
        if (this.currentStep < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentStep + 1);
        }

        // 限制历史记录数量
        if (this.history.length >= this.maxHistorySteps) {
            this.history.shift(); // 删除最旧的历史记录
        }

        // 保存画布状态
        const canvasData = this.designer.renderer.getCanvasData();
        const backgroundCanvasData = this.designer.renderer.getBackgroundCanvasData();
        
        // 收集所有模块的状态
        const fullState = {
            timestamp: new Date().toISOString(),
            state: state,
            canvasData: canvasData,
            backgroundCanvasData: backgroundCanvasData,
            templateSelected: this.designer.templates.isTemplateSelected(),
            currentTemplateId: this.designer.templates.getCurrentTemplate(),
            currentTool: this.designer.currentTool,
            tools: this.designer.tools.getToolState(),
            text: this.designer.text.getTextState(),
            images: this.designer.images.getImagesState(),
            renderer: this.designer.renderer.getRendererState()
        };

        // 添加到历史记录
        this.history.push(fullState);
        this.currentStep = this.history.length - 1;

        console.log('状态已保存，历史记录步数:', this.history.length, '当前步:', this.currentStep);
    }

    /**
     * 恢复状态到指定历史记录
     */
    restoreState(step) {
        if (step < 0 || step >= this.history.length) {
            console.error('无效的历史记录步骤:', step);
            return;
        }

        const state = this.history[step];
        
        try {
            // 恢复背景画布
            if (state.backgroundCanvasData) {
                this.designer.renderer.setBackgroundCanvas(state.backgroundCanvasData);
            }
            
            // 恢复模板状态
            if (state.templateSelected && state.currentTemplateId) {
                this.designer.templates.selectTemplate(state.currentTemplateId);
            }
            
            // 恢复工具状态
            if (state.tools) {
                this.designer.tools.setToolsState(state.tools);
            }
            
            // 恢复文本状态
            if (state.text) {
                this.designer.text.setTextState(state.text);
            }
            
            // 恢复图片状态
            if (state.images) {
                this.designer.images.setImagesState(state.images);
            }
            
            // 恢复渲染器状态
            if (state.renderer) {
                this.designer.renderer.setRendererState(state.renderer);
            }
            
            // 恢复当前工具
            if (state.currentTool) {
                this.designer.setCurrentTool(state.currentTool);
            }
            
            // 更新当前步骤
            this.currentStep = step;
            
            // 仅重新渲染元素层，避免重绘背景
            this.designer.renderElementsOnly();
            
            // 更新预览
            this.designer.updatePreview();
            
            console.log('状态已恢复到步骤:', step);
            
        } catch (error) {
            console.error('恢复状态失败:', error);
            this.designer.showToast('恢复状态失败，请重试');
        }
    }

    /**
     * 撤销操作
     */
    undo() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.restoreState(this.currentStep);
            this.designer.showToast('撤销操作');
        } else {
            this.designer.showToast('已经是第一步，无法撤销');
        }
    }

    /**
     * 重做操作
     */
    redo() {
        if (this.currentStep < this.history.length - 1) {
            this.currentStep++;
            this.restoreState(this.currentStep);
            this.designer.showToast('重做操作');
        } else {
            this.designer.showToast('已经是最新状态，无法重做');
        }
    }

    /**
     * 获取当前设计状态
     */
    getDesignState() {
        return {
            timestamp: new Date().toISOString(),
            templateSelected: this.designer.templates.isTemplateSelected(),
            currentTemplateId: this.designer.templates.getCurrentTemplate(),
            currentTool: this.designer.currentTool,
            textElements: this.designer.text.textElements,
            uploadedImage: this.designer.uploadedImage ? {
                original: this.designer.uploadedImage.original ? {
                    width: this.designer.uploadedImage.original.width,
                    height: this.designer.uploadedImage.original.height
                } : null,
                processed: this.designer.uploadedImage.processed ? {
                    width: this.designer.uploadedImage.processed.width,
                    height: this.designer.uploadedImage.processed.height
                } : null,
                position: {
                    x: this.designer.uploadedImage.x || 0,
                    y: this.designer.uploadedImage.y || 0
                },
                scale: this.designer.uploadedImage.scale || 1,
                rotation: this.designer.uploadedImage.rotation || 0
            } : null,
            imageConfirmed: this.designer.imageConfirmed,
            canvasData: this.designer.renderer.getCanvasData(),
            backgroundCanvasData: this.designer.renderer.getBackgroundCanvasData()
        };
    }

    /**
     * 保存设计到本地存储
     */
    saveDesignToLocal(name = '') {
        // 检查是否有设计内容
        const context = this.designer.canvas.getContext('2d');
        const imageData = context.getImageData(0, 0, this.designer.canvas.width, this.designer.canvas.height).data;
        let isEmpty = true;
        
        for (let i = 0; i < imageData.length; i += 4) {
            // 检查是否有非透明像素（α通道大于0）或非白色像素
            if (imageData[i + 3] > 0 || 
                !(imageData[i] === 255 && imageData[i + 1] === 255 && imageData[i + 2] === 255)) {
                isEmpty = false;
                break;
            }
        }
        
        if (isEmpty) {
            this.designer.showToast('请先在画布上创建设计！');
            return null;
        }
        
        if (!name) {
            // 尝试获取设计名称
            const designNameElement = document.getElementById('design-name');
            name = designNameElement ? designNameElement.value.trim() : '';
            
            if (!name) {
                name = 'design_' + new Date().toISOString().replace(/[:.]/g, '-');
            }
        }
        
        try {
            const designState = this.getDesignState();
            
            // 获取所有设计的数据
            const saveData = {
                name: name,
                timestamp: designState.timestamp,
                state: designState
            };
            
            // 保存到本地存储
            localStorage.setItem(`sweets_design_${name}`, JSON.stringify(saveData));
            
            // 更新保存的设计列表
            this.updateSavedDesignsList(name);
            
            this.designer.showToast('设计已保存到本地');
            
            return saveData;
            
        } catch (error) {
            console.error('保存设计失败:', error);
            this.designer.showToast('保存设计失败');
            return null;
        }
    }

    /**
     * 从本地存储加载设计
     */
    loadDesignFromLocal(name) {
        try {
            const savedData = localStorage.getItem(`sweets_design_${name}`);
            if (!savedData) {
                this.designer.showToast('未找到保存的设计');
                return null;
            }
            
            const designData = JSON.parse(savedData);
            
            // 重置设计器状态
            this.designer.reset();
            
            // 恢复模板状态
            if (designData.state.templateSelected && designData.state.currentTemplateId) {
                this.designer.templates.selectTemplate(designData.state.currentTemplateId);
            }
            
            // 恢复文本元素
            if (designData.state.textElements) {
                this.designer.text.textElements = designData.state.textElements;
            }
            
            // 恢复图片状态
            if (designData.state.uploadedImage) {
                this.designer.images.restoreImageState(designData.state.uploadedImage);
            }
            
            // 恢复背景画布
            if (designData.state.backgroundCanvasData) {
                this.designer.renderer.setBackgroundCanvas(designData.state.backgroundCanvasData);
            }
            
            // 设置图片确认状态
            this.designer.imageConfirmed = designData.state.imageConfirmed || false;
            
            // 清空历史记录
            this.history = [];
            this.currentStep = -1;
            
            // 仅重新渲染元素层，避免重绘背景
            this.designer.renderElementsOnly();
            
            // 更新预览
            this.designer.updatePreview();
            
            // 保存当前状态到历史记录
            this.saveState('load-design');
            
            this.designer.showToast('设计已加载');
            
            return designData;
            
        } catch (error) {
            console.error('加载设计失败:', error);
            this.designer.showToast('加载设计失败');
            return null;
        }
    }

    /**
     * 获取所有保存的设计列表
     */
    getSavedDesigns() {
        const designs = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sweets_design_')) {
                try {
                    const designData = JSON.parse(localStorage.getItem(key));
                    designs.push({
                        name: key.replace('sweets_design_', ''),
                        timestamp: designData.timestamp,
                        preview: designData.state.canvasData
                    });
                } catch (error) {
                    console.warn('解析设计数据失败:', key, error);
                }
            }
        }
        
        // 按时间排序（最新的在前）
        designs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return designs;
    }

    /**
     * 删除保存的设计
     */
    deleteSavedDesign(name) {
        try {
            localStorage.removeItem(`sweets_design_${name}`);
            this.updateSavedDesignsList();
            this.designer.showToast('设计已删除');
            return true;
        } catch (error) {
            console.error('删除设计失败:', error);
            this.designer.showToast('删除设计失败');
            return false;
        }
    }

    /**
     * 更新保存的设计列表显示
     */
    updateSavedDesignsList(highlightName = '') {
        // 在实际应用中，这里可以更新UI显示保存的设计列表
        // 例如：更新下拉菜单、网格视图等
        console.log('保存的设计列表已更新');
    }

    /**
     * 导出设计数据
     */
    exportDesign(format = 'json') {
        const designState = this.getDesignState();
        
        switch (format) {
            case 'json':
                return JSON.stringify(designState, null, 2);
            case 'base64':
                return btoa(JSON.stringify(designState));
            default:
                return JSON.stringify(designState);
        }
    }

    /**
     * 导入设计数据
     */
    importDesign(data, format = 'json') {
        try {
            let designState;
            
            switch (format) {
                case 'json':
                    designState = JSON.parse(data);
                    break;
                case 'base64':
                    designState = JSON.parse(atob(data));
                    break;
                default:
                    throw new Error('不支持的格式');
            }
            
            // 这里可以实现导入逻辑
            // 注意：导入需要验证数据格式和安全性
            
            this.designer.showToast('设计数据已导入');
            return designState;
            
        } catch (error) {
            console.error('导入设计数据失败:', error);
            this.designer.showToast('导入设计数据失败');
            return null;
        }
    }

    /**
     * 清理历史记录
     */
    clearHistory() {
        this.history = [];
        this.currentStep = -1;
        console.log('历史记录已清空');
    }

    /**
     * 获取存储状态
     */
    getStorageState() {
        return {
            historyLength: this.history.length,
            currentStep: this.currentStep,
            maxHistorySteps: this.maxHistorySteps
        };
    }

    /**
     * 设置存储状态（用于恢复状态）
     */
    setStorageState(state) {
        // 历史记录和当前步骤在恢复状态时应该从状态数据中获取
        // 这里主要用于设置配置参数
        if (state.maxHistorySteps) {
            this.maxHistorySteps = state.maxHistorySteps;
        }
    }
}