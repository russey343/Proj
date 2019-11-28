const http = require('http');
const url = require('url');
const fs = require('fs');
const formidable = require('formidable');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const ObjectID = require('mongodb').ObjectID;
const mongourl = "mongodb+srv://rus:rus123@cluster0-ynycb.mongodb.net/test?retryWrites=true&w=majority";
const dbName = "rest";


const server = http.createServer((req, res) => {
  let timestamp = new Date().toISOString();
  console.log(`Incoming request ${req.method}, ${req.url} received at ${timestamp}`);

  let parsedURL = url.parse(req.url,true); // true to get query as object
	let max = (parsedURL.query.max) ? parsedURL.query.max : 20;

	switch(parsedURL.pathname) {
		case '/search':
			read_n_print(res,parseInt(max),parsedURL.query.criteria);
			break;
		case '/delete':
			deleteDoc(res,parsedURL.query.criteria);
			break;
		case '/edit':
			res.writeHead(200,{"Content-Type": "text/html"});
			res.write('<html><body>');
			res.write('<form action="/update">');
			res.write(`<input type="text" name="restname" value="${parsedURL.query.restname}"><br>`);	//show edit value
			res.write(`<input type="text" name="Borough" value="${parsedURL.query.Borough}"><br>`);
			res.write(`<input type="text" name="Cuisine" value="${parsedURL.query.Cuisine}"><br>`);
			res.write(`<input type="hidden" name="_id" value="${parsedURL.query._id}"><br>`);
			res.write('<input type="submit" value="Update">')
			res.end('</form></body></html>');
			break;
		case '/update':
			updateDoc(res,parsedURL.query);
			break;
	/*	default: */
		
	}

  if (parsedURL.pathname == '/fileupload' && 
      req.method.toLowerCase() == "post") {
    // parse a file upload
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      // console.log(JSON.stringify(files));
      if (files.filetoupload.size == 0) {
        res.writeHead(500,{"Content-Type":"text/plain"});
        res.end("No file uploaded!");  
      }
      const filename = files.filetoupload.path;


let Borough = "untitled";
if (fields.Borough && fields.Borough.length > 0) {
        Borough = fields.Borough;
      }
let Cuisine = "untitled";
if (fields.Cuisine && fields.Cuisine .length > 0) {
        Cuisine = fields.Cuisine;
      }
let Street = "untitled";
if (fields.Street && fields.Street.length > 0) {
        Street = fields.Street;
      }
let Building = "untitled";
if (fields.Building && fields.Building.length > 0) {
        Building = fields.Building;
      }
let Zipcode = "untitled";
if (fields.Zipcode && fields.Zipcode.length > 0) {
        Zipcode = fields.Zipcode;
      }
let Coordlon = "untitled";
if (fields.Coordlon && fields.Coordlon.length > 0) {
        Coordlon = fields.Coordlon;
      }
let Coordlat = "untitled";
if (fields.Coordlat && fields.Coordlat.length > 0) {
        Coordlat = fields.Coordlat;
      }
let Score = "untitled";
if (fields.Score && fields.Score.length > 0) {
        Score = fields.Score;
	max="10";
	min="0";
      }

      
      let restname = "untitled";
      let mimetype = "images/jpeg";
      if (fields.restname && fields.restname.length > 0) {
        restname = fields.restname;
      }
      if (files.filetoupload.type) {
        mimetype = files.filetoupload.type;
      }


      fs.readFile(files.filetoupload.path, (err,data) => {
        const client = new MongoClient(mongourl);
        client.connect((err) => {
          try {
              assert.equal(err,null);
            } catch (err) {
              res.writeHead(500,{"Content-Type":"text/plain"});
              res.end("MongoClient connect() failed!");
              return(-1);
          }
          const db = client.db(dbName);
          let new_r = {};

new_r['restname'] = restname;		//create data in collection
new_r['Borough'] = Borough;
new_r['Cuisine'] = Cuisine;
new_r['add'] = {Street,Building,Zipcode} ;
new_r['Coord'] = {Coordlon, Coordlat};
new_r['Score'] = Score;

     
          new_r['mimetype'] = mimetype;
          new_r['image'] = new Buffer.from(data).toString('base64');
          insertRest(db,new_r,(result) => {
            client.close();
            res.writeHead(200, {"Content-Type": "text/html"});
            res.write('<html><body>Rest was inserted into MongoDB!<br>');
            res.end('<a href="/rests">Back</a></body></html>')  //back to rests page
          })
        });
      })
    });
  } else if (parsedURL.pathname == '/rests') {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
      try {
          assert.equal(err,null);
        } catch (err) {
          res.writeHead(500,{"Content-Type":"text/plain"});
          res.end("MongoClient connect() failed!");
          return(-1);
      }      
      console.log('Connected to MongoDB');
      const db = client.db(dbName);
      findRest(db,{},(rests) => {
        client.close();
        console.log('Disconnected MongoDB');
        res.writeHead(200, {"Content-Type": "text/html"});			
        res.write('<html><head><title>Restaurants</title></head>');
        res.write('<body><H1>Restaurants</H1>');
        res.write('<H2>Showing '+rests.length+' document(s)</H2>');
        res.write('<ol>');
        for (i in rests) {		//read and print
          res.write('<li><a href=/display?_id=' +		//have a href to show details
          rests[i]._id+'>'+rests[i].restname+ '</a></li>');  //show the rests list
        }
        res.write('</ol>');
        res.end('</body></html>');
      })
    });
  } else if (parsedURL.pathname == '/display') {   //show photo page
    const client = new MongoClient(mongourl);
    client.connect((err) => {
      try {
        assert.equal(err,null);
      } catch (err) {
        res.writeHead(500,{"Content-Type":"text/plain"});
        res.end("MongoClient connect() failed!");
        return(-1);
      }
      console.log('Connected to MongoDB');
      const db = client.db(dbName);
      let criteria = {};
      criteria['_id'] = ObjectID(parsedURL.query._id);
      findRest(db,criteria,(rest) => {
        client.close();
        console.log('Disconnected MongoDB');
        console.log('Rest returned = ' + rest.length);


	res.writeHead(200, 'text/html');
        res.write('<html><head><style>img{max-width:100%;height:auto;max-height:100%;}</style></head><body>');
        if (rest[0].restname) {
          res.write(`<html><body><center><h1>${rest[0].restname}</h1></center>`);
        }
	res.write(`<center><img src="data:${rest[0].mimetype};base64, ${rest[0].image}"></center>`);
        if (rest[0].Borough) {
          res.write(`<html><body><left><h2>Borough: ${rest[0].Borough}</h2></left>`);
        }
        if (rest[0].Cuisine) {
          res.write(`<html><body><left><h2>Cuisine: ${rest[0].Cuisine}</h2></left>`);
        }
        if (rest[0].add) {
          res.write(`<html><body><left><h2>Street: ${rest[0].add.Street}</h2></left>`);
        }        
	if (rest[0].add) {
          res.write(`<html><body><left><h2>Building: ${rest[0].add.Building}</h2></left>`);
        }        
	if (rest[0].add) {
          res.write(`<html><body><left><h2>Zipcode: ${rest[0].add.Zipcode}</h2></left>`);
        } 
	if (rest[0].Coord) {
          res.write(`<html><body><left><h2>GPS Coordinates :${rest[0].Coord.Coordlon}, ${rest[0].Coord.Coordlat}</h2></left>`);
        }
	res.write(`<br><a href="/map?lon=${rest[0].Coord.Coordlon }&lat=${rest[0].Coord.Coordlat}&restname=${rest[0].restname}">Map</a>`); //map page
      	if (rest[0].Score) {
          res.write(`<html><body><left><h2>Rating: ${rest[0].Score}</h2></left>`);
        } 
	if (rest[0].Owner) {
          res.write(`<html><body><left><h2>Owner: ${rest[0].Owner}</h2></left`);
        } 
	res.write('</h3>')
	res.write(`<br><a href="/edit?_id=${rest[0]._id}&restname=${rest[0].restname}&Borough=${rest[0].Borough}&Cuisine=${rest[0].Cuisine}">Edit</a>`); //href to edit page
	res.write('<br>')
	res.write('<form action="/delete">');
	res.write(`<br><input type="submit" value="Delete">`)
	res.write('</form>');
	res.write('<br>')
	res.write('<br><a href="/rests">Home</a>')
	res.end('</body></html>');
        
      });
    });
  } 


