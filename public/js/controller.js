var stackStates = [];

function BackAction(){
  if(stackStates.length == 0)
    return;

  if(stackStates.length < 2){
    stackStates = [];

    var select = document.getElementById("selectCommunities");
    var communityId = select.options[select.selectedIndex].value;

    if(communityId == ""){
      ComputeNetwork();
    } else {
      selectAuthor(true);
    }

    return;
  }

  stackStates.pop(); //the current author
  let authorName = stackStates.pop();
  document.getElementById("authorsAutoComplete").value = authorName;
  selectAuthor(false);
}

function LayoutLoadingGraph(){
  document.getElementById('loadingGif').style.display = 'block';
  document.getElementById('graphArea').style.display = 'none';
  document.getElementById('colorsOfNodes').style.display = 'none';
  document.getElementById('communityStats').style.display = 'none';
  document.getElementById('exportGraph').style.display = 'none';
  document.getElementById('stats').style.display = 'none';
  document.getElementById("publicationsArea").style.display = 'none';

  document.getElementById('communityStats').innerHTML = "";
  document.getElementById('graphTitle').innerHTML = "";
}

function ExportCommunityReport(){
  let html = CommunityReportInHTML(Graph);

  localStorage.setItem('htmlReport', html);

  window.open('/download.html?key=htmlReport&type=html', '_blank');
}

function ExportCoauthorshipsReport(){
	
  let html = "<div><h2>Coauthorships by Schools</h2>"
  html += GetCoauthorshipsBySchools(Graph, "School");
  html += "</div>";
  
  html += "<div><h2>Coauthorships by Departments</h2>"
  html += GetCoauthorshipsBySchools(Graph, "Department");
  html += "</div>";
  
  localStorage.setItem('htmlReport', html);

  window.open('/download.html?key=htmlReport&type=html', '_blank');
}

function ExportGraph(){
  let graphml = ExportToGexf(Graph);

  localStorage.setItem('gefxlReport', graphml);

  window.open('/download.html?key=gefxlReport&type=text', '_blank');
}

function focusAuthor(){
  var authorName = document.getElementById("authorsAutoComplete").value;
  var authorId;
  for(var i = 0; i < Graph.authors.length; i++){
    if(Graph.authors[i].Name == authorName) {
      authorId = Graph.authors[i].Id;
      break;
    }
  }

  FocusAuthorInGraph(authorId);
}

