// Generated by CoffeeScript 1.3.1

define(['template', 'eg/eg_api', 'plugin'], function(_) {
  return (function($) {
    return $.fn.title_details = function(title_id, $img) {
      var list, marc_text, pinch, tags2text, tpl_content;
      list = '<div data-role="collapsible" data-collapsed="false" data-inset="false">\n	<h3>Title Details</h3>\n	<ul data-role="listview" data-inset="false"></ul>\n</div>';
      tpl_content = _.template('<li id="title_id_<%= title_id %>">\n	<div class="info_box">\n		<div>Title:                <span class="value"><%= b.title            %></span></div>\n		<div>Author:               <span class="value"><%= b.author           %></span></div>\n		<div>Publisher:            <span class="value"><%= b.publisher        %></span></div>\n		<div>Call Number:          <span class="value"><%= b.callnumber       %></span></div>\n		<div>ISBN:                 <span class="value"><%= b.isbn             %></span></div>\n		<div>ISSN:                 <span class="value"><%= b.issn             %></span></div>\n		<div>UPC:                  <span class="value"><%= b.upc              %></span></div>\n		<div>Publisher Number:     <span class="value"><%= b.publisher_number %></span></div>\n		<div>Physical Description: <span class="value"><%= b.phy_descr        %></span></div>\n		<div>Edition:              <span class="value"><%= b.edition          %></span></div>\n		<div>Frequency:            <span class="value"><%= b.frequency        %></span></div>\n		<div>Online Resources: <span class="value"><a href="<%= b.eresource_u %>"><%= b.eresource_z %></a></span></div>\n	</div>\n</li>');
      pinch = function($x) {
        return $.trim($x.text().replace(/\s+/g, ' '));
      };
      tags2text = {
        title: {
          '245': 'abchp'
        },
        author: {
          '100': '',
          '110': '',
          '111': '',
          '130': '',
          '700': '',
          '710': '',
          '711': ''
        },
        publisher: {
          '260': ''
        },
        callnumber: {
          '092': '',
          '099': ''
        },
        isbn: {
          '020': ''
        },
        issn: {
          '022': ''
        },
        upc: {
          '024': ''
        },
        publisher_number: {
          '028': ''
        },
        phy_descr: {
          '300': ''
        },
        edition: {
          '250': ''
        },
        frequency: {
          '310': ''
        },
        eresource_u: {
          '856': 'u'
        },
        eresource_z: {
          '856': 'z'
        }
      };
      marc_text = function(html) {
        var code, codes, marctext, more, name, subfields, tag, tags, text, x, x2, y, _i, _j, _len, _len1, _ref;
        marctext = [];
        $('.marc_tag_row', html).each(function() {
          return marctext.push(pinch($(this)).replace(/^(.....)\. /, '$1').replace(/^(...) \. /, '$1'));
        });
        for (name in tags2text) {
          tags = tags2text[name];
          text = '';
          for (tag in tags) {
            subfields = tags[tag];
            for (_i = 0, _len = marctext.length; _i < _len; _i++) {
              x = marctext[_i];
              if (!x.match(new RegExp("^" + tag))) {
                continue;
              }
              codes = subfields.split('');
              _ref = (codes.length ? codes : ['.']);
              for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                code = _ref[_j];
                code = "\\u2021" + code + "(.+?)(?= \\u2021|$)";
                if (!(x2 = x.match(new RegExp(code, 'g')))) {
                  continue;
                }
                more = ((function() {
                  var _k, _len2, _results;
                  _results = [];
                  for (_k = 0, _len2 = x2.length; _k < _len2; _k++) {
                    y = x2[_k];
                    _results.push(y.replace(/^../, ''));
                  }
                  return _results;
                })()).join(' ');
                text = !text ? more : "" + text + " " + more;
              }
            }
            if (text.length) {
              break;
            }
          }
          if (text.length) {
            tags2text[name] = text;
          } else {
            delete tags2text[name];
          }
        }
        return tags2text;
      };
      return this.html(list).trigger('create').find('[data-role="listview"]').openils("title details #" + title_id, 'search.biblio.record.html', title_id, function(htmlmarc) {
        var _ref;
        this.html(tpl_content({
          title_id: title_id,
          b: marc_text(htmlmarc)
        })).find('.value').each(function() {
          if (!$(this).text()) {
            return $(this).parent().empty();
          }
        });
        if (((_ref = $img.get(0)) != null ? _ref.naturalHeight : void 0) > 0) {
          $img.prependTo($('li', this));
        }
        this.listview('refresh');
      });
    };
  })(jQuery);
});
