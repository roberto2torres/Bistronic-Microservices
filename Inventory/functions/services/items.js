const declarations = require('../declarations');
const functions = declarations.functions;
const admin = declarations.admin;
const cors = declarations.cors;

exports.addItem = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const parameters = request.body;
        if (parameters && parameters.restaurantId && parameters.user && parameters.item && parameters.item.data) {
            const batchItem = admin.firestore().batch();
            const itemRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId).collection('items').doc();
            const itemStockHistory = itemRef.collection('stockhistory').doc();
            batchItem.set(itemRef, parameters.item.data);
            batchItem.set(itemStockHistory, {
                date: admin.firestore.Timestamp.now(),
                user: parameters.user,
                stock: parameters.item.data.stock,
                action: 'create',
            });
            batchItem.commit().then(() => {
                response.status(200).json(itemRef.id);
                return itemRef.id;
            }).catch(error => {
                response.status(500).send(error);
            });
        } else {
            response.status(400).send("Incorrect parameters");
        }
    });
});

exports.updateItem = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const parameters = request.body;
        if (
            parameters && parameters.restaurantId && parameters.user && parameters.item && 
            parameters.item.id && parameters.item.data
        ) {
            const batchItem = admin.firestore().batch();
            const itemRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId)
                .collection('items').doc(parameters.item.id);
            const itemStockHistory = itemRef.collection('stockhistory').doc();
            batchItem.update(itemRef, parameters.item.data);
            batchItem.set(itemStockHistory, {
                date: admin.firestore.Timestamp.now(),
                user: parameters.user,
                stock: parameters.item.data.stock,
                action: 'update',
            });
            batchItem.commit().then(() => {
                response.status(200).end();
                return itemAdded;
            }).catch(error => {
                response.status(500).send(error);
            });
        } else {
            response.status(400).send("Incorrect parameters");
        }
    });
});

exports.updateStock = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        let parameters = null;
        if (request.body && request.body.message && request.body.message.data) {
            parameters = JSON.parse(Buffer.from(request.body.message.data, 'base64').toString());
        } else if (request.body) {
            parameters = request.body;
        }
        if (
            parameters && parameters.restaurantId && parameters.user && 
            parameters.itemId && parameters.stock && !isNaN(parseInt(parameters.stock))
            && parameters.order
        ) {
            const itemRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId)
                .collection('items').doc(parameters.itemId);
            admin.firestore().runTransaction(async itemTran => {
                itemTran.get(itemRef).then(itemDoc => {
                    const newStock = itemDoc.data().stock + parseInt(parameters.stock);
                    const batchItem = admin.firestore().batch();
                    batchItem.update(itemRef, { stock: newStock });
                    const itemStockHistory = itemRef.collection('stockhistory').doc();
                    batchItem.set(itemStockHistory, {
                        date: admin.firestore.Timestamp.now(),
                        user: parameters.user,
                        stock: newStock,
                        quantity: parameters.stock,
                        action: parameters.stock > 0 ? 'replenishment' : 'consume',
                        order: parameters.order
                    });
                    return batchItem.commit();
                }).then(() => {
                    response.status(200).end();
                    return null;
                }).catch(error => {
                    response.status(500).send(error);
                });
            }).catch(error => {
                response.status(500).send(error);
            });
        } else {
            response.status(400).send("Incorrect parameters");
        }
    });
});


exports.removeItem = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const parameters = request.body;
        if (parameters && parameters.restaurantId && parameters.itemId && parameters.user) {
            const batchItem = admin.firestore().batch();
            const itemRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId)
                .collection('items').doc(parameters.itemId);
            const itemStockHistory = itemRef.collection('stockhistory').doc();
            batchItem.update(itemRef, { status: 'removed' });
            batchItem.set(itemStockHistory, {
                date: admin.firestore.Timestamp.now(),
                user: parameters.user,
                stock: 0,
                action: 'removed',
            });
            //TODO: Add functionality to send a message (PUB/SUB) to remove item from all the products receipe
            batchItem.commit().then(() => {
                response.status(200).end();
                return null;
            }).catch(error => {
                response.status(500).send(error);
            });
        } else {
            response.status(400).send("Incorrect parameters");
        }
    });
});

exports.getItemsByRestaurant = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const restaurantId = request.query['restaurantId'];
        if (restaurantId) {
            const itemsRef = admin.firestore().collection('restaurants').doc(restaurantId)
                .collection('items').where('status', '==', 'active');
            itemsRef.get().then(itemsDB => {
                response.status(200).send(
                    itemsDB.docs.map(itmDB => {
                        return {
                            id: itmDB.id,
                            data: itmDB.data()
                        }
                    })
                );
                return null;
            }).catch(error => {
                response.status(500).send(error);
            });
        } else {
            response.status(400).send("Incorrect parameters");
        }
    });
});

exports.getItemById = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const restaurantId = request.query['restaurantId'];
        const itemId = request.query['itemId'];
        if (restaurantId && itemId) {
            const itemRef = admin.firestore().collection('restaurants').doc(restaurantId)
                .collection('items').doc(itemId);
            itemRef.get().then(itemDB => {
                response.status(200).send({
                    id: itemDB.id,
                    data: itemDB.data()
                });
                return null;
            }).catch(error => {
                response.status(500).send(error);
            });
        } else {
            response.status(400).send("Incorrect parameters");
        }
    });
});