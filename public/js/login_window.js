// Generated by CoffeeScript 1.3.1

define(['eg/eg_api', 'plugin'], function(eg) {
  return (function($) {
    var content, deferreds;
    content = '<form class="login_form">\n  <div data-role="fieldcontain">\n    <label for="login_un">Username</label>\n    <input type="text" id="login_un" name="username" />\n  </div>\n  <div data-role="fieldcontain">\n    <label for="login_pw">Password</label>\n    <input type="password" id="login_pw" name="password" value="" />\n  </div>\n  <div class="ui-grid-a">\n    <div class="ui-block-a">\n      <button type="reset">Cancel</button>\n    </div>\n    <div class="ui-block-b">\n      <button type="submit">Log in</button>\n    </div>\n  </div>\n</form>';
    deferreds = [];
    return $.fn.login_window = function() {
      var $login_w, cancel, submit,
        _this = this;
      if (this.plugin()) {
        return this;
      }
      $login_w = this.plugin('login_window');
      return this.find('.content').html(content).trigger('refresh').submit(submit = function() {
        var $f, credentials, pw, un;
        credentials = ($f = $('form', this)).serializeArray();
        eg.openils('auth.session.create', {
          username: un = credentials[0].value,
          password: pw = credentials[1].value,
          type: 'opac',
          org: 1
        }, function(resp) {
          localStorage.setItem('username', un);
          localStorage.setItem('password', pw);
          history.back();
          $('input', $f).val('').end();
          while (deferreds.length > 0) {
            deferreds.pop().call();
          }
          $().publish('session.login', [un]);
        });
        return false;
      }).on('click', 'button[type=reset]', cancel = function() {
        history.back();
        _this.find('input[name=username]').val('').end().find('input[name=password]').val('').end();
        deferreds = [];
        return false;
      }).on('keyup', 'input', function(e) {
        switch (e.keyCode) {
          case 27:
            cancel.call(_this);
        }
        return false;
      });
    };
  })(jQuery);
});