else {
    	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
	res.write('Name: <input type="text" name="restname" minlength=1><br>');
	res.write('Borough: <input type="text" name="Borough" minlength=1><br>');
	res.write('Cuisine: <input type="text" name="Cuisine" minlength=1><br>');
	res.write('Street: <input type="text" name="Street" minlength=1><br>');
	res.write('Building: <input type="text" name="Building" minlength=1><br>');
	res.write('Zipcode: <input type="text" name="Zipcode" minlength=1><br>');
	res.write('GPS Coordinates (lon.): <input type="text" name="Coordlon" minlength=1><br>');
	res.write('GPS Coordinates (lat.): <input type="text" name="Coordlat" minlength=1><br>');
	res.write('User: <input type="text" name="User" value="From Owner Data" readonly  minlength=1><br>');
	res.write('Score: <input type="text" name="Score" max="10" min="0"minlength=1><br>');
	res.write('Owner: <input type="text" name="Owner" value="From Owner Data" readonly minlength=1><br>');
        res.write('<input type="file" name="filetoupload"><br>');
	res.write('<input type="submit">');
 	res.write('</form>');
   	res.end();
  }
});

const insertRest = (db,r,callback) => {
  db.collection('rest').insertOne(r,(err,result) => {
    assert.equal(err,null);
    console.log("insert was successful!");
    console.log(JSON.stringify(result));
    callback(result);
  });
}


