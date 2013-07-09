var sql = require('../mysqlconnector'),
		hash = require('./pass').hash,
		errorhandler = require('./errorhandler'),
		moment = require('moment'),
		util = require('util');



/********************
 * Index
 ********************/


// All posts
exports.index = function(req, res) {    
	/*var result = sql.getAllProjects(callback);
	console.log("authenticated ? : " + res.locals.authenticated);

	function callback(result) {
		res.render('index.jade', {
			title: 'Dingens',
			projects: result
		});
	}*/
	res.render("index.jade",{
        title: "stellar projectmanagement tool",
        activePage: "home"
    });
};

/********************
 * USERS
 ********************/

exports.newUser = function(req, res) {
	res.render('user_new.jade', {title: 'Create New User'});
};

exports.post_newUser = function(req, res) {
	hash(req.body.password, function(err, salt, hash){
			if (err) throw err;

			var user = {email: req.body.email, rights: req.body.rights, password: hash, salt: salt};

			sql.insertNewUser(function() {
				res.redirect('/');
			}, user); 
	});
};

exports.getUsersJSON = function(req, res) {
	sql.getUsers(callback);

	function callback(result) {
		res.send(JSON.stringify(result));
	}
}


/********************
 * AUTHENTICATION
 ********************/


function authenticate(email, pass, fn) {
	if (!module.parent) console.log('authenticating %s:%s', email, pass);
	
	// query the db for the given email
	sql.getUserWithEmail(callback, email);

	function callback(user){
		if (!user) return fn(new Error('cannot find user'));
		
		// apply the same algorithm to the POSTed password, applying
		// the hash against the pass / salt, if there is a match we
		// found the user
		hash(pass, user.salt, function(err, hash){
				if (err) return fn(err);
				if (hash == user.password) return fn(null, user);
				fn(new Error('invalid password'));
		})
	}
}

exports.login = function(req, res) {
	console.log("ERROR: " + req.session.error);
	res.render('login.jade', {
        title: 'Login', error: req.session.error,
        activePage: "login"
    });
    if(req.session.errorCode = 4201) req.session.errorCode = NaN;
};


// Login
exports.post_login = function(req, res) {

	console.log("about to log in");
	authenticate(req.body.email, req.body.password, function(err, user){
			if (user) {
					// Regenerate session when signing in
					// to prevent fixation 
					req.session.regenerate(function(){
							// Store the user's primary key 
							// in the session store to be retrieved,
							// or in this case the entire user object
							req.session.user_id = user;
                            req.session.success = 'Successfully logged in as ' + user.email
								+ '. Click <a href="/logout">here to logout</a>. ';

							req.session.authenticated = true;
							res.redirect('back');
						});
			} else {
					console.log("error while authenticating");;
					req.session.error = 'Authentication failed, please check your '
					+ ' username and password.'
					+ ' (use "info@stellar.de" and "foobar")';
                    req.session.errorCode = 4201;
					res.redirect('/login');
			}
	});
};

// Logout
exports.logout = function(req, res) {
	delete req.session.user_id;
	req.session.success = 'Successfully logged out.'
								+ ' Click <a href="/login">here to login</a>. ';
	req.session.authenticated = false;
	res.redirect('/login');
};


/********************
 * PROJECTS
 ********************/

exports.projects = function(req, res) {    
	sql.getAllProjects(callback);  

	function callback(result) {
		if(result) {
			res.render('projects.jade', {
				title: 'Projects',
				projects: result
			});
		} else {
			errorhandler.error500(req, res, "Error 4201: error while loading projects from the database.");
		}
	}
};


function formatCalendarData(data) {
	if(!data) return null;

	var calendar = {}
	calendar.numDays = moment.duration(data.date_due - data.date_start).asDays();
	calendar.firstDay = moment(data.date_start).day();
	calendar.firstMonth = moment(data.date_start).month();
	calendar.firstYear = moment(data.date_start).year();
	calendar.firstDateDay = moment(data.date_start).date();
	calendar.months = [];

	// calculate months
	var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	var daysLeft = calendar.numDays;
	var curDate = moment(data.date_start);

	// save the first
	var daysInMonth = curDate.daysInMonth() <= daysLeft ? curDate.daysInMonth() : daysLeft;
	if(daysInMonth > daysLeft) daysInMonth =  daysInMonth - calendar.firstDateDay;
		
	calendar.months.push({
		year: curDate.year(),
		month: months[curDate.month()],
		daysInMonth: daysInMonth
	});
	curDate.add('M', 1)

	for(curDate; curDate < moment(data.date_due); curDate.add('M', 1)) {
		calendar.months.push({
			year: curDate.year(),
			month: months[curDate.month()],
			daysInMonth: curDate.daysInMonth() <= daysLeft ? curDate.daysInMonth() : daysLeft
		});

		daysLeft = daysLeft - curDate.daysInMonth();
	}

	console.log("Calender:");
	console.log(calendar);

	return calendar;
}

