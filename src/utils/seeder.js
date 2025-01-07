const products = require("../data/products.json");
const product = require("../models/productModel");
const dotenv = require('dotenv')
dotenv.config({path : 'backend/config/config.env'});
const connectDatabase = require('../config/database');
connectDatabase();


const seedProducts = async () => {
    try {
        await product.deleteMany();
        console.log("All products deleted successfully")

        await product.insertMany(products);
        console.log("All products inserted successfully")
    } catch (err) {
        console.log(err.message)
    }
    process.exit()
}

seedProducts();