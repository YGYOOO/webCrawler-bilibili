module.exports.user = {
  info: function(){
    /*
    *POST
    *Content-Type: application/x-www-form-urlencoded
    *Referer: http://space.bilibili.com/873981/
    */
    return 'http://space.bilibili.com/ajax/member/GetInfo';
  },
  fans: function({mid, page, _=new Date().getTime()}){
    //http://space.bilibili.com/ajax/friend/GetFansList?mid=188294&page=2&_=1482709739003
    if(!mid || !page) return;
    return `http://space.bilibili.com/ajax/friend/GetFansList?mid=${mid}&page=${page}&_=${_}`;
  },
  tags: function({mids, _=new Date().getTime()}){
    //http://space.bilibili.com/ajax/member/getTags?mids=188294&_=1482697096926
    if(!mids) return;
    return `http://space.bilibili.com/ajax/member/getTags?mids=${mids}&_=${_}`;
  },
  vipStatus: function({mid}){
    //http://space.bilibili.com/ajax/member/getVipStatus?mid=188294
    if(!mid) return;
    return `http://space.bilibili.com/ajax/member/getVipStatus?mid=${mid}`;
  },
  submitVideos: function({mid, tid=0, pagesize=25,  _=new Date().getTime()}){
    //http://space.bilibili.com/ajax/member/getSubmitVideos?mid=188294&tid=0&pagesize=25&_=1482701504892
    if(!mid) return;
    return `http://space.bilibili.com/ajax/member/getSubmitVideos?mid=${mid}&tid=${tid}&pagesize=${pagesize}&_=${_}`
  }
};

module.exports.video = {
  info: function({callback='', type='jsonp', tid, pn, _=new Date().getTime()}){
    //http://api.bilibili.com/archive_rank/getarchiverankbypartion?callback=jQuery17206259586882507797_1482699525366&type=jsonp&tid=30&pn=2&_=1482699544074
    if(!tid || !pn) return; //以后这种错误也可记录到日志
    return `http://api.bilibili.com/archive_rank/getarchiverankbypartion?callback=${callback}&type=${type}&tid=${tid}&pn=${pn}&_=${_}`;
  }
};

//[{"tid":27,"tname":"综合"},{"tid":15,"tname":"连载剧集"},{"tid":61,"tname":"预告资讯"},{"tid":17,"tname":"单机联机"},{"tid":16,"tname":"flash游戏"},{"tid":19,"tname":"Mugen"},{"tid":20,"tname":"宅舞"},{"tid":21,"tname":"日常"},{"tid":25,"tname":"MMD·3D"},{"tid":22,"tname":"鬼畜调教"},{"tid":24,"tname":"MAD·AMV"},{"tid":26,"tname":"音MAD"},{"tid":27,"tname":"综合"},{"tid":29,"tname":"三次元音乐"},{"tid":28,"tname":"原创音乐"},{"tid":30,"tname":"VOCALOID·UTAU"},{"tid":31,"tname":"翻唱"},{"tid":34,"tname":"完结剧集"},{"tid":32,"tname":"完结动画"},{"tid":33,"tname":"连载动画"},{"tid":37,"tname":"纪录片"},{"tid":39,"tname":"演讲•公开课"},{"tid":40,"tname":"技术宅"},{"tid":41,"tname":"暂置区"},{"tid":43,"tname":"舞蹈MMD"},{"tid":44,"tname":"剧情MMD"},{"tid":48,"tname":"原创动画"},{"tid":47,"tname":"短片·手书·配音"},{"tid":46,"tname":"其他"},{"tid":49,"tname":"ACG配音"},{"tid":50,"tname":"手书"},{"tid":53,"tname":"其他"},{"tid":51,"tname":"资讯"},{"tid":52,"tname":"动漫杂谈"},{"tid":54,"tname":"OP/ED/OST"},{"tid":56,"tname":"VOCALOID"},{"tid":57,"tname":"UTAU"},{"tid":58,"tname":"VOCALOID中文曲"},{"tid":60,"tname":"电子竞技"},{"tid":59,"tname":"演奏"},{"tid":61,"tname":"预告资讯"},{"tid":63,"tname":"实况解说"},{"tid":64,"tname":"游戏杂谈"},{"tid":65,"tname":"网游·电竞"},{"tid":66,"tname":"游戏集锦"},{"tid":67,"tname":"其他"},{"tid":71,"tname":"综艺"},{"tid":70,"tname":"游戏集锦"},{"tid":72,"tname":"运动"},{"tid":73,"tname":"影视剪影"},{"tid":74,"tname":"日常"},{"tid":75,"tname":"动物圈"},{"tid":76,"tname":"美食圈"},{"tid":77,"tname":"喵星人"},{"tid":80,"tname":"美食视频"},{"tid":75,"tname":"动物圈"},{"tid":81,"tname":"料理制作"},{"tid":82,"tname":"电影相关"},{"tid":83,"tname":"其他国家"},{"tid":85,"tname":"短片"},{"tid":89,"tname":"美剧"},{"tid":86,"tname":"特摄·布袋"},{"tid":87,"tname":"国产"},{"tid":88,"tname":"日剧"},{"tid":92,"tname":"布袋戏"},{"tid":90,"tname":"其他"},{"tid":91,"tname":"特摄"},{"tid":94,"tname":"剧场版"},{"tid":95,"tname":"数码"},{"tid":97,"tname":"手机评测"},{"tid":96,"tname":"星海"},{"tid":98,"tname":"机械"}]

