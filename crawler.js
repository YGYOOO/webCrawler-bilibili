var db = require('./db/db.js'),
    URLS = require('./urls.js');
var fs = require('fs'),
    request = require('request'),
    async = require('async'),
    path = require('path');
var requestErrCount;

var errCount = 0,
    updatedCount = 0,
    addedCount = 0,
    requestCount = 0,
    startTime = new Date(),
    fromPage = 1,
    toPage,
    tid,
    tname;
var log = '';

module.exports.videosCrawler = function(t, crawlerQueueCallback){
  errCount = 0;
  updatedCount = 0;
  addedCount = 0;
  requestCount = 0;
  startTime = new Date();
  fromPage = 1;
  toPage;
  tid = t.tid;
  tname = t.tname;
  log = '';
  let pageUrls = [];

  console.log(`Started. startTime: ${startTime}`);
  log += `Started. startTime: ${startTime}\n`;
  request.get(URLS.video.info({tid: tid, pn: 1}), function(err, status, result){
    //获取总页数
    if(err){
      let errInfo = 'An err occurred while requesting page number.\n'
      console.log(errInfo);
      console.log(err);
      log += errInfo;
      return;
    }

    let resultObj;
    try{
      resultObj = JSON.parse(result);
    }
    catch(e){
      let errInfo = 'An err occurred while parsing json\n\n' + result + '\n';
      console.log(errInfo);
      log += errInfo;
      return;
    }
    toPage = Math.ceil(resultObj.data.page.count / resultObj.data.page.size);

    for(var i = fromPage ; i <= toPage ; i++){
      let url = URLS.video.info({tid: tid, pn: i});
      pageUrls.push(url);
    }

    if(pageUrls.length < 1){
      console.log('err: pageUrls is empty!');
      return;
    };

    let queue = async.queue(requestVideoInfo.bind(this), 20);//并发数量限制为5

    queue.drain = function(){
      let timeCost = (new Date() - startTime)/1000 + 's';
      let dbLog = {startTime, tid, tname, requestCount, errCount, updatedCount, addedCount, fromPage, toPage, timeCost};
      db.createCrawlerLog(dbLog, function(err, result){
        if(err){
          let errInfo = 'An err occurred while adding crawler log to db.\n'
          console.log(errInfo);
          console.log(err);
          log += errInfo;
          return;
        }
        else if(result){
          let logInfo = `Finished. tid: ${tid}, tname: ${tname}, startTime: ${startTime}, timeCost: ${timeCost}\n\n` +
                      `==================================================================================\n\n`;
          console.log(logInfo);
          log += logInfo;
          fs.appendFile(path.join(__dirname , 'crawlerLog'), log, function(err){
            if(err){
              console.log('An err occurred while writing crawler log to file.');
              console.log(err);
            }
          });
        }
        else{

        }
        crawlerQueueCallback();
      });
    };
    pageUrls.forEach((pageUrl) => queue.push(pageUrl, (err) => {if(err) console.log('Err occurred in queue.')}));
  });
}

function requestVideoInfo(pageUrl, queueCallback){
  request.get(pageUrl, function(err, status, result){
    if (err){
      let errInfo = 'An err occurred while requesting page.\n'
      console.log(errInfo);
      console.log(err);
      log += errInfo;
      return;
    }

    let archives;
    try{
      archives = JSON.parse(result).data.archives;
    }
    catch(e){
      let errInfo = `An err occurred while parsing json\npageUrl:${pageUrl}\n\n` + result + `\n\n`;
      console.log(errInfo);
      log += errInfo;
      requestErrCount++;
      if(requestErrCount < 5) requestVideoInfo(pageUrl, queueCallback);
      return;
    }

    let createVocaloidVideoCount = 0;
    let dbQueue = async.queue((archive, dbQueueCallback) => {
      db.createVideo(archive, function(err, added, updated){
        if(err){
          let errInfo = 'An err occurred while adding video info into db.';
          console.err(errInfo);
          console.log(err);
          log += errInfo;
          errCount++;
        }
        else if(updated){
          updatedCount++;
        }
        else if(result){
          addedCount++;
        }
        else{
          errCount++;
        }
        dbQueueCallback();
      });
    }, 10);

    dbQueue.drain = function() {
      requestCount++;
      console.info(`${requestCount}st request finished.`);
      console.info(`added: ${addedCount}, updated: ${updatedCount}, err: ${errCount}`);
      log += `${requestCount}st request finished.\n` +
             `added: ${addedCount}, updated: ${updatedCount}, err: ${errCount}\n`;
      requestErrCount = 0;
    };

    for(var key in archives){
      dbQueue.push(archives[key] , (err) => {if(err) console.log('Err occurred in dbQueue.')});
    }

    queueCallback();
  });
}
