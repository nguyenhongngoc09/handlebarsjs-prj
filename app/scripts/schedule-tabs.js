$(document).ready(() => {
  const activeClass = 'active';

  $('.js-tab-toggling').on('click', function(e) {
    if (!window.isMobile()) {
      return;
    }

    if (!$(e.target).hasClass('js-tab-item-toggling')) {
      return;
    }

    $('.js-tab-toggling').not(this).removeClass(activeClass);
    $(this).toggleClass(activeClass);

    e.stopPropagation();
    e.preventDefault();
  });
});

