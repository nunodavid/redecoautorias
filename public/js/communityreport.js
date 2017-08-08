function CommunityReportInHTML(graphData){

  var allTimeScimagoCategorias = new Array();

  let html = "<table border='1'>";
  html += "<tr><th>#</th><th>Community Name</th><th>Number of Authors</th><th>Number of Coauthorship</th><th>Authors with the highest number of connections</th><th>Scimago Categories</th></tr>"

  //get communities ids and name
  var communityName = [];
  var communitiesIds = [];
  for(let i = 0; i < graphData.authors.length; i++){
	  if(graphData.authors[i].communityId && communitiesIds.indexOf(graphData.authors[i].communityId) == -1){
		  communityName.push(graphData.authors[i].communityName);
      communitiesIds.push(graphData.authors[i].communityId);
	  }
  }

  for(let i = 0; i < communitiesIds.length; i++){
    let communityNaming = communityName[i];
    let communityId = communitiesIds[i];

    let authorsIdInCommunity = new Array();
    graphData.authors.forEach(function(author) {
      if(author.communityId == communityId) {
        authorsIdInCommunity.push(author.Id);
      }
    });

    let coauthorshipsIdInCommunity = new Array();
    graphData.coauthorships.forEach(function(coauthorship) {
      if(authorsIdInCommunity.indexOf(coauthorship.GamaAuthorId) != -1 && authorsIdInCommunity.indexOf(coauthorship.BetaAuthorId) != -1)
        coauthorshipsIdInCommunity.push(coauthorship);
    });

    //maximun degree author
    let authorsDegree = { };
    coauthorshipsIdInCommunity.forEach(function(coauthorship) {
      if(!authorsDegree[coauthorship.GamaAuthorId])
        authorsDegree[coauthorship.GamaAuthorId] = 0;

      authorsDegree[coauthorship.GamaAuthorId]++;

      if(!authorsDegree[coauthorship.BetaAuthorId])
        authorsDegree[coauthorship.BetaAuthorId] = 0;

      authorsDegree[coauthorship.BetaAuthorId]++;
    });

    let maximunDegreeAuthors = new Array();
    let maximunDegreeAuthorsValue = 0;
    let arrayDegrees = Object.keys(authorsDegree);

    for(let p = 0; p < arrayDegrees.length; p++){
      if(authorsDegree[arrayDegrees[p]] > maximunDegreeAuthorsValue){
        maximunDegreeAuthorsValue = authorsDegree[arrayDegrees[p]];
        maximunDegreeAuthors = new Array();
        maximunDegreeAuthors.push(arrayDegrees[p]);
        continue;
      }

      if(authorsDegree[arrayDegrees[p]] == maximunDegreeAuthorsValue){
        maximunDegreeAuthors.push(arrayDegrees[p]);
        continue;
      }
    }

    for(let p = 0; p < maximunDegreeAuthors.length; p++){
      for(let k = 0; k < graphData.authors.length; k++){
          if(graphData.authors[k].Id == maximunDegreeAuthors[p]) {
            maximunDegreeAuthors[p] = graphData.authors[k].Name;
          }
      }
    }

    //community naming && Scimago categories
    let mergeCategories = new Array();
    let mergeCategoriesCounting = new Array();
    for(var o = 0; o < authorsIdInCommunity.length; o++){
        for(var j = 0; j < graphData.publications.length; j++){

          if(graphData.publications[j].Authors.indexOf(authorsIdInCommunity[o]) != -1){
            for(var k = 0; k < graphData.publications[j].ScimagoCategories.length; k++){
              let category = graphData.publications[j].ScimagoCategories[k];

              if(mergeCategories.indexOf(category) == -1){
                mergeCategories.push(category);
                mergeCategoriesCounting.push(1);
              }
              else {
                mergeCategoriesCounting[mergeCategories.indexOf(category)] += 1;
              }
            }
          }
        }
      }

	  allTimeScimagoCategorias = allTimeScimagoCategorias.concat(mergeCategories);

      //get the 5 more representative
      let assignName = "";
      let totalNames = mergeCategories.length;
      for(let o = 0; o <= 4 && o < totalNames; o++){
        let biggerValue = -1;
        let biggerValueIndex = -1;

        for(let j = 0; j < mergeCategories.length; j++){
          if(mergeCategoriesCounting[j] > biggerValue){
            biggerValue = mergeCategoriesCounting[j];
            biggerValueIndex = j;
          }
        }

        assignName += mergeCategories[biggerValueIndex] + " , ";
        mergeCategoriesCounting.splice(biggerValueIndex, 1);
        mergeCategories.splice(biggerValueIndex, 1);
      }
      assignName = assignName.slice(0, assignName.lastIndexOf(","));

      html += "<tr><td>" + (i + 1) + "</td>" +
                 "<td>" + communityNaming + "</td>" +
                 "<td>" + authorsIdInCommunity.length + "</td>" +
                 "<td>" + coauthorshipsIdInCommunity.length + "</td>" +
                 "<td>" + maximunDegreeAuthors.join(", ") + "</td>" +
                 "<td>" + assignName + "</td></tr>";

  }

	html += "</table>"

	html += "<br/><br/><table><tr><th>Scimago Category</th><th>Total</th></tr>"

	var counts = {};
	for (var i = 0; i < allTimeScimagoCategorias.length; i++) {
		counts[allTimeScimagoCategorias[i]] = 1 + (counts[allTimeScimagoCategorias[i]] || 0);
	}

	for(var propertyName in counts) {
	   html += "<tr><td>" + propertyName + "</td><td>" + counts[propertyName] + "</td></tr>"
	}

	html += "</table>"

	return html;
}
