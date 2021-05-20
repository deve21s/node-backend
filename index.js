const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const words = require("./models/words");
const User = require("./models/user");
const Comment = require("./models/comment");
const Words = require("./models/words");
const Reply = require("./models/reply");
require("dotenv").config();
const app = express();

var config = {
  apiDomain: "https://api.loginradius.com",
  apiKey: "72743756-8266-4e7f-b335-e7d9ecb9bfa1",
  apiSecret: "ce5994db-5e7b-4c65-8df0-a62a909d76db",
  siteName: "https://myglossary.herokuapp.com",
  proxy: {
    host: "",
    port: "",
    user: "",
    password: "",
  },
};

const lrv2 = require("loginradius-sdk")(config);
app.set("view engine", "ejs");
app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "devendra",
    resave: false,
    saveUninitialized: false,
  })
);
//chage

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    app.listen(process.env.PORT || 5000, () => {
      console.log("server is started and data base is connected");
    })
  )
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  
  words.find().exec((err, data) => {
    if (data) {
      res.json(data);
    } else {
      res.send("not found");
    }
  });
});

app.post("/", (req, res) => {

  words.find().exec((err, data) => {
    if (data) {
      res.json(data);
    } else {
      res.send("not found");
    }
  });
});

app.post("/all", (req, res) => {
  words.find().exec((err, data) => {
    if (data) {
      res.json(data);
    } else {
      res.json("not found");
    }
  });
});

app.get("/new", (req, res) => {
  if (req.session.user_id) {
    res.render("add-page");
  } else {
    res.redirect("/admin/login");
  }
});
app.post("/new", async (req, res) => {
  console.log(req.body);

  const { title, details, ref, rel } = req.body;
  const word = new words({
    title,
    details,
    ref: ref,
    rel: rel,
  });
  await word.save();
  res.redirect(`details/${word.id}`);
});

app.get("/login", (req, res) => {
  if (!req.session.user_id) {
    res.render("login");
  } else {
    res.redirect("/admin");
  }
});
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  var emailAuthenticationModel = {
    email: email,
    password: password,
  }; //Required
  // var emailTemplate = "<emailTemplate>"; //Optional
  // var fields = null; //Optional
  // var loginUrl = "<loginUrl>"; //Optional
  // var verificationUrl = "<verificationUrl>"; //Optional

  lrv2.authenticationApi
    .loginByEmail(emailAuthenticationModel)
    .then((response) => {
      let { Uid, FirstName, Roles, ImageUrl } = response.Profile
      let user = {
        Uid,
        FirstName,
        Roles : Roles || "user",
        ImageUrl
      }
      const accesstoken = jwt.sign(user, 'devendra522')
      return res.json(accesstoken);
    })
    .catch((error) => {
      let { Message } = error
      console.log(Message)
      res.send(Message)
      
    });
});

app.get("/admin", authenticateToken,(req, res) => {
    console.log(req.user)
    const {Roles} = req.user;
    if(Roles === "admin"){
      words
      .find({})
      .sort("-createdAt")
      .exec((err, data) => {
        if (data) {
          res.render("admin", { result: data });
          // res.json(data)
        } else {
          res.json("no data");
        }
      });
    }else{
       res.status(401).json("you don't have admin permission")
    }
    
    //     .then(result => {
    //         res.render('admin', {result})
    //     })
    //     .catch(() => {
    //         res.send('no data')
    //     })
  // } else {
    // res.redirect(
    //   "/login                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     "
    // );
  // }
});

app.get("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/");
});

app.post("/comment/:id",authenticateToken, async (req, res) => {
  const id = req.params.id;
  const {text} = req.body
  const comm = {
    text : text,
    name : req.user.FirstName,
    imageUrl : 'https://www.pngitem.com/pimgs/m/150-1503945_transparent-user-png-default-user-image-png-png.png'
  } 
  const words = await Words.findById(id);
  const comment = new Comment(comm);
  words.comments.push(comment);
  await comment.save();
  await words.save();
  Words.findById({ _id: id })
    .populate({
      path: "comments", 
      populate: {
        path: "replys",
      },
    })
    .then((data) => {
      res.json(data);
    });
});

