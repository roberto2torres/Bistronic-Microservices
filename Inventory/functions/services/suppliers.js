const declarations = require('../declarations');
const functions = declarations.functions;
const admin = declarations.admin;
const cors = declarations.cors;

exports.addSupplier = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const parameters = request.body;
        if (parameters && parameters.restaurantId && parameters.supplier && parameters.supplier.data) {
            const suppliersRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId).collection('suppliers');
            suppliersRef.add(parameters.supplier.data).then(supplierAdded => {
                response.status(200).json(supplierAdded.id);
                return supplierAdded;
            }).catch(error => {
                response.status(500).send(error);
            });
        } else {
            response.status(400).send("Incorrect parameters");
        }
    });
});

exports.updateSupplier = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const parameters = request.body;
        if (parameters && parameters.restaurantId && parameters.supplier && parameters.supplier.data) {
            const supplierRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId)
                .collection('suppliers').doc(parameters.supplier.id);
            supplierRef.update(parameters.supplier.data).then(() => {
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

exports.removeSupplier = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const parameters = request.body;
        if (parameters && parameters.restaurantId && parameters.supplierId) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
            const itemsRef = restaurantRef.collection('items').where('supplierId', '==', parameters.supplierId);
            itemsRef.get().then(items => {
                if (items.empty) {
                    const supplierRef = restaurantRef.collection('suppliers').doc(parameters.supplierId);
                    return supplierRef.delete();
                } else {
                    response.status(409).send({ message: 'Supplier has some items related'})
                    return null;
                }
            }).then(() => {
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

exports.getSuppliersByRestaurant = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const restaurantId = request.query['restaurantId'];
        if (restaurantId) {
            const suppliersRef = admin.firestore().collection('restaurants').doc(restaurantId)
                .collection('suppliers');
            suppliersRef.get().then(suppliersDB => {
                response.status(200).send(
                    suppliersDB.docs.map(supDB => {
                        return {
                            id: supDB.id,
                            data: supDB.data()
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

exports.getSupplierById = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const restaurantId = request.query['restaurantId'];
        const supplierId = request.query['supplierId'];
        if (restaurantId && supplierId) {
            const supplierRef = admin.firestore().collection('restaurants').doc(restaurantId)
                .collection('suppliers').doc(supplierId);
            supplierRef.get().then(supplierDB => {
                response.status(200).send({
                    id: supplierDB.id,
                    data: supplierDB.data()
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