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
        console.log('selectTemplate方法调用，模板类型: ' + templateType);
        
        // 检查模板类型是否有效
        if (!this.availableTemplates.includes(templateType)) {
            console.log('无效的模板类型: ' + templateType);
            return;
        }
        
        // 如果点击的是已选中的模板，不执行任何操作
        if (this.currentTemplateId === templateType && this.templateSelected) {
            console.log('模板已选中，跳过重新选择');
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
        
        console.log('模板选择完成: ' + templateType + ', 当前状态: templateSelected=' + this.templateSelected);
    }

    /**
     * 绘制巧克力样式的形状
     */
    drawChocolateShape(x, y, shapeType, asTemplate = false) {
        // 计算适合画布的最大尺寸，保持形状比例
        const maxSize = Math.min(this.designer.canvas.width, this.designer.canvas.height) * 0.6; // 最大为画布的60%
        const size = maxSize;
        
        if (asTemplate) {
            // 确保背景画布已创建
            if (!this.designer.renderer.backgroundCanvas || !this.designer.renderer.backgroundCtx) {
                this.designer.renderer.createBackgroundCanvas();
            }
            
            // 在背景画布上绘制模板（不可擦除）
            // 清空背景画布
            this.designer.renderer.backgroundCtx.fillStyle = '#ffffff';
            this.designer.renderer.backgroundCtx.fillRect(0, 0, this.designer.renderer.backgroundCanvas.width, this.designer.renderer.backgroundCanvas.height);
            
            // 创建更精美的巧克力渐变效果
            const gradient = this.designer.renderer.backgroundCtx.createLinearGradient(x - size/2, y - size/2, x + size/2, y + size/2);
            gradient.addColorStop(0, '#8B4513'); // 深棕色
            gradient.addColorStop(0.5, '#A0522D'); // 巧克力色
            gradient.addColorStop(1, '#8B4513'); // 深棕色
            
            this.designer.renderer.backgroundCtx.fillStyle = gradient;
            
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
            
            // 添加更精美的巧克力纹理效果
            this.designer.renderer.backgroundCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            this.designer.renderer.backgroundCtx.lineWidth = 1.5;
            
            // 绘制更精细的纹理图案
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12;
                const startRadius = size * 0.15;
                const endRadius = size * 0.35;
                
                const startX = x + startRadius * Math.cos(angle);
                const startY = y + startRadius * Math.sin(angle);
                const endX = x + endRadius * Math.cos(angle);
                const endY = y + endRadius * Math.sin(angle);
                
                this.designer.renderer.backgroundCtx.beginPath();
                this.designer.renderer.backgroundCtx.moveTo(startX, startY);
                this.designer.renderer.backgroundCtx.lineTo(endX, endY);
                this.designer.renderer.backgroundCtx.stroke();
            }
            
            // 添加随机的斑点效果，模拟巧克力颗粒
            this.designer.renderer.backgroundCtx.fillStyle = 'rgba(100, 40, 0, 0.2)';
            for (let i = 0; i < 15; i++) {
                const spotRadius = Math.random() * size * 0.02 + size * 0.005;
                const spotX = x + (Math.random() - 0.5) * size * 0.3;
                const spotY = y + (Math.random() - 0.5) * size * 0.3;
                
                this.designer.renderer.backgroundCtx.beginPath();
                this.designer.renderer.backgroundCtx.arc(spotX, spotY, spotRadius, 0, Math.PI * 2);
                this.designer.renderer.backgroundCtx.fill();
            }
            
            // 添加形状标签到背景画布
            this.designer.renderer.backgroundCtx.fillStyle = '#ffffff';
            this.designer.renderer.backgroundCtx.font = '16px Arial';
            this.designer.renderer.backgroundCtx.textAlign = 'center';
            this.designer.renderer.backgroundCtx.fillText(`${this.getShapeName(shapeType)}模板`, x, y + size / 2 + 30);
            
            // 将背景画布内容同步到主画布
            this.designer.ctx.drawImage(this.designer.renderer.backgroundCanvas, 0, 0);
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
        const ctx = this.designer.renderer.backgroundCtx;
        
        // 绘制阴影效果
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        // 绘制圆形
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 添加高光效果
        const highlightGradient = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
        highlightGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 恢复填充色
        const gradient = ctx.createLinearGradient(x - size/2, y - size/2, x + size/2, y + size/2);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.5, '#A0522D');
        gradient.addColorStop(1, '#8B4513');
        ctx.fillStyle = gradient;
    }

    /**
     * 在背景画布上绘制方形
     */
    drawSquareOnBackground(x, y, size) {
        const ctx = this.designer.renderer.backgroundCtx;
        const cornerRadius = size * 0.1; // 圆角半径
        
        // 绘制阴影效果
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        // 绘制圆角方形
        ctx.beginPath();
        ctx.moveTo(x - size/2 + cornerRadius, y - size/2);
        ctx.lineTo(x + size/2 - cornerRadius, y - size/2);
        ctx.quadraticCurveTo(x + size/2, y - size/2, x + size/2, y - size/2 + cornerRadius);
        ctx.lineTo(x + size/2, y + size/2 - cornerRadius);
        ctx.quadraticCurveTo(x + size/2, y + size/2, x + size/2 - cornerRadius, y + size/2);
        ctx.lineTo(x - size/2 + cornerRadius, y + size/2);
        ctx.quadraticCurveTo(x - size/2, y + size/2, x - size/2, y + size/2 - cornerRadius);
        ctx.lineTo(x - size/2, y - size/2 + cornerRadius);
        ctx.quadraticCurveTo(x - size/2, y - size/2, x - size/2 + cornerRadius, y - size/2);
        ctx.closePath();
        ctx.fill();
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 添加高光效果
        const highlightGradient = ctx.createLinearGradient(x - size/2, y - size/2, x, y);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = highlightGradient;
        ctx.fill();
        
        // 恢复填充色
        const gradient = ctx.createLinearGradient(x - size/2, y - size/2, x + size/2, y + size/2);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.5, '#A0522D');
        gradient.addColorStop(1, '#8B4513');
        ctx.fillStyle = gradient;
    }

    /**
     * 在背景画布上绘制心形
     */
    drawHeartOnBackground(x, y, size) {
        const ctx = this.designer.renderer.backgroundCtx;
        
        // 绘制阴影效果
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        // 绘制心形（更精确的贝塞尔曲线）
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(x, y + size * 0.25);
        
        // 右半部分心形
        ctx.bezierCurveTo(
            x + size * 0.25, y - size * 0.25, 
            x + size * 0.5, y + size * 0.1, 
            x, y + size * 0.5
        );
        
        // 左半部分心形
        ctx.bezierCurveTo(
            x - size * 0.5, y + size * 0.1, 
            x - size * 0.25, y - size * 0.25, 
            x, y + size * 0.25
        );
        
        ctx.closePath();
        ctx.fill();
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 添加高光效果
        const highlightGradient = ctx.createRadialGradient(x, y - size * 0.1, 0, x, y, size * 0.3);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = highlightGradient;
        ctx.fill();
        
        // 恢复填充色
        const gradient = ctx.createLinearGradient(x - size/2, y - size/2, x + size/2, y + size/2);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.5, '#A0522D');
        gradient.addColorStop(1, '#8B4513');
        ctx.fillStyle = gradient;
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