import express from 'express';
import compress from 'compression';
import session from 'express-session';
import bodyParser from 'body-parser';
import geolib from 'geolib';

import teams from './models/teams';

function storeLayarUserId(request, response, next) {
  if(request.query.layarUserId) {
    request.session.layarUserId = request.query.layarUserId;
  }
  next();
}

const domain = process.env.NORTONQUEST_DOMAIN;
const geoLayer = process.env.NORTONQUEST_GEO_LAYER;
const visionLayer = process.env.NORTONQUEST_VISION_LAYER;
const referenceImage = process.env.NORTONQUEST_REFERENCE_IMAGE;

function authenticate(request, response, next) {
  teams.forLayarUser(request.session.layarUserId)
    .then((team) => {
      request.team = team;
      next();
    })
    .catch(() => {
      request.session.authenticationURL = request.originalUrl;
      response.redirect('/login');
    });
}

const _locations = [
  {
    geopoint: { latitude: 37.795264, longitude: -122.402122 },
    code: 'bl'
  },
  {
    geopoint: { latitude: 37.795113, longitude: -122.405809 },
    code: 'rls'
  },
  {
    geopoint: { latitude: 37.794895, longitude: -122.401768 },
    code: 'ship'
  },
  {
    geopoint: { latitude: 37.793366, longitude: -122.402724 },
    code: 'wf'
  },
  {
    geopoint: { latitude: 37.793366, longitude: -122.402724 },
    code: 'final'
  },
];

function locations() {
  return _locations;
}

function nextLocation(team) {
  if(team.lettersUnlocked >= 0 && team.lettersUnlocked < 3) {
    const routeIndex = team.lettersUnlocked;
    const locationIndex = team.route[routeIndex];
    return _locations[locationIndex];
  } else if(team.lettersUnlocked == 3) {
    return _locations[3];
  } else if(team.lettersUnlocked > 3) {
    return _locations[4];
  }
}

export default function() {
  const app = express();
  app.set('views', './lib/views');
  app.set('view engine', 'jade');
  app.disable('etag');
  return app
    .use(compress())
    .use('/stylesheets', express.static('./lib/stylesheets'))
    .use(bodyParser.urlencoded({ extended: false }))
    .use(session({
      secret: '1234'
    }))
    .use(storeLayarUserId)
    .get('/login', (request, response) => {
      response.render('login');
    })
    .post('/login', (request, response) => {
      teams.addLayarUser(request.session.layarUserId, request.body.room, request.body.move)
        .then((team) => {
          const session = request.session;
          const authenticationURL = session.authenticationURL;
          if(team.lettersUnlocked == 0) {
            response.render('info/c5', { team });
          } else if(authenticationURL) {
            delete session.authenticationURL;
            response.redirect(authenticationURL);
          } else {
            response.redirect('/');
          }
        })
        .catch((error) => {
          response.redirect('/login');
        });
    })
    .get('/logout', (request, response) => {
      teams.removeLayarUser(request.session.layarUserId)
        .then(() => response.redirect('/login'))
        .catch(() => response.redirect('/login'));
    })
    .get('/geo', (request, response) => {
      const layarUserId = request.query.userId;
      const json = {
        refreshInterval: 11,
        refreshDistance: 5,
        fullRefresh: true,
        errorCode: 0,
        errorString: "OK",
        layer: geoLayer,
        deletedHotspots: [],
        hotspots:[],
        actions: [ {
          label: "Dashboard",
          uri: `http:\/\/${domain}?layarUserId=${layarUserId}`,
          contentType: "text\/html",
          method: "GET",
        }],
      };
      teams.forLayarUser(layarUserId)
        .then((team) => {
          const location = nextLocation(team);
          const userLocation = { latitude: request.query.lat, longitude: request.query.lon };
          const distance = Math.abs(geolib.getDistance(userLocation, location.geopoint));

          let hotspots = [];
          if(distance < 25) {
            hotspots = [
              {
                id: `${location.code}OutsideNorton`,
                anchor: {
                  geolocation: {
                    lat: location.geopoint.latitude,
                    lon: location.geopoint.longitude
                  }
                },
                text: {
                  title: "Emperor Norton"
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
                actions: [ {
                  label: "Tag",
                  uri: `http:\/\/${domain}\/tag?code=${location.code}&layarUserId=${layarUserId}`,
                  contentType: "text\/html",
                  method: "GET",
                }]
              }
            ];
          };

          json.hotspots = hotspots;

          response.json(json);
        })
        .catch((error) => {
          response.json(json);
        });
    })
    .get('/vision', (request, response) => {
      const layarUserId = request.query.userId;
      response.json({
        fullRefresh: true,
        errorCode: 0,
        errorString: "OK",
        layer: visionLayer,
        deletedHotspots: [],
        hotspots: [
          {
            id: "internalNorton",
            anchor: { referenceImage },
            object: {
              url: "http://s3.amazonaws.com/rudyjahchan/Norton.png",
              contentType: "image/png",
              size: 0.25
            },
            transform: {
              rotate: {
                axis: {x: 1, y: 0, z: 0},
                angle: 90
              }
            },
            text: {
              title: "Emperor Norton",
            },
            showBiwOnClick: false,
            actions: [ {
              label: "Speak",
              uri: `http:\/\/${domain}?layarUserId=${layarUserId}`,
              contentType: "text\/html",
              method: "GET",
            }]
          },
        ]
      });
    })
    .get('/', authenticate, (request, response) => {
      const team = request.team;
      const lettersUnlocked = team.lettersUnlocked;
      const location = nextLocation(team);
      if (location) {
        let riddle = location.code;
        if (lettersUnlocked > 3) {
          riddle = 'final';
        }
        response.render(`riddles/${riddle}`, { team, letters: team.code.trim().split(''), layer: geoLayer });
      } else {
        respone.redirect('/login');
      }
    })
    .get('/tag', authenticate, (request, response) => {
      const team = request.team;
      const lettersUnlocked = team.lettersUnlocked;
      const location = nextLocation(request.team);
      const code = request.query.code;
      if ((location.code == code) &&  (lettersUnlocked < 4)) {
        team.lettersUnlocked = lettersUnlocked + 1;
        response.render(`info/${location.code}`, { team });
      } else if ((lettersUnlocked >= 4) && (code == 'final' || code == 'wf')) {
        response.redirect('/');
      } else {
        response.redirect('/sorry');
      }
    })
    .get('/welcome', (request, response) => {
      response.render('welcome');
    })
    .get('/sorry', authenticate, (request, response) => {
      response.render('sorry');
    });
}
