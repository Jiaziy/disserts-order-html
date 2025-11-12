/**
 * 甜点设计器 - 图片处理模块
 * 负责图片上传、线条提取等图片相关功能
 * 使用新的元素管理架构，统一处理缩放和拖动
 */

class DesignerImages {
    constructor(designer) {
        this.designer = designer;
        this.imageConfirmed = false;
        this.originalImage = null;
        this.buttonPositions = null;
    }

    /**
     * 处理图片上传并自动进行线条提取
     */
    handleImageUpload(file) {
        // 检查是否已选择模板
        if (!this.designer.templates.isTemplateSelected()) {
            alert('请先选择一个模板再上传图片');
            return;
        }
        
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件');
            return;
        }
        
        this.designer.showToast('正在处理图片...');
        
        // 重置图片相关状态
        this.imageConfirmed = false;
        
        // 保存图片上传前的状态到历史记录
        this.designer.saveState();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const img = new Image();
                
                img.onload = () => {
                    // 计算合适的缩放比例
                    const maxWidth = this.designer.canvas.width * 0.8;
                    const maxHeight = this.designer.canvas.height * 0.8;
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
                    
                    // 保存原始图片信息
                    this.originalImage = {
                        img: img,
                        width: width,
                        height: height,
                        originalDataUrl: event.target.result
                    };
                    
                    // 自动进行线条提取
                    this.extractImageEdges(img, width, height).then(processedImage => {
                        // 创建图片元素
                        const imageElement = new ImageElement(this.designer, {
                            img: processedImage,
                            width: width,
                            height: height,
                            x: (this.designer.canvas.width - width) / 2,
                            y: (this.designer.canvas.height - height) / 2,
                            isProcessed: true,
                            originalDataUrl: event.target.result
                        });
                        
                        // 添加到元素管理器
                        this.designer.elements.addElement(imageElement);
                        
                        // 选中新添加的图片元素
                        this.designer.elements.selectElement(imageElement);
                        
                        // 自动切换到图片工具（同步两个工具状态）
                        this.designer.tools.selectTool('image');
                        this.designer.currentTool = 'image';
                        
                        // 设置图片工具为拖拽模式，使用移动光标
                        this.designer.canvas.style.cursor = 'move';
                        
                        // 显示线条编辑控制面板
                        this.showEdgeEditingPanel();
                        
                        this.designer.showToast('线条提取完成！现在可以拖动和缩放图片进行微调');
                        resolve();
                    }).catch(error => {
                        console.error('线条提取失败:', error);
                        this.designer.showToast('图片处理失败，请重试');
                        reject(error);
                    });
                };
                
                img.onerror = () => {
                    alert('图片加载失败，请重试');
                    reject(new Error('Image loading failed'));
                };
                
