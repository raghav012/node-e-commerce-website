//this middle ware is made normallyto restrict direct vising of site without logging such as localhost:3000/cart etc
module.exports=(req,res,next)=>{
    if(!req.session.isLoggedIn){
        return res.redirect('/login');
    }
    next();
}