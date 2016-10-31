var express = require('express');
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;

const users = [
	{"username": "rosuav", "password": "correct horse battery staple"},
	{"username": "", "password": ""}
];

passport.use(new BasicStrategy((username, pwd, cb) => {
	for (var user of users) {
		if (user.username === username || user.username === "") {
			if (user.password === pwd && user.username !== "")
				return cb(null, user);
			//Note: If the password is wrong, we continue searching.
			//This reduces the likelihood of timing-based attacks,
			//which could otherwise hint that a user exists.
			//We will ALWAYS perform one password verification.
			//TODO: Guarantee *exactly* one verification.
		}
	}
	return cb(null, false, "Incorrect user or password");
}));

var app = express();
app.use(passport.initialize());

app.get('/', (req, res) => {
	res.send(`<!doctype html>
<head><title>Authentication demo</title></head>
<body>
<p>This is the main page. Everyone is allowed to access this page.</p>
<p>Not everyone is allowed to access <a href="/secret">the secret page</a> though!</p>
</body>
</html>
`);
});

app.get('/secret', passport.authenticate('basic', {session: false}), (req, res) => {
	res.send("The butler did it!!!");
});

app.listen(process.env.PORT || 8080, process.env.IP, () => {
	console.log("Listening on port " + process.env.PORT || 8080);
});
Contact GitHub API Training Shop Blog About
