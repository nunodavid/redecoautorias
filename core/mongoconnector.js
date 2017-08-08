var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var Configs = require('./configurations');

var MongoConnector = function() {
	this.configs = new Configs();
	this.collections = ['authors', 'publications', 'coauthorships', 'authorsInCommunity',
	                    'publicationsInCommunity', 'coauthorshipsInCommunity',
						'communityJobs', 'CacheVisjsStoredGraphs'];
};

MongoConnector.prototype.CheckDB = function(callback) {

  var collectionsNamesInObject = this.collections;

  MongoClient.connect(this.configs.MongoDBEndpoint, function(err1, db) {
     if(err1) {
      console.log("Error connecting to MongoDB: " + err1);
	  callback(false);
      return;
     }

	 db.listCollections().toArray(function(err2, collections) {
		  if(err2) {
			  console.log("Error getting collection names: " + err2);
			  callback(false);
			  return;
		  }

		  for (let k = 0; k < collectionsNamesInObject.length; k++) {
			 let found = false;

			 for (let j = 0; j < collections.length; j++) {
				if(collections[j].name == collectionsNamesInObject[k]){
					found = true;
				}
			 }

			 if(!found){
				console.log("Not found collection in database: " + collectionsNamesInObject[k]);
				callback(false);
				return;
			 }
		  }

		  db.close();

		  callback(true);
	});
  });
};

MongoConnector.prototype.DeleteDB = function() {

	var collectionsNamesInObject = this.collections;

  MongoClient.connect(this.configs.MongoDBEndpoint, function(err, db) {
     if(err) {
      console.log("Error connecting to MongoDB: " + err);
      return;
     }

	 for (let k = 0; k < collectionsNamesInObject.length; k++) {
         db.collection(collectionsNamesInObject[k]).remove();
     }

	 db.close();
  });
};

MongoConnector.prototype.DeleteCommunities = function() {
  MongoClient.connect(this.configs.MongoDBEndpoint, function(err, db) {
     if(err) {
      console.log("Error connecting to MongoDB: " + err);
      return;
     }

	 db.collection('CacheVisjsStoredGraphs').remove();
	 db.collection('authorsInCommunity').remove();
     db.collection('publicationsInCommunity').remove();
     db.collection('coauthorshipsInCommunity').remove();
	 db.collection('communityJobs').remove();

	 db.close();
  });
};

MongoConnector.prototype.DeleteGraph = function() {
  MongoClient.connect(this.configs.MongoDBEndpoint, function(err, db) {
     if(err) {
      console.log("Error connecting to MongoDB: " + err);
      return;
     }

     db.collection('authors').remove();
     db.collection('publications').remove();
     db.collection('coauthorships').remove();

	   db.close();

  });
};

MongoConnector.prototype.InsertArrayData = function(data, collectionName) {
  MongoClient.connect(this.configs.MongoDBEndpoint, function(err, db) {
     if(err) {
      console.log("Error connecting to MongoDB: " + err);
      return;
     }

     db.collection(collectionName).insert(data);

		 db.close();
  });
};

MongoConnector.prototype.InsertCommunity = function(job, authors, coauthorships, publications) {
  MongoClient.connect(this.configs.MongoDBEndpoint, function(err, db) {
     if(err) {
      console.log("MongoConnector - " + job.Id + " - Error connecting to MongoDB: " + err);
      return;
     }

	 db.collection('communityJobs').insert(job, function() {

				 db.collection('authorsInCommunity').insert(authors, function() {

							db.collection('publicationsInCommunity').insert(publications, function() {

									db.collection('coauthorshipsInCommunity').insert(coauthorships, function() {

											db.close();
									});
							});
				 });

	 });

  });
};

MongoConnector.prototype.InsertGraph = function(authors, coauthorships, publications) {
  MongoClient.connect(this.configs.MongoDBEndpoint, function(err, db) {
     if(err) {
      console.log("MongoConnector - " + job.Id + " - Error connecting to MongoDB: " + err);
      return;
     }

	 db.collection('authors').insert(authors, function() {

							db.collection('publications').insert(publications, function() {

									db.collection('coauthorships').insert(coauthorships, function() {

											db.close();
									});
							});
		});

  });
};

MongoConnector.prototype.GetArrayData = function(collectionName, filter, callback) {
  MongoClient.connect(this.configs.MongoDBEndpoint, function(err, db) {

     if(err) {
       console.log("Error connecting to MongoDB: " + err);
       callback({});
       return;
     }

     db.collection(collectionName).find(filter).toArray(function(err, items) {
          callback(items);
					db.close();
     });

  });
};

MongoConnector.prototype.GetCommunities = function(callback) {
  MongoClient.connect(this.configs.MongoDBEndpoint, function(err, db) {

     if(err) {
       console.log("Error connecting to MongoDB: " + err);
       callback({});
       return;
     }

     db.collection('communityJobs').find({ }).toArray(function(err, items) {
          callback(items);
					db.close();
     });
  });
};

MongoConnector.prototype.GetAuthors = function(callback) {
  this.GetArrayData('authors', { }, callback);
};

MongoConnector.prototype.GetPublications = function(callback) {
  this.GetArrayData('publications', { }, callback);
};

MongoConnector.prototype.GetCoauthorships = function(callback) {
  this.GetArrayData('coauthorships', { }, callback);
};

MongoConnector.prototype.GetAuthorsInCommunity = function(callback, communityJobId) {
  this.GetArrayData('authorsInCommunity', { "communityJobId": parseInt(communityJobId) }, callback);
};

MongoConnector.prototype.GetPublicationsInCommunity = function(callback, communityJobId) {
  this.GetArrayData('publicationsInCommunity', { "communityJobId": parseInt(communityJobId) }, callback);
};

MongoConnector.prototype.GetCoauthorshipsInCommunity = function(callback, communityJobId) {
  this.GetArrayData('coauthorshipsInCommunity', { "communityJobId": parseInt(communityJobId) }, callback);
};

MongoConnector.prototype.InsertVisjsCacheGraph = function(data) {
  MongoClient.connect(this.configs.MongoDBEndpoint, function(err, db) {
     if(err) {
      console.log("Error connecting to MongoDB: " + err);
      return;
     }

     db.collection('CacheVisjsStoredGraphs').insert(data);

	 db.close();
  });
};

MongoConnector.prototype.GetVisjsCacheGraph = function(callback, visjsCacheId) {
  MongoClient.connect(this.configs.MongoDBEndpoint, function(err, db) {
     if(err) {
      console.log("Error connecting to MongoDB: " + err);
      return;
     }

     db.collection('CacheVisjsStoredGraphs').find({ "id": visjsCacheId }).toArray(function(err, item) {
          callback(item);
		  db.close();
     });
  });
};

MongoConnector.prototype.DeleteVisjsCache = function() {
  MongoClient.connect(this.configs.MongoDBEndpoint, function(err, db) {
     if(err) {
      console.log("Error connecting to MongoDB: " + err);
      return;
     }

     db.collection('CacheVisjsStoredGraphs').remove();
     db.close();
  });
};

MongoConnector.prototype.GetNewObjectID = function() {
  return new ObjectID();
};

module.exports = MongoConnector;
