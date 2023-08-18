//this file first delete all the user and then add all nine from product.json
const Product = require("../models/product")
const dotenv = require("dotenv");
const connectDatabase = require("../config/database");

const product = require("../data/product.json");


// setting dot env file
dotenv.config({path : "backend/config/config.env"})


connectDatabase();

const seedProducts = async () => {
    try{

        await Product.deleteMany();
        console.log("products are deleted");

        await Product.insertMany(product);
        console.log("All products are added.")

        process.exit();


    }catch(err){
        console.log(`seeder message :  ${err.message}`);
        process.exit();
    }
}

seedProducts();