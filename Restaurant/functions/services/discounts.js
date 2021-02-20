const declarations = require('../declarations');
const functions = declarations.functions;
const admin = declarations.admin;
const cors = declarations.cors;
const { firestore } = require('firebase-admin');

exports.addDiscount = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        let discountId;
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const user = decodedIdToken.email;
                const parameters = req.body;
                if (parameters && parameters.restaurantId && parameters.discount) {
                    const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
                    const restaurantHistoryRef = restaurantRef.collection('history').doc();
                    const discountRef  = restaurantRef.collection('discounts').doc();
                    discountId = discountRef.id;
                    const batchDiscount = admin.firestore().batch();
                    batchDiscount.set(discountRef, parameters.discount.data);
                    batchDiscount.set(restaurantHistoryRef, {
                        user: user,
                        action: 'create',
                        date: firestore.Timestamp.now(),
                        reference: 'discount',
                        object: { id: discountRef.id, data: parameters.discount.data }
                    });
                    return batchDiscount.commit();
                } else {
                    res.status(400).json({ error: "Incorrect parameters" });
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(result => {
            res.status(201).json(discountId);
            return discountRef.id;
        }).catch(error => {
            res.status(500).json({ error: error });
        });
    });
});

exports.updateDiscount = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const user = decodedIdToken.email;
                const parameters = req.body;
                if (parameters && parameters.restaurantId && parameters.discount && parameters.discount.id) {
                    const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
                    const restaurantHistoryRef = restaurantRef.collection('history').doc();
                    const discountRef  = restaurantRef.collection('discounts').doc(parameters.discount.id);
                    const batchDiscount = admin.firestore().batch();
                    batchDiscount.update(discountRef, parameters.discount.data);
                    batchDiscount.set(restaurantHistoryRef, {
                        user: user,
                        action: 'update',
                        date: firestore.Timestamp.now(),
                        reference: 'discount',
                        object: { id: discountRef.id, data: parameters.discount.data }
                    });
                    return batchDiscount.commit();
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

exports.deleteDiscount = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const user = decodedIdToken.email;
                const parameters = req.body;
                if (parameters && parameters.restaurantId && parameters.discountId && user) {
                    const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
                    const restaurantHistoryRef = restaurantRef.collection('history').doc();
                    const discountRef  = restaurantRef.collection('discounts').doc(parameters.discountId);
                    const batchDiscount = admin.firestore().batch();
                    batchDiscount.delete(discountRef);
                    batchDiscount.set(restaurantHistoryRef, {
                        user: user,
                        action: 'delete',
                        date: firestore.Timestamp.now(),
                        reference: 'discount',
                        object: { id: parameters.discountId }
                    });
                    return batchDiscount.commit();
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

exports.getDiscountsByRestaurant = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const user = decodedIdToken.email;
                const restaurantId = req.query['restaurantId'];
                if (user && restaurantId) {
                    const restaurantRef = admin.firestore().collection('restaurants').doc(restaurantId);
                    return restaurantRef.collection('discounts').get();
                } else {
                    res.status(400).send("Incorrect parameters");
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(discountsDB => {
            if (discountsDB && !discountsDB.empty) {
                const responseDiscounts = discountsDB.docs.map(tabDB => {
                    return {
                        id: tabDB.id,
                        data: tabDB.data()
                    }
                });
                res.status(200).send(responseDiscounts);
            } else {
                res.status(200).send(null);
            }
            return null;
        }).catch(error => {
            res.status(500).send(error);
        });
    });
});

exports.getDiscountById = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const user = decodedIdToken.email;
                const restaurantId = req.query['restaurantId'];
                const discountId = req.query['discountId'];
                if (restaurantId && discountId) {
                    const discountRef = admin.firestore().collection('restaurants').doc(restaurantId)
                        .collection('discounts').doc(discountId);
                    return discountRef.get();
                } else {
                    res.status(400).send("Incorrect parameters");
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(discountDB => {
            res.status(200).send({
                id: discountDB.id,
                data: discountDB.data()
            });
            return null;
        }).catch(error => {
            res.status(500).send(error);
        });
    });
});