const restaurants = require('./services/restaurants');
const tables = require('./services/tables');

// Restaurant Service
exports.addRestaurant = restaurants.addRestaurant;
exports.updateRestaurant = restaurants.updateRestaurant;
exports.deleteRestaurant = restaurants.deleteRestaurant;
exports.uploadRestaurantLogo = restaurants.uploadRestaurantLogo;
exports.getRestaurantsByOwner = restaurants.getRestaurantsByOwner;
exports.getRestaurantById = restaurants.getRestaurantById;
exports.getRestaurantByList = restaurants.getRestaurantByList;

// Tables Service
exports.addTable = tables.addTable;
exports.updateTable = tables.updateTable;
exports.deleteTable = tables.deleteTable;
exports.getTableById = tables.getTableById;
exports.getTablesByRestaurant = tables.getTablesByRestaurant;