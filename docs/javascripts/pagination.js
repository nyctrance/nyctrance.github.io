/**
 * TOC-Driven Heading & Phase Reader
 * For nyctrance.github.io workshop outlines and class notes
 *
 * - Vertical scrolling (↑, ↓, Space, Shift+Space) is 100% native for micro-adjustments and continuous reading.
 * - Discrete heading/phase jumping uses horizontal arrows (→, ←), vim keys (j, k), and brackets (], [).
 * - Navigates directly via the Table of Contents (TOC) hierarchy as the single source of truth.
 */

(function () {
  'use strict';

  function initTOCReader() {
    // Only activate on pages marked with data-pagination
    const container = document.querySelector('[data-pagination="true"]');
    if (!container) return;

    // 1. Get all top-level cards and inject right-floated badges on card headers
    const cards = Array.from(document.querySelectorAll('.md-typeset .admonition.ccard.h2'));
    const totalCards = cards.length;

    cards.forEach((card, index) => {
      const titleElem = card.querySelector('.admonition-title');
      if (titleElem && !titleElem.querySelector('.card-pagination-badge')) {
        const badge = document.createElement('span');
        badge.className = 'card-pagination-badge';
        const currentNum = String(index + 1).padStart(2, '0');
        const totalNum = String(totalCards).padStart(2, '0');
        badge.textContent = `${currentNum} / ${totalNum}`;
        badge.setAttribute('aria-label', `Card ${index + 1} of ${totalCards}`);
        titleElem.appendChild(badge);
      }
    });

    // 2. Discover all TOC anchor links (excluding the page h1 title)
    function getTOCLinks() {
      const allLinks = Array.from(document.querySelectorAll('.md-nav--secondary a.md-nav__link[href^="#"]'));
      return allLinks.filter(link => {
        const href = link.getAttribute('href');
        return href && href !== '#' && !href.includes('workshop-master-outline');
      });
    }

    // 3. Find the currently active TOC index based on scroll position
    function getActiveIndex(tocLinks) {
      if (tocLinks.length === 0) return 0;

      const header = document.querySelector('.md-header');
      const headerThreshold = (header ? header.getBoundingClientRect().bottom : 48) + 12;

      let activeIdx = 0;
      for (let i = 0; i < tocLinks.length; i++) {
        const targetId = tocLinks[i].getAttribute('href').substring(1);
        const targetElem = document.getElementById(targetId);
        if (targetElem) {
          const rect = targetElem.getBoundingClientRect();
          if (rect.top <= headerThreshold) {
            activeIdx = i;
          } else {
            break;
          }
        }
      }
      return activeIdx;
    }

    // 4. Update parent card highlight when a heading is active
    function syncCardHighlight(targetElem) {
      if (!targetElem) return;
      const parentCard = targetElem.closest('.admonition.ccard.h2') || (targetElem.classList.contains('ccard') ? targetElem : null);
      cards.forEach(card => {
        if (card === parentCard) {
          card.classList.add('is-current-card');
        } else {
          card.classList.remove('is-current-card');
        }
      });
    }

    // 5. Navigate to TOC link at index
    function navigateToIndex(index, tocLinks) {
      if (index < 0 || index >= tocLinks.length) return;
      const targetLink = tocLinks[index];
      const targetId = targetLink.getAttribute('href').substring(1);
      const targetElem = document.getElementById(targetId);

      syncCardHighlight(targetElem);

      if (targetElem) {
        targetElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + targetId);
      } else {
        targetLink.click();
      }
    }

    // 6. Listen for scroll to dynamically update card highlight
    let scrollDebounce = null;
    function onScroll() {
      if (scrollDebounce) return;
      scrollDebounce = setTimeout(() => {
        scrollDebounce = null;
        const tocLinks = getTOCLinks();
        if (tocLinks.length === 0) return;
        const activeIdx = getActiveIndex(tocLinks);
        const targetId = tocLinks[activeIdx].getAttribute('href').substring(1);
        const targetElem = document.getElementById(targetId);
        if (targetElem) {
          syncCardHighlight(targetElem);
        }
      }, 50);
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    // Initial highlight sync
    const initialLinks = getTOCLinks();
    if (initialLinks.length > 0) {
      const initialIdx = getActiveIndex(initialLinks);
      const targetId = initialLinks[initialIdx].getAttribute('href').substring(1);
      syncCardHighlight(document.getElementById(targetId));
    }

    // 7. Keyboard Navigation:
    // Only intercepts horizontal arrows (→, ←), vim keys (j, k), and brackets (], [).
    // Leaves ↑, ↓, Space, and Shift+Space untouched for native continuous scrolling!
    function onKeyDown(e) {
      // Don't intercept when typing in text inputs
      const target = e.target;
      const tag = target ? target.tagName.toLowerCase() : '';
      if (['input', 'textarea', 'select'].includes(tag) || (target && target.isContentEditable)) {
        return;
      }

      // Check if search modal is active
      const searchInput = document.querySelector('.md-search__input:focus');
      if (searchInput) return;

      // Ignore modifier combinations (Cmd, Ctrl, Alt)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const tocLinks = getTOCLinks();
      if (tocLinks.length === 0) return;

      const currentIdx = getActiveIndex(tocLinks);

      // Next Heading: ArrowRight, j, ]
      if (e.key === 'ArrowRight' || e.key === 'j' || e.key === ']') {
        if (currentIdx < tocLinks.length - 1) {
          e.preventDefault();
          navigateToIndex(currentIdx + 1, tocLinks);
        }
        return;
      }

      // Previous Heading: ArrowLeft, k, [
      if (e.key === 'ArrowLeft' || e.key === 'k' || e.key === '[') {
        if (currentIdx > 0) {
          e.preventDefault();
          navigateToIndex(currentIdx - 1, tocLinks);
        }
        return;
      }
    }

    window.removeEventListener('keydown', onKeyDown);
    window.addEventListener('keydown', onKeyDown);
  }

  // Material for MkDocs instant loading compatibility
  if (typeof document$ !== 'undefined') {
    document$.subscribe(initTOCReader);
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTOCReader);
  } else {
    initTOCReader();
  }
})();
