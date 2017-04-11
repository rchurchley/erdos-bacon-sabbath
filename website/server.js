// Built-in modules
var fs = require('fs');
var path = require('path');
var request = require('request');

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

app.get('/', function (req, res) {
  var people = []
  request({ url: "https://api.github.com/repos/rchurchley/erdos-bacon-sabbath/contents/data", headers: { 'User-Agent': "erdosbaconsabbath-bot" } },
    function (error, response, body) {
      if (error) {
        console.error(error);
      } else {
        items = JSON.parse(body);
        console.log("Successfully retrieved " + items.length + " items from GitHub.");
        for (var i = 0; i < items.length; i++) {
          if (items[i]['name'].endsWith('.json')) {
            people.push(
              {
                url_name: items[i]['name'].substring(0, items[i]['name'].length - 5),
                name: items[i]['name']
                  .substring(0, items[i]['name'].length - 5)
                  .replace('-', ' ')
                  .replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); })
              }
            );
          }
        };
        res.render('the_list', { people: people, title: 'Home' });
      }
    });
});

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
