const express = require("express");
const app = express();
const PORT = 8080;
let cookieParser = require('cookie-parser');
const e = require("express");
const bcrypt = require ("bcryptjs")

app.use(cookieParser());
app.set("view engine", "ejs");

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
      urls.push({ shortURL, longURL: url.longURL });
    }
  }
  console.log (urls)
  return urls;
}

app.use(express.urlencoded({ extended: true}));

app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]]
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  let userUrls = urlsForUser(user.id)
  
  console.log (templateVars.urls)
  console.log ("bye")
  console.log (userUrls)
  if (user) {
    templateVars.urls = userUrls //ASK for help tommoow, it messes up on new URLS
  res.render("urls_index", templateVars);
} else {
  res.send ("You need to login first to see the urls")
}
});

app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["user_id"]];
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
  const templateVars = { id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.cookies["user_id"]]
  };

  res.render("urls_show", templateVars);
  // console.log (typeof urlDatabase[req.params.id]) //this line failed
});


app.post("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (!user) {
    res.status(401).send("You must be logged in to shorten URLs.");
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
  res.send("Hello");
});

app.get("/register", (req, res) => {
  if (req.cookies.user_id) { // check if user is logged in
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.cookies.user_id]
    };
    res.render("urls_register", templateVars);
  }
});

app.get("/login", (req,res) => {
  if (req.cookies.user_id) { // check if user is logged in
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.cookies.user_id]
    };
    res.render("urls_login", templateVars);
  }
});

app.post("/register", (req, res) => {
  const templateVars = { id: req.params.id, 
  longURL: urlDatabase[req.params.id], 
  user: req.cookies["user"]};
  let email = (req.body.email);
  let tempPassword = (req.body.password)
  let password = (bcrypt.hashSync(tempPassword, 10));
  let userid = generateRandomString();
  let userExist = false

  for (let existingUser in users) {
    if (users[existingUser].email === email) { 
      userExist = true
      res.status(400).send ("Email already exists")
      return
    } 
  }

  const newUser = {
    id: userid,
    email: email,
    password: password
  };
  users[userid] = newUser; //changes name of user into the user id
  if (!email || !password) {
    res.status(400).send ("Missing email or password field")
    return
  }
  res.cookie("user_id", userid);
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
  console.log("DELETE");
  delete (urlDatabase[id]);
  console.log(urlDatabase);
  res.redirect('/urls');
});

app.post("/urls/:id/update", (req, res) => {
  const shortUrl = req.params.id;
  //const id = req.params.id
  const newURL = req.body.input;
  urlDatabase[shortUrl] = newURL; //changes the LongURL, apparently the assignment is to change longURL not the shortURL
  console.log(newURL);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
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

  // set user_id cookie and redirect to /urls
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});




app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


//todo
//what if someone updates non existant with id spongebob no existing id