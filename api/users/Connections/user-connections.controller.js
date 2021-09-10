/**
 * Module dependencies.
 */
const _ = require('lodash'),
    express = require('express'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    UserConnection = mongoose.model('UserConnection'),
    path = require('path'),
    policy = require(path.resolve('./api/core/policy.controller')),
    errorHandler = require(path.resolve('./api/core/errors.controller')),
    config = require(path.resolve('./config')),
    notifications = require(path.resolve('./api/notifications/notifications.controller'));

/*
 * Add connection request api.
 * Successful process will return two status values: 
 * (
 *  1 --> request created successfully.
 *  2 --> Failed since Accepted Connection / Request from the profile / Request to the profile already exists.
 * )
 */
exports.addConnectionRequest = (req, res) => {
    if (req.body === null || req.body === undefined ||
        req.body.profileAccessibility === null || req.body.profileAccessibility === undefined || req.body.profileAccessibility === '' ||
        req.body.profileAccessibility.personal === null || req.body.profileAccessibility.personal === undefined || req.body.profileAccessibility.personal === '' ||
        req.body.profileAccessibility.professional === null || req.body.profileAccessibility.professional === undefined || req.body.profileAccessibility.professional === '') {
        return res.status(422).send({
            message: 'Invalid connection request input'
        });
    }

    let conditions = {
        $and: [
            {
                $or: [
                    {
                        $and: [
                            { 'fromUser': req.currentUser._id },
                            { 'toUser': req.user._id }
                        ]
                    },
                    {
                        $and: [
                            { 'fromUser': req.user._id },
                            { 'toUser': req.currentUser._id }
                        ]
                    }
                ]
            },
            {
                $or: [
                    { 'status': 'REQUESTED' },
                    { 'status': 'ACCEPTED' }
                ]
            }
        ]
    };

    UserConnection.find(conditions, (filterErr, connections) => {
        if (filterErr) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(filterErr)
            });
        }

        if (connections !== null && connections !== undefined && connections.length > 0) {

            if (connections[0].status === 'ACCEPTED') {
                return res.json(
                    {
                        status: 2,
                        message: 'Connection with the profile already exists.',
                        result: {
                            connection_status: connections[0].status,
                            connection_id: connections[0]._id,
                        }
                    }
                );
            }
            else {
                if (connections[0].fromUser.toString() === req.currentUser._id) {
                    return res.json(
                        {
                            status: 2,
                            message: 'Connection request to the profile already exists.',
                            result: {
                                connection_status: connections[0].status,
                                connection_id: connections[0]._id,
                            }
                        }
                    );
                }
                else {
                    return res.json(
                        {
                            status: 2,
                            message: 'Connection request from the profile already exists. Please accept the same.',
                            result: {
                                connection_status: 'REQUESTEDFROM',
                                connection_id: connections[0]._id,
                            }
                        }
                    );
                }
            }
        }

        let userConnection = new UserConnection({
            fromUser: req.currentUser._id,
            toUser: req.user._id,
            status: 'REQUESTED',
            toUserProfileAccessibility: {
                personal: req.body.profileAccessibility.personal,
                professional: req.body.profileAccessibility.professional
                //dating: false
            }
        });
        userConnection.save((processErr, connection) => {
            if (processErr) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(processErr)
                });
            }

            /// To create connection request notification.
            createConnectionRequestNotification(req, connection._id);

            return res.json(
                {
                    status: 1,
                    message: 'Connection request added',
                    result: {
                        connection_status: connection.status,
                        connection_id: connection._id,
                    }
                }
            );
        });

    });
};

/*
 * To get connection status between two profiles.
 */
