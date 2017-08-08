var Author = function() {
	this.Id = null;
	this.IdCienciaIUL = null;
	this.Name = null;
	this.School = null;
	this.Department = null;
	this.InvestigationCenters = new Array();
	this.CienciaIULUrl = null;
	this.CreationDate = null;

	this.communityJobId = null;
	this.communityId = null;
	this.communityName = null;
};

Author.prototype.GetId = function () {
  return this.Id;
};

module.exports = Author;
