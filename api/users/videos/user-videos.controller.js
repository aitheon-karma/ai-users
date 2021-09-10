// Copyright 2012-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const opn = require('opn');
const destroyer = require('server-destroy');
const { google } = require('googleapis');
const plus = google.plus('v1');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const config = require(path.resolve('./config'));
/**
 * Create a new OAuth2 client with the configured keys.
 */

let httpTransport = 'http://';
if (config.secure) {
  httpTransport = 'https://';
}
const baseUrl = config.environment == 'production' ? `${config.domain}` : `${config.domain}:${config.port}`
const oauth2Client = new google.auth.OAuth2(
  config.youtube.client_id,
  config.youtube.client_secret_id,
  `${httpTransport}${ baseUrl }${config.environment == 'production' ? '/users' : ''}/api/users/videos/oauthcallback`
);

// initialize the Youtube API library
const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client,
});

const scopes = [
  'https://www.googleapis.com/auth/youtube',
];

exports.authGoogle = (req, res) => {
  const authorizeUrl = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',
    // If you only need one scope you can pass it as a string
    scope: scopes,
    prompt: 'consent'
  });
  return res.status(200).send({
    authorizeUrl: authorizeUrl
  });
}

exports.oauthcallback = async (req, res) => {
  try {
    if (req.url.indexOf('/oauthcallback') > -1) {
      var qs = new url.URL(req.url, `${httpTransport}${ baseUrl }`).searchParams;
      const { tokens } = await oauth2Client.getToken(qs.get('code'));
      oauth2Client.setCredentials(tokens);

      User.findByIdAndUpdate(req.currentUser._id, {
        youtube_account: tokens
      })
        .exec((err, user) => {
          if (err) {
            return res.send(500, { message: err.message });
          }
          res.redirect(`${httpTransport}${ baseUrl }${config.environment == 'production' ? '/users' : ''}/public-profile#videos`);
        });
    }
  } catch (e) {
    return res.send(500, { message: e.message });
  }
}

exports.getPlaylist = async (req, res) => {
  try {
    let userId = req.params.userId || req.currentUser._id;
     User.findById(userId, 'youtube_account.refresh_token')
      .exec(async (err, user) => {
        if (err) {
          return res.send(500, { message: err.message });
        }
        const refresh_token = user.youtube_account ? user.youtube_account.refresh_token : undefined;
        if (!refresh_token) {
          return res.send(401, { message: 'User not linked to Youtube' });
        } else {

          oauth2Client.setCredentials({
            refresh_token: refresh_token
          });
          // the first query will return data with an etag
          const response = await getPlaylistData(null);
          const etag = response.data.etag;
          // the second query will (likely) return no data, and an HTTP 304
          // since the If-None-Match header was set with a matching eTag
          const playlist = await getPlaylistData(etag);
          return res.status(200).send(playlist.data);

        }
      });
  } catch (e) {
    return res.send(500, { message: e.message });
  }
}


exports.unlinkYoutube = (req, res) => {
  User.findByIdAndUpdate(req.currentUser._id, {
    $unset: {
      youtube_account: 1
    }
  })
    .exec((err, user) => {
      if (err) {
        return res.send(500, { message: err.message });
      }
      res.sendStatus(204);
    });
}

async function getPlaylistData(etag) {
  // Create custom HTTP headers for the request to enable use of eTags
  const headers = {};
  if (etag) {
    headers['If-None-Match'] = etag;
  }
  const res = await youtube.activities.list({
    part: 'snippet, contentDetails',
    mine: true,
    headers: headers,
    maxResults: 50,
  });
  return res;
}
