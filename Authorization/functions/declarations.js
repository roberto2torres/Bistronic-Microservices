exports.functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
exports.admin = admin;
exports.cors = require('cors')({ origin: [
    'https://autoservice-158722.web.app',
    'http://localhost:4200'
]});
