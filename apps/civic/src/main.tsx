import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Menu,
  X,
  Building2,
  HeartHandshake,
  Bike,
  Trees,
  Home,
  GraduationCap,
  Check,
  Clock3,
  MapPin,
  CalendarDays,
  ChevronDown,
  Accessibility,
  MoveUpRight,
} from 'lucide-react'
import './styles.css'

const services = [
  {
    id: 'residency',
    title: '居住与社区',
    category: '生活服务',
    icon: Home,
    text: '安居登记、社区设施与生活指南。',
    tag: '热门服务',
    duration: '约 20 分钟',
  },
  {
    id: 'health',
    title: '健康关怀',
    category: '健康保障',
    icon: HeartHandshake,
    text: '社区健康咨询与家庭关怀预约。',
    tag: '社区支持',
    duration: '约 30 分钟',
  },
  {
    id: 'mobility',
    title: '绿色出行',
    category: '生活服务',
    icon: Bike,
    text: '骑行地图、公共交通与通行咨询。',
    tag: '绿色城市',
    duration: '约 15 分钟',
  },
  {
    id: 'learning',
    title: '学习与成长',
    category: '教育文化',
    icon: GraduationCap,
    text: '公共课堂、图书馆与终身学习资源。',
    tag: '开放资源',
    duration: '约 20 分钟',
  },
  {
    id: 'parks',
    title: '公园与自然',
    category: '教育文化',
    icon: Trees,
    text: '公共空间使用与自然教育活动。',
    tag: '走进自然',
    duration: '约 15 分钟',
  },
  {
    id: 'business',
    title: '创业与工作',
    category: '工作发展',
    icon: Building2,
    text: '创业指导、职业支持与城市机会。',
    tag: '发展机会',
    duration: '约 30 分钟',
  },
]
const categories = ['全部服务', '生活服务', '健康保障', '教育文化', '工作发展']
const updates = [
  {
    type: '社区活动',
    date: '每周六',
    title: '把周末，还给公园。',
    text: '带上一本书，在树下交换一个故事。社区阅读角欢迎每一个人。',
    theme: 'park',
    detail:
      '概念活动 · 每周六 10:00—12:00，开放公园阅读角。无需预约，带上你喜欢的书即可参与。本网站为虚构展示，没有实际活动报名。',
  },
  {
    type: '公共公告',
    date: '服务更新',
    title: '更多服务，一次就好。',
    text: '用一份清单准备材料，让每一次办事都更从容。',
    theme: 'paper',
    detail:
      '预约前请选择服务类型并填写希望咨询的时间；演示系统只生成本地确认卡，不会发送信息给任何公共机构。',
  },
  {
    type: '城市共建',
    date: '持续开放',
    title: '你的一小步，城市的一大步。',
    text: '从一条步道、一张长椅开始，共同想象更好的社区。',
    theme: 'people',
    detail:
      '城市共建设计实验：发现附近一个可以改善的公共空间，记录使用者、使用时间和实际困难，先理解需求，再提出方案。此处不收集位置或个人信息。',
  },
]

function cityToday() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const value = (type: string) => parts.find((part) => part.type === type)!.value
  return `${value('year')}-${value('month')}-${value('day')}`
}
function scrollToArea(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'start',
  })
}