const findRest = (db, criteria,callback) => {
  const cursor = db.collection("rest").find(criteria);
  let rests = [];
  cursor.forEach((doc) => {
    rests.push(doc);
  }, (err) => {
    // done or error
    assert.equal(err,null);
    callback(rests);
  })
}

const deleteDoc = (res,criteria) => {
	let criteriaObj = {};
	try {
		criteriaObj = JSON.parse(criteria);
	} catch (err) {
		console.log(`${criteria} : Invalid criteria!`);
	}
	if (Object.keys(criteriaObj).length > 0) {
		const client = new MongoClient(mongourl);
		client.connect((err) => {
			assert.equal(null,err);
			console.log("Connected successfully to server");
			const db = client.db(dbName);
			db.collection('rest').deleteOne(criteriaObj,(err,result) => {
				console.log(result);
				assert.equal(err,null);
				res.writeHead(200, {"Content-Type": "text/html"});
				res.write('<html><body>');
				res.write(`Deleted ${result.deletedCount} document(s)\n`);
				res.end('<br><a href=/read?max=5>Home</a>');					
			});
		});
	} else {
		res.writeHead(404, {"Content-Type": "text/html"});
		res.write('<html><body>');
		res.write("Invalid criteria!\n");
		res.write(criteria);
		res.end('<br><a href=/read?max=5>Home</a>');	
	}
}


const updateDoc = (res,newDoc) => {
	console.log(`updateDoc() - ${JSON.stringify(newDoc)}`);
	if (Object.keys(newDoc).length > 0) {
		const client = new MongoClient(mongourl);
		client.connect((err) => {
			assert.equal(null,err);
			console.log("Connected successfully to server");
			const db = client.db(dbName);
			let criteria = {};
			criteria['_id'] = ObjectId(newDoc._id);
			delete newDoc._id;
			db.collection('rest').replaceOne(criteria,newDoc,(err,result) => {
				assert.equal(err,null);
				console.log(JSON.stringify(result));
				res.writeHead(200, {"Content-Type": "text/html"});
				res.write('<html><body>');
				res.write(`Updated ${result.modifiedCount} document(s).\n`);
				res.end('<br><a href=/read?max=5>Home</a>');				
			});
		});
	} else {
		res.writeHead(404, {"Content-Type": "text/html"});
		res.write('<html><body>');
		res.write("Updated failed!\n");
		res.write(newDoc);
		res.end('<br><a href=/read?max=5>Home</a>');	
	}
}



server.listen(process.env.PORT || 8099);
