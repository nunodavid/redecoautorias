function DeleteDB()
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
         if (xmlHttp.readyState == 4 && xmlHttp.status != 200) {
            alert("Could not delete DB, please try again latter.")
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
            alert("Could not delete communties, please try again latter.")
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
            alert("Could not identify communities, please try again latter.")
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
            alert("Could not start harvest, please try again latter.")
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
							alert("Could not get harvest status.")
						 }
						else if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
							let response = JSON.parse(xmlHttp.responseText);
							
							document.getElementById("#HarvestStatus").innerHTML = JSON.stringify(response, null, 1);
							
							if(response.OngoingHarvest) {
								 setTimeout(function() {
									timeoutFunction();
								  }, 3000);
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
							alert("Could not get community detection status.")
						 }
						else if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
							let response = JSON.parse(xmlHttp.responseText);
							
							document.getElementById("#HarvestStatus").innerHTML = xmlHttp.responseText;
							
							if(response.JobRunning) {
							  setTimeout(function() {
								timeoutFunction();
							  }, 3000);
							}
						}
					}
					
					xmlHttp.open("GET", "/api/communitydetectionstatus", true);
					xmlHttp.send(null);
	};
	
	timeoutFunction();
};
