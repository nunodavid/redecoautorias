var Configurations = function() {
	this.HTTPServerPort = 8080;
	this.OnlyInternalAuthors = true;
	this.APITimeout = 5000;
	this.MinimumCommunitySize = 4;
	this.CienciaIULHost = "ciencia.iscte-iul.pt";
	this.CienciaIULAuthorEndpoint = "/api/author/";
	this.CienciaIULDepartmentsEndpoint = "/api/department/";
	this.CienciaIULDepartmentsEndpoints = ["DA", "DAU", "DCPPP", "DCTI", "DC", "DE", "DEP", "DF", "DH", "DMOG", "DM", "DMPS", "DMQGE", "DPSO", "DRHCO", "DS"];
	this.CienciaIULInvestigationCenterEndpoint = "/api/centre/";
	this.CienciaIULInvestigationCenterEndpoints = ["CEI-IUL","CIES","CIS","CRIA","DINAMIA","IT-IUL","ISTAR-IUL","UNIDE"];
	this.MongoDBEndpoint = "mongodb://localhost:27017/redecoautorias";
	this.googleId = "";
	this.googleSecret = "";
	this.googleCallbackURL = "http://localhost:8080/auth/google/callback";
	this.cookieSecret = "";
	this.AdminUsersEmails = [""];
	this.ciencieIULsjrCategories = "/../private/bi_ciencia_iul_export_all_journal_sjr_categories.xml";
	this.ciencieIULsjrInfos = "/../private/bi_ciencia_iul_export_all_journal_sjr_infos.xml";
};

module.exports = Configurations;
