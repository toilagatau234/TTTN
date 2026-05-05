const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const wrappers = await Product.find({ product_type: 'wrapper' }).select('name dominant_color secondary_colors');
    const ribbons = await Product.find({ product_type: 'ribbon' }).select('name dominant_color secondary_colors');
    const flowers = await Product.find({ product_type: 'flower_component' }).select('name dominant_color secondary_colors role_type');
    console.log("Wrappers:", JSON.stringify(wrappers, null, 2));
    console.log("Ribbons:", JSON.stringify(ribbons, null, 2));
    console.log("Flowers:", JSON.stringify(flowers, null, 2));
    process.exit(0);
}
check();