exports.getConnectionStatus = (req, res) => {
    let connectionStatus = 'NONE';
    let connectionObjId = undefined;

    let conditions = {
        $and: [
            { 'fromUser': req.currentUser._id },
            { 'toUser': req.user._id },
            {
                $or: [
                    { 'status': 'REQUESTED' },
                    { 'status': 'ACCEPTED' }
                ]
            }
        ]
    };

    // request to profile logic
    UserConnection.findOne(conditions, (filterErr, connectionObj) => {
        if (filterErr) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(filterErr)
            });
        }

        if (connectionObj !== null && connectionObj !== undefined) {
            connectionStatus = connectionObj.status;
            connectionObjId = connectionObj._id;

            return res.json(
                {
                    connection_status: connectionStatus,
                    connection_id: connectionObjId,
                }
            );
        }
        // request from profile logic.
        else {

            conditions = {
                $and: [
                    { 'fromUser': req.user._id },
                    { 'toUser': req.currentUser._id },
                    {
                        $or: [
                            { 'status': 'REQUESTED' },
                            { 'status': 'ACCEPTED' }
                        ]
                    }
                ]
            };

            UserConnection.findOne(conditions, (filterErr, connectionObj) => {
                if (filterErr) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(filterErr)
                    });
                }

                if (connectionObj !== null && connectionObj !== undefined) {
                    connectionStatus = connectionObj.status;
                    connectionObjId = connectionObj._id;

                    if (connectionStatus === 'REQUESTED') {
                        connectionStatus = 'REQUESTEDFROM';
                    }
                }

                return res.json(
                    {
                        connection_status: connectionStatus,
                        connection_id: connectionObjId,
                    }
                );
            });
        }
    });
}

/*
 * API to get the connection request list to current user which are not accepted or ignored up to now.
 */
exports.getConnectionRequests = (req, res) => {
    conditions = {
        $and: [
            { 'toUser': req.currentUser._id },
            { 'status': 'REQUESTED' }
        ]
    };

    UserConnection.find(conditions).populate('fromUser').exec((err, conRequests) => {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }

        let output = [];
        if (conRequests !== null || conRequests !== undefined) {
            conRequests.forEach(request => {
                request.status = 'REQUESTEDFROM';
            });
            output = conRequests;
        }

        return res.json(output);
    });
}

/*
 * API to reject connection request.
 * Successful process will return two status values: 
 * (
 *  1 --> Request ignored successfully.
 *  2 --> Failed since request already got Accepted / Removed (Deleted, Rejected)
 * )
 */
exports.rejectConnectionRequest = (req, res) => {
    const connectionId = req.params.connectionId;
    if (connectionId === null || connectionId === undefined || connectionId === '') {
        return res.status(400).send({
            message: 'Invalid parameter'
        });
    }

    const conditions = {
        '_id': connectionId
    };

    UserConnection.findOne(conditions, (filterErr, connection) => {
        if (filterErr) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(filterErr)
            });
        }

        if (connection === null || connection === undefined) {
            return res.json(
                {
                    status: 2,
                    message: 'Connection request could not be ignored, since its already removed.',
                    result: {
                        connection_status: 'NONE',
                        connection_id: undefined
                    }
                }
            );
        }

        if (connection.toUser.toString() !== req.currentUser._id) {
            return res.status(400).send({
                message: 'Unauthorized request'
            });
        }

        if (connection.status === 'ACCEPTED') {
            return res.json(
                {
                    status: 2,
                    message: 'Connection request could not be ignored, since its already accepted.',
                    result: {
                        connection_status: connection.status,
                        connection_id: connection._id
                    }
                }
            );
        }
        else if (connection.status !== 'REQUESTED') {
            return res.json(
                {
                    status: 2,
                    message: 'Connection request could not be ignored, since its already removed.',
                    result: {
                        connection_status: 'NONE',
                        connection_id: undefined
                    }
                }
            );
        }

        UserConnection.findOneAndUpdate({ '_id': connectionId }, { status: 'REJECTED' }, { new: true }).exec((updateErr, updateRes) => {
            if (updateErr) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(updateErr)
                });
            }

            if (updateRes === null || updateRes === undefined || updateRes._id != connectionId || updateRes.status !== 'REJECTED') {
                return res.status(400).send({
                    message: 'Ignore connection request failed'
                });
            }

            return res.json({
                status: 1,
                message: 'Connection request ignored.',
                result: {
                    connection_status: 'NONE',
                    connection_id: undefined
                }
            });
        });
    });
}

