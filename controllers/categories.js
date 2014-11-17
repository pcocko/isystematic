var Category = require('../models/category');

// Create endpoint /api/categories/ for POSTS
// Save a category
exports.postCategory = function(req, res) {
  // Create a new instance of the Category model
  var cat = new Category();

  // Set the message properties that came from the POST data
  cat.set(req.body);

  // Save the user and check for errors
  cat.save(function(err) {
    if (err)
      res.send(err);

    res.json({ message: 'Category added to the system!', data: cat });
  });  
}

exports.getCategories = function(req, res){
	Category.find({},
		function(err,categories){
			if(err)return res.send(err);
			res.json(categories);
		}
	);
}