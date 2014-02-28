var User = require('../app/models/user');
var Auth = require('./middlewares/authorization.js');

module.exports = function(app, passport){
	app.get("/", function(req, res){
		if(req.isAuthenticated()){
		  res.render("index", { user : req.user});
		}else{
			res.render("index", { user : null});
		}
	});

	app.get("/login", function(req, res){
		res.render("login", { message: req.flash('info'), error: req.flash('error') });
	});

	app.post("/login", function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err) }
      if (!user) {
        return res.json({message: info.message});
      }
			req.login(user, function(err){
				if(err) return next(err);
        return res.json({user: user});
			});

    })(req, res, next);
  });

	app.get("/signup", function (req, res) {
		res.render("signup");
	});

	app.post("/signup", Auth.userExist, function (req, res, next) {
    console.log("signing up...");
		User.signup(req.body.email, req.body.password, req.body.firstName, req.body.lastName, function(err, user){
			if(err) throw err;
			req.login(user, function(err){
				if(err) return next(err);
        return res.json({user: user}); 
			});
		});
	});

  app.post("/add_account", function (req, res, next) {
    User.add_account( req.user.email, req.body.id, req.body.name, req.body.password, function(err, user) {
			if(err) throw err;
      var last = user.accounts.length - 1;
      return res.json({account: user.accounts[last]});
    });
  });

  app.get("/edit_account/:account_id", function (req, res) {
		if(req.isAuthenticated()){
      var account = User.find_account( req.user, req.params.account_id, function(err, account) {
        if (err) throw err;
        if (!account) {
          req.flash('error', 'Account does not exist.');
          return res.redirect("profile");
        }
        res.render( "account/edit", {
          account: account
        });
      });
		}else{
			res.render("login", { message: req.flash('info'), error: req.flash('error') });
		}
  });

  app.post("/edit_account", function (req, res) {
    User.save_account( req.user.email, req.body.oid, req.body.id, req.body.name, req.body.password, function(err, account) {
      if (err) throw err;
      return res.json({message: 'Cards changes saved.'}); 
    });
  });


  app.get("/remove_account/:account_oid", function (req, res) {
		if(req.isAuthenticated()){
      User.remove_account( req.user.email, req.params.account_oid, function(err, user) {
        if(err) throw err;
        return res.json({message: 'Card removed from your account.'});
      });
    } else {
      res.json({message: 'Any error occured while trying to remove this card.'});
    };
  });


	app.get("/auth/facebook", passport.authenticate("facebook",{ scope : "email"}));

	app.get("/auth/facebook/callback",
		passport.authenticate("facebook",{ failureRedirect: '/login'}),
		function(req,res){
			req.login(req.user, function(err){
				if(err) return err;
        return res.json({user: user});
			});
		}
	);

	app.get("/profile", function(req, res){
		if(req.isAuthenticated()){
      res.render("profile", { user: req.user, message: req.flash('info'), error: req.flash('error') });
		}else{
			res.render("login", { message: req.flash('info'), error: req.flash('error') });
		}
	});

	app.get('/logout', function(req, res){
		req.logout();
    req.flash('info', 'You are now logged out.')
		res.redirect('/login');
	});
}