exports.showProjectWithId = function(req, res) {    
	sql.getProjectWithId(callback, req.params.id);  

	function callback(result) {
		if(result) {
			// calculate calendar-stuff
			calendar = formatCalendarData(result[0][0]);

			res.render('project.jade', {
				title: 'Project',
				project: result[0][0],
				milestones: result[1],
				calendar: calendar
			});
		} else {
			errorhandler.error404(req, res, null);
		}
	}
};

exports.showCalendarOfProjectWithId = function(req, res) {    
	sql.getProjectWithId(callback, req.params.id);  

	function callback(result) {
		if(result) {
			// calculate calendar-stuff
			calendar = formatCalendarData(result[0][0]);

			res.render('project_calendar.jade', {
				title: 'Project',
				project: result[0][0],
				milestones: result[1],
				calendar: calendar
			});
		} else {
			errorhandler.error404(req, res, null);
		}
	}
};



exports.newProject = function(req, res) {
	res.render('project_new.jade', {
		title: 'New Project'
	});
};

exports.post_newProject = function(req, res) {
    // add current user_id.id to entry
    var newEntry = req.body;
    newEntry.creator_id = req.session.user_id.id;
    newEntry.date_created = moment().format("YYYY-MM-DD");

    //insert
	sql.insertNewProject(callback, newEntry);  

	function callback(id) {
		res.redirect('/projects/'+id);
	}
};


/********************
 * ISSUES
 ********************/

 exports.issues = function(req, res) {    
	sql.getAllIssues(callback);  

	function callback(result) {
		if(result) {
			res.render('issues.jade', {
				title: 'Issues',
				issues: result
			});
		} else {
			errorhandler.error500(req, res, "Error 4202: error while loading issues from the database.");
		}
	}
};

 exports.issuesOfProject = function(req, res) {    
	sql.getIssuesOfProject(callback, req.params.id);

	function callback(result) {
		if(result) {

			var issues = result[0],
				project = result[1][0];

			res.render('project_issues.jade', {
				title: 'Issues',
				issues: issues,
				project: project
			});
		} else {
			errorhandler.error500(req, res, "Error 4203: error while loading issues for a project from the database.");
		}
	}
};

exports.showIssueWithId = function(req, res) {    
	sql.getIssueWithId(callback, req.params.id);  

	function callback(result) {
		if(result) {
			var issue = result;

			res.render('issue.jade', {
				title: 'Issue',
				issue: issue
			});
		} else {
			errorhandler.error404(req, res, null);
		}
	}
};

exports.newIssueForProject = function(req, res) {
	sql.getAllProjects(callback);
	var selectedProject = req.params.id;

	function callback(result) {
		if(result) {
			res.render('issue_new.jade', {
				title: 'New Issue',
				projects: result,
				selectedProject: selectedProject
			});
		} else {
			errorhandler.error500(req, res, "Error 4204: error while loading projects from the database. Make sure there are already some projects to assign issues to.");
		}
	}
};

exports.newIssue = function(req, res) {
	sql.getAllProjects(callback);

	function callback(result) {
		if(result) {
			res.render('issue_new.jade', {
				title: 'New Issue',
				projects: result
			});
		} else {
			errorhandler.error500(req, res, "Error 4204: error while loading projects from the database. Make sure there are already some projects to assign issues to.");
		}
	}
};

exports.post_newIssue = function(req, res) {
    var newEntry = {};
    newEntry.title = req.body.title;
    newEntry.description = req.body.description;
    newEntry.priority = req.body.priority;
    newEntry.project = req.body.project;
    newEntry.date_created = moment().format("YYYY-MM-DD");
    newEntry.date_due = req.body.date_due;
    newEntry.time_estimated = req.body.time_estimated;
    newEntry.time_worked = req.body.time_worked;
    newEntry.creator_id = req.session.user_id.id;

    console.log('REQ:BODY:');
    console.log(req.body);

    var user_ids = req.body.as_values_user_ids.split(',');
    console.log(user_ids);

	sql.insertNewIssue(callback, newEntry, user_ids);  

	function callback(id) {
		res.redirect('/issues/'+id);
	}
};


/********************
 * MILESTONES
 ********************/

exports.newMilestone = function(req, res) {
	sql.getAllProjects(callback);

	function callback(result) {
		if(result) {
			res.render('milestone_new.jade', {
				title: 'New Milestone',
				projects: result
			});
		} else {
			errorhandler.error500(req, res, "Error 4204: error while loading projects from the database. Make sure there are already some projects to assign issues to.");
		}
	}
};

exports.post_newMilestone = function(req, res) {
    var newEntry = req.body;
    newEntry.creator_id = req.session.user_id.id;
    newEntry.date_created = moment().format("YYYY-MM-DD");
	sql.insertNewMilestone(callback, newEntry);  

	function callback(id) {
		res.redirect('/projects/'+newEntry.project);
	}
};