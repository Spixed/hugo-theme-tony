/**
 * 统一作者选择器
 * 支持PC端和移动端，点击中心头像触发
 */

class UnifiedAuthorSelector {
  constructor() {
    this.currentAuthor = window.currentAuthor || "featured";
    this.authorsData = window.authorsData || {};
    this.isSelecting = false;
    this.isMobile = window.innerWidth <= 768;

    // DOM元素缓存
    this.elements = {
      wrapper: document.getElementById("authorSelectorWrapper"),
      centerTrigger: document.getElementById("centerTrigger"),
      centerAvatarImg: document.getElementById("centerAvatarImg"),
      authorInfoDisplay: document.getElementById("authorInfoDisplay"),
      authorSelector: document.getElementById("authorSelector"),
      authorPolygon: document.getElementById("authorPolygon"),
      mobileOverlay: document.getElementById("mobileOverlay"),
      authorNickname: document.getElementById("authorNickname"),
      authorBio: document.getElementById("authorBio"),
      authorSocial: document.getElementById("authorSocial"),
      closeHint: document.getElementById("closeHint"),
    };

    this.init();
  }

  init() {
    if (!this.elements.wrapper) return;

    this.setupEventListeners();
    this.setupPolygonLayout();
    this.updateAuthorDisplay(this.currentAuthor);
    this.filterArticles(this.currentAuthor);

    // 窗口大小变化时重新布局
    window.addEventListener(
      "resize",
      this.debounce(() => {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;

        if (wasMobile !== this.isMobile) {
          this.setupPolygonLayout();
          if (this.isSelecting) {
            this.hideSelector();
          }
        }
      }, 250),
    );
  }

  setupEventListeners() {
    // 中心头像点击事件 - 支持触摸设备
    if (this.elements.centerTrigger) {
      let touchStarted = false;

      // 触摸开始事件
      this.elements.centerTrigger.addEventListener("touchstart", (e) => {
        touchStarted = true;
        e.stopPropagation();
      }, { passive: true });

      // 触摸结束事件（移动端主要事件）
      this.elements.centerTrigger.addEventListener("touchend", (e) => {
        if (touchStarted) {
          e.preventDefault();
          e.stopPropagation();
          this.toggleSelector();
          touchStarted = false;
        }
      });

      // 点击事件（桌面端）
      this.elements.centerTrigger.addEventListener("click", (e) => {
        if (!touchStarted) { // 避免触摸设备上的重复触发
          e.preventDefault();
          e.stopPropagation();
          this.toggleSelector();
        }
      });
    }

    // 作者头像点击事件 - 支持触摸设备
    if (this.elements.authorPolygon) {
      let avatarTouchStarted = false;

      // 触摸开始事件
      this.elements.authorPolygon.addEventListener("touchstart", (e) => {
        if (e.target.classList.contains("author-avatar")) {
          avatarTouchStarted = true;
          e.stopPropagation();
        }
      }, { passive: true });

      // 触摸结束事件（移动端主要事件）
      this.elements.authorPolygon.addEventListener("touchend", (e) => {
        if (e.target.classList.contains("author-avatar") && avatarTouchStarted) {
          e.preventDefault();
          e.stopPropagation();
          const authorKey = e.target.dataset.author;
          this.selectAuthor(authorKey);
          avatarTouchStarted = false;
        }
      });

      // 点击事件（桌面端）
      this.elements.authorPolygon.addEventListener("click", (e) => {
        if (e.target.classList.contains("author-avatar") && !avatarTouchStarted) {
          e.preventDefault();
          e.stopPropagation();
          const authorKey = e.target.dataset.author;
          this.selectAuthor(authorKey);
        }
      });
    }

    // 点击外部区域关闭选择器
    document.addEventListener("click", (e) => {
      if (this.isSelecting && !this.elements.wrapper.contains(e.target)) {
        this.hideSelector();
      }
    });

    // 移动端遮罩层点击
    if (this.elements.mobileOverlay) {
      this.elements.mobileOverlay.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hideSelector();
      });

