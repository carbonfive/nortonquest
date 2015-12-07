const _teams = [
  {
    name: 'foo',
    move: 'kb8',
    layarUserIds: {},
    route: [0,1,2],
    lettersUnlocked: 0,
  },
];

function all() {
  return _teams;
}

function addLayarUser(layarUserId, _room, _move) {
  const room = (_room || "").trim().toLowerCase();
  const move = (_move || "").trim().toLowerCase();

  return new Promise((resolve, reject) => {
    const validTeams = all().filter((team) => {
      return (team.name == room) && (team.move == move);
    });

    if (validTeams.length > 0) {
      const team = validTeams[0];
      team.layarUserIds[layarUserId] = true;
      resolve(team);
    } else {
      reject('invalid')
    };
  });
}

function forLayarUser(layarUserId) {
  return new Promise((resolve, reject) => {
    if(layarUserId) {
      const teamsWithLayarUserId = all().filter((team) => {
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
  return forLayarUser(layarUserId)
  .then((team) => {
    const teamLayerIds = team.layarUserIds;
    delete teamLayerIds[layarUserId];
    return true;
  });
}

export default { all, addLayarUser, forLayarUser, removeLayarUser };
