const { matchProducts } = require('./productMatcher');

// Mock products
const mockProducts = [
    {
        name: "Romantic Rose Basket",
        category: { name: "basket" },
        dominant_color: "red",
        occasion: ["birthday", "anniversary"],
        style: ["luxury"],
        main_flowers: ["rose", "baby breath"]
    },
    {
        name: "Sunshine Bouquet",
        category: { name: "bouquet" },
        dominant_color: "yellow",
        occasion: ["birthday", "opening"],
        style: ["gentle"],
        main_flowers: ["sunflower", "lily"]
    },
    {
        name: "Elegant White Box",
        category: { name: "box" },
        dominant_color: "white",
        occasion: ["wedding", "anniversary"],
        style: ["minimalist"],
        main_flowers: ["tulip", "orchid"]
    },
    {
        name: "Cute Sunflower Jar",
        category: { name: "basket" },
        dominant_color: "yellow",
        occasion: ["birthday"],
        style: ["cute"],
        main_flowers: ["sunflower"]
    },
    {
        name: "Luxury Red Stand",
        category: { name: "stand" },
        dominant_color: "red",
        occasion: ["opening"],
        style: ["luxury"],
        main_flowers: ["rose", "gerbera"]
    }
];

// Example Input
const entities = {
    category: "basket",
    flower_types: ["rose", "sunflower"],
    color: "red",
    occasion: "birthday",
    style: "luxury"
};

console.log("--- INPUT ENTITIES ---");
console.log(JSON.stringify(entities, null, 2));

const results = matchProducts(entities, mockProducts);

console.log("\n--- TOP 5 MATCHING PRODUCTS ---");
results.forEach((p, i) => {
    console.log(`${i+1}. ${p.name} (Score: ${p.matchScore})`);
    console.log(`   Matches: ${p.category.name}, ${p.dominant_color}, [${p.occasion.join(', ')}], [${p.style.join(', ')}], [${p.main_flowers.join(', ')}]`);
});
