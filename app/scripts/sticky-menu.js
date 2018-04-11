$(document).ready(function() {
  var activeClass = 'active';
  var menuMobileActiveClass = 'sticky-menu__nav--mobile-active';

  var stickyEl = $('.js-sticky-nav');
  var stickyMenu = $('.js-sticky-menu');
  const highlightSections = $('.js-highlight-section');

  var currentOffsetTop;

  function overlayStickyMenu() {
    var scrollTop = $(window).scrollTop();

    if (scrollTop > currentOffsetTop) {
      stickyMenu.addClass(activeClass);
    } else {
      stickyMenu.removeClass(activeClass);
    }
  }

  function updateCurrentOffsetTop() {
    currentOffsetTop = stickyMenu.hasClass(activeClass) ?
      currentOffsetTop : stickyEl.offset().top;
  }

  function updateSelectedMenu(section) {
    if (!section) {
      $('.js-menu-item > span').removeClass(activeClass);
      $('.js-menu-selected').removeClass(activeClass);

      return;
    }

    var menuEl = $('.js-menu-item[data-scroll-to-id="' + section.id + '"]');
    if (!menuEl.length) return;

    $('.js-menu-item > span').removeClass(activeClass);
    $('.js-menu-selected').addClass(activeClass).text(menuEl.text());
    menuEl.find('span').addClass(activeClass);
  }

  function handleScrollToSection() {
    if (!highlightSections.length) {
      return;
    }

    var stickyMenuIsActive = stickyMenu.length > 0 && stickyMenu.hasClass('active');
    var offsetStickyMenu = stickyMenuIsActive ? stickyMenu.outerHeight(true) : 0;

    var scrollTop = $(window).scrollTop() + offsetStickyMenu * 2;

    var sections = [];

    highlightSections.each(function(index, section) {
      const $section = $(section);
      const sectionId = $section.attr('id');
      sections.push({
        top: $section.offset().top,
        element: $section,
        id: sectionId,
        height: $section.outerHeight(true),
      });
    });

    sections.sort(function(firstEl, secondEl) {
      return firstEl.top - secondEl.top;
    });

    let isInsideSection = false;
    let section;
    for(let i = 0; i < sections.length; i++) {
      section = sections[i];
      if(scrollTop >= section.top && scrollTop <= section.top + section.height) {
        updateSelectedMenu(section);
        isInsideSection = true;

        break;
      }
    }

    if (!isInsideSection) {
      updateSelectedMenu();
    }
  }

  function handleWindowScroll() {
    overlayStickyMenu();
    updateCurrentOffsetTop();
    handleScrollToSection();
  }

  if(stickyEl.length && stickyMenu.length) {
    updateCurrentOffsetTop();

    $(window).on('scroll', handleWindowScroll);

    $(window).on('resize', updateCurrentOffsetTop);
  }

  $('.js-sticky-nav-dropdown-button').click(function () {
    $('.js-sticky-nav').toggleClass(menuMobileActiveClass);
  });

  $('.js-menu-item').on('click', function() {
    $('.js-menu-item > span').removeClass(activeClass);
    $(this).find('span').addClass(activeClass);

    $('.js-menu-selected').addClass(activeClass).text($(this).find('span').text());
    $('.js-sticky-nav').toggleClass(menuMobileActiveClass);
  });
});
