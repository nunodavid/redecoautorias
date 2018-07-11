var Network = null;
var drawingNetworkFlag = false;

function CreateCommunitiesOptionList(communities){
  var select = document.getElementById("selectCommunities");

  function compare(a,b) {
    if (a.Id > b.Id)
      return -1;
    if (a.Id < b.Id)
      return 1;
    return 0;
  };

  communities.sort(compare);

  let newOption = document.createElement("option");
  newOption.text = "";
  newOption.value = "";
  select.options.add(newOption, 1);

	communities.forEach(function(c) {
		newOption = document.createElement("option");
    newOption.text = c.AlgorithmName + " - " + c.CreationDate;
		newOption.value = c.Id;
	  select.options.add(newOption, 1);
	});
}

function CreateSingleCommunityOptionList(authors){
  var select = document.getElementById("selectSingleCommunity");

  select.options.length = 0;

  let newOption = document.createElement("option");
  newOption.text = "";
  newOption.value = "NOSINGLECOMMUNITY";
  select.options.add(newOption, 1);

  var communityName = [];
  var communityAuthorIds = [];
  var communitiesIds = [];
  for(let i = 0; i < authors.length; i++){
	  if(authors[i].communityId && communitiesIds.indexOf(authors[i].communityId) == -1){
		  communityName.push(authors[i].communityName);
      communitiesIds.push(authors[i].communityId);
		  communityAuthorIds.push(authors[i].Id);
	  }
  }

  for(let i = 0; i < communityName.length; i++){
    let newOption = document.createElement("option");
		newOption.text = communityName[i];
		newOption.value = communityAuthorIds[i];
		select.options.add(newOption, 1);
  }
}

function CreateAuthorsOptionList(authors){
  var select = document.getElementById("authorsList");

  var childArray = select.children;
  var cL = childArray.length;
  while(cL > 0) {
           cL--;
           select.removeChild(childArray[cL]);
  }

  function compareAuthors(a,b) {
    if (a.Name.charAt(0) < b.Name.charAt(0))
      return -1;
    if (a.Name.charAt(0) > b.Name.charAt(0))
      return 1;
    return 0;
  };

  authors.sort(compareAuthors);

	authors.forEach(function(author) {
		let newOption = document.createElement("option");
		newOption.value = author.Name;
	  select.appendChild(newOption, 1);
	});

}

function FocusAuthorInGraph(authorId){
  if(!drawingNetworkFlag && Network){
    Network.focus(authorId, {scale: 1.0, animation: { duration: 1000, easingFunction: "easeInOutQuad" }});
  }
}

