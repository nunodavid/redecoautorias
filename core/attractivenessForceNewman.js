var math = require('mathjs');

var AttractivenessForceNewman = function() { };

AttractivenessForceNewman.prototype.Calculate = function(coauthorshipPublications, publications) {
	var self = this;
	var totalForce = 0;
	var emptyPublicationType = 0;
	
	coauthorshipPublications.forEach(function(publicationId) {
    var publicationObject = null;

    for(var j = 0; j < publications.length; j++){
      if(publications[j].Id == publicationId){
        publicationObject = publications[j];
      }
    }

    if(publicationObject != null){
	  if(publicationObject.PublicationType){
		  
		let weight = self.PublicationTypeWeight(publicationObject.PublicationType);

		totalForce += ((1 / (publicationObject.Authors.length - 1)) * weight);
	  } else {
		emptyPublicationType++;  
	  }
	  
    } else {
	  console.log("AttractivenessForceNewman - Could not find publication with Id: " + publicationId);	
	}
  });
  
  if(emptyPublicationType != 0)
	 console.log("AttractivenessForceNewman - Number of Publications with empty Type: " + emptyPublicationType); 

  return math.ceil(totalForce);
};

AttractivenessForceNewman.prototype.PublicationTypeWeight = function(publicationType) {

  switch (publicationType) {
    case 'label.type.journal_paper': return 1;
    case 'label.type.book': return 1;
    case 'label.type.book_editor': return 1;
    case 'label.type.architecture': return 1;
    case 'label.type.book_chapter': return 1;
    case 'label.type.conference_paper': return 1;
    case 'label.type.conference_editor': return 1;
    case 'label.type.preface': return 1;
    case 'label.type.working_paper': return 1;
    case 'label.type.non_reviewed_paper': return 0;
    case 'label.type.general_report.international': return 0;
    case 'label.type.local_report.international': return 0;
    case 'label.type.anual_report.national': return 0;
    case 'label.type.final_report.international': return 0;
    case 'label.type.final_report.national': return 0;
    case 'label.type.scholar_report': return 0;
    case 'label.type.architecture2': return 0;
    case 'label.type.recension': return 1;
    case 'label.type.talk': return 0;

    default: console.log("AttractivenessForceNewman - Could not recognize Publication Type: " + publicationType);
          return 0;
  }
};

module.exports = AttractivenessForceNewman;
