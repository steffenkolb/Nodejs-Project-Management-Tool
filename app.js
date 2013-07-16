var express = require('express'),
    connect = require('connect'),
    app = express(),
    routes = require('./routes'),
    auth = require('./routes/authentication'),
    errorhandler = require('./routes/errorhandler');


/********************
 * SETUP
 ********************/
app.configure(function(){
    app.set('view engine', 'jade');
    app.set('views', __dirname + '/views');

    app.use(express.logger('dev'));
    app.use(express.compress());
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'topsecret' }));

    // session save messages
    app.use(function(req, res, next){
        var err = req.session.error,
            msg = req.session.success,
            errorCode = req.session.errorCode,
            authenticated = req.session.authenticated;

        //console.log ("err: %s // msg: %s", err, msg);

        delete req.session.error;
        delete req.session.success;
        delete req.session.errorCode;
        delete req.session.authenticated;
        
        res.locals.message = '';
        if (err) res.locals.message = '<div class="alert">' + err + '<button type="button", class="close", data-dismiss="alert">×</button></div>';
        if (msg) res.locals.message = '<div class="alert alert-success alert-fadeout">' + msg + '<button type="button", class="close", data-dismiss="alert">×</button></div>';
        if (authenticated != undefined) app.locals.authenticated = authenticated;
        if (errorCode) res.locals.errorCode = errorCode;

        next();
    });

    app.use(app.router);

    app.use(express.static(__dirname + '/public'));

    // 404 PAGE NOT FOUND
    app.use(function(req, res, next){
      errorhandler.error404(req, res, next);
    });
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.locals.pretty = true;
});

app.configure('production', function(){
    app.use(express.errorHandler());
});


/********************
 * ROUTES
 ********************/
// get
app.get('/', routes.index);
app.get('/login', routes.login);
app.get('/logout', routes.logout);
app.get('/projects/all', routes.projects);
app.get('/projects/new', auth.checkLogin, routes.newProject);
app.get('/projects/:id', routes.showProjectWithId);
app.get('/projects/:id/issues', routes.issuesOfProject);
app.get('/projects/:id/issues/new', auth.checkLogin, routes.newIssueForProject);
app.get('/projects/:id/calendar', routes.showCalendarOfProjectWithId);
app.get('/issues/all', auth.checkLogin, routes.issues);
app.get('/issues/new', auth.checkLogin, routes.newIssue);
app.get('/issues/:id', routes.showIssueWithId);
app.get('/users/new', auth.checkLogin, auth.checkRightsAdmin, routes.newUser);
app.get('/users/getAll', auth.checkLogin, routes.getUsersJSON);
app.get('/milestones/new', auth.checkLogin, auth.checkRightsModerator, routes.newMilestone);

// post
app.post('/login', routes.post_login);
app.post('/projects/new', auth.checkLogin, routes.post_newProject);
app.post('/issues/new', routes.post_newIssue);
app.post('/users/new', auth.checkLogin, auth.checkRightsAdmin, routes.post_newUser);
app.post('/milestones/new', auth.checkLogin, auth.checkRightsModerator, routes.post_newMilestone);

// delete
app.post('/projects/delete/', auth.checkLogin, routes.delete_projectWithId);


/********************
 * START SERVER
 ********************/
if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}