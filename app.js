var express = require('express');


var path = require('path');
var routes = require('./routes/index');

var app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);



app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
   app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.send( { msg : err.message } );
   });
}


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
   res.status(err.status || 500);
   res.send( { msg: err.message } );
  } );


module.exports = app;
