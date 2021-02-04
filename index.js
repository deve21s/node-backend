const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const session = require('express-session')
const cors = require('cors')
const algoliasearch = require('algoliasearch');

const words = require('./models/words')
const User = require('./models/user')
require('dotenv').config()
const app = express()
app.use(cors())



app.set("view engine" , "ejs")
app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(
    session({ 
        secret : 'devendra',
        resave : false,
        saveUninitialized : false
    }))

 



mongoose.connect(process.env.MONGODB_URI,{ useNewUrlParser: true,  useUnifiedTopology: true  })
    .then(() => app.listen(process.env.PORT || 5000, () => {
        console.log("server is started and data base is connected")
    }))
    .catch((err)=> console.log(err))


const alphabet = ['a','b','c','d','e','f','g','h','i','j','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];


const client = algoliasearch('4E5ID5Z9QX', '85dfae50da7751740327ec1d6258e8e3');
const index = client.initIndex('dev_deven');

index.search('om').then(({ hits }) => {
    console.log(hits);
  });

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

app.get('/', (req,res) => {
    // words.find()
    //     .then((result) => {
    //         res.json(result)
    //     })
    //     .catch
    //         res.json('not found')

    words.find().exec((err, data) => {
                if(data) {
                    // res.render('home', {result : data, alphabet, letter})
                    res.json(data)
                }else{
                    res.send('not found')
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
    console.log(req.body)
    const {title, details} = req.body
    const word = new words ({
        title, 
        details,
        ref : refs,
        rel : rels
    })
    await word.save();
    res.redirect(`details/${word.id}`)
})

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

app.get('/login',(req,res) => {
    if(!req.session.user_id){
        res.render('login')
    }
    else{
        res.redirect('/admin')
    }
    
})
app.post('/login', async(req,res) => {
    const { email, password } = req.body;
    const user = await User.findOne({email : email})
    const validpassword = await bcrypt.compare(password, user.password)
    if(validpassword){
        req.session.user_id = user._id;
         let userId = user._id
        res.json(userId)
        console.log(userId)
        // console.log('valid')
        // res.redirect('/admin')
    }//else {
    //     console.log('notvalid')
    //     res.redirect('/login')
    // }
})
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
    words.findById(id)
        .then(result => {
            console.log(result)
            //res.render('details', {result: result}) 
            res.json(result)       
        })
        .catch(() => {
            res.send('not found')
        })
    
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
  
    words.findByIdAndUpdate(req.params.id, {$set: word}, function(err, result){
        if(err){
            res.send('error !!')
        }
        else {
            res.redirect('/admin')
        }
        
    });
    
})

app.all('*',function(req, res, next) {
    res.status(404);
    res.render('404')
});
  
   
