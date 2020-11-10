var express = require('express');
var session = require('express-session');
var app = express();
const path = require('path');
var server = app.listen(8084, "0.0.0.0", function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
});
var bodyParser = require('body-parser');
var  jwt = require('jsonwebtoken');
var passport = require('passport');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
global.rootPath = __dirname;

const Sequelize = require('sequelize'); 
var connectString = "postgres://qba:qba@127.0.0.1:5432/qba";

var User = require('./server/models/').users;
var Exam_master = require('./server/models/').exam_master;
var courseMaster = require('./server/models/').qba_course_master;
var subjectMaster = require('./server/models/').qba_subject_master;
var topicMaster = require('./server/models/').qba_topic_master;

var qbnameMapping = require('./server/models/').qbid_qbname_mapping;
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(session({secret: 'ssshhhhh',
}));
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/static', express.static(path.join(__dirname, 'server')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.urlencoded({extended : true})); //application/x-www-form-urlencoded
app.use(bodyParser.json({limit: '100mb'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(require('skipper')());

var browser = require('./server/routes/browser.js');
 

app.all('/browser/browse', browser.browse);
app.post('/uploader/upload', browser.upload);

require('./server/routes/imports.js')(app);
var rootPath = __dirname;

