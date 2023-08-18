const User = require("../models/user");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../middlewares/catchAsyncError")
const sendToken = require("../utils/jwtToken");
const sendMail = require("../utils/sendMail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");
const { url } = require("inspector");
// const user = require("../models/user");

// registering a user => api/v1/register
exports.registerUser = catchAsyncError (async (req, res, next) => {
    const { name , email, password} = req.body;
    const result  = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder : "avatars",
        width : 150,
        crop : "scale"
    })

    const user = await User.create({
        name,
        email,
        password,
        avatar : {
            public_id : result.public_id,
            url : result.secure_url 
        }
    })

    sendToken(user, 200, res);
})

// Login user => api/v1/login

exports.loginUser = catchAsyncError (async (req, res, next) => {
    const {email, password} = req.body;

    
    //check if email and passsword is entered by user
    if(!email || !password){
        return next(new ErrorHandler("Please enter email & password", 400))
    }

    //finding user in database
    const user = await User.findOne({ email }).select("+password");

    if(!user){
        return next(new ErrorHandler("Invalid email and password", 401))
    }

    //checks if password is correct or not
    const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    // const token = user.getJwtToken();               // this code replaced by sendtoken code

    // res.status(200).json({
    //     success : true,
    //     token
    // })

    sendToken(user, 200, res);
});

//forgot  password : api/v1/password/forgot

exports.forgotPassword = catchAsyncError (async (req, res, next) =>  {

    const user = await User.findOne({email : req.body.email});
    
    if(!user){
    return next(new ErrorHandler("User not found with this email", 404));
    }

    //get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave : false});

    // const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}` // for deployment
    const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}` // for producttion 

    const message = `Your password reset token is as follows : \n\n${resetUrl}\n\nIf you have not requested email, then ignore it.`


    try {
        await sendMail ({
            email : user.email,
            subject : "ShopIt password recovery",
            message
        })

        res.status(200).json({
            success : true,
            message : `Email sent to : ${user.email}`
        });

    } catch (error) {
        user.resetPasswordToken  = undefined;
        user.resetPasswordExpire  = undefined;

        await user.save({ validateBeforeSave : false});

        return next(new ErrorHandler (error.message, 500))
    }
})

//reset password : api/v1/password/reset/:token

exports.resetPassword = catchAsyncError (async (req, res, next) =>  {
    //hash URL token
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire : {$gt : Date.now()}
    })

    if(!user){
        return next(new ErrorHandler("Password reset token is invalid or has been expired", 400))
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Password does not match", 400))
    }

    //set up new password
    user.password = req.body.password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire  = undefined;

    await user.save();

    sendToken(user, 200, res)
});

//Get currently logged in user detail  => api/v1/me

exports.getUserProfile = catchAsyncError(async (req, res, next) => {
     const user = await User.findById(req.user.id);

     res.status(200).json({
        success : true,
        user
     })
})


// update / change password  => api/v1/password/update

exports.updatePassword = async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password")

    //check previous user password
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if(!isMatched){
        return next(new ErrorHandler("old password is incorrect", 400))
    };

    user.password  = req.body.password;
    await user.save();

    sendToken(user, 200, res)
}

//update user profile --> /api/v1/me/update

exports.updateProfile = catchAsyncError(async (req, res, next) => {
    const newUserData = {
        name : req.body.name,
        email : req.body.email
    }

    
    if(req.body.avatar !== ""){
        const user = await User.findById(req.user.id);
        const image_id = await user.avatar.public_id;
        const res = await cloudinary.v2.uploader.destroy(image_id)

        const result  = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder : "avatars",
            width : 150,
            crop : "scale"
        })

        newUserData.avatar = { 
            public_id : result.public_id ,
            url : result.secure_url
        }
    }
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new : true,
        runValidators : true,
        useFindAndModify : false,
    })

    res.status(200).json({
        success : true,
    })
})

// logout user : api/v1/logout
exports.logout = catchAsyncError(async (req, res , next) => {
    res.cookie("token", null, {
        expires : new Date(Date.now()),
        httpOnly : true,
    });

    res.status(200).json({
        success : true,
        message : "Logged out"
    })
})

//admin routes

//get all users  => api/v1/admin/users

exports.getAllUsers = catchAsyncError (async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        users,
        success : true
    })
})

//get users details
exports.getUserDetails = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id)

    if(!user){
        return next (new ErrorHandler(`User doesn't found with id : ${req.params.id}`))
    }

    res.status(200).json({
        success : true,
        user
    })
})


//update user profile --> /api/v1/admin/user/:id

exports.updateUser = catchAsyncError(async (req, res, next) => {
    const newUserData = {
        name : req.body.name,
        email : req.body.email,
        role : req.body.role
    }

    
   
    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new : true,
        runValidators : true,
        useFindAndModify : false,
    })

    res.status(200).json({
        success : true,
    })
})


//delete user
exports.deleteUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id)

    if(!user){
        return next (new ErrorHandler(`User doesn't found with id : ${req.params.id}`))
    }

    //remove avatar from cludinary 
    const image_id = await user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(image_id)


    await user.remove();

    res.status(200).json({
        success : true,
    })
})
