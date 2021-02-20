const { firestore } = require('firebase-admin');
const declarations = require('../declarations');
const functions = declarations.functions;
const admin = declarations.admin;
const cors = declarations.cors;

exports.getUserPermissions = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const restaurantId = req.query['restaurantId'];
        const user = req.query['user'];
        if (restaurantId && user) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(restaurantId);
            const userRef = restaurantRef.collection('users').doc(user);
            const userPromise = userRef.get();
            const profilesRef = restaurantRef.collection('profiles').where('status', '==', 'created');
            const profilesPromise = profilesRef.get();
            Promise.all([userPromise, profilesPromise]).then(values => {
                const userDB = values[0];
                const profilesDB = !values[1].empty ? values[1].docs : null;
                if (userDB.exists && profilesDB) {
                    const userProfiles = profilesDB.filter(pro => userDB.data().profiles.includes(pro.id));
                    const permissions = userProfiles.map(pro => pro.data().permissions).reduce((acc, val) => acc.concat(val), []);
                    return res.status(200).json(permissions);
                } else {
                    return res.status(200).end();
                }
            }).catch(error => {
                res.status(500).send(error);
            });
        } else {
            res.status(400).send("Incorrect parameters");
        }
    });
});

exports.getProfileById = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const restaurantId = req.query['restaurantId'];
        const profileId = req.query['profileId'];
        if (restaurantId && profileId) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(restaurantId);
            const profileRef = restaurantRef.collection('profiles').doc(profileId);
            profileRef.get().then(profileDB => {
                res.status(200).send({
                    id: profileDB.id,
                    data: profileDB.data()
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

exports.getRestaurantsByUserWhithPermissions = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const userId = req.query['userId'];
        if (userId) {
            const restaurantsRef = admin.firestore().collection('users').doc(userId).collection('restaurants');
            restaurantsRef.get().then(restaurantDB => {
                res.status(200).json(restaurantDB.empty ? null : restaurantDB.docs.map(res => res.id));
                return null;
            }).catch(error => {
                res.status(500).send(error);
            });
        } else {
            res.status(400).send("Incorrect parameters");
        }
    });
});


