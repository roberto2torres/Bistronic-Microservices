const { firestore } = require('firebase-admin');
const declarations = require('../declarations');
const functions = declarations.functions;
const admin = declarations.admin;
const cors = declarations.cors;

exports.getUserById = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const userId = req.query['userId'];
        if (userId) {
            console.log(userId);
            const userRef = admin.firestore().collection('users').doc(userId);
            userRef.get().then(userDB => {
                if (userDB.exists) {
                    res.status(200).send({
                        id: userDB.id,
                        data: userDB.data()
                    });
                } else {
                    res.status(200).send(null);
                }
                return null;
            }).catch(error => {
                res.status(500).send(error);
            });
        } else {
            res.status(400).send("Incorrect parameters");
        }
    });
});

exports.addUser = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        const parameters = req.body;
        console.log(parameters);
        if (parameters && parameters.user) {
            const userRef = admin.firestore().collection('users').doc(parameters.user.id);
            userRef.set(parameters.user.data).then(() => {
                res.status(200).json(userRef.id);
                return true;
            }).catch(error => {
                res.status(500).json({ error: error });
            });
        } else {
            res.status(400).json({ error: "Incorrect parameters" });
        }
    });
});