app.post("/reply/:cid", async (req, res) => {
  const id = req.params.cid;
  const comment = await Comment.findById(id);
  const reply = new Reply(req.body);
  comment.replys.push(reply);
  await reply.save();
  await comment.save();

  res.json("done");
});
app.post("/dislike/:id", async (req, res) => {
  await words.updateOne(
    { _id: req.params.id },
    { $inc: { "likes.disLike": 1 } }
  );
  res.json("done");
});
app.post("/likes/:id", async (req, res) => {
  await words.updateOne(
    { _id: req.params.id },
    { $inc: { "likes.likeCount": 1 } }
  );
  res.send("done");
});

app.get("/:letter", (req, res) => {
  let letter = req.params.letter;
  words
    .find({ title: { $regex: "^" + letter, $options: "i" } })
    .exec((err, data) => {
      if (data) {
        //res.render('home', {result : data, alphabet, letter})
        res.json(data);
      } else {
        res.send("not found");
      }
    });
});

app.get("/details/:id", (req, res) => {
  let id = req.params.id;
  words
    .findOne({ _id: id })
    .populate({
      path: "comments", 
      populate: {
        path: "replys", 
      },
    })
    .then((data) => {
      res.json(data);
    });
});

app.get("/delete/:id", (req, res) => {
  var id = req.params.id;
  console.log("here", id);
  words.deleteOne(
    {
      _id: id,
    },
    function (err) {
      if (err) {
        //console.log(err)
      } else {
        // res.redirect("/admin")
      }
    }
  );
});

app.get("/edit/:id", function (req, res) {
  words.findById(req.params.id, function (err, data) {
    if (err) {
      console.log(err);
    } else {
      // res.render('edit-page', { result : data });
      res.json(data);
    }
  });
});

app.post("/edit/:id", function (req, res) {
  var refs = [];

  var i = 1;
  while (true) {
    var link = req.body["ref_link" + i];
    var name = req.body["ref_name" + i];
    if (link && name) {
      i++;
      refs.push({ name: name, link: link });
    } else {
      break;
    }
  }

  var rels = [];

  var j = 1;
  while (true) {
    var link = req.body["rel_link" + j];
    var name = req.body["rel_name" + j];
    if (link && name) {
      j++;
      rels.push({ name: name, link: link });
    } else {
      break;
    }
  }
  const { title, details } = req.body;
  const word = {
    title,
    details,
    ref: refs,
    rel: rels,
  };
  console.log(word);

  words.findByIdAndUpdate(req.params.id, { $set: word }, function (err) {
    if (err) {
      res.json("err");
      //res.send('error !!')
    } else {
      res.json("done");
      //res.redirect('/admin')
    }
  });
});

app.all("*", function (req, res) {
  res.status(404);
  res.render("404");
});

// app.get('/ragister',(req,res) => {
//     res.render('ragister')
// })

// app.post('/ragister', async(req,res) => {
//    const {name, email, password} = req.body.ragister
//     console.log(name)
//     const hash =  await bcrypt.hash(password, 10)
//     const user = new User({
//         name,
//         email,
//         password : hash
//     })
//     await user.save();
//     req.session.user_id = user._id;
//     res.redirect(`/a`)
// })

function authenticateToken(req, res ,next){
  // const authHeder = req.headers['authorization']
  // const token = authHeder && authHeder.split(' ')[1]
  const {token} = req.query;
  if(token == null) return res.sendStatus(401)
  jwt.verify(token , "devendra522", (err, user)=> {
    if (err) return res.sendStatus(403)
    req.user = user
    console.log(user)
    next()
  })
}