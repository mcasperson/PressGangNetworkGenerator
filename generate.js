var $ = require('jquery');
var fs = require('fs');
						
finished = function(data) {
	console.log(JSON.stringify(data));
}		

getContentSpecs = function() {
	var contentSpecQueryURL = "http://skynet.usersys.redhat.com:8080/pressgang-ccms/rest/1/topics/get/json/query;tag268=1;logic=And?expand=";
	var topicsInContentSpec = "http://skynet.usersys.redhat.com:8080/pressgang-ccms/rest/1/topics/get/json/query;topicIncludedInSpec=#CSPID#;logic=And?expand="
	
	var queryExpand = {
		"branches":[
			{
				"trunk":{
					"name": "topics"
				}
			}
		]
	};
	
	var rsfData = "";
	var productRsfData = {};
	var extraData = {};
	extraData.products = [];
	
	var productRe = /Product\s*=\s*(.*?)\s*$/;
	var versionRe = /Version\s*=\s*(.*?)\s*$/;
	var titleRe = /Title\s*=\s*(.*?)\s*$/;
	
	console.log("Getting content spec IDs");
	
	$.ajax({
	  dataType: "json",
	  url: contentSpecQueryURL + encodeURIComponent(JSON.stringify(queryExpand)),
	  success: function(cspData) {
		var cspIndex = 0;
		var cspCount = cspData.items.length;
		getCSPNodesLoop = function () {
			if (cspIndex < cspCount) {							
				var csp = cspData.items[cspIndex];
				
				console.log("Processing content spec ID " + csp.item.id + ". " + (cspIndex/cspCount*100).toFixed(2) + "%");
				
				var cspLines = csp.item.xml.split("\n");
				
				var product = "", version = "", title = "";
				
				for (var linesIndex = 0, linesCount = cspLines.length; linesIndex < linesCount; ++linesIndex) {				  			
					var productMatch = cspLines[linesIndex].match(productRe);
					var versionMatch = cspLines[linesIndex].match(versionRe);
					var titleMatch = cspLines[linesIndex].match(titleRe);
					
					if (productMatch != null) product = productMatch[1].trim();
					if (versionMatch != null) version = versionMatch[1].trim();
					if (titleMatch != null) title = titleMatch[1].trim();
				}							
				
				var productAndVersion = (product + " " + version).trim();
				if (productAndVersion.length == 0) {
					productAndVersion = "[UNDEFINED]";
				}
				
				var productVersionAndTitle = (product + " " + version + " " + title).trim();
				if (productVersionAndTitle.length == 0) {
					productVersionAndTitle = "[UNDEFINED]";
				}
				
				var found = false;
				for (var productsIndex = 0, productsCount = extraData.products.length; productsIndex < productsCount; ++productsIndex) {
					if (extraData.products[productsIndex] == productAndVersion) {
						found = true;
						break;
					}
				}
				if (!found) {
					extraData.products.push(productAndVersion);
				}
				
				++cspIndex;
				
				$.ajax({
				  dataType: "json",
				  url: topicsInContentSpec.replace("#CSPID#", csp.item.id) + encodeURIComponent(JSON.stringify(queryExpand)),
				  success: function(topicData) {
					for (var topicIndex = 0, topicCount = topicData.items.length; topicIndex < topicCount; ++topicIndex) {
						var topic = topicData.items[topicIndex];
						
						if (!extraData[topic.item.id]) {
							extraData[topic.item.id] = {products: [productAndVersion], productVersionAndTitles: [productVersionAndTitle]};
						} else {
							var found = false;
							for (var productsIndex = 0, productsCount = extraData[topic.item.id].products.length; productsIndex < productsCount; ++productsIndex) {
								if (extraData[topic.item.id].products[productsIndex] == productAndVersion) {
									found = true;
									break;
								}
							}
							
							if (!found) {
								extraData[topic.item.id].products.push(productAndVersion);								
							}
							
							var found = false;
							for (var productsIndex = 0, productsCount = extraData[topic.item.id].productVersionAndTitles.length; productsIndex < productsCount; ++productsIndex) {
								if (extraData[topic.item.id].productVersionAndTitles[productsIndex] == productVersionAndTitle) {
									found = true;
									break;
								}
							}
							
							if (!found) {
								extraData[topic.item.id].productVersionAndTitles.push(productVersionAndTitle);								
							}
						}
						
						if (rsfData.length != 0) {
							rsfData += "\n";
						}
						
						rsfData += "PRODVER \"" + productAndVersion + "\" " + topic.item.id;
						
						if (!productRsfData[product]) {
							productRsfData[product] = "";
						} else {
							productRsfData[product] += "\n";
						}						
						
						productRsfData[product] += "PRODVERTITLE \"" + productVersionAndTitle + "\" " + topic.item.id;
					}
					
					getCSPNodesLoop();	
				  }
				});
			} else {
				
				extraData.productFileNames = [];
				
				for (var product in productRsfData) {
					var fixedProduct = product.replace(/[^A-Za-z0-9]/g, "");
					
					extraData.productFileNames.push({product: product, filename: fixedProduct + ".rsf.lay"});
					
					fs.writeFile("/tmp/product-" + fixedProduct + ".rsf", 
					productRsfData[product],
					(function(filename) { 
						return function(err) {
							if(err) {
								console.log(err);
							} else {
								console.log("The file /tmp/product-" + filename + ".rsf was saved!");
							}
						}
					})(fixedProduct));
				}
		
				fs.writeFile("/tmp/topics.rsf", rsfData, function(err) {
					if(err) {
						console.log(err);
					} else {
						console.log("The file /tmp/topics.rsf was saved!");
					}
				}); 
				
				fs.writeFile("/tmp/extradata.js", "extraData = " + JSON.stringify(extraData), function(err) {
					if(err) {
						console.log(err);
					} else {
						console.log("The file /tmp/extradata.js was saved!");
					}
				});
			}
		}
		
		getCSPNodesLoop();
	  }
	});
}

getContentSpecs();