// this module is use to define the absolute path 
const path = require('path');

// this is how we inclue express module 
const express = require('express');
// for data parsing module included
const bodyParser = require('body-parser');
//this is naother type to parser that parse not only text buts files also
const multer =require('multer');
// for seesion and cookies control
const session=require('express-session');
// this is use to store session into database
const MySqlStore = require('express-mysql-session')(session);
// this is included to add csrf token and checking
const csrf=require('csurf');
// this is included to add this model to flash the error in our website
const flash=require('connect-flash');

const errorController = require('./controllers/error');
const sequelize = require('./util/database');
const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');
// use of express model
const app = express();


// these two are include to tell browser we are using ejs as template
app.set('view engine', 'ejs');
app.set('views', 'views');

//this is to extraxt exact fn from the above included model
const csrfProtection=csrf();

//this is used to tell session about the database to be store data into
const sessionStore = new MySqlStore( {
    host: 'localhost', 
    port: 3306,   
    user: 'root',
    password: 'Raghav@12345!',
    database: 'raghav'
});

// this is how we want to store file in our database
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'images');
    },
    filename: (req, file, cb) => {
        console.log(file.originalname);
      cb(null,  file.originalname);
    }
  });
 //filtering for the format of particular file present there 
  const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };
  


const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// created a module to parse data taken from user when it req from it ex form 
//create a middleware which next implementewd inside it
app.use(bodyParser.urlencoded({ extended: false }));
//this is sare as above but use to parse the files in form of binary data the dest here will make a folder name images and store buffer dat in it
app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
  );
  
// this make the folder static which means public as in node we cant't access it so we have to make it static    
app.use(express.static(path.join(__dirname, 'public')));
// to make image folder as public so as to serve it from the database
app.use('/images',express.static(path.join(__dirname, 'images')));

//this will add a session middleware
app.use(session({secret:'my secret',resave:false,saveUninitialized:false,store:sessionStore}
));

//this is adding middleware for csrf token so before any render request it will search for csrfToken
app.use(csrfProtection);
//setting up a middle ware for flash so that we use it anywhere in our application now
app.use(flash());


// this the middleware to register the user so that we can use it anywhere in our project
app.use((req,res,next)=>{
   // console.log(sessionStore);
     //if any seesion is present for current user
     //throw new Error('hi');
     if(!req.session.user){
         return next();
     }
    //then find that user with given session in by user id so as to get whole user informatio till now in session.user we have simpler user model not whole relation 
    User.findByPk(req.session.user.id).then(user=>{
      //  console.log(req.session.user.id); 
         if(!user){
        return next();
        }
        // we have store it in req so that we can use it whereever we want;
         req.user=user;
        //so as to move out the middleware created
        next();
    }).catch(err=>{
        throw new Error(err);
    });
});

// the middle ware store authentication information and csrf token to be use by each view rendering data 
// it stores it locally so can be use by all
app.use((req,res,next)=>{
    //the isAuthenticated and csrfToken are now become global variable meanscan be acess from any view
    res.locals.isAuthenticated = req.session.isLoggedIn;
    console.log(res.locals.isAuthenticated);
    res.locals.csrfToken=req.csrfToken();
    next();
});

// calling of these function by imoprting then from their module
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.get('/500',errorController.get500);
app.use(errorController.get404);


// this is the special middleware which will automatically run after error is thrown anywhere
app.use((error, req, res, next) => {
  res.status(error.httpStatusCode).render('/500');
 // console.log('hi i am in this');
  res.redirect('/500');
});



//relation set ,{constraints:true  means all restrction are implementd, OnDelete:'CASCADE'} cascade means if one deleted delete it from other also
//the will add a foreign key related by adding userid and product id
Product.belongsTo(User,{constraints:true, OnDelete:'CASCADE'});
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
// the through option here said that where we want to store the item into that is cartitem model
Product.belongsToMany(Cart,{through:CartItem});
Cart.belongsToMany(Product,{through:CartItem});
User.hasMany(Order);
Order.belongsTo(User);
Order.belongsToMany(Product,{through:OrderItem});
//session.hasOne(User);




// this sync is used to tell databse to create all the models intilially and if created then ignore it
sequelize.
// this force is used to tell to make them again even if they are made to add any modification
//sync({force:true}).
sync().
then(user=>
{   // we can also create a dummy product here if intially no product is there
     app.listen(4000); 
    console.log(Date());
}).
catch(err=>{
    console.log(err);
});
