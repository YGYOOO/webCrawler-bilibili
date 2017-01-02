var mongodb = require('mongodb');
var ObjectId = mongodb.ObjectID;
const URL = "mongodb://localhost:27017/bilibiliVideoInfo";
var db;

const createVocaloidVideoToDb = function(vocaloidVideo, callback){
  db.collection('vocaloidVideo').findOne({aid: vocaloidVideo.aid}, function(err, result){
    // console.log('++++++++');
    if(err) callback(err, false);
    else if(!result){
      db.collection('vocaloidVideo').insertOne(vocaloidVideo, function(err, result){
        callback(err, result);
      });
    }
    else{
      db.collection('vocaloidVideo').updateOne({_id: ObjectId(result._id)}, vocaloidVideo, function(){
        callback(false, false, true);
      });
    }
  });
};

// const createVideoToDb = function(video, callback){
//   db.collection('video').findOne({aid: video.aid}, function(err, result){
//     // console.log('++++++++');
//     if(err) callback(err, false);
//     else if(!result){
//       db.collection('video').insertOne(video, function(err, result){
//         callback(err, result);
//       });
//     }
//     else{
//       db.collection('video').updateOne({_id: ObjectId(result._id)}, video, function(err, result){
//         callback(false, false, true);
//       });
//     }
//   });
// }

const createVideoInfoToDb = function(video, callback){
  db.collection('video').insertOne(video, function(err, result){
    callback(err, result);
  });
};

const createCrawlerLogToDb = function(data, callback){
  db.collection('crawlerLog').insertOne(data, function(err, result){
    callback(err, result);
  });
};

module.exports.createVocaloidVideo = function(vocaloidVideo, callback){
  createVocaloidVideoToDb(vocaloidVideo, function(err, result, updated){
    if(err){
      callback(err, false);
    }
    else if(result && result.result.ok == 1){
      callback(null, true);
    }
    else if(updated){
      callback(false, false, true);
    }
    else{
      callback(null, false);
    }
  });
};

module.exports.createVideoInfo = function(video, callback){
  createVideoInfoToDb(video, function(err, result, updated){
    if(err){
      callback(err, false);
    }
    else if(result && result.result.ok == 1){
      callback(null, true);
    }
    else if(updated){
      callback(false, false, true);
    }
    else{
      callback(null, false);
    }
  });
};

module.exports.createUserInfo = function(user, callback){
  db.collection('user').insertOne(user, function(err, result){
    callback(err, result);
  });
};

module.exports.createUserRelation = function(user, callback){
  db.collection('userRelation').insertOne(user, function(err, result){
    callback(err, result);
  });
};

module.exports.createCrawlerLog = function(data, callback){
  createCrawlerLogToDb(data, function(err, result){
    if(err){
      callback(err, false);
    }
    else if(result && result.result.ok == 1){
      callback(null, true);
    }
    else{
      callback(null, false);
    }
  });
};

module.exports.createDisabledProxy = function(proxy, callback){
    db.collection('disabledProxy').insertOne(proxy, function(err, result){
    callback(err, result);
  });
};

module.exports.buildConnectionToDb = function(callback){
  mongodb.connect(URL, function(err, dbObj){
    if(err){
      callback(err);
    }
    else{
      db = dbObj;
      callback();
    }
  });
};

module.exports.closeConnectionToDb = function(){
  db.close();
};
