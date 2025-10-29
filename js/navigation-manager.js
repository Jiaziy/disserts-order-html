// 统一页面导航管理器
class NavigationManager {
    constructor() {
        this.currentPage = '';
        this.previousPage = '';
        this.isTransitioning = false;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;
        
        // 立即设置当前页面
        this.setCurrentPage();
        this.setupNavigation();
        this.handleBackNavigation();

        // 监听页面卸载
        window.addEventListener('beforeunload', () => {
            this.saveNavigationState();
        });

        // 恢复导航状态
        this.restoreNavigationState();
    }

    // 设置当前页面
    setCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        this.currentPage = page;
        
        // 保存到sessionStorage
        sessionStorage.setItem('currentPage', this.currentPage);
        
        console.log('当前页面:', this.currentPage);
    }

    // 设置导航事件
    setupNavigation() {
        // 统一处理所有导航链接
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-navigate]') || 
                          e.target.closest('[onclick*="window.location"]') ||
                          e.target.closest('[onclick*="navigateTo"]') ||
                          e.target.closest('a[href]');
            
            if (target && !this.isTransitioning) {
                e.preventDefault();
                this.handleNavigation(target);
            }
        });
    }

    // 处理导航
    async handleNavigation(target) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        try {
            // 显示加载状态
            this.showLoading();
            
            let destination = '';
            
            // 解析目标页面
            if (target.hasAttribute('data-navigate')) {
                destination = target.getAttribute('data-navigate');
            } else if (target.hasAttribute('onclick')) {
                const onclick = target.getAttribute('onclick');
                destination = this.parseOnclickNavigation(onclick);
            } else if (target.hasAttribute('href')) {
                destination = target.getAttribute('href');
            }
            
            // 验证目标页面
            if (!this.validateDestination(destination)) {
                throw new Error('无效的导航目标');
            }
            
            // 检查前置条件（如登录状态）
            await this.checkPreconditions(destination);
            
            // 保存当前状态
            this.saveNavigationState();
            
            // 执行导航
            await this.performNavigation(destination);
            
        } catch (error) {
            console.error('导航失败:', error);
            this.handleNavigationError(error);
        } finally {
            this.isTransitioning = false;
            this.hideLoading();
        }
    }

    // 解析onclick导航
    parseOnclickNavigation(onclick) {
        if (onclick.includes('window.location.href')) {
            const match = onclick.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/);
            return match ? match[1] : '';
        } else if (onclick.includes('navigateTo')) {
            const match = onclick.match(/navigateTo\(['"]([^'"]+)['"]\)/);
            return match ? match[1] : '';
        }
        return '';
    }

    // 验证目标页面
    validateDestination(destination) {
        if (!destination) return false;
        
        // 允许的页面列表
        const allowedPages = [
            'index.html', 'main.html', 'sweets-designer.html', 
            'sweets-gallery.html', 'sweets-tutorial.html',
            'customize.html', 'design.html'
        ];
        
        const page = destination.split('?')[0];
        return allowedPages.includes(page) || allowedPages.includes(destination);
    }

    // 检查前置条件
    async checkPreconditions(destination) {
        const requiresLogin = [
            'main.html', 'sweets-designer.html', 'sweets-gallery.html',
            'customize.html', 'design.html'
        ];
        
        const page = destination.split('?')[0];
        
        if (requiresLogin.includes(page)) {
            const isLoggedIn = await this.checkLoginStatus();
            if (!isLoggedIn) {
                // 重定向到登录页
                this.redirectToLogin(destination);
                throw new Error('需要登录');
            }
        }
    }

    // 检查登录状态
    async checkLoginStatus() {
        try {
            // 检查本地存储
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                return true;
            }
            
            // 检查Supabase（如果可用）
            if (typeof document.supabase !== 'undefined') {
                const user = await document.supabase.auth.getCurrentUser();
                return !!user;
            }
            
            return false;
        } catch (error) {
            console.error('检查登录状态失败:', error);
            return false;
        }
    }

    // 重定向到登录页
    redirectToLogin(originalDestination) {
        // 保存原始目标
        sessionStorage.setItem('redirectAfterLogin', originalDestination);
        
        // 显示登录提示
        this.showNotification('请先登录', 'info');
        
        // 延迟跳转以显示提示
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    // 执行导航
    async performNavigation(destination) {
        // 添加过渡效果
        await this.applyTransitionEffect();
        
        // 处理页面内导航（单页应用模式）
        if (this.isSinglePageNavigation(destination)) {
            await this.handleSinglePageNavigation(destination);
        } else {
            // 传统页面跳转
            window.location.href = destination;
        }
    }

    // 检查是否为单页导航
    isSinglePageNavigation(destination) {
        const currentHost = window.location.host;
        const destinationHost = new URL(destination, window.location.href).host;
        
        return currentHost === destinationHost && 
               destination.includes('#') && 
               this.currentPage === 'main.html';
    }

    // 处理单页导航
    async handleSinglePageNavigation(destination) {
        // 在main.html中处理页面切换
        if (typeof navigateToPage === 'function') {
            const page = destination.split('#')[1] || 'home';
            navigateToPage(page);
        } else {
            // 降级处理
            window.location.href = destination;
        }
    }

    // 应用过渡效果
    applyTransitionEffect() {
        return new Promise((resolve) => {
            // 添加淡出效果
            document.body.style.opacity = '0.7';
            document.body.style.transition = 'opacity 0.3s ease';
            
            setTimeout(() => {
                resolve();
            }, 200);
        });
    }

    // 处理返回导航
    handleBackNavigation() {
        window.addEventListener('popstate', (event) => {
            this.restorePreviousState();
        });
    }

    // 恢复之前的状态
    restorePreviousState() {
        const previousPage = sessionStorage.getItem('previousPage');
        const previousState = sessionStorage.getItem('navigationState');
        
        if (previousPage && previousState) {
            try {
                const state = JSON.parse(previousState);
                this.restorePageState(state);
            } catch (error) {
                console.error('恢复状态失败:', error);
            }
        }
    }

    // 保存导航状态
    saveNavigationState() {
        const state = {
            timestamp: Date.now(),
            currentPage: this.currentPage,
            pageData: this.getCurrentPageData()
        };
        
        sessionStorage.setItem('navigationState', JSON.stringify(state));
        sessionStorage.setItem('previousPage', this.currentPage);
    }

    // 恢复导航状态
    restoreNavigationState() {
        const redirect = sessionStorage.getItem('redirectAfterLogin');
        if (redirect && this.currentPage === 'index.html') {
            const isLoggedIn = this.checkLoginStatus();
            if (isLoggedIn) {
                sessionStorage.removeItem('redirectAfterLogin');
                this.navigateTo(redirect);
            }
        }
    }

    // 获取当前页面数据
    getCurrentPageData() {
        const data = {
            scrollPosition: window.scrollY,
            formData: {},
            designState: {}
        };
        
        try {
            // 根据页面类型保存特定数据
            switch (this.currentPage) {
                case 'customize.html':
                    // 保存定制表单数据
                    data.formData = this.getFormData();
                    break;
            }
        } catch (error) {
            console.warn('获取页面数据时出错:', error);
        }
        
        return data;
    }

    // 恢复页面状态
    restorePageState(state) {
        if (state.scrollPosition) {
            window.scrollTo(0, state.scrollPosition);
        }
        
        // 根据页面类型恢复特定数据
        switch (this.currentPage) {
            case 'sweets-designer.html':
                if (typeof window.designer !== 'undefined' && state.designState) {
                    window.designer.restoreState(state.designState);
                }
                break;
            case 'customize.html':
                if (state.formData) {
                    this.restoreFormData(state.formData);
                }
                break;
        }
    }

    // 获取表单数据
    getFormData() {
        const formData = {};
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.name) {
                formData[input.name] = input.value;
            }
        });
        
        return formData;
    }

    // 恢复表单数据
    restoreFormData(formData) {
        Object.keys(formData).forEach(name => {
            const input = document.querySelector(`[name="${name}"]`);
            if (input) {
                input.value = formData[name];
            }
        });
    }

    // 显示加载状态
    showLoading() {
        let loader = document.getElementById('navigation-loader');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'navigation-loader';
            loader.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255,255,255,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                ">
                    <div style="
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        text-align: center;
                    ">
                        <div style="margin-bottom: 10px;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #4CAF50;"></i>
                        </div>
                        <div>加载中...</div>
                    </div>
                </div>
            `;
            document.body.appendChild(loader);
        }
        
        loader.style.display = 'flex';
    }

    // 隐藏加载状态
    hideLoading() {
        const loader = document.getElementById('navigation-loader');
        if (loader) {
            loader.style.display = 'none';
        }
        
        // 恢复页面透明度
        document.body.style.opacity = '1';
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 简单的通知实现
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#ff6b6b' : type === 'success' ? '#51cf66' : '#339af0'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 处理导航错误
    handleNavigationError(error) {
        console.error('导航错误:', error);
        
        let message = '导航失败，请重试';
        
        if (error.message.includes('需要登录')) {
            message = '请先登录';
        } else if (error.message.includes('无效的导航目标')) {
            message = '页面不存在';
        }
        
        this.showNotification(message, 'error');
    }

    // 公共导航方法
    async navigateTo(destination) {
        try {
            if (!destination) {
                throw new Error('导航目标不能为空');
            }
            
            // 直接处理导航，不需要模拟DOM元素
            if (!this.validateDestination(destination)) {
                throw new Error('无效的导航目标');
            }
            
            // 执行导航
            await this.performNavigation(destination);
        } catch (error) {
            console.error('导航失败:', error);
            this.handleNavigationError(error, destination);
        }
    }

    // 返回上一页
    goBack() {
        if (this.previousPage) {
            this.navigateTo(this.previousPage);
        } else {
            window.history.back();
        }
    }
}

// 创建全局导航管理器实例
window.navigationManager = new NavigationManager();

// 立即初始化导航管理器（不等待DOMContentLoaded）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.navigationManager.init();
    });
} else {
    window.navigationManager.init();
}

// 兼容旧版导航函数
window.navigateToPage = function(page) {
    if (window.navigationManager) {
        window.navigationManager.navigateTo(`main.html#${page}`);
    }
};

window.navigateToCustomize = function(type) {
    if (window.navigationManager) {
        window.navigationManager.navigateTo(`customize.html?type=${type}`);
    }
};