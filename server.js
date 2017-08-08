var express    = require('express');
var app        = express();
var expressWs = require('express-ws')(app);
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

//Core Functionality
var CienciaIULHarvest = require('./core/cienciaiulharvest.js');
var CommunityDetection = require('./core/communitydetection.js');
var Configurations = require('./core/configurations.js');
var MongoConnector = require('./core/mongoconnector.js');

var generateGraph = new CienciaIULHarvest();
var configs = new Configurations();
var mongoConnector = new MongoConnector();
var communityDetection = new CommunityDetection();

app.use(cookieParser());

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use(expressSession({ secret: configs.cookieSecret, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

var router = express.Router();

var isAuthenticated = function (req, res, next) {

		let securityExceptions = ["login.html", "reset-fonts-grids.css", "design.css", "googleicon.png"];
		
		for (let k = 0; k < securityExceptions.length; k++) {
            if(req.originalUrl.indexOf(securityExceptions[k]) !== -1)
				return next();
        }
		
		if(!req.user)
			return res.redirect("/login.html");
		
		let userEmails = "";
		if(req.user.emails)
        {
          for (var i = 0, len = req.user.emails.length; i < len; i++) {
            userEmails += req.user.emails[i].value + ";";
          }
        }
			
        if(userEmails.indexOf("iscte-iul.pt") != -1 || userEmails.indexOf("iscte.pt") != -1){
			if(req.originalUrl.indexOf("admin.html") !== -1)
				return isAdminAuthenticated(req, res, next);
			else
				return next();
		}

        return res.redirect("/login.html?userEmail=" + userEmails);
};

var isAdminAuthenticated = function (req, res, next) {
		
		if(!req.user)
			return res.status(401).end();
		
		let userEmails = "";
		if(req.user.emails)
        {
          for (var i = 0, len = req.user.emails.length; i < len; i++) {
            userEmails += req.user.emails[i].value + ";";
          }
        }
		
		for (let k = 0; k < configs.AdminUsersEmails.length; k++) {
            if(userEmails.indexOf(configs.AdminUsersEmails[k]) !== -1)
				return next();
        }
		
		return res.status(401).end();
};

router.get('/harvest', isAdminAuthenticated, function(req, res) {
	  mongoConnector.DeleteVisjsCache();
	  generateGraph.GenerateGraph();
      res.status(200).end();
});

router.get('/communitydetection', isAdminAuthenticated, function(req, res) {
	  mongoConnector.DeleteVisjsCache();
	  communityDetection.Identify();
      res.status(200).end();
});

router.get('/deleteDB', isAdminAuthenticated, function(req, res) {
	mongoConnector.DeleteDB();
    res.status(200).end();
});

router.get('/deletecommunities', isAdminAuthenticated, function(req, res) {
	mongoConnector.DeleteCommunities();
    res.status(200).end();
});

router.get('/graph/authors', isAuthenticated, function(req, res) {
  mongoConnector.GetAuthors(function(items){
      res.send(JSON.stringify(items)).end();
  });
});

router.get('/graph/publications', isAuthenticated, function(req, res) {
  mongoConnector.GetPublications(function(items){
      res.send(JSON.stringify(items)).end();
  });
});

router.get('/graph/coauthorships', isAuthenticated, function(req, res) {
  mongoConnector.GetCoauthorships(function(items){
      res.send(JSON.stringify(items)).end();
  });
});

router.get('/graph/authorsincommunity', isAuthenticated, function(req, res) {
  mongoConnector.GetAuthorsInCommunity(function(items){
      res.send(JSON.stringify(items)).end();
  }, req.query.communityId);
});

router.get('/graph/publicationsincommunity', isAuthenticated, function(req, res) {
  mongoConnector.GetPublicationsInCommunity(function(items){
      res.send(JSON.stringify(items)).end();
  }, req.query.communityId);
});

router.get('/graph/coauthorshipsincommunity', isAuthenticated, function(req, res) {
  mongoConnector.GetCoauthorshipsInCommunity(function(items){
      res.send(JSON.stringify(items)).end();
  }, req.query.communityId);
});

router.get('/graph/getcommunitiesids', isAuthenticated, function(req, res) {
  mongoConnector.GetCommunities(function(items){
      res.send(JSON.stringify(items)).end();
  });
});

router.get('/harveststatus', isAdminAuthenticated, function(req, res) {
  res.send(JSON.stringify(generateGraph.GetStatus())).end();
});

router.get('/communitydetectionstatus', isAdminAuthenticated, function(req, res) {
  res.send(JSON.stringify(communityDetection.GetStatus())).end();
});

router.post('/setvisjsgraph',function(req, res){
	mongoConnector.GetVisjsCacheGraph(function(items){
	  if(items.length >= 1){
		 console.log('Error: Visjs graph was already cached. Id: ' + req.body.id);
		 return res.status(500).end();
	  }
	  
      mongoConnector.InsertVisjsCacheGraph({ id: req.body.id, graph: req.body.serializedGraph});
	  console.log('Visjs graph was cached. Id: ' + req.body.id);
	  return res.status(200).end();
	  
    }, req.body.id);
});

router.get('/getvisjsgraph', function(req, res) {
  mongoConnector.GetVisjsCacheGraph(function(items){
	  let response = "";
	  if(items.length == 1){
		  response = items[0].graph;
	  }
	  
      res.send(response).end();
  }, req.query.id);
});

passport.serializeUser(function(user, done) {
  done(null, JSON.stringify(user));
});

passport.deserializeUser(function(user, done) {
  done(null, JSON.parse(user));
});

passport.use(new GoogleStrategy({
    clientID: configs.googleId,
    clientSecret: configs.googleSecret,
    callbackURL: configs.googleCallbackURL
  },
  function(token, tokenSecret, profile, done) {
		console.log("New user access: " + JSON.stringify(profile.emails));
        return done(null, profile);
  }
));

app.get('/auth/google',
  passport.authenticate('google', { scope:  [
                                              'https://www.googleapis.com/auth/userinfo.profile',
                                              'https://www.googleapis.com/auth/userinfo.email'
                                            ] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html', successRedirect: '/' })
);

//fix the returning of the 304 http response
app.disable('etag');

app.use('/api', router);
app.use('/', isAuthenticated);
app.use('/', express.static('public'));

// START THE SERVER
var httpServer = app.listen(configs.HTTPServerPort, function() {
  console.log('Server running on port ' + configs.HTTPServerPort);
  
  mongoConnector.CheckDB((testsPassed) => {
		if(!testsPassed){
			console.log('Will shutdown server because database in MongoDB is NOT OK. See logs.');
			httpServer.close();
			process.exit();
		}
  });
});