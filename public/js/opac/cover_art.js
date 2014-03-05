// Generated by CoffeeScript 1.3.1

define(function() {
  return (function($) {
    var url;
    url = "/opac/extras/ac/jacket";
    $.fn.thumbnail_art = function(isbn) {
      var $img, img, src;
      src = "" + url + "/small/" + isbn;
      img = ($img = $('<img class="cover_art">')).get(0);
      $img.load(function() {
        if (!(img.naturalHeight > 1 && img.naturalWidth > 1)) {
          $img.remove();
        }
        return false;
      }).prependTo(this).prop('src', src);
      return this;
    };
    return $.fn.cover_art = function() {
      return this.on('click', 'img', function(e) {
        var $img, $page, src;
        src = e.target.src.replace('small', 'large');
        $img = $('<img class="cover_art">').prop('src', src);
        $page = $('#cover_art').find('.content').empty().append($img).end();
        $.mobile.changePage($page);
        $page.refresh;
        return false;
      });
    };
  })(jQuery);
});
