var $ = require('jquery');
var fs = require('fs');
var exec = require('child_process').exec;
						
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
	
	/**
		Calls the Maui keyword extraction tool, loops over the resulting .key files and
		creates a graph linking the product that included the topic to the keyword in a file
		called /tmp/vis/keywords.rsf.
	*/
	saveKeywords = function() {
		console.log("Extracting keywords");
		
		/*
			The string that will hold the RSF data as it is built up
		*/
		var keywordsRsf = "";
		
		/**
			The function that saves the /tmp/vis/keywords.rsf file
		*/
		writeToFile = function() {
			fs.writeFile(
					"/tmp/vis/keywords.rsf", 
					keywordsRsf, 
					function(err) {
						if(err) {
							console.log(err);
						} else {
							console.log("The file /tmp/vis/keywords.rsf was saved!");
						}
					}
				);	
		};
		
		/*
			Call Maui to generate the key files
		*/
		exec(
			"java -cp \"/root/Maui1.2/lib/*:/root/Maui1.2/bin\" maui.main.MauiTopicExtractor -l /tmp/vis -m /root/Maui1.2/RedHat -f text", 
			function (error, stdout, stderr) 
			{ 
				console.log(stdout);						
				
				var filesProcessed = 0;
				
				/*
					Get all the files in the temp dir
				*/
				var filenames = fs.readdirSync("/tmp/vis/");
				console.log("Found " + filenames.length + " files");
				
				/*
					Loop over the files
				*/
				for (var filenamesIndex = 0, filenamesCount = filenames.length; filenamesIndex < filenamesCount; ++filenamesIndex) {

					var filename = filenames[filenamesIndex];									
					
					/*
						We are only interested in the .key files
					*/
					if (filename.length > 4 && filename.substr(filename.length - 4, 4) == ".key") {
						console.log("Processing " + filename);
						
						/*
							Filenames are in the format 12345.xml.key. Removing the last 8 characters
							gets the topic id.
						*/
						var topicId = filename.substr(0, filename.length - 8);
						
						if (extraData[topicId]) {		
							++filesProcessed;
							fs.readFile(
								"/tmp/vis/" + filename, 
								'utf8', 
								(function(myFilename) {
									return function(err, data) {
										if (!err) {											
											
											/*
												Keyword files include a keyword on each line
											*/
											var keywords = data.split("\n");
											
											/*
												Loop over ech keyword
											*/
											for (var keywordsIndex = 0, keywordsCount = keywords.length; keywordsIndex < keywordsCount; ++keywords) {													
												
												var keyword = keywords[keywordsIndex];
												
												/*
													Loop over each product
												*/
												for (var productsIndex = 0, productsCount = extraData[topicId].products.length; productsIndex < productsCount; ++productsIndex) {
													
													var product = extraData[topicId].products[productsIndex];
												
													if (keywordsRsf.length != 0) {
														keywordsRsf += "\n";
													}	
													
													/*
														Link the product to the keyword
													*/
													keywordsRsf += "KEYWORD \"" + product + "\ \"" + keyword + "\""; 
												}
											}
										} else {
											console.log(err);
										}
										
										/*
											If this was the last file to be read, create the rsf file
										*/
										--filesProcessed;
										if (filenamesIndex >= filenamesCount - 1 && filesProcessed <= 0) {
											writeToFile();			
										}
									}
								})("/tmp/vis/" + filename)
							);							
						}
					} 								
						
					/*
						Save the keywords if this is the last run through the loop and there are
						no file loads
					*/
					if (filenamesIndex >= filenamesCount - 1 && filesProcessed <= 0) {
						writeToFile();			
					}					
				}
			}
		);
	}
	
	$.ajax({
	  dataType: "json",
	  url: contentSpecQueryURL + encodeURIComponent(JSON.stringify(queryExpand)),
	  success: function(cspData) {
			var keywordSaveRequest = 0;
			var topicRequest = 0;
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
					
					++topicRequest;					
					$.ajax({
						dataType: "json",
						url: topicsInContentSpec.replace("#CSPID#", csp.item.id) + encodeURIComponent(JSON.stringify(queryExpand)),
						success: function(topicData) {
							--topicRequest;
							
							for (var topicIndex = 0, topicCount = topicData.items.length; topicIndex < topicCount; ++topicIndex) {
								var topic = topicData.items[topicIndex];
								
								/*
									Write out the topic's XML as text
								*/	
								++keywordSaveRequest;
								fs.writeFile(
										"/tmp/vis/" + topic.item.id + ".xml.txt", 
										topic.item.xml == null ? 
											"" : 
											topic.item.xml.replace(/<.*?>/g, " ").replace(/&.*?;/g, " "), 
										(function(saveTopic) {
											return function(err) {
												if (err) {
													console.log(err);
												}
												
												/*
													Only when we have processed the last content spec and saved
													every text file do we then create the keywords graph.
												*/
												--keywordSaveRequest;
												if (cspIndex >= cspCount && topicRequest <= 0 && keywordSaveRequest <= 0) {
													saveKeywords();
												}
											}
									})(topic)); 
								
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
					
					/*
						The loop has been exited, and there are no more plain text save requests,
						so generate the keywords.
					*/
					if (keywordSaveRequest <= 0 && topicRequest <= 0) {
						saveKeywords();
					}
					
					extraData.productFileNames = [];
					
					for (var product in productRsfData) {
						var fixedProduct = product.replace(/[^A-Za-z0-9]/g, "");
						
						extraData.productFileNames.push({product: product, filename: fixedProduct + ".rsf.lay"});
						
						fs.writeFile("/tmp/vis/product-" + fixedProduct + ".rsf", 
						productRsfData[product],
						(function(filename) { 
							return function(err) {
								if(err) {
									console.log(err);
								} else {
									console.log("The file /tmp/vis/product-" + filename + ".rsf was saved!");
								}
							}
						})(fixedProduct));
					}
			
					fs.writeFile("/tmp/vis/topics.rsf", rsfData, function(err) {
						if(err) {
							console.log(err);
						} else {
							console.log("The file /tmp/vis/topics.rsf was saved!");
						}
					}); 
					
					fs.writeFile("/tmp/vis/extradata.js", "extraData = " + JSON.stringify(extraData), function(err) {
						if(err) {
							console.log(err);
						} else {
							console.log("The file /tmp/vis/extradata.js was saved!");
						}
					});
					
										
				}
			}
			
			getCSPNodesLoop();
	  }
	});
}

getContentSpecs();