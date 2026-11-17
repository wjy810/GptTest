import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Compass,
  MapPin,
  Heart,
  Mountain,
  Waves,
  Building2,
  Plus,
  Minus,
  X,
  Menu,
  Check,
  Download,
  Sun,
  Footprints,
  Navigation,
} from 'lucide-react'
import './styles.css'

type Destination = {
  id: string
  name: string
  en: string
  category: string
  province: string
  days: string
  daily: number
  transport: number
  art: string
  color: string
  description: string
  highlights: string[]
  season: string
}
const destinations: Destination[] = [
  {
    id: 'chuanxi',
    name: '川西',
    en: 'WESTERN SICHUAN',
    category: '山野',
    province: '中国 · 四川',
    days: '5—7 天',
    daily: 420,
    transport: 1200,
    art: 'mountain',
    color: 'pine',
    description:
      '沿着山路向上，让雪山、湖泊和旷野慢慢打开视野。给自己充足的适应与休息时间，天气允许时再决定下一段路。',
    highlights: ['山谷轻徒步与沿途观景', '湖畔慢行，记录雪山倒影', '探访山脚村落与当地市集'],
    season: '春末至秋季 · 高海拔天气多变',
  },
  {
    id: 'dali',
    name: '大理',
    en: 'DALI, YUNNAN',
    category: '山野',
    province: '中国 · 云南',
    days: '4—6 天',
    daily: 360,
    transport: 900,
    art: 'mountain',
    color: 'sage',
    description:
      '把闹钟留在日常里。苍山下散步，洱海边骑行，找一家小店坐到天色慢慢暗下来。这里适合少赶一点路，多留一点白。',
    highlights: ['洱海岸边骑行与散步', '古城街巷与咖啡小店', '苍山山脚慢行与村落探访'],
    season: '春季与秋季 · 出发前确认天气',
  },
  {
    id: 'wanning',
    name: '万宁',
    en: 'WANNING, HAINAN',
    category: '海岛',
    province: '中国 · 海南',
    days: '4—5 天',
    daily: 480,
    transport: 1400,
    art: 'island',
    color: 'teal',
    description:
      '听海浪替你安排一天的节奏。清晨走到沙滩，午后躲进椰林，傍晚追一场日落。水上活动请按天气与现场指导安排。',
    highlights: ['海湾散步与日出观察', '椰林骑行与海边小店', '在专业指导下体验入门冲浪'],
    season: '秋冬至春季 · 避开台风影响时段',
  },
  {
    id: 'zhoushan',
    name: '舟山',
    en: 'ZHOUSHAN ISLANDS',
    category: '海岛',
    province: '中国 · 浙江',
    days: '3—4 天',
    daily: 320,
    transport: 700,
    art: 'island',
    color: 'sand',
    description:
      '坐上一班船，离陆地远一点。看看渔港、灯塔和安静的海湾，把行程留给海风，也为船期变化留下余地。',
    highlights: ['渔港街巷与在地小吃', '海岸步道与灯塔远望', '选择开放岛屿，留出候船时间'],
    season: '春秋两季 · 船班受海况影响',
  },
  {
    id: 'kyoto',
    name: '京都',
    en: 'KYOTO, JAPAN',
    category: '城市',
    province: '日本 · 京都府',
    days: '4—6 天',
    daily: 620,
    transport: 2400,
    art: 'city',
    color: 'terracotta',
    description:
      '在大路之外，走进一条刚好安静的小巷。茶香、木门、河岸与一顿慢慢吃的晚餐，让城市以自己的速度靠近你。',
    highlights: ['鸭川沿岸与街区步行', '庭园参观与茶文化体验', '书店、手作店与在地饮食'],
    season: '春秋两季 · 旺季提前核验开放与预约',
  },
  {
    id: 'quanzhou',
    name: '泉州',
    en: 'QUANZHOU, FUJIAN',
    category: '城市',
    province: '中国 · 福建',
    days: '3—4 天',
    daily: 290,
    transport: 650,
    art: 'city',
    color: 'ochre',
    description:
      '从一条老街拐进另一条。古老建筑、烟火小吃与并行的文化，在不大的街区里铺开一座城市的层次。',
    highlights: ['西街步行与城市建筑观察', '在地小吃与传统街区', '博物馆与海洋文化主题探访'],
    season: '春秋季较舒适 · 夏季注意高温与降雨',
  },
]
const validIds = new Set(destinations.map((d) => d.id))
function loadSaved(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem('roam-saved') ?? '[]')
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((v): v is string => typeof v === 'string' && validIds.has(v)))]
      : []
  } catch {
    return []
  }
}
function Scene({
  kind = 'mountain',
  variant = 'pine',
  hero = false,
}: {
  kind?: string
  variant?: string
  hero?: boolean
}) {
  return (
    <svg
      className={`landscape landscape-${variant} ${hero ? 'landscape-hero' : ''}`}
      viewBox="0 0 900 600"
      fill="none"
      role="img"
      aria-label={
        kind === 'mountain'
          ? '原创山川与湖泊插画'
          : kind === 'island'
            ? '原创海湾与椰树插画'
            : '原创城市建筑插画'
      }
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="900" height="600" className="sky" />
      <circle cx={hero ? 660 : 685} cy={hero ? 150 : 135} r={hero ? 88 : 67} className="sun" />
      <path
        d="M78 120h115m-68 17h75m445-52h90m-52 17h86"
        stroke="white"
        strokeWidth="2"
        opacity=".38"
      />
      {kind === 'mountain' ? (
        <>
          <path
            d="M-30 390 95 234 157 286 326 104 422 257 490 195 625 363 730 250 940 409V600H-30Z"
            className="mountain-far"
          />
          <path d="m243 194 83-90 62 99-58-26-24 22-26-10-37 5Z" className="snow" />
          <path
            d="m-15 474 145-132 120 95 149-205 142 171 90-58 165 139 140-51v167H-15Z"
            className="mountain-near"
          />
          <path d="m334 321 65-89 59 71-44-11-18 20-19-12-43 21Z" className="snow" opacity=".55" />
          <path d="M0 520q205-105 420-23t480-14v117H0Z" className="water" />
          <path
            d="M55 536q150-32 300-13m45 22q180 16 345-31m-198 53q104 6 218-11"
            stroke="white"
            strokeWidth="2"
            opacity=".25"
          />
          <path d="M0 455q123 37 236 145H0Z" className="ground" />
          <path d="M900 438q-160 10-300 162h300Z" className="ground" />
          <g className="trees">
            {[32, 75, 110, 163, 738, 786, 827, 862].map((x, i) => (
              <g
                key={x}
                transform={`translate(${x} ${465 + (i % 3) * 18}) scale(${0.6 + (i % 4) * 0.15})`}
              >
                <path
                  d="M0-83-28-26h15l-27 42h27l-30 36h86L13 16h27L13-26h15Z"
                  fill="currentColor"
                />
                <path d="M0 20v55" stroke="currentColor" strokeWidth="8" />
              </g>
            ))}
          </g>
          <path d="M803 600q-9-45-38-61t-9-33" stroke="#f8e5bf" strokeWidth="10" opacity=".75" />
          <path d="m678 551 32-45 44 45Z" fill="#ec8959" />
          <path d="m710 506 12 45h32Z" fill="#c4673c" />
          <path d="m710 528-11 23h17Z" fill="#28474e" />
        </>
      ) : kind === 'island' ? (
        <>
          <path d="M0 254q211-32 447-5t453-10v361H0Z" className="water" />
          <path
            d="M0 288q200-23 440 5t460-8m-900 58q180-18 390 3m80 7q150 13 430-10"
            stroke="white"
            strokeWidth="3"
            opacity=".28"
          />
          <path d="m554 259 95-66 58 20 51-83 125 132Z" className="mountain-far" />
          <path d="M0 490q174-97 376-42T900 411v189H0Z" className="beach" />
          <path d="M0 466q174-97 376-42T900 387" stroke="white" strokeWidth="14" opacity=".4" />
          <g className="palm">
            <path d="M176 600q58-174 45-315" stroke="currentColor" strokeWidth="18" />
            <path
              d="M221 292q-103-150-177-18 100-52 177 18Zm0 0q75-160 174-98-121 19-174 98Zm0 0q-72-144-115-111 74 38 115 111Zm0 0q109-98 161 0-83-29-161 0Zm0 0q-24-175 62-187-58 99-62 187Z"
              fill="currentColor"
            />
          </g>
          <path d="m560 423 61-34 72 36Z" fill="#f4a06c" />
          <path d="M621 390v105" stroke="#6f634d" strokeWidth="5" />
          <path d="m665 504 59-18 18 13-64 20Z" fill="#f4e7c8" />
          <path d="m709 476 57-16 18 12-61 19Z" fill="#f4e7c8" />
        </>
      ) : (
        <>
          <path d="M0 520h900v80H0Z" className="street" />
          <path d="M0 484h900v26H0Z" className="street-edge" />
          <g className="buildings">
            <path d="M33 289h184v216H33Z" fill="#d0a783" />
            <path d="m17 288 108-77 109 77Z" fill="#705b53" />
            <path d="M257 210h173v295H257Z" fill="#ead1a6" />
            <path d="m238 210 105-77 105 77Z" fill="#ab6f55" />
            <path d="M465 304h194v201H465Z" fill="#c49c72" />
            <path d="m449 304 112-75 114 75Z" fill="#77614d" />
            <path d="M700 176h169v329H700Z" fill="#dfb98f" />
            <path d="m684 176 99-69 102 69Z" fill="#916b55" />
            {[70, 146, 292, 364, 500, 580, 730, 805].map((x, i) => (
              <g key={x}>
                <path
                  d={`M${x} ${i < 2 ? 330 : i < 4 ? 250 : i < 6 ? 345 : 220}h30v44h-30Z`}
                  fill="#6e7f79"
                />
                <path
                  d={`M${x} ${i < 2 ? 405 : i < 4 ? 330 : i < 6 ? 423 : 300}h30v44h-30Z`}
                  fill="#6e7f79"
                />
              </g>
            ))}
            <path d="M321 415h44v90h-44Zm445-7h43v97h-43Z" fill="#666954" />
            <path d="M21 312h211m18-75h187m26 93h204m29-128h177" stroke="#fff1d0" strokeWidth="7" />
          </g>
          <path d="M0 553h900" stroke="#e3c7a2" strokeWidth="2" />
          <g transform="translate(652 388)">
            <path d="M0 30v100" stroke="#526351" strokeWidth="9" />
            <circle cy="5" r="45" fill="#7f9375" />
            <circle cx="-24" cy="26" r="28" fill="#728668" />
          </g>
          <path d="M115 535v27m-12 0h24m-6-48v20" stroke="#394e4e" strokeWidth="5" />
          <circle cx="121" cy="502" r="7" fill="#394e4e" />
        </>
      )}
      <path d="M0 596h900" stroke="#ffffff12" strokeWidth="8" />
    </svg>
  )
}
function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>, close: () => void) {
  if (event.target !== event.currentTarget) return
  const rect = event.currentTarget.getBoundingClientRect()
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    close()
}
function trapDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return
  const items = [
    ...event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]',
    ),
  ].filter((item) => item.getClientRects().length > 0)
  const first = items[0],
    last = items[items.length - 1]
  if (!first) {
    event.preventDefault()
    event.currentTarget.focus()
    return
  }
  if (
    event.shiftKey &&
    (document.activeElement === first || document.activeElement === event.currentTarget)
  ) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
