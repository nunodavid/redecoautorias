var CommunityNaming = require('./givecommunityaname');
var util = require('util');
var Configs = require('./configurations');

var MCL = function() {
  	this.configs = new Configs();
};

MCL.prototype.Calculate = function(job, authors, publications, coauthorships, callback) {

  var self = this;
  let fileContent = "";
  coauthorships.forEach(function(coauthorship) {
		fileContent += util.format('%s %s %s\n', coauthorship.BetaAuthorId, coauthorship.GamaAuthorId, coauthorship.Attractiveness);
	});

  var filename = new Date().getTime() + Math.floor(Math.random()*(100000-0+1)+0);

  require('fs').writeFile(__dirname + '/temp/' + filename, fileContent, function(err) {

      if(err) {
        console.error("MCL write file: " + err);
        callback(true);
        return;
      }

      let inflation = 2;

      let cmd = util.format('mcl %s --abc -l %s -o %s', __dirname + '/temp/' + filename, inflation, __dirname + '/temp/' + filename + '_result');

      require('child_process').exec(cmd, function(error, stdout, stderr) {

        if (error) {
          console.error("MCL execute cmd: " + error);
          callback(true);
          return;
        }

        require('fs').readFile(__dirname + '/temp/' + filename + '_result', 'utf8', function (err,data) {
          if (err) {
            console.error("MCL read result: " + error);
            callback(true);
            return;
          }

          require('fs').unlink(__dirname + '/temp/' + filename, (err) => { });
          require('fs').unlink(__dirname + '/temp/' + filename + '_result', (err) => { });

          var communities = data.split("\n");
          for(let i = 0; i < communities.length; i++)
           communities[i] = communities[i].split("\t").join("#");

          authors.forEach(function(author) {
         		for(var i = 0; i < communities.length; i++){
         			if(communities[i].indexOf(author.Id) != -1){
         				author.communityId = communities[i];
         				break;
         			}
         		}
         	});

          self.PurgeNetwork(authors, coauthorships, publications);

          communities = data.split("\n");
          for(let i = 0; i < communities.length; i++){
           let communityIds = communities[i].split("\t");

           for(let k = 0; k < communityIds.length; k++){
             let findAutor = false;

             for(let j = 0; j < authors.length; j++){
               if(authors[j].Id == communityIds[k]){
                  findAutor = true;
                  break;
               }
             }

             if(!findAutor){
               communityIds.splice(k, 1);
               k--;
             }
           }

           communities[i] = communityIds.join("#");
          }

          authors.forEach(function(author) {
         		for(var i = 0; i < communities.length; i++){
         			if(communities[i].indexOf(author.Id) != -1){
         				author.communityId = communities[i];
         				break;
         			}
         		}
         	});

          callback(false, job, authors, publications, coauthorships);
        });
      });
  });
};

