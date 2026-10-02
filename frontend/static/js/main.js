/**
 * Mã Trường — Hệ thống Quản lý Huấn luyện Ngựa đua
 * Main Script - Navigation & Interactive controls
 */

document.addEventListener('DOMContentLoaded', function () {
  // Mobile Burger Menu
  var burger = document.getElementById('burger');
  var mainnav = document.getElementById('mainnav');

  if (burger && mainnav) {
    burger.addEventListener('click', function () {
      var isOpen = mainnav.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (!isOpen) {
        closeAllMegaMenus();
      }
    });
  }

  // Mega Menus
  var header = document.querySelector('header.nav');
  var items = Array.prototype.slice.call(document.querySelectorAll('.navitem'));
  var hoverable = window.matchMedia('(hover:hover) and (min-width:761px)');
  var timer;

  function closeAllMegaMenus(except) {
    items.forEach(function (it) {
      if (it === except) return;
      it.classList.remove('open');
      var link = it.querySelector('.navlink');
      if (link) {
        link.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function openMegaMenu(it) {
    closeAllMegaMenus(it);
    it.classList.add('open');
    var link = it.querySelector('.navlink');
    if (link) {
      link.setAttribute('aria-expanded', 'true');
    }
  }

  items.forEach(function (it) {
    var link = it.querySelector('.navlink');
    if (!link) return;

    link.addEventListener('click', function (e) {
      e.stopPropagation();
      if (it.classList.contains('open')) {
        closeAllMegaMenus();
      } else {
        openMegaMenu(it);
      }
    });

    it.addEventListener('mouseenter', function () {
      if (!hoverable.matches) return;
      clearTimeout(timer);
      openMegaMenu(it);
    });

    it.addEventListener('focusin', function () {
      if (hoverable.matches) {
        openMegaMenu(it);
      }
    });
  });

  if (header) {
    header.addEventListener('mouseleave', function () {
      if (!hoverable.matches) return;
      timer = setTimeout(closeAllMegaMenus, 140);
    });

    header.addEventListener('mouseenter', function () {
      clearTimeout(timer);
    });
  }

  // Close menus on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAllMegaMenus();
      if (mainnav && mainnav.classList.contains('open')) {
        mainnav.classList.remove('open');
        if (burger) burger.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // Close menus when clicking outside
  document.addEventListener('click', function (e) {
    if (header && !header.contains(e.target)) {
      closeAllMegaMenus();
    }
  });
});
