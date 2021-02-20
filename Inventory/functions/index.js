const suppliers = require('./services/suppliers');
const items = require('./services/items');
const units = require('./services/units');
const purchaseorders = require('./services/purchaseorders');

// Suppliers Service
exports.addSupplier = suppliers.addSupplier;
exports.updateSupplier = suppliers.updateSupplier;
exports.removeSupplier = suppliers.removeSupplier;
exports.getSuppliersByRestaurant = suppliers.getSuppliersByRestaurant;
exports.getSupplierById = suppliers.getSupplierById;

// Items Service
exports.addItem = items.addItem;
exports.updateItem = items.updateItem;
exports.updateStock = items.updateStock;
exports.removeItem = items.removeItem;
exports.getItemsByRestaurant = items.getItemsByRestaurant;
exports.getItemById = items.getItemById;

// Units Service
exports.addUnit = units.addUnit;
exports.updateUnit = units.updateUnit;
exports.removeUnit = units.removeUnit;
exports.getUnitsByRestaurant = units.getUnitsByRestaurant;
exports.getUnitById = units.getUnitById;

// Purchase Orders Service
exports.addPurchaseOrder = purchaseorders.addPurchaseOrder;
exports.completePurchaseOrder = purchaseorders.completePurchaseOrder;
exports.cancelPurchaseOrder = purchaseorders.cancelPurchaseOrder;
exports.getOpenPurchaseOrdersByRestaurant = purchaseorders.getOpenPurchaseOrdersByRestaurant;

