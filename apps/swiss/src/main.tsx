import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowUpRight, ArrowRight, Plus, Minus, X, Check, MoveUpRight } from 'lucide-react'
import './styles.css'

type Exhibition = {
  id: string
  number: string
  name: string
  en: string
  category: string
  artist: string
  description: string
  introduction: string
  className: string
}
const exhibitions: Exhibition[] = [
  {
    id: 'order',
    number: '01',
    name: '秩序的另一面',
    en: 'OTHER SIDE OF ORDER',
    category: '视觉系统 / VISUAL SYSTEMS',
    artist: '林之 / Studio Between',
    introduction: '从重复与偏差中，重新认识视觉秩序。',
    description:
      '当网格开始偏移，秩序会去向哪里？以 64 个可重复的基础单元为起点，探索系统中的变化、偏差与意外。走进一张被放大的网格，重新认识那些习以为常的视觉规则。',
    className: 'poster-order',
  },
  {
    id: 'type',
    number: '02',
    name: '字，无边界',
    en: 'TYPE WITHOUT LIMITS',
    category: '实验字体 / EXPERIMENTAL TYPE',
    artist: 'Chen & Objects',
    introduction: '让文字走出纸面，成为可以感受的空间。',
    description:
      '字母不仅是信息的容器，也可以是空间、结构与情绪。从一笔一画到可行走的装置，用身体感受字号、字距与留白如何改变阅读。',
    className: 'poster-type',
  },
  {
    id: 'motion',
    number: '03',
    name: '运动中的静止',
    en: 'STILL IN MOTION',
    category: '动态影像 / MOVING IMAGE',
    artist: '小间研究所 / ROOM 08',
    introduction: '在光与节奏之间，观察图形如何改变。',
    description:
      '运动与静止之间，有一段看不见的过渡。通过光、重复与节奏，观察极简图形在时间中的变化。本展览使用缓慢运动，现场亦提供静态观看版本。',
    className: 'poster-motion',
  },
]
const schedule = [
  {
    date: '18',
    time: '10:00—11:00',
    name: '开场：秩序是一种选择',
    type: 'KEYNOTE',
    person: '林之',
    location: '主会场 / HALL A',
  },
  {
    date: '18',
    time: '13:30—15:00',
    name: '用一张纸，构建一个系统',
    type: 'WORKSHOP',
    person: 'Studio Between',
    location: '工作间 / ROOM 02',
  },
  {
    date: '18',
    time: '16:00—17:00',
    name: '字体之外，我们在读什么？',
    type: 'TALK',
    person: 'Chen & Objects',
    location: '主会场 / HALL A',
  },
  {
    date: '19',
    time: '10:30—12:00',
    name: '运动图形的节奏练习',
    type: 'WORKSHOP',
    person: '小间研究所',
    location: '工作间 / ROOM 02',
  },
  {
    date: '19',
    time: '14:00—15:00',
    name: '当数字遇见材料',
    type: 'PANEL',
    person: '三位独立设计师',
    location: '主会场 / HALL A',
  },
  {
    date: '19',
    time: '16:00—17:30',
    name: '开放工作台：你的第一个视觉系统',
    type: 'OPEN STUDIO',
    person: 'GRID 团队',
    location: '公共区域 / OPEN SPACE',
  },
  {
    date: '20',
    time: '11:00—12:00',
    name: '慢一点，才能看见',
    type: 'GUIDED TOUR',
    person: '展览策划团队',
    location: '展览入口 / ENTRANCE',
  },
  {
    date: '20',
    time: '14:00—16:00',
    name: '不完美的设计，完整的对话',
    type: 'ROUNDTABLE',
    person: '全体参展创作者',
    location: '主会场 / HALL A',
  },
  {
    date: '20',
    time: '17:00—18:00',
    name: '再见之前：交换你的观察',
    type: 'CLOSING',
    person: '每一位到场的人',
    location: '公共区域 / OPEN SPACE',
  },
]
const ticketTypes = [
  {
    id: 'day',
    name: '单日通行',
    en: 'DAY PASS',
    price: 68,
    description: '任选一天 · 全部展览与公开对谈',
  },
  {
    id: 'full',
    name: '三日通行',
    en: 'FULL PASS',
    price: 158,
    description: '三日入场 · 全部展览与公开对谈 · 纪念刊物',
  },
]
const eventNames: Record<string, string> = {
  KEYNOTE: '开场演讲',
  WORKSHOP: '工作坊',
  TALK: '主题对谈',
  PANEL: '圆桌交流',
  'OPEN STUDIO': '开放工作台',
  'GUIDED TOUR': '策展导览',
  ROUNDTABLE: '圆桌对话',
  CLOSING: '闭幕交流',
}

function Burst() {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="45" y="3" width="10" height="94" transform={`rotate(${i * 22.5} 50 50)`} />
      ))}
    </svg>
  )
}
function Poster({ item }: { item: Exhibition }) {
  return (
    <div className={`exhibition-poster ${item.className}`} aria-hidden="true">
      <div className="poster-top">
        <span>GRID / 26</span>
        <span>{item.number} / EXHIBITION</span>
      </div>
      {item.id === 'order' ? (
        <div className="order-grid">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className={i === 6 || i === 9 ? 'offset' : ''} />
          ))}
        </div>
      ) : item.id === 'type' ? (
        <div className="type-art">
          <span>Aa</span>
          <span>Bb</span>
        </div>
      ) : (
        <div className="motion-art">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} style={{ '--i': i } as React.CSSProperties} />
          ))}
        </div>
      )}
      <div className="poster-bottom">
        <strong>
          {item.en.split(' ').slice(0, 2).join(' ')}
          <br />
          {item.en.split(' ').slice(2).join(' ')}
        </strong>
        <span>
          2026
          <br />
          12.18—20
        </span>
      </div>
    </div>
  )
}
function clickedBackdrop(event: React.MouseEvent<HTMLDialogElement>) {
  if (event.target !== event.currentTarget) return false
  const rect = event.currentTarget.getBoundingClientRect()
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
}
function keepDialogFocus(event: React.KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return
  const controls = event.currentTarget.querySelectorAll<HTMLElement>(
    'button:not(:disabled), a[href]',
  )
  const first = controls[0],
    last = controls[controls.length - 1]
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
  const [date, setDate] = useState('18')
  const [selected, setSelected] = useState<Exhibition | null>(null)
  const [ticket, setTicket] = useState('day')
  const [quantity, setQuantity] = useState(1)
  const [visitDate, setVisitDate] = useState('18')
  const [booking, setBooking] = useState(false)
  const [menu, setMenu] = useState(false)
  const detailRef = useRef<HTMLDialogElement>(null)
  const bookingRef = useRef<HTMLDialogElement>(null)
  const menuRef = useRef<HTMLButtonElement>(null)
  const visibleSchedule = schedule.filter((s) => s.date === date)
  const selectedTicket = ticketTypes.find((t) => t.id === ticket)!
  useEffect(() => {
    if (selected) detailRef.current?.showModal()
    else detailRef.current?.close()
  }, [selected])
  useEffect(() => {
    if (booking) bookingRef.current?.showModal()
    else bookingRef.current?.close()
  }, [booking])
  useEffect(() => {
    if (!selected && !booking) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [selected, booking])
  function moveDateTab(event: React.KeyboardEvent<HTMLButtonElement>) {
    const dates = ['18', '19', '20']
    const index = dates.indexOf(date)
    const next =
      event.key === 'ArrowRight'
        ? dates[(index + 1) % dates.length]
        : event.key === 'ArrowLeft'
          ? dates[(index + dates.length - 1) % dates.length]
          : event.key === 'Home'
            ? dates[0]
            : event.key === 'End'
              ? dates[dates.length - 1]
              : null
    if (!next) return
    event.preventDefault()
    setDate(next)
    document.getElementById(`tab-${next}`)?.focus()
  }
  return (
    <>
      <a href="#main" className="skip-link">
        跳至主要内容
      </a>
      <header className="site-header">
        <a href="#" className="wordmark" aria-label="GRID 26 首页">
          GRID<span className="logo-slash">/</span>26
          <span className="logo-dot" />
        </a>
        <button
          ref={menuRef}
          className="mobile-menu"
          onClick={() => setMenu(!menu)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setMenu(false)
          }}
          aria-expanded={menu}
          aria-label="导航菜单"
          aria-controls="main-navigation"
        >
          {menu ? <X size={22} /> : <Plus size={22} />}
        </button>
        <nav
          id="main-navigation"
          className={menu ? 'nav-open' : ''}
          aria-label="主要导航"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setMenu(false)
              menuRef.current?.focus()
            }
          }}
        >
          <a href="#exhibitions" onClick={() => setMenu(false)}>
            展览 <span>01</span>
          </a>
          <a href="#programme" onClick={() => setMenu(false)}>
            日程 <span>02</span>
          </a>
          <a href="#about" onClick={() => setMenu(false)}>
            关于 <span>03</span>
          </a>
        </nav>
        <a href="#tickets" className="header-ticket">
          预约参观 <ArrowUpRight size={17} />
        </a>
      </header>
      <main id="main">
        <section className="hero">
          <div className="hero-meta">
            <span>独立设计与视觉文化展 / INDEPENDENT DESIGN FESTIVAL</span>
            <span>SHANGHAI, CN ↗</span>
          </div>
          <div className="hero-layout">
            <div className="hero-type">
              <h1>
                FORM.
                <br />
                FOLLOWS.
                <br />
                <span>CURIOSITY.</span>
              </h1>
              <p>形式，追随好奇心。</p>
            </div>
            <div className="hero-symbol" aria-hidden="true">
              <div className="symbol-orbit orbit-one" />
              <div className="symbol-orbit orbit-two" />
              <div className="symbol-orbit orbit-three" />
              <div className="symbol-number">26</div>
              <span className="symbol-caption">
                A NEW PERSPECTIVE
                <br />
                IS A GOOD START.
              </span>
            </div>
          </div>
          <div className="hero-bottom">
            <div className="hero-date">
              <span>12.18</span>
              <span className="date-line" />
              <span>12.20</span>
              <small>
                2026
                <br />
                FRI—SUN
              </small>
            </div>
            <div className="hero-bottom-copy">
              <p>
                三天，三场展览，无数种看待世界的方式。
                <br />
                为好奇的人，留一块空白。
              </p>
              <a href="#exhibitions" className="round-arrow" aria-label="探索展览">
                <ArrowRight />
              </a>
            </div>
          </div>
        </section>
        <div className="ticker" aria-hidden="true">
          <span>LESS RULES. MORE POSSIBILITIES.</span>
          <b>
            <Burst />
          </b>
          <span>看见秩序以外的可能</span>
          <b>
            <Burst />
          </b>
          <span>LESS RULES. MORE POSSIBILITIES.</span>
          <b>
            <Burst />
          </b>
        </div>
        <section className="exhibitions section-pad" id="exhibitions">
          <div className="section-heading">
            <div>
              <span className="section-kicker">01 / THE EXHIBITIONS</span>
              <h2>
                不同视角。
                <br />
                同一种好奇。
              </h2>
            </div>
            <p>
              从字体到空间，从静态到动态。
              <br />
              三个独立展览，重新组织你的感知。
            </p>
          </div>
          <div className="exhibition-grid">
            {exhibitions.map((item) => (
              <article className="exhibition-card" key={item.id}>
                <div className="exhibition-index">
                  <span>{item.number}</span>
                  <div>
                    <strong>{item.category.split(' / ')[0]}</strong>
                    <small>{item.category.split(' / ')[1]}</small>
                  </div>
                </div>
                <button
                  className="poster-button"
                  onClick={() => setSelected(item)}
                  aria-label={`查看${item.name}展览详情`}
                >
                  <Poster item={item} />
                  <span className="poster-hover">
                    进入展览 <ArrowUpRight size={24} />
                  </span>
                </button>
                <button className="exhibition-name" onClick={() => setSelected(item)}>
                  <h3>{item.name}</h3>
                  <ArrowUpRight size={23} />
                </button>
                <p className="exhibition-intro">{item.introduction}</p>
                <p className="exhibition-artist">{item.artist}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="about-section" id="about">
          <div className="about-label">
            NOT JUST
            <br />
            AN EXHIBITION.<span>关于 GRID / 26</span>
          </div>
          <div className="about-content">
            <h2>
              好的设计，
              <br />
              始于一个<span className="underlined">好问题。</span>
            </h2>
            <div className="about-copy">
              <p>
                为什么一定要对齐？空白是不是一种内容？如果去掉颜色，还有什么留下？我们邀请创作者与观看者共同参与，把设计从结果，变成一场持续发生的对话。
              </p>
              <p>
                GRID / 26
                是一个虚构的独立设计节样例。这里的展览、创作者和活动用于演示视觉与交互设计，期待你带走真实的灵感。
              </p>
            </div>
            <div className="about-stats">
              <div>
                <strong>03</strong>
                <span>主题展览</span>
              </div>
              <div>
                <strong>09</strong>
                <span>现场活动</span>
              </div>
              <div>
                <strong>∞</strong>
                <span>全新可能</span>
              </div>
            </div>
          </div>
        </section>
        <section className="programme section-pad" id="programme">
          <div className="section-heading">
            <div>
              <span className="section-kicker">02 / THE PROGRAMME</span>
              <h2>
                把时间，
                <br />
                留给新鲜事。
              </h2>
            </div>
            <p>
              认真观看，也尽情交谈。
              <br />
              选择日期，找到你的日程。
            </p>
          </div>
          <div className="programme-body">
            <div className="date-tabs" role="tablist" aria-label="活动日期">
              {[
                { date: '18', day: 'FRIDAY', cn: '星期五' },
                { date: '19', day: 'SATURDAY', cn: '星期六' },
                { date: '20', day: 'SUNDAY', cn: '星期日' },
              ].map((d) => (
                <button
                  role="tab"
                  tabIndex={date === d.date ? 0 : -1}
                  onKeyDown={moveDateTab}
                  id={`tab-${d.date}`}
                  aria-controls="schedule-panel"
                  aria-selected={date === d.date}
                  className={date === d.date ? 'active' : ''}
                  onClick={() => setDate(d.date)}
                  key={d.date}
                >
                  <span>12.{d.date}</span>
                  <small>
                    {d.day}
                    <br />
                    {d.cn}
                  </small>
                  <ArrowUpRight size={24} />
                </button>
              ))}
            </div>
            <div className="programme-context">
              <p aria-live="polite">
                <strong>12 月 {date} 日</strong>
                <span>{visibleSchedule.length} 场活动</span>
              </p>
              <span>现场时间 / UTC+8</span>
            </div>
            <div className="schedule-labels" aria-hidden="true">
              <span>时间 / TIME</span>
              <span>活动 / PROGRAMME</span>
              <span>地点 / VENUE</span>
            </div>
            <div
              id="schedule-panel"
              role="tabpanel"
              tabIndex={0}
              aria-labelledby={`tab-${date}`}
              className="schedule-list"
            >
              {visibleSchedule.map((s) => (
                <div className="schedule-row" key={s.name}>
                  <div className="schedule-time" aria-label={s.time}>
                    <time dateTime={`2026-12-${date}T${s.time.split('—')[0]}:00+08:00`}>
                      {s.time.split('—')[0]}
                    </time>
                    <span>— {s.time.split('—')[1]}</span>
                  </div>
                  <div className="schedule-main">
                    <span className="event-type">
                      {eventNames[s.type]} <span>/ {s.type}</span>
                    </span>
                    <h3>{s.name}</h3>
                    <p>{s.person}</p>
                  </div>
                  <div className="schedule-location">
                    <span>{s.location.split(' / ')[0]}</span>
                    <small>{s.location.split(' / ')[1]}</small>
                  </div>
                </div>
              ))}
            </div>
            <p className="programme-note">
              所有时间均为北京时间（UTC+8）。工作坊席位与现场安排以实际主办方信息为准；本页面为交互演示。
            </p>
          </div>
        </section>
        <section className="ticket-section" id="tickets">
          <div className="ticket-title">
            <span className="section-kicker">03 / COME WITH CURIOSITY</span>
            <h2>
              下一种可能，
              <br />
              等你入场。
            </h2>
            <p>
              不需要标准答案。
              <br />
              只需要，带着好奇心来。
            </p>
            <div className="ticket-star" aria-hidden="true">
              <Burst />
            </div>
          </div>
          <form
            className="ticket-form"
            onSubmit={(e) => {
              e.preventDefault()
              setBooking(true)
            }}
          >
            <fieldset>
              <legend>01 / 选择通行证</legend>
              <div className="ticket-options">
                {ticketTypes.map((t) => (
                  <label
                    className={`ticket-option ${ticket === t.id ? 'selected' : ''}`}
                    key={t.id}
                  >
                    <input
                      type="radio"
                      name="ticket"
                      value={t.id}
                      checked={ticket === t.id}
                      onChange={() => setTicket(t.id)}
                    />
                    <div>
                      <span className="ticket-name">
                        {t.name} <small>{t.en}</small>
                      </span>
                      <p>{t.description}</p>
                    </div>
                    <strong>¥{t.price}</strong>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="ticket-settings">
              <label>
                02 / 入场日期
                <select
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  disabled={ticket === 'full'}
                >
                  <option value="18">12 月 18 日 · 星期五</option>
                  <option value="19">12 月 19 日 · 星期六</option>
                  <option value="20">12 月 20 日 · 星期日</option>
                </select>
              </label>
              <div>
                <span>03 / 人数</span>
                <div className="quantity-control">
                  <button
                    type="button"
                    disabled={quantity === 1}
                    onClick={() => setQuantity((q) => q - 1)}
                    aria-label="减少人数"
                  >
                    <Minus size={16} />
                  </button>
                  <output aria-live="polite">{quantity}</output>
                  <button
                    type="button"
                    disabled={quantity === 6}
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="增加人数"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
            <div className="ticket-total">
              <span>
                预约合计 <small>{quantity} 人</small>
              </span>
              <strong>¥{selectedTicket.price * quantity}</strong>
            </div>
            <button className="book-button" type="submit">
              查看预约摘要 <ArrowUpRight size={23} />
            </button>
            <p className="ticket-disclaimer">
              交互演示 · 不收取费用，不生成真实门票，也不收集个人信息。
            </p>
          </form>
        </section>
      </main>
      <footer>
        <a href="#" className="footer-logo">
          GRID / 26<span>®</span>
        </a>
        <div className="footer-mid">
          <span>FORM FOLLOWS CURIOSITY.</span>
          <p>
            独立设计，始终好奇。
            <br />
            SHANGHAI / 12.18—12.20, 2026
          </p>
        </div>
        <div className="footer-end">
          <a href="#main">
            回到顶部 <MoveUpRight size={18} />
          </a>
          <small>
            © 2026 GRID — A fictional design festival.
            <br />
            原创风格研究样例 / 非真实活动
          </small>
        </div>
      </footer>
      <dialog
        ref={detailRef}
        className="detail-dialog"
        aria-labelledby="exhibition-dialog-title"
        onCancel={() => setSelected(null)}
        onClose={() => setSelected(null)}
        onKeyDown={keepDialogFocus}
        onClick={(e) => {
          if (clickedBackdrop(e)) setSelected(null)
        }}
      >
        {selected && (
          <div className="dialog-inner">
            <button
              className="dialog-close"
              aria-label="关闭展览详情"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
            <div className="dialog-poster">
              <Poster item={selected} />
            </div>
            <div className="dialog-copy">
              <span className="section-kicker">EXHIBITION / {selected.number}</span>
              <h2 id="exhibition-dialog-title">{selected.name}</h2>
              <p className="dialog-en">{selected.en}</p>
              <p>{selected.description}</p>
              <dl>
                <div>
                  <dt>创作者</dt>
                  <dd>{selected.artist}</dd>
                </div>
                <div>
                  <dt>开放时间</dt>
                  <dd>12.18—12.20 / 10:00—18:00</dd>
                </div>
                <div>
                  <dt>展览类别</dt>
                  <dd>{selected.category}</dd>
                </div>
              </dl>
              <a
                className="dialog-ticket"
                href="#tickets"
                onClick={() => {
                  detailRef.current?.close()
                  setSelected(null)
                  requestAnimationFrame(() =>
                    document
                      .querySelector<HTMLInputElement>('.ticket-option input:checked')
                      ?.focus({ preventScroll: true }),
                  )
                }}
              >
                选择通行证 <ArrowUpRight size={20} />
              </a>
              <small>虚构展览 · 用于交互与视觉演示</small>
            </div>
          </div>
        )}
      </dialog>
      <dialog
        ref={bookingRef}
        className="booking-dialog"
        aria-labelledby="booking-title"
        onCancel={() => setBooking(false)}
        onClose={() => setBooking(false)}
        onKeyDown={keepDialogFocus}
        onClick={(e) => {
          if (clickedBackdrop(e)) setBooking(false)
        }}
      >
        <button
          className="dialog-close"
          aria-label="关闭预约摘要"
          onClick={() => setBooking(false)}
        >
          <X />
        </button>
        <div className="booking-check">
          <Check size={28} />
        </div>
        <span className="section-kicker">YOUR VISIT / DEMO</span>
        <h2 id="booking-title">好奇心，已就位。</h2>
        <p>这是你的本地预约预览，尚未进行任何支付或真实预约。</p>
        <dl>
          <div>
            <dt>通行证</dt>
            <dd>{selectedTicket.name}</dd>
          </div>
          <div>
            <dt>日期</dt>
            <dd>2026.12.{ticket === 'full' ? '18—20' : visitDate}</dd>
          </div>
          <div>
            <dt>人数</dt>
            <dd>{quantity} 人</dd>
          </div>
          <div>
            <dt>展示合计</dt>
            <dd>¥{selectedTicket.price * quantity}</dd>
          </div>
        </dl>
        <button className="book-button" onClick={() => setBooking(false)}>
          继续探索 <ArrowRight size={20} />
        </button>
      </dialog>
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
