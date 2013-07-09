/********************
 * AUTHENTICATION
 ********************/

var sql = require('../mysqlconnector');


/********************
 * Helper
 ********************/

function checkRights(req, res, next, level){
	sql.getUserWithEmail(callback, req.session.user_id.email);

	function callback(user) {
		if(!user || user.password != req.session.user_id.password || user.rights > level) {
			console.log("insufficient rights or not correctly logged in.");
			req.session.error = "ERROR: insufficient rights or not correctly logged in.";
			res.redirect('/');
		}
		else {
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			next();
		}
	}
}

function checkLogin(req, res){
	if(req.session.user_id)
		return true;
	else {
		showLoginError(res);
	}
}

function showLoginError(res) {
	var err = "You need to log in to view this page.";
	res.locals.message = '<div class="alert">' + err + '<button type="button", class="close", data-dismiss="alert">×</button></div>';
	res.render('login.jade', {
		title:"Login",
		error: err
	});
}

/********************
 * Checks
 ********************/


exports.checkLogin = function(req, res, next) {
	console.log(req.session);

	if(checkLogin(req, res)) {
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		next(); 
	}
/*
	if (!req.session.user_id) {
		var err = "You need to log in to view this page.";
		res.locals.message = '<div class="alert">' + err + '<button type="button", class="close", data-dismiss="alert">×</button></div>';
		res.render('login.jade', {
			title:"Login",
			error: err
		});
	} else {
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		next();    
	}*/
}

exports.checkRightsAdmin = function(req, res, next) {
	console.log("Checking rights of: " + req.session);
	if(checkLogin(req, res))
	{
		checkRights(req, res, next, 1);
	}
	/*
	if (!req.session.user_id) {
		req.session.error = "You need to log in.";
		res.redirect('/login');
	} else {
		checkRights(req, res, next, 1);
	}*/
}

exports.checkRightsModerator = function(req, res, next) {
	console.log("Checking rights of: " + req.session);
	if (!req.session.user_id) {
		req.session.error = "You need to log in.";
		res.redirect('/login');
	} else {
		checkRights(req, res, next, 2);
	}
}

exports.checkRightsMember = function(req, res, next) {
	console.log("Checking rights of: " + req.session);
	if (!req.session.user_id) {
		req.session.error = "You need to log in.";
		res.redirect('/login');
	} else {
		checkRights(req, res, next, 3);
	}
}