/*
 * API to delete connection request.
 * Successful process will return two status values: 
 * (
 *  1 --> Request deleted successfully.
 *  2 --> Failed since request already got Accepted / Removed (Deleted, Rejected)
 * )
 */
exports.deleteConnectionRequest = (req, res) => {
    const connectionId = req.params.connectionId;
    if (connectionId === null || connectionId === undefined || connectionId === '') {
        return res.status(400).send({
            message: 'Invalid parameter'
        });
    }

    const conditions = {
        '_id': connectionId
    };

    UserConnection.findOne(conditions, (filterErr, connection) => {
        if (filterErr) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(filterErr)
            });
        }

        if (connection === null || connection === undefined) {
            return res.json(
                {
                    status: 2,
                    message: 'Connection request could not be deleted, since its already removed.',
                    result: {
                        connection_status: 'NONE',
                        connection_id: undefined
                    }
                }
            );
        }

        if (connection.fromUser.toString() !== req.currentUser._id) {
            return res.status(400).send({
                message: 'Unauthorized request'
            });
        }

        if (connection.status === 'ACCEPTED') {
            return res.json(
                {
                    status: 2,
                    message: 'Connection request could not be deleted, since its already accepted.',
                    result: {
                        connection_status: connection.status,
                        connection_id: connection._id
                    }
                }
            );
        }
        else if (connection.status !== 'REQUESTED') {
            return res.json(
                {
                    status: 2,
                    message: 'Connection request could not be deleted, since its already removed.',
                    result: {
                        connection_status: 'NONE',
                        connection_id: undefined
                    }
                }
            );
        }

        UserConnection.findOneAndDelete(conditions).exec((deleteErr, deleteRes) => {
            if (deleteErr) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(deleteErr)
                });
            }

            if (deleteRes === null || deleteRes === undefined || deleteRes._id != connectionId) {
                return res.status(400).send({
                    message: 'Connection request deletion failed'
                });
            }

            return res.json({
                status: 1,
                message: 'Connection request deleted.',
                result: {
                    connection_status: 'NONE',
                    connection_id: undefined
                }
            });
        });
    });
}

/*
* API to accept connection request.
* (
*  1 --> Request accepted successfully.
*  2 --> Failed since request already got Accepted / Removed (Deleted, Rejected)
* )
*/
exports.acceptConnectionRequest = (req, res) => {
    const connectionId = req.params.connectionId;
    if (connectionId === null || connectionId === undefined || connectionId === '') {
        return res.status(400).send({
            message: 'Invalid parameter'
        });
    }

    if (req.body === null || req.body === undefined ||
        req.body.profileAccessibility === null || req.body.profileAccessibility === undefined || req.body.profileAccessibility === '' ||
        req.body.profileAccessibility.personal === null || req.body.profileAccessibility.personal === undefined || req.body.profileAccessibility.personal === '' ||
        req.body.profileAccessibility.professional === null || req.body.profileAccessibility.professional === undefined || req.body.profileAccessibility.professional === '') {
        return res.status(422).send({
            message: 'Invalid connection accept input'
        });
    }

    const conditions = {
        '_id': connectionId
    };

    UserConnection.findOne(conditions, (filterErr, connection) => {
        if (filterErr) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(filterErr)
            });
        }

        if (connection === null || connection === undefined) {
            return res.json(
                {
                    status: 2,
                    message: 'Connection request could not be accepted, since its already removed.',
                    result: {
                        connection_status: 'NONE',
                        connection_id: undefined
                    }
                }
            );
        }

        if (connection.toUser.toString() !== req.currentUser._id) {
            return res.status(400).send({
                message: 'Unauthorized request'
            });
        }

        if (connection.status === 'ACCEPTED') {
            return res.json(
                {
                    status: 2,
                    message: 'Connection request could not be accepted, since its already accepted.',
                    result: {
                        connection_status: connection.status,
                        connection_id: connection._id
                    }
                }
            );
        }
        else if (connection.status !== 'REQUESTED') {
            return res.json(
                {
                    status: 2,
                    message: 'Connection request could not be accepted, since its already removed.',
                    result: {
                        connection_status: 'NONE',
                        connection_id: undefined
                    }
                }
            );
        }

        updateData = {
            status: 'ACCEPTED',
            fromUserProfileAccessibility: {
                personal: req.body.profileAccessibility.personal,
                professional: req.body.profileAccessibility.professional
                //dating: false
            }
        };

        UserConnection.findOneAndUpdate(conditions, updateData, { new: true }).exec((updateErr, updateRes) => {
            if (updateErr) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(updateErr)
                });
            }

            if (updateRes === null || updateRes === undefined || updateRes._id != connectionId || updateRes.status !== 'ACCEPTED') {
                return res.status(400).send({
                    message: 'Accept connection request failed.'
                });
            }


            //////////Create connection start---------------------->
            createConnectionContacts(req, updateRes, ((contErr, contRes) => {
                if (contErr) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(contErr)
                    });
                }

                if (!contRes.status) {
                    return res.status(400).send({
                        message: 'Accept connection request partially failed.'
                    });
                }

                UserConnection.findOneAndUpdate(conditions, { fromUserProfileAccessibility: undefined, toUserProfileAccessibility: undefined }, { new: true }).exec((e, r) => {

                });

                return res.json({
                    status: 1,
                    message: 'Connection request accepted.',
                    result: {
                        connection_status: updateRes.status,
                        connection_id: updateRes._id
                    }
                });
            }));
            //////////<------------------------Create connection end
        });
    });
}

