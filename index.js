const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const session = require('express-session')

const words = require('./models/words')
const User = require('./models/user')
require('dotenv').config()

const app = express()

app.set("view engine" , "ejs")
app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(
    session({ 
        secret : 'devendra',
        resave : false,
        saveUninitialized : false
    }))

 

// const dburl = process.env.dburl

mongoose.connect(process.env.dburl,{ useNewUrlParser: true,  useUnifiedTopology: true  })
    .then(() => app.listen(process.env.PORT || 3000, () => {
        console.log("server is started and data base is connected")
    }))
    .catch((err)=> console.log(err))


const alphabet = ['a','b','c','d','e','f','g','h','i','j','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];

app.get('/', (req,res) => {
    let letter = 'a';
    words.find({"title": {$regex: '^' + letter, $options: 'i'}}).exec((err, data) => {
        if(data) {
            res.render('home', {result : data, alphabet, letter})
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

app.get('/admin/login',(req,res) => {
    if(!req.session.user_id){
        res.render('login')
    }
    else{
        res.redirect('/admin')
    }
    
})
app.post('/admin/login', async(req,res) => {
    const { email, password } = req.body;

    const user = await User.findOne({email : email})
    const validpassword = await bcrypt.compare(password, user.password)
    if(validpassword){
        req.session.user_id = user._id 
        res.redirect('/admin')
    }else {
        res.redirect('/admin/login')
    }
})
app.get('/admin', (req, res) => {
    if(req.session.user_id){
        words.find({}).sort('-createdAt').exec((err, data)=> {
            if(data) {
                res.render('admin', {result : data})
            }else {
                res.send('no data')
            }
        })
    //     .then(result => {
    //         res.render('admin', {result})
    //     })
    //     .catch(() => {
    //         res.send('no data')
    //     })
    }else{
        res.redirect('/admin/login')
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
                res.render('home', {result : data, alphabet, letter})
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
            res.render('details', {result: result})        
        })
        .catch(() => {
            res.send('not found')
        })
    
})

app.post('/delete/:id', (req, res) => {
    var id = req.params.id;

    words.deleteOne({
        _id: id 
    }, function(err){
        if (err) {
            console.log(err)
        }
        else {
            res.redirect("/admin")
        }
    });
})

app.get('/edit/:id', function(req, res) {
    words.findById(req.params.id, function (err,data) {
      if (err) {
        console.log(err);
      } else {
        res.render('edit-page', { result : data });
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
  
   
