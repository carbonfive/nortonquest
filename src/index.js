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

const code = "COLMA";

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
    geopoint: { latitude: 34.0422911, longitude: -118.44602250000003 },
    code: 'bl'
  },
  {
    geopoint: { latitude: 34.0422911, longitude: -118.44602250000003 },
    code: 'rls'
  },
  {
    geopoint: { latitude: 34.0422911, longitude: -118.44602250000003 },
    code: 'ship'
  },
  {
    geopoint: { latitude: 34.0422911, longitude: -118.44602250000003 },
    code: 'wf'
  },
  {
    geopoint: { latitude: 34.0422911, longitude: -118.44602250000003 },
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
          console.log(team);
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
        layer: "c5test2exampbqoi",
        deletedHotspots: [],
        hotspots:[],
        actions: [ {
          label: "Dashboard",
          uri: `http:\/\/rudyjahchan-c5-node.ngrok.io?layarUserId=${layarUserId}`,
          contentType: "text\/html",
          method: "GET",
          closeBiw: true
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
                id: "outsideNorton",
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
                  size: 4.0
                },
                transform: {
                  rotate: {
                    rel: true,
                    axis: { x: 0, y: 0, z: 1 },
                    angle: 0
                  }
                },
                showSmallBiw: false,
                showBiwOnClick: false,
                actions: [ {
                  label: "Tag",
                  uri: `http:\/\/rudyjahchan-c5-node.ngrok.io\/tag?code=${location.code}&layarUserId=${layarUserId}`,
                  contentType: "text\/html",
                  method: "GET",
                  closeBiw: true
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
        layer: "exampleizgo",
        deletedHotspots: [],
        hotspots: [
          {
            id: "internalNorton",
            anchor: {
              referenceImage: "meow"
            },
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
            showSmallBiw: false,
            showBiwOnClick: false,
            actions: [ {
              label: "Open Clue",
              uri: `http:\/\/rudyjahchan-c5-node.ngrok.io?layarUserId=${layarUserId}`,
              contentType: "text\/html",
              method: "GET",
              closeBiw: true
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
        response.render(`riddles/${riddle}`, { team, letters: code.trim().split('') });
      } else {
        response.redirect('/');
      }
    })
    .get('/tag', authenticate, (request, response) => {
      const team = request.team;
      const lettersUnlocked = team.lettersUnlocked;
      const location = nextLocation(request.team);
      const code = request.query.code;
      if ((location.code == request.query.code) &&  (lettersUnlocked < 4)) {
        team.lettersUnlocked = lettersUnlocked + 1;
        response.render(`info/${location.code}`, { team });
      } else {
        response.redirect('/');
      }
    })
    .get('/sorry', authenticate, (request, response) => {
      response.render('sorry');
    });
}