/*
* API to close an existing connection.
*/
exports.closeConnection = (req, res) => {
    const connectionId = req.params.connectionId;
    if (connectionId === null || connectionId === undefined || connectionId === '') {
        return res.status(400).send({
            message: 'Invalid parameter'
        });
    }

    const conditions = {
        '_id': connectionId
    };

    UserConnection.findOne(conditions, (filterErr, connection) => {
        if (filterErr) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(filterErr)
            });
        }

        if (connection === null || connection === undefined) {
            return res.json(
                {
                    status: 2,
                    message: 'Connection could not be removed, since its already removed.',
                    result: {
                        connection_status: 'NONE',
                        connection_id: undefined
                    }
                }
            );
        }

        if (connection.toUser.toString() !== req.currentUser._id && connection.fromUser.toString() !== req.currentUser._id) {
            return res.status(400).send({
                message: 'Unauthorized request'
            });
        }

        if (connection.status === 'CLOSED') {
            return res.json(
                {
                    status: 2,
                    message: 'Connection could not be removed, since its already removed.',
                    result: {
                        connection_status: 'NONE',
                        connection_id: undefined
                    }
                }
            );
        }
        else if (connection.status !== 'ACCEPTED') {
            return res.json(
                {
                    status: 2,
                    message: 'Connection could not be removed, since its not existing.',
                    result: {
                        connection_status: 'NONE',
                        connection_id: undefined
                    }
                }
            );
        }

        UserConnection.findOneAndUpdate(conditions, { status: 'CLOSED' }, { new: true }).exec((updateErr, updateRes) => {
            if (updateErr) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(updateErr)
                });
            }

            if (updateRes === null || updateRes === undefined || updateRes._id != connectionId || updateRes.status !== 'CLOSED') {
                return res.status(400).send({
                    message: 'Remove connection process failed.'
                });
            }

            //////////Delete connection start---------------------->
            deleteConnectionContacts(req, updateRes, ((contErr, contRes) => {
                if (contErr) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(contErr)
                    });
                }

                if (!contRes.status) {
                    return res.status(400).send({
                        message: 'Remove Connection request partially failed.'
                    });
                }

                return res.json({
                    status: 1,
                    message: 'Connection removed.',
                    result: {
                        connection_status: 'NONE',
                        connection_id: undefined
                    }
                });
            }));
            //////////<------------------------Delete connection end
        });
    });
}

