const user = require('./services/user');
const profile = require('./services/profile');
const userprofiles = require('./services/user-profiles');
const permissions = require('./services/permissions');

// User Service
exports.getUserById = user.getUserById;
exports.addUser = user.addUser;

// Profile Service
exports.addProfile = profile.addProfile;
exports.updateProfile = profile.updateProfile;
exports.removeProfile = profile.removeProfile;
exports.getProfilesByRestaurant = profile.getProfilesByRestaurant;
exports.getProfileById = profile.getProfileById;
exports.addAccessToUser = profile.addAccessToUser;

// User Profiles Service
exports.updateUserProfiles = userprofiles.updateUserProfiles;
exports.removeUserProfiles = userprofiles.removeUserProfiles;
exports.getUserProfilesByRestaurant = userprofiles.getUserProfilesByRestaurant;
exports.getUserProfilesById = userprofiles.getUserProfilesById;

// Permissions
exports.getUserPermissions = permissions.getUserPermissions;
exports.getRestaurantsByUserWhithPermissions = permissions.getRestaurantsByUserWhithPermissions;