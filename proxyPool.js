let request = require('request'),
    cheerio = require('cheerio'),
    redis = require('redis'),
    async = require('async'),
    redisClient = redis.createClient();

let URLS  = require('./urls'),
    db = require('./db/db.js');

let checkedProxyList = [],
    crawlTimeInterVal,
    checkTimeInterVal;

logNumOfCurrentProxy();

function crawlProxy(callback){
  console.log('crawl proxy started.');
  redisClient.lrange('proxyList',0, -1, (err, oldProxyList) => {
    if(err) return;

    let options = URLS.proxyWebs.incloak(2000, 'h', null, 1, 1000);
    request.get(options, (err, response, result) => {
      if(err){
        console.log(err);
      }
      else if(response.statusCode == 200 && result){
        // console.log(result);
        let $ = cheerio.load(result);
        let newProxyList = [];
        $('table.proxy__t > tbody').children().each((index, e) => {
          let ipAddress = $(e).children('td').eq(0).html();
          let port = $(e).children('td').eq(1).html();
          let anonymity = $(e).children('td').eq(5).html();
          let lastUsedTime = 0;
          let exists = false;
          oldProxyList.forEach((ip) => {
            if(ip.split('|')[0] === `${ipAddress}:${port}`) exists = true;
          });
          if(!exists){
            let newProxy = `${ipAddress}:${port}|${anonymity}|${lastUsedTime}`;
            newProxyList.push(newProxy);
          }
        });

        let proxyList = oldProxyList.concat(newProxyList);
        proxyList.sort((a, b) => {
          return a.split('|')[3] > b.split('|')[3];
        });
        redisClient.del('proxyList');
        redisClient.lpush("proxyList", proxyList);

        console.log('Crawl proxy finished.');
        logNumOfCurrentProxy();
      }
      if(callback) callback();
    });
  });
}

function checkProxy(){
  console.log('Check proxy started.');
  db.buildConnectionToDb(() => {
    redisClient.lrange('proxyList',0, -1, (err, proxyList) => {
      let checkIpQueue = async.queue((proxy, checkIpQueueCallback) => {
        proxyRequest(proxy, checkIpQueueCallback);
      }, 200);

      checkIpQueue.drain = function(){
        db.closeConnectionToDb();
        //check完之后checkedProxyList的proxy顺序已经乱了，所以要重排下
        checkedProxyList = checkedProxyList.sort((a, b) => {
          return a.split('|')[3] > b.split('|')[3];
        });
        redisClient.del('proxyList');
        redisClient.lpush('proxyList', checkedProxyList);

        console.log('Check proxy finished.');
        logNumOfCurrentProxy();
      };

      proxyList.forEach((proxy) => {
        checkIpQueue.push(proxy);
      });
    });
  });
}

function proxyRequest(proxy, checkIpQueueCallback, errCount = 0){
  let {options, proxiedRequest} = URLS.user.infoWithProxy(undefined, proxy);
  proxiedRequest.post(options, (err) => {
    if(!err){
      checkedProxyList.push(proxy);
      checkIpQueueCallback();
    }
    else{
      errCount++;
      if(errCount < 2) proxyRequest(proxy, checkIpQueueCallback, errCount);
      else{
        db.createDisabledProxy({proxy}, () => {});
        checkIpQueueCallback();
      }
    }
  });
}

function startAutomaticRefresh(crawlInverval = 600*1000, checkInterval = 300*1000){
  crawlProxy(() => {
    checkProxy();
  });
  automaticCrawl(crawlInverval);
  automaticCheck(checkInterval);
}

function automaticCrawl(crawlInverval){
  setTimeout(() => {
    automaticCrawl(crawlInverval);
  },crawlInverval * (1/2 + Math.random() * 1/2));//每一次的抓取代理的间隔是随机的，以免被识别出是爬虫
}

function automaticCheck(checkInterval){
  setTimeout(() => {
    automaticCheck(checkInterval);
  },checkInterval * (1/2 + Math.random() * 1/2));
}


function logNumOfCurrentProxy(){
  redisClient.lrange('proxyList',0, -1, (err, proxyList) => {
    console.log(`Proxies left: ${proxyList.length}`);
  });
}


module.exports.checkProxy = checkProxy;
module.exports.crawlProxy = crawlProxy;
