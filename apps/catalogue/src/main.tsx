import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  X,
  Search,
  Check,
  Globe2,
  Download,
  Menu,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import sourcesData from '../../../src/data/sources.json'
import replication from '../../../docs/REPLICATION.md?raw'
import designSystem from '../../../docs/DESIGN-SYSTEM.md?raw'
import researchMethod from '../../../docs/RESEARCH-METHOD.md?raw'
import './styles.css'

type Source = {
  id: string
  title: string
  url: string
  platform: string
  category: string
  styles: string[]
  summary: string
  status: string
  evidence: string
  checkedAt: string
  evidenceUrl?: string
  excerpt?: string
}
const sources = sourcesData as Source[]
const sites = [
  {
    id: 'editorial',
    name: 'FOLIO',
    title: '把阅读，变成一种体验。',
    type: '独立编辑杂志',
    style: 'EDITORIAL',
    desc: '大胆留白、衬线字体与不对称构图。一份关于创意、文化与日常观察的数字杂志。',
    tags: ['编辑排版', '内容阅读'],
    port: 5174,
  },
  {
    id: 'brutalist',
    name: 'ODD®',
    title: '不合常规，才是常规。',
    type: '创意工作室',
    style: 'BRUTALISM',
    desc: '高对比色、超大字体、直白的视觉语言。让设计有一点张力，也有一点不客气。',
    tags: ['粗野主义', '作品展示'],
    port: 5175,
  },
  {
    id: 'swiss',
    name: 'GRID / 26',
    title: '秩序之中，自有表达。',
    type: '艺术设计展览',
    style: 'SWISS GRID',
    desc: '从网格出发，让数字、线条与文字成为主角。一个为展览而生的完整信息体验。',
    tags: ['瑞士风格', '活动预约'],
    port: 5176,
  },
  {
    id: 'glass',
    name: 'AURA',
    title: '让声音，拥有形状。',
    type: '音乐体验产品',
    style: 'GLASSMORPHISM',
    desc: '流动的色彩、半透明层次与柔和光感。沉入一场可以亲手控制的声音实验。',
    tags: ['玻璃质感', '声音交互'],
    port: 5177,
  },
  {
    id: 'terminal',
    name: 'TRACE_',
    title: '代码之外，也有美感。',
    type: '开发者工具',
    style: 'TERMINAL',
    desc: '等宽字体、命令行与可读的数据反馈。把熟悉的技术语言转化为产品的个性。',
    tags: ['终端美学', '交互反馈'],
    port: 5178,
  },
  {
    id: 'organic',
    name: 'MORI',
    title: '给生活，留一点绿。',
    type: '植物生活品牌',
    style: 'ORGANIC',
    desc: '自然的轮廓、温暖的纸色与植物绿。探索从生活方式叙事到选购的完整路径。',
    tags: ['有机设计', '品牌零售'],
    port: 5179,
  },
  {
    id: 'restaurant',
    name: 'EMBER',
    title: '一席烟火，慢慢品味。',
    type: '当代餐厅',
    style: 'CULINARY',
    desc: '炭火、暖光与克制的排版。从一道菜的故事，到一席晚餐的预约。',
    tags: ['餐饮叙事', '餐桌预约'],
    port: 5180,
  },
  {
    id: 'travel',
    name: 'ROAM',
    title: '出发，去生活的别处。',
    type: '旅行探索',
    style: 'ADVENTURE',
    desc: '开阔的构图、路线与目的地。让旅行规划像真正踏上旅途一样轻松。',
    tags: ['旅行体验', '目的地探索'],
    port: 5181,
  },
  {
    id: 'fintech',
    name: 'MONO',
    title: '每一笔，都清晰有数。',
    type: '金融科技',
    style: 'FINTECH',
    desc: '干净的信息层级与明确的反馈。把复杂的金融信息转化为可以理解的界面。',
    tags: ['数据界面', '金融产品'],
    port: 5182,
  },
  {
    id: 'civic',
    name: 'OPEN CITY',
    title: '一座城市，每个人的事。',
    type: '公共服务',
    style: 'CIVIC DESIGN',
    desc: '亲切、开放且易于理解。用清楚的导航和状态，让公共服务更接近每个人。',
    tags: ['公共设计', '服务导航'],
    port: 5183,
  },
  {
    id: 'arcade',
    name: 'P1XEL',
    title: '按下开始，快乐发生。',
    type: '街机游戏',
    style: 'RETRO ARCADE',
    desc: '像素、霓虹与即时反馈。把游戏的探索欲与一个可以操作的网站融合。',
    tags: ['复古像素', '游戏交互'],
    port: 5184,
  },
  {
    id: 'architecture',
    name: 'STILL',
    title: '在空间里，看见时间。',
    type: '建筑工作室',
    style: 'SPATIAL MINIMAL',
    desc: '安静的留白、建筑尺度与空间叙事。让作品成为主角，让浏览慢一点。',
    tags: ['建筑美学', '空间叙事'],
    port: 5185,
  },
]
const docs = [
  {
    id: 'replication',
    title: '从观察到复刻',
    subtitle: '多种风格的逐步实现指南',
    text: replication,
    filename: 'REPLICATION.md',
  },
  {
    id: 'system',
    title: '拆解设计语言',
    subtitle: '布局、色彩、文字与交互参数',
    text: designSystem,
    filename: 'DESIGN-SYSTEM.md',
  },
  {
    id: 'research',
    title: '建立自己的灵感库',
    subtitle: '来源取证、视频笔记与研究方法',
    text: researchMethod,
    filename: 'RESEARCH-METHOD.md',
  },
]
function siteUrl(site: (typeof sites)[number]) {
  return import.meta.env.DEV
    ? `${location.protocol}//${location.hostname}:${site.port}/`
    : `/${site.id}/`
}

