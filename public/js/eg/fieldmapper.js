// Generated by CoffeeScript 1.3.1

define(['fmall', 'fmd'], function() {
  var expo, guard_ilsevent, guard_null, _fieldmap,
    _this = this;
  expo = {};
  guard_null = function(fn) {
    return function(x) {
      if (x != null) {
        return fn.apply(this, arguments);
      } else {
        return x;
      }
    };
  };
  guard_ilsevent = function(fn) {
    return guard_null(function(x) {
      if (typeof x === 'object' && (x.ilsevent !== void 0 || (x[0] && x[0].ilsevent !== void 0))) {
        return x;
      } else {
        return fn.apply(this, arguments);
      }
    });
  };
  expo.ret_types = {
    'number': guard_ilsevent(Number),
    'string': guard_ilsevent(String),
    'search': guard_ilsevent(function(x) {
      var f, id, n, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
      _ref = ['count', 'superpage_size'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        if (x[f] !== void 0) {
          x[f] = Number(x[f]);
        }
      }
      _ref1 = x.ids;
      for (n = _j = 0, _len1 = _ref1.length; _j < _len1; n = ++_j) {
        id = _ref1[n];
        x.ids[n] = Number(id);
      }
      if (x.superpage_summary !== void 0) {
        _ref2 = ['checked', 'visible', 'estimated_hit_count', 'excluded', 'deleted', 'total'];
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          f = _ref2[_k];
          if (x.superpage_summary[f] !== void 0) {
            x.superpage_summary[f] = Number(x.superpage_summary[f]);
          }
        }
      }
      return x;
    }),
    'prefs': guard_ilsevent(function(x) {
      var p, _i, _len, _ref;
      _ref = ['opac.hits_per_page', 'opac.default_search_location', 'opac.default_search_depth'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        if (x[p]) {
          x[p] = Number(x[p]);
        }
      }
      return x;
    })
  };
  expo.flatten_tree = function(o) {
    var _flatten_tree;
    _flatten_tree = function(os) {
      var a;
      a = [];
      $.each(os, function(n, o) {
        var k, v, _ref;
        if (!o.opac_visible) {
          return [];
        }
        a.push(o);
        if (o.children) {
          _ref = _flatten_tree(o.children);
          for (k in _ref) {
            v = _ref[k];
            a.push(v);
          }
        }
        return delete o.children;
      });
      return a;
    };
    return _flatten_tree($.extend(true, {}, [o]));
  };
  expo.typemap = {
    '': function(x) {
      return x;
    },
    'fm': guard_null(function(x) {
      if (typeof x === 'object') {
        return expo.fieldmap(x);
      } else {
        return x;
      }
    }),
    'number': guard_null(Number),
    'string': guard_null(String),
    'date': function(x) {
      var day, hh, mm, mon, ss, tz, yr, _ref;
      if (x == null) {
        return x;
      }
      _ref = ((String(x)).replace(/\D/g, ' ')).split(' '), yr = _ref[0], mon = _ref[1], day = _ref[2], hh = _ref[3], mm = _ref[4], ss = _ref[5], tz = _ref[6];
      return new Date(yr, --mon, day, hh, mm, ss);
    },
    'boolean': function(x) {
      switch (x) {
        case 't':
        case '1':
          return true;
        case 'f':
        case '0':
          return false;
        default:
          return !!x;
      }
    }
  };
  _fieldmap = function(c, p) {
    var n, name, o, t, ts, _i, _j, _len, _len1, _ref, _ref1;
    o = {};
    if ((ts = fm_datatypes[c]) != null) {
      _ref = fmclasses[c];
      for (n = _i = 0, _len = _ref.length; _i < _len; n = ++_i) {
        name = _ref[n];
        o[name] = (t = ts[name]) ? expo.typemap[t](p[n]) : p[n];
      }
    } else {
      _ref1 = fmclasses[c];
      for (n = _j = 0, _len1 = _ref1.length; _j < _len1; n = ++_j) {
        name = _ref1[n];
        o[name] = p[n];
      }
    }
    return o;
  };
  expo.fieldmap = function(x) {
    var a, _i, _len, _results;
    if ($.isArray(x)) {
      if (!x.length) {
        return x;
      }
      _results = [];
      for (_i = 0, _len = x.length; _i < _len; _i++) {
        a = x[_i];
        if (a.__c) {
          _results.push(_fieldmap(a.__c, a.__p));
        }
      }
      return _results;
    } else {
      if (x.__c) {
        return _fieldmap(x.__c, x.__p);
      } else {
        return {};
      }
    }
  };
  expo.maptype = {
    '': function(x) {
      return x;
    },
    'fm': guard_null(function(x, cls) {
      if (typeof x === 'object') {
        return expo.mapfield({
          cls: x
        });
      } else {
        return x;
      }
    }),
    'number': guard_null(Number),
    'string': guard_null(String),
    'date': function(x) {
      return x;
    },
    'boolean': function(x) {
      if (x) {
        return 't';
      } else {
        return 'f';
      }
    }
  };
  expo.mapfield = function(xs) {
    var c, class_hint, n, name, o, p, t, ts, _i, _j, _len, _len1, _ref, _ref1;
    p = [];
    for (c in xs) {
      o = xs[c];
      class_hint = c;
      if ((ts = fm_datatypes[c]) != null) {
        _ref = fmclasses[c];
        for (n = _i = 0, _len = _ref.length; _i < _len; n = ++_i) {
          name = _ref[n];
          p[n] = (t = ts[name]) ? expo.maptype[t](o[name], c) : o[name];
        }
      } else {
        _ref1 = fmclasses[c];
        for (n = _j = 0, _len1 = _ref1.length; _j < _len1; n = ++_j) {
          name = _ref1[n];
          p[n] = o[name];
        }
      }
    }
    return {
      __c: class_hint,
      __p: p
    };
  };
  return expo;
});
