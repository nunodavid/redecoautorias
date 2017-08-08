var select = require('xpath.js');
var dom = require('xmldom').DOMParser;
var Configs = require('./configurations');

var PublicationCategories = function() {
  let configs = new Configs();

  var self = this;
  self.categories = new Array();
  self.publications = new Array();

  var getPublications = function(){
    require('fs').readFile(__dirname + configs.ciencieIULsjrInfos, 'utf8', function (err,data) {
        if (err) {
          return console.log("PublicationCategories: " + err);
        }

        data = data.replace("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>", "");
        data = data.replace("<journalSJRInfos>", "");
        data = data.replace("</journalSJRInfos>", "");

        var publications = data.split("<journalSJRInfo>");

        for(var k = 1; k < publications.length; k++){

              var data = "<journalSJRInfo>" + publications[k];

              var xml = new dom().parseFromString(data);

              let issn = select(xml, "//issn")[0].firstChild.data;
              let categoriesID = select(xml, "//yearDatas/yearData/rankings/ranking/categoryID");

              let categories = new Array();
              for(var j = 0; j < categoriesID.length; j++){
                let category = categoriesID[j].firstChild.data;

                if(categories.indexOf(category) == -1){
                  categories.push(category);
                }
               }

              let categoriesNames = new Array();
              for(var j = 0; j < categories.length; j++){
                for(var i = 0; i < self.categories.length; i++){
                  if(self.categories[i].id == categories[j]){
                    categoriesNames.push(self.categories[i].title);
                    break;
                  }
                 }
               }

              self.publications.push({ issn: issn, categories: categoriesNames});
        }
     });
  };

  require('fs').readFile(__dirname + configs.ciencieIULsjrCategories, 'utf8', function (err,data) {
      if (err) {
        return console.log("PublicationCategories: " + err);
      }

      var xml = new dom().parseFromString(data);
      var nodes = select(xml, "//journalSJRCategory");

      for(var i = 0; i < nodes.length; i++){
        let id = select(nodes[i], "categoryID")[0];
        let title = select(nodes[i], "categoryTitle")[0];

        self.categories.push({ id: id.firstChild.data, title: title.firstChild.data});
    	}

      getPublications();
   });
};

PublicationCategories.prototype.Get = function(issn_print, issn_online) {

  if((issn_print && issn_print != "") || (issn_online && issn_online != "")){
    for(var k = 0; k < this.publications.length; k++){
      if(this.publications[k].issn.indexOf(issn_print) != -1 || this.publications[k].issn.indexOf(issn_online) != -1)
        return this.publications[k].categories;
    };
  }

  return new Array();
};

module.exports = PublicationCategories;
