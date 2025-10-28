// 设计页面状态管理
const designState = {
    currentTool: 'brush',
    brushColor: '#FF6B95',
    brushSize: 5,
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    history: [],
    historyIndex: -1,
    designType: 'draw',
    uploadedImage: null
};

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    initDesignPage();
    setupCanvas();
    setupEventListeners();
});

// 初始化设计页面
function initDesignPage() {
    // 从URL参数获取设计类型
    const urlParams = new URLSearchParams(window.location.search);
    const designType = urlParams.get('type') || 'draw';
    
    designState.designType = designType;
    updatePageTitle();
    
    // 根据设计类型显示不同的界面
    if (designType === 'image') {
        showUploadArea();
    } else {
        hideUploadArea();
    }
}

// 更新页面标题
function updatePageTitle() {
    const pageTitle = document.getElementById('page-title');
    const titles = {
        draw: '手绘设计',
        image: '图片导入',
        text: '文字设计'
    };
    
    if (pageTitle) {
        pageTitle.textContent = titles[designState.designType] || '设计界面';
    }
}

// 设置画布
function setupCanvas() {
    const canvas = document.getElementById('design-canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置画布背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 保存初始状态到历史记录
    saveCanvasState();
}

// 设置事件监听器
function setupEventListeners() {
    const canvas = document.getElementById('design-canvas');
    const uploadInput = document.getElementById('image-upload');
    
    // 画布事件
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // 触摸事件支持
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
    
    // 图片上传
    uploadInput.addEventListener('change', handleImageUpload);
    
    // 拖拽上传
    const uploadArea = document.getElementById('upload-area');
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    
    // 键盘事件
    document.addEventListener('keydown', handleKeyDown);
}

// 开始绘图
function startDrawing(e) {
    if (designState.currentTool === 'text') return;
    
    designState.isDrawing = true;
    const canvas = document.getElementById('design-canvas');
    const rect = canvas.getBoundingClientRect();
    
    designState.lastX = (e.clientX || e.touches[0].clientX) - rect.left;
    designState.lastY = (e.clientY || e.touches[0].clientY) - rect.top;
}

// 绘图
function draw(e) {
    if (!designState.isDrawing) return;
    
    const canvas = document.getElementById('design-canvas');
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const currentX = (e.clientX || e.touches[0].clientX) - rect.left;
    const currentY = (e.clientY || e.touches[0].clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(designState.lastX, designState.lastY);
    ctx.lineTo(currentX, currentY);
    
    if (designState.currentTool === 'brush') {
        ctx.strokeStyle = designState.brushColor;
        ctx.lineWidth = designState.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    } else if (designState.currentTool === 'eraser') {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = designState.brushSize * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }
    
    ctx.stroke();
    
    designState.lastX = currentX;
    designState.lastY = currentY;
}

// 停止绘图
function stopDrawing() {
    if (designState.isDrawing) {
        designState.isDrawing = false;
        saveCanvasState();
    }
}

// 触摸事件处理
function handleTouchStart(e) {
    e.preventDefault();
    startDrawing(e);
}

function handleTouchMove(e) {
    e.preventDefault();
    draw(e);
}

// 选择工具
function selectTool(tool) {
    designState.currentTool = tool;
    
    // 更新工具按钮状态
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
    
    // 显示/隐藏文字输入框
    const textInputContainer = document.getElementById('text-input-container');
    if (tool === 'text') {
        textInputContainer.style.display = 'flex';
    } else {
        textInputContainer.style.display = 'none';
    }
}

// 改变颜色
function changeColor(color) {
    designState.brushColor = color;
}

// 改变大小
function changeSize(size) {
    designState.brushSize = parseInt(size);
    document.getElementById('size-value').textContent = size + 'px';
}

// 清空画布
function clearCanvas() {
    if (confirm('确定要清空画布吗？')) {
        const canvas = document.getElementById('design-canvas');
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        saveCanvasState();
    }
}

// 撤销操作
function undoAction() {
    if (designState.historyIndex > 0) {
        designState.historyIndex--;
        restoreCanvasState();
    }
}

// 重做操作
function redoAction() {
    if (designState.historyIndex < designState.history.length - 1) {
        designState.historyIndex++;
        restoreCanvasState();
    }
}

// 保存画布状态
function saveCanvasState() {
    const canvas = document.getElementById('design-canvas');
    const imageData = canvas.toDataURL();
    
    // 移除当前索引之后的历史记录
    designState.history = designState.history.slice(0, designState.historyIndex + 1);
    
    // 添加新状态
    designState.history.push(imageData);
    designState.historyIndex = designState.history.length - 1;
    
    // 限制历史记录数量
    if (designState.history.length > 50) {
        designState.history.shift();
        designState.historyIndex--;
    }
}

// 恢复画布状态
function restoreCanvasState() {
    const canvas = document.getElementById('design-canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    
    img.src = designState.history[designState.historyIndex];
}

// 添加文字到画布
function addTextToCanvas() {
    const textInput = document.getElementById('text-input');
    const text = textInput.value.trim();
    
    if (!text) {
        alert('请输入文字');
        return;
    }
    
    const canvas = document.getElementById('design-canvas');
    const ctx = canvas.getContext('2d');
    
    ctx.font = `bold ${designState.brushSize * 4}px Arial`;
    ctx.fillStyle = designState.brushColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    
    ctx.fillText(text, x, y);
    
    textInput.value = '';
    saveCanvasState();
    
    // 切换回画笔工具
    selectTool('brush');
}

// 取消文字输入
function cancelTextInput() {
    document.getElementById('text-input').value = '';
    selectTool('brush');
}

// 处理图片上传
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        loadImageFile(file);
    }
}

// 加载图片文件
function loadImageFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            drawImageOnCanvas(img);
            designState.uploadedImage = e.target.result;
            hideUploadArea();
        };
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

