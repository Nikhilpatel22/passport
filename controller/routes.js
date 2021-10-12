const express = require('express');
const router = express.Router();
const bodyparser = require('body-parser');
const bcrypt = require('bcryptjs');
const User = require('../models/user'); 
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

router.use(bodyparser.urlencoded({ extended:true }));

router.use(cookieParser('secret'));
router.use(session({
   secret : 'secret',
   maxAge : 3600000,
   resave : true,
   saveUninitialized : true
}))

router.use(passport.initialize());
router.use(passport.session());

router.use(flash());

//global variable
router.use(function(req, res, next){
      res.locals.success_message = req.flash('success_message');
      res.locals.error_message = req.flash('error_message');
      res.locals.error = req.flash('error');
      next();
})

const checkAuthenticated = function(req, res, next){
   if(req.isAuthenticated()){
      res.set('cache-control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre=check=0');
      return next();
   }else
   {
      res.redirect('/login');
   }
}

router.get('/',(req,res)=>{
	res.render('register');
})

router.post('/register',(req,res)=>{
   var {fname,lname,email,password,cpassword } = req.body;
   //res.render('login');
   var err;
   if(!fname || !lname || !email || !password || !cpassword){
   	err = "please fill all the fields";
    res.render('register',{'err':err});
    }
    if(password != cpassword){
    	err = "password don't match";
    res.render('register',{'err':err, 'fname' : fname ,'lname' : lname, 'email' : email});
  }
  if(typeof err == 'undefined'){
  	User.findOne({ email : email},function(err,data){
  		if(err) throw err;
  		if(data){
  			console.log("user exist");
  			err = "user already exist with this email...";
  			res.render('register',{'err':err, 'fname' : fname ,'lname' : lname, 'email' : email});			
  		}else{
  			bcrypt.genSalt(10,(err,salt)=>{
  				if(err) throw err;
  				bcrypt.hash(password, salt,(err, hash)=>{
  					if(err) throw err;
  					password = hash;
  					User({
  						fname,lname,email,password,
  					}).save((err,data)=>{  
  						if(err) throw err;
                  req.flash('success_message','register successfully....login to continue.');
  						res.redirect('/login');
  					});
  				});
  			})
  		}
  	})

  }  
})


//authentication strategy

var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy({ usernameField : 'email' },(email,password,done)=>{
   User.findOne({ email : email },(err, data)=>{
      if(err) throw err;
      if(!data){
         return done(null, false, { message : "user does't exist...."});
      }
      bcrypt.compare(password, data.password, (err, match)=>{
         if(err){
            return done(null, false);
         }
         if(!match){
            return done(null, false, { message : "password wrong.."});
         }
         if(match){
            return done(null, data);
         }
      });
   });
}));

passport.serializeUser(function (user, cb) {
   cb(null,user.id);
});

passport.deserializeUser(function (id, cb){
   User.findById(id, function(err, user){
      cb(err, user);
   });
});

router.get('/login',(req,res)=>{
	res.render('login');
})

router.post('/login',(req,res,next)=>{
   passport.authenticate('local',{
      failureRedirect : '/login',
      successRedirect : '/success',
      failureFlash : true,
   })(req,res,next);
});

router.get('/success', checkAuthenticated ,(req,res)=>{
   res.render('success', { 'User' : req.user});
})
router.get('/logout',(req,res)=>{
   req.logout();
   res.redirect('/login');
})

//router.post('/addmsg', checkAuthenticated,(req,res)=>{
  // User.findOneAndUpdate({ email : req.user.email },
   //{ $push : {
     //    messages : req.body['msg']
     // } },(error, success)=>{
     // if(error) throw error;
      //if(success) console.log("message successfull....");
   //}
   //);
   //res.redirect('/success');
//});
module.exports = router;