//purge not all connected authors
MCL.prototype.PurgeNetwork = function(authors, coauthorships, publications) {

  var deletedAuthors = new Array();

  var comunitiesIds = { };
	for(var p = 0; p < authors.length; p++){

        if(comunitiesIds[authors[p].communityId]){
          continue;
        }

        comunitiesIds[authors[p].communityId] = true;

        let authorsInComunities = new Array();
        let authorsInComunitiesIds = new Array();
        for(var k = 0; k < authors.length; k++){
          if(authors[k].communityId == authors[p].communityId){
            authorsInComunities.push(JSON.parse(JSON.stringify(authors[k])));//deep clone
            authorsInComunitiesIds.push(authors[k].Id);
          }
        }

        let coauthorshipsInComunities = new Array();
        for(var k = 0; k < coauthorships.length; k++){
          if(authorsInComunitiesIds.indexOf(coauthorships[k].BetaAuthorId) != -1
             && authorsInComunitiesIds.indexOf(coauthorships[k].GamaAuthorId) != -1){
            coauthorshipsInComunities.push(JSON.parse(JSON.stringify(coauthorships[k])));//deep clone
          }
        }

        while(true){

                if(coauthorshipsInComunities.length <= 1)
                  break;

                let coauthorship = coauthorshipsInComunities[0];
                let betaAuthorId = coauthorship.BetaAuthorId;
                let gamaAuthorId = coauthorship.GamaAuthorId;
                let authorNewId = betaAuthorId + "#" + gamaAuthorId;

                //Beta author will conglomerate the Gama author
                for(var j = 0; j < authorsInComunities.length; j++){
                  if(authorsInComunities[j].Id == betaAuthorId){
                    authorsInComunities[j].Id = authorNewId;
                    break;
                  }
                }

                //Gama author will disapear
                for(var j = 0; j < authorsInComunities.length; j++){
                  if(authorsInComunities[j].Id == gamaAuthorId){
                    authorsInComunities.splice(j, 1);
                    break;
                  }
                }

                //the coauthorships that pointed to Gama now have to point to the Beta
                for(var i = 0; i < coauthorshipsInComunities.length; i++){

                  if(coauthorshipsInComunities[i].Id == coauthorship.Id)//this coauthorship will be deleted
                    continue;

                  if(coauthorshipsInComunities[i].BetaAuthorId == gamaAuthorId)
                  {
                    coauthorshipsInComunities[i].BetaAuthorId = authorNewId;
                    continue;
                  }

                  if(coauthorshipsInComunities[i].GamaAuthorId == gamaAuthorId)
                  {
                    coauthorshipsInComunities[i].GamaAuthorId = authorNewId;
                    continue;
                  }
                }

                //the coauthorships that pointed to current Beta will reflect its new value
                for(var i = 0; i < coauthorshipsInComunities.length; i++){

                  if(coauthorshipsInComunities[i].Id == coauthorship.Id)//this coauthorship will be deleted
                    continue;

                  if(coauthorshipsInComunities[i].BetaAuthorId == betaAuthorId)
                  {
                    coauthorshipsInComunities[i].BetaAuthorId = authorNewId;
                    continue;
                  }

                  if(coauthorshipsInComunities[i].GamaAuthorId == betaAuthorId)
                  {
                    coauthorshipsInComunities[i].GamaAuthorId = authorNewId;
                    continue;
                  }
                }

                //the coauthorships that point to the same authors will be deleted
                let coauthorshipsIdsToDissapear = [];
                for(var i = 0; i < coauthorshipsInComunities.length; i++){

                  let leftAuthors = [coauthorshipsInComunities[i].BetaAuthorId, coauthorshipsInComunities[i].GamaAuthorId];

                  for(var j = 0; j < coauthorshipsInComunities.length; j++){

                    let rightAuthors = [coauthorshipsInComunities[j].BetaAuthorId, coauthorshipsInComunities[j].GamaAuthorId];

                    if(i == j)
                      continue;

                    if(coauthorshipsInComunities[j].Id == coauthorship.Id)//this coauthorship will be deleted
                      continue;

                    if((leftAuthors[0] == rightAuthors[0]
                       && leftAuthors[1] == rightAuthors[1])
                       || (leftAuthors[0] == rightAuthors[1]
                         && leftAuthors[1] == rightAuthors[0]))
                    {
                      coauthorshipsIdsToDissapear.push(coauthorshipsInComunities[j].Id);
                    }
                  }
                }

                //this coauthorship will end
                coauthorshipsInComunities.splice(0, 1);

                if(coauthorshipsIdsToDissapear.length > 1){
                  //the first will be the remaining with the total attractiveness
                  let principal = coauthorshipsIdsToDissapear.pop();

                  for(var k = 0; k < coauthorshipsInComunities.length; k++){
                      if(coauthorshipsIdsToDissapear.indexOf(coauthorshipsInComunities[k].Id) != -1){
                        coauthorshipsInComunities.splice(k, 1);
                        i--;
                      }
                  }
                }
        }

        //all nodes were aglomerated
        if(authorsInComunities.length == 1)
          continue;

        //all the biggest will remaining
        let biggestAuthor = authorsInComunities[0];
        for(var k = 1; k < authorsInComunities.length; k++){
            if(authorsInComunities[k].Id.toString().split("#").length > biggestAuthor.Id.toString().split("#").length){
              biggestAuthor = authorsInComunities[k];
            }
        }

        for(var k = 0; k < authorsInComunities.length; k++){
          if(authorsInComunities[k].Id == biggestAuthor.Id)
            continue;

            deletedAuthors = deletedAuthors.concat(authorsInComunities[k].Id.toString().split("#"));
        }
    }

  for(var i = 0; i < deletedAuthors.length; i++){
  		deletedAuthors[i] = parseInt(deletedAuthors[i]);
  }

  //delete authors
  for(var i = 0; i < authors.length; i++){
		if(deletedAuthors.indexOf(authors[i].Id) != -1){
				authors.splice(i, 1);
				i--;
		}
	}

  //delete not used publications and coauthorships
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
};

module.exports = MCL;
