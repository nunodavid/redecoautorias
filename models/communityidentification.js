var CommunityIdentification = function() {
	this.Id = null;
	this.AlgorithmName = null;
	this.CreationDate = null;
};

CommunityIdentification.prototype.GetId = function () {
  return this.Id;
}

module.exports = CommunityIdentification;
