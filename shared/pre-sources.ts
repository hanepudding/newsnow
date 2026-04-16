import process from "node:process"
import { Interval } from "./consts"
import { typeSafeObjectFromEntries } from "./type.util"
import type { OriginSource, Source, SourceID } from "./types"

const Time = {
  Test: 1,
  Realtime: 1 * 60 * 1000, // 1 min — flash-tier (jin10, forexlive)
  Fast: 2 * 60 * 1000, // 2 min — major press (wsj, bloomberg, cnbc)
  Default: 5 * 60 * 1000, // 5 min — fallback for sources without explicit interval
  Common: 5 * 60 * 1000, // 5 min — reuters, ft, fedpress
  Slow: 60 * 60 * 1000, // 60 min — daily-ish sources (solidot)
}

export const originSources = {
  "v2ex": {
    name: "V2EX",
    color: "slate",
    lang: "zh",
    home: "https://v2ex.com/",
    sub: {
      share: {
        title: "最新分享",
        column: "tech",
      },
    },
  },
  "zhihu": {
    name: "知乎",
    type: "hottest",
    column: "deprecated",
    color: "blue",
    lang: "zh",
    home: "https://www.zhihu.com",
  },
  "weibo": {
    name: "微博",
    title: "实时热搜",
    type: "hottest",
    column: "deprecated",
    color: "red",
    interval: Time.Realtime,
    lang: "zh",
    home: "https://weibo.com",
  },
  "zaobao": {
    name: "联合早报",
    interval: Time.Common,
    type: "realtime",
    column: "world",
    color: "red",
    desc: "来自第三方网站: 早晨报",
    lang: "zh",
    home: "https://www.zaobao.com",
  },
  "coolapk": {
    name: "酷安",
    type: "hottest",
    column: "deprecated",
    color: "green",
    title: "今日最热",
    lang: "zh",
    home: "https://coolapk.com",
  },
  "mktnews": {
    name: "MKTNews",
    column: "finance",
    lang: "zh",
    home: "https://mktnews.net",
    color: "indigo",
    interval: Time.Realtime,
    sub: {
      flash: {
        title: "快讯",
      },
    },
  },
  "wallstreetcn": {
    name: "华尔街见闻",
    color: "blue",
    column: "finance",
    lang: "zh",
    home: "https://wallstreetcn.com/",
    sub: {
      quick: {
        type: "realtime",
        interval: Time.Fast,
        title: "快讯",
      },
      news: {
        title: "最新",
        interval: Time.Common,
      },
      hot: {
        title: "最热",
        type: "hottest",
        interval: Time.Common,
      },
    },
  },
  "36kr": {
    name: "36氪",
    type: "realtime",
    color: "blue",
    lang: "zh",
    home: "https://36kr.com",
    column: "deprecated",
    sub: {
      quick: {
        title: "快讯",
      },
      renqi: {
        type: "hottest",
        title: "人气榜",
      },
    },
  },
  "douyin": {
    name: "抖音",
    type: "hottest",
    column: "deprecated",
    color: "gray",
    lang: "zh",
    home: "https://www.douyin.com",
  },
  "hupu": {
    name: "虎扑",
    lang: "zh",
    home: "https://hupu.com",
    column: "deprecated",
    title: "主干道热帖",
    type: "hottest",
    color: "red",
  },
  "tieba": {
    name: "百度贴吧",
    title: "热议",
    column: "deprecated",
    type: "hottest",
    color: "blue",
    lang: "zh",
    home: "https://tieba.baidu.com",
  },
  "toutiao": {
    name: "今日头条",
    type: "hottest",
    column: "china",
    color: "red",
    lang: "zh",
    home: "https://www.toutiao.com",
  },
  "ithome": {
    name: "IT之家",
    color: "red",
    column: "tech",
    type: "realtime",
    lang: "zh",
    home: "https://www.ithome.com",
  },
  "thepaper": {
    name: "澎湃新闻",
    interval: Time.Common,
    type: "hottest",
    column: "china",
    title: "热榜",
    color: "gray",
    lang: "zh",
    home: "https://www.thepaper.cn",
  },
  "sputniknewscn": {
    name: "卫星通讯社",
    color: "orange",
    column: "world",
    lang: "zh",
    home: "https://sputniknews.cn",
  },
  "cankaoxiaoxi": {
    name: "参考消息",
    color: "red",
    column: "world",
    interval: Time.Common,
    lang: "zh",
    home: "https://china.cankaoxiaoxi.com",
  },
  "pcbeta": {
    name: "远景论坛",
    color: "blue",
    column: "tech",
    lang: "zh",
    home: "https://bbs.pcbeta.com",
    sub: {
      windows11: {
        title: "Win11",
        type: "realtime",
        interval: Time.Fast,
      },
      windows: {
        title: "Windows 资源",
        type: "realtime",
        interval: Time.Fast,
        disable: true,
      },
    },
  },
  "cls": {
    name: "财联社",
    color: "red",
    column: "finance",
    lang: "zh",
    home: "https://www.cls.cn",
    sub: {
      telegraph: {
        title: "电报",
        interval: Time.Fast,
        type: "realtime",
      },
      depth: {
        title: "深度",
      },
      hot: {
        title: "热门",
        type: "hottest",
      },
    },
  },
  "xueqiu": {
    name: "雪球",
    color: "blue",
    lang: "zh",
    home: "https://xueqiu.com",
    column: "finance",
    sub: {
      hotstock: {
        title: "热门股票",
        interval: Time.Realtime,
        type: "hottest",
      },
    },
  },
  "gelonghui": {
    name: "格隆汇",
    color: "blue",
    title: "事件",
    column: "finance",
    type: "realtime",
    interval: Time.Realtime,
    lang: "zh",
    home: "https://www.gelonghui.com",
  },
  "fastbull": {
    name: "法布财经",
    color: "emerald",
    lang: "zh",
    home: "https://www.fastbull.cn",
    column: "finance",
    sub: {
      express: {
        title: "快讯",
        type: "realtime",
        interval: Time.Realtime,
      },
      news: {
        title: "头条",
        interval: Time.Common,
      },
    },
  },
  "solidot": {
    name: "Solidot",
    color: "teal",
    column: "tech",
    lang: "zh",
    home: "https://solidot.org",
    interval: Time.Slow,
  },
  "hackernews": {
    name: "Hacker News",
    color: "orange",
    column: "tech",
    type: "hottest",
    lang: "en",
    home: "https://news.ycombinator.com/",
  },
  "producthunt": {
    name: "Product Hunt",
    color: "red",
    column: "deprecated",
    type: "hottest",
    lang: "en",
    home: "https://www.producthunt.com/",
  },
  "github": {
    name: "Github",
    color: "gray",
    lang: "en",
    home: "https://github.com/",
    column: "tech",
    sub: {
      "trending-today": {
        title: "Today",
        type: "hottest",
      },
    },
  },
  "bilibili": {
    name: "哔哩哔哩",
    color: "blue",
    column: "deprecated",
    lang: "zh",
    home: "https://www.bilibili.com",
    sub: {
      "hot-search": {
        title: "热搜",
        type: "hottest",
      },
      "hot-video": {
        title: "热门视频",
        disable: "cf",
        type: "hottest",
      },
      "ranking": {
        title: "排行榜",
        disable: "cf",
        type: "hottest",
        interval: Time.Common,
      },
    },
  },
  "kuaishou": {
    name: "快手",
    type: "hottest",
    column: "deprecated",
    color: "orange",
    // cloudflare pages cannot access
    disable: "cf",
    lang: "zh",
    home: "https://www.kuaishou.com",
  },
  "kaopu": {
    name: "靠谱新闻",
    column: "world",
    color: "gray",
    interval: Time.Common,
    desc: "不一定靠谱，多看多思考",
    lang: "zh",
    home: "https://kaopu.news/",
  },
  "jin10": {
    name: "金十数据",
    column: "finance",
    color: "blue",
    type: "realtime",
    lang: "zh",
    home: "https://www.jin10.com",
  },
  "baidu": {
    name: "百度热搜",
    column: "china",
    color: "blue",
    type: "hottest",
    lang: "zh",
    home: "https://www.baidu.com",
  },
  "linuxdo": {
    name: "LINUX DO",
    column: "tech",
    color: "slate",
    lang: "zh",
    home: "https://linux.do/",
    disable: true,
    sub: {
      latest: {
        title: "最新",
        home: "https://linux.do/latest",
      },
      hot: {
        title: "今日最热",
        type: "hottest",
        interval: Time.Common,
        home: "https://linux.do/hot",
      },
    },
  },
  "ghxi": {
    name: "果核剥壳",
    column: "china",
    color: "yellow",
    lang: "zh",
    home: "https://www.ghxi.com/",
    disable: true,
  },
  "smzdm": {
    name: "什么值得买",
    column: "china",
    color: "red",
    type: "hottest",
    lang: "zh",
    home: "https://www.smzdm.com",
    disable: true,
  },
  "nowcoder": {
    name: "牛客",
    column: "deprecated",
    color: "blue",
    type: "hottest",
    lang: "zh",
    home: "https://www.nowcoder.com",
  },
  "sspai": {
    name: "少数派",
    column: "tech",
    color: "red",
    type: "hottest",
    lang: "zh",
    home: "https://sspai.com",
  },
  "juejin": {
    name: "稀土掘金",
    column: "deprecated",
    color: "blue",
    type: "hottest",
    lang: "zh",
    home: "https://juejin.cn",
  },
  "ifeng": {
    name: "凤凰网",
    column: "china",
    color: "red",
    type: "hottest",
    title: "热点资讯",
    lang: "zh",
    home: "https://www.ifeng.com",
  },
  "chongbuluo": {
    name: "虫部落",
    column: "china",
    color: "green",
    lang: "zh",
    home: "https://www.chongbuluo.com",
    sub: {
      latest: {
        title: "最新",
        interval: Time.Common,
        home: "https://www.chongbuluo.com/forum.php?mod=guide&view=newthread",
      },
      hot: {
        title: "最热",
        type: "hottest",
        interval: Time.Common,
        home: "https://www.chongbuluo.com/forum.php?mod=guide&view=hot",
      },
    },
  },
  "douban": {
    name: "豆瓣",
    column: "deprecated",
    title: "热门电影",
    color: "green",
    type: "hottest",
    lang: "zh",
    home: "https://www.douban.com",
  },
  "steam": {
    name: "Steam",
    column: "world",
    title: "在线人数",
    color: "blue",
    type: "hottest",
    home: "https://store.steampowered.com",
  },
  "tencent": {
    name: "腾讯新闻",
    column: "china",
    color: "blue",
    lang: "zh",
    home: "https://news.qq.com",
    sub: {
      hot: {
        title: "综合早报",
        type: "hottest",
        interval: Time.Common,
        home: "https://news.qq.com/tag/aEWqxLtdgmQ=",
      },
    },
  },
  "freebuf": {
    name: "Freebuf",
    column: "deprecated",
    title: "网络安全",
    color: "green",
    type: "hottest",
    lang: "zh",
    home: "https://www.freebuf.com/",
  },

  "qqvideo": {
    name: "腾讯视频",
    column: "deprecated",
    color: "blue",
    lang: "zh",
    home: "https://v.qq.com/",
    sub: {
      "tv-hotsearch": {
        title: "热搜榜",
        type: "hottest",
        interval: Time.Common,
        home: "https://v.qq.com/channel/tv",

      },
    },
  },
  "iqiyi": {
    name: "爱奇艺",
    column: "deprecated",
    color: "green",
    lang: "zh",
    home: "https://www.iqiyi.com",
    sub: {
      "hot-ranklist": {
        title: "热播榜",
        type: "hottest",
        interval: Time.Common,
        home: "https://www.iqiyi.com",
      },
    },
  },
  "reuters": {
    name: "Reuters",
    color: "orange",
    column: "finance",
    interval: Time.Common,
    lang: "en",
    home: "https://www.reuters.com",
    sub: {
      world: { title: "World", type: "realtime" },
      business: { title: "Business", type: "realtime" },
      markets: { title: "Markets", type: "realtime" },
    },
  },
  "apnews": {
    name: "AP News",
    color: "red",
    column: "world",
    interval: Time.Common,
    lang: "en",
    home: "https://apnews.com",
    sub: {
      top: { title: "Top", type: "realtime" },
      business: { title: "Business", type: "realtime" },
      world: { title: "World", type: "realtime" },
    },
  },
  "marketwatch": {
    name: "MarketWatch",
    color: "green",
    column: "finance",
    interval: Time.Fast,
    lang: "en",
    home: "https://www.marketwatch.com",
    sub: {
      top: { title: "Top Stories", type: "realtime" },
      pulse: { title: "Market Pulse", type: "realtime" },
      bulletins: { title: "Bulletins", type: "realtime" },
    },
  },
  "cnbc": {
    name: "CNBC",
    color: "indigo",
    column: "finance",
    interval: Time.Fast,
    lang: "en",
    home: "https://www.cnbc.com",
    sub: {
      top: { title: "Top News", type: "realtime" },
      markets: { title: "Markets", type: "realtime" },
      world: { title: "World", type: "realtime" },
    },
  },
  "bloomberg": {
    name: "Bloomberg",
    color: "orange",
    column: "finance",
    interval: Time.Fast,
    lang: "en",
    home: "https://www.bloomberg.com",
    sub: {
      markets: { title: "Markets", type: "realtime" },
      politics: { title: "Politics", type: "realtime" },
      tech: { title: "Technology", type: "realtime" },
    },
  },
  "seekingalpha": {
    name: "Seeking Alpha",
    color: "amber",
    column: "finance",
    interval: Time.Fast,
    lang: "en",
    home: "https://seekingalpha.com",
    sub: {
      currents: { title: "Market Currents", type: "realtime" },
      articles: { title: "Articles", type: "realtime" },
    },
  },
  "ft": {
    name: "Financial Times",
    color: "rose",
    column: "finance",
    interval: Time.Common,
    lang: "en",
    home: "https://www.ft.com",
    sub: {
      world: { title: "World", type: "realtime" },
      companies: { title: "Companies", type: "realtime" },
      markets: { title: "Markets", type: "realtime" },
    },
  },
  "nikkei": {
    name: "Nikkei Asia",
    color: "red",
    column: "finance",
    interval: Time.Common,
    lang: "en",
    home: "https://asia.nikkei.com",
    sub: {
      top: { title: "Top", type: "realtime" },
      business: { title: "Business", type: "realtime" },
      economy: { title: "Economy", type: "realtime" },
    },
  },
  "yahoofinance": {
    name: "Yahoo Finance",
    color: "violet",
    column: "finance",
    interval: Time.Fast,
    type: "realtime",
    lang: "en",
    home: "https://finance.yahoo.com",
  },
  "forexlive": {
    name: "Forexlive",
    color: "orange",
    column: "finance",
    interval: Time.Realtime,
    lang: "en",
    home: "https://www.forexlive.com",
    sub: {
      news: { title: "Flash", type: "realtime" },
      centralbank: { title: "Central Bank", type: "realtime" },
    },
  },
  "fxstreet": {
    name: "FXStreet",
    color: "rose",
    column: "finance",
    interval: Time.Realtime,
    type: "realtime",
    title: "News",
    lang: "en",
    home: "https://www.fxstreet.com",
  },
  "investing": {
    name: "Investing",
    color: "yellow",
    column: "finance",
    interval: Time.Fast,
    lang: "en",
    home: "https://www.investing.com",
    sub: {
      economic: { title: "Economic", type: "realtime" },
      forex: { title: "Forex", type: "realtime" },
      commodities: { title: "Commodities", type: "realtime" },
    },
  },
  "wsj": {
    name: "WSJ",
    color: "blue",
    column: "finance",
    interval: Time.Fast,
    lang: "en",
    home: "https://www.wsj.com",
    sub: {
      markets: { title: "Markets", type: "realtime" },
      world: { title: "World", type: "realtime" },
    },
  },
  "benzinga": {
    name: "Benzinga",
    color: "lime",
    column: "finance",
    interval: Time.Fast,
    type: "realtime",
    title: "Markets",
    lang: "en",
    home: "https://www.benzinga.com",
  },
  "oilprice": {
    name: "OilPrice",
    color: "neutral",
    column: "finance",
    interval: Time.Fast,
    type: "realtime",
    lang: "en",
    home: "https://oilprice.com",
  },
  "axios": {
    name: "Axios",
    color: "fuchsia",
    column: "world",
    interval: Time.Common,
    type: "realtime",
    lang: "en",
    home: "https://www.axios.com",
  },
  "fedpress": {
    name: "Fed Press",
    color: "emerald",
    column: "finance",
    interval: Time.Common,
    type: "realtime",
    title: "Releases",
    lang: "en",
    home: "https://www.federalreserve.gov",
  },
  "coindesk": {
    name: "CoinDesk",
    color: "amber",
    column: "finance",
    interval: Time.Fast,
    type: "realtime",
    lang: "en",
    home: "https://www.coindesk.com",
  },
  "zerohedge": {
    name: "ZeroHedge",
    color: "zinc",
    column: "finance",
    interval: Time.Fast,
    type: "realtime",
    lang: "en",
    home: "https://www.zerohedge.com",
  },
  "trumpstruth": {
    name: "Trump Truth",
    color: "red",
    column: "world",
    interval: Time.Fast,
    type: "realtime",
    lang: "en",
    home: "https://trumpstruth.org",
  },
  "clashreport": {
    name: "Clash Report",
    color: "neutral",
    column: "world",
    interval: Time.Fast,
    type: "realtime",
    lang: "en",
    home: "https://t.me/s/ClashReport",
  },
} as const satisfies Record<string, OriginSource>

export function genSources() {
  const _: [SourceID, Source][] = []

  Object.entries(originSources).forEach(([id, source]: [any, OriginSource]) => {
    const parent = {
      name: source.name,
      type: source.type,
      disable: source.disable,
      desc: source.desc,
      column: source.column,
      home: source.home,
      color: source.color ?? "primary",
      interval: source.interval ?? Time.Default,
      lang: source.lang,
    }
    if (source.sub && Object.keys(source.sub).length) {
      Object.entries(source.sub).forEach(([subId, subSource], i) => {
        if (i === 0) {
          _.push([
            id,
            {
              redirect: `${id}-${subId}`,
              ...parent,
              ...subSource,
            },
          ] as [any, Source])
        }
        _.push([`${id}-${subId}`, { ...parent, ...subSource }] as [
          any,
          Source,
        ])
      })
    } else {
      _.push([
        id,
        {
          title: source.title,
          ...parent,
        },
      ])
    }
  })

  return typeSafeObjectFromEntries(
    _.filter(([_, v]) => {
      if (v.disable === "cf" && process.env.CF_PAGES) {
        return false
      } else {
        return v.disable !== true
      }
    }),
  )
}
