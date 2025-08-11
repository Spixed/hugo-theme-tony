// 移动端菜单功能
class MobileMenu {
  constructor() {
    this.elements = {
      toggle: document.getElementById('mobileMenuToggle'),
      overlay: document.getElementById('mobileMenuOverlay'),
      content: document.getElementById('mobileMenuContent'),
      close: document.getElementById('mobileMenuClose')
    };
    
    this.isOpen = false;
    this.init();
  }

  init() {
    if (!this.elements.toggle || !this.elements.overlay) return;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // 菜单按钮点击 - 支持触摸设备
    this.elements.toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleMenu();
    });

    // 添加触摸事件支持
    this.elements.toggle.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleMenu();
    });

    // 关闭按钮点击
    if (this.elements.close) {
      this.elements.close.addEventListener('click', () => {
        this.closeMenu();
      });

      // 添加触摸事件支持
      this.elements.close.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.closeMenu();
      });
    }

    // 遮罩层点击关闭
    this.elements.overlay.addEventListener('click', (e) => {
      if (e.target === this.elements.overlay) {
        this.closeMenu();
      }
    });

    // 添加触摸事件支持
    this.elements.overlay.addEventListener('touchend', (e) => {
      if (e.target === this.elements.overlay) {
        e.preventDefault();
        this.closeMenu();
      }
    });

    // 菜单内容点击不关闭
    if (this.elements.content) {
      this.elements.content.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeMenu();
      }
    });

    // 窗口大小变化时关闭菜单
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && this.isOpen) {
        this.closeMenu();
      }
    });

    // 目录链接点击后关闭菜单
    const tocLinks = this.elements.content?.querySelectorAll('.mobile-toc a');
    tocLinks?.forEach(link => {
      link.addEventListener('click', () => {
        setTimeout(() => this.closeMenu(), 300); // 延迟关闭，让滚动动画完成
      });
    });
  }

  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.elements.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // 更新菜单按钮图标
    const icon = this.elements.toggle.querySelector('i');
    if (icon) {
      icon.className = 'ri-close-line';
    }
  }

  closeMenu() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.elements.overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // 恢复菜单按钮图标
    const icon = this.elements.toggle.querySelector('i');
    if (icon) {
      icon.className = 'ri-menu-line';
    }
  }
}

// 初始化移动端菜单
document.addEventListener('DOMContentLoaded', () => {
  new MobileMenu();
});
