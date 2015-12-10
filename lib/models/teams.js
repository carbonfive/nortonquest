'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _teams = [{
  name: 'aluminum',
  whiteMove0: 'nf6',
  blackMove: 'qf6',
  whiteMove1: 'qf8',
  layarUserIds: {},
  route: [0, 1, 2],
  lettersUnlocked: 0,
  code: "OCMLA"
}, {
  name: 'argon',
  whiteMove0: 'qb3',
  blackMove: 'kd4',
  whiteMove1: 'qd3',
  layarUserIds: {},
  route: [0, 2, 1],
  lettersUnlocked: 0,
  code: "CLMOA"
}, {
  name: 'helium',
  whiteMove0: 'qf6',
  blackMove: 'nf6',
  whiteMove1: 'be7',
  layarUserIds: {},
  route: [1, 0, 2],
  lettersUnlocked: 0,
  code: "MCLOA"
}, {
  name: 'iron',
  whiteMove0: 'qg8',
  blackMove: 'rg8',
  whiteMove1: 'nf7',
  layarUserIds: {},
  route: [1, 2, 0],
  lettersUnlocked: 0,
  code: "LMCOA"
}, {
  name: 'lithium',
  whiteMove0: 'nh5',
  blackMove: 'ke8',
  whiteMove1: 'nf6',
  layarUserIds: {},
  route: [2, 1, 0],
  lettersUnlocked: 0,
  code: "OLCMA"
}, {
  name: 'oxygen',
  whiteMove0: 'qf7',
  blackMove: 'rf7',
  whiteMove1: 're8',
  layarUserIds: {},
  route: [2, 0, 1],
  lettersUnlocked: 0,
  code: "CMOLA"
}, {
  name: 'titanium',
  whiteMove0: 'qf8',
  blackMove: 'nf8',
  whiteMove1: 're8',
  layarUserIds: {},
  route: [1, 0, 2],
  lettersUnlocked: 0,
  code: "MOLCA"
}, {
  name: 'zinc',
  whiteMove0: 'nf7',
  blackMove: 'bf7',
  whiteMove1: 'be7',
  layarUserIds: {},
  route: [2, 0, 1],
  lettersUnlocked: 0,
  code: "LOMCA"
}];

function all() {
  return _teams;
}

function addLayarUser(layarUserId, _ref) {
  var room = _ref.room;
  var whiteMove0 = _ref.whiteMove0;
  var blackMove = _ref.blackMove;
  var whiteMove1 = _ref.whiteMove1;

  var safeRoom = (room || "").trim().toLowerCase();
  var safeWhiteMove0 = (whiteMove0 || "").trim().toLowerCase();
  var safeBlackMove = (blackMove || "").trim().toLowerCase();
  var safeWhiteMove1 = (whiteMove1 || "").trim().toLowerCase();

  return new Promise(function (resolve, reject) {
    var validTeams = all().filter(function (team) {
      return team.name == safeRoom && team.whiteMove0 == safeWhiteMove0 && team.blackMove == safeBlackMove && team.whiteMove1 == safeWhiteMove1;
    });

    if (validTeams.length > 0) {
      var team = validTeams[0];
      team.layarUserIds[layarUserId] = true;
      resolve(team);
    } else {
      reject('invalid');
    };
  });
}

function forLayarUser(layarUserId) {
  return new Promise(function (resolve, reject) {
    if (layarUserId) {
      var teamsWithLayarUserId = all().filter(function (team) {
        return team.layarUserIds[layarUserId] == true;
      });

      if (teamsWithLayarUserId.length > 0) {
        resolve(teamsWithLayarUserId[0]);
      } else {
        reject();
      }
    } else {
      reject();
    }
  });
}

function removeLayarUser(layarUserId) {
  return forLayarUser(layarUserId).then(function (team) {
    var teamLayerIds = team.layarUserIds;
    delete teamLayerIds[layarUserId];
    return true;
  });
}

exports.default = { all: all, addLayarUser: addLayarUser, forLayarUser: forLayarUser, removeLayarUser: removeLayarUser };