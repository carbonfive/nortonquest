export default function(request, response, next) {
  if (request.session.room) {
    next();
  } else {
    response.redirect('/login');
  }
}