function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部服务')
  const [menuOpen, setMenuOpen] = useState(false)
  const [service, setService] = useState('residency')
  const [confirmation, setConfirmation] = useState<{
    name: string
    date: string
    time: string
    title: string
  } | null>(null)
  const [activeUpdate, setActiveUpdate] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const serviceRef = useRef<HTMLSelectElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const confirmationRef = useRef<HTMLDivElement>(null)
  const filtered = services.filter(
    (s) =>
      (category === '全部服务' || s.category === category) &&
      `${s.title}${s.text}${s.category}`.includes(query.trim()),
  )
  const showResults = () => {
    scrollToArea('services')
    requestAnimationFrame(() => document.getElementById('services')?.focus({ preventScroll: true }))
  }
  const pickService = (id: string) => {
    setService(id)
    setConfirmation(null)
    setFormError('')
    scrollToArea('appointment')
    requestAnimationFrame(() => serviceRef.current?.focus({ preventScroll: true }))
  }
  const submitBooking = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') || '').trim()
    const date = String(data.get('date') || '')
    const time = String(data.get('time') || '')
    const email = String(data.get('email') || '').trim()
    let error = ''
    if (!name || !email || !data.get('acknowledge'))
      error = '请填写称呼与示例邮箱，并确认本地演示说明。'
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < cityToday())
      error = '预约日期不能早于城市服务时间（UTC+8）的今天。请重新选择日期。'
    else if (!['09:00 – 10:00', '10:00 – 11:00', '14:00 – 15:00', '15:00 – 16:00'].includes(time))
      error = '请选择一个有效的服务时段。'
    if (error) {
      setFormError(error)
      requestAnimationFrame(() => errorRef.current?.focus())
      return
    }
    setFormError('')
    setConfirmation({ name, date, time, title: services.find((s) => s.id === service)!.title })
    requestAnimationFrame(() => confirmationRef.current?.focus())
  }
  return (
    <>
      <a className="skip-link" href="#main">
        跳至主要内容
      </a>
      <div className="public-banner">
        <span>
          <span className="status-dot" />
          开放、友好、人人可及。
        </span>
        <span>公共服务体验设计 · 虚构城市演示</span>
      </div>
      <header className="site-header">
        <a href="#" className="logo" aria-label="OPEN CITY 首页">
          <span className="logo-mark">
            <i />
            <i />
            <i />
          </span>
          OPEN<span>CITY</span>
          <b>开放城市</b>
        </a>
        <button
          ref={menuButtonRef}
          className="menu-toggle"
          aria-label={menuOpen ? '关闭导航' : '打开导航'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setMenuOpen(false)
              menuButtonRef.current?.focus()
            }
          }}
          aria-label="主导航"
          className={menuOpen ? 'is-open' : ''}
        >
          {[
            ['城市服务', '#services'],
            ['城市动态', '#community'],
            ['办事预约', '#appointment'],
            ['常见问题', '#faq'],
          ].map(([title, href]) => (
            <a href={href} key={href} onClick={() => setMenuOpen(false)}>
              {title}
            </a>
          ))}
        </nav>
        <a href="#appointment" className="header-cta">
          让我们帮你 <ArrowUpRight size={16} />
        </a>
      </header>
      <main id="main">
        <section className="hero" aria-labelledby="portal-title">
          <div className="hero-content">
            <p className="eyebrow">
              <span /> 服务就在身边 / YOUR EVERYDAY, MADE EASIER
            </p>
            <h1 id="portal-title">
              让办事，<span>少绕一点路。</span>
            </h1>
            <p className="hero-copy">
              从生活需要出发，找到服务、准备下一步。
              <br className="hero-break" />
              城市，为每一种生活而开。
            </p>
            <form
              className="hero-search"
              onSubmit={(e) => {
                e.preventDefault()
                showResults()
              }}
              role="search"
            >
              <Search size={23} aria-hidden="true" />
              <label className="sr-only" htmlFor="city-search">
                搜索城市服务
              </label>
              <input
                id="city-search"
                ref={searchRef}
                placeholder="输入服务名称，例如：居住、健康、学习"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit">
                查找服务 <ArrowRight size={18} />
              </button>
            </form>
            <div className="quick-links">
              <span>常用服务</span>
              <button
                onClick={() => {
                  setQuery('居住')
                  setCategory('全部服务')
                  showResults()
                }}
              >
                居住登记
              </button>
              <button onClick={() => pickService('health')}>健康咨询</button>
              <button
                onClick={() => {
                  setQuery('学习')
                  setCategory('全部服务')
                  showResults()
                }}
              >
                公共课堂
              </button>
              <a href="#appointment">
                办事预约 <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
          <div className="portal-foot">
            <span>
              <Accessibility size={16} /> 清楚的信息，平等的入口
            </span>
            <span>
              <Clock3 size={16} /> 先了解，再安排
            </span>
            <span>
              <HeartHandshake size={16} /> 从你的需要出发
            </span>
          </div>
        </section>
        <section
          className="services-section content-section"
          id="services"
          tabIndex={-1}
          aria-labelledby="services-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 — HERE TO HELP</p>
              <h2 id="services-title">你需要哪一种帮助？</h2>
            </div>
            <p>
              按生活主题查看服务。
              <br />
              选择一项，即可了解并体验本地预约。
            </p>
          </div>
          <div className="service-toolbar">
            <div className="category-tabs" role="group" aria-label="服务类别">
              {categories.map((c) => (
                <button
                  key={c}
                  className={category === c ? 'active' : ''}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <span className="result-count" aria-live="polite">
              {filtered.length} 项服务
            </span>
          </div>
          {query && (
            <p className="search-summary">
              “{query}” 的搜索结果{' '}
              <button
                onClick={() => {
                  setQuery('')
                  requestAnimationFrame(() => searchRef.current?.focus())
                }}
              >
                清除搜索 ×
              </button>
            </p>
          )}
          <div className="service-grid">
            {filtered.map((s) => (
              <button className="service-card" key={s.id} onClick={() => pickService(s.id)}>
                <span className="service-icon">
                  <s.icon size={28} strokeWidth={1.5} />
                </span>
                <span className="service-tag">{s.tag}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <span className="card-bottom">
                  了解服务与预约 <ArrowUpRight size={19} />
                </span>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <Search size={30} />
              <h3>暂时没有找到这项服务</h3>
              <p>试试“居住”“健康”或“学习”，也可以查看全部服务。</p>
              <button
                className="blue-button"
                onClick={() => {
                  setQuery('')
                  setCategory('全部服务')
                  showResults()
                }}
              >
                查看全部服务
              </button>
            </div>
          )}
        </section>
        <section className="community-section content-section" id="community">
          <div className="section-heading">
            <div>
              <p className="eyebrow">02 — LIFE, TOGETHER</p>
              <h2>城市的好，正在发生。</h2>
            </div>
            <span className="section-note">小小改变，连接更好的日常。</span>
          </div>
          <div className="community-grid">
            {updates.map((update, index) => (
              <article className="update-card" key={update.title}>
                <div className={`update-art ${update.theme}`} aria-hidden="true">
                  {update.theme === 'park' ? (
                    <>
                      <div className="sun" />
                      <div className="tree t1" />
                      <div className="tree t2" />
                      <div className="tree t3" />
                      <span>
                        TAKE A<br />
                        LITTLE BREAK.
                      </span>
                    </>
                  ) : update.theme === 'paper' ? (
                    <>
                      <div className="paper-sheet">
                        <Check />
                        <i />
                        <i />
                        <i />
                        <b>
                          LESS HASSLE.
                          <br />
                          MORE LIVING.
                        </b>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="circle c1" />
                      <div className="circle c2" />
                      <div className="circle c3" />
                      <span>
                        BETTER
                        <br />
                        TOGETHER ↗
                      </span>
                    </>
                  )}
                </div>
                <div className="update-meta">
                  <span>{update.type}</span>
                  <time>{update.date}</time>
                </div>
                <h3>{update.title}</h3>
                <p>{update.text}</p>
                <button
                  className="text-button"
                  aria-expanded={activeUpdate === index}
                  onClick={() => setActiveUpdate(activeUpdate === index ? null : index)}
                >
                  {activeUpdate === index ? '收起详情' : '阅读更多'} <ArrowUpRight size={17} />
                </button>
                {activeUpdate === index && <p className="update-detail">{update.detail}</p>}
              </article>
            ))}
          </div>
        </section>
        <section className="appointment-section" id="appointment">
          <div className="appointment-intro">
            <p className="eyebrow">03 — YOUR TIME MATTERS</p>
            <h2>
              少一点等待。
              <br />
              多一点从容。
            </h2>
            <p>
              提前约好，把时间留给重要的事。
              <br />
              选择服务与时段，我们帮你理清下一步。
            </p>
            <div className="appointment-feature">
              <CalendarDays />
              <div>
                <b>按你的节奏安排</b>
                <span>选择适合的日期与服务时间</span>
              </div>
            </div>
            <div className="appointment-feature">
              <MapPin />
              <div>
                <b>开放城市服务中心</b>
                <span>示例地址 · 中央广场 1 号</span>
              </div>
            </div>
            <div className="demo-notice">
              体验说明：这是一项本地预约演示。使用示例称呼和邮箱即可；信息只保留在当前页面内存中，不会提交给机构。服务日期与时段采用
              UTC+8。
            </div>
          </div>
          <div className="booking-panel">
            {confirmation ? (
              <div
                className="booking-success"
                tabIndex={-1}
                role="region"
                aria-label="本地预约摘要"
                ref={confirmationRef}
              >
                <span className="success-icon">
                  <Check size={30} />
                </span>
                <p className="eyebrow">YOUR NEXT STEP, SORTED.</p>
                <h3>你的演示预约已生成。</h3>
                <p>{confirmation.name}，以下是你的本地预约摘要。</p>
                <dl>
                  <div>
                    <dt>服务项目</dt>
                    <dd>{confirmation.title}</dd>
                  </div>
                  <div>
                    <dt>预约日期</dt>
                    <dd>{confirmation.date}</dd>
                  </div>
                  <div>
                    <dt>时间段</dt>
                    <dd>
                      {confirmation.time}
                      <small>UTC+8 城市服务时间</small>
                    </dd>
                  </div>
                  <div>
                    <dt>演示状态</dt>
                    <dd>仅本地确认 · 未发送</dd>
                  </div>
                </dl>
                <button
                  className="blue-button"
                  onClick={() => {
                    setConfirmation(null)
                    requestAnimationFrame(() => serviceRef.current?.focus())
                  }}
                >
                  重新安排 <ArrowRight size={17} />
                </button>
              </div>
            ) : (
              <form
                onSubmit={submitBooking}
                onChange={() => setFormError('')}
                aria-describedby="form-guidance"
              >
                <div className="form-heading">
                  <h3>预约一段专属时间</h3>
                  <span>
                    <Clock3 size={15} /> 约 1 分钟完成
                  </span>
                </div>
                <p className="form-guidance" id="form-guidance">
                  所有字段均为必填。请使用示例资料；日期和时段均按 UTC+8 城市服务时间计算。
                </p>
                {formError && (
                  <p className="form-error" role="alert" tabIndex={-1} ref={errorRef}>
                    {formError}
                  </p>
                )}
                <label>
                  需要什么帮助？
                  <span className="select-wrap">
                    <select
                      ref={serviceRef}
                      required
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      name="service"
                    >
                      {services.map((s) => (
                        <option value={s.id} key={s.id}>
                          {s.title} · {s.duration}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={17} />
                  </span>
                </label>
                <div className="form-row">
                  <label>
                    如何称呼你
                    <input
                      name="name"
                      placeholder="例如：小林"
                      required
                      maxLength={30}
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    示例邮箱
                    <input
                      type="email"
                      name="email"
                      placeholder="hello@example.com"
                      required
                      autoComplete="off"
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    预约日期
                    <input
                      type="date"
                      name="date"
                      min={cityToday()}
                      required
                      aria-invalid={formError.includes('日期') || undefined}
                    />
                  </label>
                  <label>
                    方便的时段
                    <span className="select-wrap">
                      <select name="time" required>
                        <option value="">选择时间</option>
                        <option>09:00 – 10:00</option>
                        <option>10:00 – 11:00</option>
                        <option>14:00 – 15:00</option>
                        <option>15:00 – 16:00</option>
                      </select>
                      <ChevronDown size={17} />
                    </span>
                  </label>
                </div>
                <label className="check-label">
                  <input type="checkbox" name="acknowledge" required />
                  我了解这只是本地演示，不会形成真实预约。
                </label>
                <button className="blue-button" type="submit">
                  生成演示预约 <ArrowRight size={19} />
                </button>
                <p className="form-footnote">没有合适的时间？你也可以先阅读下方常见问题。</p>
              </form>
            )}
          </div>
        </section>
        <section className="faq-section content-section" id="faq">
          <div>
            <p className="eyebrow">A LITTLE MORE CLARITY</p>
            <h2>你可能还想知道。</h2>
            <p>让每一次出发，都更有把握。</p>
          </div>
          <div className="faq-list">
            {[
              [
                '这些服务是真实的城市服务吗？',
                '不是。OPEN CITY 是公共服务网站的独立设计概念，所有机构、地址与活动均为虚构。这里用于探索清晰的信息架构、服务搜索与无障碍交互。',
              ],
              [
                '预约前需要准备什么？',
                '在这个演示中，你只需要选择服务、日期和时段，并使用示例称呼与邮箱。真实服务通常需要先阅读对应的材料清单，请以当地机构要求为准。',
              ],
              [
                '可以只用键盘浏览网站吗？',
                '可以。使用 Tab 在链接、按钮与输入框之间移动，使用 Enter 激活链接或提交表单，空格可切换复选框。页面顶部提供跳至主要内容的链接。',
              ],
              [
                '我的信息会保存在哪里？',
                '预约信息仅存在当前页面的内存中，不写入本地存储，也不向服务器发送。刷新页面后，预约摘要会清除。',
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <ChevronDown size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="closing-band">
          <span>YOUR CITY. YOUR EVERYDAY.</span>
          <h2>
            好的城市，
            <br className="mobile-break" />
            从照顾每个人开始。
          </h2>
          <a href="#services" aria-label="探索城市服务">
            <MoveUpRight size={38} />
          </a>
        </section>
      </main>
      <footer>
        <div>
          <a href="#" className="logo">
            <span className="logo-mark">
              <i />
              <i />
              <i />
            </span>
            OPEN<span>CITY</span>
          </a>
          <p>城市，为每个人而开。</p>
        </div>
        <div className="footer-links">
          <a href="#services">城市服务</a>
          <a href="#community">城市动态</a>
          <a href="#appointment">办事预约</a>
          <a href="#faq">常见问题</a>
        </div>
        <div className="footer-bottom">
          <span>© 2026 OPEN CITY · 独立公共服务设计实验</span>
          <span>虚构演示 · 无真实政务功能</span>
        </div>
      </footer>
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
