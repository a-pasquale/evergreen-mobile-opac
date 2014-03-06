// Generated by CoffeeScript 1.3.1

define(['eg/fieldmapper', 'eg/date', 'eg/services', 'eg/cache', 'eg/auth', 'exports'], function(fm, date, services, cache, auth, eg) {
  return (function($) {
    var ajaxOptions, default_action, openils, urlencode;
    ajaxOptions = {
      url: '/osrf-gateway-v1',
      type: 'post',
      dataType: 'json',
      timeout: 60 * 1000,
      global: true
    };
    $.ajaxSetup(ajaxOptions);
    urlencode = function(a) {
      var add, s;
      s = [];
      add = function(key, value) {
        return s[s.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
      };
      $.each(a, function(j, val) {
        if ($.isArray(val)) {
          return $.each(val, function(n, v) {
            return add(j, v);
          });
        } else {
          return add(j, $.isFunction(val) ? val() : val);
        }
      });
      return s.join("&");
    };
    openils = function(method, request, success) {
      var action, d, lookup, n, names, _i, _len;
      lookup = services[method];
      if (lookup === void 0) {
        names = [];
        for (_i = 0, _len = services.length; _i < _len; _i++) {
          n = services[_i];
          if (n) {
            names.push(n);
          }
        }
        return names;
      }
      d = new Deferred();
      if (typeof request === 'function') {
        success = request;
        request = null;
      }
      if (typeof success === 'function') {
        d = d.next(success);
      }
      action = lookup.c && !(lookup.s != null) ? cache : lookup.action || default_action;
      action(method, request, d);
      return d;
    };
    default_action = function(method, request, d) {
      var lookup;
      lookup = services[method];
      if (lookup.s != null) {
        if (!(auth.session.id && auth.session.timeout > date.now())) {
          $().publish('session.required', [
            new Deferred().next(function() {
              return default_action(method, request, d);
            })
          ]);
          return;
        }
      }
      request = typeof lookup.i === 'function' ? lookup.i(request) : [];
      request = $.map(request, function(v) {
        return JSON.stringify(v);
      });
      return $.ajax({
        data: urlencode({
          service: "open-ils." + (method.split('.', 1)[0]),
          method: "open-ils." + method,
          param: request
        }),
        success: function(data) {
          var cb_data;
          if (data.debug) {
            $().publish('prompt', ['Debug', data.debug]);
          }
          if (data.payload) {
            if (data.payload[0]) {
              if (typeof data.payload[0] === 'object') {
                if (data.payload[0].ilsevent !== void 0) {
                  if (data.payload[0].ilsevent !== 0) {
                    if (data.payload[0].ilsevent !== "0") {
                      if (data.payload[0].ilsevent !== "5000") {
                        $().publish('prompt', ['Server error', data.payload[0]]);
                      }
                      d.call(data.payload[0]);
                      auth.reset_timeout();
                      return;
                    }
                  }
                }
              }
            }
          }
          cb_data = {};
          try {
            cb_data = lookup.o ? lookup.o(data) : data.payload[0];
            if (lookup.t) {
              return cb_data = fm.ret_types[lookup.t](cb_data);
            }
          } catch (e) {
            if (e.status && e.status !== 200) {
              $().publish('prompt', ['Client error', e.debug]);
            }
            return cb_data = e;
          } finally {
            d.call(cb_data);
            auth.reset_timeout();
            return;
          }
        },
        error: function(xhr, textStatus, errorThrown) {
          var x;
          x = xhr.responseText;
          if (x == null) {
            try {
              x = JSON.parse(x.replace(',"status', '","status')).debug;
            } catch (e) {
              if (e.message !== 'JSON.parse') {
                throw e;
              }
            }
          }
          d.fail([textStatus, x, errorThrown]);
          return $().publish('prompt', ['Network error', x]);
        }
      });
    };
    $.fn.openils = function(usage, svc) {
      var cb, d, succeeded_or_failed,
        _this = this;
      cb = function() {};
      succeeded_or_failed = function(res) {
        if ((res.ilsevent != null) || res instanceof Error) {
          return _this.failed(usage);
        } else {
          return cb.call(_this.succeeded(), res);
        }
      };
      this.loading(usage);
      switch (arguments.length) {
        case 4:
          cb = arguments[3];
          d = openils(svc, arguments[2], succeeded_or_failed);
          break;
        case 3:
          cb = arguments[2];
          d = openils(svc, succeeded_or_failed);
          break;
        default:
          return this.failed(usage).publish('prompt', ['Client error', "Malformed service method " + svc]);
      }
      if ($.isArray(d)) {
        this.failed(usage).publish('prompt', ['Client error', "Undefined service method " + svc]);
      }
      return this;
    };
    $.extend(true, eg, {
      ajaxOptions: ajaxOptions,
      default_action: default_action,
      openils: openils
    });
  })(jQuery);
});