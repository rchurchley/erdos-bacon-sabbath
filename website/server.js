// Built-in modules
var fs = require('fs');
var path = require('path');

// Ensure the working directory is the same as the script directory
process.chdir(__dirname);


/* SETUP *
 * ===== */

var express = require('express');
var app = express();
app.set('port', process.env.PORT || 3000);

var expresshandlebars = require('express-handlebars');
app.engine('handlebars', expresshandlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// Logging
var morgan = require('morgan');
app.use(morgan(':date[clf] | :status :method :url --> :remote-addr (:response-time ms)'));


/* ROUTING *
 * ======= */

app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'ignore', etag: false, extensions: ['html', 'htm'] }));

app.use('/api', express.static(path.join(__dirname, '..', 'data'), { dotfiles: 'ignore', etag: false, extensions: ['json'] }));

app.use('/images', express.static(path.join(__dirname, '..', 'images'), { dotfiles: 'ignore', etag: false, extensions: ['jpeg', 'jpg'] }));

app.get('/:person/', function (req, res) {
  var api_path = path.join(__dirname, '..', 'data', req.params['person'] + '.json');
  fs.readFile(api_path, 'utf8', function (err, data) {
    if (err) {
      res.status(404).sendFile('404.html', { root: path.join(__dirname, 'public') });
    } else {
      person = JSON.parse(data)
      res.render('profile', { person: person, title: person['name'], url_name: req.params['person'] });
    }
  });
});


/* SERVER *
 * ====== */

app.listen(app.get('port'), function () {
  console.log('Now listening on port ' + app.get('port') + "; press Ctrl+C to terminate.")
})
