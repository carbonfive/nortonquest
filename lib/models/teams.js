'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _teams = [{
  name: 'foo',
  move: 'kb8',
  layarUserIds: {},
  route: [0, 1, 2],
  lettersUnlocked: 0
}];

function all() {
  return _teams;
}

function addLayarUser(layarUserId, _room, _move) {
  var room = (_room || "").trim().toLowerCase();
  var move = (_move || "").trim().toLowerCase();

  return new Promise(function (resolve, reject) {
    var validTeams = all().filter(function (team) {
      return team.name == room && team.move == move;
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