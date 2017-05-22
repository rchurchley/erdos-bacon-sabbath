// Built-in modules
const fs = require('fs');
const path = require('path');
const request = require('request');

// Ensure the working directory is the same as the script directory
process.chdir(__dirname);

// Populate list of featured people, and randomize the order every hour
let featured_list = []
get_featured_list();
setInterval(function() { shuffle(featured_list); }, 3600000);

/* SETUP *
 * ===== */

const express = require('express');
const app = express();
app.set('port', process.env.PORT || 3000);

const expresshandlebars = require('express-handlebars');
app.engine('handlebars', expresshandlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// Logging
const morgan = require('morgan');
app.use(morgan(':date[clf] | :status :method :url --> :remote-addr (:response-time ms)'));


/* ROUTING *
 * ======= */

app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'ignore', etag: false, extensions: ['html', 'htm'] }));

app.use('/api', express.static(path.join(__dirname, '..', 'data'), { dotfiles: 'ignore', etag: false, extensions: ['json'] }));

app.use('/images', express.static(path.join(__dirname, '..', 'images'), { dotfiles: 'ignore', etag: false, extensions: ['jpeg', 'jpg'] }));

app.get('/', function (req, res) {
  res.render('homepage', { people: featured_list, title: 'Home' });
});

app.get('/frequently-asked-questions/', function(req, res) {
  res.render('faq');
});

app.get('/:person/', function (req, res) {
  let api_path = path.join(__dirname, '..', 'data', req.params['person'] + '.json');
  let img_license_path = path.join(__dirname, '..', 'images', req.params['person'], 'LICENSE');
  fs.readFile(api_path, 'utf8', function (person_err, person_data) {
    fs.readFile(img_license_path, 'utf8', function (license_err, license_data) {
      if (person_err || license_err) {
        console.log(person_err || license_err);
        res.status(404).render('404');
      } else {
        person = JSON.parse(person_data);
        license = JSON.parse(license_data);
        res.render('profile',
          {
            title: person['name'],
            url_name: req.params['person'],
            person: person,
            copyright: license
          }
        );
      }
    });
  });
});


/* SERVER *
 * ====== */

app.listen(app.get('port'), function () {
  console.log('Now listening on port ' + app.get('port') + "; press Ctrl+C to terminate.")
})


/* HELPER FUNCTIONS *
 * ================ */

function get_featured_list() {
  request(
    {
      url: "https://api.github.com/repos/rchurchley/erdos-bacon-sabbath/contents/data",
      headers: { 'User-Agent': "erdosbaconsabbath-bot" }
    },
    function (error, response, body) {
      if (error) {
        console.error(error);
        setTimeout(get_featured_list, 5000); // retry after five seconds
      } else {
        featured_list = peopleFromGithubResponse(JSON.parse(body));
        console.log("Successfully retrieved " + featured_list.length + " items from GitHub.");
        shuffle(featured_list);
      }
    }
  );
  // fs.readdir(path.join(__dirname, '..', 'data'), function (err, items) {
  //   featured_list = items.filter(function (filename) {
  //     return filename.endsWith('.json');
  //   }).map(personObjectFromFilename);
  // });
};

function peopleFromGithubResponse(array) {
  return array.map(function (element) {
    return element['name'];
  }).filter(function (filename) {
    return filename.endsWith('.json');
  }).map(personObjectFromFilename);
};

function personObjectFromFilename(filename) {
  kebabCaseName = filename.replace('.json', '');
  return {
    url_name: kebabCaseName,
    name: getProperNameFromKebab(kebabCaseName)
  }
}

function getProperNameFromKebab(kebabCaseName) {
  return kebabCaseName.replace('-', ' ')
    .replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); })
}

/**
 * Randomize array in-place using Durstenfeld's shuffle algorithm.
 * See: http://stackoverflow.com/a/12646864
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}