                img.src = event.target.result;
            };
            
            reader.onerror = () => {
                alert('文件读取失败，请重试');
                reject(new Error('File reading failed'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * 专业的图像边缘检测
     */
    extractImageEdges(img, width, height) {
        return new Promise((resolve, reject) => {
            try {
                // 创建临时画布处理图像
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = width;
                tempCanvas.height = height;
                const tempCtx = tempCanvas.getContext('2d');
                
                // 绘制图像到临时画布
                tempCtx.drawImage(img, 0, 0, width, height);
                
                // 获取图像数据
                const imageData = tempCtx.getImageData(0, 0, width, height);
                
                // 1. 灰度化处理
                const grayData = this.grayscale(imageData);
                
                // 2. 改进的Canny边缘检测
                const edgeData = this.improvedCannyEdgeDetection(grayData, width, height);
                
                // 3. 创建边缘图像
                const edgeImageData = this.createEdgeImage(edgeData, width, height);
                
                // 4. 转换为图片
                tempCtx.putImageData(edgeImageData, 0, 0);
                
                const processedImg = new Image();
                processedImg.onload = () => {
                    resolve(processedImg);
                };
                processedImg.onerror = () => {
                    reject(new Error('处理后的图片加载失败'));
                };
                processedImg.src = tempCanvas.toDataURL();
                
            } catch (error) {
                console.error('边缘检测失败:', error);
                reject(error);
            }
        });
    }

    /**
     * 专业的灰度化处理
     */
    grayscale(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const grayData = new Uint8ClampedArray(width * height);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 使用标准灰度化公式：Gray = 0.299*R + 0.587*G + 0.114*B
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            grayData[i / 4] = gray;
        }
        
        return grayData;
    }

    /**
     * 改进的Canny边缘检测
     */
    improvedCannyEdgeDetection(grayData, width, height, lowThreshold = 20, highThreshold = 60) {
        // 1. 高斯模糊
        const blurredData = this.improvedGaussianBlur(grayData, width, height);
        
        // 2. 计算梯度强度和方向
        const { magnitude, direction } = this.calculateGradient(blurredData, width, height);
        
        // 3. 非极大值抑制
        const suppressed = this.nonMaximumSuppression(magnitude, direction, width, height);
        
        // 4. 双阈值检测和边缘连接
        const edges = this.doubleThreshold(suppressed, width, height, lowThreshold, highThreshold);
        
        return edges;
    }

    /**
     * 改进的高斯模糊算法
     */
    improvedGaussianBlur(grayData, width, height, sigma = 1.4) {
        const kernelSize = 5;
        const kernelRadius = Math.floor(kernelSize / 2);
        const kernel = this.createGaussianKernel(kernelSize, sigma);
        
        const blurredData = new Uint8ClampedArray(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sum = 0;
                let weightSum = 0;
                
                for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
                    for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
                        const pixelX = Math.max(0, Math.min(width - 1, x + kx));
                        const pixelY = Math.max(0, Math.min(height - 1, y + ky));
                        const pixelValue = grayData[pixelY * width + pixelX];
                        const weight = kernel[ky + kernelRadius][kx + kernelRadius];
                        
                        sum += pixelValue * weight;
                        weightSum += weight;
                    }
                }
                
                blurredData[y * width + x] = Math.round(sum / weightSum);
            }
        }
        
        return blurredData;
    }

    /**
     * 创建高斯核
     */
    createGaussianKernel(size, sigma) {
        const kernel = [];
        const radius = Math.floor(size / 2);
        let sum = 0;
        
        for (let y = -radius; y <= radius; y++) {
            const row = [];
            for (let x = -radius; x <= radius; x++) {
                const value = (1 / (2 * Math.PI * sigma * sigma)) * 
                              Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
                row.push(value);
                sum += value;
            }
            kernel.push(row);
        }
        
        // 标准化核
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                kernel[y][x] /= sum;
            }
        }
        
        return kernel;
    }

    /**
     * 计算梯度强度和方向
     */
    calculateGradient(grayData, width, height) {
        const magnitude = new Float32Array(width * height);
        const direction = new Float32Array(width * height);
        
        // Sobel算子
        const sobelX = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        
        const sobelY = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1]
        ];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;
                
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixelValue = grayData[(y + ky) * width + (x + kx)];
                        gx += pixelValue * sobelX[ky + 1][kx + 1];
                        gy += pixelValue * sobelY[ky + 1][kx + 1];
                    }
                }
                
                magnitude[y * width + x] = Math.sqrt(gx * gx + gy * gy);
                direction[y * width + x] = Math.atan2(gy, gx) * 180 / Math.PI;
            }
        }
        
        return { magnitude, direction };
    }

    /**
     * 非极大值抑制
     */
    nonMaximumSuppression(magnitude, direction, width, height) {
        const suppressed = new Float32Array(width * height);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const angle = direction[y * width + x];
                const mag = magnitude[y * width + x];
                
                let q = 255, r = 255;
                
                // 将角度量化到4个方向
                if ((angle >= -22.5 && angle < 22.5) || (angle >= 157.5 || angle < -157.5)) {
                    q = magnitude[y * width + (x + 1)];
                    r = magnitude[y * width + (x - 1)];
                } else if ((angle >= 22.5 && angle < 67.5) || (angle >= -157.5 && angle < -112.5)) {
                    q = magnitude[(y + 1) * width + (x + 1)];
                    r = magnitude[(y - 1) * width + (x - 1)];
                } else if ((angle >= 67.5 && angle < 112.5) || (angle >= -112.5 && angle < -67.5)) {
                    q = magnitude[(y + 1) * width + x];
                    r = magnitude[(y - 1) * width + x];
                } else {
                    q = magnitude[(y + 1) * width + (x - 1)];
                    r = magnitude[(y - 1) * width + (x + 1)];
                }
                
                suppressed[y * width + x] = (mag >= q && mag >= r) ? mag : 0;
            }
        }
        
        return suppressed;
    }

    /**
     * 双阈值检测和边缘连接
     */
    doubleThreshold(suppressed, width, height, lowThreshold, highThreshold) {
        const edges = new Uint8ClampedArray(width * height);
        
        // 强边缘：梯度值大于高阈值
        // 弱边缘：梯度值介于高低阈值之间
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const value = suppressed[y * width + x];
                
                if (value >= highThreshold) {
                    edges[y * width + x] = 255; // 强边缘
                } else if (value >= lowThreshold) {
                    edges[y * width + x] = 128; // 弱边缘
                } else {
                    edges[y * width + x] = 0; // 非边缘
                }
            }
        }
        
        // 连接弱边缘
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (edges[y * width + x] === 128) {
                    // 检查8邻域是否有强边缘
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (edges[(y + dy) * width + (x + dx)] === 255) {
                                edges[y * width + x] = 255;
                                break;
                            }
                        }
                        if (edges[y * width + x] === 255) break;
                    }
                    
                    // 如果没有强边缘连接，则消除弱边缘
                    if (edges[y * width + x] !== 255) {
                        edges[y * width + x] = 0;
                    }
                }
            }
        }
        
        return edges;
    }

    /**
     * 创建边缘图像
     */
    createEdgeImage(edgeData, width, height) {
        const imageData = new ImageData(width, height);
        
        for (let i = 0; i < edgeData.length; i++) {
            const value = edgeData[i];
            const pixelIndex = i * 4;
            
            if (value === 255) {
                // 边缘像素 - 黑色
                imageData.data[pixelIndex] = 0;     // R
                imageData.data[pixelIndex + 1] = 0; // G
                imageData.data[pixelIndex + 2] = 0; // B
                imageData.data[pixelIndex + 3] = 255; // Alpha
            } else {
                // 非边缘像素 - 白色透明
                imageData.data[pixelIndex] = 255;     // R
                imageData.data[pixelIndex + 1] = 255; // G
                imageData.data[pixelIndex + 2] = 255; // B
                imageData.data[pixelIndex + 3] = 0;   // Alpha
            }
        }
        
        return imageData;
    }

    /**
     * 确认图片 - 将图片固定为画布的一部分
     */
    confirmImage() {
        console.log('确认图片，固定到画布');
        
        // 获取当前选中的图片元素
        const selectedElement = this.designer.elements.selectedElement;
        if (!selectedElement || selectedElement.type !== 'image') {
            this.designer.showToast('请先选择一张图片');
            return;
        }
        
        // 设置图片已确认状态
        this.imageConfirmed = true;
        
        // 将图片绘制到背景画布上，使其成为画布的一部分
        if (this.designer.backgroundCtx) {
            this.designer.backgroundCtx.save();
            this.designer.backgroundCtx.drawImage(
                selectedElement.img,
                selectedElement.x,
                selectedElement.y,
                selectedElement.width * selectedElement.scale,
                selectedElement.height * selectedElement.scale
            );
            this.designer.backgroundCtx.restore();
        }
        
        // 从元素管理器中移除图片元素
        this.designer.elements.elements = this.designer.elements.elements.filter(
            element => element.id !== selectedElement.id
        );
        this.designer.elements.deselectElement();
        
        // 仅重新渲染元素层，避免重绘背景
        this.designer.renderElementsOnly();
        
        // 切换回画笔工具并重置鼠标状态
        this.restoreBrushToolAfterElementAction();
        
        // 更新历史记录
        this.designer.saveState();
        
        // 清空上传input的值，允许再次上传新图片
        const uploadInput = document.getElementById('image-upload-input');
        if (uploadInput) {
            uploadInput.value = '';
        }
        
        this.designer.showToast('图片已确认并固定到画布，可以继续使用笔刷');
    }

    /**
     * 取消图片上传
     */
    cancelImage() {
        console.log('取消图片上传');
        
        // 获取当前选中的图片元素
        const selectedElement = this.designer.elements.selectedElement;
        if (!selectedElement || selectedElement.type !== 'image') {
            this.designer.showToast('请先选择一张图片');
            return;
        }
        
        // 从元素管理器中移除图片元素
        this.designer.elements.elements = this.designer.elements.elements.filter(
            element => element.id !== selectedElement.id
        );
        this.designer.elements.deselectElement();
        
        // 仅重新渲染元素层，避免重绘背景
        this.designer.renderElementsOnly();
        
        // 切换回画笔工具并重置鼠标状态
        this.restoreBrushToolAfterElementAction();
        
        // 清空上传input的值，允许再次上传同一张图片
        const uploadInput = document.getElementById('image-upload-input');
        if (uploadInput) {
            uploadInput.value = '';
        }
        
        this.designer.showToast('图片上传已取消，可以继续使用笔刷');
    }

    /**
     * 显示线条编辑控制面板
     */
    showEdgeEditingPanel() {
        // 检查是否已有编辑面板
        let editingPanel = document.getElementById('edge-editing-panel');
        if (editingPanel) {
            editingPanel.remove();
        }
        
        // 创建编辑面板
        editingPanel = document.createElement('div');
        editingPanel.id = 'edge-editing-panel';
        editingPanel.className = 'edge-editing-panel';
        editingPanel.innerHTML = `
            <div class="editing-header">
                <h4><i class="fas fa-paint-brush"></i> 线条编辑</h4>
                <button class="close-btn" onclick="document.getElementById('edge-editing-panel').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="editing-options">
                <div class="option-group">
                    <label>线条颜色：</label>
                    <input type="color" id="line-color" value="#000000">
                </div>
                <div class="option-group">
                    <label>线条粗细：</label>
                    <input type="range" id="line-thickness" min="1" max="10" value="2">
                    <span id="thickness-value">2px</span>
                </div>
                <div class="option-group">
                    <label>线条透明度：</label>
                    <input type="range" id="line-opacity" min="10" max="100" value="100">
                    <span id="opacity-value">100%</span>
                </div>
                <div class="processing-buttons">
                    <button id="reprocess-btn" class="btn-secondary">
                        <i class="fas fa-sync"></i> 重新处理
                    </button>
                    <button id="confirm-btn" class="btn-success">
                        <i class="fas fa-save"></i> 确认使用
                    </button>
                    <button id="cancel-btn" class="btn-danger">
                        <i class="fas fa-times"></i> 取消
                    </button>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(editingPanel);
        
        // 添加事件监听器
        this.setupEdgeEditingEvents();
    }

    /**
     * 设置线条编辑事件监听器
     */
    setupEdgeEditingEvents() {
        // 线条粗细滑块
        const thicknessSlider = document.getElementById('line-thickness');
        const thicknessValue = document.getElementById('thickness-value');
        if (thicknessSlider) {
            thicknessSlider.addEventListener('input', () => {
                thicknessValue.textContent = thicknessSlider.value + 'px';
                this.updateLineStyle();
            });
        }
        
        // 透明度滑块
        const opacitySlider = document.getElementById('line-opacity');
        const opacityValue = document.getElementById('opacity-value');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', () => {
                opacityValue.textContent = opacitySlider.value + '%';
                this.updateLineStyle();
            });
        }
        
        // 颜色选择器
        const colorPicker = document.getElementById('line-color');
        if (colorPicker) {
            colorPicker.addEventListener('input', () => {
                this.updateLineStyle();
            });
        }
        
        // 重新处理按钮
        const reprocessBtn = document.getElementById('reprocess-btn');
        if (reprocessBtn) {
            reprocessBtn.addEventListener('click', () => {
                this.reprocessImage();
            });
        }
        
        // 确认按钮
        const confirmBtn = document.getElementById('confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.confirmImage();
            });
        }
        
        // 取消按钮
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelImage();
            });
        }
    }

    /**
     * 更新线条样式
     */
    updateLineStyle() {
        // 这里可以添加线条样式更新的逻辑
        this.designer.showToast('线条样式已更新');
    }

    /**
     * 重新处理图片
     */
    reprocessImage() {
        if (!this.originalImage) {
            this.designer.showToast('没有原始图片数据');
            return;
        }
        
        this.designer.showToast('正在重新处理图片...');
        
        this.extractImageEdges(
            this.originalImage.img, 
            this.originalImage.width, 
            this.originalImage.height
        ).then(processedImage => {
            // 更新当前选中的图片元素
            const selectedElement = this.designer.elements.selectedElement;
            if (selectedElement && selectedElement.type === 'image') {
                selectedElement.img = processedImage;
                this.designer.renderElementsOnly();
                this.designer.updatePreview();
                this.designer.showToast('重新处理完成！');
            }
        }).catch(error => {
            console.error('重新处理失败:', error);
            this.designer.showToast('重新处理失败，请重试');
        });
    }

    /**
     * 获取图片模块状态
     */
    getImagesState() {
        // 获取当前选中的图片元素
        const selectedElement = this.designer.elements ? this.designer.elements.selectedElement : null;
        let imageElement = null;
        
        if (selectedElement && selectedElement.type === 'image') {
            imageElement = {
                type: selectedElement.type,
                id: selectedElement.id,
                x: selectedElement.x || 0,
                y: selectedElement.y || 0,
                width: selectedElement.width || 0,
                height: selectedElement.height || 0,
                scale: selectedElement.scale || 1,
                rotation: selectedElement.rotation || 0,
                isProcessed: selectedElement.isProcessed || false
            };
        }
        
        return {
            imageConfirmed: this.imageConfirmed,
            originalImage: this.originalImage ? {
                width: this.originalImage.width,
                height: this.originalImage.height
            } : null,
            currentImage: imageElement
        };
    }

    /**
     * 设置图片模块状态
     */
    setImagesState(state) {
        if (!state) return;
        
        // 恢复图片确认状态
        this.imageConfirmed = state.imageConfirmed || false;
        
        // 恢复原始图片信息
        if (state.originalImage) {
            this.originalImage = {
                width: state.originalImage.width,
                height: state.originalImage.height
            };
        }
        
        // 如果有当前图片状态，尝试恢复
        if (state.currentImage && this.designer.elements) {
            // 这里可以实现更复杂的图片状态恢复逻辑
            console.log('恢复图片状态:', state.currentImage);
        }
    }

    /**
     * 恢复笔刷工具状态（元素操作后调用）
     */
    restoreBrushToolAfterElementAction() {
        console.log('正在恢复笔刷工具状态...');
        
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
        
        console.log('笔刷工具状态恢复完成');
    }

    /**
     * 恢复笔刷工具状态（元素操作后调用）
     */
    restoreBrushToolAfterElementAction() {
        console.log('正在恢复笔刷工具状态...');
        
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
        
        console.log('笔刷工具状态恢复完成');
    }

    /**
     * 恢复图片状态（与setImagesState类似，供不同场景使用）
     */
    restoreImageState(imageState) {
        if (!imageState) return;
        
        // 恢复上传的图片状态
        if (imageState.original) {
            // 这里可以恢复原始图片数据
            console.log('恢复原始图片尺寸:', imageState.original.width, imageState.original.height);
        }
        
        if (imageState.processed) {
            // 这里可以恢复处理后的图片数据
            console.log('恢复处理图片尺寸:', imageState.processed.width, imageState.processed.height);
        }
        
        // 恢复位置和变换信息
        if (imageState.position) {
            this.x = imageState.position.x || 0;
            this.y = imageState.position.y || 0;
        }
        
        this.scale = imageState.scale || 1;
        this.rotation = imageState.rotation || 0;
    }
}