const { firestore } = require('firebase-admin');
const declarations = require('../declarations');
const functions = declarations.functions;
const admin = declarations.admin;
const cors = declarations.cors;

exports.addProfile = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const parameters = req.body;
        if (parameters && parameters.restaurantId && parameters.profile && parameters.user) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
            const batchProfile = admin.firestore().batch();
            const profileRef = restaurantRef.collection('profiles').doc();
            parameters.profile.data.status = 'created';
            batchProfile.set(profileRef, parameters.profile.data);
            const historyRef = profileRef.collection('history').doc();
            batchProfile.set(historyRef, {
                user: parameters.user,
                action: 'create',
                date: firestore.Timestamp.now()
            });
            batchProfile.commit().then(() => {
                res.status(200).json(profileRef.id);
                return true;
            }).catch(error => {
                res.status(500).json({ error: error });
            });
        } else {
            res.status(400).json({ error: "Incorrect parameters" });
        }
    });
});

exports.updateProfile = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const parameters = req.body;
        if (parameters && parameters.restaurantId && parameters.profile && parameters.user) {
            const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
            const profileRef = restaurantRef.collection('profiles').doc(parameters.profile.id);
            const profileHistoryRef = profileRef.collection('history').doc();
            const batchProfile = admin.firestore().batch();
            batchProfile.update(profileRef, parameters.profile.data);
            batchProfile.set(profileHistoryRef, {
                user: parameters.user,
                action: 'update',
                date: firestore.Timestamp.now()
            });
            batchProfile.commit().then(() => {
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

exports.removeProfile = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const parameters = req.body;
        if (parameters && parameters.restaurantId && parameters.profileId && parameters.user) {
            const batchProfile = admin.firestore().batch();
            const restaurantRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId);
            const profileRef = restaurantRef.collection('profiles').doc(parameters.profileId);
            const profileHistory = profileRef.collection('history').doc();
            const usersRef = restaurantRef.collection('users');
            const usersToDeleteProfileRef = usersRef.where('profiles', 'array-contains', parameters.profileId);
            usersToDeleteProfileRef.get().then(usersToDeleteProfile => {
                if (!usersToDeleteProfile.empty) {
                    usersToDeleteProfile.docs.forEach(usr => {
                        const newProfiles = usr.data().profiles;
                        console.log(newProfiles);
                        const profileToDeleteIndex = newProfiles.indexOf(parameters.profileId);
                        newProfiles.splice(profileToDeleteIndex, 1);
                        console.log(newProfiles);
                        batchProfile.update(usersRef.doc(usr.id), { profiles: newProfiles });
                    });
                }
                batchProfile.update(profileRef, { status: 'removed' });
                batchProfile.set(profileHistory, {
                    date: admin.firestore.Timestamp.now(),
                    user: parameters.user,
                    action: 'removed',
                });
                return batchProfile.commit();
            }).then(() => {
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

exports.getProfilesByRestaurant = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const restaurantId = req.query['restaurantId'];
        if (restaurantId) {
            const profilesRef = admin.firestore().collection('restaurants').doc(restaurantId)
                .collection('profiles').where('status', '==', 'created');
            profilesRef.get().then(profilesDB => {
                res.status(200).send(
                    profilesDB.docs.map(profileDB => {
                        return {
                            id: profileDB.id,
                            data: profileDB.data()
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

