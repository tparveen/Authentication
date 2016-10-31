var express = require('express');
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');

const users = [
	{"username": "rosuav", "password": "$2a$10$GbKgyYMQ6UBRZ32yBcq3TulWKid6ACzQbmOBqBiG.48QBtpC89z9O"},
];
//Syntactically-valid password, used to prevent timing-based attacks.
const dummy = "$2a$10$09NlRCNJ4IPGwpwwdtW8iechXLyO3cs3XV1sl/RMtmf/rOSL1.fIG";

//Textchas to be chosen from randomly. One question, any number of valid answers.
const textchas = [
	{q: "What is my name?", a: ["authdemo"]},
	{q: "What is my quest?", a: ["The Holy Grail"]},
	{q: "What do you get when you multiply six by nine?", a: ["42", "forty-two", "forty two", "fortytwo", "54"]},
];
//Challenges for which we have yet to get a response.
var inflight_textchas = {};

//Call this at any time to clean out old junk.
function prune_inflight() {
	var cutoff = Date.now();
	for (var salt in inflight_textchas)
		if (inflight_textchas[salt].expires < cutoff)
			delete inflight_textchas[salt];
}

function verify_password(username, pwd, cb) {
	//To prevent timing-based attacks, we always perform exactly ONE
	//bcrypt comparison, whether the user name was found or not. (The
	//time cost of searching the array is now negligible compared to
	//the cost of bcrypting.) The time from entering this function to
	//calling the callback will be fairly consistent, whether the user
	//or password is the error.
	var user = users.find(user => user.username === username);
	bcrypt.compare(pwd, user ? user.password : dummy, (err, match) => {
		if (err)
			cb(err);
		else if (match && user)
			cb(null, user);
		else
			cb(null, false, "Incorrect user or password");
	});
}

var app = express();
app.use(bodyParser.urlencoded({extended: false}));

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

app.get('/secret', (req, res) => {
	prune_inflight();
	bcrypt.genSalt(10, (err, salt) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Internal server error.");
		}
		var challenge = textchas[Math.floor(Math.random() * textchas.length)];
		inflight_textchas[salt] = {expires: Date.now() + 3600000, a: challenge.a};
		res.send(`<!doctype html>
<head><title>Please log in</title></head>
<body>
<form method="post">
<p>User name: <input name=username></p>
<p>Password: <input name=password type=password></p>
<p>${challenge.q} <input name=challenge></p>
<p><input type=hidden name=salt value="${salt}"><input type=submit value="Log in"></p>
</form>
</body>
</html>
`);
	});
});

app.post('/secret', (req, res) => {
	verify_password(req.body.username, req.body.password, (err, match) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Internal server error.");
		}
		var textcha = inflight_textchas[req.body.salt];
		delete inflight_textchas[req.body.salt];
		if (!match || !textcha || textcha.expires < Date.now()
			|| textcha.a.indexOf(req.body.challenge) === -1)
			return res.redirect("/secret");
		res.send("The butler did it!!!");
	});
});

app.listen(process.env.PORT || 8080, process.env.IP, () => {
	console.log("Listening on port " + process.env.PORT || 8080);
});
