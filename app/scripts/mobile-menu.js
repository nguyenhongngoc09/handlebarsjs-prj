$(function () {
  $('.js-mobile-menu-trigger').click(function () {
    $(this).parent('.js-header-menu').toggleClass('header__menu--mobile-active');
    $('html').toggleClass('no-scroll');
  });

  $(window).resize(function () {
    const $html = $('html');

    if (!window.isMobile()) {
      $('.header__menu').removeClass('header__menu--mobile-active');
      $html.removeClass('no-scroll');
    }
  });
});
