const express = require("express");
const app = express();
const PORT = 8080;

let cookieSession = require('cookie-session');
const e = require("express");
const bcrypt = require("bcryptjs");
//const getUserByEmail = require("./getUserByEmail"); //some reason crashes the code so I'll ignore it as I need to work on next weeks work

app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ["userId"]
}));

const urlDatabase = {
  b6UTxa: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = { //placeholders should not be used
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};


function generateRandomString() {
  let randomString = "";
  let chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  for (let i = 0; i < 6; i++) {
    let rnum = Math.floor(Math.random() * chars.length);
    //chars.length so it uses all the char options
    randomString += chars.substring(rnum, rnum + 1);
  }
  return randomString;
}

function urlsForUser(id) {
  const urls = [];
  for (const shortURL in urlDatabase) {
    const url = urlDatabase[shortURL];
    if (url.userID === id) {
      urls.push({ shortURL, longURL: url.longURL, id });
    }
  }
  console.log(urls);
  return urls;
}

app.use(express.urlencoded({ extended: true}));

app.get("/urls", (req, res) => {
  const user = users[req.session.userId];
  if (!user) {
    res.send("You need to login first to see the urls");
  }
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.userId]
  };
  let userUrls = urlsForUser(user.id);
  
  if (user) {
    templateVars.urls = userUrls;
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = users[req.session.userId];
  if (!user) {
    res.redirect("/login");
    return;
  }
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  console.log("97", req.params);
  console.log("98", urlDatabase);
  const templateVars = { id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session.userId]
  };

  res.render("urls_show", templateVars);
  // console.log (typeof urlDatabase[req.params.id]) //this line failed
});


app.post("/urls", (req, res) => {
  const user = users[req.session.userId];
  if (!user) {
    res.status(401).send("You must be logged in to shorten URLs.");
    return;
  }
  if (!req.session.userId) {
    res.redirect('/login');
    return;
  }
  if (!req.body.longURL) {
    res.status(400).send('Bad request: missing longURL parameter');
    return;
  }
  const longURL = req.body.longURL;
  const id = generateRandomString();
  urlDatabase[id] = {
    longURL: longURL,
    userID: user.id
  };
  res.redirect(`/urls/${id}`);
});

app.get("/", (req, res) => {
  if (!req.session.userId) {
    res.redirect('/login');
  }
  res.redirect(`/urls`);
});

app.get("/register", (req, res) => {
  if (req.session.userId) { // check if user is logged in
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.session.userId]
    };
    res.render("urls_register", templateVars);
  }
});

app.get("/login", (req,res) => {
  if (req.session.userId) { // check if user is logged in
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.session.userId]
    };
    res.render("urls_login", templateVars);
  }
});

app.post("/register", (req, res) => {
  let email = (req.body.email);
  let tempPassword = (req.body.password);
  let password = (bcrypt.hashSync(tempPassword, 10));
  let userid = generateRandomString();
  let userExist = false;
  const templateVars = { id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: userid};

  console.log(tempPassword);
  if (!tempPassword) {
    console.log("no password", 166);
    res.status(400).send("Password field empty");
  }

  // if (tempPassword === "") {
  //   console.log (171, "empty space")
  // }



  for (let existingUser in users) {
    if (users[existingUser].email === email) {
      userExist = true;
      res.status(400).send("Email already exists");
      return;
    }
  }

  const newUser = {
    id: userid,
    email: email,
    password: password
  };
  users[userid] = newUser; //changes name of user into the user id
  if (!email || !password) {
    res.status(400).send("Missing email or password field");
    return;
  }
  // res.cookie("userId", userid);
  req.session.userId = userid;
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;

  let longUrl = urlDatabase[id].longURL; //FIX THIS today, its not working on newly made links
  res.redirect(longUrl);
  // if (longUrl) {
  //   res.redirect(longUrl);
  // } else {
  //   res.status(404).send("URL not found");
  // }
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;

  if (!urlDatabase[id]) {
    return res.status(404).send("URL not found");
  }

  if (!req.session.userId) {
    return res.status(401).send("You must be logged in to delete a URL");
  }

  if (urlDatabase[id].userID !== req.session.userId) {
    return res.status(403).send("You do not have permission to delete this URL");
  }
  delete urlDatabase[id];
  console.log(urlDatabase);
  res.redirect('/urls');
});

app.post("/urls/:id/update", (req, res) => { //need to fix this whole section
  const shortUrl = req.params.id;
  const newURL = req.body.input;
  console.log(newURL, 233);
  //const id = req.params.id
  // if (!urlDatabase[shortUrl]) {
  //   res.status(404).send("The URL was not found");
  // }
  console.log(urlDatabase[shortUrl], 238);
  console.log(urlDatabase[shortUrl].userID, 239);
  console.log(req.session.userId, 240);
  console.log(req.params.id, 241);
  if (!req.session.userId) {
    res.status(401).send("You must be logged in to update the URL");
  } else if (urlDatabase[shortUrl].userID !== req.session.userId) {
    res.status(403).send("You are not authorized to update this URL");
  } else {
    urlDatabase[shortUrl].longURL = newURL;
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session.userId = null;
  res.redirect('/login');
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // check if user with given email exists
  let user = null;
  for (let userId in users) {
    if (users[userId].email === email) {
      user = users[userId];
      break;
    }
  }
  if (!user) {
    return res.status(403).send("User not found");
  }

  // check if password matches
  if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Invalid email or password");
    return;
  }

  // set userId cookie and redirect to /urls
  req.session.userId = user.id;
  res.redirect("/urls");
});



app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



//things to fix
//short URL and long url on newly made sites no longer work
//install cookie session without breaking my code