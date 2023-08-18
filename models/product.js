const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
    name : {
        type : String,
        required : [true , "Please enter your product name"],
        trim : true,
        maxlength : [100, "Product name cannot be exceed 100 characters"]
    },
    price : {
        type : Number,
        required : [true , "Please enter product price"],
        maxlength : [5, "Product price cannot be exceed 5 characters"],
        default : 0.0,
    },
    description : {
        type : String,
        required : [true , "Please enter product description"],
    },
    ratings : {
        type : Number,
        default : 0,
    },
    images : [
        {
            public_id : {
                type : String,
                required : true
            },
            url: {
                type : String,
                required : true
            },
        }
    ],
    category : {
        type : String,
        required : [true , "Please select category of your product"],
        enum : {
            values : [
                "electronics",
                "cameras",
                "laptops",
                "accessories",
                "headphones",
                "food",
                "books",
                "clothes/shoes",
                "beauty/health",
                "sports",
                "outdoor",
                "home",
            ],
            message : "Please select correct category for your product"
        }
    },
    seller : {
        type : String,
        required : [true, "Please enter product seller"]
    }, 
    stock : {
        type : Number,
        required : [true, "Please enter product stock"],
        maxlength : [5, "Stock cannot exceed 5 characters"],
        default : 0,
    },
    numOfReviews : {
        type : Number,
        default : 0,

    },
    reviews : [
       { 
        user : {
            type : mongoose.Schema.ObjectId, 
            ref : "User",
            required : true
        },
           name : {
            type : String,
            required : true,
        },

        rating : {
            type : Number,
            required : true,
        },
        comment : {
            type : String,
            required : true,
        }
    }
    ],

    user : {
        type : mongoose.Schema.ObjectId, 
        ref : "User",
        required : true
    },
    
    createdAt : {
        type : Date,
        default : Date.now,
    }
})

module.exports = mongoose.model("product", productSchema);