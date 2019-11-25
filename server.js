const http = require('http');
const url  = require('mongodb+srv://rus:<rus123>@cluster0-ynycb.mongodb.net/test?retryWrites=true&w=majority');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const ObjectId = require('mongodb').ObjectID;
const mongoDBurl = '';
const dbName = 'test';

const server = http.createServer((req,res) => {
	let timestamp = new Date().toISOString();
	console.log(`Incoming request ${req.method}, ${req.url} received at ${timestamp}`);

	let parsedURL = url.parse(req.url,true); // true to get query as object 
	let max = (parsedURL.query.max) ? parsedURL.query.max : 20;

	switch(parsedURL.pathname) {
		case '/read':
			read_n_print(res,parseInt(max));
			break;
		case '/showdetails':
			showdetails(res,parsedURL.query._id);
			break;
		case '/search':
			read_n_print(res,parseInt(max),parsedURL.query.criteria);
			break;
		case '/create':
			insertDoc(res,parsedURL.query.criteria);
			break;
		case '/delete':
			deleteDoc(res,parsedURL.query.criteria);
			break;
		case '/edit':
			res.writeHead(200,{"Content-Type": "text/html"});
			res.write('<html><body>');
			res.write('<form action="/update">');
			res.write(`<input type="text" name="name" value="${parsedURL.query.name}"><br>`);
			res.write(`<input type="text" name="borough" value="${parsedURL.query.borough}"><br>`);
			res.write(`<input type="text" name="cuisine" value="${parsedURL.query.cuisine}"><br>`);
			res.write(`<input type="hidden" name="_id" value="${parsedURL.query._id}"><br>`);
			res.write('<input type="submit" value="Update">')
			res.end('</form></body></html>');
			break;
		case '/update':
			updateDoc(res,parsedURL.query);
			break;
		default:
			res.writeHead(404, {"Content-Type": "text/html"});
			res.write('<html><body>');
			res.write("404 Not Found\n");
			res.end('<br><a href=/read?max=5>Give this a try instead?</a>');
	}
});

const findRestaurants = (db, max, criteria, callback) => {
	//console.log(`findRestaurants(), criteria = ${JSON.stringify(criteria)}`);
	let criteriaObj = {};
	try {
		criteriaObj = JSON.parse(criteria);
	} catch (err) {
		console.log('Invalid criteria!  Default to {}');
	}
	cursor = db.collection('restaurant').find(criteriaObj).sort({name: -1}).limit(max); 
	cursor.toArray((err,docs) => {
		assert.equal(err,null);
		//console.log(docs);
		callback(docs);
	});
}

const read_n_print = (res,max,criteria={}) => {
	const client = new MongoClient(mongoDBurl);
	client.connect((err) => {
		assert.equal(null,err);
		console.log("Connected successfully to server");
		
		const db = client.db(dbName);
		findRestaurants(db, max, criteria, (restaurants) => {
			client.close();
			console.log('Disconnected MongoDB');
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write('<html><head><title>Restaurant</title></head>');
			res.write('<body><H1>Restaurants</H1>');
			res.write('<H2>Showing '+restaurants.length+' document(s)</H2>');
			res.write('<ol>');
			for (r of restaurants) {
				//console.log(r._id);
				res.write(`<li><a href='/showdetails?_id=${r._id}'>${r.name}</a></li>`)
			}
			res.write('</ol>');
			res.end('</body></html>');
		});
	});
}

const showdetails = (res,_id) => {
	const client = new MongoClient(mongoDBurl);
	client.connect((err) => {
		assert.equal(null,err);
		console.log("Connected successfully to server");
		
		const db = client.db(dbName);

		cursor = db.collection('restaurant').find({_id: ObjectId(_id)});
		cursor.toArray((err,docs) => {
			assert.equal(err,null);
			client.close();
			console.log('Disconnected MongoDB');
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write(`<html><head><title>${docs[0].name}</title></head>`);
			res.write('<h3>')
			res.write(`<p>Name: ${docs[0].name}</p>`);
			res.write(`<p>Location: ${docs[0].borough}</p>`);
			res.write(`<p>Cuisine: ${docs[0].cuisine}</p>`);
			res.write('</h3>')
			res.write(`<br><a href="/edit?_id=${_id}&name=${docs[0].name}&borough=${docs[0].borough}&cuisine=${docs[0].cuisine}">Edit</a>`)
			res.write('<br>')
			res.write('<br><a href="/read?max=20">Home</a>')
			res.end('</body></html>');
		});
	});
}

const insertDoc = (res,doc) => {
	let docObj = {};
	try {
		docObj = JSON.parse(doc);
		//console.log(Object.keys(docObj).length);
	} catch (err) {
		console.log(`${doc} : Invalid document!`);
	}
	if (Object.keys(docObj).length > 0) {  // document has at least 1 name/value pair
		const client = new MongoClient(mongoDBurl);
		client.connect((err) => {
			assert.equal(null,err);
			console.log("Connected successfully to server");
			const db = client.db(dbName);
			db.collection('restaurant').insertOne(docObj,(err,result) => {
				assert.equal(err,null);
				res.writeHead(200, {"Content-Type": "text/html"});
				res.write('<html><body>');
				res.write(`Inserted ${result.insertedCount} document(s) \n`);
				res.end('<br><a href=/read?max=5>Home</a>');					
			});
		});
	} else {
		res.writeHead(404, {"Content-Type": "text/html"});
		res.write('<html><body>');
		res.write(`${doc} : Invalid document!\n`);
		res.end('<br><a href=/read?max=5>Home</a>');	
	}
}

const deleteDoc = (res,criteria) => {
	let criteriaObj = {};
	try {
		criteriaObj = JSON.parse(criteria);
	} catch (err) {
		console.log(`${criteria} : Invalid criteria!`);
	}
	if (Object.keys(criteriaObj).length > 0) {
		const client = new MongoClient(mongoDBurl);
		client.connect((err) => {
			assert.equal(null,err);
			console.log("Connected successfully to server");
			const db = client.db(dbName);
			db.collection('restaurant').deleteOne(criteriaObj,(err,result) => {
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
		const client = new MongoClient(mongoDBurl);
		client.connect((err) => {
			assert.equal(null,err);
			console.log("Connected successfully to server");
			const db = client.db(dbName);
			let criteria = {};
			criteria['_id'] = ObjectId(newDoc._id);
			delete newDoc._id;
			db.collection('restaurant').replaceOne(criteria,newDoc,(err,result) => {
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
