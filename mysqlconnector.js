var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'node',
    password : 's4u9Z7VQK861k8r6IB5kPl727',
    database : 'stellar',
    multipleStatements: true
});


var _dateFormat = '"%W %M %D, %Y"';


/********************
 * USERS
 ********************/

exports.getUserWithEmail = function(callback, email) {
    connection.query('SELECT * FROM users WHERE email = ' + connection.escape(email), function(err, rows, fields) {
        if (err) throw err;

        console.log('MYSQL:: result for "getUserWithEmail": ' + rows[0]);
        callback(rows[0]);
    });
}

exports.getUsers = function(callback) {
    connection.query('SELECT id, email FROM users', function(err, rows, fields) {
        if (err) throw err;

        console.log('MYSQL:: result for "getUsers": ' + rows);
        callback(rows);
    });
}

exports.insertNewUser = function(callback, user) {
    // execute query
    connection.query('INSERT INTO users SET ?', user, function(err, result) {
        if (err) throw err;

        console.log('MYSQL:: result for "insertNewUser": ' + result);
        callback();
    });
};

/********************
 * PROJECTS
 ********************/

exports.getAllProjects = function(callback) {
    // execute query
    connection.query('SELECT * FROM projects', function(err, rows, fields) {
        if (err) throw err;

        console.log('MYSQL:: result for "getAllProjects": ', rows);
        callback(rows);
    });
};

exports.insertNewProject = function(callback, project, users) {
    // execute query
    connection.query('INSERT INTO projects SET ' + connection.escape(project)/* + '; INSERT INTO projects_users (project_id, user_id, role) VALUES ' + connection.escape(users)*/, function(err, result) {
        if (err) throw err;

        console.log('MYSQL:: result for "insertNewProject": ' + result);
        callback(result.insertId);
    });
};

exports.getProjectWithId = function(callback, id) {
    // execute query
    // SQL QUERY: SELECT projects.id, projects.title, projects.description, user.name as creator FROM projects JOIN user ON user.id = projects.creator_id WHERE projects.id = 1
    connection.query('SELECT projects.id, projects.title, projects.description, projects.client, projects.date_created, projects.date_start, projects.date_due, users.name as creator FROM projects JOIN users ON users.id = projects.creator_id WHERE projects.id = ' + connection.escape(id) + '; SELECT id, title, description, DATE_FORMAT(date_created, ' + _dateFormat + ' ) as date_created, DATE_FORMAT(date_due, ' + _dateFormat + ') as date_due FROM milestones WHERE project = ' + connection.escape(id) + ";", function(err, rows, fields) {
        if (err) throw err;

        console.log('MYSQL:: result for "showProjectWithId": ' + rows);
        callback(rows);
    });
};

/********************
 * ISSUES
 ********************/

exports.getIssuesOfProject = function(callback, id) {
    // execute query
    connection.query('SELECT id, title, description, priority, DATE_FORMAT(date_created, ' + _dateFormat + ') as date_created, DATE_FORMAT(date_due, ' + _dateFormat + ') as date_due, time_estimated, time_worked FROM issues WHERE project = '+ connection.escape(id) +'; SELECT * FROM projects WHERE id = ' + connection.escape(id) + ';', function(err, rows, fields) {
        if (err) throw err;

        console.log('MYSQL:: result for "getIssuesOfProject": ', rows);
        callback(rows);
    });
};

exports.getIssueWithId = function(callback, id) {
    // execute query
    connection.query('SELECT issues.id, issues.title, issues.description, issues.priority, issues.project, DATE_FORMAT(issues.date_created, ' + _dateFormat + ') as date_created, DATE_FORMAT(issues.date_due, ' + _dateFormat + ') as date_due, issues.time_estimated, issues.time_worked, users.name as creator FROM issues JOIN users ON users.id = issues.creator_id WHERE issues.id = ' + connection.escape(id), function(err, rows, fields) {
        if (err) throw err;

        console.log('MYSQL:: result for "getIssueWithId": ' + rows[0]);
        callback(rows[0]);
    });
};

exports.insertNewIssue = function(callback, issue, user_ids) {
    // execute query
    connection.query('INSERT INTO issues SET ?;', issue, function(err, result) {
        if (err) throw err;
        var resultid = result.insertId;

        // create users
        var users = [];
        for(var i=0; i < user_ids.length; ++i) {
            if(user_ids[i] != '') users.push([resultid, parseInt(user_ids[i])]);
        }

        console.log("users:");
        console.log(users);

        // insert users as bulk
        connection.query('INSERT INTO issues_users (issue_id, user_id) VALUES ' + connection.escape(users), function(err, result) {
            if (err) throw err;
            console.log('MYSQL:: result for "insertNewIssue": ' + resultid);
            callback(resultid);
        });
    });
};

/********************
 * MILESTONES
 ********************/

exports.insertNewMilestone = function(callback, milestone) {
    // execute query
    connection.query('INSERT INTO milestones SET ?', milestone, function(err, result) {
        if (err) throw err;

        console.log('MYSQL:: result for "insertNewMilestone": ' + result.insertId);
        callback(result.insertId);
    });
};

/********************
 * ERROR HANDLING
 ********************/

connection.on('error', function(err) {
    console.log(err.code); // 'ER_BAD_DB_ERROR'
    handleDisconnect(connection);
});

function handleDisconnect(connection) {
    connection.on('error', function(err) {
        if (!err.fatal) {
            return;
        }

        if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
            throw err;
        }

        console.log('Re-connecting lost connection: ' + err.stack);

        connection = mysql.createConnection(connection.config);
        handleDisconnect(connection);
        connection.connect();
    });
}