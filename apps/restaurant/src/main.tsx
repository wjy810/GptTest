import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowUpRight, ArrowRight, Flame, Leaf, Clock, Check, Plus, Minus } from 'lucide-react'
import './styles.css'

const dishes = [
  {
    id: 1,
    name: '炭火慢烤南瓜',
    en: 'EMBER-ROASTED PUMPKIN',
    type: '田园',
    price: 68,
    note: '烟熏酸奶 / 榛子碎 / 鼠尾草',
    variant: 'pumpkin',
    tag: '来自土地',
  },
  {
    id: 2,
    name: '苹果木烟熏牛肋',
    en: 'APPLEWOOD SHORT RIB',
    type: '炉火',
    price: 168,
    note: '低温慢煮 12 小时 / 黑蒜 / 时蔬',
    variant: 'beef',
    tag: '主厨推荐',
  },
  {
    id: 3,
    name: '炉烤无花果',
    en: 'WARM FIG & RICOTTA',
    type: '甜点',
    price: 58,
    note: '新鲜乳酪 / 山花蜂蜜 / 开心果',
    variant: 'fig',
    tag: '甜蜜收尾',
  },
  {
    id: 4,
    name: '迷迭香炭烤鸡',
    en: 'ROSEMARY FIRE CHICKEN',
    type: '炉火',
    price: 118,
    note: '散养鸡腿 / 柠檬 / 自制香草盐',
    variant: 'chicken',
    tag: '炉边经典',
  },
  {
    id: 5,
    name: '花园里的绿色',
    en: 'THE GARDEN ON A PLATE',
    type: '田园',
    price: 48,
    note: '当季叶菜 / 青苹果 / 柑橘油醋',
    variant: 'salad',
    tag: '随季节生长',
  },
  {
    id: 6,
    name: '焦糖梨与香草',
    en: 'CARAMEL PEAR & VANILLA',
    type: '甜点',
    price: 62,
    note: '黄油煎梨 / 香草奶油 / 燕麦酥',
    variant: 'pear',
    tag: '温热上桌',
  },
]
function Plate({ variant = 'pumpkin', hero = false }: { variant?: string; hero?: boolean }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg
      viewBox="0 0 600 600"
      role="img"
      aria-label={`${hero ? '原创餐盘插画：' : ''}${variant === 'beef' ? '烟熏牛肋与香草' : variant === 'fig' ? '无花果与乳酪' : variant === 'salad' ? '花园蔬菜' : variant === 'pear' ? '焦糖梨' : variant === 'chicken' ? '炭烤鸡与柠檬' : '炭烤南瓜与香草'}`}
    >
      <defs>
        <radialGradient id={`plate-${uid}`}>
          <stop stopColor="#f8e8c6" />
          <stop offset=".78" stopColor="#f1dcaf" />
          <stop offset=".82" stopColor="#c9ad7c" />
          <stop offset=".9" stopColor="#f4dfb7" />
          <stop offset="1" stopColor="#ddc493" />
        </radialGradient>
        <linearGradient id={`food-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ed8d32" />
          <stop offset=".6" stopColor="#cb4c22" />
          <stop offset="1" stopColor="#7c2d20" />
        </linearGradient>
        <filter id={`shadow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="3" dy="16" stdDeviation="12" floodColor="#24110a" floodOpacity=".22" />
        </filter>
      </defs>
      <circle cx="300" cy="315" r="250" fill="#2e101a" opacity=".12" />
      <circle
        cx="300"
        cy="300"
        r="248"
        fill={`url(#plate-${uid})`}
        filter={`url(#shadow-${uid})`}
      />
      <circle
        cx="300"
        cy="300"
        r="209"
        fill="none"
        stroke="#b89c6d"
        strokeWidth="1"
        opacity=".65"
      />
      <path
        d="M177 306C152 214 318 182 402 236S419 403 318 409S202 393 177 306Z"
        fill={variant === 'fig' || variant === 'pear' ? '#fff3d9' : '#e8d0a0'}
      />
      {variant === 'pumpkin' ? (
        <g fill={`url(#food-${uid})`} stroke="#a64f24" strokeWidth="3">
          <path d="M192 212Q320 125 402 264Q287 242 252 372Q174 339 192 212Z" />
          <path d="M252 372Q310 242 402 264Q411 354 315 409Z" />
          <path
            d="M217 231Q295 183 357 246M224 266Q273 224 310 230M277 355Q311 301 362 291"
            fill="none"
            stroke="#772f1b"
            strokeWidth="7"
          />
        </g>
      ) : variant === 'beef' || variant === 'chicken' ? (
        <g>
          <path
            d="M183 251Q236 191 363 216L425 301Q425 356 331 380L211 343Z"
            fill={variant === 'beef' ? '#6a3025' : '#bd7035'}
            stroke="#4f261e"
            strokeWidth="4"
          />
          <path
            d="M205 266L352 238M219 296L381 267M235 326L398 300M285 350L391 329"
            stroke={variant === 'beef' ? '#b66b43' : '#67341e'}
            strokeWidth="8"
          />
          <circle cx="390" cy="384" r="35" fill="#d8b342" />
          <circle cx="390" cy="384" r="26" fill="none" stroke="#f4df85" strokeWidth="3" />
        </g>
      ) : variant === 'fig' ? (
        <g>
          {[
            [235, 241],
            [344, 255],
            [285, 346],
            [384, 355],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${i * 33})`}>
              <ellipse rx="40" ry="57" fill="#663247" />
              <ellipse rx="31" ry="47" fill="#c16f6a" />
              {Array.from({ length: 10 }, (_, j) => (
                <circle
                  key={j}
                  cx={Math.cos(j * 2.4) * 20}
                  cy={Math.sin(j * 2.4) * 32}
                  r="2.5"
                  fill="#efca95"
                />
              ))}
            </g>
          ))}
        </g>
      ) : variant === 'salad' ? (
        <g>
          {Array.from({ length: 18 }, (_, i) => (
            <ellipse
              key={i}
              cx={300 + Math.cos(i * 2.4) * 95}
              cy={300 + Math.sin(i * 2.4) * 90}
              rx="24"
              ry="45"
              fill={['#5f713b', '#87934f', '#a8ad64'][i % 3]}
              transform={`rotate(${i * 47} ${300 + Math.cos(i * 2.4) * 95} ${300 + Math.sin(i * 2.4) * 90})`}
            />
          ))}
        </g>
      ) : (
        <g>
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d="M235 218Q269 200 280 259Q348 324 298 379Q241 414 215 354Q204 322 232 266Z"
              transform={`rotate(${i * 65 - 55} 300 300)`}
              fill={i % 2 ? '#d2a056' : '#b97f3d'}
              stroke="#f0d293"
              strokeWidth="5"
            />
          ))}
        </g>
      )}
      <g fill="#53713e">
        {[
          [180, 360, -35],
          [405, 219, 45],
          [362, 407, 65],
          [214, 182, -15],
          [443, 325, 30],
        ].map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <path d="M0 20Q-35-8 0-35Q35-8 0 20" />
            <path d="M0 21V-25" stroke="#c1bf79" strokeWidth="1.5" />
          </g>
        ))}
      </g>
      <g fill="#8b5e34">
        {Array.from({ length: 28 }, (_, i) => (
          <circle
            key={i}
            cx={300 + Math.cos(i * 2.399) * (110 + (i % 5) * 12)}
            cy={300 + Math.sin(i * 2.399) * (90 + (i % 7) * 10)}
            r={2 + (i % 3)}
          />
        ))}
      </g>
    </svg>
  )
}
function Hearth() {
  return (
    <svg viewBox="0 0 540 470" role="img" aria-label="原创插画：拱形炉膛中的木柴与火焰">
      <rect width="540" height="470" fill="#aa5e47" />
      <path d="M85 470V210A185 185 0 0 1 455 210V470Z" fill="#dfb68b" />
      <path d="M119 470V217A151 151 0 0 1 421 217V470Z" fill="#432029" />
      <path d="M151 470V228A119 119 0 0 1 389 228V470Z" fill="#281b20" />
      <path
        d="M185 410Q136 344 219 259Q206 323 244 324Q287 242 270 168Q361 257 339 322Q391 274 366 378Q350 432 294 447Z"
        fill="#e87532"
      />
      <path
        d="M223 415Q202 368 254 318Q246 363 271 369Q311 321 307 278Q352 343 323 413Z"
        fill="#f8c75c"
      />
      <path
        d="M178 425L354 458M182 457L355 419"
        stroke="#643b2c"
        strokeWidth="26"
        strokeLinecap="round"
      />
      <path d="M185 421L352 452M191 453L349 419" stroke="#a46941" strokeWidth="3" />
      <rect x="55" y="459" width="430" height="11" fill="#bb8c66" />
    </svg>
  )
}
function localToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
function keepDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return
  const controls = event.currentTarget.querySelectorAll<HTMLElement>(
    'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]',
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
  const [category, setCategory] = useState('全部')
  const [guests, setGuests] = useState(2)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('18:30')
  const [booking, setBooking] = useState<{ date: string; time: string; guests: number } | null>(
    null,
  )
  const [error, setError] = useState('')
  const bookingDialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (!booking) {
      bookingDialog.current?.close()
      return
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    bookingDialog.current?.showModal()
    return () => {
      document.body.style.overflow = overflow
    }
  }, [booking])
  function reserve(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!date || date < localToday()) {
      setError('请选择今天或之后的日期。')
      setBooking(null)
      return
    }
    if (new Date(`${date}T00:00:00Z`).getUTCDay() === 1) {
      setError('周一休息，请选择周二至周日的晚餐时段。')
      setBooking(null)
      return
    }
    setError('')
    setBooking({ date, time, guests })
  }
  return (
    <>
      <a className="skip" href="#menu">
        跳至菜单
      </a>
      <div className="topline">
        <span>SEASONAL INGREDIENTS. OPEN FIRE. GOOD COMPANY.</span>
        <span>食物有温度，相聚有理由。</span>
      </div>
      <header>
        <a href="#" className="logo">
          ember<span>®</span>
        </a>
        <nav aria-label="主导航">
          <a href="#story">炉边故事</a>
          <a href="#menu">当季菜单</a>
          <a href="#visit">来坐一会儿</a>
        </nav>
        <a className="nav-book" href="#reserve">
          留一张桌 <ArrowUpRight size={17} />
        </a>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <Flame size={15} /> FROM THE EARTH, THROUGH THE FIRE.
            </span>
            <h1>
              炉火之间，
              <br />
              风味<span>发生。</span>
            </h1>
            <p className="hero-serif">
              Good food.
              <br />
              <em>Better company.</em>
            </p>
            <p className="hero-intro">
              把季节交给炉火，把时间留给彼此。
              <br />
              一道不赶时间的菜，一顿值得相聚的饭。
            </p>
            <a className="cream-button" href="#menu">
              看看今天有什么 <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="hero-art">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="plate-hero">
              <Plate hero />
            </div>
            <div className="hero-stamp">
              <span>
                COOKED
                <br />
                WITH
              </span>
              <Flame size={30} />
              <span>LOVE & FIRE</span>
            </div>
            <div className="dish-caption">
              <span>01 / SIGNATURE DISH</span>
              <strong>炭火慢烤南瓜</strong>
              <span>SMOKE. SWEETNESS. A LITTLE MAGIC.</span>
            </div>
            <span className="art-label">
              好味道，
              <br />
              总要慢一点。
            </span>
          </div>
        </section>
        <div className="ticker">
          <span>当季食材</span>
          <Flame />
          <span>明火烹调</span>
          <Flame />
          <span>邻里餐桌</span>
          <Flame />
          <span>SEASON BY SEASON</span>
          <Flame />
          <span>FIRE TO TABLE</span>
        </div>
        <section className="menu-section" id="menu">
          <div className="section-heading">
            <div>
              <span className="eyebrow">01 / SOMETHING GOOD IS COOKING</span>
              <h2>
                今天，想吃点<span>什么？</span>
              </h2>
            </div>
            <p>
              跟着季节走，跟着香气来。
              <br />
              用简单的食材，做认真好吃的东西。
            </p>
          </div>
          <div className="menu-toolbar">
            <div role="group" aria-label="菜单分类">
              {['全部', '炉火', '田园', '甜点'].map((c) => (
                <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)}>
                  {c}
                  {c === '全部' && <span> / ALL</span>}
                </button>
              ))}
            </div>
            <span>
              {dishes.filter((d) => category === '全部' || d.type === category).length} 道当季好味
            </span>
          </div>
          <div className="dish-grid">
            {dishes
              .filter((d) => category === '全部' || d.type === category)
              .map((d) => (
                <article className="dish-card" key={d.id}>
                  <div className={`dish-art dish-${d.variant}`}>
                    <span className="dish-tag">
                      {d.type === '田园' ? <Leaf size={12} /> : <Flame size={12} />} {d.tag}
                    </span>
                    <Plate variant={d.variant} />
                    <span className="dish-number">0{d.id}</span>
                  </div>
                  <div className="dish-title">
                    <h3>{d.name}</h3>
                    <strong>
                      <small>¥</small>
                      {d.price}
                    </strong>
                  </div>
                  <span className="dish-en">{d.en}</span>
                  <p>{d.note}</p>
                </article>
              ))}
          </div>
          <p className="menu-note">
            菜单为设计演示。食材与价格为虚构示例；实际用餐请以餐厅当日信息为准。过敏原可在预约时向真实商家确认。
          </p>
        </section>
        <section className="story" id="story">
          <div className="story-art">
            <Hearth />
            <span>THE HEART OF OUR KITCHEN</span>
          </div>
          <div className="story-copy">
            <span className="eyebrow">02 / AT THE HEART OF IT ALL</span>
            <h2>
              一团火。
              <br />
              一张桌。
              <br />
              <em>一些好时光。</em>
            </h2>
            <p>
              我们喜欢食物最本来的样子。让南瓜在火边变甜，让木香慢慢走进肉里，让一顿饭拥有自己的节奏。
            </p>
            <p>
              EMBER
              是一个虚构的邻里餐厅设计。这里没有急着翻页的菜单，只有认真对待食材的心意，和一张等你来坐的桌子。
            </p>
            <div className="story-values">
              <span>
                <Leaf size={18} /> 顺应季节
              </span>
              <span>
                <Flame size={18} /> 回归明火
              </span>
              <span>
                <Clock size={18} /> 慢慢享用
              </span>
            </div>
          </div>
        </section>
        <section className="reserve" id="reserve">
          <div className="reserve-copy">
            <span className="eyebrow">03 / THERE’S A SEAT FOR YOU</span>
            <h2>
              把今晚，
              <br />
              留给<span>一顿好饭。</span>
            </h2>
            <p>
              两个人的纪念日，一群朋友的星期五。
              <br />
              或者只是，今天想好好吃饭。
            </p>
            <Flame className="reserve-flame" size={110} strokeWidth={1} />
          </div>
          <div className="booking-box">
            <span className="eyebrow">YOUR TABLE AWAITS / 预约体验</span>
            <form onSubmit={reserve}>
              <div className="booking-fields">
                <label htmlFor="booking-date">
                  哪一天
                  <input
                    id="booking-date"
                    type="date"
                    value={date}
                    min={localToday()}
                    required
                    onChange={(e) => {
                      setDate(e.target.value)
                      setBooking(null)
                      setError('')
                    }}
                  />
                </label>
                <label htmlFor="booking-time">
                  几点见
                  <select
                    id="booking-time"
                    value={time}
                    onChange={(e) => {
                      setTime(e.target.value)
                      setBooking(null)
                    }}
                  >
                    {['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="guest-row">
                <span>
                  几位来坐坐<small>最多 8 位宾客</small>
                </span>
                <div className="stepper">
                  <button
                    type="button"
                    aria-label="减少人数"
                    disabled={guests <= 1}
                    onClick={() => {
                      setGuests((g) => g - 1)
                      setBooking(null)
                    }}
                  >
                    <Minus size={16} />
                  </button>
                  <output aria-live="polite">{guests} 位</output>
                  <button
                    type="button"
                    aria-label="增加人数"
                    disabled={guests >= 8}
                    onClick={() => {
                      setGuests((g) => g + 1)
                      setBooking(null)
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <button className="book-button" type="submit">
                生成预约意向 <ArrowUpRight size={19} />
              </button>
              <p className="booking-note">
                本地交互演示 · 周一休息 · UTC+8 餐厅时间 · 不会产生真实订位
              </p>
              {error && <p role="alert">{error}</p>}
            </form>
          </div>
        </section>
        <section className="visit" id="visit">
          <div>
            <span className="eyebrow">DROP BY, STAY A WHILE.</span>
            <h2>
              在拐角处，
              <br />
              循着香气来。
            </h2>
          </div>
          <div>
            <span className="visit-label">FIND US / 虚构地址</span>
            <p>
              梧桐路 18 号，街角的红色门
              <br />
              这是一处用于设计展示的虚构地点
            </p>
          </div>
          <div>
            <span className="visit-label">HOURS / 示例营业时间</span>
            <p>
              周二 — 周日
              <br />
              17:30 — 22:00
              <br />
              <small>周一，把时间留给自己。</small>
            </p>
          </div>
        </section>
      </main>
      <footer>
        <a href="#" className="footer-logo">
          ember<span>®</span>
        </a>
        <div>
          <span>GOOD FOOD. OPEN FIRE. ALL HEART.</span>
          <p>© 2026 EMBER · 原创餐厅网站设计研究</p>
        </div>
        <a href="#">
          回到炉边 <ArrowUpRight size={18} />
        </a>
      </footer>
      <dialog
        ref={bookingDialog}
        className="booking-dialog"
        aria-labelledby="booking-title"
        onKeyDown={keepDialogFocus}
        onCancel={() => setBooking(null)}
        onClose={() => setBooking(null)}
      >
        {booking && (
          <div className="booking-success">
            <Check size={32} />
            <span className="eyebrow">A LITTLE SOMETHING TO LOOK FORWARD TO</span>
            <h2 id="booking-title">这张桌，先记在心里。</h2>
            <p>
              {booking.date} · {booking.time} · {booking.guests} 位
            </p>
            <small>
              餐厅时间
              UTC+8（Asia/Shanghai）。已生成本地预约意向，未向任何服务器发送。真实订位需直接联系餐厅。
            </small>
            <button className="book-button" autoFocus onClick={() => setBooking(null)}>
              返回修改 <ArrowRight size={18} />
            </button>
          </div>
        )}
      </dialog>
    </>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
