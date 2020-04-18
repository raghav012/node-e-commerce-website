const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');

const isAuth=require('../middleware/is-auth');

//the is auth is extra middle ware added for restricting direct uses without login
// router is same as app.use/post/get just a simple name to make it easy
const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/cart',isAuth, shopController.getCart);

router.post('/cart',isAuth, shopController.postCart);

router.post('/cart-delete-item',isAuth, shopController.postCartDeleteProduct);

router.post('/cart/add',isAuth, shopController.postAddQuantity);

router.post('/create-order',isAuth, shopController.postCreateOrder);


// :Id denotes that after / it can take any value so to be put after any value 
router.get('/products/:Id', shopController.getProduct);

router.get('/orders',isAuth, shopController.getOrders);


router.get('/orders/:orderId', isAuth, shopController.getInvoice);

router.get('/checkout',isAuth, shopController.getCheckout);

module.exports = router;