// 在画布上绘制图片
function drawImageOnCanvas(img) {
    const canvas = document.getElementById('design-canvas');
    const ctx = canvas.getContext('2d');
    
    // 清空画布
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 计算图片尺寸，保持比例
    const maxWidth = canvas.width - 40;
    const maxHeight = canvas.height - 40;
    
    let width = img.width;
    let height = img.height;
    
    if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
    }
    
    if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width = width * ratio;
    }
    
    // 居中绘制图片
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;
    
    ctx.drawImage(img, x, y, width, height);
    saveCanvasState();
}

// 拖拽事件处理
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function handleDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        loadImageFile(files[0]);
    }
}

// 显示上传区域
function showUploadArea() {
    document.getElementById('canvas-overlay').style.display = 'flex';
}

// 隐藏上传区域
function hideUploadArea() {
    document.getElementById('canvas-overlay').style.display = 'none';
}

// 键盘快捷键
function handleKeyDown(e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'z':
                if (e.shiftKey) {
                    redoAction();
                } else {
                    undoAction();
                }
                e.preventDefault();
                break;
            case 'y':
                redoAction();
                e.preventDefault();
                break;
        }
    }
}

// 保存设计
function saveDesign() {
    const canvas = document.getElementById('design-canvas');
    const designImage = canvas.toDataURL('image/png');
    
    // 保存到本地存储，供定制页面使用
    localStorage.setItem('lastDesignImage', designImage);
    localStorage.setItem('lastDesignType', designState.designType);
    
    // 返回定制页面
    window.location.href = 'customize.html';
}

// 返回上一页
function goBack() {
    if (designState.history.length > 1) {
        if (confirm('确定要放弃当前设计吗？')) {
            window.location.href = 'customize.html';
        }
    } else {
        window.location.href = 'customize.html';
    }
}

// 显示提示信息
function showToast(message) {
    if (typeof window.showToast === 'function') {
        window.showToast(message);
    } else {
        alert(message);
    }
}