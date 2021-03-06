// Generated by CoffeeScript 1.3.1

define(['eg/eg_api', 'template', 'plugin'], function(eg, _) {
  return (function($) {
    var $plugin, mmddyy, pad, refresh_bill_list, refresh_payment_list, tpl_bill, tpl_bill_list, tpl_payment, tpl_payment_list;
    tpl_bill_list = '<form>\n  <fieldset data-role="controlgroup" />\n  <div data-role="controlgroup" data-type="horizontal">\n    <!--<span><button name="payment" type="button">Pay selected fines</button></span>-->\n    <span><button name="history" type="button">See payments</button></span>\n  </div>\n</form>';
    tpl_bill = _.template('<input type="checkbox" checked name="bill_id" value="<%= bill_id %>" id="checkbox_<%= bill_id %>" />\n<label for="checkbox_<%= bill_id %>">\n  <span class="status_line">\n    <span>$<%= owed %></span>\n    <span><%= type %></span>\n    <br />\n    <span><%= date %></span>\n    <span><%= note %></span>\n  </span>\n</label>');
    tpl_payment_list = '<form>\n  <fieldset data-role="controlgroup" />\n  <div data-role="controlgroup" data-type="horizontal">\n    <span><button name="bills" type="button">See fines</button></span>\n    <span><button name="print" type="button">Print selected payments</button></span>\n    <span><button name="email" type="button">Email selected payments</button></span>\n  </div>\n</form>';
    tpl_payment = _.template('<input type="checkbox" name="payment_id" value="<%= payment_id %>" id="checkbox_<%= payment_id %>" />\n<label for="checkbox_<%= payment_id %>">\n  <span class="status_line">\n    <span>$<%= owed %></span>\n    <span><%= type %></span>\n    <br />\n    <span><%= date %></span>\n    <span><%= note %></span>\n  </span>\n</label>');
    pad = function(x) {
      if (x < 10) {
        return '0' + x;
      } else {
        return x;
      }
    };
    mmddyy = function(x) {
      return "" + (pad(x.getMonth() + 1)) + "/" + (pad(x.getDate())) + "/" + (pad(x.getFullYear()));
    };
    $plugin = {};
    refresh_bill_list = function() {
      this.html(tpl_bill_list).trigger('create').find('fieldset').openils('fines details', 'actor.user.transactions.have_charge.fleshed', function(data) {
        var mbts, mvr, note, o, _i, _len;
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          o = data[_i];
          mbts = o.mbts;
          mvr = o.mvr;
          note = mbts.xact_type === 'circulation' ? "'" + mvr.title + "' by " + mvr.author : mbts.last_billing_note;
          this.append(tpl_bill({
            bill_id: mbts.id,
            owed: mbts.balance_owed,
            type: mbts.last_billing_type,
            date: mmddyy(mbts.last_billing_ts),
            note: note
          }));
        }
        return $plugin.trigger('create');
      });
      return false;
    };
    refresh_payment_list = function() {
      this.html(tpl_payment_list).trigger('create').find('fieldset').openils('payment details', 'actor.user.payments.retrieve', function(data) {
        var mp, note, o, payment, _i, _len;
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          o = data[_i];
          mp = o.mp;
          note = o.xact_type === 'circulation' ? "'" + o.title + "'" : mp.note;
          payment = tpl_payment({
            payment_id: mp.id,
            owed: mp.amount,
            type: o.last_billing_type,
            date: mmddyy(mp.payment_ts),
            note: note
          });
          this.append(payment);
        }
        return $plugin.trigger('create');
      });
      return false;
    };
    return $.fn.fines = function() {
      var _this = this;
      $plugin = this.plugin('acct_fines').trigger('create');
      this.refresh(function() {
        console.log("test");
        return refresh_bill_list.apply(this);
      }).on('click', '[name="bills"]', function() {
        return refresh_bill_list.apply(_this);
      }).on('click', '[name="history"]', function() {
        return refresh_payment_list.apply(_this);
      }).on('click', '[name="payment"]', function() {
        eg.openils('circ.money.payment', {}, function(r) {
          var x;
          return x = r;
        });
        return false;
      }).on('click', '[name="email"]', function() {
        var id, ids, nids, _i, _len, _ref;
        ids = [];
        _ref = $('[name="payment_id"]:checked', _this);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          id = _ref[_i];
          ids.push(Number(id.value));
        }
        switch (nids = ids.length) {
          case 0:
            _this.publish('notice', ['No payments were selected']);
            break;
          case 1:
            eg.openils('circ.money.payment_receipt.email', ids, function(e) {
              _this.publish('notice', ['Payment receipt emailed.']);
            });
            break;
          default:
            eg.openils('circ.money.payment_receipt.email', ids, function(e) {
              _this.publish('notice', ["" + nids + " Payment receipts emailed."]);
            });
        }
        return false;
      }).on('click', '[name="print"]', function() {
        var id, ids, nids, _i, _len, _ref;
        ids = [];
        _ref = $('[name="payment_id"]:checked', _this);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          id = _ref[_i];
          ids.push(Number(id.value));
        }
        switch (nids = ids.length) {
          case 0:
            _this.publish('notice', ['No payments were selected']);
            break;
          default:
            eg.openils('circ.money.payment_receipt.print', ids, function(atev) {
              var receipt;
              receipt = atev.template_output.data;
              $.mobile.changePage($('#payment_receipt').find('.content').html(receipt).end());
            });
        }
        return false;
      });
      this.refresh();
      return this;
    };
  })(jQuery);
});
