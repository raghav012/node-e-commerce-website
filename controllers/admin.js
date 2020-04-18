const Product = require('../models/product');
const user = require('../models/user');
const Cart=require('../models/cart');
const fs = require('fs');
const path = require('path');
const fileHelper = require('../util/file');



const { validationResult } = require('express-validator/check');

//const Product = require('../models/product');

const p = path.join(
  path.dirname(process.mainModule.filename),
  'data',
  'cart.json'
);

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing:false,
    hasError:false,
    errorMessage: null,
    validationErrors: []
    
  });
};
exports.getProducts = (req, res, next) => {
  req.user.getProducts().then(products => {
    console.log('hi i ma in');
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products',
    });
  });
};
exports.getEditProduct = (req, res, next) => {
  // this is use to fetch the extra parameter which we have passed in our url after the question mark for more see the admin/product.ejs file at edit link option
  const editMode =req.query.edit;
  if(!editMode){
    return res.redirect('/');
  }
  
  const prodId=req.params.productId;
  req.user.getProducts(({where:{id:prodId}}))
  .then(product=>{
    if(!product){
      return res.redirect('/');
    }
    //console.log(product,editMode);
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing:editMode,
      product:product[0],
      errorMessage: '',
        validationErrors: []
    });
  })
  .catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
 
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
   
    if(!image){
      return res.status(422).render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/edit-product',
        editing: false,
        hasError: true,
        product: {
          title: title,
          price: price,
          description: description
        },
        errorMessage: 'please enter a valid image',
        validationErrors: []
      }); 
    }

   const imageUrl=image.path;
  //console.log(req.user.id);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/edit-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }
  // the special fn name createProduct is made because we have set up a association between them in app js file that why it created
  req.user
  .createProduct({
   title:title,
   price:price,
   imageUrl:imageUrl,
   description:description 
 }).then(result=>{
   console.log("product added");
   res.redirect('/');
   
 }).catch(err => {
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error);
});

};

exports.postEditProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const prodId=req.body.id;

  const errors = validationResult(req);
  console.log('hi i ma in');
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }
  
  Product.findAll({where:{id:prodId}}).then(product=>{
    product[0].title=title;
     product[0].price=price;
      if(image){
        fileHelper.deleteFile(product[0].imageUrl);

     product[0].imageUrl=image.path;
         } 
     product[0].description=description;
      //.save is used to save the changes as updated in product in database 
      return product[0].save();
      
   })
   .then(result=>{
     console.log("product updated");
     res.redirect('/admin/products');
   }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });

};

exports.postDeleteProduct = (req, res, next) => {
  const prodId=req.body.id;
  
  Product.findByPk(prodId)
    .then(product=>{
      if (!product) {
        return next(new Error('Product not found.'));
      }
      fileHelper.deleteFile(product.imageUrl);

    return product.destroy();  
   })
   .then(result=>{
     console.log("product deleted");
     res.redirect('/admin/products');
   }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });

};