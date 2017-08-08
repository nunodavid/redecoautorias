function ExportToGexf(graphData){

	let gexf = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
			gexf +=	"<gexf xmlns=\"http://www.gexf.net/1.3draft\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.gexf.net/1.3draft http://www.gexf.net/1.3draft/gexf.xsd\" version=\"1.3\">";

	gexf += "<graph defaultedgetype=\"undirected\">";

	gexf += "<attributes class=\"node\"><attribute id=\"0\" title=\"cienciaIULUrl\" type=\"string\"/></attributes>";

	gexf += "<nodes>";
	graphData.authors.forEach(function(author) {
		gexf += "<node id=\"" + author.Id + "\" label=\"" + author.Name + "\"><attvalues><attvalue for=\"0\" value=\"" + author.CienciaIULUrl + "\"/></attvalues></node>";
	});
	gexf += "</nodes>";

	gexf += "<edges>";
	graphData.coauthorships.forEach(function(coauthorship) {
		gexf += "<edge id=\"" + coauthorship.Id  + "\" source=\"" + coauthorship.BetaAuthorId + "\" target=\"" + coauthorship.GamaAuthorId + "\" weight=\"" + coauthorship.Attractiveness + "\" />";
	});
	gexf += "</edges>";

	gexf += "</graph>";
	gexf += "</gexf>";

	return gexf;
}
