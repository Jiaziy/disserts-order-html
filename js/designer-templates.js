/**
 * 甜点设计器 - 模板管理模块
 * 负责模板选择、显示、切换等模板相关功能
 */

class DesignerTemplates {
    constructor(designer) {
        this.designer = designer;
        this.templateSelected = false;
        this.currentTemplateId = null;
        
        // 可用的模板类型
        this.availableTemplates = ['circle', 'square', 'heart'];
    }

    /**
     * 显示巧克力形状模板
     */
    displayChocolateTemplates() {
        // 清空画布并保持透明
        this.designer.ctx.clearRect(0, 0, this.designer.canvas.width, this.designer.canvas.height);
        
        // 重置模板选择状态
        this.templateSelected = false;
        
        // 重置模板按钮状态
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 保存这个状态到历史记录
        this.designer.saveState();
    }

    /**
     * 选择巧克力模板
     */
    selectTemplate(templateType) {
        this.designer.addLog('selectTemplate方法调用，模板类型: ' + templateType);
        
        // 检查模板类型是否有效
        if (!this.availableTemplates.includes(templateType)) {
            this.designer.addLog('无效的模板类型: ' + templateType);
            return;
        }
        
        // 如果点击的是已选中的模板，不执行任何操作
        if (this.currentTemplateId === templateType && this.templateSelected) {
            this.designer.addLog('模板已选中，跳过重新选择');
            return;
        }
        
        // 更新当前模板ID
        this.currentTemplateId = templateType;
        
        // 清空画布并绘制背景
        this.designer.clearCanvas();
        
        // 计算画布中心坐标
        const centerX = this.designer.canvas.width / 2;
        const centerY = this.designer.canvas.height / 2;
        
        // 在背景画布上绘制巧克力模板
        this.drawChocolateShape(centerX, centerY, templateType, true);
        
        // 设置模板选择状态
        this.templateSelected = true;
        
        // 更新按钮状态
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.template-btn[data-template="${templateType}"]`)?.classList.add('active');
        
        // 自动切换到画笔工具
        this.designer.tools.selectTool('brush');
        
        // 更新设计信息
        this.designer.updateDesignInfo();
        
        // 更新预览
        this.designer.updatePreview();
        
        // 保存状态到历史记录
        this.designer.saveState();
        
        this.designer.addLog('模板选择完成: ' + templateType + ', 当前状态: templateSelected=' + this.templateSelected);
    }

    /**
     * 绘制巧克力样式的形状
     */
    drawChocolateShape(x, y, shapeType, asTemplate = false) {
        // 计算适合画布的最大尺寸，保持形状比例
        const maxSize = Math.min(this.designer.canvas.width, this.designer.canvas.height) * 0.6; // 最大为画布的60%
        const size = maxSize;
        
        if (asTemplate) {
            // 在背景画布上绘制模板（不可擦除）
            // 清空背景画布
            this.designer.backgroundCtx.fillStyle = '#ffffff';
            this.designer.backgroundCtx.fillRect(0, 0, this.designer.backgroundCanvas.width, this.designer.backgroundCanvas.height);
            
            // 设置巧克力颜色
            this.designer.backgroundCtx.fillStyle = '#3D2314';
            
            // 绘制基本形状
            switch (shapeType) {
                case 'circle':
                    this.drawCircleOnBackground(x, y, size);
                    break;
                case 'square':
                    this.drawSquareOnBackground(x, y, size);
                    break;
                case 'heart':
                    this.drawHeartOnBackground(x, y, size);
                    break;
            }
            
            // 添加巧克力纹理效果（简单的线条图案）
            this.designer.backgroundCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.designer.backgroundCtx.lineWidth = 2;
            
            // 绘制一些随机的细线条作为纹理
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const startRadius = size * 0.2;
                const endRadius = size * 0.4;
                
                const startX = x + startRadius * Math.cos(angle);
                const startY = y + startRadius * Math.sin(angle);
                const endX = x + endRadius * Math.cos(angle);
                const endY = y + endRadius * Math.sin(angle);
                
                this.designer.backgroundCtx.beginPath();
                this.designer.backgroundCtx.moveTo(startX, startY);
                this.designer.backgroundCtx.lineTo(endX, endY);
                this.designer.backgroundCtx.stroke();
            }
            
            // 添加形状标签到背景画布
            this.designer.backgroundCtx.fillStyle = '#ffffff';
            this.designer.backgroundCtx.font = '16px Arial';
            this.designer.backgroundCtx.textAlign = 'center';
            this.designer.backgroundCtx.fillText(`${this.getShapeName(shapeType)}模板`, x, y + size / 2 + 30);
            
            // 将背景画布内容同步到主画布
            this.designer.ctx.drawImage(this.designer.backgroundCanvas, 0, 0);
        } else {
            // 在主画布上绘制（可擦除）
            this.designer.ctx.fillStyle = '#3D2314';
            
            switch (shapeType) {
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
        }
    }

    /**
     * 在背景画布上绘制圆形
     */
    drawCircleOnBackground(x, y, size) {
        this.designer.backgroundCtx.beginPath();
        this.designer.backgroundCtx.arc(x, y, size / 2, 0, Math.PI * 2);
        this.designer.backgroundCtx.fill();
    }

    /**
     * 在背景画布上绘制方形
     */
    drawSquareOnBackground(x, y, size) {
        this.designer.backgroundCtx.fillRect(x - size / 2, y - size / 2, size, size);
    }

    /**
     * 在背景画布上绘制心形
     */
    drawHeartOnBackground(x, y, size) {
        this.designer.backgroundCtx.beginPath();
        this.designer.backgroundCtx.moveTo(x, y + size / 4);
        this.designer.backgroundCtx.bezierCurveTo(x + size / 2, y - size / 2, x + size, y + size / 4, x, y + size);
        this.designer.backgroundCtx.bezierCurveTo(x - size, y + size / 4, x - size / 2, y - size / 2, x, y + size / 4);
        this.designer.backgroundCtx.fill();
    }

    /**
     * 获取形状名称
     */
    getShapeName(shapeType) {
        switch (shapeType) {
            case 'circle': return '圆形';
            case 'square': return '方形';
            case 'heart': return '心形';
            default: return '未知';
        }
    }

    /**
     * 检查是否已选择模板
     */
    isTemplateSelected() {
        return this.templateSelected;
    }

    /**
     * 获取当前模板ID
     */
    getCurrentTemplate() {
        return this.currentTemplateId;
    }

    /**
     * 重置模板状态
     */
    resetTemplate() {
        this.templateSelected = false;
        this.currentTemplateId = null;
        
        // 重置按钮状态
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    /**
     * 获取模板状态
     */
    getTemplateState() {
        return {
            templateSelected: this.templateSelected,
            currentTemplateId: this.currentTemplateId
        };
    }

    /**
     * 设置模板状态（用于恢复状态）
     */
    setTemplateState(state) {
        if (state.templateSelected !== undefined) this.templateSelected = state.templateSelected;
        if (state.currentTemplateId) this.currentTemplateId = state.currentTemplateId;
        
        // 如果恢复状态时模板已选择，重新渲染模板
        if (this.templateSelected && this.currentTemplateId) {
            this.selectTemplate(this.currentTemplateId);
        }
    }
}