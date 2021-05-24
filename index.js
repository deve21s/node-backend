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
  apiKey: process.env.Api_Key,
  apiSecret: process.env.Api_SECRET,
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
app.post("/new",authenticateToken, async (req, res) => {
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
      const accesstoken = jwt.sign(user, process.env.TOKEN_SECRET)
      return res.json(accesstoken);
    })
    .catch((error) => {
      let { Message } = error
      console.log(Message)
      res.send(Message)
      
    });
});
app.post("/auth",(req, res) => {
  let token = req.body.token
  console.log(token)
  lrv2.authenticationApi.authValidateAccessToken(token).then((response) => {
    let { Uid, FirstName, Roles, ImageUrl } = response.Profile
    let user = {
      Uid,
      FirstName,
      Roles : Roles || "user",
      ImageUrl
    }
    const accesstoken = jwt.sign(user, process.env.TOKEN_SECRET)
    return res.json(accesstoken);
  })
  .catch((error) => {
    let { Message } = error
    console.log(Message)
    res.send(Message)
  });
})

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
    imageUrl : req.user.ImageUrl || 'https://www.pngitem.com/pimgs/m/150-1503945_transparent-user-png-default-user-image-png-png.png'
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

app.post("/reply/:cid",authenticateToken, async (req, res) => {
  const id = req.params.cid;
  const comment = await Comment.findById(id);
  let { text } = req.body;
  let replaybody = {
    name : req.user.FirstName,
    text : text,
    imageUrl : req.user.ImageUrl || 'https://www.pngitem.com/pimgs/m/150-1503945_transparent-user-png-default-user-image-png-png.png'
  }
  const reply = new Reply([replaybody]);
  comment.replys.push(reply);
  await reply.save();
  await comment.save();
  // Words.findById({ _id: id })
  //   .populate({
  //     path: "comments", 
  //     populate: {
  //       path: "replys",
  //     },
  //   })
  //   .then((data) => {
  //     res.json(data);
  //   });
});
app.post("/dislike/:id", authenticateToken, async (req, res) => {
  // await words.updateOne(
  //   { _id: req.params.id },
  //   { $inc: { "likes.disLike": 1 } }
  // );
  // res.json("done");
  let { Uid } = req.user
  console.log(Uid)
  const word = await words.findById(req.params.id,{dislike : 1})
  // const test = word.like.find({like : Uid})
  let disliked = word.dislike.includes(Uid)
  if(Uid == ""){
    return res.json("pls login first")
  }
  else if(disliked){
    return res.json("you disLiked already.")
  }else {
    word.dislike.push(Uid)
    let data =  await word.save()
    console.log(data)
    return res.json("dislike added successfully.")
  }
});
app.post("/likes/:id", authenticateToken , async (req, res) => {
  // await words.updateOne(
  //   { _id: req.params.id },
  //   { $inc: { "likes.likeCount": 1 } }
  // );
  let {Uid} = req.user
  const word = await words.findById(req.params.id,{like : 1})
  // const test = word.like.find({like : Uid})
  let liked = word.like.includes(Uid)
  if(Uid == ""){
    return res.json("pls login first")
  }
  else if(liked){
    return res.json("you liked already.")
  }else {
    word.like.push(Uid)
    await word.save()
    return res.json("like added successfully.")
  }
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

app.get("/delete/:id",authenticateToken, (req, res) => {
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
        res.json("done")
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

app.post("/edit/:id",authenticateToken, function (req, res) {
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
  jwt.verify(token , process.env.TOKEN_SECRET, (err, user)=> {
    if (err) return res.sendStatus(403)
    req.user = user
    console.log(user)
    next()
  })
}