var express = require('express');

var app = express();

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
	res.send("The butler did it!!!");
});

app.listen(process.env.PORT || 8080, process.env.IP, () => {
	console.log("Listening on port " + process.env.PORT || 8080);
});
