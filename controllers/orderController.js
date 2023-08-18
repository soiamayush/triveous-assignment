const Order = require("../models/order");

const catchAsyncErrors = require("../middlewares/catchAsyncError");
const ErrorHandler  = require("../utils/errorHandler");
const Product = require("../models/product");

//create a new order  => api/v1/add/new

exports.newOrder = catchAsyncErrors (async (req, res, next) => {

    const  {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo
    } = req.body;

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt : Date.now(),
        user : req.user._id
    });

    res.status(200).json({
        success : true,
        order
    })
})


//get single order => api/v1/order/:id

exports.getSingleOrder = catchAsyncErrors (async (req, res, next) => {

    const order = await Order.findById(req.params.id).populate("user", "name email");

    if(!order){
        return next (new ErrorHandler("No order found with this ID", 404))
    }

    res.status(200).json({
        success : true,
        order
    })
})

//get logged in user orders => api/v1/orders/me

exports.myOrders = catchAsyncErrors(async (req, res, next) => {

    const orders = await Order.find({user : req.user.id});


    res.status(200).json({
        success : true,
        orders
    })
})

//get all orders - admin => api/v1/admin/orders

exports.allOrders = catchAsyncErrors(async (req, res, next) => {

    const orders = await Order.find({user : req.user.id});

    let totalAmount = 0;
    orders.forEach( order => {
        totalAmount += order.totalPrice
    })

    res.status(200).json({
        success : true,
        totalAmount,
        orders
    })
});


// update/process order  - admin => api/v1/admin/order/:id

exports.updateOrder = catchAsyncErrors(async (req, res, next) => {

    const order = await Order.findById(req.params.id);

    if(order.orderStatus === "Delivered"){
        return next(new ErrorHandler("Your product have already been delivered", 400))
    };

    order.orderItems.forEach(async item => {
        await updateStock (item.product, item.quantity)
    });

    order.orderStatus = req.body.status;
    order.deliveredAt = Date.now();

    await order.save();

    res.status(200).json({
        success : true,
    })
})

async function updateStock(id, quantity){
    const product = await Product.findById(id);

    product.stock = product.stock - quantity;

    await product.save({ validateBeforeSave : false});
}

//delete order => api/v1/order/:id
exports.deleteOrder = catchAsyncErrors (async (req, res, next) => {

    const order = await Order.findById(req.params.id).populate("user", "name email");

    if(!order){
        return next (new ErrorHandler("No order found with this ID", 404))
    }

    await order.remove();

    res.status(200).json({
        success : true
    })
})