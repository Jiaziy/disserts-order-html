0// 作品库功能
class SweetsGallery {
    constructor() {
        this.designs = [];
        this.filteredDesigns = [];
        this.currentDesign = null;
        
        this.init();
    }

    init() {
        this.loadDesigns();
        this.setupEventListeners();
        this.renderDesigns();
    }

    loadDesigns() {
        const savedDesigns = localStorage.getItem('sweetsDesigns');
        this.designs = savedDesigns ? JSON.parse(savedDesigns) : [];
        this.filteredDesigns = [...this.designs];
    }

    setupEventListeners() {
        // 搜索功能
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterDesigns();
            });
        }

        // 类型筛选
        const typeFilter = document.getElementById('type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filterDesigns();
            });
        }

        // 排序筛选
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.sortDesigns();
            });
        }

        // 点击模态框外部关闭
        const modal = document.getElementById('design-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    filterDesigns() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();

        // 只显示巧克力类型的设计
        this.filteredDesigns = this.designs.filter(design => {
            const matchesSearch = design.name.toLowerCase().includes(searchTerm);
            const matchesType = design.type === 'chocolate'; // 只筛选巧克力类型
            
            return matchesSearch && matchesType;
        });

        this.sortDesigns();
    }

    sortDesigns() {
        const sortBy = document.getElementById('sort-filter').value;

        this.filteredDesigns.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        this.renderDesigns();
    }

    renderDesigns() {
        const grid = document.getElementById('designs-grid');
        const emptyState = document.getElementById('empty-state');

        if (!grid) return;

        if (this.filteredDesigns.length === 0) {
            grid.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        grid.innerHTML = this.filteredDesigns.map(design => this.createDesignCard(design)).join('');
        
        // 添加卡片事件监听器
        this.attachCardEvents();
    }

    createDesignCard(design) {
        const typeNames = {
            'chocolate': '巧克力'
        };

        const shapeNames = {
            'circle': '圆形',
            'square': '方形',
            'heart': '心形',
            'star': '星形'
        };

        const date = new Date(design.createdAt).toLocaleDateString('zh-CN');

        return `
            <div class="design-card" data-id="${design.id}">
                <div class="design-image">
                    <img src="${design.data}" alt="${design.name}">
                </div>
                <div class="design-info">
                    <div class="design-title">${design.name}</div>
                    <div class="design-meta">
                        <span class="design-type">${typeNames[design.type] || design.type}</span>
                        <span class="design-date">${date}</span>
                    </div>
                    <div class="design-actions">
                        <button class="primary" onclick="event.stopPropagation(); gallery.viewDesign('${design.id}')">
                            <i class="fas fa-eye"></i>查看
                        </button>
                        <button class="secondary" onclick="event.stopPropagation(); gallery.editDesign('${design.id}')">
                            <i class="fas fa-edit"></i>编辑
                        </button>
                        <button class="danger" onclick="event.stopPropagation(); gallery.deleteDesign('${design.id}')">
                            <i class="fas fa-trash"></i>删除
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachCardEvents() {
        const cards = document.querySelectorAll('.design-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const designId = card.getAttribute('data-id');
                    this.viewDesign(designId);
                }
            });
        });
    }

    viewDesign(designId) {
        this.currentDesign = this.designs.find(d => d.id == designId);
        if (!this.currentDesign) return;

        this.showModal();
        this.updateModalContent();
    }

    showModal() {
        const modal = document.getElementById('design-modal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.getElementById('design-modal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
        this.currentDesign = null;
    }

    updateModalContent() {
        if (!this.currentDesign) return;

        const typeNames = {
            'chocolate': '巧克力'
        };

        const shapeNames = {
            'circle': '圆形',
            'square': '方形', 
            'heart': '心形',
            'star': '星形'
        };

        const date = new Date(this.currentDesign.createdAt).toLocaleString('zh-CN');

        document.getElementById('modal-title').textContent = this.currentDesign.name;
        document.getElementById('modal-image').src = this.currentDesign.data;
        document.getElementById('info-name').textContent = this.currentDesign.name;
        document.getElementById('info-type').textContent = typeNames[this.currentDesign.type] || this.currentDesign.type;
        document.getElementById('info-shape').textContent = shapeNames[this.currentDesign.shape] || this.currentDesign.shape;
        document.getElementById('info-date').textContent = date;
    }

    editDesign(designId) {
        const design = this.designs.find(d => d.id == designId);
        if (design) {
            // 将设计数据传递到设计页面
            localStorage.setItem('currentEditDesign', JSON.stringify(design));
            window.location.href = 'sweets-designer.html';
        }
    }

    exportDesign() {
        if (!this.currentDesign) return;

        const link = document.createElement('a');
        link.download = `${this.currentDesign.name}.png`;
        link.href = this.currentDesign.data;
        link.click();
    }

    deleteDesign(designId) {
        if (!confirm('确定要删除这个设计吗？此操作不可撤销。')) {
            return;
        }

        this.designs = this.designs.filter(d => d.id != designId);
        this.filteredDesigns = this.filteredDesigns.filter(d => d.id != designId);
        
        localStorage.setItem('sweetsDesigns', JSON.stringify(this.designs));
        
        if (this.currentDesign && this.currentDesign.id == designId) {
            this.closeModal();
        }
        
        this.renderDesigns();
        
        // 显示删除成功提示
        this.showToast('设计已删除');
    }

    showToast(message) {
        // 创建临时提示元素
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1001;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }

    // 批量操作
    exportAllDesigns() {
        if (this.designs.length === 0) {
            alert('没有可导出的设计');
            return;
        }

        // 创建ZIP文件（简化版：逐个下载）
        this.designs.forEach((design, index) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.download = `${design.name}_${index + 1}.png`;
                link.href = design.data;
                link.click();
            }, index * 100);
        });
    }

    clearAllDesigns() {
        if (this.designs.length === 0) {
            alert('没有可删除的设计');
            return;
        }

        if (!confirm(`确定要删除所有 ${this.designs.length} 个设计吗？此操作不可撤销。`)) {
            return;
        }

        this.designs = [];
        this.filteredDesigns = [];
        localStorage.removeItem('sweetsDesigns');
        this.renderDesigns();
        this.showToast('所有设计已删除');
    }
}

// 全局函数
let gallery;

function initializeGallery() {
    gallery = new SweetsGallery();
}

function closeModal() {
    if (gallery) {
        gallery.closeModal();
    }
}

function editDesign() {
    if (gallery && gallery.currentDesign) {
        gallery.editDesign(gallery.currentDesign.id);
    }
}

function exportDesign() {
    if (gallery) {
        gallery.exportDesign();
    }
}

function deleteDesign() {
    if (gallery && gallery.currentDesign) {
        gallery.deleteDesign(gallery.currentDesign.id);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeGallery);