var router = require('express').Router(),
    fs = require('fs'),
    request = require('request'),
    async = require('async'),
    path = require('path'),
    http = require('http');

var db = require('../db/db.js'),
    URLS = require('../urls.js'),
    crawler = require('../crawler.js'),
    proxyPool = require('../proxyPool');
var videoCrawlerQueue, userCrawlerQueue;

router.get('/crawl/vocaloidVideos', function(req, res, next){
  let errCount = 0,
      updatedCount = 0,
      addedCount = 0,
      requestCount = 0,
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
          console.log(err);
        }
        else if(result){
          db.dbObj.close();
          console.info('finished');
          // res.send('finished');
        }
      });
    };
    pageUrls.forEach((pageUrl) => queue.push(pageUrl));
  });
});

/*
*目前没有把错误信息内容记录到日志
*/
router.get('/crawl/videos/start', function(req, res){
  let tids = JSON.parse(fs.readFileSync(path.join(__dirname , '..', 'tids.json')));

  db.buildConnectionToDb(function(err){
    if(err) return res.send('Db connection err');
    videoCrawlerQueue = async.queue(crawler.videoInfoCrawler.bind(this), 1);

    videoCrawlerQueue.drain = function(){
      db.closeConnectionToDb();
      console.log(`Totally finished.`);
      // log +=`Totally finished.\n`;
      // fs.writeFile(path.join(__dirname , '..', 'crawlerLog'), log, function(err){
      //   console.log(err);
      // });
    };

    tids.forEach((t) => videoCrawlerQueue.push(t), (err) => {if(err) console.log('Err occurred in crawlerQueue.');});
    res.send('Crawler started.');
  });
});

