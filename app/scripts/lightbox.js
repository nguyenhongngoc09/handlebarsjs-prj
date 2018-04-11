$(document).ready(() => {
  var lightboxClass = '.js-lightbox';

  $(lightboxClass).on('click', function(event) {
    if (event.target !== this) {
      return;
    }

    var id = $(this).attr('id');

    toggleLightbox(id);
  });

  function toggleLightbox(lightboxId) {
    if (!lightboxId) {
      return;
    }

    var lightboxEl = $('#' + lightboxId);

    lightboxEl.fadeToggle('fast', function() {
      var scrollValue = lightboxEl.is(':visible') ? 'hidden' : 'auto';
      $('html, body').css('overflow-y', scrollValue);
    });
  }

  window.toggleLightbox = toggleLightbox;
});
