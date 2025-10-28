// 使用教程页面功能
class SweetsTutorial {
    constructor() {
        this.currentSection = 'intro';
        this.sections = ['intro', 'getting-started', 'tools', 'design', 'preview', 'export'];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateNavigation();
    }

    setupEventListeners() {
        // 教程菜单点击事件
        document.querySelectorAll('.tutorial-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = item.getAttribute('data-tutorial');
                this.switchSection(section);
            });
        });

        // 上一节/下一节按钮
        document.getElementById('prev-btn').addEventListener('click', () => {
            this.previousSection();
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextSection();
        });

        // 键盘导航
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.previousSection();
            } else if (e.key === 'ArrowRight') {
                this.nextSection();
            }
        });

        // 滚动检测
        this.setupScrollDetection();
    }

    switchSection(section) {
        if (!this.sections.includes(section)) return;

        // 更新当前章节
        this.currentSection = section;

        // 更新菜单激活状态
        document.querySelectorAll('.tutorial-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tutorial="${section}"]`).classList.add('active');

        // 更新内容显示
        document.querySelectorAll('.tutorial-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        // 滚动到顶部
        document.querySelector('.tutorial-content').scrollTop = 0;

        // 更新导航按钮状态
        this.updateNavigation();

        // 添加切换动画
        this.animateSectionTransition();
    }

    previousSection() {
        const currentIndex = this.sections.indexOf(this.currentSection);
        if (currentIndex > 0) {
            const prevSection = this.sections[currentIndex - 1];
            this.switchSection(prevSection);
        }
    }

    nextSection() {
        const currentIndex = this.sections.indexOf(this.currentSection);
        if (currentIndex < this.sections.length - 1) {
            const nextSection = this.sections[currentIndex + 1];
            this.switchSection(nextSection);
        }
    }

    updateNavigation() {
        const currentIndex = this.sections.indexOf(this.currentSection);
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        // 更新上一节按钮状态
        if (currentIndex === 0) {
            prevBtn.disabled = true;
            prevBtn.style.opacity = '0.5';
            prevBtn.style.cursor = 'not-allowed';
        } else {
            prevBtn.disabled = false;
            prevBtn.style.opacity = '1';
            prevBtn.style.cursor = 'pointer';
        }

        // 更新下一节按钮状态
        if (currentIndex === this.sections.length - 1) {
            nextBtn.textContent = '完成教程';
            nextBtn.innerHTML = '完成教程 <i class="fas fa-check"></i>';
        } else {
            nextBtn.textContent = '下一节';
            nextBtn.innerHTML = '下一节 <i class="fas fa-chevron-right"></i>';
        }

        // 如果是最后一节，更改下一节按钮行为
        if (currentIndex === this.sections.length - 1) {
            nextBtn.onclick = () => {
                this.completeTutorial();
            };
        } else {
            nextBtn.onclick = () => {
                this.nextSection();
            };
        }
    }

    animateSectionTransition() {
        const currentSection = document.getElementById(this.currentSection);
        
        // 添加淡入动画
        currentSection.style.opacity = '0';
        currentSection.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            currentSection.style.transition = 'all 0.5s ease';
            currentSection.style.opacity = '1';
            currentSection.style.transform = 'translateY(0)';
        }, 50);

        // 移除其他章节的动画
        document.querySelectorAll('.tutorial-section').forEach(section => {
            if (section.id !== this.currentSection) {
                section.style.transition = 'none';
                section.style.opacity = '0';
                section.style.transform = 'translateY(20px)';
            }
        });
    }

    setupScrollDetection() {
        const content = document.querySelector('.tutorial-content');
        
        content.addEventListener('scroll', () => {
            this.highlightCurrentMenu();
        });
    }

    highlightCurrentMenu() {
        const sections = document.querySelectorAll('.tutorial-section');
        const menuItems = document.querySelectorAll('.tutorial-item');
        const content = document.querySelector('.tutorial-content');
        const scrollTop = content.scrollTop;
        const windowHeight = content.clientHeight;

        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollTop >= sectionTop && scrollTop < sectionBottom) {
                currentSection = section.id;
            }
        });

        if (currentSection && currentSection !== this.currentSection) {
            this.currentSection = currentSection;
            
            // 更新菜单激活状态
            menuItems.forEach(item => {
                item.classList.remove('active');
            });
            
            const activeMenuItem = document.querySelector(`[data-tutorial="${currentSection}"]`);
            if (activeMenuItem) {
                activeMenuItem.classList.add('active');
            }
            
            this.updateNavigation();
        }
    }

    completeTutorial() {
        // 显示完成提示
        this.showCompletionMessage();
        
        // 记录教程完成状态
        localStorage.setItem('tutorialCompleted', 'true');
        localStorage.setItem('tutorialCompletionDate', new Date().toISOString());
        
        // 3秒后跳转到设计页面
        setTimeout(() => {
            window.location.href = 'sweets-designer.html';
        }, 3000);
    }

    showCompletionMessage() {
        // 创建完成消息
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
            z-index: 1000;
            max-width: 400px;
            width: 90%;
        `;
        
        message.innerHTML = `
            <div style="margin-bottom: 20px;">
                <i class="fas fa-check-circle" style="font-size: 64px; color: #28a745;"></i>
            </div>
            <h3 style="color: #333; margin-bottom: 15px;">教程完成！</h3>
            <p style="color: #6c757d; margin-bottom: 25px;">您已经掌握了甜点DIY设计平台的基本使用方法</p>
            <button onclick="this.parentElement.remove()" style="
                padding: 10px 20px;
                background: #FF6B95;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            ">开始设计</button>
        `;
        
        document.body.appendChild(message);
        
        // 点击外部关闭
        message.addEventListener('click', (e) => {
            if (e.target === message) {
                message.remove();
            }
        });
    }

    // 进度跟踪
    trackProgress() {
        const progress = {
            intro: true,
            'getting-started': false,
            tools: false,
            design: false,
            preview: false,
            export: false
        };

        // 更新当前章节进度
        progress[this.currentSection] = true;

        // 计算完成百分比
        const completed = Object.values(progress).filter(Boolean).length;
        const total = this.sections.length;
        const percentage = Math.round((completed / total) * 100);

        return {
            completed,
            total,
            percentage,
            progress
        };
    }

    // 显示进度条（可选功能）
    showProgressBar() {
        const progress = this.trackProgress();
        
        // 创建进度条元素
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            height: 4px;
            background: #f0f0f0;
            z-index: 999;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #FF6B95, #FF9F43);
            width: ${progress.percentage}%;
            transition: width 0.3s ease;
        `;
        
        progressBar.appendChild(progressFill);
        document.body.appendChild(progressBar);

        // 更新进度
        const updateProgress = () => {
            const newProgress = this.trackProgress();
            progressFill.style.width = `${newProgress.percentage}%`;
        };

        // 监听章节切换
        const observer = new MutationObserver(updateProgress);
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });

        return progressBar;
    }
}