function App() {
  const [filter, setFilter] = useState('全部')
  const [saved, setSaved] = useState(loadSaved)
  const [storageNote, setStorageNote] = useState('')
  const [menu, setMenu] = useState(false)
  const [detail, setDetail] = useState<Destination | null>(null)
  const [destination, setDestination] = useState('chuanxi')
  const [people, setPeople] = useState(2)
  const [days, setDays] = useState(5)
  const [summary, setSummary] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const detailDialog = useRef<HTMLDialogElement>(null)
  const summaryDialog = useRef<HTMLDialogElement>(null)
  const current = destinations.find((d) => d.id === destination)!
  const dailyTotal = current.daily * days
  const perPerson = dailyTotal + current.transport
  const total = perPerson * people
  const visible = destinations.filter(
    (d) =>
      filter === '全部' || filter === d.category || (filter === '已收藏' && saved.includes(d.id)),
  )
  useEffect(() => {
    if (detail) detailDialog.current?.showModal()
    else detailDialog.current?.close()
  }, [detail])
  useEffect(() => {
    if (summary) summaryDialog.current?.showModal()
    else summaryDialog.current?.close()
  }, [summary])
  useEffect(() => {
    if (!detail && !summary) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [detail, summary])
  function toggleSaved(id: string) {
    setSaved((old) => {
      const next = old.includes(id) ? old.filter((x) => x !== id) : [...old, id]
      try {
        localStorage.setItem('roam-saved', JSON.stringify(next))
        setStorageNote('')
      } catch {
        setStorageNote('浏览器无法保存收藏，当前页面仍可使用；刷新后可能丢失。')
      }
      return next
    })
  }
  function planFor(id: string) {
    setDestination(id)
    setDetail(null)
    document
      .getElementById('plan')
      ?.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      })
  }
  function dayPlan(day: number) {
    return day === 1
      ? '抵达与安顿 · 留出交通和休息时间'
      : day === days
        ? '慢慢告别 · 自由散步与返程预留'
        : current.highlights[(day - 2) % current.highlights.length]
  }
  function downloadPlan() {
    const text = `# ROAM 漫游 · ${current.name}行程草案\n\n人数：${people} 人\n天数：${days} 天\n\n## 参考预算\n每人每日：¥${current.daily}\n每人往返交通参考：¥${current.transport}\n合计：(¥${current.daily} × ${days} + ¥${current.transport}) × ${people} = ¥${total}\n\n## 每日建议\n${Array.from({ length: days }, (_, i) => `- 第 ${i + 1} 天：${dayPlan(i + 1)}`).join('\n')}\n\n所有金额为界面演示参考值，非实时报价，不包含预订、支付或费用保证。具体开放时间、交通、天气、签证和活动条件请自行核验。\n此草案只在浏览器本地生成。\n`
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `roam-${current.id}-${days}days.md`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setDownloaded(true)
  }
  return (
    <>
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <header className="header">
        <a className="logo" href="#" aria-label="ROAM 漫游首页">
          <Compass strokeWidth={1.4} />
          <span>
            roam<span className="logo-period">.</span>
          </span>
        </a>
        <nav aria-label="主导航" className={menu ? 'nav-open' : ''}>
          <a href="#destinations" onClick={() => setMenu(false)}>
            探索目的地
          </a>
          <a href="#journal" onClick={() => setMenu(false)}>
            漫游手记
          </a>
          <a href="#philosophy" onClick={() => setMenu(false)}>
            关于漫游
          </a>
        </nav>
        <a className="header-cta" href="#plan">
          计划下一程 <ArrowUpRight size={15} />
        </a>
        <button
          className="menu-toggle"
          aria-label={menu ? '关闭导航' : '打开导航'}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main id="main">
        <section className="hero">
          <div className="hero-art" aria-hidden="true">
            <Scene hero />
          </div>
          <div className="hero-copy">
            <span className="eyebrow">
              <i /> GO A LITTLE FURTHER. FEEL A LITTLE MORE.
            </span>
            <h1>
              Somewhere
              <br />
              feels like
              <br />
              <em>freedom.</em>
            </h1>
            <p>
              不必去很远。
              <br />
              只要出发，就是另一种生活。
            </p>
            <a className="button-orange" href="#destinations">
              找到你的下一站 <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="hero-stamp">
            <Compass size={27} strokeWidth={1} />
            <span>
              LESS CHECKLIST.
              <br />
              MORE <em>WONDER.</em>
            </span>
            <small>THE ART OF GETTING LOST</small>
          </div>
          <div className="hero-bottom">
            <span>FIELD NOTES / VOL. 01</span>
            <span>
              <MapPin size={12} /> 有山、有风、有你的地方
            </span>
            <a href="#destinations" aria-label="向下探索">
              <ArrowDown size={17} />
            </a>
          </div>
        </section>
        <section className="intro-strip">
          <p>
            旅行不是收集地点，
            <br />
            <strong>是重新找回感受。</strong>
          </p>
          <div>
            <Mountain size={25} strokeWidth={1.2} />
            <span>
              走进山野<small>A LITTLE WILDER</small>
            </span>
          </div>
          <div>
            <Waves size={25} strokeWidth={1.2} />
            <span>
              听听海风<small>A LITTLE SLOWER</small>
            </span>
          </div>
          <div>
            <Building2 size={25} strokeWidth={1.2} />
            <span>
              迷路在街头<small>A LITTLE CLOSER</small>
            </span>
          </div>
        </section>
        <section className="destinations section shell" id="destinations">
          <div className="section-heading">
            <div>
              <span className="eyebrow">01 / PLACES THAT STAY WITH YOU</span>
              <h2>
                总有一个地方，
                <br />
                让你<span>想出发。</span>
              </h2>
            </div>
            <p>
              六种风景，六种靠近世界的方式。
              <br />
              下一次，就跟着心动走。
            </p>
          </div>
          <div className="destination-toolbar">
            <div className="filters" aria-label="目的地分类">
              {['全部', '山野', '海岛', '城市', '已收藏'].map((f) => (
                <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f}
                  {f === '已收藏' && <span>{saved.length}</span>}
                </button>
              ))}
            </div>
            <span>{String(visible.length).padStart(2, '0')} PLACES TO WANDER</span>
          </div>
          <p className="storage-note" role="status">
            {storageNote}
          </p>
          <div className="destination-grid">
            {visible.map((d) => (
              <article className="destination-card" key={d.id}>
                <div className="destination-image">
                  <button
                    className="art-button"
                    onClick={() => setDetail(d)}
                    aria-label={`探索${d.name}`}
                  >
                    <Scene kind={d.art} variant={d.color} />
                    <span className="image-category">{d.category}</span>
                    <span className="explore-arrow">
                      <ArrowUpRight size={22} />
                    </span>
                  </button>
                  <button
                    className="save-button"
                    aria-label={`${saved.includes(d.id) ? '取消收藏' : '收藏'}${d.name}`}
                    aria-pressed={saved.includes(d.id)}
                    onClick={() => toggleSaved(d.id)}
                  >
                    <Heart size={17} fill={saved.includes(d.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="destination-topline">
                  <span>{d.province}</span>
                  <span>建议 {d.days}</span>
                </div>
                <button className="destination-title" onClick={() => setDetail(d)}>
                  <h3>{d.name}</h3>
                  <span>{d.en}</span>
                  <ArrowUpRight size={18} />
                </button>
                <div className="destination-bottom">
                  <span>
                    每日参考 <strong>¥{d.daily}</strong>
                    <small> / 人</small>
                  </span>
                  <span>慢慢走，刚刚好。</span>
                </div>
              </article>
            ))}
          </div>
          {visible.length === 0 && (
            <div className="empty-state">
              <Heart size={28} />
              <h3>把心动，先收藏起来。</h3>
              <p>点击目的地右上角的爱心，为下一次旅行留一点期待。</p>
              <button className="text-link" onClick={() => setFilter('全部')}>
                探索全部目的地 <ArrowRight size={16} />
              </button>
            </div>
          )}
          <p className="price-note">
            费用为本地演示参考值，用于行程预算练习；非实时报价，未提供实际预订服务。
          </p>
        </section>
        <section className="philosophy" id="philosophy">
          <div className="philosophy-art" aria-hidden="true">
            <Scene kind="island" variant="sand" />
            <div className="postcard">
              <span>A NOTE TO YOURSELF</span>
              <p>
                Take the
                <br />
                <em>scenic route.</em>
              </p>
              <small>有时候，绕远一点更好。</small>
              <Navigation size={27} strokeWidth={1.2} />
            </div>
          </div>
          <div className="philosophy-copy">
            <span className="eyebrow">02 / A DIFFERENT WAY TO GO</span>
            <h2>
              少一点打卡，
              <br />
              多一点<span>在场。</span>
            </h2>
            <p>
              我们相信，旅行最好的部分，
              <br />
              往往不在计划表上。
            </p>
            <p>
              是走错路时遇见的小店，是突然停下来的雨，
              <br />
              是当地人随口推荐的一顿饭。
              <br />
              不追赶别人的清单，给自己的旅程留一点空白。
            </p>
            <div className="philosophy-foot">
              <span>
                <Footprints size={17} /> 走慢一点
              </span>
              <span>
                <Sun size={17} /> 感受多一点
              </span>
              <span>
                <Compass size={17} /> 计划少一点
              </span>
            </div>
          </div>
        </section>
        <section className="journal section shell" id="journal">
          <div className="section-heading">
            <div>
              <span className="eyebrow">03 / NOTES FROM THE ROAD</span>
              <h2>
                出发前，<span>读一点。</span>
              </h2>
            </div>
            <span className="journal-note">A few things worth carrying.</span>
          </div>
          <div className="journal-grid">
            <article className="journal-card">
              <div className="journal-number">
                01<span>PACK LIGHT.</span>
              </div>
              <div>
                <span className="journal-tag">行前准备 / 3 MIN READ</span>
                <h3>
                  行李轻一点，
                  <br />
                  路就宽一点。
                </h3>
                <p>
                  从能重复搭配的衣物开始，为天气变化留一件外套。把证件、药品与充电设备放在容易拿取的位置，把“也许会用到”留在家里。
                </p>
                <details>
                  <summary>
                    展开轻装清单 <Plus size={17} />
                  </summary>
                  <ul>
                    <li>核验证件、交通与住宿信息，并保存离线副本。</li>
                    <li>按目的地天气准备分层衣物、适合行走的鞋与防雨用品。</li>
                    <li>自用药品、饮水容器与基础充电设备优先装包。</li>
                    <li>出发前再检查一次天气、开放时间和行李限额。</li>
                  </ul>
                </details>
              </div>
            </article>
            <article className="journal-card">
              <div className="journal-number">
                02<span>LEAVE SPACE.</span>
              </div>
              <div>
                <span className="journal-tag">漫游方法 / 3 MIN READ</span>
                <h3>
                  给日程，
                  <br />
                  留一个空白。
                </h3>
                <p>
                  每天只安排一个真正想去的地方。剩下的时间交给街角、海风或一场午睡。计划负责让你安心，留白负责让惊喜发生。
                </p>
                <details>
                  <summary>
                    展开慢旅行建议 <Plus size={17} />
                  </summary>
                  <ul>
                    <li>把必要交通与预约标为固定项，其他事项保持可调整。</li>
                    <li>每天留一段没有目的地的步行时间，选择安全开放的路线。</li>
                    <li>出行高峰、天气变化与身体状态都可以成为改变计划的理由。</li>
                    <li>与当地生活保持礼貌距离，拍摄前征求同意。</li>
                  </ul>
                </details>
              </div>
            </article>
          </div>
        </section>
        <section className="planner" id="plan">
          <div className="planner-intro">
            <span className="eyebrow">04 / TURN SOMEDAY INTO A PLAN</span>
            <h2>
              “改天吧”，
              <br />
              就从<span>这次开始。</span>
            </h2>
            <p>
              选一个地方，留几天时间。
              <br />
              把模糊的期待，变成一份轻盈的行程草案。
            </p>
            <div className="planner-compass" aria-hidden="true">
              <Compass size={180} strokeWidth={0.6} />
              <span>
                YOUR NEXT CHAPTER
                <br />
                STARTS HERE.
              </span>
            </div>
          </div>
          <form
            className="planner-form"
            onSubmit={(e) => {
              e.preventDefault()
              setDownloaded(false)
              setSummary(true)
            }}
          >
            <label htmlFor="destination">01 / 想去哪里？</label>
            <select
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.province}
                </option>
              ))}
            </select>
            <div className="planner-settings">
              <div>
                <span className="field-label">02 / 几个人？</span>
                <div className="stepper">
                  <button
                    type="button"
                    onClick={() => setPeople((v) => Math.max(1, v - 1))}
                    disabled={people === 1}
                    aria-label="减少人数"
                  >
                    <Minus size={16} />
                  </button>
                  <output aria-live="polite">
                    {people}
                    <small> 人</small>
                  </output>
                  <button
                    type="button"
                    onClick={() => setPeople((v) => Math.min(6, v + 1))}
                    disabled={people === 6}
                    aria-label="增加人数"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="trip-days">
                  03 / 留几天？<output>{days} 天</output>
                </label>
                <input
                  id="trip-days"
                  type="range"
                  min="2"
                  max="14"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                />
                <div className="range-labels">
                  <span>2 天 · 短暂出走</span>
                  <span>14 天 · 慢慢漫游</span>
                </div>
              </div>
            </div>
            <div className="budget-lines">
              <div>
                <span>每日食宿与活动参考</span>
                <span>
                  ¥{current.daily} × {days} 天 × {people} 人
                </span>
              </div>
              <div>
                <span>往返交通参考</span>
                <span>
                  ¥{current.transport} × {people} 人
                </span>
              </div>
            </div>
            <div className="budget-total" aria-live="polite">
              <div>
                <span>这趟旅程，参考预算</span>
                <small>实际费用请自行核验 · 非实时报价</small>
              </div>
              <strong>¥{total.toLocaleString('zh-CN')}</strong>
            </div>
            <button className="button-orange plan-submit" type="submit">
              生成我的漫游草案 <ArrowUpRight size={20} />
            </button>
            <p className="planner-disclaimer">
              <Check size={13} /> 本地生成，无需注册；不会预订、付款或上传个人信息。
            </p>
          </form>
        </section>
        <section className="closing shell">
          <span className="eyebrow">THE WORLD IS STILL OUT THERE.</span>
          <h2>
            Go somewhere.
            <br />
            <em>Come back a little different.</em>
          </h2>
          <a href="#destinations" className="text-link">
            下一站，去哪里？ <ArrowUpRight size={19} />
          </a>
          <span className="closing-line" />
        </section>
      </main>
      <footer className="footer">
        <div>
          <a className="logo" href="#">
            <Compass strokeWidth={1.4} />
            <span>roam.</span>
          </a>
          <p>
            走出去，慢下来。
            <br />
            让世界，重新与你有关。
          </p>
        </div>
        <div className="footer-links">
          <span>KEEP WANDERING</span>
          <a href="#destinations">探索目的地</a>
          <a href="#journal">漫游手记</a>
          <a href="#plan">计划下一程</a>
        </div>
        <div className="footer-note">
          <span>© 2026 ROAM / 漫游</span>
          <p>
            原创旅行界面设计习作。
            <br />
            插画、预算与行程为本地演示内容，
            <br />
            不提供旅行预订或实时信息。
          </p>
          <a href="#">
            BACK TO TOP <ArrowUpRight size={14} />
          </a>
        </div>
      </footer>
      <dialog
        ref={detailDialog}
        className="detail-dialog"
        aria-labelledby="destination-name"
        onCancel={() => setDetail(null)}
        onClose={() => setDetail(null)}
        onKeyDown={trapDialogFocus}
        onClick={(e) => closeOnBackdrop(e, () => setDetail(null))}
      >
        {detail && (
          <>
            <button
              className="dialog-close"
              aria-label="关闭目的地详情"
              onClick={() => setDetail(null)}
            >
              <X />
            </button>
            <div className="detail-art">
              <Scene kind={detail.art} variant={detail.color} />
            </div>
            <div className="detail-copy">
              <span className="eyebrow">
                {detail.province} / {detail.en}
              </span>
              <h2 id="destination-name">去{detail.name}，慢慢走。</h2>
              <p>{detail.description}</p>
              <h3>可以这样度过</h3>
              <ul>
                {detail.highlights.map((h) => (
                  <li key={h}>
                    <Check size={14} />
                    {h}
                  </li>
                ))}
              </ul>
              <div className="detail-season">
                <Sun size={16} />
                <span>{detail.season}</span>
              </div>
              <button className="button-orange" onClick={() => planFor(detail.id)}>
                把这里放进行程 <ArrowRight size={17} />
              </button>
              <small>路线仅作规划灵感；出行条件、开放与安全信息需另行核验。</small>
            </div>
          </>
        )}
      </dialog>
      <dialog
        ref={summaryDialog}
        className="summary-dialog"
        aria-labelledby="summary-title"
        onCancel={() => setSummary(false)}
        onClose={() => setSummary(false)}
        onKeyDown={trapDialogFocus}
        onClick={(e) => closeOnBackdrop(e, () => setSummary(false))}
      >
        <button
          className="dialog-close"
          aria-label="关闭行程草案"
          onClick={() => setSummary(false)}
        >
          <X />
        </button>
        <span className="eyebrow">YOUR NEXT CHAPTER / LOCAL DRAFT</span>
        <h2 id="summary-title">{current.name}，我们来了。</h2>
        <div className="summary-chips">
          <span>
            <MapPin size={14} />
            {current.name}
          </span>
          <span>{people} 人同行</span>
          <span>{days} 天漫游</span>
        </div>
        <div className="summary-budget">
          <span>参考总预算</span>
          <strong>¥{total.toLocaleString('zh-CN')}</strong>
          <small>
            （¥{current.daily} × {days} 天 + ¥{current.transport}）× {people} 人
          </small>
        </div>
        <ol className="day-list">
          {Array.from({ length: days }, (_, i) => (
            <li key={i}>
              <span>DAY {String(i + 1).padStart(2, '0')}</span>
              <p>{dayPlan(i + 1)}</p>
            </li>
          ))}
        </ol>
        <p className="summary-note">
          这是一份可调整的本地草案，金额是演示参考值，没有进行真实预订。交通、天气、签证和开放时间请出发前核验。
        </p>
        <button className="button-orange" onClick={downloadPlan}>
          {downloaded ? '再次下载草案' : '下载 Markdown 草案'}
          <Download size={18} />
        </button>
        <p className="download-status" role="status">
          {downloaded ? '草案已生成下载，可离线编辑与保存。' : '你的行程只留在你的浏览器中。'}
        </p>
      </dialog>
    </>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
