// Generated by CoffeeScript 1.3.1

define(['eg/eg_api', 'eg/date'], function(eg, date) {
  return (function($) {
    var auth, no_session, sessionTO, timeouts;
    sessionTO = 60;
    auth = {};
    no_session = {
      session: {
        cryptkey: null,
        id: null,
        time: null,
        user: {},
        settings: {}
      }
    };
    $.extend(true, auth, no_session);
    auth.no_session = no_session;
    timeouts = [];
    auth.setup_timeout = function(authtime) {
      var clicked_in_time;
      clicked_in_time = false;
      $.each(timeouts, function() {
        return this.cancel();
      });
      timeouts = [];
      if (authtime <= 0) {
        return;
      }
      timeouts.push(wait(authtime).next(function() {
        if (!clicked_in_time) {
          eg.openils('auth.session.delete');
          return $().publish('session.timeout');
        }
      }));
      return timeouts.push(wait(authtime - sessionTO).next(function() {
        var relogin;
        relogin = function() {
          if (auth.logged_in()) {
            clicked_in_time = true;
            eg.openils('auth.session.retrieve');
          }
          return false;
        };
        return $().publish('prompt', ['Your login session', "will timeout in " + sessionTO + " seconds unless there is activity.", sessionTO * 1000, relogin]);
      }));
    };
    auth.reset_timeout = function() {
      var s;
      s = auth.session;
      if (s.id && s.timeout > date.now()) {
        s.timeout = date.now() + (s.time * 1000);
        return auth.setup_timeout(s.time);
      }
    };
    auth.logged_in = function() {
      var s;
      s = auth.session;
      if (s.id) {
        if (s.timeout > date.now()) {
          return s.id;
        }
        eg.openils('auth.session.delete');
      }
      return false;
    };
    return auth;
  })(jQuery);
});