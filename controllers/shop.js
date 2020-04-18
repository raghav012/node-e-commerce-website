// use to create a pdf  with data streming 
const PDFDocument =require('pdfkit');
const fs = require('fs');
const path = require('path');
const Product = require('../models/product');
const Cart = require('../models/cart');
const Order = require('../models/order');
const OrderItem = require('../models/order-item');
const sequelize =require('sequelize');
const ITEMS_PER_PAGE=1;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1 ;
  let x=(page-1)*ITEMS_PER_PAGE;
   let totalProduct;
   let totalItem;
   //this here is used to count total number of enteries in product table
   totalProduct= Product.findAll({
    attributes: [ [sequelize.fn('COUNT', 'id'), 'counts']]
   
  });
    totalProduct.then(ans=>{
    totalItem=ans[0].dataValues.counts;
  });
  
  //this findAll() is a fn of sequel to fetch all the data from dtabase in product table
  //this inside findall  are limit means pic per page and offset is how many to neglect before picking
  Product.findAll({ limit: ITEMS_PER_PAGE,offset:x })
  .then((product) => {
    res.render('shop/product-list', {
      prods: product,
      pageTitle: 'All Products',
      path: '/products',
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItem,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItem / ITEMS_PER_PAGE)

      
  });
});
};

exports.getCart = (req, res, next) => {
 console.log(req.users);
  
  //the magic function created due to association getCart()
  req.user.getCart()
  .then(cart=>{
     //the magic function created due to association getProducts() as we have set a many to many relation
      cart.getProducts().then(product=>{
        res.render('shop/cart', {
          path: '/cart',
          pageTitle: 'Your Cart',
          products: product,
          
          
      });
  }).
  catch(err=>{
    console.log(err);
    });
  });
  };


