const { firestore } = require('firebase-admin');
const declarations = require('../declarations');
const functions = declarations.functions;
const admin = declarations.admin;
const cors = declarations.cors;

exports.updateUserProfiles = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const parameters = req.body;
        if (parameters && parameters.restaurantId && parameters.userProfiles && parameters.user) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
            const authorizationHistory = restaurantRef.collection('history').doc();
            const userRef = restaurantRef.collection('users').doc(parameters.userProfiles.id);
            const userRestaurantRef = admin.firestore().collection('users').doc(parameters.userProfiles.id)
                .collection('restaurants').doc(parameters.restaurantId);
            const batch = admin.firestore().batch();
            batch.set(userRef, {
                profiles: parameters.userProfiles.data.profiles ? parameters.userProfiles.data.profiles.map(pro => pro.id) : null
            });
            batch.set(userRestaurantRef, { reference: true });
            batch.set(authorizationHistory, {
                user: parameters.user,
                action: 'update',
                date: firestore.Timestamp.now(),
                reference: userRef.id
            });
            batch.commit().then(() => {
                res.status(200).end();
                return true;
            }).catch(error => {
                res.status(500).json({ error: error });
            });
        } else {
            res.status(400).json({ error: "Incorrect parameters" });
        }
    });
});

exports.removeUserProfiles = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const parameters = req.body;
        if (parameters && parameters.restaurantId && parameters.email && parameters.user) {
            const batch = admin.firestore().batch();
            const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
            const userRef = restaurantRef.collection('users').doc(parameters.email);
            const authorizationHistory = restaurantRef.collection('history').doc();
            const userRestaurantRef = admin.firestore().collection('users').doc(parameters.email)
                .collection('restaurants').doc(parameters.restaurantId);
            batch.delete(userRef);
            batch.delete(userRestaurantRef);
            batch.set(authorizationHistory, {
                date: admin.firestore.Timestamp.now(),
                user: parameters.user,
                action: 'removed',
                reference: userRef.id
            });
            batch.commit().then(() => {
                res.status(200).end();
                return null;
            }).catch(error => {
                res.status(500).send(error);
            });
        } else {
            res.status(400).send("Incorrect parameters");
        }
    });
});

exports.getUserProfilesByRestaurant = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const restaurantId = req.query['restaurantId'];
        if (restaurantId) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(restaurantId);
            const usersRef = restaurantRef.collection('users');
            const usersPromise = usersRef.get();
            const profilesRef = restaurantRef.collection('profiles').where('status', '==', 'created');
            const profilesPromise = profilesRef.get();
            Promise.all([usersPromise, profilesPromise]).then(values => {
                const users = values[0];
                const profiles = values[1].docs.map(pro => {
                    return { id: pro.id, data: pro.data() };
                });
                const userProfiles = users.docs.map(userDB => {
                    const userProfiles = profiles.filter(pro => userDB.data().profiles.includes(pro.id));
                    return {
                        id: userDB.id,
                        data: { profiles: userProfiles }
                    }
                });
                res.status(200).send(userProfiles);
                return null;
            }).catch(error => {
                res.status(500).send(error);
            });
        } else {
            res.status(400).send("Incorrect parameters");
        }
    });
});

exports.getUserProfilesById = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const restaurantId = req.query['restaurantId'];
        const email = req.query['email'];
        if (restaurantId && email) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(restaurantId);
            const userRef = restaurantRef.collection('users').doc(email);
            const userPromise = userRef.get();
            const profilesRef = restaurantRef.collection('profiles').where('status', '==', 'created');
            const profilesPromise = profilesRef.get();
            Promise.all([userPromise, profilesPromise]).then(values => {
                const user = values[0];
                const profiles = values[1].docs.map(pro => {
                    return { id: pro.id, data: pro.data() };
                });
                const userProfiles = profiles.filter(pro => user.data().profiles.includes(pro.id));
                res.status(200).send(
                    {
                        id: user.id,
                        data: { profiles: userProfiles }
                    }
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

