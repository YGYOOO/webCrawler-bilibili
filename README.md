# webCrawler-bilibili关系图
计划抓取b站全部视频信息，做一些统计。并抓取全部用户信息，存储下来，做一些交互性展示，比如输入你的b站id，显示你的关注/粉丝的地域构成、性别构成等，以及发散状的关系图，效率允许的话，可以展示多阶关系，比如你粉丝的粉丝（前端部分目前来看没什么难点）。

视频很快扒完了，可用户信息b站做了反扒(一个ip约5分钟只能请求200个用户信息)，所以目前正在实现代理ip池，不过由于都是网上的免费ip，所以极不稳定，代理ip池这块的逻辑越写越杂，可能要重新理一下。最主要是性能问题，b站7000多万账号，50个请求并发的话，一秒大概扒50个，一直不停也得半个月，期间内一直提供稳定可用的ip是最大的难点。

（当时头脑发热写的，代码没有很好地组织，比较杂乱，没有参考价值。之后如果要扒账号的话，可能会先重构一下）
