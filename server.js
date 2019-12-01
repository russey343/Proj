const express = require('express');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const http = require('http');
const url  = require('url');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const ObjectId = require('mongodb').ObjectID;
//const mongoDBurl = 'mongodb+srv://user:user@cluster0-dpet6.mongodb.net/test?retryWrites=true&w=majority';
const dbName = 'rest';
const mongoDBurl ='mongodb+srv://rus:rus123@cluster0-ynycb.mongodb.net/test?retryWrites=true&w=majority';
const multer = require('multer');

app.set('view engine','ejs');

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
	  cb(null, 'uploads')
	},
	filename: function (req, file, cb) {
	  cb(null, file.fieldname + '-' + Date.now())
	}
  })
  
  var upload = multer({ storage: storage })

app.use(session({
  name: 'session',
  keys: ['12345678']
}));

// support parsing of application/json type post data
app.use(bodyParser.json());
// support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

//check login /*
app.get('/', (req,res) => {
	//  console.log(req.session);
		if (!req.session.authenticated) {
			return res.redirect('/login');
		} else {
		//	return res.status(200).render('rest',{username:req.session.username});
		return res.redirect('/rest');		
		}
});


app.get('/login', (req,res) => {
	res.status(200).sendFile(__dirname + '/public/login.html');
});

app.get('/sign', (req,res) => {
	res.status(200).sendFile(__dirname + '/public/sign.html');
});

app.get('/rest', (req,res) => {
	if (!req.session.authenticated) {
		return res.redirect('/');
	};
	MongoClient.connect(mongoDBurl, { useNewUrlParser: true }, function(err, db) {
		var dbo = db.db("rest"); //db name
		var maxrest = 20;
		dbo.collection("rest").find().sort({name: -1}).limit(maxrest).toArray(function(err, result) {
		//	console.log(result);
		if (err) { 
		console.log("Error:" + err);
		} else {
		//	console.log(result);			
			console.log("Total "+result.length +" restaurant");
			console.log("-----");
		//	for(var i=0;i<result.length;i++) {
		//		console.log(result[i].restname);
		//	}
		//	console.log(result[1].restname);
			return res.status(200).render('rest',{username: req.session.username, allrest: result.length, restn:result});
		}
		}); 
	});
});

app.post('/search', (req,res) => {
	if (!req.session.authenticated || req.body.keyword == "" || req.body.selectpicker == "") {
		return res.redirect('/');
	};
	console.log(req.body.selectpicker);
	console.log(req.body.keyword);
	var searchtype = req.body.selectpicker;
	var searchkey = req.body.keyword;
	var searchBorough = "Borough";
	var searchCuisine = "Cuisine";
	if (searchtype == searchBorough ){
		console.log("1");
		MongoClient.connect(mongoDBurl, { useNewUrlParser: true }, function(err, db) {
			var dbo = db.db("rest"); //db name
			var maxrest = 20;
			dbo.collection("rest").find({"Borough":searchkey}).sort({name: -1}).limit(maxrest).toArray(function(err, result) {
			//	console.log(result);
			if (err) { 
			console.log("Error:" + err);
			} else {
			//	console.log(result);			
				console.log("Search Total "+result.length +" restaurant");
				console.log("-----");
				db.close();	
				return res.status(200).render('search',{username: req.session.username,key:searchBorough ,word:searchkey , allrest: result.length, restn:result});
			}
			}); 
		});
	}else if(searchtype == searchCuisine){
		console.log("2"); 
		MongoClient.connect(mongoDBurl, { useNewUrlParser: true }, function(err, db) {
			var dbo = db.db("rest"); //db name
			var maxrest = 20;
			dbo.collection("rest").find({"Cuisine":searchkey}).sort({name: -1}).limit(maxrest).toArray(function(err, result) {
			//	console.log(result);
			if (err) { 
			console.log("Error:" + err);
			} else {
			//	console.log(result);			
				console.log("Search Total "+result.length +" restaurant");
				console.log("-----");
				db.close();	
				return res.status(200).render('search',{username: req.session.username,key:searchCuisine ,word:searchkey , allrest: result.length, restn:result});
			}
			}); 
		});
	}else {		
		MongoClient.connect(mongoDBurl, { useNewUrlParser: true }, function(err, db) {
			console.log("3"); 
			//console.log(searchtype);
			//console.log("keyword: "+searchkey);
			var dbo = db.db("rest"); //db name
			var maxrest = 20;
			//var searchstr = { add : { $elemMatch: { Street : searchkey}}};
			var searchstr = { "add.Street": searchkey};			
			console.log(searchstr);
			dbo.collection("rest").find(searchstr).sort({name: -1}).limit(maxrest).toArray(function(err, result) {
			//	console.log(result);
			if (err) { 
			console.log("Error:" + err);
			} else {
			//	console.log(result);			
				console.log("Search Total "+result.length +" restaurant");
				console.log("-----");
				db.close();	
				return res.status(200).render('search',{username: req.session.username,key:searchtype ,word:searchkey , allrest: result.length, restn:result});
			}
			}); 
		});
	}
		

});

