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
    code: 'bl',
    name: 'Bummer and Lazarus',
  },
  {
    geopoint: { latitude: 37.795113, longitude: -122.405809 },
    code: 'rls',
    name: 'Robert Louis Stevenson',
  },
  {
    geopoint: { latitude: 37.794895, longitude: -122.401768 },
    code: 'ship',
    name: 'Niantic',
  },
  {
    geopoint: { latitude: 37.793366, longitude: -122.402724 },
    code: 'wf',
    name: 'Wells Fargo',
  },
  {
    geopoint: { latitude: 37.787993, longitude: -122.401941 },
    code: 'ph',
    name: 'Palace Hotel',
  },
  {
    geopoint: { latitude: 37.7878949, longitude: -122.4034908 },
    code: 'lf',
    name: "Lotta's Fountain",
  },
  {
    geopoint: { latitude: 37.794656, longitude: -122.403632 },
    code: 'pe',
    name: 'Pony Express',
  },
  {
    geopoint: { latitude: 37.796350, longitude: -122.402830 },
    code: 'hb',
    name: 'Hotaling Building',
  },
  {
    geopoint: { latitude: 37.792594, longitude: -122.405762 },
    code: 'osm',
    name: "Old Saint Mary's Cathedral",
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
  } else if(team.lettersUnlocked >= 3) {
    return _locations[3];
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
      response.render('login', { failed: request.query.failed });
    })
    .post('/login', function(request, response) {
      const layarUserId = request.session.layarUserId;
      const { room, whiteMove0, blackMove, whiteMove1 } = request.body;
      teams.addLayarUser(layarUserId, { room, whiteMove0, blackMove, whiteMove1})
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
          response.redirect('/login?failed=1');
        });
    })
    .get('/logout', (request, response) => {
      teams.removeLayarUser(request.session.layarUserId)
        .then(() => response.redirect('/login'))
        .catch(() => response.redirect('/login'));
    })
    .get('/geo', function(request, response) {
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
        .then(function(team) {
          json.hotspots = locations()
            .map(function(location) {
              return {
                id: `${location.code}OutsideNorton`,
                anchor: {
                  geolocation: {
                    lat: location.geopoint.latitude,
                    lon: location.geopoint.longitude
                  }
                },
                text: {
                  title: `Emperor Norton - ${location.name}`
                },
                object: {
                  contentType: "image/png",
                  url: "http://s3.amazonaws.com/rudyjahchan/Norton.png",
                  reducedURL: "http://s3.amazonaws.com/rudyjahchan/Norton.png",
                  size: 3.5
                },
                transform: {
                  rotate: {
                    rel: true,
                    axis: { x: 0, y: 0, z: 1 },
                    angle: 0
                  }
                },
                showBiwOnClick: false,
                showSmallBiw: false,
                actions: [ {
                  label: "Tag",
                  uri: `http:\/\/${domain}\/tag?code=${location.code}&layarUserId=${layarUserId}`,
                  contentType: "text\/html",
                  method: "GET",
                }]
              }
            });

          response.json(json);
        })
        .catch(function(error) {
          response.json(json);
        });
    })
    .get('/vision', function(request, response) {
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
              size: 0.5
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
              uri: `http:\/\/${domain}/welcome?layarUserId=${layarUserId}`,
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