//[{"tid":15,"tname":"连载剧集"},{"tid":16,"tname":"flash游戏"},{"tid":17,"tname":"单机联机"},{"tid":19,"tname":"Mugen"},{"tid":20,"tname":"宅舞"},{"tid":21,"tname":"日常"},{"tid":22,"tname":"鬼畜调教"},{"tid":24,"tname":"MAD·AMV"},{"tid":25,"tname":"MMD·3D"},{"tid":26,"tname":"音MAD"},{"tid":27,"tname":"综合"},{"tid":28,"tname":"原创音乐"},{"tid":29,"tname":"三次元音乐"},{"tid":30,"tname":"VOCALOID·UTAU"},{"tid":31,"tname":"翻唱"},{"tid":32,"tname":"完结动画"},{"tid":33,"tname":"连载动画"},{"tid":34,"tname":"完结剧集"},{"tid":37,"tname":"纪录片"},{"tid":39,"tname":"演讲•公开课"},{"tid":40,"tname":"技术宅"},{"tid":41,"tname":"暂置区"},{"tid":43,"tname":"舞蹈MMD"},{"tid":44,"tname":"剧情MMD"},{"tid":46,"tname":"其他"},{"tid":47,"tname":"短片·手书·配音"},{"tid":48,"tname":"原创动画"},{"tid":49,"tname":"ACG配音"},{"tid":50,"tname":"手书"},{"tid":51,"tname":"资讯"},{"tid":52,"tname":"动漫杂谈"},{"tid":53,"tname":"其他"},{"tid":54,"tname":"OP/ED/OST"},{"tid":56,"tname":"VOCALOID"},{"tid":57,"tname":"UTAU"},{"tid":58,"tname":"VOCALOID中文曲"},{"tid":59,"tname":"演奏"},{"tid":60,"tname":"电子竞技"},{"tid":61,"tname":"预告资讯"},{"tid":63,"tname":"实况解说"},{"tid":64,"tname":"游戏杂谈"},{"tid":65,"tname":"网游·电竞"},{"tid":66,"tname":"游戏集锦"},{"tid":67,"tname":"其他"},{"tid":70,"tname":"游戏集锦"},{"tid":71,"tname":"综艺"},{"tid":72,"tname":"运动"},{"tid":73,"tname":"影视剪影"},{"tid":74,"tname":"日常"},{"tid":75,"tname":"动物圈"},{"tid":76,"tname":"美食圈"},{"tid":77,"tname":"喵星人"},{"tid":80,"tname":"美食视频"},{"tid":81,"tname":"料理制作"},{"tid":82,"tname":"电影相关"},{"tid":83,"tname":"其他国家"},{"tid":85,"tname":"短片"},{"tid":86,"tname":"特摄·布袋"},{"tid":87,"tname":"国产"},{"tid":88,"tname":"日剧"},{"tid":89,"tname":"美剧"},{"tid":90,"tname":"其他"},{"tid":91,"tname":"特摄"},{"tid":92,"tname":"布袋戏"},{"tid":94,"tname":"剧场版"},{"tid":95,"tname":"数码"},{"tid":96,"tname":"星海"},{"tid":97,"tname":"手机评测"},{"tid":98,"tname":"机械"},{"tid":99,"tname":"BBC纪录片"},{"tid":101,"tname":"国家地理"},{"tid":102,"tname":"NHK"},{"tid":103,"tname":"演讲"},{"tid":104,"tname":"公开课"},{"tid":105,"tname":"演示"},{"tid":107,"tname":"科技人文"},{"tid":108,"tname":"趣味短片"},{"tid":110,"tname":"国产"},{"tid":111,"tname":"日剧"},{"tid":114,"tname":"国内综艺"},{"tid":115,"tname":"国外综艺"},{"tid":116,"tname":"游戏"},{"tid":118,"tname":"其他"},{"tid":119,"tname":"鬼畜"},{"tid":121,"tname":"GMV"},{"tid":122,"tname":"野生技术协会"},{"tid":123,"tname":"手办模型"},{"tid":124,"tname":"趣味科普人文"},{"tid":125,"tname":"其他"},{"tid":126,"tname":"人力VOCALOID"},{"tid":127,"tname":"教程演示"},{"tid":128,"tname":"电视剧相关"},{"tid":130,"tname":"音乐选集"},{"tid":131,"tname":"Korea相关"},{"tid":132,"tname":"Korea音乐舞蹈"},{"tid":133,"tname":"Korea综艺"},{"tid":134,"tname":"其他"},{"tid":136,"tname":"音游"},{"tid":137,"tname":"明星"},{"tid":138,"tname":"搞笑"},{"tid":139,"tname":"实况解说"},{"tid":140,"tname":"游戏杂谈"},{"tid":141,"tname":"游戏集锦"},{"tid":143,"tname":"COSPLAY"},{"tid":144,"tname":"综艺剪辑"},{"tid":145,"tname":"欧美电影"},{"tid":146,"tname":"日本电影"},{"tid":147,"tname":"国产电影"},{"tid":152,"tname":"官方延伸"},{"tid":153,"tname":"国产动画"},{"tid":154,"tname":"三次元舞蹈"},{"tid":156,"tname":"舞蹈教程"},{"tid":157,"tname":"美妆"},{"tid":158,"tname":"服饰"},{"tid":159,"tname":"资讯"},{"tid":160,"tname":"生活"},{"tid":161,"tname":"手工"},{"tid":162,"tname":"绘画"},{"tid":163,"tname":"运动"},{"tid":164,"tname":"健身"},{"tid":165,"tname":"广告"},{"tid":166,"tname":"广告"}]
