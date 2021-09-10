/**
 * Module dependencies.
 */
const userConnections = require('./user-connections.controller'),
    userFeeds = require('../feeds/user-feeds.controller'),
    policy = require('../../core/policy.controller');

module.exports = (app) => {

    // new connection request.
    app.route('/api/users/connection/:userId/request')
        .post(policy.processUser, userConnections.addConnectionRequest);

    // to reject a connection request.
    app.route('/api/users/connection/:connectionId/reject')
        .put(policy.processUser, userConnections.rejectConnectionRequest);

    // to delete a connection request.
    app.route('/api/users/connection/:connectionId/delete')
        .delete(policy.processUser, userConnections.deleteConnectionRequest);

    // to accept a connection request.
    app.route('/api/users/connection/:connectionId/accept')
        .put(policy.processUser, userConnections.acceptConnectionRequest);

    // to close an existing connection.
    app.route('/api/users/connection/:connectionId/close')
        .put(policy.processUser, userConnections.closeConnection);

    // to get connection status between two users.
    app.route('/api/users/connection/:userId/status')
        .get(policy.processUser, userConnections.getConnectionStatus);

    // to get active connection requests to current user.
    app.route('/api/users/connection/requests')
        .get(policy.processUser, userConnections.getConnectionRequests);
    
    // to get status list of active connection object of current users.
    app.route('/api/users/connection/statusList')
        .get(policy.processUser, userConnections.getConnectionSatusList);

    // to get active connection requests from current user.
    app.route('/api/users/connection/requests/pending')
        .get(policy.processUser, userConnections.getPendingConnectionRequests);

    // to update profile accessibility of user connection.
    app.route('/api/users/connection/profileAccessiblity')
        .put(policy.processUser, userConnections.updateProfileAccessibility);

    app.route('/api/users/connection/:connectionId/feeds')
        .get(policy.processUser, userFeeds.getConnectionFeeds);
}