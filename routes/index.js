var router = require('express').Router();
    fs = require('fs'),
    request = require('request'),
    cheerio = require('cheerio'),
    async = require('async'),
    path = require('path');

var db = require('../db/db.js'),
    URLS = require('../urls.js'),
    crawler = require('../crawler.js');
var crawlerQueue;
/*
*目前没有把错误信息内容记录到日志
*/
router.get('/crawl/vocaloidVideos', function(req, res, next){
  let errCount = 0,
      updatedCount = 0,
      addedCount = 0,
      requestCount = 0;
      date = new Date(),
      fromPage = 1,
      toPage = 0,
      type = 'vocaloidVideos';
  let pageUrls = [];
  res.send('Crawler started.');

  db.buildConnectionToDb();

  request.get(URLS.video.info({tid: 30, pn: 1}), function(err, status, result){
    if(err) return next(err);

    let resultObj = JSON.parse(result);
    toPage = Math.ceil(resultObj.data.page.count / resultObj.data.page.size);

    for(var i = fromPage ; i <= toPage ; i++){
      let url = URLS.video.info({tid: 30, pn: i});
      pageUrls.push(url);
    }

    // if(pageUrls.length < 1) return res.send('err');

    let queue = async.queue((pageUrl, queueCallback) => {
      requestCount++;
      console.info(`${requestCount}st request finished.`);
      console.info(`added: ${addedCount}, updated: ${updatedCount}, err: ${errCount}`);
      request.get(pageUrl, function(err, status, result){
        if (err) return next(err);

        let archives = JSON.parse(result).data.archives;
        let createVocaloidVideoCount = 0;
        let dbQueue = async.queue((archive, dbQueueCallback) => {
          db.createVocaloidVideo(archive, function(err, added, updated){
            if(err){
              console.err('An err occurred while creating vcaloidVideo.');
              console.log(err);
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
          queueCallback();
        };
        for(var key in archives){
          dbQueue.push(archives[key]);
        }
      });
    }, 5);//并发数量限制为5

    queue.drain = function(){
      let timeCost = (new Date() - date)/1000 + 's';
      let log = {date, type, requestCount, errCount, updatedCount, addedCount, fromPage, toPage, timeCost};
      db.createCrawlerLog(log, function(err, result){
        if(err){

        }
        else if(result){
          db.dbObj.close();
          console.info('finished');
          // res.send('finished');
        }
        else{

        }
      });
    };
    pageUrls.forEach((pageUrl) => queue.push(pageUrl));
  });
})

/*
*目前没有把错误信息内容记录到日志
*/
router.get('/crawl/videos/start', function(req, res, next){
  let tids = JSON.parse(fs.readFileSync(path.join(__dirname , '..', 'tids.json')));

  db.buildConnectionToDb(function(err){
    if(err) return res.send('Db connection err');
    crawlerQueue = async.queue(crawler.videosCrawler.bind(this), 1);

    crawlerQueue.drain = function(){
      db.closeConnectionToDb();
      console.log(`Totally finished.\n`);
      // log +=`Totally finished.\n`;
      // fs.writeFile(path.join(__dirname , '..', 'crawlerLog'), log, function(err){
      //   console.log(err);
      // });
    }

    tids.forEach((t) => crawlerQueue.push(t), (err) => {if(err) console.log('Err occurred in crawlerQueue.')});
    res.send('Crawler started.');
  });
});

router.get('/crawl/videos/pause', function(req, res, next){
  if(!crawlerQueue.paused){
    crawlerQueue.pause();
    let info = 'Request of pausing has been successfully performanced, the crawler will be paused after finishing current task';
    console.log(info);
    return res.send(info);
  }
  else{
    let info = 'Crawler has already been paused';
    console.log(info);
    return res.send(info);
  }
});

router.get('/crawl/videos/resume', function(req, res, next){
  if(crawlerQueue.paused){
    crawlerQueue.resume();
    let info = 'Request of resuming has been successfully performanced';
    console.log(info);
    return res.send(info);
  }
  else{
    let info = 'Crawler has already been running';
    console.log(info);
    return res.send(info);
  }
});

router.get('/crawl/videos/stop', function(req, res, next){
  if(!crawlerQueue.idle){
    crawlerQueue.resume();
    let info = 'Request of stopping has been successfully performanced, the crawler will be stopped after finishing current task';
    console.log(info);
    return res.send(info);
  }
  else{
    let info = 'Crawler has already been stopped';
    console.log(info);
    return res.send(info);
  }
});

/*
*扒一下b站tid有哪些值
*/
router.get('/crawl/test', function(req, res, next){
  let pageUrls = [];
  // res.send('started');
  let tids = [];

  for(var i = 150 ; i <= 300 ; i++){
    let url = URLS.video.info({tid: i, pn: 1});
    pageUrls.push(url);
  }

  if(pageUrls.length < 1) return;

  let queue = async.queue((pageUrl, queueCallback) => {
    request.get(pageUrl, function(err, status, result){
      let r = JSON.parse(result);
      if(Object.keys(r.data).length === 0){
        queueCallback();
        return;
      }
      let tid = r.data.archives[0].tid;
      let tname = r.data.archives[0].tname;

      let tidExists = false;
      tids.forEach((t) => {
        if(t.tid === tid) tidExists = true;
      });
      if(!tidExists) tids.push({tid, tname});
      // console.log(`tid: ${tid}, tname: '${tname}'`);
      queueCallback();
    });
  }, 20);

  queue.drain = function(){
    tids.sort((t1, t2) => {
      return t1.tid - t2.tid;
    });
    res.send(tids);
    console.log('finished');
  };
  pageUrls.forEach((pageUrl) => queue.push(pageUrl));
})

router.get('/crawl/users/:mid/fans', function(req, res, next){
  let fans = [];
  let url = URLS.user.fans({mid: req.params.mid, page: 1});
  request.get(url, (err, status, result) => {
    if(err) return next(err);

    let pages = JSON.parse(result).data.pages;
    let pageUrls = [];
    for(var i = 1 ; i <= pages ; i++){
      let url = URLS.user.fans({mid: req.params.mid, page: i});
      pageUrls.push(url);
    }

    let requestQueue = async.queue((pageUrls, requestQueueCallback) => {
      request.get(pageUrls, (err, status, result) => {
        if (err) return next(err);
        console.log(JSON.parse(result).data.list);
        fans = fans.concat(JSON.parse(result).data.list);
      });
    }, 10);

    requestQueue.drain = function(){
      fs.writeFile('../output.json', fans, (err) => {
        if(err) return console.error(err);
        res.send(finished);
      });
    };

    pageUrls.forEach((pageUrl) => requestQueue.push(pageUrl));
  });
});

exports = module.exports = router;