app.get('/detail?', (req,res) => {
	if (!req.session.authenticated) {
		return res.redirect('/');
	};
	//app.get('/detail/id/:id', (req,res) => {    //this is /detail/id/xxxx
	//	console.log("1 "+req.query._id);      	//this ok is ?_id=xxxx
		MongoClient.connect(mongoDBurl, { useNewUrlParser: true }, function(err, db) {
			if (err) throw err;
			var dbo = db.db("rest");
			var newid = req.query._id;
			//console.log("url "+newid); //success
			var dtStr = {"_id":ObjectId(newid)}; 			
			dbo.collection("rest").find(dtStr).toArray(function(err, result) {
				if (err)throw err;				
			//	console.log(result[0].restname);
			//	console.log(result[0]._id);				
				var newdata = "data:"
				var newdata2 = ";base64, "
			//	console.log(result[0].image);
				var newimg = newdata+ result[0].mimetype + newdata2
				+ result[0].image ;
				db.close();	
				return res.status(200).render('detail',{
					id:result[0]._id,
					restname:result[0].restname,
					Borough:result[0].Borough,
					Cuisine:result[0].Cuisine,
					Street:result[0].add.Street,
					Building:result[0].add.Building,
					Zipcode:result[0].add.Zipcode,
				//	Score:result[0].Grades.Score,
				//	User:result[0].Grades.User,
				//	gresult:result,
					Coordlon:result[0].Coord.Coordlon,
					Coordlat:result[0].Coord.Coordlat,				
					Owner:result[0].Owner,
					newimg:newimg
					});
		});	
	});
});

app.get('/edit', (req,res) => {
	if (req.query._id =="" || !req.session.authenticated ) {
		return res.redirect('/');
	};
		MongoClient.connect(mongoDBurl, { useNewUrlParser: true }, function(err, db) {
			console.log("-------------");
			if (err) throw err;
			var dbo = db.db("rest");
			var newid = req.query._id;
			//console.log("url "+newid); //success
			var dtStr = {"_id":ObjectId(newid)}; 			
			
			dbo.collection("rest").find(dtStr).toArray(function(err, result) {
				if (err)throw err;
				//console.log("Rest Owner: "+result[0].Owner);
				console.log("Edit user: "+req.session.username);
				console.log("-------------");
				if(req.session.username != result[0].Owner ){
					console.log("You can't edit!");
					console.log("-------------");
					var failedit = '<script>alert("You are not Owner.");location.href="/"</script>';
					return res.send(failedit);

				} else {
					console.log("Do edit");
					console.log("Rest Name: "+result[0].restname);
					console.log("-------------");
					db.close();	
					return res.status(200).render('edit',{
						id:result[0]._id,
						username:result[0].Owner,
						restname:result[0].restname,
						Borough:result[0].Borough,
						Cuisine:result[0].Cuisine,
						Street:result[0].add.Street,
						Building:result[0].add.Building,
						Zipcode:result[0].add.Zipcode,
						Coordlon:result[0].Coord.Coordlon,
						Coordlat:result[0].Coord.Coordlat
					});
				};		
			
			});	
		});
		
});