/*
 * API to get the status list of all active connection objects of current user.
 */
exports.getConnectionSatusList = (req, res) => {
    conditions = {
        $and: [
            {
                $or: [
                    { 'toUser': req.currentUser._id },
                    { 'fromUser': req.currentUser._id }
                ]
            },
            {
                $or: [
                    { 'status': 'REQUESTED' },
                    { 'status': 'ACCEPTED' }
                ]
            }
        ]
    };

    UserConnection.find(conditions).exec((err, conRequests) => {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }

        let output = [];
        if (conRequests !== null || conRequests !== undefined) {
            output = conRequests;
        }

        return res.json(output);
    });
}

/*
 * API to get the connection request list from current user which are not accepted or ignored upto now.
 */
exports.getPendingConnectionRequests = (req, res) => {
    conditions = {
        $and: [
            { 'fromUser': req.currentUser._id },
            { 'status': 'REQUESTED' }
        ]
    };

    UserConnection.find(conditions).populate('toUser').exec((err, conRequests) => {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }

        let output = [];
        if (conRequests !== null || conRequests !== undefined) {
            output = conRequests;
        }

        return res.json(output);
    });
}

/// to update the profile accessiblity settings of a connection
exports.updateProfileAccessibility = (req, res) => {
    if (req.body === null || req.body === undefined ||
        req.body.profileAccessibility === null || req.body.profileAccessibility === undefined || req.body.profileAccessibility === '' ||
        req.body.profileAccessibility.personal === null || req.body.profileAccessibility.personal === undefined || req.body.profileAccessibility.personal === '' ||
        req.body.profileAccessibility.professional === null || req.body.profileAccessibility.professional === undefined || req.body.profileAccessibility.professional === '' ||
        req.body.contactId === null || req.body.contactId === undefined || req.body.contactId === '') {
        return res.status(422).send({
            message: 'Invalid connection profile accessibility request input'
        });
    }

    updateContactProfileAccessibility(req, (upErr, upRes) => { 
        if (upErr) {
            return res.status(500).send({
                message: errorHandler.getErrorMessage(upErr)
            });
        }

        return res.json(upRes);
    });
}












//// to manage contacts while accepting a connection requests.
function createConnectionContacts(req, connection, callBack) {
    let output = { status: false };

    UserConnection.findById(connection._id).populate('fromUser').populate('toUser').exec((getErr, getRes) => {
        if (getErr) {
            callBack(getErr, output);
            return;
        }

        if (getRes === null || getRes === undefined || getRes.fromUser === null || getRes.fromUser === undefined || getRes.toUser === null || getRes.toUser === undefined) {
            callBack(getErr, output);
            return;
        }

        createContact(req, connection._id, getRes.fromUser, getRes.toUser, getRes.toUserProfileAccessibility, ((createErr1, CreateRes1) => {
            if (createErr1) {
                callBack(createErr1, output);
                return;
            }

            if (!CreateRes1.status) {
                callBack(createErr1, output);
                return;
            }

            createContact(req, connection._id, getRes.toUser, getRes.fromUser, getRes.fromUserProfileAccessibility, ((createErr2, CreateRes2) => {
                if (createErr2) {
                    callBack(createErr2, output);
                    return;
                }

                if (!CreateRes2.status) {
                    callBack(createErr2, output);
                    return;
                }

                output.status = true;
                callBack(createErr2, output);
            }));
        }));
    });
}

///to delete contacts of a connection while disconnecting it.
function deleteConnectionContacts(req, connection, callBack) {
    let output = { status: false };

    deleteContact(req, connection.fromUser, connection.toUser, ((delErr1, delRes1) => {
        if (delErr1) {
            callBack(delErr1, output);
            return;
        }

        if (!delRes1.status) {
            callBack(delErr1, output);
            return;
        }

        deleteContact(req, connection.toUser, connection.fromUser, ((delErr2, delRes2) => {
            if (delErr2) {
                callBack(delErr2, output);
                return;
            }

            if (!delRes2.status) {
                callBack(delErr2, output);
                return;
            }

            output.status = true;
            callBack(delErr2, output);
        }));
    }));
}

