var CommunityNaming = function() { };

CommunityNaming.prototype.Calculate = function(authors) {
  let commutiesAlreadyCalculated = new Array();
  let self = this;

	authors.forEach(function(author) {

		let communityInContext = author.communityId;

		if(commutiesAlreadyCalculated.indexOf(communityInContext) != -1)
			return;

		let mergeNamming = new Array();
    let mergeNammingCounting = new Array();
		for(let i = 0; i < authors.length; i++){

			if(authors[i].communityId != communityInContext)
				continue;

			let department = authors[i].Department != null ? authors[i].Department : "";
      department = department.replace("Department of", "");

      if(department){
        if(mergeNamming.indexOf(department) == -1){
          mergeNamming.push(department);
          mergeNammingCounting.push(1);
        }
        else {
          mergeNammingCounting[mergeNamming.indexOf(department)] += 1;
        }
      }

			if(authors[i].InvestigationCenters){
        authors[i].InvestigationCenters.forEach(function(ic) {

          let clean = ic.replace("BRU-IUL -", "");
          clean = clean.replace("DINÂMIA\'CET-IUL - Centre for ", "");
          clean = clean.replace("CIES-IUL - Centre for ", "");
          clean = clean.replace("ISTAR-IUL - ", "");
          clean = clean.replace("CEI-IUL - Center for", "");
          clean = clean.replace("CIS-IUL - Centre for", "");
          clean = clean.replace("Instituto de", "");
          clean = clean.replace("CRIA-IUL - Centre for", ""); 
          clean = clean.replace("- IUL", "");

          if(clean){
            if(mergeNamming.indexOf(clean) == -1){
              mergeNamming.push(clean);
              mergeNammingCounting.push(1);
            }
            else {
              mergeNammingCounting[mergeNamming.indexOf(clean)] += 1;
            }
          }
        });
      }
		}

    //get the 3 more representative
    let assignName = "";
    let totalNames = mergeNamming.length;
    for(let i = 0; i <= 2 && i < totalNames; i++){
      let biggerValue = -1;
      let biggerValueIndex = -1;

      for(let j = 0; j < mergeNamming.length; j++){
        if(mergeNammingCounting[j] > biggerValue){
          biggerValue = mergeNammingCounting[j];
          biggerValueIndex = j;
        }
      }

      assignName += mergeNamming[biggerValueIndex] + " & ";
      mergeNammingCounting.splice(biggerValueIndex, 1);
      mergeNamming.splice(biggerValueIndex, 1);
    }

	assignName = assignName.slice(0, assignName.lastIndexOf("&"));

		for(let i = 0; i < authors.length; i++){

			if(authors[i].communityId != communityInContext)
				continue;

			authors[i].communityName = assignName;
		}

		commutiesAlreadyCalculated.push(communityInContext);
	});

};

module.exports = CommunityNaming;
