import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import userModel from './models/user.js';
import postModel from './models/post.js';
// import User from './models/user.js';
import multer from 'multer';
import {upload} from './config/multerconfig.js';
import dotenv from 'dotenv';
import session from "express-session";
import flash from "connect-flash";
dotenv.config();
const port=(process.env.PORT || 5000);

const app = express();

app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

app.use((req, res, next) => {
    res.locals.error = req.flash("error");
    next();
});
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
app.post('/create', async (req, res) => {
    try {
        const { username, name, age, email, password } = req.body;

        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.redirect('/login');  
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const user = await userModel.create({
            username,
            name,
            age,
            email,
            password: hash
        });

        const token = jwt.sign(
            { email: user.email, userid: user._id },
            process.env.SECRET_KEY        );

        res.cookie("token", token, {
            httpOnly: true
        });

        return res.redirect('/profile');  
    }
    catch (err) {
        console.log(err);
        return res.send("Error occurred");
    }
});

app.get("/change",(req,res)=>{
    res.render("test");
})
app.post("/profile/upload", isLoggedIn ,upload.single("file"),async (req,res)=>{
    let user=await userModel.findOne({email:req.user.email});
    user.profile=req.file.filename;
    await user.save();
    console.log(req.file);
    res.redirect("/profile");
})

app.get('/login',autologin, (req, res) => {
  res.render('login')
});

app.post("/login",async (req,res)=>{
    const {email,password}=req.body;
    let user=await userModel.findOne({email});
    if(!user){return res.redirect('/create');}
    else{
    bcrypt.compare(password, user.password, (err, result) => {
    if (err) {
        return res.send("Error comparing passwords");
    }

    if (!result) {
        req.flash("error","incorrect password")
       return res.redirect('/login')
    }

    res.clearCookie("token");

    const token = jwt.sign(
        { email: user.email, userid: user._id },
        process.env.SECRET_KEY,
        { expiresIn: "1d" }
    );

   res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
});

    return res.redirect("/profile");
});

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
    return res.redirect('/profile');
})

app.get('/update/:id',async (req,res)=>{
    let post=await postModel.findById(req.params.id)
    
    res.render("update",{id:req.params.id, content:post.content});
})

app.post('/update/:id',async (req,res)=>{
    let post=await postModel.findOne({_id:req.params.id});
    post.content=req.body.content;
    await post.save();
   return res.redirect('/profile');
    })

app.get('/profile', isLoggedIn, async (req,res)=>{
    let user=await userModel.findOne({email:req.user.email}).populate('posts');
    // console.log(user.postModels)
    res.render('profile',{user,posts:user.posts});
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
    // console.log(postModel)
    return res.redirect('/profile');
})

app.get("/logout",(req,res)=>{
    res.cookie("token","", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
});
    return res.redirect('/');
});

function isLoggedIn(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect("/login");
    }

    try {
        const data = jwt.verify(token, process.env.SECRET_KEY);
        req.user = data;
        return next();
    } catch (err) {
        res.clearCookie("token");
        return res.redirect("/login");
    }
}

function autologin(req,res,next){
    if(!req.cookies.token){
        next()
    }
    else{
        return res.redirect('/profile')
    }
}

app.listen(port,(req,res)=>{
    console.log(`running on ${port}`)
}) 