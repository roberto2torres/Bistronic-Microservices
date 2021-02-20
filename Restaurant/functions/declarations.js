exports.functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
exports.admin = admin;
exports.cors = require('cors')({ origin: [
    'https://autoservice-158722.web.app',
    'http://localhost:4200'
]});

var authAppConfig = {
    apiKey: "AIzaSyCGtNO5veTsERshzv0-LWTen0ztTcOxDog",
    authDomain: "bistronic-webapp.firebaseapp.com",
    databaseURL: "https://bistronic-webapp.firebaseio.com",
    projectId: "bistronic-webapp",
    appId: "1:355573006760:web:f3693b8c4c381914c49d9d",
};
const authAdmin = require('firebase-admin');
const authUsers = authAdmin.initializeApp(authAppConfig, 'authentication');

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
exports.validateFirebaseIdToken = async (req) => {
    return new Promise((resolve, reject) => {
        if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
            !(req.cookies && req.cookies.__session)) {
          console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
              'Make sure you authorize your request by providing the following HTTP header:',
              'Authorization: Bearer <Firebase ID Token>',
              'or by passing a "__session" cookie.');
          reject(new Error('Unauthorized'));
        }
        let idToken;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
          // Read the ID Token from the Authorization header.
          idToken = req.headers.authorization.split('Bearer ')[1];
        } else if(req.cookies) {
          // Read the ID Token from cookie.
          idToken = req.cookies.__session;
        } else {
          // No cookie
          reject(new Error('Unauthorized'));
        }
      
        try {
            authUsers.auth().verifyIdToken(idToken).then(decodedIdToken => {
                resolve(decodedIdToken);
                return decodedIdToken;
            }).catch(error => {
                reject(error);
            });
        } catch (error) {
            reject(new Error('Unauthorized'));
        }
    });
} 

  