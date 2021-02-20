const declarations = require('../declarations');
const functions = declarations.functions;
const admin = declarations.admin;
const cors = declarations.cors;

exports.addUnit = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const parameters = request.body;
        if (parameters && parameters.restaurantId && parameters.unit && parameters.unit.data) {
            const unitsRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId).collection('units');
            unitsRef.add(parameters.unit.data).then(unitAdded => {
                response.status(200).json(unitAdded.id);
                return unitAdded;
            }).catch(error => {
                response.status(500).send(error);
            })
        } else {
            response.status(400).send("Incorrect parameters");
        }
    });
});

exports.updateUnit = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const parameters = request.body;
        if (parameters && parameters.restaurantId && parameters.unit && parameters.unit.data) {
            const unitRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId)
                .collection('units').doc(parameters.unit.id);
            unitRef.update(parameters.unit.data).then(() => {
                response.status(200).end();
                return null;
            }).catch(error => {
                response.status(500).send(error);
            })
        } else {
            response.status(400).send("Incorrect parameters");
        }
    });
});

exports.removeUnit = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const parameters = request.body;
        if (parameters && parameters.restaurantId && parameters.unitId) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
            const itemsRef = restaurantRef.collection('items').where('unitofmesurement', '==', parameters.unitId);
            itemsRef.get().then(items => {
                if (items.empty) {
                    const unitRef = restaurantRef.collection('units').doc(parameters.unitId);
                    return unitRef.delete();
                } else {
                    response.status(409).send({ message: 'Unit is use by an item'})
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

exports.getUnitsByRestaurant = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const restaurantId = request.query['restaurantId'];
        if (restaurantId) {
            const unitsRef = admin.firestore().collection('restaurants').doc(restaurantId).collection('units');
            unitsRef.get().then(unitsDB => {
                response.status(200).send(
                    unitsDB.docs.map(untDB => {
                        return {
                            id: untDB.id,
                            data: untDB.data()
                        }
                    })
                );
                return null;
            }).catch(error => {
                response.status(500).send(error);
            })
        } else {
            response.status(400).send("Incorrect parameters");
        }
    });
});

exports.getUnitById = functions.https.onRequest(async (request, response) => {
    cors(request, response, () => {
        const restaurantId = request.query['restaurantId'];
        const unitId = request.query['unitId'];
        if (restaurantId && unitId) {
            const unitRef = admin.firestore().collection('restaurants').doc(restaurantId)
                .collection('units').doc(unitId);
            unitRef.get().then(unitDB => {
                response.status(200).send({
                    id: unitDB.id,
                    data: unitDB.data()
                });
                return null;
            }).catch(error => {
                response.status(500).send(error);
            })
        } else {
            response.status(400).send("Incorrect parameters");
        }
    });
});