var CoAuthorship = function() {
	this.Id = null;
  this.BetaAuthorId = null;
  this.GamaAuthorId = null;
  this.Attractiveness = null;
	this.CreationDate = null;
	this.Publications = new Array();

	this.communityJobId = null;
};

CoAuthorship.prototype.GetId = function () {
  return this.Id;
}

module.exports = CoAuthorship;
