// this is used to generate encrypted random value
const crypto = require('crypto');
// this is use to encry our password
const bcrypt=require('bcryptjs');
const User = require('../models/user');
// to work with mailing thirdparty application with node js
const nodemailer =require('nodemailer');
// to make easy use of thirdparty application senndgrid with our node application
const sendgridTransport=require('nodemailer-sendgrid-transport');
// this is to gather all the error from validation done at route position
const {validationResult}=require('express-validator/check');


// this is the setup which tell node that it has permission to use this sendgrid
const transporter =nodemailer.createTransport(sendgridTransport({
  auth:{
    api_key:'put your own id here'
  }
}));

exports.getLogin = (req, res, next) => {
  // this if condition is check if there is error message aur not in out login data if not we render message to null
  let message=req.flash('error');
  if(message.length>0){
    message=message[0];
  }
  else{
    message=null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    //this tells the view that something extra it has to render message is same as written in key part below
    errorMessage:message,
    oldInput: {
      email: '',
      password: ''
    },
    //included to mark a error if there present
    validationErrors:[]

  });
};

exports.getSignup = (req, res, next) => {
  let message=req.flash('error');
  if(message.length>0){
    message=message[0];
  }
  else{
    message=null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage:message,
    oldInput: {
      name:'',
      phoneNo:'',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors:[]

  });
};

exports.postLogin = (req, res, next) => {
  const email=req.body.email;
  const password=req.body.password;
  //checking for the input email

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
        },
        validationErrors:errors.array()

    });
  }
  
  User.findAll({where:{email:email}})
    .then(user => {
     if(!user[0]){
      
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: 'Invalid Email or Password !',
        oldInput: {
          email: email,
          password: password
          },
          validationErrors:[]
  
      });
     }
     //else checking for valid password by using compare fn 
     bcrypt.compare(password,user[0].password).then(isTrue=>{
       if(isTrue){
      //including of session in cookoes and memory
      req.session.isLoggedIn=true;
      req.session.user = user[0];
      return req.session.save(err => {
        console.log(err);
        res.redirect('/');
      });
    }
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: 'Invalid email or password.',
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: []
    });
  })
  .catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });

})
.catch(err => {
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error);
});

};


exports.postSignup = (req, res, next) => {
 const name=req.body.name;
 const phoneNo=req.body.phoneNo;
 const email=req.body.email;
 const password=req.body.password;
 const confirmPassword=req.body.confirmPassword;
 //this collect all ther error thrown during above validation and store it in a array 
 const errors =validationResult(req);
    
 if(!errors.isEmpty()){
      return res.status(404).render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage:errors.array()[0].msg,
        oldInput: {
          name:name,
          phoneNo:phoneNo,
          email: email,
          password: password,
          confirmPassword: req.body.confirmPassword
        },
        validationErrors:errors.array()
  
      });

    } 
 console.log(name,phoneNo,email,password);
 User.findAll({where:{email:email}}).then(userDoc=>{
   console.log(userDoc[0]);
   if(userDoc[0]){
     // this is when the email already exist
     req.flash('error','Email already exit pls take some other email  !');
     return res.redirect('/signup');
   }
   //the use of bcrypt.hash fnction to actually implement it
   return bcrypt.hash(password,12).then(cryptedPassword=>{
    const user=User.create({name:name ,phoneNo:phoneNo,email:email,password:cryptedPassword});
     //new user is being created
    return user;
   }).
   then(user=>{
    //adding cart fn to it
    return user.createCart();
   })
   .then(user=>{
    res.redirect('/login');
    // this the mail given to user after successfull sign up
    return transporter.sendMail({
      to: email,
      from: 'shop@node-complete.com',
      subject: 'Signup succeeded!',
      html: '<h1>You successfully signed up!</h1>'
    });

   }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });

   
 }).catch(err => {
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error);
});
};


exports.postLogout = (req, res, next) => {
  // to destroy the session from dtaabse but will not delte the cookies n browser but will logout as not matching request will be ther
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};


exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  //this is whole code to reset a password
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findAll({where:{ email: req.body.email }})
      .then(users => {
        const user=users[0];
        if (!user) {
          req.flash('error', 'No account with that email found.');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        //for how much time toke is vlid for
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.redirect('/');
        transporter.sendMail({
          to: req.body.email,
          from: 'shop@node-complete.com',
          subject: 'Password reset',
          html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
          `
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  
  });
};

exports.getNewPassword = (req, res, next) => {
  // this to check wheter it is same as we have send aur some fake one
  const token = req.params.token;
  //console.log(Date);

  User.findAll({where:{ resetToken: token} })
    .then(user => {
      console.log(user);
     if(user[0].resetTokenExpiration >Date.now()){
       
     
     
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user[0].id.toString(),
        passwordToken: token
      });}
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findAll({where:{
    resetToken: passwordToken,
   // resetTokenExpiration: { $gt: Date.now() },
    id: userId}
  })
    .then(user => {
      resetUser = user[0];
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = null;
      resetUser.resetTokenExpiration = null;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};