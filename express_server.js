const express = require ("express")
const app = express()
const PORT = 8080

app.set("view engine", "ejs")

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

function generateRandomString() {
  let randomString=""
  let chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz"
  for (let i=0; i<6; i++) {
    let rnum = Math.floor(Math.random()*chars.length)
     //chars.length so it uses all the char options
    randomString += chars.substring (rnum, rnum+1)
  }
  return randomString
}


app.use(express.urlencoded({ extended: true}))


app.get("/urls", (req, res) => {
  const templateVars= { urls: urlDatabase };
  res.render ("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => { 
  //has to be before app.get urls/;id to work
  res.render ("urls_new")
  
})

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]};

  res.render("urls_show", templateVars);
  // console.log (typeof urlDatabase[req.params.id]) //this line failed
});

app.post("/urls", (req, res) => {
  console.log("Status code:", res.statusCode);
  let longURL=(req.body.longURL); // Log the POST request body to the console
  shortUrl= generateRandomString()
  urlDatabase[shortUrl]= longURL
  console.log (shortUrl)
  console.log (urlDatabase)
  res.send (shortUrl); // Respond with 'Ok' (we will replace this)
});

app.get("/", (req, res) => {
  res.send("Hello")
})

app.get ("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n")
})




app.listen (PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})





app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});