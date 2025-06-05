// 目录高亮处理
document.addEventListener('DOMContentLoaded', function() {
  // 使用jQuery以确保与其他脚本兼容
  $(function() {
    // 启用调试
    const debug = (msg, obj) => {
      if (window.location.search.includes('debug=toc')) {
        console.log('[TOC]', msg, obj);
      }
    };
    
    // 获取所有目录项
    const $tocItems = $('#article-index li');
    if ($tocItems.length === 0) return;
    
    debug('目录项数量', $tocItems.length);
    
    // 1. 预处理标题文本，用于更好的匹配
    function normalizeText(text) {
      return text.trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '')
        .toLowerCase();
    }
    
    // 2. 创建文章中所有标题的数据
    const headingsData = [];
    $('h1, h2, h3, h4, h5, h6').each(function() {
      const $heading = $(this);
      const id = $heading.attr('id') || '';
      const text = $heading.text();
      const normalizedText = normalizeText(text);
      
      headingsData.push({
        el: $heading,
        id: id,
        text: text,
        normalizedText: normalizedText,
        top: $heading.offset().top - 100 // 偏移量
      });
      
      // 确保所有标题都有ID
      if (!id && text) {
        // 为没有ID的标题创建一个
        const newId = 'heading-' + normalizedText.substr(0, 20).replace(/\s+/g, '-');
        $heading.attr('id', newId);
        headingsData[headingsData.length - 1].id = newId;
      }
    });
    
    // 按位置从上到下排序
    headingsData.sort((a, b) => a.top - b.top);
    debug('标题数据', headingsData);
    
    // 3. 处理目录项，建立映射关系
    const tocData = [];
    $tocItems.each(function(index) {
      const $item = $(this);
      const $link = $item.find('a');
      const href = $link.attr('href') || '';
      const id = href.startsWith('#') ? href.substring(1) : '';
      const text = $link.text().replace(/\s+/g, ' ').trim();
      const normalizedText = normalizeText(text);
      
      tocData.push({
        el: $item,
        id: id,
        text: text,
        normalizedText: normalizedText,
        index: index
      });
    });
    debug('目录项数据', tocData);
    
    // 获取TOC容器
    const $tocContainer = $('#article-index');
    
    // 4. 建立标题与目录项的关联
    function findMatchingTocItem(heading) {
      // 首先通过ID精确匹配
      const idMatch = tocData.find(item => item.id && item.id === heading.id);
      if (idMatch) return idMatch;
      
      // 然后通过文本精确匹配
      const textMatch = tocData.find(item => {
        return item.normalizedText === heading.normalizedText ||
               item.text.includes(heading.text) ||
               heading.text.includes(item.text);
      });
      if (textMatch) return textMatch;
      
      // 最后尝试模糊匹配
      return tocData.find(item => {
        if (item.normalizedText.length < 3 || heading.normalizedText.length < 3) return false;
        
        // 提取中文关键词进行匹配
        const chinesePattern = /[\u4e00-\u9fa5]+/g;
        const itemChinese = item.text.match(chinesePattern) || [];
        const headingChinese = heading.text.match(chinesePattern) || [];
        
        // 如果中文关键词匹配
        for (const itemWord of itemChinese) {
          for (const headingWord of headingChinese) {
            if (itemWord.includes(headingWord) || headingWord.includes(itemWord)) {
              return true;
            }
          }
        }
        
        // 如果文本包含关系明显
        if (item.normalizedText.includes(heading.normalizedText) || 
            heading.normalizedText.includes(item.normalizedText)) {
          return true;
        }
        
        return false;
      });
    }
    
    // 5. 更新高亮
    function updateHighlight() {
      const scrollTop = $(window).scrollTop();
      
      // 找到当前可见的标题
      let currentHeadingIndex = -1;
      for (let i = headingsData.length - 1; i >= 0; i--) {
        if (scrollTop >= headingsData[i].top) {
          currentHeadingIndex = i;
          break;
        }
      }
      
      // 移除所有高亮
      $tocItems.removeClass('active');
      
      // 如果找到了当前标题
      if (currentHeadingIndex >= 0) {
        const currentHeading = headingsData[currentHeadingIndex];
        debug('当前标题', currentHeading);
        
        // 找到对应的目录项
        const matchingTocItem = findMatchingTocItem(currentHeading);
        
        if (matchingTocItem) {
          debug('匹配的目录项', matchingTocItem);
          matchingTocItem.el.addClass('active');
          // 滚动TOC以使活动项可见
          scrollTocToActiveItem(matchingTocItem.el, $tocContainer);
        } else {
          debug('未找到匹配的目录项');
          // 尝试找到最接近的上级标题
          for (let i = currentHeadingIndex - 1; i >= 0; i--) {
            const parentMatch = findMatchingTocItem(headingsData[i]);
            if (parentMatch) {
              parentMatch.el.addClass('active');
              // 滚动TOC以使活动项可见
              scrollTocToActiveItem(parentMatch.el, $tocContainer);
              break;
            }
          }
        }
      } else if (headingsData.length > 0 && scrollTop < headingsData[0].top) {
        // 在第一个标题之前
        const $firstTocItem = $tocItems.first();
        if ($firstTocItem.length) {
          $firstTocItem.addClass('active');
          // 滚动TOC以使活动项可见
          scrollTocToActiveItem($firstTocItem, $tocContainer);
        }
      }
    }
    
    // 6. 滚动TOC容器以使活动项可见
    function scrollTocToActiveItem($activeItem, $container) {
      if (!$activeItem || $activeItem.length === 0 || !$container || $container.length === 0) {
        return;
      }

      // const containerScrollTop = $container.scrollTop(); // 不再直接使用当前的scrollTop进行比较
      const containerHeight = $container.height();
      const activeItemOffsetTop = $activeItem.get(0).offsetTop; // 元素相对于offsetParent的顶部距离
      // const activeItemHeight = $activeItem.outerHeight(); // 暂时不需要activeItemHeight来定位顶部

      // 目标：将activeItem的顶部滚动到容器可见区域的1/3处
      // 如果tocContainer本身不是offsetParent, activeItemOffsetTop可能需要调整
      // 假设 #article-index 是直接的滚动容器并且是li的offsetParent或其滚动上下文正确
      let targetScrollTop = activeItemOffsetTop - (containerHeight / 3);

      // 确保滚动位置不超出边界
      targetScrollTop = Math.max(0, targetScrollTop);
      // $container[0].scrollHeight 是容器内部内容的总高度
      const maxScrollTop = $container[0].scrollHeight - containerHeight;
      targetScrollTop = Math.min(targetScrollTop, maxScrollTop);

      // 只有在计算出的目标位置与当前滚动位置有显著差异时才执行动画，避免不必要的抖动
      if (Math.abs($container.scrollTop() - targetScrollTop) > 5) { // 增加一个小的阈值
        $container.stop().animate({ scrollTop: targetScrollTop }, 150); // 使用stop()来防止动画队列堆积
      }
    }
    
    // 使用节流来优化滚动性能
    let ticking = false;
    $(window).on('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          updateHighlight();
          ticking = false;
        });
        ticking = true;
      }
    });
    
    // 处理目录项点击
    $tocItems.find('a').on('click', function(e) {
      const href = $(this).attr('href');
      if (href && href.startsWith('#')) {
        const targetId = href.substring(1);
        const $target = $('#' + targetId);
        
        if ($target.length) {
          e.preventDefault();
          
          // 平滑滚动
          $('html, body').animate({
            scrollTop: $target.offset().top - 80
          }, 300);
          
          // 更新URL
          if (history.pushState) {
            history.pushState(null, null, href);
          }
          
          // 立即更新高亮
          $tocItems.removeClass('active');
          $(this).closest('li').addClass('active');
          // 点击时也滚动TOC
          scrollTocToActiveItem($(this).closest('li'), $tocContainer);
        }
      }
    });
    
    // 初始高亮
    setTimeout(updateHighlight, 100);
  });
}); 