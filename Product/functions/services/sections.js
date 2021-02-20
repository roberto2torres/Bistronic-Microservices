const declarations = require('../declarations');
const functions = declarations.functions;
const admin = declarations.admin;
const cors = declarations.cors;
const { firestore } = require('firebase-admin');

exports.addSection = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const parameters = req.body;
        if (parameters && parameters.restaurantId && parameters.section && parameters.user) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
            const restaurantHistoryRef = restaurantRef.collection('history').doc();
            const sectionRef  = restaurantRef.collection('sections').doc();
            const batchSection = admin.firestore().batch();
            batchSection.set(sectionRef, parameters.section.data);
            batchSection.set(restaurantHistoryRef, {
                user: parameters.user,
                action: 'create',
                date: firestore.Timestamp.now(),
                reference: 'section',
                object: { id: sectionRef.id, data: parameters.section.data }
            });
            batchSection.commit().then(() => {
                res.status(201).json(sectionRef.id);
                return sectionRef.id;
            }).catch(error => {
                res.status(500).json({ error: error });
            });
        } else {
            response.status(400).json({ error: "Incorrect parameters" });
        }
    });
});

exports.updateSection = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const parameters = req.body;
        if (parameters && parameters.restaurantId && parameters.section && parameters.section.id && parameters.user) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
            const restaurantHistoryRef = restaurantRef.collection('history').doc();
            const sectionRef  = restaurantRef.collection('sections').doc(parameters.section.id);
            const batchSection = admin.firestore().batch();
            batchSection.update(sectionRef, parameters.section.data);
            batchSection.set(restaurantHistoryRef, {
                user: parameters.user,
                action: 'update',
                date: firestore.Timestamp.now(),
                reference: 'section',
                object: { id: sectionRef.id, data: parameters.section.data }
            });
            batchSection.commit().then(() => {
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

exports.deleteSection = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const parameters = req.body;
        console.log(parameters);
        if (parameters && parameters.restaurantId && parameters.sectionId && parameters.user) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
            const restaurantHistoryRef = restaurantRef.collection('history').doc();
            const sectionRef  = restaurantRef.collection('sections').doc(parameters.sectionId);
            const batchSection = admin.firestore().batch();
            batchSection.delete(sectionRef);
            batchSection.set(restaurantHistoryRef, {
                user: parameters.user,
                action: 'delete',
                date: firestore.Timestamp.now(),
                reference: 'section',
                object: { id: parameters.sectionId }
            });
            // TODO, Add algoritm to delete section from products
            batchSection.commit().then(() => {
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

exports.getSectionById = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const restaurantId = req.query['restaurantId'];
        const sectionId = req.query['sectionId'];
        if (restaurantId && sectionId) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(restaurantId);
            const sectionRef = restaurantRef.collection('sections').doc(sectionId);
            sectionRef.get().then(sectionDB => {
                res.status(200).send({
                    id: sectionDB.id,
                    data: sectionDB.data()
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

exports.getSectionsByRestaurant = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const restaurantId = req.query['restaurantId'];
        if (restaurantId) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(restaurantId);
            const sectionsRef = restaurantRef.collection('sections');
            sectionsRef.get().then(sectionsDB => {
                res.status(200).send(
                    sectionsDB.docs.map(sectionDB => {
                        return {
                            id: sectionDB.id,
                            data: sectionDB.data()
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