/// to create a contact for a connection.
function createContact(req, connectionIdVal, inProfile, contactProfile, contactProfileAccessibility, callBack) {
    let output = { status: false };

    let filter = {
        "fromId": inProfile._id,
        "toId": contactProfile._id
    };

    doContactRequest(req, `/api/contacts/isMyContact`, 'POST', filter, ((err, res, body) => {
        if (err) {
            callBack(err, output);
            return;
        }

        if (res.statusCode != 200) {
            var parmError = new Error('Error occured');
            parmError.name = 'Error';
            callBack(parmError, output);
            return;
        }

        /// is not a contact upto now
        if (!body) {
            var newContact = {
                firstName: contactProfile.profile.firstName,
                lastName: contactProfile.profile.lastName,
                email: contactProfile.email,
                linkedProfile: { _id: contactProfile._id.toString() },
                user: inProfile._id,
                contactMode: 'CONNECTION',
                connectionId: { _id: connectionIdVal.toString() },
                profileAccessibility: {
                    personal: contactProfileAccessibility.personal,
                    professional: contactProfileAccessibility.professional//,
                    //dating: true
                }
            };

            doContactRequest(req, '/api/contacts', 'POST', newContact, ((createErr, createRes, createBody) => {
                if (createErr) {
                    callBack(createErr, output);
                    return;
                }

                if (createRes.statusCode != 200) {
                    var createParmError = new Error('Error occured');
                    createParmError.name = 'Error';
                    callBack(createParmError, output);
                    return;
                }

                output.status = true;
                callBack(createErr, output);
            }));
        }
        /// if its already a contact
        else {
            var currentContact = {
                "updateType": "MODE_UPDATE",
                "contact": body
            };
            currentContact.contact.contactMode = 'CONTACT_CONNECTION';
            currentContact.contact.connectionId = { _id: connectionIdVal.toString() };
            currentContact.contact.profileAccessibility = {
                personal: contactProfileAccessibility.personal,
                professional: contactProfileAccessibility.professional//,
                //dating: true
            };

            doContactRequest(req, `/api/contacts/${currentContact.contact._id.toString()}`, 'PUT', currentContact, ((updateErr, updateRes, updateBody) => {
                if (updateErr) {
                    callBack(updateErr, output);
                    return;
                }

                if (updateRes.statusCode != 204) {
                    var updateParmError = new Error('Error occured');
                    updateParmError.name = 'Error';
                    callBack(updateParmError, output);
                    return;
                }

                output.status = true;
                callBack(updateErr, output);
            }));
        }
    }));
}

/// to delete a contact.
function deleteContact(req, fromId, toId, callBack) {
    let output = { status: false };

    let filter = {
        "fromId": fromId,
        "toId": toId
    };

    doContactRequest(req, `/api/contacts/isMyContact`, 'POST', filter, ((err, res, body) => {
        if (err) {
            callBack(err, output);
            return;
        }

        if (res.statusCode != 200) {
            var parmError = new Error('Error occured');
            parmError.name = 'Error';
            callBack(parmError, output);
            return;
        }

        if (!body) {
            output.status = true;
            callBack(err, output);
            return;
        }

        if (body.contactMode === 'CONNECTION') {
            doContactRequest(req, `/api/contacts/${body._id.toString()}`, 'DELETE', {}, ((deleteErr, deleteRes, deleteBody) => {
                if (deleteErr) {
                    callBack(deleteErr, output);
                    return;
                }

                if (deleteRes.statusCode != 204) {
                    var deleteParmError = new Error('Error occured');
                    deleteParmError.name = 'Error';
                    callBack(deleteParmError, output);
                    return;
                }

                output.status = true;
                callBack(deleteErr, output);
            }));
        }
        else {
            var currentContact = {
                "updateType": "MODE_UPDATE",
                "contact": body
            };
            currentContact.contact.contactMode = 'CONTACT';
            currentContact.contact.connectionId = undefined;
            currentContact.contact.profileAccessibility = undefined;

            doContactRequest(req, `/api/contacts/${currentContact.contact._id.toString()}`, 'PUT', currentContact, ((updateErr, updateRes, updateBody) => {
                if (updateErr) {
                    callBack(updateErr, output);
                    return;
                }

                if (updateRes.statusCode != 204) {
                    var updateParmError = new Error('Error occured');
                    updateParmError.name = 'Error';
                    callBack(updateParmError, output);
                    return;
                }

                output.status = true;
                callBack(updateErr, output);
            }));
        }
    }));
}

