const declarations = require('../declarations');
const functions = declarations.functions;
const admin = declarations.admin;
const cors = declarations.cors;
const {PubSub} = require('@google-cloud/pubsub');

exports.addPurchaseOrder = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const parameters = request.body;
        if (
            parameters && parameters.restaurantId && parameters.user && parameters.purchaseOrder &&
            parameters.purchaseOrder.data && parameters.purchaseOrder.data.lines
        ) {
            const batchPO = admin.firestore().batch();
            const poRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId).collection('purchaseorders').doc();
            const poHistory = poRef.collection('history').doc();
            batchPO.set(poRef, parameters.purchaseOrder.data);
            batchPO.set(poHistory, {
                date: admin.firestore.Timestamp.now(),
                user: parameters.user,
                action: 'create'
            });
            batchPO.commit().then(() => {
                response.status(200).json(poRef.id);
                return poRef.id;
            }).catch(error => {
                console.error(error);
                response.status(500).send(error);
            });
        } else {
            response.status(400).send("Incorrect parameters");
        }
    });
});

exports.cancelPurchaseOrder = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const parameters = request.body;
        if (
            parameters && parameters.restaurantId && parameters.purchaseOrder && parameters.user &&
            parameters.purchaseOrder.data && parameters.purchaseOrder.data.lines
        ) {
            const batchPO = admin.firestore().batch();
            const poRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId)
                .collection('purchaseorders').doc(parameters.purchaseOrder.id);
            const poHistory = poRef.collection('history').doc();
            batchPO.update(poRef, { status: 'canceled' });
            batchPO.set(poHistory, {
                date: admin.firestore.Timestamp.now(),
                user: parameters.user,
                action: 'canceled'
            });
            batchPO.commit().then(() => {
                response.status(200).json(poRef.id);
                return poRef.id;
            }).catch(error => {
                console.error(error);
                response.status(500).send(error);
            });
        } else {
            response.status(400).send({ message: "Incorrect parameters" });
        }
    });
});

exports.completePurchaseOrder = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const parameters = request.body;
        if (
            parameters && parameters.restaurantId && parameters.purchaseOrder && parameters.user &&
            parameters.purchaseOrder.data && parameters.purchaseOrder.data.lines
        ) {
            const batchPO = admin.firestore().batch();
            const poRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId)
                .collection('purchaseorders').doc(parameters.purchaseOrder.id);
            const poHistory = poRef.collection('history').doc();
            batchPO.update(poRef, { status: 'completed' });
            batchPO.set(poHistory, {
                date: admin.firestore.Timestamp.now(),
                user: parameters.user,
                action: 'completed'
            });
            batchPO.commit().then(() => {
                const stockMessagesPromises = [];
                const pubSubClient = new PubSub();
                parameters.purchaseOrder.data.lines.forEach(line => {
                    const updateStockParameters = JSON.stringify({
                        restaurantId: parameters.restaurantId,
                        user: parameters.user,
                        itemId: line.item.id,
                        stock: line.quantity,
                        order: poRef.id
                    });
                    const dataBuffer = Buffer.from(updateStockParameters);
                    stockMessagesPromises.push(pubSubClient.topic('update-stock').publish(dataBuffer));
                });
                return Promise.all(stockMessagesPromises);
            }).then(() => {
                response.status(200).json(poRef.id);
                return poRef.id;
            }).catch(error => {
                console.error(error);
                response.status(500).send(error);
            });
        } else {
            response.status(400).send({ message: "Incorrect parameters" });
        }
    });
});

exports.getOpenPurchaseOrdersByRestaurant = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const restaurantId = request.query['restaurantId'];
        if (restaurantId) {
            const posRef = admin.firestore().collection('restaurants').doc(restaurantId)
                .collection('purchaseorders').where('status', '==', 'opened');
            posRef.get().then(posDB => {
                response.status(200).send(
                    posDB.docs.map(poDB => {
                        return {
                            id: poDB.id,
                            data: poDB.data()
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
