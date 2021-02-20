const declarations = require('../declarations');
const functions = declarations.functions;
const admin = declarations.admin;
const cors = declarations.cors;
const { firestore } = require('firebase-admin');
const BusBoy = require('busboy');

exports.addProduct = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const parameters = req.body;
        if (parameters && parameters.restaurantId && parameters.product && parameters.user) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
            const restaurantHistoryRef = restaurantRef.collection('history').doc();
            const productRef  = restaurantRef.collection('products').doc();
            const batchProduct = admin.firestore().batch();
            batchProduct.set(productRef, parameters.product.data);
            batchProduct.set(restaurantHistoryRef, {
                user: parameters.user,
                action: 'create',
                date: firestore.Timestamp.now(),
                reference: 'product',
                object: { id: productRef.id, data: parameters.product.data }
            });
            batchProduct.commit().then(() => {
                res.status(201).json(productRef.id);
                return productRef.id;
            }).catch(error => {
                res.status(500).json({ error: error });
            });
        } else {
            response.status(400).json({ error: "Incorrect parameters" });
        }
    });
});

exports.updateProduct = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const parameters = req.body;
        if (parameters && parameters.restaurantId && parameters.product && parameters.product.id && parameters.user) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
            const restaurantHistoryRef = restaurantRef.collection('history').doc();
            const productRef  = restaurantRef.collection('products').doc(parameters.product.id);
            const batchProduct = admin.firestore().batch();
            batchProduct.update(productRef, parameters.product.data);
            batchProduct.set(restaurantHistoryRef, {
                user: parameters.user,
                action: 'update',
                date: firestore.Timestamp.now(),
                reference: 'product',
                object: { id: productRef.id, data: parameters.product.data }
            });
            batchProduct.commit().then(() => {
                res.status(200).end();
                return true;
            }).catch(error => {
                res.status(500).json({ error: error });
            });
        } else {
            response.status(400).json({ error: "Incorrect parameters" });
        }
    });
});

exports.deleteProduct = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const parameters = req.body;
        console.log(parameters);
        if (parameters && parameters.restaurantId && parameters.productId && parameters.user) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
            const restaurantHistoryRef = restaurantRef.collection('history').doc();
            const productRef  = restaurantRef.collection('products').doc(parameters.productId);
            const batchProduct = admin.firestore().batch();
            batchProduct.delete(productRef);
            batchProduct.set(restaurantHistoryRef, {
                user: parameters.user,
                action: 'delete',
                date: firestore.Timestamp.now(),
                reference: 'product',
                object: { id: parameters.productId }
            });
            batchProduct.commit().then(() => {
                res.status(200).end();
                return true;
            }).catch(error => {
                res.status(500).json({ error: error });
            });
        } else {
            response.status(400).json({ error: "Incorrect parameters" });
        }
    });
});

exports.getProductById = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const restaurantId = req.query['restaurantId'];
        const productId = req.query['productId'];
        if (restaurantId && productId) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(restaurantId);
            const productRef = restaurantRef.collection('products').doc(productId);
            productRef.get().then(productDB => {
                res.status(200).send({
                    id: productDB.id,
                    data: productDB.data()
                });
                return null;
            }).catch(error => {
                res.status(500).send(error);
            });
        } else {
            res.status(400).send("Incorrect parameters");
        }
    });
});

exports.getProductsByRestaurant = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const restaurantId = req.query['restaurantId'];
        if (restaurantId) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(restaurantId);
            const productsRef = restaurantRef.collection('products');
            productsRef.get().then(productsDB => {
                res.status(200).send(
                    productsDB.docs.map(productDB => {
                        return {
                            id: productDB.id,
                            data: productDB.data()
                        }
                    })
                );
                return null;
            }).catch(error => {
                res.status(500).send(error);
            });
        } else {
            res.status(400).send("Incorrect parameters");
        }
    });
});

exports.uploadProductImage = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        if (req.method === 'POST') {
            const currentTimestamp = Date.now();
            let fileExt;
            const busboy = new BusBoy({
                headers: req.headers,
                limits: {
                    fileSize: 2 * 1024 * 1024, //2 MB size limit
                }
            });
            let logoWrite;
            let restaurantId, productId;
            busboy.on('field', (fieldname, val) => {
                if (fieldname === 'restaurantId') {
                    restaurantId = val;
                }
                if (fieldname === 'productId') {
                    productId = val;
                }
            });
            busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
                if (fieldname === 'imageFile') {
                    if (mimetype !== `image/jpeg` && mimetype !== `image/png`) {
                        return res.status(400).json({ error: `Not an acceptable file type` })
                    } else {
                        if (!restaurantId || !productId) {
                            return res.status(400).json({ error: `ProductId must be sent in the request before image file` });
                        } else {
                            const re = /(?:\.([^.]+))?$/;
                            fileExt = re.exec(filename)[1];
                            const bucket = admin.storage().bucket();
                            const writeStream = bucket.file(restaurantId + '/products/' + productId + '.' + fileExt).createWriteStream({
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
            });
            
            busboy.on('finish', async () => {
                logoWrite.then(() => {
                    const restaurantRef = admin.firestore().collection('restaurants').doc(restaurantId);
                    const productRef = restaurantRef.collection('products').doc(productId)
                    return productRef.update({ image: 'https://storage.googleapis.com/bistronic-product-ms.appspot.com/' + restaurantId + '/products/' + productId + '.' + fileExt });
                }).then(() => {
                    res.status(200).end();
                    return true;
                }).catch(error => {
                    res.status(500).json({ error: error });
                });
            });

            busboy.on('error', error => {
                return res.status(500).json({ error: error });
            })
            busboy.end(req.rawBody);
            return null;
        } else {
            return res.status(405).end();
        }
    });
});
