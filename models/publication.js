var Publication = function() {
	this.Id = null;
  this.IdCienciaIUL = null;
  this.Title = null;
  this.Year = null;
	this.CienciaIULUrl = null;
	this.CreationDate = null;
	this.PublicationType = null;
	this.Issn_print = null;
	this.Issn_online = null;
	this.ScimagoCategories = new Array();
	this.Authors = new Array();

	this.communityJobId = null;
};

Publication.prototype.GetId = function () {
  return this.Id;
}

module.exports = Publication;
