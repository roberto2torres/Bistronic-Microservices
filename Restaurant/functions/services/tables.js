const declarations = require('../declarations');
const functions = declarations.functions;
const admin = declarations.admin;
const cors = declarations.cors;
const { firestore } = require('firebase-admin');

exports.addTable = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        let tableId;
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const user = decodedIdToken.email;
                const parameters = req.body;
                if (parameters && parameters.restaurantId && parameters.table) {
                    const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
                    const restaurantHistoryRef = restaurantRef.collection('history').doc();
                    const tableRef  = restaurantRef.collection('tables').doc();
                    tableId = tableRef.id;
                    const batchTable = admin.firestore().batch();
                    batchTable.set(tableRef, parameters.table.data);
                    batchTable.set(restaurantHistoryRef, {
                        user: user,
                        action: 'create',
                        date: firestore.Timestamp.now(),
                        reference: 'table',
                        object: { id: tableRef.id, data: parameters.table.data }
                    });
                    return batchTable.commit();
                } else {
                    res.status(400).json({ error: "Incorrect parameters" });
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(result => {
            console.log(result);
            res.status(201).json(tableId);
            return tableRef.id;
        }).catch(error => {
            res.status(500).json({ error: error });
        });
    });
});

exports.updateTable = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const user = decodedIdToken.email;
                const parameters = req.body;
                if (parameters && parameters.restaurantId && parameters.table && parameters.table.id) {
                    const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
                    const restaurantHistoryRef = restaurantRef.collection('history').doc();
                    const tableRef  = restaurantRef.collection('tables').doc(parameters.table.id);
                    const batchTable = admin.firestore().batch();
                    batchTable.update(tableRef, parameters.table.data);
                    batchTable.set(restaurantHistoryRef, {
                        user: user,
                        action: 'update',
                        date: firestore.Timestamp.now(),
                        reference: 'table',
                        object: { id: tableRef.id, data: parameters.table.data }
                    });
                    return batchTable.commit();
                } else {
                    res.status(400).json({ error: "Incorrect parameters" });
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(() => {
            res.status(201).end();
            return null;
        }).catch(error => {
            res.status(500).json({ error: error });
        });
    });
});

exports.deleteTable = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const user = decodedIdToken.email;
                const parameters = req.body;
                if (parameters && parameters.restaurantId && parameters.tableId && user) {
                    const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
                    const restaurantHistoryRef = restaurantRef.collection('history').doc();
                    const tableRef  = restaurantRef.collection('tables').doc(parameters.tableId);
                    const batchTable = admin.firestore().batch();
                    batchTable.delete(tableRef);
                    batchTable.set(restaurantHistoryRef, {
                        user: user,
                        action: 'delete',
                        date: firestore.Timestamp.now(),
                        reference: 'table',
                        object: { id: parameters.tableId }
                    });
                    return batchTable.commit();
                } else {
                    res.status(400).json({ error: "Incorrect parameters" });
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(() => {
            res.status(201).end();
            return null;
        }).catch(error => {
            res.status(500).json({ error: error });
        });
    });
});

exports.getTablesByRestaurant = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const user = decodedIdToken.email;
                const restaurantId = req.query['restaurantId'];
                if (user && restaurantId) {
                    const restaurantRef = admin.firestore().collection('restaurants').doc(restaurantId);
                    return restaurantRef.collection('tables').get();
                } else {
                    res.status(400).send("Incorrect parameters");
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(tablesDB => {
            if (tablesDB && !tablesDB.empty) {
                const responseTables = tablesDB.docs.map(tabDB => {
                    return {
                        id: tabDB.id,
                        data: tabDB.data()
                    }
                });
                res.status(200).send(responseTables);
            } else {
                res.status(200).send(null);
            }
            return null;
        }).catch(error => {
            res.status(500).send(error);
        });
    });
});

exports.getTableById = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const user = decodedIdToken.email;
                const restaurantId = req.query['restaurantId'];
                const tableId = req.query['tableId'];
                if (restaurantId && tableId) {
                    const tableRef = admin.firestore().collection('restaurants').doc(restaurantId)
                        .collection('tables').doc(tableId);
                    return tableRef.get();
                } else {
                    res.status(400).send("Incorrect parameters");
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(tableDB => {
            res.status(200).send({
                id: tableDB.id,
                data: tableDB.data()
            });
            return null;
        }).catch(error => {
            res.status(500).send(error);
        });
    });
});