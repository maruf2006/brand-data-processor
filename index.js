const kinesis = require('./Kinesis');
const cheerio = require('cheerio');
const axios = require('axios');

exports.handler = async (event, context, callback) => {
  console.log('LOADING handler ...');
  // Url fetch to start crawling ....
  const obj =  JSON.parse(JSON.stringify(event));
  console.log('Event Before Saving:', JSON.parse(JSON.stringify(event)));
  var crawlUrl =obj.url;
  console.log('Crawling Url :', crawlUrl);
   const foundURLs = []; // Discovered URLs from the page
   const imagePhash = []; // Phash for each image.
  // crawl start
        //var crawlUrl = 'https://reqres.in/api/users';
        //var crawlUrl = 'https://www.ebay.fr/itm/Olay-Regenerist-Avance-Anti-age-Regenerant-Journalier-Serum-50ml-/173945323086';
        //var crawlUrl = "https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3";
        await axios.get(crawlUrl).then(resp => {
          console.log('resp data');
          console.log(resp.data);
          var responseData=resp;
         
          console.log('crawl started: ... ', crawlUrl)
          const $ = cheerio.load(responseData.data, {
              withDomLvl1: true,
              normalizeWhitespace: false,
              xmlMode: false,
              decodeEntities: false
          });
  
  // Iterate through all hrefs on the crawled page
  let src = $('a').find('img').attr('src');
  console.log(src);
  $('a').each((i, link) => {
    const linkUrl = $(link).find('img').attr('src');
    if(linkUrl){
      foundURLs.push('https:'+linkUrl);
    }
  });
   console.log('Image Urls: >>');
   console.log(foundURLs);
        }, (error) => {
        console.log(error);
    });
      
    
    for (const imageUrl of foundURLs) {
      await axios.get('https://0v23u760t6.execute-api.us-east-1.amazonaws.com/test/persons?url='+imageUrl).then(resp => {console.log('Image Phash >>');
          imagePhash.push(resp.data);
      },
        (error) => {
        console.log(error);
      });
  }


  kinesis.save1(JSON.stringify(imagePhash)); // here we send it to the stream
  const done = (err, res) => callback(null, {
    statusCode: err ? '400' : '200',
    headers: {
      'Content-Type': 'application/json',
    },
    "body": imagePhash,
    "isBase64Encoded": false
  });
  
  console.log(imagePhash);
  done(null, event);
 
}