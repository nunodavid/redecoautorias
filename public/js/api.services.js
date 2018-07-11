var okHTMLAdmin = "<span style='color: darkgreen;font-weight: bold;'>OK!</span>";
var nokHTMLAdmin = "<span style='color: darkred;font-weight: bold;'>KO!</span>";
var communitiesInMemory = null;

function DeleteDB()
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
         if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
            document.getElementById("#HarvestStatus").innerHTML = nokHTMLAdmin + " Could not delete DB, please try again latter.";
		 } else {
			document.getElementById("#HarvestStatus").innerHTML = okHTMLAdmin + " The DB was deleted.";
		 }
    };

	xmlHttp.open("GET", "/api/deleteDB", true);
    xmlHttp.send(null);
};

function DeleteCommunity()
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
            document.getElementById("#HarvestStatus").innerHTML = nokHTMLAdmin + " Could not delete communties, please try again latter.";
		} else {
			document.getElementById("#HarvestStatus").innerHTML = okHTMLAdmin + " The communities in the DB were deleted.";
		}
    };

	xmlHttp.open("GET", "/api/deletecommunities", true);
    xmlHttp.send(null);
};

function CommunityDetection()
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
         if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
			document.getElementById("#HarvestStatus").innerHTML = nokHTMLAdmin + " Could not identify communities, please try again latter.";
		  } else if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			 document.getElementById("#HarvestStatus").innerHTML = "Starting Community Detection...";
					  
			 GetOngoingStatusFromCommunityDetectionWS();
		  }
    };

	xmlHttp.open("GET", "/api/communitydetection", true);
    xmlHttp.send(null);
};

function StartHarvestJob()
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
         if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
			document.getElementById("#HarvestStatus").innerHTML = nokHTMLAdmin + " Could not start harvest, please try again latter.";
		}
		else if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			document.getElementById("#HarvestStatus").innerHTML = "Starting Harvest...";
					  
			GetOngoingStatus();
		}
    }

    xmlHttp.open("GET", "/api/harvest", true);
    xmlHttp.send(null);
};

function GetOngoingStatus()
{	
	var timeoutFunction = () => {
				
					var xmlHttp = new XMLHttpRequest();
					xmlHttp.onreadystatechange = function() {
						 if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
							document.getElementById("#HarvestStatus").innerHTML = nokHTMLAdmin + " Could not get harvest status.";
						 }
						else if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
							let response = JSON.parse(xmlHttp.responseText);
							
							document.getElementById("#HarvestStatus").innerHTML = JSON.stringify(response,null,'\t');
							
							if(response.OngoingHarvest) {
								 setTimeout(function() {
									timeoutFunction();
								  }, 3000);
							} else {
								document.getElementById("#HarvestStatus").innerHTML = "Generation of cache for graph..."; 
								
								//the cache of communities is deleted with new graph generation
								SetCacheForGraphFromCommunities(true);
							}
						}
					}
					
					xmlHttp.open("GET", "/api/harveststatus", true);
					xmlHttp.send(null);
	};
	
	timeoutFunction();
};

function GetOngoingStatusFromCommunityDetectionWS()
{	
	var timeoutFunction = () => {
				
					var xmlHttp = new XMLHttpRequest();
					xmlHttp.onreadystatechange = function() {
						 if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
							document.getElementById("#HarvestStatus").innerHTML = nokHTMLAdmin + " Could not get community detection status.";
						 }
						else if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
							let response = JSON.parse(xmlHttp.responseText);
							
							document.getElementById("#HarvestStatus").innerHTML = JSON.stringify(response,null,'\t');
							
							if(response.JobRunning) {
							  setTimeout(function() {
								timeoutFunction();
							  }, 3000);
							} else {
								document.getElementById("#HarvestStatus").innerHTML = "Generation of cache for graph..."; 
								
								SetCacheForGraphFromCommunities(true);
							}
						}
					}
					
					xmlHttp.open("GET", "/api/communitydetectionstatus", true);
					xmlHttp.send(null);
	};
	
	timeoutFunction();
};

function SetSerializedVisjsGraph(id, serializedGraph)
{
	var xmlHttp = new XMLHttpRequest();
	
	xmlHttp.onreadystatechange = function() {
		if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
		   document.getElementById("#HarvestStatus").innerHTML = nokHTMLAdmin + " Could not save graph in cache, repeat process please.";
		}
	    else{
		   document.getElementById("#HarvestStatus").innerHTML = okHTMLAdmin + " Graph stored in cache"; 
	   }
   };

	xmlHttp.open("POST", "/api/setvisjsgraph", true);
	xmlHttp.setRequestHeader("Content-Type", "application/json");
	xmlHttp.send(JSON.stringify({id: id + "", serializedGraph: serializedGraph}));
}

function DrawGraphToStoreInCache(graphData, idForStorage, idIsCommunity) {

	var nodes = new Array();
	var edges = new Array();
	
	graphData.authors.forEach(function(author) {

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

					nodes.push({id: author.Id, title: title, label: "", group: author.communityId ? author.communityId : author.School});
	});
	
	graphData.coauthorships.forEach(function(coauthorship) {
		edges.push({id: coauthorship.Id, from: coauthorship.GamaAuthorId, to: coauthorship.BetaAuthorId, value: coauthorship.Attractiveness });
	});
	
	var nodesVis = new vis.DataSet();

	for(var i = 0; i < nodes.length; i++){
		  nodesVis.add({	id: nodes[i].id,
							label: nodes[i].label,
							title: nodes[i].title,
							group: nodes[i].group });
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
}
	 };

options.edges["smooth"] = { type:'dynamic' };

var Network = new vis.Network(document.getElementById('graphArea'), data, options);

Network.on("stabilizationProgress", function(params) {
	document.getElementById("#HarvestStatus").innerHTML = "Storing in cache: " + (params.iterations/params.total * 100) + "%";
});


	 Network.once("stabilizationIterationsDone", function() {

			Network.storePositions();

			SetSerializedVisjsGraph(idForStorage, JSON.stringify(nodesVis.get()));
			
			if(idIsCommunity){
				SetCacheForGraphFromCommunities(false);
			}
	 });
}

function SetCacheForGraphFromCommunities(start){

	if(start){
		
		communitiesInMemory = [];

		var callbackCommunities = function(communities) {		
			for (var i = 0; i < communities.length; i++) {
				communitiesInMemory.push(communities[i].Id);
			}
	
			SetCacheForGraphFromCommunities(false);
		};
	
		GetAvaiableCommunities(callbackCommunities);

		return;
	}

	if(communitiesInMemory == null)
		return;

	if(communitiesInMemory.length != 0){
		var id = communitiesInMemory[0];
		communitiesInMemory.splice(0, 1);

		var callback = function(nodes){
			if(nodes == null){
				GetGraphData(function(){ DrawGraphToStoreInCache(Graph, id, true); }, id);
			} else {
				SetCacheForGraphFromCommunities(false);
			}
		};

		GetSerializedVisjsGraph(id, callback);
	} else {
		//communities detection deletes cache
		GetGraphData(function(){ DrawGraphToStoreInCache(Graph, "NETWORK", false); }, null);

		communitiesInMemory = null;
	}
}