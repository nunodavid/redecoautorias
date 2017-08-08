var DBContext = require('./mongoconnector');
var Configs = require('./configurations');
var CommunityNaming = require('./givecommunityaname');
var CommunityIdentification = require('../models/communityidentification');
var MCL = require('./mclalgorithm');

var CommunityDetection = function() {
	this.configs = new Configs();
	this.dbcontext = new DBContext();
	this.naming = new CommunityNaming();

	this.jobRunning = false;
	this.runningJobs = false;
	this.runningsTotal = null;
	this.allAuthors = null;
	this.allPublications = null;
	this.allCoauthorships = null;
	this.allCommunityJobs = null;
};

CommunityDetection.prototype.Identify = function() {
	var self = this;

	if(this.jobRunning){
		console.log("CommunityDetection Error - Job already started.");
		return;
	}

	this.jobRunning = true;
	this.runningJobs = true;
	this.runningsTotal = 0;
	this.allAuthors = new Array();
	this.allPublications = new Array();
	this.allCoauthorships = new Array();
	this.allCommunityJobs = new Array();

	console.log("CommunityDetection will start.");

	this.Run();

	var validateEnd;
	validateEnd = function() {
		setTimeout(function() {

			if(self.runningsTotal != 0 || self.runningJobs){
				validateEnd();
				return;
			}

			if(self.allCommunityJobs.length > 0 && self.allAuthors.length > 0 && self.allCoauthorships.length > 0 && self.allPublications.length > 0)
				self.dbcontext.InsertCommunity(self.allCommunityJobs, self.allAuthors, self.allCoauthorships, self.allPublications);

			self.jobRunning = false;

			console.log("CommunityDetection - The End");
		}, 5000);
	};
	validateEnd();
};

CommunityDetection.prototype.GetStatus = function() {
	return { JobRunning: this.jobRunning,
	         RunningsTotal: this.runningsTotal,
			 AlgorithmTotal: this.algorithmTotal };
};

//the actual graph will be cloned so that it is not lost
CommunityDetection.prototype.PrepareModel = function(self, job, authorsToProcess, publicationsToProcess, coauthorshipsToProcess, authors, publications, coauthorships) {

	authors.forEach(function(author) {
		let newAuthor = JSON.parse(JSON.stringify(author));
		newAuthor.communityJobId = job.Id;
		newAuthor._id = self.dbcontext.GetNewObjectID();
		authorsToProcess.push(newAuthor);
	});

	publications.forEach(function(publication) {
		let newPublication = JSON.parse(JSON.stringify(publication));
		newPublication.communityJobId = job.Id;
		newPublication._id = self.dbcontext.GetNewObjectID();
		publicationsToProcess.push(newPublication);
	});

	coauthorships.forEach(function(coauthorship) {
		let newCoauthorship = JSON.parse(JSON.stringify(coauthorship));
		newCoauthorship.communityJobId = job.Id;
		newCoauthorship._id = self.dbcontext.GetNewObjectID();
		coauthorshipsToProcess.push(newCoauthorship);
	});
};

CommunityDetection.prototype.FinishDetection = function(self, job, authors, publications, coauthorships) {

	//authors within communities withtout the minimum size will be deleted
	var deletedAuthors = new Array();
	for(var i = 0; i < authors.length; i++){
				if(!authors[i].communityId || authors[i].communityId.split("#").length <= this.configs.MinimumCommunitySize){
					deletedAuthors.push(authors[i].Id);
					authors.splice(i, 1);
					i--;
				}
	}

	var toDeletePublications = new Array();
	for(var i = 0; i < coauthorships.length; i++){
		if(deletedAuthors.indexOf(coauthorships[i].BetaAuthorId) != -1 || deletedAuthors.indexOf(coauthorships[i].GamaAuthorId) != -1){
				toDeletePublications = toDeletePublications.concat(coauthorships[i].Publications);
				coauthorships.splice(i, 1);
				i--;
		}
	}

	for(var i = 0; i < publications.length; i++){
		if(toDeletePublications.indexOf(publications[i].Id) != -1){
				publications.splice(i, 1);
				i--;
		}
	}

	self.naming.Calculate(authors);

	self.allAuthors = self.allAuthors.concat(authors);
	self.allPublications = self.allPublications.concat(publications);
	self.allCoauthorships = self.allCoauthorships.concat(coauthorships);
	self.allCommunityJobs.push(job);
};

