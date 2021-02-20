const sections = require('./services/sections');
const products = require('./services/products');

// Sections Service
exports.addSection = sections.addSection;
exports.updateSection = sections.updateSection;
exports.deleteSection = sections.deleteSection;
exports.getSectionById = sections.getSectionById;
exports.getSectionsByRestaurant = sections.getSectionsByRestaurant;

// Products Service
exports.addProduct = products.addProduct;
exports.updateProduct = products.updateProduct;
exports.deleteProduct = products.deleteProduct;
exports.uploadProductImage = products.uploadProductImage;
exports.getProductById = products.getProductById;
exports.getProductsByRestaurant = products.getProductsByRestaurant;
