/* eslint no-invalid-regexp: "off" */
'use strict';

const breakPointTablet = 768;
const animationDuration = 500;
const goTopScrollOffset = 50;
const bindingDataCache = {};
const initNumberSpeakers = 4;
const paddingHeightSpeckerItem = 15;

function isMobile() {
  return window.innerWidth < breakPointTablet;
}

window.isMobile = isMobile;

function initSliderMobile() {
  let $slick = $('.js-slider-mobile');

  if ($slick.hasClass('slick-initialized')) {
    $slick.slick('unslick');
  }

  if (!isMobile()) {
    return;
  }

  $slick.slick({
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    dots: true,
  });

  updateTopArrowSliderByImage($slick);
}

function initSlider() {
  let $slick = $('.js-slider');

  if ($slick.hasClass('slick-initialized')) {
    $slick.slick('unslick');
  }

  $slick.slick({
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    dots: true,
  });

  updateTopArrowSliderByImage($slick);
}

function updateTopArrowSliderByImage(sliders) {
  $(sliders).each(function(index, slider) {
    var images = $(slider).find('.js-image-slider');
    var arrow = $(slider).find('.slick-arrow');

    if (!images.length) return;

    var top = (images.height() - arrow.height()) / 2;
    arrow.css('top', top + 'px');
  });
}

function getBindingData(bindingElements, callbackFunction, callbackValue, jsonAddress, assetUrl) {
  $.getJSON(jsonAddress, function(jsonData) {

    bindingData(jsonData, bindingElements, callbackFunction, callbackValue, assetUrl);

    // Caching
    bindingDataCache[jsonAddress] =  jsonData;
  });
}

function bindingData(jsonData, bindingElements, callbackFunction, callbackValue, assetUrl) {
  bindingElements.each(function() {
    var bindingElement = $(this);
    var bindingField = bindingElement.data('field');
    var bindingValue = jsonData[bindingField];

    if (bindingElement.is('img')) {
      bindingElement.attr('src', assetUrl + bindingValue);
    } else {
      bindingElement.html(bindingValue);
    }
  });

  window[callbackFunction](callbackValue);
}

function autoChangeSrcImage() {
  const imageEls = $('.js-auto-change-src');

  if(!imageEls.length) {
    return;
  }

  imageEls.each(function(index, imageEl) {
    const disableAuto = $(imageEl).data('disable-auto');
    if (!disableAuto) {
      setSrcImage(imageEl);
    }
  });
}

function setSrcImage(imageEl) {
  imageEl = $(imageEl);

  const assetUrl = imageEl.data('asset-url');
  const imagesData = imageEl.data('images');

  if(!imagesData) {
    return;
  }

  const images = imagesData.split(',');
  if(!images || !images.length || images.length <= 1) {
    return;
  }

  let imageIndex = 0;
  let imagePath;

  setInterval(() => {
    if(!images[imageIndex]) {
      imageIndex = 0;
    }

    imagePath = images[imageIndex];


    imageEl.fadeOut('slow', function () {
      imageEl.attr('src', `${assetUrl}${imagePath}`);
    }).fadeIn('slow');

    imageIndex++;
  }, 8000);
}

function initLoadMore() {
  const speakerCardsWrapper = $(".js_speaker_cards");
  let speakerItemHeight = 0;
  let itemHeightsAry = [];

  if (!isMobile()) {
    speakerCardsWrapper.css('height', 'auto');
    $(".js_speaker_loadmore").hide();

    return;
  }

  itemHeightsAry = speakerCardsWrapper.find(".js_speaker__cards-item").map(function() {
    return $(this).height();
  }).get();

  for (let i = initNumberSpeakers; i > 0; i--) {
    speakerItemHeight += itemHeightsAry[i-1] + paddingHeightSpeckerItem;
  }

  $(".js_speaker_loadmore").show();
  speakerCardsWrapper.css('height', `${speakerItemHeight}px`);
  speakerCardsWrapper.css('overflow', 'hidden');
}

function initOurSpeakers() {
  if (isMobile()) {
    $(".js_speaker__cards-item").height('auto');
    return;
  }

  $(".js_speaker_cards").each(function() {
    const heights = $(this).find(".js_speaker__cards-item").map(function() {
      return $(this).height();
    }).get();

    const maxHeight = Math.max.apply(null, heights);

    $(".js_speaker__cards-item").height(maxHeight);
  });
}

$(document).ready(() => {
  $('.js-ga-tracking').on('click', function() {
    let cta = $(this);
    let category = cta.data('category');
    let action = cta.data('action');
    let label = cta.data('label') || '';

    _gaq.push(['_trackEvent', category, action, label]);
  });

  $(window).on('resize', function() {
    initSliderMobile();
    initSlider();
    initOurSpeakers();
    initLoadMore();
  });

  $(window).scroll(() => {
    if ($(window).scrollTop() > goTopScrollOffset) {
      $('.js-go-top').fadeIn(animationDuration);
    } else {
      $('.js-go-top').fadeOut(animationDuration);
    }
  });

  $('.js-go-top').click((event) => {
    event.preventDefault();
    $('html, body').animate({scrollTop: 0}, animationDuration);
    return false;
  });

  $('.js-scroll-to-id').on('click', function(event) {
    event.preventDefault();
    var stickyMenu =  $('.js-sticky-menu');
    var hashId = $(this).prop('hash');

    var stickyMenuIsActive = stickyMenu.length > 0 && stickyMenu.hasClass('active');
    var offset = stickyMenuIsActive ? stickyMenu.outerHeight(true) : 0;

    var destination = $(hashId).offset().top - offset;

    $('html, body').animate({scrollTop: destination}, animationDuration);

    return false;
  });

  $('.js-data-binding-link').on('click', function(event) {
    event.preventDefault();
    var self = $(this);
    var address = self.attr('href');
    var jsonAddress = address.replace('.html', '.json');

    var bindedViewElement = $('#' + self.data('view'));
    var bindingElements = bindedViewElement.find('.js-binding-field');

    var callbackFunction = self.data('callback');
    var callbackValue = self.data('callback-value');
    var assetUrl = self.data('asset-url');
    var jsonData = bindingDataCache[jsonAddress]

    if (jsonData) {
      bindingData(jsonData, bindingElements, callbackFunction, callbackValue, assetUrl);
    } else {
      getBindingData(bindingElements, callbackFunction, callbackValue, jsonAddress, assetUrl);
    }

    return false;
  });

  $('.js_speaker_loadmore_button').on('click', function(event) {
    event.preventDefault();
    $(".js_speaker_cards").css('height', 'auto');
    $(".js_speaker_loadmore").hide();
  });

  $('.js-social-share').on('click', function() {
    $('.js-social-item').toggleClass('active');
  });

  autoChangeSrcImage();
  initSliderMobile();
  initSlider();
  initOurSpeakers();
  initLoadMore();
});