function StarMark() {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className="star-svg">
      {[0, 45, 90, 135].map((n) => (
        <path
          key={n}
          d="M50 8V92"
          transform={`rotate(${n} 50 50)`}
          stroke="currentColor"
          strokeWidth="11"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
function Sketch({ kind }: { kind: string }) {
  if (kind === 'editorial')
    return (
      <div className="sketch editorial-sketch">
        <div className="sketch-masthead">
          FOLIO <span>INDEPENDENT JOURNAL · VOL. 01</span>
        </div>
        <div className="editorial-layout">
          <div>
            <small>THE ART OF SEEING</small>
            <h3>
              Less,
              <br />
              <i>but better.</i>
            </h3>
            <div className="sketch-lines" />
            <span>Stories worth slowing down for ↗</span>
          </div>
          <div className="editorial-art">
            <div className="editorial-vase" />
            <span>OBJECT No. 018</span>
          </div>
        </div>
        <div className="sketch-bottom">DESIGN · CULTURE · EVERYDAY LIFE</div>
      </div>
    )
  if (kind === 'brutalist')
    return (
      <div className="sketch brutalist-sketch">
        <div className="brutal-nav">
          ODD® <span>MAKE SOME NOISE ↗</span>
        </div>
        <div className="brutal-heading">
          GOOD
          <br />
          IS BORING
          <span>
            <StarMark />
          </span>
        </div>
        <div className="brutal-tape">IDEAS WITH AN ATTITUDE. IDEAS WITH AN ATTITUDE.</div>
        <div className="brutal-footer">
          INDEPENDENT DESIGN STUDIO <span>EST. 2026</span>
        </div>
      </div>
    )
  if (kind === 'swiss')
    return (
      <div className="sketch swiss-sketch">
        <div className="swiss-top">
          INTERNATIONAL
          <br />
          DESIGN EXHIBITION{' '}
          <span>
            07—18
            <br />
            NOVEMBER
          </span>
        </div>
        <div className="swiss-number">
          26<span>↗</span>
        </div>
        <div className="swiss-footer">
          GRID /<br />A NEW PERSPECTIVE.
          <span>
            ZURICH
            <br />
            2026
          </span>
        </div>
      </div>
    )
  if (kind === 'glass')
    return (
      <div className="sketch glass-sketch">
        <div className="glass-masthead">
          aura<span>FEEL YOUR FREQUENCY</span>
        </div>
        <div className="glass-orb one" />
        <div className="glass-orb two" />
        <div className="glass-window">
          <div className="glass-art">a</div>
          <div>
            <small>YOUR DAILY ESCAPE</small>
            <h3>
              Between
              <br />
              the waves.
            </h3>
            <div className="glass-controls">
              <span>◁</span>
              <b>Ⅱ</b>
              <span>▷</span>
            </div>
            <div className="glass-progress" />
          </div>
        </div>
        <div className="glass-bottom">LESS NOISE. MORE FEELING.</div>
      </div>
    )
  if (kind === 'terminal')
    return (
      <div className="sketch terminal-sketch">
        <div className="terminal-nav">
          TRACE_<span>BUILD. SHIP. REPEAT.</span>
        </div>
        <h3>
          Less friction.
          <br />
          <span>More flow.</span>
        </h3>
        <div className="terminal-window">
          <div>
            <i />
            <i />
            <i />
            <span>trace — local demo</span>
          </div>
          <p>
            <b>❯</b> trace deploy --preview
          </p>
          <p className="terminal-muted">Analyzing your next big idea…</p>
          <p>
            <b>✓</b> 128 modules transformed
          </p>
          <p>
            <b>✓</b> Ready when you are<span className="terminal-cursor">_</span>
          </p>
        </div>
      </div>
    )
  if (kind === 'restaurant')
    return (
      <div className="sketch restaurant-sketch">
        <div className="special-masthead">
          EMBER<span>FIRE. SEASON. SOUL.</span>
        </div>
        <h3>
          A table.
          <br />A moment.
        </h3>
        <div className="plate">
          <div />
          <i />
        </div>
        <small>SEASONAL DINING — 2026</small>
      </div>
    )
  if (kind === 'travel')
    return (
      <div className="sketch travel-sketch">
        <div className="special-masthead">
          ROAM<span>GO A LITTLE FURTHER ↗</span>
        </div>
        <h3>
          Find your
          <br />
          <i>somewhere.</i>
        </h3>
        <div className="travel-sun" />
        <div className="travel-hill back" />
        <div className="travel-hill front" />
        <small>LESS PLANNING. MORE WANDERING.</small>
      </div>
    )
  if (kind === 'fintech')
    return (
      <div className="sketch fintech-sketch">
        <div className="special-masthead">
          MONO<span>MONEY, MADE CLEAR.</span>
        </div>
        <h3>
          Your money.
          <br />
          In perspective.
        </h3>
        <div className="money-card">
          <small>TOTAL BALANCE</small>
          <strong>
            $24,680<span>.00</span>
          </strong>
          <div className="mini-bars">
            {[30, 45, 38, 65, 58, 78, 90, 82, 100].map((n, i) => (
              <i key={i} style={{ height: `${n}%` }} />
            ))}
          </div>
        </div>
        <small>A LITTLE MORE CLARITY.</small>
      </div>
    )
  if (kind === 'civic')
    return (
      <div className="sketch civic-sketch">
        <div className="special-masthead">
          OPEN CITY<span>FOR ALL OF US.</span>
        </div>
        <h3>
          A better city.
          <br />
          Starts with you.
        </h3>
        <div className="city-blocks">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="civic-search">
          What can we help you with? <ArrowRight size={11} />
        </div>
      </div>
    )
  if (kind === 'arcade')
    return (
      <div className="sketch arcade-sketch">
        <div className="arcade-score">
          HI-SCORE 024800 <span>1UP</span>
        </div>
        <h3>
          INSERT
          <br />
          <span>COIN</span>
        </h3>
        <div className="pixel-alien">
          ▟▙
          <br />
          ▞▚▞▚
        </div>
        <small>PRESS START TO PLAY _</small>
      </div>
    )
  if (kind === 'architecture')
    return (
      <div className="sketch architecture-sketch">
        <div className="special-masthead">
          STILL<span>SPACE. LIGHT. TIME.</span>
        </div>
        <h3>
          Quiet
          <br />
          <i>by design.</i>
        </h3>
        <div className="building-art">
          <div />
          <i />
          <b />
        </div>
        <small>SELECTED WORKS / 2026</small>
      </div>
    )
  return (
    <div className="sketch organic-sketch">
      <div className="organic-nav">
        mori<span>A LITTLE CLOSER TO NATURE</span>
      </div>
      <div className="organic-layout">
        <div>
          <small>ROOTED IN THE EVERYDAY</small>
          <h3>
            Make room
            <br />
            for <i>green.</i>
          </h3>
          <span>Find your plant companion ↗</span>
        </div>
        <div className="plant-art">
          <div className="stem" />
          <i className="leaf l1" />
          <i className="leaf l2" />
          <i className="leaf l3" />
          <i className="leaf l4" />
          <div className="pot" />
        </div>
      </div>
      <div className="organic-bottom">GROW SLOW. LIVE WELL.</div>
    </div>
  )
}

const screenshotSites = new Set([
  'editorial',
  'brutalist',
  'swiss',
  'glass',
  'terminal',
  'organic',
  'restaurant',
  'travel',
  'fintech',
  'civic',
  'arcade',
  'architecture',
])
function SitePreview({ site }: { site: (typeof sites)[number] }) {
  const [unavailable, setUnavailable] = useState(false)
  const hasScreenshot = screenshotSites.has(site.id) && !unavailable
  return (
    <>
      {hasScreenshot ? (
        <img
          className="site-screenshot"
          src={`${import.meta.env.BASE_URL}previews/${site.id}.png`}
          alt={`${site.name} 独立网站真实首屏截图`}
          width="1440"
          height="1000"
          loading="lazy"
          onError={() => setUnavailable(true)}
        />
      ) : (
        <Sketch kind={site.id} />
      )}
      <span className="preview-open">
        <ArrowUpRight size={24} />
      </span>
      <span className="preview-caption">
        {hasScreenshot ? 'ACTUAL PAGE / 实际页面截图' : 'DESIGN SKETCH / 风格示意'}
      </span>
    </>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [doc, setDoc] = useState<(typeof docs)[number] | null>(null)
  const [selected, setSelected] = useState<Source | null>(null)
  const [mobile, setMobile] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const visibleSources = sources.filter(
    (s) =>
      (filter === 'all' || s.status === filter) &&
      `${s.title} ${s.platform} ${s.category} ${s.summary} ${s.styles.join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )
  const verified = sources.filter((s) => s.status === 'verified').length
  useEffect(() => {
    const d = dialogRef.current
    if (doc || selected) {
      d?.showModal()
      document.body.style.overflow = 'hidden'
    } else {
      d?.close()
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [doc, selected])
  const close = () => {
    setDoc(null)
    setSelected(null)
  }
  function downloadDoc() {
    if (!doc) return
    const url = URL.createObjectURL(new Blob([doc.text], { type: 'text/markdown;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = doc.filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <>
      <a href="#main" className="skip-link">
        跳到内容
      </a>
      <header className="header">
        <a className="wordmark" href="#">
          <span className="brand-mark">
            <StarMark />
          </span>{' '}
          FORM<span className="wordmark-light">INDEX</span>
          <sup>®</sup>
        </a>
        <nav aria-label="主导航" className={mobile ? 'nav open' : 'nav'}>
          <a onClick={() => setMobile(false)} href="#sites">
            独立网站 <span>12</span>
          </a>
          <a onClick={() => setMobile(false)} href="#sources">
            灵感来源
          </a>
          <a onClick={() => setMobile(false)} href="#notes">
            复刻手册
          </a>
        </nav>
        <a className="header-link" href="#notes">
          从这里开始 <ArrowUpRight size={16} />
        </a>
        <button
          className="mobile-menu"
          onClick={() => setMobile(!mobile)}
          aria-expanded={mobile}
          aria-label="切换导航"
        >
          {mobile ? <X /> : <Menu />}
        </button>
      </header>
      <main id="main">
        <section className="hero">
          <div className="hero-main">
            <div className="eyebrow">
              <span className="live-dot" /> AN INDEPENDENT DESIGN EXPLORATION{' '}
              <span>VOL. 001 — 2026</span>
            </div>
            <h1>
              十二种视角。
              <br />
              十二个
              <span className="orange-word">
                独立世界
                <svg viewBox="0 0 480 20" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M4 14 Q230 0 476 12" />
                </svg>
              </span>
              。
            </h1>
            <div className="hero-description">
              <p>
                好设计没有标准答案。
                <br />
                把灵感拆开，让每一种风格完整发生。
              </p>
              <a href="#sites" className="round-link" aria-label="探索十二个独立网站">
                <ArrowRight size={28} />
              </a>
            </div>
            <div className="hero-meta">
              <span>12 个独立网站</span>
              <i />
              <span>{sources.length} 个研究入口</span>
              <i />
              <span>03 份复刻手册</span>
            </div>
          </div>
          <div className="hero-art" aria-label="探索不同设计语言的抽象构图">
            <div className="art-grid" />
            <div className="art-text">
              form
              <br />
              <i>follows</i>
              <br />
              curiosity.
            </div>
            <div className="art-orbit">
              <div className="orbit-one" />
              <div className="orbit-two" />
              <div className="orbit-three" />
              <div className="orbit-center" />
            </div>
            <div className="art-label">
              NO SINGLE WAY
              <br />
              TO MAKE A MARK.
            </div>
            <div className="art-sticker">
              INDEPENDENT
              <br />
              <b>BY DESIGN ↗</b>
            </div>
            <span className="art-number">F / I — 001</span>
          </div>
        </section>
        <div className="manifesto-strip">
          <span>EXPLORE WITHOUT LIMITS</span>
          <p>不同美学 · 独立体验 · 可以动手复刻</p>
          <span>SCROLL TO DISCOVER ↓</span>
        </div>
        <section className="sites-section" id="sites">
          <div className="section-heading">
            <div>
              <span className="section-kicker">01 / THE COLLECTION</span>
              <h2>
                各自完整，自成一格<span>。</span>
              </h2>
            </div>
            <p>
              每个入口都是一个完整网站。
              <br />
              独立导航、独立交互，也能独立部署。
            </p>
          </div>
          <div className="site-grid">
            {sites.map((site, index) => (
              <article className="site-card" key={site.id}>
                <a
                  className="site-preview"
                  href={siteUrl(site)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`打开 ${site.name} 独立网站，新标签页`}
                >
                  <SitePreview site={site} />
                </a>
                <div className="site-card-top">
                  <span className="site-index">
                    {String(index + 1).padStart(2, '0')} / {site.style}
                  </span>
                  <span className="site-type">{site.type}</span>
                </div>
                <div className="site-title">
                  <h3>{site.name}</h3>
                  <a
                    href={siteUrl(site)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`进入 ${site.name}`}
                  >
                    <ArrowUpRight size={23} />
                  </a>
                </div>
                <h4>{site.title}</h4>
                <p>{site.desc}</p>
                <div className="site-tags">
                  {site.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                  <span className="independent-tag">
                    独立站点 <ArrowUpRight size={12} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="notes-section" id="notes">
          <div className="notes-intro">
            <span className="section-kicker">02 / FIELD NOTES</span>
            <h2>
              不止于看。
              <br />
              把方法带走<span>↗</span>
            </h2>
            <p>
              从一次灵感闪现，到一个可以运行的网站。
              <br />
              记录决定，理解取舍，再做出自己的版本。
            </p>
            <div className="notes-footnote">READ → DECONSTRUCT → RECREATE</div>
          </div>
          <div className="notes-list">
            {docs.map((item, i) => (
              <button className="note-item" key={item.id} onClick={() => setDoc(item)}>
                <span className="note-number">0{i + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.subtitle}</p>
                </div>
                <ArrowUpRight size={26} />
              </button>
            ))}
            <div className="notes-bottom">
              <BookOpen size={16} />
              <span>中文手册 · 可下载 Markdown · 包含实现步骤与检查清单</span>
            </div>
          </div>
        </section>
        <section className="sources-section" id="sources">
          <div className="section-heading">
            <div>
              <span className="section-kicker">03 / OPEN RESEARCH</span>
              <h2>
                灵感有来处<span>。</span>
              </h2>
            </div>
            <p>
              设计系统、实验项目、视频与社区。
              <br />
              保留来源，也保留研究的边界。
            </p>
          </div>
          <div className="research-notice">
            <span>
              <Check size={16} />
              {verified} 条已查阅资料
            </span>
            <p>
              这是代表性研究，不代表穷尽市场。受网络限制的平台明确标记为“待核验”，未观看的视频不作为已验证案例。
            </p>
          </div>
          <div className="source-toolbar">
            <div className="source-filters" aria-label="资料状态">
              {[
                { id: 'all', label: '全部来源' },
                { id: 'verified', label: '已查阅' },
                { id: 'blocked', label: '待核验' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={filter === f.id ? 'active' : ''}
                  aria-pressed={filter === f.id}
                >
                  {f.label}
                  <span>
                    {f.id === 'all'
                      ? sources.length
                      : sources.filter((s) => s.status === f.id).length}
                  </span>
                </button>
              ))}
            </div>
            <label className="search-box">
              <Search size={16} />
              <input
                placeholder="搜索平台、主题或风格…"
                aria-label="搜索灵感来源"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button aria-label="清空搜索" onClick={() => setQuery('')}>
                  <X size={14} />
                </button>
              )}
            </label>
          </div>
          <p className="result-count" aria-live="polite">
            显示 {visibleSources.length} 个来源
          </p>
          <div className="source-grid">
            {visibleSources.map((source) => (
              <button className="source-card" key={source.id} onClick={() => setSelected(source)}>
                <div className="source-card-head">
                  <span>{source.platform}</span>
                  <ArrowUpRight size={18} />
                </div>
                <h3>{source.title}</h3>
                <p>{source.summary}</p>
                <div className="source-card-foot">
                  <span
                    className={
                      source.status === 'verified' ? 'source-status verified' : 'source-status'
                    }
                  >
                    {source.status === 'verified' ? <Check size={12} /> : <Globe2 size={12} />}{' '}
                    {source.status === 'verified' ? '已查阅' : '待核验'}
                  </span>
                  <span>{source.category}</span>
                </div>
              </button>
            ))}
          </div>
          {visibleSources.length === 0 && (
            <div className="empty-state">
              <Search size={32} />
              <h3>暂时没有匹配的资料</h3>
              <p>试试「动效」「B站」「设计系统」，或清除筛选。</p>
              <button
                onClick={() => {
                  setQuery('')
                  setFilter('all')
                }}
              >
                显示全部来源 <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
        <section className="closing">
          <span>THE NEXT INTERPRETATION IS YOURS.</span>
          <h2>
            借鉴一种语言，
            <br />
            创造自己的表达。
          </h2>
          <a href="#sites">
            重新探索 <ArrowUpRight size={20} />
          </a>
          <div className="closing-star">
            <StarMark />
          </div>
        </section>
      </main>
      <footer>
        <a className="wordmark" href="#">
          <span className="brand-mark">
            <StarMark />
          </span>{' '}
          FORM<span className="wordmark-light">INDEX</span>
        </a>
        <p>一份持续生长的设计观察与实践档案。</p>
        <span>DESIGNED TO BE EXPLORED. © 2026</span>
      </footer>
      <dialog
        ref={dialogRef}
        aria-label={doc?.title || selected?.title || '资料阅读'}
        className="reading-dialog"
        onCancel={close}
        onClick={(e) => {
          if (e.target === dialogRef.current) close()
        }}
      >
        <div className="dialog-shell">
          <div className="dialog-toolbar">
            <span>{doc ? 'FIELD NOTES / 复刻手册' : 'RESEARCH NOTE / 来源记录'}</span>
            <div>
              {doc && (
                <button onClick={downloadDoc} aria-label="下载 Markdown">
                  <Download size={18} />
                  <span>下载</span>
                </button>
              )}
              <button onClick={close} aria-label="关闭阅读面板">
                <X size={22} />
              </button>
            </div>
          </div>
          {doc ? (
            <article className="markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div
                      className="markdown-table-scroll"
                      role="region"
                      aria-label="文档表格，可横向滚动"
                      tabIndex={0}
                    >
                      <table>{children}</table>
                    </div>
                  ),
                  a: ({ href, children }) =>
                    href && /^https?:\/\//i.test(href) ? (
                      <a href={href} target="_blank" rel="noreferrer">
                        {children}
                      </a>
                    ) : (
                      <span className="repository-reference" title={`仓库内引用：${href || ''}`}>
                        {children}
                        <small>（仓库内文件）</small>
                      </span>
                    ),
                }}
              >
                {doc.text}
              </ReactMarkdown>
            </article>
          ) : selected ? (
            <article className="source-detail">
              <span
                className={
                  selected.status === 'verified' ? 'source-status verified' : 'source-status'
                }
              >
                {selected.status === 'verified' ? '已查阅来源内容' : '待核验 · 当前环境访问受限'}
              </span>
              <h2>{selected.title}</h2>
              <p className="source-summary">{selected.summary}</p>
              <dl>
                <dt>平台 / 类别</dt>
                <dd>
                  {selected.platform} / {selected.category}
                </dd>
                <dt>核验记录</dt>
                <dd>{selected.evidence}</dd>
                <dt>检查日期</dt>
                <dd>{selected.checkedAt}</dd>
              </dl>
              {selected.excerpt && <blockquote>{selected.excerpt}</blockquote>}
              <div className="source-detail-links">
                <a href={selected.url} target="_blank" rel="noreferrer">
                  打开原始来源 <ArrowUpRight size={17} />
                </a>
                {selected.evidenceUrl && selected.evidenceUrl !== selected.url && (
                  <a href={selected.evidenceUrl} target="_blank" rel="noreferrer">
                    查看查阅依据 <ArrowUpRight size={17} />
                  </a>
                )}
              </div>
              <p className="source-detail-note">
                网站中的风格示例为独立实现；来源记录用于学习设计与交互方法，不表示已复刻原站或观看所有相关视频。
              </p>
            </article>
          ) : null}
        </div>
      </dialog>
    </>
  )
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
