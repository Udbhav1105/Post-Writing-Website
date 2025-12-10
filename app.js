const express = require('express');
const bcrypt = require('bcrypt');
const jwt=require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const userModel=require('./models/user');
const postModel=require('./models/post');
const user = require('./models/user');

const app = express();
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.json());

app.get('/', (req, res) => {
  res.render("home");
});

app.get('/create', (req, res) => {
  res.render('create')
});
app.post('/create', (req, res) => {
    const { username, name, age, email, password } = req.body;
     bcrypt.genSalt(10,async (err,salt)=>{
      let hash= await bcrypt.hash(password,salt);
            let user=await userModel.create({
                username,
                name,
                age,
                email,
                password:hash
            })
            let token=jwt.sign({email,userid:user._id},'key');
            res.cookie("token", token)
              
        })
        res.redirect('/login');
    })

app.get('/login', (req, res) => {
  res.render('login')
});

app.post("/login",async (req,res)=>{
    const {email,password}=req.body;
    let user=await userModel.findOne({email});
    if(!user) res.redirect('/create');
    else{
        bcrypt.compare(password,user.password, async (err,result)=>{
            if(!result) res.send('something went wrong');
            else{
                res.clearCookie("token");
                let token=jwt.sign({email,userid:user._id},'key');
                res.cookie("token",token);   
                res.redirect('/profile');
            }
        })
    }
})

app.get('/like/:id', isLoggedIn ,async (req,res)=>{
    let post=await postModel.findOne({_id:req.params.id});
    if(post.likes.indexOf(req.user.userid) === -1){
         post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid) ,1);
    }
    await post.save();
    res.redirect('/profile');
})

app.get('/update/:id',(req,res)=>{
    res.render("update",{id:req.params.id});
})

app.post('/update/:id',async (req,res)=>{
    let post=await postModel.findOne({_id:req.params.id});
    post.content=req.body.content;
    await post.save();
    res.redirect('/profile');
    })

app.get('/profile', isLoggedIn, async (req,res)=>{
    let user=await userModel.findOne({email:req.user.email}).populate('posts');
    // console.log(user.posts)
    res.render('profile',{user,post:user.posts});
})

app.post('/post', isLoggedIn , async (req,res)=>{
    let user=await userModel.findOne({email: req.user.email});
    let {content}=req.body;
   let post=await postModel.create({
        userid:user._id,
        content
    })
    user.posts.push(post._id);
    await user.save();
    // console.log(post)
    res.redirect('/profile');
})

app.get("/logout",(req,res)=>{
    res.cookie("token","");
    res.redirect('/login');
});

function isLoggedIn(req,res,next)
{
    if
    (req.cookies.token === "") res.redirect("/login");
    else{
        let data=jwt.verify(req.cookies.token, 'key');
        req.user=data;
        // console.log(req.user);  
        next();
    }
}

app.listen(3000) 