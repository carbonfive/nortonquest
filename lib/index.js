'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var app = (0, _express2.default)();
  app.set('views', './lib/views');
  app.set('view engine', 'jade');
  app.disable('etag');
  return app.use((0, _compression2.default)()).use('/stylesheets', _express2.default.static('./lib/stylesheets')).use(_bodyParser2.default.urlencoded({ extended: false })).use((0, _expressSession2.default)({
    secret: '1234'
  })).use(storeLayarUserId).get('/login', function (request, response) {
    response.render('login', { failed: request.query.failed });
  }).post('/login', function (request, response) {
    _teams2.default.addLayarUser(request.session.layarUserId, request.body.room, request.body.move).then(function (team) {
      var session = request.session;
      var authenticationURL = session.authenticationURL;
      if (team.lettersUnlocked == 0) {
        response.render('info/c5', { team: team });
      } else if (authenticationURL) {
        delete session.authenticationURL;
        response.redirect(authenticationURL);
      } else {
        response.redirect('/');
      }
    }).catch(function (error) {
      response.redirect('/login?failed=1');
    });
  }).get('/logout', function (request, response) {
    _teams2.default.removeLayarUser(request.session.layarUserId).then(function () {
      return response.redirect('/login');
    }).catch(function () {
      return response.redirect('/login');
    });
  }).get('/geo', function (request, response) {
    var layarUserId = request.query.userId;
    var json = {
      refreshInterval: 11,
      refreshDistance: 5,
      fullRefresh: true,
      errorCode: 0,
      errorString: "OK",
      layer: geoLayer,
      deletedHotspots: [],
      hotspots: [],
      actions: [{
        label: "Dashboard",
        uri: 'http://' + domain + '?layarUserId=' + layarUserId,
        contentType: "text\/html",
        method: "GET"
      }]
    };
    _teams2.default.forLayarUser(layarUserId).then(function (team) {
      var location = nextLocation(team);
      var userLocation = { latitude: request.query.lat, longitude: request.query.lon };
      var distance = Math.abs(_geolib2.default.getDistance(userLocation, location.geopoint));

      var hotspots = [];
      if (distance < 25) {
        hotspots = [{
          id: location.code + 'OutsideNorton',
          anchor: {
            geolocation: {
              lat: location.geopoint.latitude,
              lon: location.geopoint.longitude
            }
          },
          text: {
            title: 'Emperor Norton - ' + location.name
          },
          object: {
            contentType: "image/png",
            url: "http://s3.amazonaws.com/rudyjahchan/Norton.png",
            reducedURL: "http://s3.amazonaws.com/rudyjahchan/Norton.png",
            size: 2.0
          },
          transform: {
            rotate: {
              rel: true,
              axis: { x: 0, y: 0, z: 1 },
              angle: 0
            }
          },
          showBiwOnClick: false,
          actions: [{
            label: "Tag",
            uri: 'http://' + domain + '/tag?code=' + location.code + '&layarUserId=' + layarUserId,
            contentType: "text\/html",
            method: "GET"
          }]
        }];
      };

      json.hotspots = hotspots;

      response.json(json);
    }).catch(function (error) {
      response.json(json);
    });
  }).get('/vision', function (request, response) {
    var layarUserId = request.query.userId;
    response.json({
      fullRefresh: true,
      errorCode: 0,
      errorString: "OK",
      layer: visionLayer,
      deletedHotspots: [],
      hotspots: [{
        id: "internalNorton",
        anchor: { referenceImage: referenceImage },
        object: {
          url: "http://s3.amazonaws.com/rudyjahchan/Norton.png",
          contentType: "image/png",
          size: 0.5
        },
        transform: {
          rotate: {
            axis: { x: 1, y: 0, z: 0 },
            angle: 90
          }
        },
        text: {
          title: "Emperor Norton"
        },
        showBiwOnClick: false,
        actions: [{
          label: "Speak",
          uri: 'http://' + domain + '/welcome?layarUserId=' + layarUserId,
          contentType: "text\/html",
          method: "GET"
        }]
      }]
    });
  }).get('/', authenticate, function (request, response) {
    var team = request.team;
    var lettersUnlocked = team.lettersUnlocked;
    var location = nextLocation(team);
    if (location) {
      var riddle = location.code;
      if (lettersUnlocked > 3) {
        riddle = 'final';
      }
      response.render('riddles/' + riddle, { team: team, letters: team.code.trim().split(''), layer: geoLayer });
    } else {
      respone.redirect('/login');
    }
  }).get('/tag', authenticate, function (request, response) {
    var team = request.team;
    var lettersUnlocked = team.lettersUnlocked;
    var location = nextLocation(request.team);
    var code = request.query.code;
    if (location.code == code && lettersUnlocked < 4) {
      team.lettersUnlocked = lettersUnlocked + 1;
      response.render('info/' + location.code, { team: team });
    } else if (lettersUnlocked >= 4 && (code == 'final' || code == 'wf')) {
      response.redirect('/');
    } else {
      response.redirect('/sorry');
    }
  }).get('/welcome', function (request, response) {
    response.render('welcome');
  }).get('/sorry', authenticate, function (request, response) {
    response.render('sorry');
  });
};

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _compression = require('compression');

var _compression2 = _interopRequireDefault(_compression);

var _expressSession = require('express-session');

var _expressSession2 = _interopRequireDefault(_expressSession);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _geolib = require('geolib');

var _geolib2 = _interopRequireDefault(_geolib);

var _teams = require('./models/teams');

var _teams2 = _interopRequireDefault(_teams);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function storeLayarUserId(request, response, next) {
  if (request.query.layarUserId) {
    request.session.layarUserId = request.query.layarUserId;
  }
  next();
}

var domain = process.env.NORTONQUEST_DOMAIN;
var geoLayer = process.env.NORTONQUEST_GEO_LAYER;
var visionLayer = process.env.NORTONQUEST_VISION_LAYER;
var referenceImage = process.env.NORTONQUEST_REFERENCE_IMAGE;

function authenticate(request, response, next) {
  _teams2.default.forLayarUser(request.session.layarUserId).then(function (team) {
    request.team = team;
    next();
  }).catch(function () {
    request.session.authenticationURL = request.originalUrl;
    response.redirect('/login');
  });
}

var _locations = [{
  geopoint: { latitude: 37.795264, longitude: -122.402122 },
  code: 'bl',
  name: 'Bummer and Lazarus'
}, {
  geopoint: { latitude: 37.795113, longitude: -122.405809 },
  code: 'rls',
  name: 'Robert Louis Stevenson'
}, {
  geopoint: { latitude: 37.794895, longitude: -122.401768 },
  code: 'ship',
  name: 'Niantic'
}, {
  geopoint: { latitude: 37.793366, longitude: -122.402724 },
  code: 'wf',
  name: 'Wells Fargo'
}];

function locations() {
  return _locations;
}

function nextLocation(team) {
  if (team.lettersUnlocked >= 0 && team.lettersUnlocked < 3) {
    var routeIndex = team.lettersUnlocked;
    var locationIndex = team.route[routeIndex];
    return _locations[locationIndex];
  } else if (team.lettersUnlocked >= 3) {
    return _locations[3];
  }
}