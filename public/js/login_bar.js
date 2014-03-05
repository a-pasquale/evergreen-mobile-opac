// Generated by CoffeeScript 1.3.1

define(['template', 'plugin'], function(_) {
  return (function($) {
    var tpl_login, tpl_logout;
    tpl_login = _.template('<h1>CWMars</h1>\n<div data-role="navbar">\n  <ul>\n    <li><a data-icon="plus" class="signup">Sign up</a></li>\n    <li><a data-icon="forward" class="login">Login</a></li>\n  </ul>\n</div>\n');
    tpl_logout = _.template('<h1>CWMars</h1>\n<div data-role="navbar">\n  <ul>\n    <li>\n      <a class="manage_account_link" href="#manage_account" data-icon="gear">\n        Manage Cards\n      </a>\n    </li>\n    <li>\n      <a data-icon="back" class="logout">\n        Logout\n      </a>\n  </ul>\n<div>You are currently logged in as <%= username %></div>');
    return $.fn.login_bar = function() {
      return this.plugin('login_bar').html(tpl_login({})).trigger('create').on('click', '.login', function() {
        require(['account_login'], function() {
          return $('body').pagecontainer('change', '#account_login', {
            'transition': 'slide'
          }).account_login();
        });
        return false;
      }).on('click', '.signup', function() {
        require(['account_signup'], function() {
          return $('body').pagecontainer('change', '#account_signup', {
            'transition': 'slide'
          }).account_signup();
        });
        return false;
      }).subscribe('session.login', function(un) {
        $(this).html(tpl_logout({
          username: un
        })).trigger('create');
        return false;
      }).on('click', '.logout', function() {
        require(['eg/eg_api'], function(eg) {
          return eg.openils('auth.session.delete');
        });
        console.log("logging out");
        console.log(window.accounts);
        window.accounts = [];
        return false;
      }).subscribe('session.logout', function() {
        $(this).html(tpl_login({})).trigger('create');
        return false;
      });
    };
  })(jQuery);
});