/// to update connection contact profile accessiblity
function updateContactProfileAccessibility(req, callBack) {
    let output = { status: false };

    doContactRequest(req, `/api/contacts/${req.body.contactId}`, 'GET', {}, ((err, res, body) => {
        if (err) {
            callBack(err, output);
            return;
        }

        if (res.statusCode != 200) {
            var parmError = new Error('Error occured');
            parmError.name = 'Error';
            callBack(parmError, output);
            return;
        }

        if (body === null || body === undefined || body === '' || body._id.toString() !== req.body.contactId) {
            var outputError = new Error('Invalid contact data');
            outputError.name = 'Error';
            callBack(outputError, output);
            return;
        }

        if (body.contactMode !== 'CONNECTION' && body.contactMode !== 'CONTACT_CONNECTION') {
            var outputError = new Error('Contact is not part of a connection');
            outputError.name = 'Error';
            callBack(outputError, output);
            return;
        }

        var currentContact = {
            "updateType": "MODE_UPDATE",
            "contact": body
        };
        currentContact.contact.profileAccessibility = {
            personal: req.body.profileAccessibility.personal,
            professional: req.body.profileAccessibility.professional//,
            //dating: true
        };

        doContactRequest(req, `/api/contacts/${currentContact.contact._id.toString()}`, 'PUT', currentContact, ((updateErr, updateRes, updateBody) => {
            if (updateErr) {
                callBack(updateErr, output);
                return;
            }

            if (updateRes.statusCode != 204) {
                var updateParmError = new Error('Error occured');
                updateParmError.name = 'Error';
                callBack(updateParmError, output);
                return;
            }

            output.status = true;
            callBack(updateErr, output);
        }));
    }));
}

/// to do a request to contact Apis.
function doContactRequest(req, endUrl, type, body, callBack) {
    if (req === null || req === undefined || endUrl === null || endUrl === undefined || type === null || type === undefined) {
        var parmError = new Error('invalid request');
        parmError.name = 'requestNotOk';
        callBack(parmError, output);
        return;
    }

    const token = policy.getTokenFromRequest(req);
    if (token === null || token === undefined || token === '') {
        var tokenError = new Error('token empty');
        tokenError.name = 'requestNotOk';
        callBack(tokenError, output);
        return;
    }

    var options = {
        url: `${config.contactURI}${endUrl}`,
        headers: {
            'Content-type': 'application/json',
            'Authorization': `JWT ${token}`,
            'Host': req.headers.host
        },
        method: type,
        json: true,
        body: body
    };

    request(options, function (error, response, body) {
        callBack(error, response, body);
    });
}

/*
 *  To create connection request notification
 */
function createConnectionRequestNotification(req, connectionId) {

    titleVal = 'You have a connection request';
    userName = '';
    if (req.currentUser.profile !== null && req.currentUser.profile !== undefined) {
        userName = req.currentUser.profile.firstName;
        if (userName === null || userName === undefined) {
            userName = '';
        }

        lastName = req.currentUser.profile.lastName;
        if (lastName !== null && lastName !== undefined && lastName !== '') {
            if (userName == '') {
                userName = lastName;
            }
            else {
                userName = userName + ' ' + lastName;
            }
        }
    }

    if (userName !== '') {
        titleVal = titleVal + ' from ' + userName;
    }

    notifications.createConnectionRequestNotification({
        title: titleVal,
        actionData: { connectionId: connectionId },
        actionResult: '',
        user: req.user
    });
}