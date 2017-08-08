var Graph = {
  authors: null,
  publications: null,
  coauthorships: null
};

function GetGraphData(callbackFunc, communityId)
{
    let authorsEndpoint;
    let publicationsEndpoint;
    let coauthorshipsEndpoint;

    if(communityId)
    {
      authorsEndpoint = "/api/graph/authorsincommunity?communityId=" + communityId;
      publicationsEndpoint = "/api/graph/publicationsincommunity?communityId=" + communityId;
      coauthorshipsEndpoint = "/api/graph/coauthorshipsincommunity?communityId=" + communityId;
    }
    else
    {
      authorsEndpoint = "/api/graph/authors";
      publicationsEndpoint = "/api/graph/publications";
      coauthorshipsEndpoint = "/api/graph/coauthorships";
    }

    GetGraphAuthors(authorsEndpoint);
    GetGraphPublications(publicationsEndpoint);
    GetGraphCoAuthorships(coauthorshipsEndpoint);

    var callback = function() {
      setTimeout(function() {
        if(Graph.authors != null && Graph.publications != null && Graph.coauthorships != null){
          callbackFunc(Graph);
        }
        else {
          callback();
        }
      }, 1000);
    };

    callback();
};

function GetGraphAuthors(endpoint)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
            alert("Could not get graph.")
		}	 
		else if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			Graph.authors = JSON.parse(xmlHttp.responseText);
		}
   };

  xmlHttp.open("GET", endpoint, true);
  xmlHttp.send(null);
};

function GetGraphPublications(endpoint)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
         if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
           alert("Could not get graph.")
		 }
		 else if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
		   Graph.publications = JSON.parse(xmlHttp.responseText);
		 }
   };

  xmlHttp.open("GET", endpoint, true);
  xmlHttp.send(null);
};

function GetGraphCoAuthorships(endpoint)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
         if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
            alert("Could not get graph.")
		 }
		 else if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			Graph.coauthorships = JSON.parse(xmlHttp.responseText);
		 }
   };

  xmlHttp.open("GET", endpoint, true);
  xmlHttp.send(null);
};

function GetAvaiableCommunities(callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
         if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
            alert("Could not get communities ids.")
		 }
		 else if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			callback(JSON.parse(xmlHttp.responseText));
		 }
   };

  xmlHttp.open("GET", "/api/graph/getcommunitiesids", true);
  xmlHttp.send(null);
};
