require('/tmp/vis/extradata.js');
var fs = require('fs');

console.log("Extracting keywords");
		
/*
	The string that will hold the RSF data as it is built up
*/
var keywordsRsf = "";
	
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
		
		if (extraData.topics[topicId]) {		
			var data = fs.readFileSync("/tmp/vis/" + filename, 'utf8'); 

			/*
				Keyword files include a keyword on each line
			*/
			var keywords = data.split("\n");
			
			/*
				Loop over each keyword
			*/
			for (var keywordsIndex = 0, keywordsCount = keywords.length; keywordsIndex < keywordsCount; ++keywordsIndex) {													
				
				var keyword = keywords[keywordsIndex];
				
				/*
					Loop over each product
				*/
				for (var productsIndex = 0, productsCount = extraData.topics[topicId].products.length; productsIndex < productsCount; ++productsIndex) {
					
					var product = extraData.topics[topicId].products[productsIndex];
				
					if (!extraData.keywords[keyword]) {
						extraData.keywords[keyword] = {products: [product]};
					} else {
						var found = false;
						for (var topicProductsIndex = 0, topicProductsCount = extraData.keywords[keyword].products.length; topicProductsIndex < topicProductsCount; ++topicProductsIndex) {
							if (extraData.keywords[keyword].products[topicProductsIndex] == product) {
								found = true;
								break;
							}
						}
						
						if (!found) {
							extraData.keywords[keyword].products.push(product);								
						}
					}
				
					if (keywordsRsf.length != 0) {
						keywordsRsf += "\n";
					}	
					
					/*
						Link the product to the keyword
					*/
					keywordsRsf += "KEYWORD \"" + product + "\" \"" + keyword + "\""; 
				}
			}							
		}
	} 											
}

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

fs.writeFile("/tmp/vis/extradata.js", "extraData = " + JSON.stringify(extraData), function(err) {
	if(err) {
		console.log(err);
	} else {
		console.log("The file /tmp/vis/extradata.js was saved!");
	}
});	