app.post('/editup', upload.single('picture'), (req,res) => {
	if (!req.session.authenticated || req.query._id == "") {
		return res.redirect('/');
	};
	MongoClient.connect(mongoDBurl, { useNewUrlParser: true }, function(err, db) {
		if (err) throw err;
		var dbo = db.db("rest");
		var newid = req.body.id;
		//console.log("url "+newid); //success
		var dtStr = {"_id":ObjectId(newid)};
		//console.log(dtStr);
		
		var restname  = req.body.restname; 
		var Borough	= req.body.Borough;
		var Cuisine = req.body.Cuisine; 
		var Street = req.body.Street; 
		var Building = req.body.Building; 
		var Zipcode = req.body.Zipcode; 
		var Coordlon = req.body.Coordlon; 
		var Coordlat = req.body.Coordlat; 
		var Owner = req.session.username;
		var img = fs.readFileSync(req.file.path);

		var data =  {
			"restname": restname,
			"Borough": Borough, 
			"Cuisine": Cuisine,
			['add'] : {
					  "Street": Street,
						"Building":Building,
					   "Zipcode":Zipcode
				  },
			['Coord'] : {
						"Coordlon":Coordlon,
						"Coordlat":Coordlat
				  },
			  "Owner":Owner,
			  "mimeype": req.file.mimetype,
			  "image":	new Buffer.from(img).toString('base64')	
		};

		dbo.collection("rest").find(dtStr).toArray(function(err, result) {
			if (err)throw err;
			var deleten = result[0].restname;
			var deleten1 = {"restname":deleten};

			dbo.collection("rest").deleteMany(deleten1,function(err, result) {
			if (err)throw err;
			console.log("delete Successfully, now uploading");
				dbo.collection('rest').insertOne(data,function(err, res){ 
					if (err) throw err; 
					console.log("Update Successfully,Update nums:" + res.insertedCount); 
					});
					db.close();	
					return res.redirect('/');
		});	
	});






});




});


app.get('/remove?', (req,res) => {
	if (!req.session.authenticated) {
		return res.redirect('/');
	};
	MongoClient.connect(mongoDBurl, { useNewUrlParser: true }, function(err, db) {
		if (err) throw err;
		var dbo = db.db("rest");
		var newid = req.query._id;
		//console.log("url "+newid); //success
		var dtStr = {"_id":ObjectId(newid)};

		dbo.collection("rest").find(dtStr).toArray(function(err, result) {
			if (err)throw err;
			var deleten = result[0].restname;
			var deleten1 = {"restname":deleten};
			//console.log("--------Remove start:");
			//console.log("Rest Name "+result[0].restname);		
			//console.log("Rest Owner"+result[0].Owner);
			//console.log("Delete from user"+req.session.username);
	
			if(req.session.username != result[0].Owner ){
				console.log("You are not onwer;");				
				//return res.redirect('/');
				var faildel = '<script>alert("You are not Owner.");location.href="/"</script>';
				return res.send(faildel);
			} else {
				console.log("You are onwer,you can delete;");					
				
				dbo.collection("rest").deleteMany(deleten1,function(err, result) {
				if (err)throw err;
				//console.log(result[0].restname);
				//console.log(result[0]._id);				
				db.close();	
				//return res.status(200).render('detail',{restname:result[0].restname, id:result[0].id});
				return res.redirect('/');
			});	
		};		
	});	
});
	
});


app.post('/sign', (req,res) => {
	const username2 = req.body.username;
	const password2 = req.body.password;
	var signstr = {"username": username2 , "password": password2}; //for db.insert()
	var chkuname = {"username": username2}; //for db.find(username)
	MongoClient.connect(mongoDBurl, { useNewUrlParser: true }, function(err, db) {
	var dbo = db.db("rest"); //db name
	dbo.collection("user").find(chkuname).toArray(function(err, result) {
	//	console.log(result);
	if (err) { 
	console.log("Error:" + err);
	} else {
		if (result == "" || result <1 || result[0].username !== signstr.username) {
			MongoClient.connect(mongoDBurl, { useNewUrlParser: true }, function(err, db) {
				var dbo = db.db("rest"); //db name
				dbo.collection("user").insertOne(signstr,function(err, result) {
			console.log("sign up ok");
			db.close();
			return res.redirect('/');
					}); 
				});
		}else {
			console.log("sign up fail");
			var failsign = '<script>alert("Username has used");location.href="/sign"</script>';
			return	res.send(failsign);
		//	return res.redirect('/');
		}
	}
	}); 
});
});


