exports.error404 = function(req, res, next) {
  res.status(404).render('404.jade', {title: "404 File not found"});
}

exports.error500 = function(req, res, error) {
  res.status(500).render('500.jade', {title:"500 Internal Server Error", error: error});
}