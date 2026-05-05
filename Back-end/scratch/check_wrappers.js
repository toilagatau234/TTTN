const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config({ path: '../.env' });

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const wrappers = await Product.find({ product_type: 'wrapper' }).select('name dominant_color');
    console.log("Wrappers:", wrappers);
    process.exit(0);
}
check();