function StopGraph(){

  if(drawingNetworkFlag){

    LayoutLoadingGraph();

    DeleteGraph();

    drawingNetworkFlag = false;
  }

}

  function selectCommunity(){

    if(drawingNetworkFlag){
      alert("Graph is already being created.");
      return;
    }

    var select = document.getElementById("selectCommunities");
    var communityId = select.options[select.selectedIndex].value;

     LayoutLoadingGraph();
    document.getElementById('loadingGif').style.display = 'none';

    if(communityId == ""){
      //ComputeNetwork();
    } else {

      stackStates = [];
      document.getElementById("authorsAutoComplete").value = "";

      var callback = function(graphData) {
        CreateAuthorsOptionList(graphData.authors);
        CreateSingleCommunityOptionList(graphData.authors);

        var select = document.getElementById("selectCommunities");
        var idForStorage = select.options[select.selectedIndex].value;

        GetSerializedVisjsGraph(idForStorage, function (nodes) { /*DrawGraph(Graph, true, nodes);*/ });
      };

      GetGraphData(callback, communityId);
    }
  }

  function ComputeNetwork(){

    if(drawingNetworkFlag){
      alert("Graph is already being created.");
      return;
    }

    stackStates = [];

    document.getElementById("authorsAutoComplete").value = "";
    document.getElementById("selectCommunities").selectedIndex = 0;
    document.getElementById("selectSingleCommunity").options.length = 0;

    LayoutLoadingGraph();

    var callback = function(graphData) {
      CreateAuthorsOptionList(graphData.authors);

      GetSerializedVisjsGraph("NETWORK", function (nodes) { DrawGraph(Graph, true, nodes); });
    };

    GetGraphData(callback);
  }

  function selectAuthor(hasSingleCommunityId){

    if(drawingNetworkFlag){
      alert("Graph is already being created.");
      return;
    }

    var authorName = document.getElementById("authorsAutoComplete").value;
    var authorId;
    for(var i = 0; i < Graph.authors.length; i++){
      if(Graph.authors[i].Name == authorName) {
        authorId = Graph.authors[i].Id;
        break;
      }
    }

    if(hasSingleCommunityId) {
      document.getElementById("authorsAutoComplete").value = "";

      select = document.getElementById("selectSingleCommunity");
      authorId = select.options[select.selectedIndex].value;

      if(authorId == "NOSINGLECOMMUNITY"){
        select = document.getElementById("selectCommunities");
        var idForStorage = select.options[select.selectedIndex].value;

        GetSerializedVisjsGraph(idForStorage, function (nodes) { DrawGraph(Graph, true, nodes); });
        return;
      }

      stackStates = [];

    } else {
      stackStates.push(authorName);
      document.getElementById("selectSingleCommunity").selectedIndex = 0;
    }

    var authorObj = null;
    for(var i = 0; i < Graph.authors.length; i++){
      if(Graph.authors[i].Id == authorId) {
        authorObj = Graph.authors[i];
        break;
      }
    }

    if(authorObj == null){
      alert("No author found for selection.");
      return;
    }

    LayoutLoadingGraph();

    DeleteGraph();

    var newGraphData = {};

    var coauthorshipsForAuthor = new Array();
    var authorsAuthor = new Array();
    authorsAuthor.push(authorObj);

    if(authorObj.communityId){

      var authorsIdInCommunity = new Array();
      authorsIdInCommunity.push(parseInt(authorId));
      Graph.authors.forEach(function(author) {
        if(author.Id != authorId && author.communityId == authorObj.communityId) {
          authorsAuthor.push(author);
          authorsIdInCommunity.push(author.Id);
        }
      });

      Graph.coauthorships.forEach(function(coauthorship) {
        //onlye community is shown
        if(authorsIdInCommunity.indexOf(coauthorship.GamaAuthorId) != -1 && authorsIdInCommunity.indexOf(coauthorship.BetaAuthorId) != -1)
          coauthorshipsForAuthor.push(coauthorship);
      });

    } else {

        Graph.coauthorships.forEach(function(coauthorship) {
          if(coauthorship.GamaAuthorId == authorId || coauthorship.BetaAuthorId== authorId)
            coauthorshipsForAuthor.push(coauthorship);
        });

        coauthorshipsForAuthor.forEach(function(coauthorship) {
          for(var i = 0; i < Graph.authors.length; i++){
            if(Graph.authors[i].Id != authorId && (coauthorship.GamaAuthorId == Graph.authors[i].Id || coauthorship.BetaAuthorId == Graph.authors[i].Id)) {
              authorsAuthor.push(Graph.authors[i]);
              break;
            }
          }
        });
    }

    var htmlResume = "<table class='coauthorshipTable'><tr><th>Author</th><th>School</th><th>Department</th><th>Research Centres</th><th>Connected with authors (#)</th></tr>";
    authorsAuthor.forEach(function(author) {

      //grau medio
      let grau = 0;
      coauthorshipsForAuthor.forEach(function(coauthorship) {
          if(coauthorship.GamaAuthorId == author.Id || coauthorship.BetaAuthorId== author.Id)
            grau++;
      });

      let department = author.Department != null ? author.Department : "";
      let investigationCenters = author.InvestigationCenters != null ? author.InvestigationCenters.join(" ; ") : "";

      htmlResume += "<tr>";
      htmlResume += "<td><a target='_blank' href='" + author.CienciaIULUrl + "'>" + author.Name + "</a></td>";
      htmlResume += "<td>" + author.School + "</td>";
      htmlResume += "<td>" + department + "</td>";
      htmlResume += "<td>" + investigationCenters + "</td>";
      htmlResume += "<td>" + grau + "</td>";
      htmlResume += "</tr>";
    });
    htmlResume += "</table>";

    //community naming && Scimago categories
    if(authorObj.communityId){

      let mergeCategories = new Array();
      let mergeCategoriesCounting = new Array();
      for(var i = 0; i < authorsIdInCommunity.length; i++){
        for(var j = 0; j < Graph.publications.length; j++){

          if(Graph.publications[j].Authors.indexOf(authorsIdInCommunity[i]) != -1){
            for(var k = 0; k < Graph.publications[j].ScimagoCategories.length; k++){
              let category = Graph.publications[j].ScimagoCategories[k];

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

      //get the 5 more representative
      let assignName = "";
      let totalNames = mergeCategories.length;
      for(let i = 0; i <= 4 && i < totalNames; i++){
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

      htmlResume = "<b>Community Name: </b>" + authorObj.communityName + "<br/>" +
                   "<b>Scimago Categories (5 more representative): </b>" + assignName + "<br/>" +
                   htmlResume;
    }

    document.getElementById('communityStats').innerHTML = htmlResume;

    var publicationsAuthor = new Array();
    var publicationsObjectsAuthor = new Array();
    coauthorshipsForAuthor.forEach(function(coauthorship) {
      for(var i = 0; i < coauthorship.Publications.length; i++){
        if(publicationsAuthor.indexOf(coauthorship.Publications[i]) == -1){
          publicationsAuthor.push(coauthorship.Publications[i]);

          for(var j = 0; j < Graph.publications.length; j++){
            if(Graph.publications[j].Id == coauthorship.Publications[i]){
              publicationsObjectsAuthor.push(Graph.publications[j]);
              break;
            }
          }
        }
      }
    });

    var GraphAuthor = {
      authors: authorsAuthor,
      publications: publicationsObjectsAuthor,
      coauthorships: coauthorshipsForAuthor
    };

    DrawGraph(GraphAuthor, false);
  };

  //supports Schools or Departments
function GetCoauthorshipsBySchools(graphData, mode){
  var schools = { };

  graphData.coauthorships.forEach(function(coauthorship) {

    let toSchool = null, fromSchool = null;
    for(let i = 0; i < graphData.authors.length; i++){
      if(coauthorship.GamaAuthorId == graphData.authors[i].Id){
        if(mode == "School")
          toSchool = graphData.authors[i].School;
        else
          toSchool = graphData.authors[i].Department;
      }
      if(coauthorship.BetaAuthorId == graphData.authors[i].Id){
        if(mode == "School")
          fromSchool = graphData.authors[i].School;
        else
          fromSchool = graphData.authors[i].Department;
      }
      if(fromSchool && toSchool){
        break;
      }
    }
	
	if(!toSchool || !fromSchool)
		return;
	
    if(schools[toSchool]){
      if(schools[toSchool][fromSchool]){
        schools[toSchool][fromSchool]++;
      } else {
        schools[toSchool][fromSchool] = 1;
      }
    } else {
      schools[toSchool] = { };
      schools[toSchool][fromSchool] = 1;
    }

  });

  let tableDimensions = [];
  let toSchools = Object.keys(schools);
  for(let i = 0; i < toSchools.length; i++){
    if(tableDimensions.indexOf(toSchools[i]) == -1)
      tableDimensions.push(toSchools[i]);

    let fromSchools = Object.keys(schools[toSchools[i]]);
    for(let j = 0; j < fromSchools.length; j++){
      if(tableDimensions.indexOf(fromSchools[j]) == -1)
        tableDimensions.push(fromSchools[j]);
    }
  }

  let html = "<table class='resultGrid'><tr><th></th>";
  for(let i = 0; i < tableDimensions.length; i++){
    html += "<td>" + tableDimensions[i].replace("School of", "").replace("Department of", "") + "</td>";
  }

  toSchools = Object.keys(schools);
  for(let i = 0; i < tableDimensions.length; i++){
    html += "<tr>";
    html += "<td>" + tableDimensions[i].replace("School of", "").replace("Department of", "") + "</td>";
	
	fromSchools = null;
	let schoolKey = null;
	for(let k = 0; k < toSchools.length; k++){
        if(tableDimensions[i] == toSchools[k]){
          fromSchools = Object.keys(schools[toSchools[k]]);
		  schoolKey = toSchools[k];
		  break;
        }
    }
	  
    for(let j = 0; j < tableDimensions.length; j++){
		  
		  if(!fromSchools){
			  html += "<td></td>";
			  continue;
		  }
		  
		  let tableLine = null;
		  
          for(let h = 0; h < fromSchools.length; h++){
            if(tableDimensions[j] == fromSchools[h]) {
              tableLine = "<td>" + schools[schoolKey][fromSchools[h]] + "</td>";
			  break;
			}
          }		  
		  
		  if(!tableLine)
			  tableLine = "<td></td>";
		  
		  html += tableLine;
    }

    html += "</tr>";
  }

  html += "</table>";

  return html;
};