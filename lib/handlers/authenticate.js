'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (request, response, next) {
  if (request.session.room) {
    next();
  } else {
    response.redirect('/login');
  }
};