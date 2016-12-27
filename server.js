var express = require('express'),
    fs = require('fs'),
    request = require('request'),
    cheerio = require('cheerio'),
    app = express(),
    async = require('async');

const db = require('./db.js');
const URLS = require('./urls.js');

// for(var i=1 ; i < 11 ; i++){
//   pageUrls.push(URL + '?callback=&type=jsonp&tid=30&&pn=' + i +'&_=1482631876546');
// }

// app.get('/scrape', function(req, res){
//   let requests = pageUrls.map(function(pageUrl){
//     return new Promise((resolve) => {
//       request(pageUrl, function(err, status, html){
//         if (err) {
//            return next(err);
//         }
//
//         let $ = cheerio.load(html);
//         let curPageUrls = $('.titlelnk');
//
//         for(let i = 0 ; i < curPageUrls.length ; i++){
//           let articleUrl = curPageUrls.eq(i).attr('href');
//           urlsArray.push(articleUrl);
//           // ep.emit('BlogArticleHtml', articleUrl);
//         }
//         resolve();
//       });
//     });
//   });
//   Promise.all(requests).then(() => res.send(urlsArray));
// })

/*
*目前没有把错误信息记录到日志
*/
app.get('/crawl/vocaloidVideos', function(req, res){
  const URL = 'http://api.bilibili.com/archive_rank/getarchiverankbypartion';
  let errCount = 0,
      existsCount = 0,
      successCount = 0,
      date = new Date(),
      type = 'vocaloidVideos',
      fromPage = req.query.from,
      toPage = req.query.to;
  let pageUrls = [];

  for(var i = fromPage ; i <= toPage ; i++){
    pageUrls.push(URL + '?callback=&type=jsonp&tid=30&&pn=' + i +'&_=1482631876546');
  }
  console.log(URLS.userInfo.tags);
  if(pageUrls.length < 1) return res.send('err');

  let queue = async.queue((pageUrl, queueCallback) => {
    request(pageUrl, function(err, status, result){
      if (err) {
         return next(err);
      }

      let archives = JSON.parse(result).data.archives;
      let createVocaloidVideoCount = 0;
      let dbQueue = async.queue((archive, dbQueueCallback) => {
        db.createVocaloidVideo(archive, function(err, result, exists){
          if(err){
            console.err('An err occurred while creating vcaloidVideo.');
            console.log(err);
            errCount++;
          }
          else if(exists){
            existsCount++;
          }
          else if(result){
            successCount++;
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
  }, 10);

  queue.drain = function(){
    let timeCost = (new Date() - date)/1000 + 's';
    let log = {date, type, errCount, existsCount, successCount, fromPage, toPage, timeCost};
    db.createCrawlerLog(log, function(err, result){
      if(err){

      }
      else if(result){
        res.send('finished');
      }
      else{

      }
    });
  };
  pageUrls.forEach((pageUrl) => queue.push(pageUrl));
})

app.listen('3000')

console.info('Server is running at port 3000');
exports = module.exports = app;
