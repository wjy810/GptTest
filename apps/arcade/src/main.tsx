import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Download,
  Gamepad2,
  Heart,
  Menu,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react'
import './styles.css'

type Score = { ms: number; date: string; mode: string }
const games = [
  {
    id: 'reflex',
    name: 'REFLEX.EXE',
    type: '手速挑战',
    tag: 'PLAYABLE',
    color: 'lime',
    symbol: '⚡',
    desc: '等待信号，抓住那一瞬间。你的反应有多快？',
    rules:
      '点击开始后等待画面变绿，再尽快点击。提前点击不会计分。切换标签页将取消当前轮，保证结果尽量公平。',
    label: '立即挑战',
  },
  {
    id: 'orbit',
    name: 'ORBIT SHIFT',
    type: '脑力实验',
    tag: 'CONCEPT',
    color: 'purple',
    symbol: '✳',
    desc: '在变化的轨道里，为小小星球找到自己的位置。',
    rules:
      '规则概念：旋转同心轨道，让相同颜色的卫星排成一线。每次操作会同时影响相邻轨道。此卡为游戏概念与规则预览，尚未实现游戏。',
    label: '看看规则',
  },
  {
    id: 'stack',
    name: 'STACK ATTACK',
    type: '手速挑战',
    tag: 'CONCEPT',
    color: 'pink',
    symbol: '▧',
    desc: '一个接一个，叠出你的小小野心。别让它倒下。',
    rules:
      '规则概念：在移动方块经过平台时点击放置，超出边缘的部分会被切掉，剩余面积成为下一层的平台。此卡为规则预览，尚未实现游戏。',
    label: '看看规则',
  },
  {
    id: 'maze',
    name: 'NO WAY OUT?',
    type: '脑力实验',
    tag: 'CONCEPT',
    color: 'blue',
    symbol: '↗',
    desc: '出口一直都在。只不过，有时需要换个方向想。',
    rules:
      '规则概念：旋转迷宫，利用重力让光点到达出口。每一关限制旋转次数。此卡为规则预览，尚未实现游戏。',
    label: '看看规则',
  },
]
function loadScores(): Score[] {
  try {
    const data = JSON.parse(localStorage.getItem('p1xel-scores') ?? '[]')
    return Array.isArray(data)
      ? data
          .filter(
            (s) =>
              Number.isFinite(s.ms) &&
              s.ms > 0 &&
              typeof s.date === 'string' &&
              typeof s.mode === 'string',
          )
          .slice(0, 30)
      : []
  } catch {
    return []
  }
}
function PixelAlien({ variant = 0 }: { variant?: number }) {
  const pixels = variant
    ? [
        '00100100',
        '00011000',
        '00111100',
        '01111110',
        '11011011',
        '11111111',
        '10100101',
        '00100100',
      ]
    : [
        '00100100',
        '00011000',
        '00111100',
        '01111110',
        '11011011',
        '11111111',
        '00100100',
        '01000010',
      ]
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      {pixels.flatMap((row, y) =>
        [...row].map((v, x) =>
          v === '1' ? (
            <rect key={`${x}-${y}`} x={x * 10} y={y * 10} width="10" height="10" />
          ) : null,
        ),
      )}
    </svg>
  )
}
function PixelStar() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M12 0h8v8h4v4h8v8h-8v4h-4v8h-8v-8H8v-4H0v-8h8V8h4Z" fill="currentColor" />
    </svg>
  )
}
function App() {
  const [menu, setMenu] = useState(false)
  const [filter, setFilter] = useState('全部游戏')
  const [selected, setSelected] = useState<(typeof games)[number] | null>(null)
  const [phase, setPhase] = useState<
    'idle' | 'waiting' | 'ready' | 'early' | 'result' | 'cancelled'
  >('idle')
  const [mode, setMode] = useState('标准')
  const [scores, setScores] = useState<Score[]>(loadScores)
  const [last, setLast] = useState<number | null>(null)
  const [storageNote, setStorageNote] = useState('')
  const [faq, setFaq] = useState<number | null>(0)
  const [savedGames, setSavedGames] = useState<string[]>([])
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const readyAt = useRef(0)
  const gameButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const best = scores.length ? Math.min(...scores.map((s) => s.ms)) : null
  const avg = scores.length
    ? Math.round(scores.slice(0, 5).reduce((sum, s) => sum + s.ms, 0) / Math.min(scores.length, 5))
    : null

  useEffect(() => {
    selected ? dialog.current?.showModal() : dialog.current?.close()
  }, [selected])
  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current)
    },
    [],
  )
  useEffect(() => {
    const cancel = () => {
      if (document.hidden && (phase === 'waiting' || phase === 'ready')) {
        if (timeout.current) clearTimeout(timeout.current)
        setPhase('cancelled')
      }
    }
    document.addEventListener('visibilitychange', cancel)
    return () => document.removeEventListener('visibilitychange', cancel)
  }, [phase])

  function play() {
    if (phase === 'waiting') {
      if (timeout.current) clearTimeout(timeout.current)
      setPhase('early')
      return
    }
    if (phase === 'ready') {
      const ms = Math.max(1, Math.round(performance.now() - readyAt.current))
      setLast(ms)
      const next = [{ ms, date: new Date().toISOString(), mode }, ...scores].slice(0, 30)
      setScores(next)
      setPhase('result')
      try {
        localStorage.setItem('p1xel-scores', JSON.stringify(next))
        setStorageNote('')
      } catch {
        setStorageNote('浏览器未允许本地保存，本次成绩仍可在当前页面查看。')
      }
      return
    }
    setPhase('waiting')
    setLast(null)
    const delay = mode === '标准' ? 1500 + Math.random() * 2500 : 2500 + Math.random() * 3000
    timeout.current = setTimeout(() => {
      readyAt.current = performance.now()
      setPhase('ready')
    }, delay)
  }
  function reset() {
    if (timeout.current) clearTimeout(timeout.current)
    setPhase('idle')
    setLast(null)
  }
  function clearScores() {
    setScores([])
    try {
      localStorage.removeItem('p1xel-scores')
    } catch {
      setStorageNote('无法清除浏览器存储；当前页面成绩已清空。')
    }
  }
  function goPlay() {
    document
      .getElementById('play')
      ?.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      })
    gameButton.current?.focus({ preventScroll: true })
  }
  function download() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            game: 'REFLEX.EXE',
            device: 'Browser-local reaction test; not a standardized measurement',
            scores,
            best,
            averageLastFive: avg,
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'p1xel-scorecard.json'
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="pixel-site">
      <a href="#main" className="skip-link">
        跳到主要内容
      </a>
      <nav className="nav shell" aria-label="主导航">
        <a href="#" className="brand">
          <Gamepad2 strokeWidth={2.4} /> P1XEL<span>®</span>
        </a>
        <div className={`nav-links ${menu ? 'open' : ''}`}>
          <a href="#games" onClick={() => setMenu(false)}>
            游戏大厅
          </a>
          <a href="#play" onClick={() => setMenu(false)}>
            即刻挑战 <span>LIVE</span>
          </a>
          <a href="#scoreboard" onClick={() => setMenu(false)}>
            我的战绩
          </a>
        </div>
        <button className="nav-play" onClick={goPlay}>
          LET'S PLAY <ArrowUpRight size={16} />
        </button>
        <button
          className="menu-button"
          onClick={() => setMenu(!menu)}
          aria-label={menu ? '关闭导航' : '打开导航'}
          aria-expanded={menu}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </nav>
      <main id="main">
        <section className="hero shell">
          <div className="hero-top">
            <span>
              <i /> INDEPENDENT ARCADE CLUB
            </span>
            <span>NO DOWNLOADS. JUST GOOD TIMES.</span>
          </div>
          <div className="hero-main">
            <div className="hero-copy">
              <span className="hero-overline">PRESS PAUSE ON THE ORDINARY.</span>
              <h1>
                ONE MORE
                <br />
                <span>ROUND.</span>
                <i>↗</i>
              </h1>
              <p>
                生活已经够认真。
                <br />
                来这里，认真玩一会儿。
              </p>
              <div className="hero-actions">
                <button className="button-lime" onClick={goPlay}>
                  <Play size={16} fill="currentColor" /> 开始反应挑战 <ArrowRight size={18} />
                </button>
                <a href="#games">
                  去游戏大厅 <ArrowDown size={15} />
                </a>
              </div>
              <div className="hero-meta">
                <span>
                  <Zap size={12} /> 即点即玩
                </span>
                <span>
                  <Heart size={12} /> 不用氪金
                </span>
                <span>
                  <Gamepad2 size={13} /> 键盘 / 触屏
                </span>
              </div>
            </div>
            <div className="hero-art" aria-label="像素外星人与霓虹街机图形">
              <div className="art-grid" />
              <span className="art-coordinate">X: 088 / Y: 128</span>
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="alien-shadow">
                <PixelAlien />
              </div>
              <div className="alien-main">
                <PixelAlien />
              </div>
              <div className="floating-badge">
                <Zap size={16} fill="currentColor" /> SMALL GAMES.
                <br />
                BIG ENERGY.
              </div>
              <span className="art-star">
                <PixelStar />
              </span>
              <span className="art-plus">+</span>
              <div className="player-status">
                <span>
                  <i /> PLAYER 01
                </span>
                <b>READY TO PLAY_</b>
              </div>
              <span className="art-corner">[ INSERT CURIOSITY ]</span>
            </div>
          </div>
        </section>
        <div className="ticker" aria-hidden="true">
          <span>PLAY IS A SERIOUS THING</span>
          <span>
            <PixelStar />
          </span>
          <span>没别的，就玩一下</span>
          <span>
            <PixelStar />
          </span>
          <span>ONE MORE ROUND</span>
          <span>
            <PixelStar />
          </span>
          <span>PLAY IS A SERIOUS THING</span>
        </div>
        <section className="section shell games" id="games">
          <div className="section-heading">
            <div>
              <span className="eyebrow">01 / PICK YOUR PLAY</span>
              <h2>
                你的下一局，<span>在这里。</span>
              </h2>
            </div>
            <p>
              1 个可玩挑战 + 3 个规则概念。
              <br />
              小小的游戏，大大的好奇心。
            </p>
          </div>
          <div className="games-toolbar">
            <div className="filters">
              {['全部游戏', '手速挑战', '脑力实验', '已收藏'].map((f) => (
                <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f}
                  {f === '已收藏' && savedGames.length > 0 ? ` (${savedGames.length})` : ''}
                </button>
              ))}
            </div>
            <span>CHOOSE YOUR NEXT DISTRACTION ↙</span>
          </div>
          <div className="game-grid">
            {games
              .filter(
                (g) =>
                  filter === '全部游戏' ||
                  filter === g.type ||
                  (filter === '已收藏' && savedGames.includes(g.id)),
              )
              .map((g, i) => (
                <article className={`game-card ${g.color}`} key={g.id}>
                  <button
                    className="game-art"
                    aria-label={g.id === 'reflex' ? '开始 REFLEX.EXE 挑战' : `查看 ${g.name} 规则`}
                    onClick={() => (g.id === 'reflex' ? goPlay() : setSelected(g))}
                  >
                    <span className="game-tag">
                      {g.tag === 'PLAYABLE' && <i />}
                      {g.tag}
                    </span>
                    <div className={`game-illustration illustration-${g.id}`}>
                      {g.id === 'reflex' ? (
                        <PixelAlien variant={1} />
                      ) : g.id === 'orbit' ? (
                        <>
                          <i />
                          <i />
                          <i />
                          <b />
                        </>
                      ) : g.id === 'stack' ? (
                        <>
                          <i />
                          <i />
                          <i />
                          <i />
                          <i />
                        </>
                      ) : (
                        <>
                          <i />
                          <b>?</b>
                          <span>↗</span>
                        </>
                      )}
                    </div>
                    <span className="game-art-name">{g.name}</span>
                    <span className="game-open">
                      <ArrowUpRight size={22} />
                    </span>
                  </button>
                  <div className="game-title">
                    <div>
                      <span>
                        {g.type} / {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3>{g.name}</h3>
                    </div>
                    <button
                      className="heart-button"
                      aria-label={`${savedGames.includes(g.id) ? '取消收藏' : '收藏'} ${g.name}`}
                      aria-pressed={savedGames.includes(g.id)}
                      onClick={() =>
                        setSavedGames((list) =>
                          list.includes(g.id) ? list.filter((id) => id !== g.id) : [...list, g.id],
                        )
                      }
                    >
                      <Heart size={18} fill={savedGames.includes(g.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <p>{g.desc}</p>
                  <button
                    className="game-link"
                    onClick={() => (g.id === 'reflex' ? goPlay() : setSelected(g))}
                  >
                    {g.label}
                    <ArrowRight size={14} />
                  </button>
                </article>
              ))}
          </div>
          {filter === '已收藏' && savedGames.length === 0 && (
            <div className="empty-state">
              <Heart size={25} />
              <p>这里暂时空空的。点亮游戏旁的爱心，留下下一次想玩的。</p>
              <button onClick={() => setFilter('全部游戏')}>
                回到游戏大厅 <ArrowRight size={15} />
              </button>
            </div>
          )}
        </section>
        <section className="play-section" id="play">
          <div className="shell">
            <div className="section-heading">
              <div>
                <span className="eyebrow">02 / THE REAL CHALLENGE</span>
                <h2>
                  别眨眼。<span>就是现在。</span>
                </h2>
              </div>
              <span className="live-tag">
                <i /> PLAYABLE IN YOUR BROWSER
              </span>
            </div>
            <div className="play-layout">
              <div className="arcade-machine">
                <div className="machine-top">
                  <span>
                    <Zap size={14} /> REFLEX.EXE
                  </span>
                  <span>LOCAL PLAYER 01</span>
                  <button onClick={reset} aria-label="重置当前挑战">
                    <RotateCcw size={15} />
                  </button>
                </div>
                <button
                  ref={gameButton}
                  className={`game-screen phase-${phase}`}
                  onClick={play}
                  aria-label={
                    phase === 'waiting'
                      ? '等待变绿，提前点击会失败'
                      : phase === 'ready'
                        ? '立即点击记录反应时间'
                        : '开始下一轮反应挑战'
                  }
                >
                  <span className="screen-label">
                    {phase === 'ready' ? 'SIGNAL DETECTED' : 'THE REACTION TEST'}
                  </span>
                  <div className="screen-content">
                    {phase === 'idle' ? (
                      <>
                        <div className="screen-icon">
                          <Zap size={43} />
                        </div>
                        <strong>READY?</strong>
                        <p>等待变绿，然后尽快点击。</p>
                        <span className="screen-cta">
                          CLICK TO START <ChevronRight size={17} />
                        </span>
                      </>
                    ) : phase === 'waiting' ? (
                      <>
                        <div className="wait-symbol">···</div>
                        <strong>WAIT FOR IT.</strong>
                        <p>稳住，等画面变绿。</p>
                        <span className="screen-small">DON'T CLICK YET.</span>
                      </>
                    ) : phase === 'ready' ? (
                      <>
                        <Zap size={55} fill="currentColor" />
                        <strong>NOW!</strong>
                        <p>点击！</p>
                      </>
                    ) : phase === 'result' ? (
                      <>
                        <Trophy size={36} />
                        <strong className="score-result">
                          {last}
                          <small>ms</small>
                        </strong>
                        <p>
                          {last! < 250
                            ? '漂亮。比眨眼还快一点。'
                            : last! < 400
                              ? '不错！下一局还能更快。'
                              : '别急。找到你的节奏，再来一次。'}
                        </p>
                        <span className="screen-cta">
                          ONE MORE ROUND <ArrowRight size={16} />
                        </span>
                      </>
                    ) : phase === 'early' ? (
                      <>
                        <X size={43} />
                        <strong>TOO SOON.</strong>
                        <p>抢跑啦。等绿色信号再点击。</p>
                        <span className="screen-cta">
                          TRY AGAIN <RotateCcw size={15} />
                        </span>
                      </>
                    ) : (
                      <>
                        <RotateCcw size={38} />
                        <strong>PAUSED.</strong>
                        <p>切换了页面，这一轮已取消。</p>
                        <span className="screen-cta">
                          COME BACK & PLAY <ArrowRight size={16} />
                        </span>
                      </>
                    )}
                  </div>
                  <span className="screen-bottom">CLICK · TAP · ENTER · SPACE</span>
                </button>
                <div className="machine-bottom">
                  <div>
                    <span className="machine-light" />
                    <span>POWER ON</span>
                  </div>
                  <span>NO COINS REQUIRED.</span>
                  <span>VOL. 01</span>
                </div>
              </div>
              <aside className="challenge-info">
                <span className="challenge-index">GAME / 001</span>
                <h3>
                  你和信号之间，
                  <br />
                  差了多少毫秒？
                </h3>
                <p>
                  没有复杂规则。只要一点耐心、
                  <br />
                  一点专注，和刚刚好的那一下。
                </p>
                <div className="mode-picker">
                  <span>等待节奏</span>
                  <div>
                    {['标准', '耐心'].map((m) => (
                      <button
                        key={m}
                        aria-pressed={mode === m}
                        disabled={phase === 'waiting' || phase === 'ready'}
                        onClick={() => {
                          setMode(m)
                          reset()
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <ol>
                  <li>
                    <span>01</span>
                    <div>
                      <b>点击画面开始</b>
                      <p>也可以用 Enter 或空格。</p>
                    </div>
                  </li>
                  <li>
                    <span>02</span>
                    <div>
                      <b>等待画面变成绿色</b>
                      <p>提前点击会判定为抢跑。</p>
                    </div>
                  </li>
                  <li>
                    <span>03</span>
                    <div>
                      <b>尽快点击，记录成绩</b>
                      <p>最好成绩保存在当前浏览器。</p>
                    </div>
                  </li>
                </ol>
                <div className="measurement-note">
                  <Sparkles size={15} />
                  <p>
                    反应时间受设备、浏览器和输入方式影响。结果仅供趣味比较，不是标准化能力测量。
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>
        <section className="section shell scoreboard" id="scoreboard">
          <div className="section-heading">
            <div>
              <span className="eyebrow">03 / YOU VS. YESTERDAY YOU</span>
              <h2>
                最好的对手，<span>是上一局的你。</span>
              </h2>
            </div>
            <button className="export-button" onClick={download} disabled={!scores.length}>
              导出成绩单 <Download size={16} />
            </button>
          </div>
          <div className="score-layout">
            <div className="score-stats">
              <article>
                <Trophy size={24} />
                <span>PERSONAL BEST</span>
                <strong>
                  {best ?? '—'}
                  <small>{best ? 'ms' : ''}</small>
                </strong>
                <p>你的本地最好成绩</p>
              </article>
              <article>
                <Zap size={23} />
                <span>RECENT AVERAGE</span>
                <strong>
                  {avg ?? '—'}
                  <small>{avg ? 'ms' : ''}</small>
                </strong>
                <p>最近 {Math.min(scores.length, 5)} 轮平均成绩</p>
              </article>
            </div>
            <div className="score-table">
              <div className="score-table-head">
                <span>RECENT ROUNDS</span>
                <span>只属于你的本地战绩</span>
              </div>
              {scores.length ? (
                <>
                  <div className="score-columns">
                    <span>轮次</span>
                    <span>模式</span>
                    <span>反应时间</span>
                  </div>
                  {scores.slice(0, 5).map((s, i) => (
                    <div className="score-row" key={`${s.date}-${i}`}>
                      <span>
                        {String(i + 1).padStart(2, '0')}
                        <small>{i === 0 ? 'LATEST' : ''}</small>
                      </span>
                      <span>{s.mode}</span>
                      <b>
                        {s.ms} <small>ms</small>
                        {s.ms === best && <Trophy size={13} />}
                      </b>
                    </div>
                  ))}
                  <button className="clear-scores" onClick={clearScores}>
                    清空本地成绩 <RotateCcw size={11} />
                  </button>
                </>
              ) : (
                <div className="empty-scores">
                  <span>_ _ _</span>
                  <p>第一条纪录，等你来写。</p>
                  <button onClick={goPlay}>
                    开始第一局 <ArrowUpRight size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="storage-note" role="status">
            {storageNote ||
              '成绩最多保留 30 轮，仅存于当前浏览器。没有虚构玩家，也没有全球排行榜。'}
          </p>
        </section>
        <section className="club shell">
          <div>
            <span className="eyebrow">THE P1XEL STATE OF MIND</span>
            <h2>
              GROW UP.
              <br />
              <span>STAY PLAYFUL.</span>
            </h2>
          </div>
          <div className="club-copy">
            <div className="club-alien">
              <PixelAlien />
            </div>
            <p>
              我们相信，玩不是浪费时间。
              <br />
              它是给好奇心的一点空间，
              <br />
              是认真生活之外的一点不认真。
            </p>
            <p>
              小小的挑战、即时的反馈、
              <br />
              再来一次的冲动。这就够了。
            </p>
            <span>BUILT WITH CURIOSITY. PLAYED WITH JOY.</span>
          </div>
        </section>
        <section className="section shell faq">
          <div>
            <span className="eyebrow">BEFORE YOUR NEXT ROUND</span>
            <h2>
              还有一点<span>小问题。</span>
            </h2>
          </div>
          <div className="faq-list">
            {[
              [
                '所有游戏都可以玩吗？',
                '目前 REFLEX.EXE 反应挑战可直接游玩。ORBIT SHIFT、STACK ATTACK、NO WAY OUT? 为视觉与规则概念卡片，点击可以查看规则，尚未实现游戏。',
              ],
              [
                '我的成绩保存在哪里？',
                '成绩通过 localStorage 保存于当前浏览器，最多保留 30 轮。切换设备或清除浏览器数据后不会同步。可使用“导出成绩单”下载 JSON 文件。',
              ],
              [
                '如何获得更稳定的成绩？',
                '使用相同设备和输入方式比较。等画面变绿再点击；提前点击不计成绩。浏览器切换到后台会取消本轮。结果包含渲染与输入延迟，仅供趣味参考。',
              ],
            ].map(([q, a], i) => (
              <div className={`faq-item ${faq === i ? 'faq-open' : ''}`} key={q}>
                <button
                  onClick={() => setFaq(faq === i ? null : i)}
                  aria-expanded={faq === i}
                  aria-controls={`faq-${i}`}
                >
                  {q}
                  <Plus size={18} />
                </button>
                <p id={`faq-${i}`} hidden={faq !== i}>
                  {a}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="closing shell">
          <span>THAT'S ENOUGH READING.</span>
          <h2>
            LET'S <span>PLAY.</span>
            <i>↗</i>
          </h2>
          <button className="button-lime" onClick={goPlay}>
            <Gamepad2 size={20} /> 再来一局 <ArrowRight size={18} />
          </button>
          <p>你知道你还想再试一次。</p>
        </section>
      </main>
      <footer className="footer shell">
        <a className="brand" href="#">
          <Gamepad2 /> P1XEL<span>®</span>
        </a>
        <span>© 2026 P1XEL · 原创街机界面与小游戏实验</span>
        <a href="#">
          BACK TO TOP <ArrowUpRight size={14} />
        </a>
      </footer>
      <dialog
        ref={dialog}
        className="game-dialog"
        aria-labelledby="game-dialog-title"
        onCancel={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelected(null)
        }}
      >
        <button
          className="dialog-close"
          onClick={() => setSelected(null)}
          aria-label="关闭游戏规则"
        >
          <X size={22} />
        </button>
        {selected && (
          <>
            <span className="eyebrow">GAME CONCEPT / RULES PREVIEW</span>
            <h2 id="game-dialog-title">{selected.name}</h2>
            <div className={`dialog-symbol ${selected.color}`}>
              {selected.id === 'orbit' ? <PixelStar /> : selected.symbol}
            </div>
            <p>{selected.rules}</p>
            <span className="dialog-note">当前可直接游玩的挑战是 REFLEX.EXE。</span>
            <button
              className="button-lime"
              onClick={() => {
                setSelected(null)
                goPlay()
              }}
            >
              去玩反应挑战 <ArrowRight size={17} />
            </button>
          </>
        )}
      </dialog>
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
