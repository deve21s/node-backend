const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const session = require('express-session')
const cors = require('cors')
const algoliasearch = require('algoliasearch');

const words = require('./models/words')
const User = require('./models/user')
const Comment = require("./models/comment")
const Words = require('./models/words')
const Reply = require('./models/reply')
require('dotenv').config()
const app = express()

var config = {
    apiDomain: 'https://api.loginradius.com',
    apiKey: '72743756-8266-4e7f-b335-e7d9ecb9bfa1',
    apiSecret: 'ce5994db-5e7b-4c65-8df0-a62a909d76db',
    siteName: 'https://myglossary.herokuapp.com',
    proxy:{
      host:'',
      port:'',
      user:'',
      password:''
   }
}

const lrv2 = require('loginradius-sdk')(config)

app.set("view engine" , "ejs")
app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(
    session({ 
        secret : 'devendra',
        resave : false,
        saveUninitialized : false
    }))
    //chage
    
    
mongoose.connect(process.env.MONGODB_URI,{ useNewUrlParser: true,  useUnifiedTopology: true  })
    .then(() => app.listen(process.env.PORT || 5000, () => {
        console.log("server is started and data base is connected")
    }))
    .catch((err)=> console.log(err))

const alphabet = ['a','b','c','d','e','f','g','h','i','j','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];



const client = algoliasearch('4E5ID5Z9QX', '85dfae50da7751740327ec1d6258e8e3');
const index = client.initIndex('dev_deven');



  
// app.get('/', (req,res) => {
//     let letter = 'o';
//     words.find({"title": {$regex: '^' + letter, $options: 'i'}}).exec((err, data) => {
//         if(data) {
//             // res.render('home', {result : data, alphabet, letter})
//             res.json(data)
//         }else{
//             res.send('not found')
//         }
    
//         })

// })
app.use(cors())
app.post('/', (req,res) => {
    // words.find()
    //     .then((result) => {
    //         res.json(result)
    //     })
    //     .catch
    //    res.json('not found')

    words.find().exec((err, data) => {
                if(data) {
                    // res.render('home', {result : data, alphabet, letter})
                    res.json(data)
                }else{
                    res.send('not found')
                }
            
                })
})

app.post('/all', (req,res) => {
   
    words.find().exec((err, data) => {
                if(data) {
                    res.json(data)
                }else{
                    res.json('not found')
                }
            
                })
})


app.get('/new', (req, res) => {
    if(req.session.user_id){
        res.render('add-page');
    } else {
        res.redirect('/admin/login')
    }
})
app.post('/new', async(req, res)=> {
    console.log(req.body)
    
    const {title, details,ref, rel} = req.body
    const word = new words ({
        title, 
        details,
        ref : ref,
        rel : rel
    })
    await word.save();
    res.redirect(`details/${word.id}`)
})

app.get('/login',(req,res) => {
    if(!req.session.user_id){
        res.render('login')
    }
    else{
        res.redirect('/admin')
    }
    
})
app.post("/login",(req, res) => {
    const { email, password } = req.body;
    var emailAuthenticationModel ={ 
        "email" : email,
        "password" : password
        };  //Required
        // var emailTemplate = "<emailTemplate>"; //Optional
        // var fields = null; //Optional
        // var loginUrl = "<loginUrl>"; //Optional
        // var verificationUrl = "<verificationUrl>"; //Optional
        
        lrv2.authenticationApi.loginByEmail(emailAuthenticationModel).then((response) => {
            let {access_token} = response
            let userId = access_token
            console.log(access_token)
            res.json(userId)
           console.log(response);
        }).catch((error) => {
           console.log(error);
        });
})
// app.post('/login', async(req,res) => {
//     const { email, password } = req.body;
//     const user = await User.findOne({email : email})
//     const validpassword = await bcrypt.compare(password, user.password)
//     if(validpassword){
//         req.session.user_id = user._id;
//          let userId = user._id
//         res.json(userId)
//         console.log(userId)
//         // console.log('valid')
//          res.redirect('/admin')
//     }//else {
//     //     console.log('notvalid')
//     //     res.redirect('/login')
//     // }
// })
app.get('/admin', (req, res) => {
     if(req.session.user_id){
        words.find({}).sort('-createdAt').exec((err, data)=> {
            if(data) {
                res.render('admin', {result : data})
              // res.json(data)
            }else {
                res.json('no data')
            }
        })
    //     .then(result => {
    //         res.render('admin', {result})
    //     })
    //     .catch(() => {
    //         res.send('no data')
    //     })
     }else{
        res.redirect('/login                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     ')
     }
    
    
})

app.get('/logout', (req,res) => {
    req.session.user_id = null;
    res.redirect('/');
})

app.post('/comment/:id', async(req, res) => {
    
    // const comid = "6020f73f6c2c71000475041f"
    const id = req.params.id;
    const words = await Words.findById(id);
    // const comment = new Comment({
    //     name : "suresh",
    //     text : "this is good artical"
    // })
    const comment = new Comment(req.body)
    words.comments.push(comment)
    await comment.save()
    await words.save()
    Words
   .findById({_id: id })
   .populate({
      path: "comments", // populate blogs
      populate: {
         path: "replys" // in blogs, populate comments
      }
   })
   .then(data => {
      res.json(data); 
   });


})

app.post('/reply/:cid', async(req, res) => {
    
    const id = req.params.cid;
    const comment = await Comment.findById(id)
    
    const reply = new Reply(req.body)
    comment.replys.push(reply)
    await reply.save()
    await comment.save()

    res.json('done')
})
app.post('/dislike/:id', async(req,res) => {

    await words.updateOne(
        {_id : req.params.id},
        { $inc : {"likes.disLike" : 1} }
    )
    res.json("done")
})
app.post('/likes/:id', async(req, res) => {
    
    await words.updateOne(
        { _id: req.params.id },
        { $inc: { "likes.likeCount" : 1} }
     )
     res.send("done")
  
    // words.findByIdAndUpdate(req.params.id, {$set: {$inc: { "likes.likeCount": 1} } }, {$Option : { 'useFindAndModify' : 'false' } }, function(err){
    //     if(err){
    //         res.json('err')
    //         //res.send('error !!')
    //     }
    //     else {
    //         res.send("done")
    //         //res.redirect('/admin')
    //     }
        
    // });
   
})

app.get('/:letter',(req, res) => {   
        let letter = req.params.letter;
        words.find({"title": {$regex: '^' + letter, $options: 'i'}}).exec((err, data) => {
            if(data) {
                //res.render('home', {result : data, alphabet, letter})
                res.json(data)
            }else{
                res.send('not found')
            }
        
        })
})

app.get('/details/:id',(req, res) => {
    let id = req.params.id;
    // words.findById(id).populate('comments').populate('replys').exec((err, posts) => {
    //     console.log(posts)
    //     res.json(posts)
    //   })

    words
   .findOne({_id: id })
   .populate({
      path: "comments", // populate blogs
      populate: {
         path: "replys" // in blogs, populate comments
      }
   })
   .then(data => {
      res.json(data); 
   });

        // .then(result => {
        //     console.log(result)
        //     //res.render('details', {result: result}) 
        //     res.json(result)       
        // })
        // .catch(() => {
        //     res.send('not found')
        // })
    
})

app.get('/delete/:id', (req, res) => {
    var id = req.params.id;
    console.log('here',id)
    words.deleteOne({
        _id: id 
    }, function(err){
        if (err) {
            //console.log(err)
        }
        else {
           // res.redirect("/admin")
        }
    });
})

app.get('/edit/:id', function(req, res) {
    words.findById(req.params.id, function (err,data) {
      if (err) {
        console.log(err);
      } else {
       // res.render('edit-page', { result : data });
        res.json(data)
      }
    });
  });


app.post('/edit/:id', function(req, res) {
    var refs = [];

    var i = 1;
    while(true){
        var link = req.body["ref_link" + i]
        var name = req.body["ref_name" + i]
        if(link && name){
            i++
            refs.push({ name : name, link : link });
        }
        else{
            break;
        }
    }
    
    var rels = [];

    var j = 1;
    while(true){
        var link = req.body["rel_link" + j]
        var name = req.body["rel_name" + j]
        if(link && name){
            j++
            rels.push({ name : name, link : link });
        }
        else{
            break;
        }
    }
    const {title, details} = req.body
    const word = ({
        title,
        details,
        ref : refs,
        rel : rels
    })
    console.log(word)
  
    words.findByIdAndUpdate(req.params.id, {$set: word}, function(err){
        if(err){
            res.json('err')
            //res.send('error !!')
        }
        else {
            res.json('done')
            //res.redirect('/admin')
        }
        
    });
    
})
app.get('/search/:title',(req, res) => {
    let title = req.params.title
    const client = algoliasearch('4E5ID5Z9QX', '85dfae50da7751740327ec1d6258e8e3');
const index = client.initIndex('dev_deven');

index.search(title).then(({ hits }) => {
    res.json(hits);
  });
})

app.all('*',function(req, res) {
    res.status(404);
    res.render('404')
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