CommunityDetection.prototype.Run = function() {

	var authors = null, publications = null, coauthorships = null;
	var self = this;

	this.dbcontext.GetAuthors(function(items){ authors = items; });
	this.dbcontext.GetPublications(function(items){ publications = items; });
	this.dbcontext.GetCoauthorships(function(items){ coauthorships = items; });

	var validateEnd;
	validateEnd = function() {
		setTimeout(function() {

			if(authors == null || publications == null || coauthorships == null){
				validateEnd();
				return;
			}

			let job, time, authorsToProcess, publicationsToProcess, coauthorshipsToProcess;

				job = new CommunityIdentification();
				job.AlgorithmName = "MCL";

				time = new Date();
				job.Id = time.getTime();
				job.CreationDate = time.toDateString() + " - " + time.toTimeString().split('GMT')[0];

				authorsToProcess = new Array();
				publicationsToProcess = new Array();
				coauthorshipsToProcess = new Array();

				self.PrepareModel(self, job, authorsToProcess, publicationsToProcess, coauthorshipsToProcess, authors, publications, coauthorships);

				self.runningsTotal++;
				(new MCL()).Calculate(job, authorsToProcess, publicationsToProcess, coauthorshipsToProcess,
															(error, job, authors, publications, coauthorships) =>
				{
								if(!error){
									self.FinishDetection(self, job, authors, publications, coauthorships);
									console.log("MCL job done: " + job.Id);
								}

								self.runningsTotal--;
				});

			  var i = 1;

				job = new CommunityIdentification();
				job.AlgorithmName = "ABCD";

				time = new Date();
				job.Id = time.getTime();
				job.CreationDate = time.toDateString() + " - " + time.toTimeString().split('GMT')[0];

				authorsToProcess = new Array();
				publicationsToProcess = new Array();
				coauthorshipsToProcess = new Array();

				self.PrepareModel(self, job, authorsToProcess, publicationsToProcess, coauthorshipsToProcess, authors, publications, coauthorships);

				self.runningsTotal++;
			  self.ABCDAlghoritmRun(job, authorsToProcess, publicationsToProcess, coauthorshipsToProcess, i);

			self.runningJobs = false;

		}, 1000);
	};
	validateEnd();
};

