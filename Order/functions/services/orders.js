const declarations = require('../declarations');
const functions = declarations.functions;
const admin = declarations.admin;
const cors = declarations.cors;
const { firestore } = require('firebase-admin');

exports.addOrder = functions.https.onRequest(async (req, res) => {
    cors(req, res, () => {
        declarations.validateFirebaseIdToken(req).then(decodedIdToken => {
            if (decodedIdToken) {
                const user = decodedIdToken.email;
                const parameters = request.body;
                if (user && parameters && parameters.order && parameters.user) {
                    const batchOrder = admin.firestore().batch();
                    const orderRef = admin.firestore().collection('restaurants').doc(parameters.restaurantId).collection('orders').doc();
                    const orderHistory = orderRef.collection('history').doc();
                    batchOrder.set(orderRef, parameters.order.data);
                    batchOrder.set(orderHistory, {
                        date: admin.firestore.Timestamp.now(),
                        user: parameters.user,
                        action: 'create',
                    });
                    return batchOrder.commit();
                } else {
                    res.status(400).send("Incorrect parameters");
                }
            } else {
                res.status(403).json({ message: 'Unauthorize'});
            }
            return null;
        }).then(() => {
            response.status(200).json(orderRef.id);
            return orderRef.id;
        }).catch(error => {
            console.log(error);
            res.status(500).send(error);
        });
    });
});

