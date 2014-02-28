var mongoose = require('mongoose'),
    hash = require('../util/hash'),
    _ = require('underscore');


UserSchema = mongoose.Schema({
	firstName:  String,
	lastName:   String,
	email:      String,
	salt:       String,
	hash:       String,
	facebook:{
		id:       String,
		email:    String,
		name:     String
	},
	twitter:{
		id:       String,
		email:    String,
		name:     String
	},
  accounts: [{
    id: String,
    name: String,
    password: String
  }]
});


UserSchema.statics.signup = function(email, password, firstName, lastName, done){
	var User = this;
  hash(password, function(err, salt, hash){
		if(err) throw err;
		// if (err) return done(err);
		User.create({
			email : email,
      firstName : firstName,
      lastName: lastName,
			salt : salt,
			hash : hash
		}, function(err, user){
			if(err) throw err;
			// if (err) return done(err);
			done(null, user);
		});
	});
}


UserSchema.statics.isValidUserPassword = function(email, password, done) {
	this.findOne({email : email}, function(err, user){
		// if(err) throw err;
		if (err) {console.log("error");return done(err); }
		if (!user) { console.log("email"); return done(null, false, {message: 'Incorrect email.'});}
    if (user.facebook.id) {
      return done( null, false, { message: 'Facebook'});}
		hash(password, user.salt, function (err, hash){
			if (err) return done(err);
			if (hash == user.hash) return done(null, user);
			done(null, false, {
				message : 'Incorrect password'
			});
		});
	});
};



UserSchema.statics.findOrCreateFaceBookUser = function(profile, done){
	var User = this;
	this.findOne({ 'facebook.id' : profile.id }, function(err, user){
		if(err) throw err;
		// if (err) return done(err);
		if(user){
			done(null, user);
		}else{
			User.create({
				email : profile.emails[0].value,
				facebook : {
					id:    profile.id,
					email: profile.emails[0].value,
					name:  profile.displayName
				}
			}, function(err, user){
				if(err) throw err;
				// if (err) return done(err);
				done(null, user);
			});
		}
	});
}

UserSchema.statics.add_account = function(email, id, name, password, done) {
  this.findOne( {email: email}, function(err, user) {
    console.log("hello")
    if (err) return done(err);
    var contains = _.find(user.accounts, function(account) {
      return account.id === id;
    });
    if (contains) {
      console.log("acocunt already exists")
			done(null, false, {
				error : 'Account already exists'
			});
    } else {
      console.log("creating account")
      user.accounts.push({id: id, name: name, password: password});
      user.save();
      done(null, user);
    }
	});
}

UserSchema.statics.remove_account = function(email, oid, done) {
  console.log("removing account")
  this.findOne( {email: email}, function(err, user) {
    console.log("found user")
    if (err) return done(err);
    user.accounts = _.filter(user.accounts, function(account) {
        console.log(account.name)
        return !account._id.equals(oid);
    });
    user.save();
    done(null, user);
	});
}

UserSchema.statics.find_account = function(user, account_id, done) {
  var account = _.find(user.accounts, function(account) {
    return account.id === account_id;
  });
  done(null, account);
}

UserSchema.statics.save_account = function(email, account_oid, account_id, name, password, done) {
  console.log(account_oid);
  if (account_oid) {
    this.findOne( {email: email}, function(err, user) {
      if (err) return done(err);
      user.accounts = _.filter(user.accounts, function(account) {
        console.log(account._id)
        if (account._id.equals(account_oid)) {
          console.log("match")
          account.id = account_id;
          account.name = name;
          account.password = password;
        };
        return account;
      });
      user.save();
      done(null, user);
    });
  } else { done(null, null) }
}

var User = mongoose.model("User", UserSchema);
module.exports = User;
