const declarations = require('../declarations');
const functions = declarations.functions;
const admin = declarations.admin;
const cors = declarations.cors;
const BusBoy = require('busboy');
const { firestore } = require('firebase-admin');

exports.addRestaurant = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const restaurantRef = admin.firestore().collection('restaurants').doc();
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const user = decodedIdToken.email;
                if (user) {
                    const parameters = req.body;
                    if (parameters && parameters.restaurant) {
                        parameters.restaurant.data.status = 'created';
                        const restaurantHistoryRef = restaurantRef.collection('history').doc();
                        const batchRestaurant = admin.firestore().batch();
                        batchRestaurant.set(restaurantRef, parameters.restaurant.data);
                        batchRestaurant.set(restaurantHistoryRef, {
                            user: user,
                            action: 'create',
                            date: firestore.Timestamp.now()
                        });
                        return batchRestaurant.commit();
                    } else {
                        response.status(400).json({ error: "Incorrect parameters" });
                    }
                } else {
                    res.status(400).send("Incorrect parameters");
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(() => {
            res.status(201).json(restaurantRef.id);
            return restaurantRef.id;
        }).catch(error => {
            console.log(error);
            res.status(500).send(error);
        });
    });
});

exports.updateRestaurant = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const user = decodedIdToken.email;
                if (user) {
                    const parameters = req.body;
                    if (parameters && parameters.restaurant) {
                        const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurant.id);
                        const restaurantHistoryRef = restaurantRef.collection('history').doc();
                        const batchRestaurant = admin.firestore().batch();
                        batchRestaurant.update(restaurantRef, parameters.restaurant.data);
                        batchRestaurant.set(restaurantHistoryRef, {
                            user: user,
                            action: 'update',
                            date: firestore.Timestamp.now()
                        });
                        return batchRestaurant.commit();
                    } else {
                        response.status(400).json({ error: "Incorrect parameters" });
                    }
                } else {
                    res.status(400).send("Incorrect parameters");
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(() => {
            res.status(200).end();
            return null;
        }).catch(error => {
            console.log(error);
            res.status(500).send(error);
        });
    });
});

exports.deleteRestaurant = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const user = decodedIdToken.email;
                if (user) {
                    const parameters = req.body;
                    if (parameters && parameters.restaurantId && user) {
                        const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
                        const restaurantHistoryRef = restaurantRef.collection('history').doc();
                        const batchRestaurant = admin.firestore().batch();
                        batchRestaurant.update(restaurantRef, { status: 'deleted' });
                        batchRestaurant.set(restaurantHistoryRef, {
                            user: user,
                            action: 'delete',
                            date: firestore.Timestamp.now()
                        });
                        return batchRestaurant.commit();
                    } else {
                        response.status(400).json({ error: "Incorrect parameters" });
                    }
                } else {
                    res.status(400).send("Incorrect parameters");
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(() => {
            res.status(200).end();
            return null;
        }).catch(error => {
            console.log(error);
            res.status(403).send(error);
        });
    });
});

exports.getRestaurantById = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const restaurantId = req.query['restaurantId'];
                if (restaurantId) {
                    const restaurantRef = admin.firestore().collection('restaurants').doc(restaurantId);
                    return restaurantRef.get();
                } else {
                    res.status(400).send("Incorrect parameters");
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(restaurantDB => {
            const responseRestaurant = {
                id: restaurantDB.id,
                data: restaurantDB.data()
            };
            res.status(200).send(responseRestaurant);
            return responseRestaurant;
        }).catch(error => {
            console.log(error);
            res.status(403).send(error);
        });
    });
});

exports.getRestaurantsByOwner = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const user = decodedIdToken.email;
                if (user) {
                    const restaurantsRef = admin.firestore().collection('restaurants')
                    .where('owner', '==', user).where('status', '==', 'created');
                    return restaurantsRef.get();
                } else {
                    res.status(400).send("Incorrect parameters");
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(restaurantsDB => {
            console.log(restaurantsDB.docs.length);
            const responseRestaurants = restaurantsDB.docs.map(resDB => {
                return {
                    id: resDB.id,
                    data: resDB.data()
                }
            });
            res.status(200).send(responseRestaurants);
            return responseRestaurants;
        }).catch(error => {
            console.log(error);
            res.status(403).send(error);
        });
    });
});

exports.getRestaurantByList = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const restaurantListString = req.query['restaurantList'];
                if (restaurantListString) {
                    const restaurantList = JSON.parse(restaurantListString);
                    if (restaurantList.length > 0) {
                        const restaurantsRef = admin.firestore().collection('restaurants')
                            .where(admin.firestore.FieldPath.documentId(), 'in', restaurantList)
                            .where('status', '==', 'created');
                        return restaurantsRef.get();
                    } else {
                        res.status(200).end();
                    }
                } else {
                    res.status(400).send("Incorrect parameters");
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(restaurantsDB => {
            const responseRestaurants = restaurantsDB.docs.map(resDB => {
                return {
                    id: resDB.id,
                    data: resDB.data()
                }
            });
            res.status(200).send(responseRestaurants);
            return responseRestaurants;
        }).catch(error => {
            console.log(error);
            res.status(403).send(error);
        });
    });
});

exports.uploadRestaurantLogo = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        let restaurantId;
        const currentTimestamp = Date.now();
        let fileExt;
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                if (req.method === 'POST') {
                    const busboy = new BusBoy({
                        headers: req.headers,
                        limits: {
                            fileSize: 2 * 1024 * 1024, //2 MB size limit
                        }
                    });
                    let logoWrite;
                    busboy.on('field', (fieldname, val) => {
                        if (fieldname === 'restaurantId') {
                            restaurantId = val;
                        }
                    });
                    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
                        if (fieldname === 'logoFile') {
                            if (mimetype !== `image/jpeg` && mimetype !== `image/png`) {
                                return res.status(400).json({ error: `Not an acceptable file type` })
                            } else {
                                if (!restaurantId) {
                                    return res.status(400).json({ error: `RestaurantId must be sent in the request before logo file` });
                                } else {
                                    const re = /(?:\.([^.]+))?$/;
                                    fileExt = re.exec(filename)[1];
                                    const bucket = admin.storage().bucket();
                                    const writeStream = bucket.file(restaurantId + '/logo(' + currentTimestamp.toString() + ').' + fileExt).createWriteStream({
                                        contentType: mimetype,
                                        resumable: false,
                                        public: true,
                                        private: false
                                    });
                                    file.pipe(writeStream);
                                    logoWrite = new Promise((resolve, reject) => {
                                        file.on('end', () => {
                                          writeStream.end();
                                        });
                                        writeStream.on('finish', resolve);
                                        writeStream.on('error', reject);
                                    });
                                }
                            }
                        }
                        return null;
                    });
                    
                    busboy.on('finish', async () => {
                        return logoWrite;
                    });
        
                    busboy.on('error', error => {
                        return res.status(500).json({ error: error });
                    })
                    busboy.end(req.rawBody);
                    return null;
                } else {
                    return res.status(405).end();
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(() => {
            if (restaurantId) {
                const restaurantRef = admin.firestore().collection('restaurants').doc(restaurantId);
                return restaurantRef.update({ logo: 'https://storage.googleapis.com/bistronic-restaurant-ms.appspot.com/' + restaurantId + '/logo(' + currentTimestamp.toString() + ').' + fileExt });
            } else {
                return res.status(500).json({ error: 'Could not get the restaurant Id' });
            }
        }).then(() => {
            console.log('ban3');
            res.status(200).end();
            return true;
        }).catch(error => {
            console.log(error);
            res.status(500).json({ error: error });
        });
    });
});