// variation 0 - original
// variation 1 -  increases cpauthorship attractiveness to promote community formation
CommunityDetection.prototype.ABCDAlghoritmRun = function(job, authors, publications, coauthorships, variation) {

  var self = this;
	var conglomerateAuthors = new Array();
	var conglomeratesCoauthorships = new Array();

	authors.forEach(function(author) {
		//deep clone
		let newAuthor = JSON.parse(JSON.stringify(author));
		newAuthor.conglomerateIds = [author.Id];

		//authors weight is the average of its attractiveness coauthorships
		let total = 0;
		let totalAttractiveness = 0;
		for(var i = 0; i < coauthorships.length; i++){
			if(coauthorships[i].BetaAuthorId == author.Id || coauthorships[i].GamaAuthorId == author.Id){
				totalAttractiveness += coauthorships[i].Attractiveness;
				total++;
			}
		}
		newAuthor.WeightAttractivenessAverage = totalAttractiveness / total;

		conglomerateAuthors.push(newAuthor);
	});

	coauthorships.forEach(function(coauthorship) {
		//deep clone
		let newCoauthorship = JSON.parse(JSON.stringify(coauthorship));
		delete newCoauthorship.Publications;

		conglomeratesCoauthorships.push(newCoauthorship);
	});

	//http://i.imgur.com/EHBLriK.jpg
  while(true){

	let hasConglomerated = false;
	let fixedWeight = 1;

  if(conglomeratesCoauthorships.length <= 1)
		break;

	for(var k = 0; k < conglomeratesCoauthorships.length; k++){

		let coauthorship = conglomeratesCoauthorships[k];
		let betaAuthorId = coauthorship.BetaAuthorId;
		let gamaAuthorId = coauthorship.GamaAuthorId;
		let gamaAuthorObject = null;

		let weightBeta;
		let numberAuthorsBeta;
		for(var i = 0; i < conglomerateAuthors.length; i++){
			if(conglomerateAuthors[i].Id == betaAuthorId){
			  numberAuthorsBeta = conglomerateAuthors[i].conglomerateIds.length;
				weightBeta = conglomerateAuthors[i].WeightAttractivenessAverage / numberAuthorsBeta;
				break;
			}
		}

		let weightGama;
		let numberAuthorsGama;
		for(var i = 0; i < conglomerateAuthors.length; i++){
			if(conglomerateAuthors[i].Id == gamaAuthorId){
			  numberAuthorsGama = conglomerateAuthors[i].conglomerateIds.length;
				weightGama = conglomerateAuthors[i].WeightAttractivenessAverage / numberAuthorsGama;
				gamaAuthorObject = conglomerateAuthors[i];
				break;
			}
		}

    let attractiveness = coauthorship.Attractiveness;

		if(variation == 0)
			attractiveness = attractiveness / (numberAuthorsGama * numberAuthorsBeta);

		if(variation == 1)
			attractiveness = attractiveness * 2;

		//console.log("Attractiveness: " + attractiveness);
		//console.log("Weight Gama: " + weightGama);
		//console.log("Weight Gama: " + weightBeta);

		if(attractiveness >= weightGama + weightBeta){

			hasConglomerated = true;

			let authorNewId = betaAuthorId + "#" + gamaAuthorId;

			//Beta author will conglomerate the Gama author
			for(var j = 0; j < conglomerateAuthors.length; j++){
				if(conglomerateAuthors[j].Id == betaAuthorId){
					conglomerateAuthors[j].conglomerateIds = conglomerateAuthors[j].conglomerateIds.concat(gamaAuthorObject.conglomerateIds);
          conglomerateAuthors[j].WeightAttractivenessAverage = conglomerateAuthors[j].WeightAttractivenessAverage + gamaAuthorObject.WeightAttractivenessAverage;
					conglomerateAuthors[j].Id = authorNewId;
					break;
				}
			}

			//Gama author will disapear
			for(var j = 0; j < conglomerateAuthors.length; j++){
				if(conglomerateAuthors[j].Id == gamaAuthorId){
					conglomerateAuthors.splice(j, 1);
		      break;
				}
			}

			//the coauthorships that pointed to Gama now have to point to the Beta
      for(var i = 0; i < conglomeratesCoauthorships.length; i++){

				if(conglomeratesCoauthorships[i].Id == coauthorship.Id)//this coauthorship will be deleted
					continue;

				if(conglomeratesCoauthorships[i].BetaAuthorId == gamaAuthorId)
				{
					conglomeratesCoauthorships[i].BetaAuthorId = authorNewId;
					continue;
				}

				if(conglomeratesCoauthorships[i].GamaAuthorId == gamaAuthorId)
				{
					conglomeratesCoauthorships[i].GamaAuthorId = authorNewId;
					continue;
				}
			}

			//the coauthorships that pointed to current Beta will reflect its new value
      for(var i = 0; i < conglomeratesCoauthorships.length; i++){

				if(conglomeratesCoauthorships[i].Id == coauthorship.Id)//this coauthorship will be deleted
					continue;

				if(conglomeratesCoauthorships[i].BetaAuthorId == betaAuthorId)
				{
					conglomeratesCoauthorships[i].BetaAuthorId = authorNewId;
					continue;
				}

				if(conglomeratesCoauthorships[i].GamaAuthorId == betaAuthorId)
				{
					conglomeratesCoauthorships[i].GamaAuthorId = authorNewId;
					continue;
				}
			}

			//the coauthorships that point to the same authors will be deleted
			let coauthorshipsIdsToDissapear = [];
			for(var i = 0; i < conglomeratesCoauthorships.length; i++){

				let leftAuthors = [conglomeratesCoauthorships[i].BetaAuthorId, conglomeratesCoauthorships[i].GamaAuthorId];

				for(var j = 0; j < conglomeratesCoauthorships.length; j++){

					let rightAuthors = [conglomeratesCoauthorships[j].BetaAuthorId, conglomeratesCoauthorships[j].GamaAuthorId];

					if(i == j)
					  continue;

					if(conglomeratesCoauthorships[j].Id == coauthorship.Id)//this coauthorship will be deleted
						continue;

					if((leftAuthors[0] == rightAuthors[0]
					   && leftAuthors[1] == rightAuthors[1])
						 || (leftAuthors[0] == rightAuthors[1]
	 					   && leftAuthors[1] == rightAuthors[0]))
					{
						coauthorshipsIdsToDissapear.push(conglomeratesCoauthorships[j].Id);
					}
				}
			}

			//this coauthorship will end
			conglomeratesCoauthorships.splice(k, 1);

      if(coauthorshipsIdsToDissapear.length > 1){
				//the first will be the remaining with the total attractiveness
				let principal = coauthorshipsIdsToDissapear.pop();

				for(var i = 0; i < conglomeratesCoauthorships.length; i++){
						if(coauthorshipsIdsToDissapear.indexOf(conglomeratesCoauthorships[i].Id) != -1){
							principal.Attractiveness += conglomeratesCoauthorships[i].Attractiveness;
							conglomeratesCoauthorships.splice(i, 1);
							i--;
						}
				}
			}

			//new cycle with the new authors and coauthorships
			break;
		}
	};

	if(!hasConglomerated)
		break;

	}

	authors.forEach(function(author) {
		for(var i = 0; i < conglomerateAuthors.length; i++){
			if(conglomerateAuthors[i].conglomerateIds.indexOf(author.Id) != -1){
				author.communityId = conglomerateAuthors[i].Id.toString();
				break;
			}
		}
	});

	self.FinishDetection(self, job, authors, publications, coauthorships);

	console.log("ABCD job done: " + job.Id);

	this.runningsTotal--;
};

module.exports = CommunityDetection;