      this.elements.mobileOverlay.addEventListener("touchend", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hideSelector();
      });
    }

    // ESC键关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isSelecting) {
        this.hideSelector();
      }
    });
  }

  setupPolygonLayout() {
    if (!this.elements.authorPolygon) return;

    const avatars =
      this.elements.authorPolygon.querySelectorAll(".author-avatar");
    const totalAuthors = avatars.length;

    if (totalAuthors === 0) return;

    // 固定半径，确保围绕中心布局
    const radius = this.isMobile ? 90 : 110;

    // 容器尺寸固定，与CSS保持一致
    const containerWidth = this.isMobile ? 200 : 280;
    const containerHeight = this.isMobile ? 200 : 280;

    // 中心点就是容器的中心
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    // 头像尺寸（与CSS保持一致）
    const avatarSize = this.isMobile ? 60 : 50;
    const halfAvatarSize = avatarSize / 2;

    // 计算每个头像的位置
    avatars.forEach((avatar, index) => {
      // 从顶部开始，顺时针排列
      const angle = (index * 2 * Math.PI) / totalAuthors - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle) - halfAvatarSize;
      const y = centerY + radius * Math.sin(angle) - halfAvatarSize;

      avatar.style.left = `${x}px`;
      avatar.style.top = `${y}px`;

      // 更新选中状态
      avatar.classList.toggle(
        "selected",
        avatar.dataset.author === this.currentAuthor,
      );
    });
  }

  toggleSelector() {
    if (this.isSelecting) {
      this.hideSelector();
    } else {
      this.showSelector();
    }
  }

  showSelector() {
    if (this.isSelecting) return;

    this.isSelecting = true;

    // 隐藏作者信息
    if (this.elements.authorInfoDisplay) {
      this.elements.authorInfoDisplay.style.opacity = "0";
      this.elements.authorInfoDisplay.style.visibility = "hidden";
    }

    // 显示选择器
    if (this.elements.authorSelector) {
      this.elements.authorSelector.classList.add("active");
    }

    // 移动端显示遮罩
    if (this.isMobile && this.elements.mobileOverlay) {
      this.elements.mobileOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    // 更新中心头像样式
    if (this.elements.centerAvatarImg) {
      this.elements.centerAvatarImg.classList.add("selecting");
    }

    // 显示提示
    if (this.elements.closeHint) {
      this.elements.closeHint.style.opacity = "1";
    }
  }

  hideSelector() {
    if (!this.isSelecting) return;

    this.isSelecting = false;

    // 隐藏选择器
    if (this.elements.authorSelector) {
      this.elements.authorSelector.classList.remove("active");
    }

    // 显示作者信息
    if (this.elements.authorInfoDisplay) {
      this.elements.authorInfoDisplay.style.opacity = "1";
      this.elements.authorInfoDisplay.style.visibility = "visible";
    }

    // 移动端隐藏遮罩
    if (this.elements.mobileOverlay) {
      this.elements.mobileOverlay.classList.remove("active");
      document.body.style.overflow = "";
    }

    // 恢复中心头像样式
    if (this.elements.centerAvatarImg) {
      this.elements.centerAvatarImg.classList.remove("selecting");
    }

    // 隐藏提示
    if (this.elements.closeHint) {
      this.elements.closeHint.style.opacity = "0";
    }
  }

  selectAuthor(authorKey) {
    if (authorKey === this.currentAuthor) {
      this.hideSelector();
      return;
    }

    this.currentAuthor = authorKey;
    window.currentAuthor = authorKey;

    // 更新显示
    this.updateAuthorDisplay(authorKey);
    this.updateSelectedState();
    this.filterArticles(authorKey);

    // 关闭选择器
    this.hideSelector();
  }

  updateAuthorDisplay(authorKey) {
    if (authorKey === "featured") {
      this.updateFeaturedDisplay();
    } else {
      this.updateAuthorInfo(authorKey);
    }
  }

  updateFeaturedDisplay() {
    if (this.elements.centerAvatarImg) {
      this.elements.centerAvatarImg.src = "/site/logo.png";
      this.elements.centerAvatarImg.alt = "精选文章";
    }

    if (this.elements.authorNickname) {
      this.elements.authorNickname.textContent = "精选文章";
    }

    if (this.elements.authorBio) {
      this.elements.authorBio.textContent = "精心挑选的优质内容";
    }

    if (this.elements.authorSocial) {
      this.elements.authorSocial.innerHTML = "";
    }
  }

  updateAuthorInfo(authorKey) {
    const author = this.authorsData[authorKey];
    if (!author) return;

    if (this.elements.centerAvatarImg) {
      this.elements.centerAvatarImg.src = author.avatar;
      this.elements.centerAvatarImg.alt = author.name;
    }

    if (this.elements.authorNickname) {
      this.elements.authorNickname.textContent = author.nickname;
    }

    if (this.elements.authorBio) {
      this.elements.authorBio.textContent = author.bio;
    }

    if (this.elements.authorSocial) {
      let socialHTML = "";

      if (author.github) {
        socialHTML += `<a href="${author.github}" target="_blank" rel="noopener" title="GitHub" aria-label="${author.name}的GitHub"><i class="ri-github-line"></i></a>`;
      }

      if (author.email) {
        socialHTML += `<a href="mailto:${author.email}" title="Email" aria-label="发送邮件给${author.name}"><i class="ri-mail-line"></i></a>`;
      }

      if (author.website) {
        socialHTML += `<a href="${author.website}" target="_blank" rel="noopener" title="Website" aria-label="${author.name}的网站"><i class="ri-global-line"></i></a>`;
      }

      // 为spixed作者添加About页面链接
      if (authorKey === "spixed") {
        socialHTML += `<a href="/about" title="关于" aria-label="关于${author.name}"><i class="ri-user-line"></i></a>`;
      }

      this.elements.authorSocial.innerHTML = socialHTML;
    }
  }

  updateSelectedState() {
    const avatars =
      this.elements.authorPolygon?.querySelectorAll(".author-avatar");
    if (!avatars) return;

    avatars.forEach((avatar) => {
      avatar.classList.toggle(
        "selected",
        avatar.dataset.author === this.currentAuthor,
      );
    });
  }

  filterArticles(authorKey) {
    const articleItems = document.querySelectorAll(".article-list-item");
    const noArticles = document.getElementById("noArticles");
    const articleList = document.querySelector(".article-list");
    let visibleCount = 0;

    // 添加淡出动画
    if (articleList) {
      articleList.style.opacity = "0.3";
      articleList.style.transform = "translateY(10px)";
      articleList.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    }

    // 延迟执行过滤，让淡出动画完成
    setTimeout(() => {
      articleItems.forEach((item) => {
        const itemAuthor = item.dataset.author;
        const itemFeatured = item.dataset.featured === "true";

        let shouldShow = false;

        if (authorKey === "featured") {
          shouldShow = itemFeatured;
        } else {
          shouldShow = itemAuthor === authorKey;
        }

        if (shouldShow) {
          item.classList.remove("hidden");
          item.style.display = "";
          visibleCount++;

          // 重置位置，防止位移
          item.style.transform = "translateY(0)";
          item.style.opacity = "1";
        } else {
          item.classList.add("hidden");
          item.style.display = "none";
        }
      });

      // 显示/隐藏无文章提示
      if (noArticles) {
        noArticles.style.display = visibleCount === 0 ? "block" : "none";
      }

      // 添加淡入动画
      if (articleList) {
        setTimeout(() => {
          articleList.style.opacity = "1";
          articleList.style.transform = "translateY(0)";
        }, 50);
      }
    }, 150);
  }

  // 工具函数：防抖
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", () => {
  window.authorSelector = new UnifiedAuthorSelector();
});

// 导出以便其他模块使用
if (typeof module !== "undefined" && module.exports) {
  module.exports = UnifiedAuthorSelector;
}
