module.exports = {
	testing: {
		db: 'mongodb://localhost/library-testing',
		app: {
			name: 'CWMARS Mobile Library'
		},
		facebook: {
			clientID: "clientID",
			clientSecret: "clientSecret",
			callbackURL: "http://localhost:3000/auth/facebook/callback"
		}
	},
	development: {
		db: 'mongodb://localhost/library-development',
		app: {
			name: 'CWMARS Mobile Library'
		},
		facebook: {
			clientID: "clientID",
			clientSecret: "clientSecret",
			callbackURL: "http://localhost:3000/auth/facebook/callback"
		}
	},
  	production: {
    	db: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL,
		app: {
			name: 'CWMARS Mobile Library'
		},
		facebook: {
			clientID: "clientID",
			clientSecret: "clientSecret",
			callbackURL: "{{production callbackURL}}"
		}
 	}
}