// 全局函数
let tutorial;

function initializeTutorial() {
    tutorial = new SweetsTutorial();
    
    // 可选：显示进度条
    // tutorial.showProgressBar();
    
    // 检查是否首次访问
    checkFirstVisit();
}

function checkFirstVisit() {
    const hasVisited = localStorage.getItem('hasVisitedTutorial');
    if (!hasVisited) {
        // 首次访问，显示欢迎消息
        showWelcomeMessage();
        localStorage.setItem('hasVisitedTutorial', 'true');
    }
}

function showWelcomeMessage() {
    const welcome = document.createElement('div');
    welcome.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        z-index: 1000;
        max-width: 400px;
        width: 90%;
    `;
    
    welcome.innerHTML = `
        <div style="margin-bottom: 20px;">
            <i class="fas fa-graduation-cap" style="font-size: 48px; color: #FF6B95;"></i>
        </div>
        <h3 style="color: #333; margin-bottom: 15px;">欢迎使用教程</h3>
        <p style="color: #6c757d; margin-bottom: 25px;">本教程将帮助您快速掌握甜点DIY设计平台的使用方法</p>
        <button onclick="this.parentElement.remove()" style="
            padding: 10px 20px;
            background: #FF6B95;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        ">开始学习</button>
    `;
    
    document.body.appendChild(welcome);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeTutorial);