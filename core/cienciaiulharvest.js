var https = require('https');
var Author = require('../models/author');
var Publication = require('../models/publication');
var CoAuthorship = require('../models/coauthorship');
var Configs = require('./configurations');
var DBContext = require('./mongoconnector');
var PublicationCategories = require('./publicationCategories');
var AttractivenessForceNewman = require('./attractivenessForceNewman');

var CienciaIULHarvest = function() {
	this.configs = new Configs();
	this.publicationCategories = new PublicationCategories();

	this.ongoingHarvest = null;
	this.retryErrorAuthors = null;
	this.authorsInGraphGenerationJob = null;
	this.publicationsInGraphGenerationJob = null;
	this.coauthorshipInGraphGenerationJob = null;
	this.authorsIDsToProcess = null;
	this.totalDepartmentsToProcess = null;
	this.totalInvestigationCenterToProcess = null;
	this.totalAuthorsProcessError = null;
	this.startDateJob = null;
	this.endDateJob = null;
	this.timeout = null;
};

CienciaIULHarvest.prototype.ResetStatus = function() {
	this.ongoingHarvest = false;
	this.retryErrorAuthors = false;
	this.authorsIDsToProcess = new Array();
	this.authorsInGraphGenerationJob = new Array();
	this.publicationsInGraphGenerationJob = new Array();
	this.coauthorshipInGraphGenerationJob = new Array();
	this.totalDepartmentsToProcess = 0;
	this.totalInvestigationCenterToProcess = 0;
	this.totalAuthorsProcessError = new Array();
	this.startDateJob = null;
	this.endDateJob = null;
	this.timeout = 0;
};

CienciaIULHarvest.prototype.GetAuthorById = function(id) {
	for(var i = 0; i < this.authorsInGraphGenerationJob.length; i++){
		if(this.authorsInGraphGenerationJob[i].GetId() == id)
			return this.authorsInGraphGenerationJob[i];
	}

	return null;
};

CienciaIULHarvest.prototype.GetPubicationById = function(id) {
	for(var i = 0; i < this.publicationsInGraphGenerationJob.length; i++){
		if(this.publicationsInGraphGenerationJob[i].Id == id)
			return this.publicationsInGraphGenerationJob[i];
	}

	return null;
};

CienciaIULHarvest.prototype.GetCoAuthorshipById = function(idBeta, idGama) {
	for(var i = 0; i < this.coauthorshipInGraphGenerationJob.length; i++){

		var authorsId = [this.coauthorshipInGraphGenerationJob[i].BetaAuthorId,
		                 this.coauthorshipInGraphGenerationJob[i].GamaAuthorId];

		if(authorsId.indexOf(idBeta) != -1 && authorsId.indexOf(idGama) != -1)
			return this.coauthorshipInGraphGenerationJob[i];
	}

	return null;
};

//Not all authors are returned by Ciencia-IUL API for Schools.
//Some appeared only in publication metadata. Here in search the remaining ones.
CienciaIULHarvest.prototype.CleanPublicationsAndAuthors = function() {

	var self = this;

	//Remove duplicated publications
	for (var i = 0; i < self.publicationsInGraphGenerationJob.length; i++){
	  for (var j = 0; j < self.publicationsInGraphGenerationJob.length; j++){

		if(i == j)
			continue;

		if(self.publicationsInGraphGenerationJob[i].Id == self.publicationsInGraphGenerationJob[j].Id) {
          self.publicationsInGraphGenerationJob.splice(i, 1);
          i--;
		      break;
		}
	  }
	}

	//Remove duplicated authors
	for (var i = 0; i < self.authorsInGraphGenerationJob.length; i++){
	  for (var j = 0; j < self.authorsInGraphGenerationJob.length; j++){

		if(i == j)
			continue;

		if(self.authorsInGraphGenerationJob[i].Id == self.authorsInGraphGenerationJob[j].Id) {
          self.authorsInGraphGenerationJob.splice(i, 1);
          i--;
		      break;
		}
	  }
	}

	//authors in Publications but not in departments and investigation centers will be discarded from the authors of that publications
	var missingAuthorsIds = 0;
	self.publicationsInGraphGenerationJob.forEach(function(publication) {

		for(var i = 0; i < publication.Authors.length; i++){
			var author = self.GetAuthorById(publication.Authors[i]);

			if(author == null){
				publication.Authors.splice(i, 1);
				i--;
				missingAuthorsIds++;
			}
		}
	});

	console.log("Harvest - Discarded authors from publications because they were missing from graph: " + missingAuthorsIds);

  //publications with less than two authors will be discarded
	var discardedPublications = 0;
	for(var i = 0; i < self.publicationsInGraphGenerationJob.length; i++){
		if(self.publicationsInGraphGenerationJob[i].Authors.length <= 1){
			self.publicationsInGraphGenerationJob.splice(i, 1);
			i--;
			discardedPublications++;
		}
	}

	console.log("Harvest - Discarded publications: " + discardedPublications);

};

//All authors will be connected with empty coauthorships. In the end the empty ones
//will be purged.
CienciaIULHarvest.prototype.GenerateCoAuthorship = function() {
	var self = this;
  var id = 1;
  var baseSeed = new Date().getTime() + "_";

	//fill the coauthorships with the actual publications
	var authorsInCoauthorship = new Array();
	self.publicationsInGraphGenerationJob.forEach(function(publication) {

		//http://imgur.com/a/LmQwT
		for(var i = 0; i < publication.Authors.length; i++){
			for(var j = i + 1; j < publication.Authors.length; j++){
				var coauthorship = self.GetCoAuthorshipById(publication.Authors[i], publication.Authors[j]);

				if(coauthorship == null) {
					var authorBeta = self.GetAuthorById(publication.Authors[i]);
					var authorGama = self.GetAuthorById(publication.Authors[j]);

					if(authorBeta == null || authorGama == null){
						console.log("Harvest - Author Id is not in colection: " + publication.Authors[i] + " - " + publication.Authors[j]);
						continue;
					}

					var newCoAuthorship = new CoAuthorship();

					newCoAuthorship.Id = baseSeed + id;
					id++;

					newCoAuthorship.BetaAuthorId = authorBeta.GetId();
					newCoAuthorship.GamaAuthorId = authorGama.GetId();
					newCoAuthorship.Attractiveness = null;

					var time = new Date();
					newCoAuthorship.CreationDate = time.toDateString() + " - " + time.toTimeString();

					self.coauthorshipInGraphGenerationJob.push(newCoAuthorship);

					authorsInCoauthorship.push(authorBeta.GetId());
					authorsInCoauthorship.push(authorGama.GetId());

					coauthorship = newCoAuthorship;
				}

				coauthorship.Publications.push(publication.Id);
			}
		}
	});

  //calculate attractiveness force
	var force = new AttractivenessForceNewman();
	for (var i = 0; i < self.coauthorshipInGraphGenerationJob.length; i++){
  	self.coauthorshipInGraphGenerationJob[i].Attractiveness = force.Calculate(self.coauthorshipInGraphGenerationJob[i].Publications, self.publicationsInGraphGenerationJob);
  }

	//Authors with no coauthorships will be removed
	var authorsNotInCoauthorship = 0;
	for (var i = 0; i < self.authorsInGraphGenerationJob.length; i++){
		  if(authorsInCoauthorship.indexOf(self.authorsInGraphGenerationJob[i].GetId()) == -1){
          self.authorsInGraphGenerationJob.splice(i, 1);
          i--;

					authorsNotInCoauthorship++;
	  	}
	}

	console.log("Harvest - Number of authors deleted because they were not in coauthorships: " + authorsNotInCoauthorship);
};

CienciaIULHarvest.prototype.ValidateEndOfHarvest = function() {
	if(this.ongoingHarvest && this.totalDepartmentsToProcess == 0 && this.authorsIDsToProcess.length == 0 && this.totalInvestigationCenterToProcess == 0){

		if(!this.retryErrorAuthors){
			console.log("Harvest - Will retry getting authors in error - #: " + this.totalAuthorsProcessError.length);

			this.authorsIDsToProcess = this.authorsIDsToProcess.concat(this.totalAuthorsProcessError);
			this.totalAuthorsProcessError = [];

			this.retryErrorAuthors = true;
			return;
		}

		this.CleanPublicationsAndAuthors();

		this.GenerateCoAuthorship();

		var time = new Date();
		this.endDateJob = time.toDateString() + " - " + time.toTimeString();

		var db = new DBContext();
		db.InsertGraph(this.authorsInGraphGenerationJob, this.coauthorshipInGraphGenerationJob, this.publicationsInGraphGenerationJob);

		this.ongoingHarvest = false;

		console.log("Harvest - The End");
		console.log(JSON.stringify(this.GetStatus()));
	}
};

CienciaIULHarvest.prototype.ProcessSinglePublication = function(publication, container) {
	var self = this;

	if(self.GetPubicationById(publication.id) != null)
		return;

	var newPublication = new Publication();

	newPublication.Id = publication.id;
	newPublication.IdCienciaIUL = publication.id;
	newPublication.Title = publication.title;
	newPublication.Year = publication.year;
	newPublication.CienciaIULUrl = publication.ciencia_iul_url;
	newPublication.Issn_online = publication.issn_online;
	newPublication.Issn_print = publication.issn_print;
	newPublication.ScimagoCategories = self.publicationCategories.Get(publication.issn_print, publication.issn_online);

	newPublication.PublicationType = container;

	var time = new Date();
	newPublication.CreationDate = time.toDateString() + " - " + time.toTimeString();

	if(publication.authors){
		publication.authors.forEach(function(author) {
			if(self.configs.OnlyInternalAuthors){
				if(author.internal){
					newPublication.Authors.push(author.id);
				}
			} else {
				newPublication.Authors.push(author.id);
			}
		});
	}

	//only publications with more than two authors will be pushed
	if(newPublication.Authors.length >= 2)
		this.publicationsInGraphGenerationJob.push(newPublication);
};

CienciaIULHarvest.prototype.ProcessPublications = function(publications) {

	var self = this;

	if(publications.publications){
		if(publications.publications.articles){
			publications.publications.articles.forEach(function(article) {
				if(article.publications){
					article.publications.forEach(function(publication) {
						self.ProcessSinglePublication(publication, article.container);
					});
				}
			});
		}

		if(publications.publications.books){
			publications.publications.books.forEach(function(book) {
				if(book.publications){
					book.publications.forEach(function(publication) {
						self.ProcessSinglePublication(publication, book.container);
					});
				}
			});
		}

		if(publications.publications.other){
			publications.publications.other.forEach(function(other) {
				if(other.publications){
					other.publications.forEach(function(publication) {
						self.ProcessSinglePublication(publication, other.container);
					});
				}
			});
		}
	}
};

CienciaIULHarvest.prototype.ProcessAuthor = function (authorId) {
  var self = this;

	var authorAlreadyPush = self.GetAuthorById(authorId);
	if(authorAlreadyPush != null) {
		//console.log("Harvest - Author already in graph: " + authorId);
		self.totalAuthorsToProcess--;
		return;
	}

	//console.log("Harvest - Will get Author: " + authorId);

	var extServerOptions = {
		host: self.configs.CienciaIULHost,
		port: '443',
		path: self.configs.CienciaIULAuthorEndpoint + authorId,
		method: 'GET'
	};

	var req = https.request(extServerOptions, function (res) {
		var body = '';
		res.on('data', function(d) {
			body += d;
		});
		res.on('end', function() {
			try {
					var authorCienciaIUL = JSON.parse(body);

					var newAuthor = new Author();

					newAuthor.Id = authorCienciaIUL.author_info.id;
					newAuthor.IdCienciaIUL = authorCienciaIUL.author_info.id;
					newAuthor.Name = authorCienciaIUL.author_info.name;
					newAuthor.School = authorCienciaIUL.author_info.school_affiliation.designation_en;
					newAuthor.Department = authorCienciaIUL.author_info.department_affiliation.designation_en;
					newAuthor.CienciaIULUrl = authorCienciaIUL.ciencia_iul_url;

					if(authorCienciaIUL.author_info.centre_affiliations){
						authorCienciaIUL.author_info.centre_affiliations.forEach(function(center) {
							newAuthor.InvestigationCenters.push(center.designation_en);
						});
					}

					var time = new Date();
					newAuthor.CreationDate = time.toDateString() + " - " + time.toTimeString();

					self.authorsInGraphGenerationJob.push(newAuthor);

					self.ProcessPublications(authorCienciaIUL);
			} catch(err) {
				self.totalAuthorsProcessError.push(authorId);
				console.error("Harvest - Error in Author: " + authorId + " - Error:" + err);
			}

		});
	});

	req.on('error', (e) => {
			self.totalAuthorsProcessError.push(authorId);
			console.error("Harvest - Error in Author: " + authorId + " - Error:" + e);
	});

	req.end();
};

CienciaIULHarvest.prototype.PrepareAuthor = function (authorId) {
	var self = this;

	if(self.authorsIDsToProcess.indexOf(authorId) != -1){
		//console.log("Harvest - Author already in queue to process: " + authorId);
		return;
	}

	if(self.GetAuthorById(authorId) != null){
		//console.log("Harvest - Author already processed: " + authorId);
		return;
	}

	self.authorsIDsToProcess.push(authorId);
};

CienciaIULHarvest.prototype.ProcessDepartment = function (department) {
	var self = this;

	if(department.authors){
		department.authors.forEach(function(author) {
			self.PrepareAuthor(author.author.id);
		});
	}
};

CienciaIULHarvest.prototype.ProcessInvestigationCenter = function (center) {
	var self = this;

	if(center.authors){
		center.authors.forEach(function(author) {
			self.PrepareAuthor(author.author.id)
		});
	}
};

CienciaIULHarvest.prototype.GetStatus = function () {
	  return { "ToProcessDepartments" : this.totalDepartmentsToProcess,
		         "ToProcessInvestigationCenter" : this.totalInvestigationCenterToProcess,
				 	   "ToProcessAuthorsIDs" : this.authorsIDsToProcess.length,
						 "TotalAuthorsProcessError" : this.totalAuthorsProcessError.length,
						 "AuthorsInGraph" : this.authorsInGraphGenerationJob.length,
					 	 "PublicationsInGraph" : this.publicationsInGraphGenerationJob.length,
						 "CoauthorshipInGraphGenerationJob": this.coauthorshipInGraphGenerationJob.length,
						 "OngoingHarvest": this.ongoingHarvest,
						 "StartDateJob" : this.startDateJob,
					 	 "EndDateJob" : this.endDateJob
		};
};

CienciaIULHarvest.prototype.GetDepartment = function (department) {
			//console.log("Harvest - Will get Department: " + department);

			var self = this;

			var extServerOptions = {
				host: self.configs.CienciaIULHost,
				port: '443',
				path: self.configs.CienciaIULDepartmentsEndpoint + department,
				method: 'GET'
			};

			var req = https.request(extServerOptions, function (res) {
				var body = '';
				res.on('data', function(d) {
					body += d;
				});
				res.on('end', function() {
					try {
						self.ProcessDepartment(JSON.parse(body));
					} catch(err) {
						console.error("Harvest - Error in Department: " + err);
					}
					self.totalDepartmentsToProcess--;
				});
			});

			req.on('error', (e) => {
					self.totalDepartmentsToProcess--;
					console.error("Harvest - Error in Department: " + e);
			});

			req.end();
};

CienciaIULHarvest.prototype.GetInvestigationCenter = function (center) {
			//console.log("Harvest - Will get Investigation Center: " + center);

			var self = this;

			var extServerOptions = {
				host: self.configs.CienciaIULHost,
				port: '443',
				path: self.configs.CienciaIULInvestigationCenterEndpoint + center,
				method: 'GET'
			};

			var req = https.request(extServerOptions, function (res) {
				var body = '';
				res.on('data', function(d) {
					body += d;
				});
				res.on('end', function() {
					try {
						self.ProcessInvestigationCenter(JSON.parse(body));
					} catch(err) {
						console.error("Harvest - Error in Investigation Center: " + err);
					}
					self.totalInvestigationCenterToProcess--;
				});
			});

			req.on('error', (e) => {
					self.totalInvestigationCenterToProcess--;
					console.error("Harvest - Error in Investigation Center: " + e);
			});

			req.end();
};

CienciaIULHarvest.prototype.GenerateGraph = function (callback) {

		var self = this;

		if(self.ongoingHarvest){
			console.log("Harvest - Job already running:");
			console.log(JSON.stringify(self.GetStatus()));

			return;
		}

		//avoid duplicates
		var db = new DBContext();
		db.DeleteGraph();

		self.ResetStatus();
		self.ongoingHarvest = true;
		console.log("Harvest - Will start");

		self.totalDepartmentsToProcess = self.configs.CienciaIULDepartmentsEndpoints.length;
		self.totalInvestigationCenterToProcess = self.configs.CienciaIULInvestigationCenterEndpoints.length;

		var time = new Date();
		this.startDateJob = time.toDateString() + " - " + time.toTimeString();

		self.configs.CienciaIULDepartmentsEndpoints.forEach(function(department) {

			setTimeout(function() {
				self.GetDepartment(department);
			}, self.timeout);

			self.timeout += self.configs.APITimeout;
		});

		self.configs.CienciaIULInvestigationCenterEndpoints.forEach(function(center) {

			setTimeout(function() {
				self.GetInvestigationCenter(center);
			}, self.timeout);

			self.timeout += self.configs.APITimeout;
		});

		var getAuthorToProcess;
		getAuthorToProcess = function() {
			setTimeout(function() {

				if(self.authorsIDsToProcess.length > 0)
					self.ProcessAuthor(self.authorsIDsToProcess.shift());

				if(self.ongoingHarvest){
					getAuthorToProcess();
				}
			}, 3000); //3 seconds
		};

		var validateEnd;
		validateEnd = function() {
			setTimeout(function() {
				self.ValidateEndOfHarvest();

				console.log((new Date()).toTimeString());
				console.log(self.GetStatus());

				if(self.ongoingHarvest){
					validateEnd();
				}
			}, 300000); //5 minutes
		};

		validateEnd();
		getAuthorToProcess();
};

module.exports = CienciaIULHarvest;
