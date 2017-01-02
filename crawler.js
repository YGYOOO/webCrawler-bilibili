var db = require('./db/db.js'),
    URLS = require('./urls.js');
var fs = require('fs'),
    request = require('request'),
    async = require('async'),
    path = require('path');
var requestErrCount;
// let requestErrCounters = [
//   {used: false, count: 0},
//   {used: false, count: 0},
//   {used: false, count: 0},
//   {used: false, count: 0},
//   {used: false, count: 0},
//   {used: false, count: 0}
// ];

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
//不应该把他们设为全局变量，videoInfoCrawler和userInfoCrawler不能同时被调用了

module.exports.videoInfoCrawler = function(t, crawlerQueueCallback){
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
      let errInfo = 'An err occurred while requesting page number.\n';
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
    }

    let queue = async.queue(requestVideoInfo.bind(this), 20);

    queue.drain = function(){
      let timeCost = (new Date() - startTime)/1000 + 's';
      let dbLog = {startTime, tid, tname, requestCount, errCount, updatedCount, addedCount, fromPage, toPage, timeCost};
      db.createCrawlerLog(dbLog, function(err, result){
        if(err){
          let errInfo = 'An err occurred while adding crawler log to db.\n';
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
          fs.appendFile(path.join(__dirname , 'videoInfoCrawlerLog'), log, function(err){
            if(err){
              console.log('An err occurred while writing crawler log to file.');
              console.log(err);
            }
          });
        }
        crawlerQueueCallback();
      });
    };
    pageUrls.forEach((pageUrl) => queue.push(pageUrl, (err) => {if(err) console.log('Err occurred in queue.');}));
  });
};

function requestVideoInfo(url, queueCallback){
  request.get(url, function(err, res, result){
    if (err){
      let errInfo = 'An err occurred while requesting page.\n';
      errCount++;
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
      let errInfo = `An err occurred while parsing json\npageUrl:${url}\n\n` + result + `\n\n`;
      console.log(errInfo);
      log += errInfo;
      requestErrCount++;
      if(requestErrCount < 5) requestVideoInfo(url, queueCallback);
      if(requestErrCount >=5 ) errCount++;
      return;
    }

    let dbQueue = async.queue((archive, dbQueueCallback) => {
      db.createVideoInfo(archive, function(err, added, updated){
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
      dbQueue.push(archives[key] , (err) => {if(err) console.log('Err occurred in dbQueue.');});
    }

    queueCallback();
  });
}

module.exports.userInfoCrawler = function(work, crawlerQueueCallback){
  errCount = 0;
  addedCount = 0;
  startTime = new Date();
  log = '';

  console.log(`Started. startTime: ${startTime}`);
  log += `Started. startTime: ${startTime}\n`;

  let requestQueue = async.queue(requestUserInfo.bind(this), 7);

  requestQueue.drain = function(){
    let timeCost = (new Date() - startTime)/1000 + 's';
    let logInfo = `Finished.\nformMid: ${work.startMid}, toMid: ${work.startMid + work.workSize}\n` + 
                  `startTime: ${startTime}, timeCost: ${timeCost}\n` +
                  `==================================================================================\n`;
    console.log(logInfo);
    log += logInfo;
    fs.appendFile(path.join(__dirname , 'videoInfoCrawlerLog'), log, function(err){
      if(err){
        console.log('An err occurred while writing crawler log to file.');
        console.log(err);
      }
    });
    crawlerQueueCallback();
  };

  for(let mid = work.startMid; mid < work.startMid + work.workSize; mid++){
    let task = {
      options: URLS.user.info(mid),
      requestErrCount: 0
    };
   requestQueue.push(task);
  }
};

function requestUserInfo(task, queueCallback){
      // 代理服务器
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
        'X-Forearded-For': proxyIp
    },
    form: {
      mid: task.options.form.mid,
      _:new Date().getTime()
    },
    timeout: 5000
  };

    proxiedRequest.post(options, (err, response, result) => {
    console.log(task.options.form.mid);
    if (err){

      // console.log(err);
      // log += errInfo;
      // errCount++;
      task.requestErrCount++;
      if(task.requestErrCount < 5) requestUserInfo(task, queueCallback);
      if(task.requestErrCount >=5 ){
        let errInfo = `An err occurred in proxy server\n\n` + result + `\n\n`;
        console.log(errInfo);
        log += errInfo;
        errCount++;
        queueCallback();
      }
      return;
    }

    let userInfo;
    if(response.statusCode == 200){
      try{
        let resultObj = JSON.parse(result);
        if(resultObj.status) userInfo = resultObj.data;
        else{
          console.log(`Err: the response status is false.\nmid: ${task.options.form.mid} data: ${resultObj.data}`);
          queueCallback();
          return;
        }
      }
      catch(e){
        task.requestErrCount++;
        if(task.requestErrCount < 5) requestUserInfo(task, queueCallback);
        if(task.requestErrCount >=5 ){
          let errInfo = `An err occurred while parsing json\nmid: ${task.options.form.mid}\n\n` + result + `\n\n`;
          console.log(errInfo);
          log += errInfo;
          errCount++;
          queueCallback();
        }
        return;
      }
    }
    else{
        task.requestErrCount++;
        if(task.requestErrCount < 5) requestUserInfo(task, queueCallback);
        if(task.requestErrCount >=5 ){
          let errInfo = `Err: get an response status: ${response.statusCode}\nmid:${task.options.form.mid}\n\n`;
          console.log(errInfo);
          log += errInfo;
          errCount++;
          queueCallback();
        }
        return;
    }
    task.requestErrCount = 0;
    db.createUserInfo(userInfo, function(err, result){
      if(err){
          let errInfo = 'An err occurred while adding user info into db.';
          console.err(errInfo);
          console.log(err);
          log += errInfo;
          errCount++;
      }
      else if(result){
        addedCount++;
        let createUserRelationQueue = async.queue((userRelation, createUserRelationQueueCallback) => {
          db.createUserRelation(userRelation, (err, result) => {
            dbQueueCallback();
          })
        });
      }
      else{
        errCount++;
      }
      queueCallback();
    });
  });
}