app.post('/login', (req,res) => {
	const username1 = req.body.username;
	const password1 = req.body.password;
 	var updatestr = {"username": username1, "password": password1}; //for db.find()
 	MongoClient.connect(mongoDBurl, { useNewUrlParser: true }, function(err, db) {
    var dbo = db.db("rest"); //db name
    dbo.collection("user").find(updatestr).toArray(function(err, result) {	
	if (err) { 
	console.log("Error:" + err);
	}else {
		if (result.length == 1) {
			console.log("login ok");
		//	console.log(result[0].username); //call array[0].obj
			db.close();
			req.session.authenticated = true;
			req.session.username = updatestr.username;
			console.log("Login user:"+req.session.username);
		//	var loginok = '<script>alert("login ok");location.href="/"</script>';
		//	res.send(loginok);
			res.redirect('/');
		//	return res.render('rest',{username:req.session.username});
		}else {
			db.close();	
			console.log("login fail");
			var faillogin = '<script>alert("login fail");location.href="/"</script>';
			return	res.send(faillogin);

		}
	}

    }); 
	});
});

app.get('/logout', (req,res) => {
	req.session = null;
	console.log("logout");
	return	res.redirect('/');
});


app.get('/insert', (req,res) => {	//insert page
	if (!req.session.authenticated) {
		return res.redirect('/');
	};
	res.status(200).sendFile(__dirname + '/public/insert.html');
});


//insert funcution
app.post('/insert_rest', upload.single('picture'), (req,res) => {
	if (!req.session.authenticated || req.body.restname == ""){
		return res.redirect('/');
	}else{
		MongoClient.connect(mongoDBurl, { useNewUrlParser: true }, function(err, db) {
	  if (err) throw err;
		  var restname  = req.body.restname; 
		  var Borough	= req.body.Borough;
		  var Cuisine = req.body.Cuisine; 
		  var Street = req.body.Street; 
		  var Building = req.body.Building; 
		  var Zipcode = req.body.Zipcode; 
		  var Coordlon = req.body.Coordlon; 
		  var Coordlat = req.body.Coordlat; 
		  var Owner = req.session.username;
		  var img = fs.readFileSync(req.file.path);

		  var data =  {
		  "restname": restname,
		  "Borough": Borough, 
		  "Cuisine": Cuisine,
		  ['add'] : {
					"Street": Street,
		  			"Building":Building,
					 "Zipcode":Zipcode
				},
		  ['Coord'] : {
		  			"Coordlon":Coordlon,
					  "Coordlat":Coordlat
				},
			"Owner":Owner,
			"mimetype": req.file.mimetype,
			"image":	new Buffer.from(img).toString('base64')	
		  };

  			var dbo = db.db("rest");
  				dbo.collection('rest').insertOne(data,function(err, res){ 
		 		 if (err) throw err; 
		 		 console.log("Record inserted Successfully,insert nums:" + res.insertedCount); 
		  
	  });
	  return res.redirect('/');
  });
	};
  
});

app.get('/gmap?', (req,res) => {
	MongoClient.connect(mongoDBurl, { useNewUrlParser: true }, function(err, db) {
		if (err) throw err;
		var dbo = db.db("rest");
		var newid = req.query._id;
		//console.log("url "+newid); //success
		var dtStr = {"_id":ObjectId(newid)};
		dbo.collection("rest").find(dtStr).toArray(function(err, result) {
			if (err)throw err;
			console.log(result[0].restname);
			console.log(result[0].Coord.Coordlat + result[0].Coord.Coordlon);
			return res.status(200).render('leaflet',{
				lat:result[0].Coord.Coordlat,
				lon:result[0].Coord.Coordlon
			});	
		});		
	});	
});

app.get('/rate?', (req,res) => {
	if (!req.session.authenticated) {
		return res.redirect('/');
	};
		MongoClient.connect(mongoDBurl, { useNewUrlParser: true }, function(err, db) {
			if (err) throw err;
			var dbo = db.db("rest");
			var newid = req.query._id;
			var dtStr = {"_id":ObjectId(newid)}; 	

			var rateuser = req.session.username;
			var score = req.body.score;
			console.log(score);
			console.log(rateuser);

			dbo.collection("rest").find(dtStr).toArray(function(err, result) {
				if (err)throw err;
				var rateduser = result[0].Grades.User;
				console.log(rateduser);				
				if( rateduser =="" || rateduser == rateuser){
					db.close();
					return res.redirect('/');
				}else{
					db.close();	
					return res.status(200).render('rate',{_id:newid});
				};

			//	db.close();	
		});	
	});
});

//app.post rated;

app.listen(process.env.PORT || 8099);
