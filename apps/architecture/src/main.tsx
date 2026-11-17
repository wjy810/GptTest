import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Download,
  Menu,
  Plus,
  X,
} from 'lucide-react'
import './styles.css'

type Scene = 'courtyard' | 'gallery' | 'coast' | 'pavilion'
const projects: {
  id: string
  title: string
  cn: string
  place: string
  year: string
  category: string
  scene: Scene
  area: string
  material: string
  text: string
  idea: string
}[] = [
  {
    id: '01',
    title: 'The Quiet Courtyard',
    cn: '静庭',
    place: 'KYOTO, JAPAN',
    year: '2026',
    category: '居住',
    scene: 'courtyard',
    area: '286 m²',
    material: '清水混凝土 / 橡木 / 玻璃',
    text: '把一座庭院放在生活的中心。房间围绕光线展开，日常的路径与季节的变化在这里相遇。建筑保持安静，让居住者的生活成为主角。',
    idea: '我们将体量拆成两个相互错动的盒子，用一条通透的走廊连接。中央的水面把天空带入室内，深檐调节光线，也为雨天留出一段可以停留的边界。',
  },
  {
    id: '02',
    title: 'A Place for Light',
    cn: '光的居所',
    place: 'COPENHAGEN, DENMARK',
    year: '2025',
    category: '文化',
    scene: 'gallery',
    area: '740 m²',
    material: '石灰抹灰 / 木格栅 / 再生砖',
    text: '一个不急于展示自己的小型艺术空间。连续的墙面、缓慢的转折和可控制的天光，让观看重新成为一件可以慢下来的事。',
    idea: '展厅不是一串被动的容器，而是一条有呼吸的观看路径。每个转角都留出一个休息的位置，朝向庭院的窗口提醒来访者，艺术与日常共享同一束光。',
  },
  {
    id: '03',
    title: 'Between Land & Sea',
    cn: '陆与海之间',
    place: 'JEJU, SOUTH KOREA',
    year: '2025',
    category: '居住',
    scene: 'coast',
    area: '192 m²',
    material: '本地石材 / 白色矿物涂层 / 玻璃',
    text: '在风与海之间，找到一个被庇护的位置。低矮的体量顺着地形展开，让远方的水平线成为室内最重要的一幅画。',
    idea: '建筑没有试图占领海岸，而是向内退让。厚墙围合的入口抵御海风，面海的一侧则完全打开。材料保持朴素，使光、盐与时间成为表面的一部分。',
  },
  {
    id: '04',
    title: 'Under One Roof',
    cn: '同一屋檐下',
    place: 'HANGZHOU, CHINA',
    year: '2024',
    category: '公共',
    scene: 'pavilion',
    area: '420 m²',
    material: '胶合木 / 夯土 / 透水石材',
    text: '一座可以穿过、停留、相遇的社区亭。没有明确的正面，也不规定唯一的使用方式，让每一天的人与活动共同定义空间。',
    idea: '一片延展的屋顶连接四个开放区域。结构以重复而清晰的节奏出现，尺度从城市退回身体。雨水沿屋面流入花园，建筑成为公园循环的一部分。',
  },
]

function ArchitectureScene({ scene, className = '' }: { scene: Scene; className?: string }) {
  const uid = useId().replaceAll(':', '')
  const sky = `${uid}-sky`,
    concrete = `${uid}-concrete`,
    glass = `${uid}-glass`,
    ground = `${uid}-ground`,
    water = `${uid}-water`,
    grain = `${uid}-grain`,
    wall = `${uid}-wall`
  return (
    <svg
      className={`architecture-scene ${className}`}
      viewBox="0 0 1600 900"
      role="img"
      aria-label={`${projects.find((p) => p.scene === scene)?.cn}原创建筑空间概念图`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={scene === 'coast' ? '#b8c6c9' : '#bbc4c3'} />
          <stop offset=".75" stopColor="#e1e0d8" />
          <stop offset="1" stopColor="#f0e9da" />
        </linearGradient>
        <linearGradient id={concrete} x1="0" y1="0" x2=".8" y2="1">
          <stop stopColor="#d5d0c3" />
          <stop offset=".5" stopColor="#b6b2a6" />
          <stop offset="1" stopColor="#8f9287" />
        </linearGradient>
        <linearGradient id={wall} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#bbb7aa" />
          <stop offset=".5" stopColor="#e3ded0" />
          <stop offset="1" stopColor="#ccc7bb" />
        </linearGradient>
        <linearGradient id={glass} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#363e39" />
          <stop offset=".4" stopColor="#687365" />
          <stop offset="1" stopColor="#202c27" />
        </linearGradient>
        <linearGradient id={ground} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#bcbbae" />
          <stop offset="1" stopColor="#dbd8ce" />
        </linearGradient>
        <linearGradient id={water} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#889c96" />
          <stop offset=".45" stopColor="#b5c1b8" />
          <stop offset="1" stopColor="#879a91" />
        </linearGradient>
        <filter id={grain}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope=".06" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </defs>
      <rect width="1600" height="900" fill={`url(#${sky})`} />
      <path
        d="M0 349Q120 310 219 349T410 325T620 362T840 328T1050 356T1290 314T1600 330V640H0Z"
        fill="#8a968a"
        opacity=".4"
      />
      <path
        d="M0 408Q210 355 357 414T642 401T949 398T1260 382T1600 398V700H0Z"
        fill="#7e8a7c"
        opacity=".6"
      />
      <rect y="580" width="1600" height="320" fill={`url(#${ground})`} />
      {scene === 'courtyard' && (
        <g>
          <path d="M1090 288h200l310 185v208l-510-94Z" fill="#8c9084" />
          <path d="M1090 288l260-66 250 117v134l-310-185Z" fill="#cac7ba" />
          <path d="M215 246l723-62 375 175-784 64Z" fill="#dfdbcf" />
          <path d="M215 246l314 177v295L215 538Z" fill="#92978a" />
          <path d="M529 423l784-64v302l-784 57Z" fill={`url(#${concrete})`} />
          <path d="M605 476l604-50v203l-604 48Z" fill={`url(#${glass})`} />
          <path d="M605 476l52-4v197l-52 8Z" fill="#4f5146" />
          <path d="M657 472l157-13v202l-157 12Z" fill="#84775f" opacity=".65" />
          <path d="M680 530l135-10v112l-135 11Z" fill="#ccb89a" opacity=".7" />
          <path d="M883 480l231-20v175l-231 19Z" fill="#829285" opacity=".45" />
          <path d="M884 608l181-13v29l-181 14Z" fill="#b4aa92" />
          <path d="M905 638v17m135-30v17" stroke="#2e342d" strokeWidth="6" />
          {[685, 815, 946, 1077, 1208].map((x, i) => (
            <path key={x} d={`M${x} ${470 - i * 10}v201`} stroke="#2c3730" strokeWidth="7" />
          ))}
          <path d="M529 423l784-64v29l-784 64Z" fill="#b7b5a7" />
          {[480, 548, 615, 683].map((y) => (
            <path key={y} d={`M529 ${y}l784-62`} stroke="#777c6f" strokeWidth=".7" opacity=".5" />
          ))}
          {[750, 970, 1190].map((x) => (
            <path
              key={x}
              d={`M${x} ${405 - (x - 750) * 0.08}v299`}
              stroke="#777c6f"
              strokeWidth=".7"
              opacity=".4"
            />
          ))}
          <path d="M195 570l370 169 820-60-342 187-925-51Z" fill="#abaea0" />
          <path d="M595 735l672-49-225 149-599-25Z" fill={`url(#${water})`} />
          <path d="M595 735l672-49-225 149-599-25Z" fill="#3f5146" opacity=".12" />
          {[754, 774, 795, 818].map((y, i) => (
            <path
              key={y}
              d={`M${570 - i * 33} ${y}l${620 - i * 27} -33`}
              stroke="#e2e7d9"
              strokeWidth="1.2"
              opacity=".35"
            />
          ))}
          <path d="M177 677l353 156-39 21-355-158Z" fill="#c7c7b9" />
          <path d="M136 696v12l355 159v-13Z" fill="#92988a" />
          <path d="M136 714l355 158-41 21L95 736Z" fill="#cecebf" />
          <path d="M1375 574l225 50v45l-225-47Z" fill="#666d5c" />
          <path
            d="M1430 602V330m0 70-55-61m56 94 67-79m-67 25 15-77"
            stroke="#646e5b"
            strokeWidth="7"
            fill="none"
          />
          <g fill="#7b856f">
            <ellipse cx="1397" cy="323" rx="72" ry="35" />
            <ellipse cx="1451" cy="291" rx="64" ry="30" />
            <ellipse cx="1495" cy="341" rx="66" ry="36" />
            <ellipse cx="1430" cy="360" rx="94" ry="36" />
          </g>
        </g>
      )}
      {scene === 'gallery' && (
        <g>
          <path d="M135 310l1113-63 271 136-1106 73Z" fill="#e5dfd0" />
          <path d="M135 310l278 146v251L135 555Z" fill="#a9a99b" />
          <path d="M413 456l1106-73v252l-1106 72Z" fill={`url(#${wall})`} />
          <path d="M490 489l953-61v163l-953 62Z" fill={`url(#${glass})`} />
          {Array.from({ length: 19 }, (_, i) => (
            <path
              key={i}
              d={`M${495 + i * 49} ${486 - i * 3.1}v170l11-.8v-170Z`}
              fill={i % 2 ? '#b1a081' : '#8c7b61'}
            />
          ))}
          <path d="M774 370l230-14 0-112-230 14Z" fill="#ded9ca" />
          <path d="M1004 244l94 47v112l-94-47Z" fill="#a7a798" />
          <path d="M774 258l93-45 231 78-94-47Z" fill="#eee8d7" />
          <path d="M413 707l1106-72 81 100-1101 108-364-162Z" fill="#d0ccbd" />
          <path d="M0 750l450 150h350L0 628Z" fill="#9ba18d" />
          <path d="M0 786l342 114H0Z" fill="#707e65" />
          <path
            d="M1110 694l151-11v14l-151 11Zm11 9v23m124-33v23"
            fill="#6f6654"
            stroke="#6f6654"
            strokeWidth="5"
          />
          <g fill="#4f5b4b">
            <circle cx="730" cy="580" r="7" />
            <path d="M724 589h12l5 33h-8v24h-5v-24h-9Z" />
            <circle cx="754" cy="584" r="6" />
            <path d="M749 592h11l5 27h-7v22h-5v-22h-8Z" />
          </g>
          <path d="M158 579V226m0 68-52-58m52 83 53-75" stroke="#606b58" strokeWidth="9" />
          <g fill="#77816b">
            <ellipse cx="114" cy="215" rx="85" ry="41" />
            <ellipse cx="194" cy="219" rx="73" ry="49" />
            <ellipse cx="152" cy="175" rx="73" ry="36" />
          </g>
        </g>
      )}
      {scene === 'coast' && (
        <g>
          <rect y="400" width="1600" height="210" fill="#8fa5a5" />
          <path
            d="M0 440h1600M0 473h1600M0 511h1600M0 558h1600"
            stroke="#d8e3dc"
            strokeWidth="1.3"
            opacity=".45"
          />
          <path d="M0 590l220-45 110 70 270-50 200 150 330-80 470 155v110H0Z" fill="#8d9283" />
          <path d="M290 390l779-58 262 127-792 72Z" fill="#eee9dc" />
          <path d="M290 390l249 141v206L290 597Z" fill="#babbae" />
          <path d="M539 531l792-72v210l-792 68Z" fill="#e5e1d5" />
          <path d="M609 554l650-59v158l-650 55Z" fill={`url(#${glass})`} />
          {[620, 775, 930, 1085, 1248].map((x, i) => (
            <path key={x} d={`M${x} ${552 - i * 14}v154`} stroke="#747d70" strokeWidth="6" />
          ))}
          <path d="M1020 640l140-12v14l-140 13Z" fill="#b5a78a" />
          <path d="M637 596l122-11v62l-122 11Z" fill="#d2c0a0" opacity=".8" />
          <path d="M275 620l272 142 789-68 73 42-864 100-330-170Z" fill="#b9b6a6" />
          <path d="M545 762l789-68 6 14-795 71Z" fill="#848a7a" />
          <path
            d="M0 719l165-53 114 96 132 20-61 118H0Zm1278 99l150-100 172 95v87h-329Z"
            fill="#656d60"
          />
          <path d="M31 740l112-40 74 57-120-8Zm1280 75l115-64 96 50-109-5Z" fill="#7c8272" />
          <path
            d="M123 723l14-80m-14 80-9-63m1222 147 11-86m-11 86-12-65m159 37 7-70m-7 70-14-53"
            stroke="#52634a"
            strokeWidth="4"
          />
        </g>
      )}
      {scene === 'pavilion' && (
        <g>
          <path d="M0 557Q200 510 370 568T740 542T1150 558T1600 536V900H0Z" fill="#9aa38e" />
          <path d="M138 371l900-150 444 170-915 176Z" fill="#8b7860" />
          <path d="M138 371v32l429 192 915-175v-29L567 567Z" fill="#594e3c" />
          <path d="M204 409l363 163 843-158-372-143Z" fill="#c4b28f" />
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={i}
              d={`M${260 + i * 92} ${429 - i * 16}l363 163`}
              stroke="#7c6b52"
              strokeWidth="11"
            />
          ))}
          {[
            { x: 286, y: 447 },
            { x: 568, y: 573 },
            { x: 852, y: 520 },
            { x: 1135, y: 464 },
            { x: 1360, y: 423 },
          ].map(({ x, y }) => (
            <g key={x}>
              <path d={`M${x} ${y}v199l21 6V${y + 7}Z`} fill="#74634a" />
              <path d={`M${x + 21} ${y + 7}v196l9-2V${y + 4}Z`} fill="#a08b66" />
            </g>
          ))}
          <path d="M244 649l346 158 850-165-337-141Z" fill="#bcb9a4" />
          <path d="M244 649v13l346 160 850-164v-16L590 807Z" fill="#8f9680" />
          <path d="M464 592l257-44 97 45-254 46Z" fill="#a89676" />
          <path d="M464 592v102l100 47V639Z" fill="#8f7e62" />
          <path d="M564 639l254-46v102l-254 46Z" fill="#b8a584" />
          <path d="M927 636l220-41 18 8-221 42Z" fill="#6e5b44" />
          <path d="M952 640v38m193-73v37" stroke="#62533e" strokeWidth="8" />
          <path d="M0 797l249-75 87 39L80 900H0Z" fill="#c8c7b5" />
          <path
            d="M0 510V130m0 100 70-50M1560 590V202m0 77-55-52m56 112 39-41"
            stroke="#5f6b55"
            strokeWidth="14"
          />
          <g fill="#77846b">
            <ellipse cx="25" cy="163" rx="150" ry="83" />
            <ellipse cx="1485" cy="175" rx="125" ry="70" />
            <ellipse cx="1595" cy="205" rx="110" ry="90" />
          </g>
          <g fill="#4d5b49">
            <circle cx="1031" cy="571" r="7" />
            <path d="M1024 580h15l4 34h-9v29h-6v-29h-8Z" />
          </g>
        </g>
      )}
      <rect
        width="1600"
        height="900"
        fill="transparent"
        filter={`url(#${grain})`}
        pointerEvents="none"
      />
      <rect width="1600" height="900" fill="#d6cdb6" opacity=".055" />
    </svg>
  )
}

function keepDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return
  const controls = event.currentTarget.querySelectorAll<HTMLElement>(
    'button:not(:disabled), a[href]',
  )
  const first = controls[0]
  const last = controls[controls.length - 1]
  if (!first) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function App() {
  const [hero, setHero] = useState(0)
  const [filter, setFilter] = useState('全部')
  const [menu, setMenu] = useState(false)
  const [project, setProject] = useState<(typeof projects)[number] | null>(null)
  const [service, setService] = useState('住宅与居住空间')
  const [size, setSize] = useState('100–300 m²')
  const [location, setLocation] = useState('')
  const [idea, setIdea] = useState('')
  const [downloaded, setDownloaded] = useState(false)
  const [formError, setFormError] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const serviceRef = useRef<HTMLSelectElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const active = projects[hero]
  useEffect(() => {
    if (!project) {
      dialog.current?.close()
      return
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.showModal()
    return () => {
      document.body.style.overflow = overflow
    }
  }, [project])
  function downloadBrief(event: React.FormEvent) {
    event.preventDefault()
    if (!location.trim() || idea.trim().length < 8) {
      setFormError(
        !location.trim()
          ? '请填写项目地点，不能只输入空格。'
          : '请用至少 8 个字符描述空间想法，首尾空白不计入。',
      )
      setDownloaded(false)
      requestAnimationFrame(() => errorRef.current?.focus())
      return
    }
    setFormError('')
    const content = `# STILL / 项目初步简报\n\n生成日期：${new Date().toISOString().slice(0, 10)}\n\n项目方向：${service}\n预估面积：${size}\n项目地点：${location.trim()}\n\n## 关于空间的想法\n\n${idea.trim()}\n\n---\n本简报由 STILL 建筑网站设计习作在浏览器本地生成，未发送给任何事务所。\n页面项目为原创虚构概念，不代表已建成建筑。\n`
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'still-project-brief.md'
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
        <a className="logo" href="#" aria-label="STILL首页">
          STILL<span>®</span>
        </a>
        <span className="header-description">
          ARCHITECTURE
          <br />& EVERYDAY LIFE
        </span>
        <nav className={menu ? 'open' : ''} aria-label="主导航">
          <a href="#work" onClick={() => setMenu(false)}>
            作品 <sup>01</sup>
          </a>
          <a href="#practice" onClick={() => setMenu(false)}>
            事务所 <sup>02</sup>
          </a>
          <a href="#journal" onClick={() => setMenu(false)}>
            思考 <sup>03</sup>
          </a>
          <a href="#contact" onClick={() => setMenu(false)}>
            开始对话 <ArrowUpRight size={15} />
          </a>
        </nav>
        <button
          className="menu-button"
          onClick={() => setMenu(!menu)}
          aria-label={menu ? '关闭导航' : '打开导航'}
          aria-expanded={menu}
        >
          {menu ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>
      <main id="main">
        <section className="hero">
          <div className="hero-image">
            <ArchitectureScene scene={active.scene} />
            <span className="hero-vertical">SELECTED SPACES / 2024 — 2026</span>
            <div className="hero-caption">
              <span>SPACE FOR</span>
              <h1>what matters.</h1>
              <p>为重要的日常，留出空间。</p>
            </div>
            <button
              className="hero-open"
              onClick={() => setProject(active)}
              aria-label={`查看${active.cn}项目`}
            >
              <ArrowUpRight size={25} />
            </button>
            <span className="hero-image-note">ORIGINAL SPATIAL STUDY / SVG</span>
          </div>
          <div className="hero-information">
            <div aria-live="polite" aria-atomic="true">
              <span className="hero-index">{active.id} / 04</span>
              <button onClick={() => setProject(active)}>
                {active.title}
                <span>{active.cn}</span>
              </button>
            </div>
            <span>
              {active.place} / {active.year}
            </span>
            <div className="hero-controls">
              <button onClick={() => setHero((hero + 3) % 4)} aria-label="上一个建筑项目">
                <ArrowLeft size={18} />
              </button>
              <button onClick={() => setHero((hero + 1) % 4)} aria-label="下一个建筑项目">
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
        <section className="intro content">
          <span className="section-number">01 / OUR APPROACH</span>
          <div>
            <h2>
              Architecture begins
              <br />
              with <em>paying attention.</em>
            </h2>
            <div className="intro-bottom">
              <p>
                我们关注光如何进入房间，
                <br />
                材料如何随时间变化，
                <br />
                以及人如何在空间里自在地生活。
              </p>
              <p>
                STILL 是一个关于建筑与日常的设计研究。
                <br />
                以克制的形式回应具体的生活，
                <br />
                让建筑成为安静而持久的背景。
              </p>
              <a href="#work" aria-label="浏览精选作品">
                <ArrowDown size={25} />
              </a>
            </div>
          </div>
        </section>
        <section className="work content" id="work">
          <div className="section-top">
            <span className="section-number">02 / SELECTED WORK</span>
            <div className="work-title">
              <h2>一些关于空间的回答。</h2>
              <span>FOUR SPATIAL STUDIES</span>
            </div>
            <div className="filters" role="group" aria-label="项目类别">
              {['全部', '居住', '文化', '公共'].map((f) => (
                <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f}
                  <sup>
                    {f === '全部'
                      ? '04'
                      : String(projects.filter((p) => p.category === f).length).padStart(2, '0')}
                  </sup>
                </button>
              ))}
            </div>
          </div>
          <div className="project-gallery">
            {projects
              .filter((p) => filter === '全部' || p.category === filter)
              .map((p) => (
                <article className={`project project-scene-${p.scene}`} key={p.id}>
                  <button
                    className="project-image"
                    onClick={() => setProject(p)}
                    aria-label={`了解${p.cn}项目`}
                  >
                    <ArchitectureScene scene={p.scene} />
                    <span className="image-corner">{p.id} / STILL</span>
                    <span className="project-arrow">
                      <ArrowUpRight size={23} />
                    </span>
                  </button>
                  <div className="project-caption">
                    <span>{p.id}</span>
                    <div>
                      <button onClick={() => setProject(p)}>
                        <h3>{p.title}</h3>
                        <span>
                          {p.cn} / {p.category}
                        </span>
                      </button>
                    </div>
                    <span>
                      {p.place}
                      <small>{p.year}</small>
                    </span>
                  </div>
                </article>
              ))}
          </div>
          <div className="work-note">
            <span>每一处空间，都从一个具体的生活问题开始。</span>
            <span>原创概念项目 · 非已建成作品</span>
          </div>
        </section>
        <section className="practice" id="practice">
          <div className="content practice-inner">
            <span className="section-number">03 / THE PRACTICE</span>
            <div className="practice-main">
              <div className="practice-copy">
                <span className="eyebrow">LESS, WITH REASON.</span>
                <h2>
                  不急于表达。
                  <br />
                  先认真<span>理解。</span>
                </h2>
                <p>
                  我们相信，好的空间不需要时时刻刻
                  <br />
                  提醒你它的存在。它应该顺着日常生长，
                  <br />
                  在被使用、被触摸、被记忆中变得完整。
                </p>
                <p>
                  从一间房，到一处公共空间，
                  <br />
                  我们用同样的耐心，寻找恰当的尺度。
                </p>
                <a href="#contact">
                  谈谈你的空间 <ArrowUpRight size={18} />
                </a>
              </div>
              <div className="practice-study">
                <ArchitectureScene scene="pavilion" />
                <span>STUDY 004 / STRUCTURE, SHADE & SHARED LIFE</span>
              </div>
            </div>
            <div className="principles">
              {[
                [
                  'I',
                  '光，是第一种材料。',
                  'LIGHT',
                  '让自然光引导空间的秩序。不是越亮越好，而是每一个时刻，都有恰当的光。',
                ],
                [
                  'II',
                  '材料，有自己的时间。',
                  'MATERIAL',
                  '选择可以诚实变老的材料，让触感、纹理与使用痕迹成为建筑的一部分。',
                ],
                [
                  'III',
                  '生活，始终在中心。',
                  'LIFE',
                  '先理解人的行为与需要，再决定形式。空间的价值，最终由日常生活来回答。',
                ],
              ].map(([n, t, en, p]) => (
                <article key={n}>
                  <span>{n}</span>
                  <h3>{t}</h3>
                  <small>{en}</small>
                  <p>{p}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="journal content" id="journal">
          <div className="journal-heading">
            <span className="section-number">04 / FIELD NOTES</span>
            <h2>
              在设计之外，
              <br />
              <em>继续观察。</em>
            </h2>
            <p>关于光、材料与日常的一些笔记。</p>
          </div>
          <div className="notes">
            {[
              [
                '01',
                '关于留白',
                'ON EMPTINESS',
                '空，不是没有。',
                '留白意味着让空间保有被不同生活使用的可能。一处没有预设用途的角落，可以是阅读的位置，也可以是一场临时的谈话。设计的工作，有时是决定在哪里停下来。',
              ],
              [
                '02',
                '慢一点的材料',
                'MATERIAL & TIME',
                '让时间参与设计。',
                '木材会变深，铜会氧化，石头会留下行走的痕迹。选择材料时，除了完成时的照片，我们更关心十年后的触感。维护与老化，也应成为最初设计的一部分。',
              ],
              [
                '03',
                '身体知道的尺度',
                'THE HUMAN SCALE',
                '先从一个人开始。',
                '一条走廊的宽度、一张窗台的高度、一段台阶的节奏，都与身体有关。在宏大的概念之前，我们先问：一个人走过、坐下、回望时，会有什么感受？',
              ],
            ].map(([n, t, en, subtitle, text]) => (
              <details key={n}>
                <summary>
                  <span>{n}</span>
                  <div>
                    <h3>{t}</h3>
                    <small>{en}</small>
                  </div>
                  <Plus size={19} />
                </summary>
                <div className="note-body">
                  <h4>{subtitle}</h4>
                  <p>{text}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
        <section className="contact content" id="contact">
          <div className="contact-copy">
            <span className="section-number">05 / START A CONVERSATION</span>
            <h2>
              Every space
              <br />
              starts with
              <br />
              <em>a conversation.</em>
            </h2>
            <p>
              你的空间，需要容纳怎样的生活？
              <br />
              先从一个想法开始，不必急着有答案。
            </p>
            <span className="contact-small">项目简报工具 / LOCAL BRIEF BUILDER</span>
          </div>
          <form
            onSubmit={downloadBrief}
            onChange={() => {
              setDownloaded(false)
              setFormError('')
            }}
          >
            {formError && (
              <p ref={errorRef} className="form-error" role="alert" tabIndex={-1}>
                {formError}
              </p>
            )}
            <div className="form-row">
              <label>
                项目方向
                <select
                  ref={serviceRef}
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  {['住宅与居住空间', '文化与艺术空间', '社区与公共空间', '其他空间研究'].map(
                    (v) => (
                      <option key={v}>{v}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                预估面积
                <select value={size} onChange={(e) => setSize(e.target.value)}>
                  {['100 m² 以下', '100–300 m²', '300–1000 m²', '1000 m² 以上', '尚未确定'].map(
                    (v) => (
                      <option key={v}>{v}</option>
                    ),
                  )}
                </select>
              </label>
            </div>
            <label>
              项目地点
              <input
                required
                aria-invalid={formError.includes('地点') || undefined}
                maxLength={120}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="城市 / 地区"
              />
            </label>
            <label>
              关于这个空间，你有什么想法？
              <textarea
                required
                aria-invalid={formError.includes('想法') || undefined}
                minLength={8}
                maxLength={2500}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="你希望在这里发生什么？哪些日常，对你最重要？"
              />
            </label>
            <button className="brief-button" type="submit">
              生成项目简报 <Download size={17} />
            </button>
            <p className="form-note" role="status">
              {downloaded ? (
                <>
                  <Check size={13} /> 简报已下载。你可以保存、编辑或自行分享。
                </>
              ) : (
                '仅在浏览器生成 Markdown 文件，不会向任何人发送信息。'
              )}
            </p>
          </form>
        </section>
      </main>
      <footer className="footer">
        <div className="footer-top content">
          <span>
            THOUGHTFULLY MADE.
            <br />
            QUIETLY PRESENT.
          </span>
          <a href="#">
            回到顶部 <ArrowUpRight size={17} />
          </a>
          <span>
            原创建筑空间设计习作
            <br />
            所有项目均为虚构概念
          </span>
        </div>
        <a className="footer-word" href="#" aria-label="STILL回到首页">
          STILL<span>®</span>
        </a>
        <div className="footer-bottom content">
          <span>© STILL STUDIO 2026</span>
          <span>ARCHITECTURE / SPACE / EVERYDAY LIFE</span>
          <span>MADE WITH ATTENTION.</span>
        </div>
      </footer>
      <dialog
        ref={dialog}
        className="project-dialog"
        aria-labelledby="dialog-title"
        onCancel={() => setProject(null)}
        onClose={() => setProject(null)}
        onKeyDown={keepDialogFocus}
        onClick={(e) => {
          if (e.target !== e.currentTarget) return
          const box = e.currentTarget.getBoundingClientRect()
          if (
            e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom
          )
            setProject(null)
        }}
      >
        <button className="dialog-close" onClick={() => setProject(null)} aria-label="关闭项目详情">
          <X size={22} />
        </button>
        {project && (
          <>
            <ArchitectureScene scene={project.scene} />
            <div className="detail-content">
              <span className="section-number">PROJECT {project.id} / ORIGINAL SPATIAL STUDY</span>
              <h2 id="dialog-title">
                {project.title}
                <span>{project.cn}</span>
              </h2>
              <dl>
                <div>
                  <dt>LOCATION</dt>
                  <dd>{project.place}</dd>
                </div>
                <div>
                  <dt>YEAR / TYPE</dt>
                  <dd>
                    {project.year} / {project.category}
                  </dd>
                </div>
                <div>
                  <dt>AREA</dt>
                  <dd>{project.area}</dd>
                </div>
                <div>
                  <dt>MATERIAL</dt>
                  <dd>{project.material}</dd>
                </div>
              </dl>
              <p className="detail-intro">{project.text}</p>
              <h3>关于空间的想法</h3>
              <p>{project.idea}</p>
              <small>原创虚构建筑概念，尺寸与材料为设计叙事设定；不是施工图或工程建议。</small>
              <a
                href="#contact"
                onClick={() => {
                  dialog.current?.close()
                  setProject(null)
                  requestAnimationFrame(() => serviceRef.current?.focus({ preventScroll: true }))
                }}
              >
                开始你的空间简报 <ArrowUpRight size={17} />
              </a>
            </div>
          </>
        )}
      </dialog>
    </>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