exports.postAddQuantity = (req, res, next) => {
  const prodId = req.body.id;
  let fetchCart;
  req.user.getCart().then(cart=>{
   fetchCart=cart;
   return cart.getProducts({where:{id:prodId}});
  }).then(products=>{
    const product=products[0];
    const newQuantity=product.cartItem.quantity +1;
    //the magic function created due to association addProduct() the {through:{quantity:newQuantity} is done as we have set up this in their  relation defination
    return fetchCart.addProduct(product,{through:{quantity:newQuantity}});
  }).then(()=>{
    res.redirect('/cart');
  }).
  catch(err=>{
    console.log(err);
    });
  
  
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
 // console.log(prodId);
  let fetchCart;
  let newQuantity=1;
  req.user.getCart().then(cart=>{
    fetchCart=cart;
    return cart.getProducts({where:{id:prodId}});
  })
    .then(products=>{
      let product;
      if(products.length>0){
        product=products[0];
      }
      if(product){
        const oldQuantity=product.cartItem.quantity;
        newQuantity=oldQuantity+1;
       return product;
      }
      return Product.findByPk(prodId);
           

    }) .then(prod=>{
       console.log('hi',prod);
      return fetchCart.addProduct(prod,{through:{quantity:newQuantity}});
    }).then(result=>{
      res.redirect('/cart');
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

  
 
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.id;
  let fetchCart;
  let newQuantity;
  req.user.getCart().then(cart=>{
    fetchCart=cart;
    return cart.getProducts({where:{id:prodId}});
  })
    .then(products=>{
      const product=products[0];
      const oldQuantity=product.cartItem.quantity;
       if(oldQuantity>1){  
      newQuantity=oldQuantity-1;
      return fetchCart.addProduct(product,{through:{quantity:newQuantity}});
      }
       // this will delete the item in cart and not the actual product 
       // .cartItem is also the magic fn given to us as we have mention it in the through column
      return product.cartItem.destroy();
    }).then(result=>{
      res.redirect('/cart');
    }).catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

 
};
exports.getProduct = (req, res, next) => {
    console.log('i am here');
  //the param is used to fetch data from 
  const prodId=req.params.Id;
    Product.findAll({where:{id:prodId}})
    .then((product) =>//product here include all values so we have to define it by product[0]
      {
      res.render('shop/product-detail',{
        product: product[0],
        pageTitle: 'Details',
        path: '/products',
        
      });
    });
    
};

exports.getIndex = (req, res, next) => {

  const page = +req.query.page || 1 ;
  let x=(page-1)*ITEMS_PER_PAGE;
   let totalProduct;
   let totalItem;
  totalProduct= Product.findAll({
    attributes: [ [sequelize.fn('COUNT', 'id'), 'counts']]
   
  });

  totalProduct.then(ans=>{
    totalItem=ans[0].dataValues.counts;
  });

  Product.findAll({ limit: ITEMS_PER_PAGE,offset:x })
  .then((product) => {
    res.render('shop/index', {
      prods: product,
      pageTitle: 'Shop',
      path: '/', 
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItem,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItem / ITEMS_PER_PAGE)

      
    });
  });
};

exports.getCheckout = (req, res, next) => {
   console.log('i am here');
  req.user.getCart()
  .then(cart=>{
     //the magic function created due to association getProducts() as we have set a many to many relation
      cart.getProducts().then(products=>{
        
        let total = 0;
        products.forEach(p => {
         
          total += p.cartItem.quantity * p.price;
        });
        console.log(total); 
        res.render('shop/checkout', {
            path: '/checkout',
            pageTitle: 'Checkout',
            products: products,
            totalSum: total
          });
 
  
  }).
  catch(err=>{
    console.log(err);
    });
});
}




exports.postCreateOrder=(req,res,next)=>{
  let fetchCart;
  req.user.getCart().
  then(cart=>{
      fetchCart=cart;
      return cart.getProducts();
  }).
  then(products=>{
    return req.user.createOrder().
    then(order=>{
      //this .map is  impotant it is used to store the quantity of items in order-item as simce there are many product with differnet quantity we can't use the property {through:{quantity:newQuantity}} as it only helpfull for single product
      return order.addProduct(products.map(product=>{
        product.orderItem={quantity:product.cartItem.quantity};
        
        return product;
      }));
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

  }).then(()=>{
    // this done to delete all the items in the cart
    fetchCart.setProducts(null);
    res.redirect('/orders');
  }).catch(err=>{
    console.log(err);
  });
  };



exports.getOrders = (req, res, next) => {
  // we have included this  {include:['products']} as we don't have orderItem intilally so we ask it to include all the products inside order and work accordingly  and to handle the map use in 
  req.user.getOrders({include:['products']}).
  then(orders=>{
    //console.log(orders);
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders:orders,
      
    });
  });
  
};




exports.getInvoice = (req, res, next) => {
  // fetching of the orderId that define particular order
  const orderId = req.params.orderId;
    //this defiens the name of pdf which we want to save 
  const invoiceName = 'invoice-' + orderId + '.pdf';
   //the path of the folder where we wnat ot store the gereated file
   //header setting of your file
  const invoicePath = path.join('data', 'invoices', invoiceName);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
  'Content-Disposition',
  'inline; filename="' + invoiceName + '"'
  );
  //intializtion of pdfkit
  const pdfDoc = new PDFDocument;
  //starte the output streaming
  pdfDoc.pipe(fs.createWriteStream(invoicePath));
  pdfDoc.pipe(res);
// // //      //setting size and actual data to display
   pdfDoc.fontSize(26).text('Invoice', {
   underline: true
   });
   pdfDoc.text('-----------------------');
   let totalPrice =0;


  req.user.getOrders({include:['products']}).
  then(orders=>{
    orders.forEach(order => {
          console.log(order.id,"\n");  
       if(order.id==orderId && order.userId.toString() === req.user.id.toString()){
           order.products.forEach(prod=>{
             //console.log(prod.title,'/n');
             totalPrice += prod.orderItem.quantity * prod.price;
            // console.log(totalPrice);
             pdfDoc
              .fontSize(14)
              .text(
                prod.title +
                  ' - ' +
                  prod.orderItem.quantity +
                  ' x ' +
                  '$' +
                  prod.price
              );
    
           })
         }
     });
     pdfDoc.text('---');
     console.log(totalPrice);
        pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);
 // // // this mark the ending of file
        pdfDoc.end();
    
  });
 
      
      };