router.get('/crawl/videos/pause', function(req, res){
  if(!videoCrawlerQueue.paused){
    videoCrawlerQueue.pause();
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

router.get('/crawl/videos/resume', function(req, res){
  if(videoCrawlerQueue.paused){
    videoCrawlerQueue.resume();
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

router.get('/crawl/videos/stop', function(req, res){
  if(!videoCrawlerQueue.idle){
    videoCrawlerQueue.resume();
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

router.get('/crawl/users/start', function(req, res){
  res.send('Crawler started.');
  db.buildConnectionToDb(function(err){
    let fromMid = parseInt(req.query.fromMid),
        workSize = parseInt(req.query.workSize),
  worksNum = parseInt(req.query.worksNum);
    if(err) return res.send('Db connection err');
    userCrawlerQueue = async.queue(crawler.userInfoCrawler.bind(this), 1);

    userCrawlerQueue.drain = function(){
      db.closeConnectionToDb();
      console.log(`Totally finished.`);
    };

    for(let startMid = fromMid; startMid <= fromMid + workSize*worksNum; startMid+=workSize){
      let work = {startMid, workSize};
      userCrawlerQueue.push(work);
    }
  });
});

/*
*扒一下b站tid有哪些值
*/
router.get('/crawl/tids', function(req, res){
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
});

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
        requestQueueCallback();
        if (err) return next(err);
        console.log(JSON.parse(result).data.list);
        fans = fans.concat(JSON.parse(result).data.list);
      });
    }, 10);

    requestQueue.drain = function(){
      fs.writeFile('../output.json', fans, (err) => {
        if(err) return console.error(err);
        res.send('finished');
      });
    };

    pageUrls.forEach((pageUrl) => requestQueue.push(pageUrl));
  });
});

router.get('/crawl/test', function(req, res){
  const targetUrl = "http://test.abuyun.com/proxy.php";
    //const targetUrl = "http://proxy.abuyun.com/switch-ip";
    //const targetUrl = "http://proxy.abuyun.com/current-ip";

    // 代理服务器
    const proxyHost = "proxy.abuyun.com";
    const proxyPort = 9010;

    // 代理隧道验证信息
    const proxyUser = "HS884DA80YAT8F4D";
    const proxyPass = "1F2FDD2E673C1F67";

    const proxyUrl = "http://" + proxyUser + ":" + proxyPass + "@" + proxyHost + ":" + proxyPort;

    const proxiedRequest = request.defaults({'proxy': proxyUrl});

    const options = {
      url     : targetUrl,
      headers : {
        "Proxy-Switch-Ip" : "yes"
      }
    };

    proxiedRequest
        .post(options, function (err, response, body) {
            console.log("got response: " + response.statusCode);
            res.send(body);
        })
        .on("error", function (err) {
            console.log(err);
        });
});

router.get('/crawl/test2', function(req, res){
    //const targetUrl = "http://proxy.abuyun.com/switch-ip";
    //const targetUrl = "http://proxy.abuyun.com/current-ip";

    // 代理服务器
    const proxyHost = "proxy.abuyun.com";
    const proxyPort = 9010;

    // 代理隧道验证信息
    const proxyUser = "HS884DA80YAT8F4D";
    const proxyPass = "1F2FDD2E673C1F67";

    const proxyUrl = "http://" + proxyUser + ":" + proxyPass + "@" + proxyHost + ":" + proxyPort;

    const proxiedRequest = request.defaults({'proxy': proxyUrl});

    const options = {
      url     : 'http://space.bilibili.com/ajax/member/GetInfo',
      headers : {
        "Proxy-Switch-Ip" : "yes",
        'Referer': 'http://space.bilibili.com/873981/'
      },
      form: {
        mid: 873982,
        _:new Date().getTime()
      },
    };

    proxiedRequest.post(options, (err, response, result) => {
      res.send(JSON.parse(result));
    });

});

router.get('/crawl/test3', function(req, res){
    res.send("");

  // var body = {
  //       mid: '873982',
  //       _:new Date().getTime()
  //     };
  // var opt = {
  //   host:'5.189.152.50',
  //   port:'3128',
  //   method:'POST',//这里是发送的方法
  //   path:'http://space.bilibili.com/ajax/member/GetInfo',//这里是访问的路径
  //   headers:{
  //     Referer:'http://space.bilibili.com/10/',
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //   'Content-Length': Buffer.byteLength(body),
  //   },

  // };
  // console.log(1);
  // var httpRequest = http.request(opt, function(response) {
  //   console.log("Got response: " + response.statusCode);
  //   response.on('data',function(body){
  //           console.log(body);

  //   }).on('end', function(){
  //     console.log(response.headers);
  //     console.log(body);
  //   });
  // });
  //         console.log(3);

  // httpRequest.on('error', function(e) {
  //   console.log("Got error: " + e.message);
  // });
  //         console.log(4);
  // httpRequest.write();
  //       console.log(5);
  // httpRequest.end();

  let proxyIp = '185.128.36.10';
  let proxyPort = '8080';
  const proxiedRequest = request.defaults({'proxy': `http://${proxyIp}:${proxyPort}`});

  const options = {
    url     : 'http://space.bilibili.com/ajax/member/GetInfo',
    headers : {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'http://space.bilibili.com/873981/',
        'Origin': 'http://space.bilibili.com',
        'Host': 'space.bilibili.com',
        'AlexaToolbar-ALX_NS_PH': 'AlexaToolbar/alx-4.0',
        'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6,ja;q=0.4',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Real-IP': proxyIp,
        'X-Forwarded-For': proxyIp
    },
    form: {
      mid: 13,
      _:new Date().getTime()
    },
    timeout: 5000
  };

  proxiedRequest.post(options, (err, response, result) => {
    if(err){
      console.log(err);
      return;
    }
    console.log(response.statusCode);
    console.log(result);
  });
});

router.get('/proxyIpPool/crawlProxy', (req, res) => {
  proxyPool.crawlProxy();
  res.send('Started');
});

router.get('/proxyIpPool/checkProxy', (req, res) => {
  proxyPool.checkProxy();
  res.send('Started');
});

exports = module.exports = router;