function DrawGraph(graphData, allNetwork, nodesSerialized) {

        if(drawingNetworkFlag){
          alert("Graph is already being created.");
          return;
        }

        drawingNetworkFlag = true;

				var nodes = new Array();
				var edges = new Array();

				var schools = {};
				var departments = {};
				var communities = {};
				var investigationCenters = {};

        var totalComunities = 0;
        var comunityName = 0;

				graphData.authors.forEach(function(author) {
					if(!schools[author.School])
						schools[author.School] = 1;
					else
						schools[author.School]++;

					if(!departments[author.Department])
						departments[author.Department] = 1;
					else
						departments[author.Department]++;

					author.InvestigationCenters.forEach(function(ic) {
						if(!investigationCenters[ic])
							investigationCenters[ic] = 1;
						else
							investigationCenters[ic]++;
					});

          if(author.communityId){
            if(!communities[author.communityId]){
  						communities[author.communityId] = 1;
              totalComunities++;
              comunityName = author.communityName;
            }
  					else
  						communities[author.communityId]++;
          }

					//total publications of author
					var publications = 0;
					graphData.publications.forEach(function(publication) {
						if(publication.Authors.indexOf(author.Id) != -1)
							publications++;
					});

          let title = "";

          if(author.communityId){
              title += "Community: " + author.communityName + "<br/>";
          }

          title += author.Name + "<br/>"
                    + author.School + "<br/>"
                    + (author.Department ? author.Department : "") + "<br/>"
                    + "# Publications:" + publications;

					nodes.push({id: author.Id, title: title, label: !allNetwork ? author.Name : "", group: author.communityId && allNetwork ? author.communityId : author.School});
				});

				graphData.coauthorships.forEach(function(coauthorship) {
					edges.push({id: coauthorship.Id, from: coauthorship.GamaAuthorId, to: coauthorship.BetaAuthorId, value: coauthorship.Attractiveness });
				});

        var stats = "<div>";

        if(totalComunities > 0){
          stats += "<b>Total communities</b>: " + totalComunities  + "<br/>";
        }

				stats += "<b>Total authors</b>: " + graphData.authors.length + "<br/>"
							+ "<b>Total coauthorships</b>: " + graphData.coauthorships.length + "<br/>"
							+ "<b>Total publications</b>: " + graphData.publications.length  + "<br/>";

        stats += "</div>";

				stats += "<div><b>Authors by Schools</b>:<br/>"
				stats += schools['ISCTE Business School'] ? "<i>ISCTE Business School</i>: " + schools['ISCTE Business School'] + "<br/>" : "";
				stats += schools['School of Social Sciences'] ? "<i>School of Social Sciences</i>: " + schools['School of Social Sciences'] + "<br/>" : "";
				stats += schools['School of Sociology and Public Policy'] ? "<i>School of Sociology and Public Policy</i>: " + schools['School of Sociology and Public Policy'] + "<br/>" : "";
				stats += schools['School of Technology and Architecture'] ? "<i>School of Technology and Architecture</i>: " + schools['School of Technology and Architecture'] + "<br/>" : "";
				stats += "</div>";

				stats += "<div><b>Authors by Departments</b>:<br/>"
				Object.keys(departments).forEach(function(dep) {
					if(dep != "null"){
						stats += "<i>" + dep + "</i>: " + departments[dep] + "<br/>";
					}
				});
				stats += "</div>";

				stats += "<div><b>Authors by Research Centres</b>:<br/>"
				Object.keys(investigationCenters).forEach(function(ic) {
					if(ic != "null"){
						stats += "<i>" + ic + "</i>: " + investigationCenters[ic] + "<br/>";
					}
				});
				stats += "</div>";

				document.getElementById('stats').innerHTML = stats;

				if(nodes.length == 0) {
					document.getElementById('loadingGif').style.display = 'none';
					document.getElementById('stats').style.display = 'block';
					return;
				}

				  var nodesVis = new vis.DataSet();

				  if(nodesSerialized){
					  nodesVis = nodesSerialized;
				  }
				  else {
					for(var i = 0; i < nodes.length; i++){
						  nodesVis.add({	id: nodes[i].id,
											label: nodes[i].label,
											title: nodes[i].title,
											group: nodes[i].group });
					}
				  }

				  var data = {
						nodes: nodesVis,
						edges: edges
				  };

				  var options = {
					 interaction: {
						selectConnectedEdges: true,
						hideEdgesOnDrag: true,
            navigationButtons: true
					 },
					 nodes: {
						 shape: 'dot'
					 },
					 edges: {
						 scaling:{
							 min:5,
							 max:50
						 }
           },
           groups: {
            'ISCTE Business School': { color:{background:'red'} },
            'School of Social Sciences': { color:{background:'blue'} },
            'School of Sociology and Public Policy': { color:{background:'green'} },
            'School of Technology and Architecture': { color:{background:'yellow'} }
          }
				 };

				 if(nodesSerialized){
					  options["physics"] = false;
				  }

				 if(!allNetwork){
					 options.nodes.scaling = {};
					 options.edges.scaling = {};
				 }

          options.edges["smooth"] = { type:'dynamic' };

		 Network = new vis.Network(document.getElementById('graphArea'), data, options);

         Network.on("stabilizationProgress", function(params) {
                document.getElementById("graphProgressBar").value = params.iterations/params.total * 100;
          });

		  var stabilizationIterationsDone = function() {
					  document.getElementById('graphArea').style.display = 'block';

            if(!(totalComunities > 1 && allNetwork)){
                document.getElementById('colorsOfNodes').style.display = 'block';
            }

					  document.getElementById('exportGraph').style.display = 'block';
					  document.getElementById('communityStats').style.display = 'block';
					  document.getElementById('stats').style.display = 'block';

					drawingNetworkFlag = false;
    				document.getElementById('loadingGif').style.display = 'none';

					Network.setOptions( { physics: false } );
					Network.fit();

          if(allNetwork){
            var scaleOption = { scale : 0.15 };
            Network.moveTo(scaleOption);
          }
		  };

				 Network.once("stabilizationIterationsDone", function() {
					stabilizationIterationsDone();
				 });

				 Network.on('doubleClick', function (properties) {
					if(properties.nodes && properties.nodes.length == 1){
						var authorId =  properties.nodes[0];

            for(var i = 0; i < graphData.authors.length; i++){
      				if(graphData.authors[i].Id == authorId) {
      					document.getElementById("authorsAutoComplete").value = graphData.authors[i].Name;
      					break;
      			  }
      			}

						selectAuthor(false);
            return;
					}

          if(properties.nodes && properties.edges.length == 1){
						var edgeId =  properties.edges[0];

            for(var i = 0; i < graphData.coauthorships.length; i++){
      				if(graphData.coauthorships[i].Id == edgeId) {

                let html = "";

                let BetaAuthorName = "", GamaAuthorName = "";
                for(var j = 0; j < graphData.authors.length; j++){
          				if(graphData.authors[j].Id == graphData.coauthorships[i].BetaAuthorId) {
          					BetaAuthorName = graphData.authors[j].Name;
          			  }

                  if(graphData.authors[j].Id == graphData.coauthorships[i].GamaAuthorId) {
          					GamaAuthorName = graphData.authors[j].Name;
          			  }

                  if(BetaAuthorName != "" && GamaAuthorName != "") {
          					break;
          			  }
          			}

                let totalPublications = 0;
                for(var j = 0; j < graphData.coauthorships[i].Publications.length; j++){
                  let pubId = graphData.coauthorships[i].Publications[j];

                  for(var k = 0; k < graphData.publications.length; k++){
                    if(graphData.publications[k].Id == pubId){
                      let pub = graphData.publications[k];

                      let pubName = pub.Title ? pub.Title : "PUBLICATION";
                      let pubUrl =  pub.CienciaIULUrl ?  pub.CienciaIULUrl : "";
                      let pubYear =  pub.Year ?  pub.Year : "";

                      html += "- <a href='" + pubUrl + "' target='_blank'>" + pubYear + " - " + pubName + "</a><br />";

                      totalPublications++;
                      break;
                    }
                  }
                }
                html = "<b>Publications between " + BetaAuthorName + " and " + GamaAuthorName + "</b>:<br/><br/>" + html;

                document.getElementById("publicationsArea").innerHTML = html;
                document.getElementById("publicationsArea").style.display = 'block';
                location.href = "#publicationsArea";
                return;
      			  }
      			}
					}
				 });

				 if(nodesSerialized){
					stabilizationIterationsDone();
				}

        //title
        let title = "";
        if(!allNetwork){
          var select = document.getElementById("selectSingleCommunity");

          var communityName = null;
          if(select.selectedIndex >= 0)
            communityName = select.options[select.selectedIndex].innerText;

          if(communityName){
            title += "Scientific collaborations within " + communityName;
          } else if(totalComunities == 1){
            title += "Scientific collaborations within " + comunityName;
          } else {
            let authorName = document.getElementById("authorsAutoComplete").value;
            title += "Coauthorships of " + authorName;
          }
        } else {
          if(totalComunities > 1){
                var select = document.getElementById("selectCommunities");
                var communityName = select.options[select.selectedIndex].innerText;

                title = "Algorithm: " + communityName;
          } else {
               title = "Coauthorship Network";
          }
        }
        document.getElementById("graphTitle").innerHTML = title;
}

function DeleteGraph(){

  if(Network)
	 Network.destroy();

	Network = null;
}

function GetSerializedVisjsGraph(id, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
     if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
        alert("Could not get graph. Contact the administration please.");
		 } else if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			let json = xmlHttp.responseText;

			if(json){
				callback(JSON.parse(json));
			} else {
			  callback(null);
			}
		}
    };

	var queryString = "?id=" + id.toString().trim();
	xmlHttp.open("GET", "/api/getvisjsgraph" + queryString, true);
	xmlHttp.send(null);
}
