import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Leaf,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  Sun,
  Truck,
  X,
} from 'lucide-react'
import './styles.css'

type Product = {
  id: number
  name: string
  en: string
  category: 'plants' | 'objects'
  price: number
  color: string
  variant: number
  detail: string
  light: string
}
const products: Product[] = [
  {
    id: 1,
    name: '一株橡皮树',
    en: 'Ficus elastica',
    category: 'plants',
    price: 168,
    color: '#dedfd1',
    variant: 1,
    detail: '厚实、深绿的叶片，自带安静的力量。搭配手工砂陶盆，让客厅的一角有了自己的生命力。',
    light: '明亮散射光 · 每 7–10 天浇水',
  },
  {
    id: 2,
    name: '山丘陶器',
    en: 'The Hill vessel',
    category: 'objects',
    price: 128,
    color: '#eaded0',
    variant: 2,
    detail:
      '让手掌停留片刻的砂感表面。柔软的弧线与朴素釉色，每一只都有细小的烧制差异。插枝、收纳，或只是静静放着。',
    light: '手工陶器 · 高约 22cm',
  },
  {
    id: 3,
    name: '自在龟背竹',
    en: 'Monstera deliciosa',
    category: 'plants',
    price: 198,
    color: '#e0e4d8',
    variant: 3,
    detail: '像一小片可以带回家的热带森林。叶片随着成长自然开裂，留给阳光与空气穿过的缝隙。',
    light: '半阴环境 · 每 5–8 天浇水',
  },
  {
    id: 4,
    name: '枝间小灯',
    en: 'Little shade lamp',
    category: 'objects',
    price: 268,
    color: '#e8e1d5',
    variant: 4,
    detail: '圆润的陶土灯座，遇上轻薄的亚麻灯罩。用一团柔和的暖光，留住一天里最松弛的时间。',
    light: '暖白色灯光 · 桌面氛围灯',
  },
  {
    id: 5,
    name: '向光琴叶榕',
    en: 'Fiddle-leaf fig',
    category: 'plants',
    price: 238,
    color: '#dce2d0',
    variant: 5,
    detail: '舒展的大叶片像一枚枚绿色情书。给它一个明亮的位置，也给自己的日常留下一处生长的风景。',
    light: '充足散射光 · 见干见湿',
  },
  {
    id: 6,
    name: '一只慢水壶',
    en: 'Slow pour can',
    category: 'objects',
    price: 158,
    color: '#e6dfd1',
    variant: 6,
    detail: '细长的水嘴让浇水变成一件从容的小事。温润奶油色粉末涂层，陪伴每一个照顾植物的清晨。',
    light: '哑光金属 · 容量 1.2L',
  },
]

function Botanical({
  variant = 1,
  id = 'plant',
  hero = false,
}: {
  variant?: number
  id?: string
  hero?: boolean
}) {
  const leafColor = variant === 3 ? '#526347' : variant === 5 ? '#6c7752' : '#40533e'
  return (
    <svg
      className={`botanical ${hero ? 'botanical-hero' : ''}`}
      viewBox="0 0 500 590"
      role="img"
      aria-label={variant % 2 ? '原创植物与陶盆插画' : '原创生活器物插画'}
    >
      <defs>
        <linearGradient id={`${id}-pot`} x1="0" x2="1">
          <stop stopColor="#aa795d" />
          <stop offset=".4" stopColor="#d4a185" />
          <stop offset=".74" stopColor="#c49175" />
          <stop offset="1" stopColor="#9c6d53" />
        </linearGradient>
        <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#849172" />
          <stop offset=".4" stopColor={leafColor} />
          <stop offset="1" stopColor="#253c2b" />
        </linearGradient>
        <radialGradient id={`${id}-ceramic`} cx="35%" cy="30%" r="75%">
          <stop stopColor="#dbbc9c" />
          <stop offset=".6" stopColor="#c59f7f" />
          <stop offset="1" stopColor="#a78162" />
        </radialGradient>
        <linearGradient id={`${id}-shade`}>
          <stop stopColor="#d4c5a9" />
          <stop offset=".45" stopColor="#f3e9d4" />
          <stop offset="1" stopColor="#c9baa1" />
        </linearGradient>
        <filter id={`${id}-shadow`}>
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <ellipse
        cx="250"
        cy="524"
        rx="137"
        ry="17"
        fill="#283322"
        opacity=".13"
        filter={`url(#${id}-shadow)`}
      />
      {variant === 2 ? (
        <g>
          <path
            d="M210 189 C197 212 210 249 190 276 C164 313 143 336 145 412 C147 491 187 514 250 516 C318 519 359 482 355 411 C352 349 329 310 306 278 C286 251 305 211 289 189Z"
            fill={`url(#${id}-ceramic)`}
          />
          <ellipse cx="249" cy="190" rx="40" ry="10" fill="#8b6950" />
          <ellipse cx="249" cy="190" rx="29" ry="6" fill="#5c4937" />
          <path
            d="M246 189 Q254 117 210 51 M250 154 Q284 101 325 89 M244 129 Q200 112 171 129"
            fill="none"
            stroke="#6b6b42"
            strokeWidth="3"
          />
          <g fill="#849074">
            <ellipse cx="210" cy="62" rx="14" ry="31" transform="rotate(-28 210 62)" />
            <ellipse cx="301" cy="98" rx="29" ry="12" transform="rotate(-24 301 98)" />
            <ellipse cx="185" cy="121" rx="26" ry="11" transform="rotate(18 185 121)" />
          </g>
          <path
            d="M174 370 Q188 321 210 300"
            fill="none"
            stroke="#e6c9ac"
            strokeWidth="3"
            opacity=".5"
          />
        </g>
      ) : variant === 4 ? (
        <g>
          <path
            d="M217 362 Q173 408 194 478 Q207 515 253 516 Q300 515 312 477 Q329 416 285 362Z"
            fill={`url(#${id}-ceramic)`}
          />
          <rect x="245" y="240" width="13" height="136" fill="#a78b64" />
          <path d="M178 184 L323 184 L382 354 Q253 383 118 354Z" fill={`url(#${id}-shade)`} />
          <ellipse cx="251" cy="184" rx="72" ry="11" fill="#c4b69b" />
          <ellipse cx="250" cy="354" rx="131" ry="15" fill="#bdac90" />
          <ellipse cx="250" cy="356" rx="116" ry="9" fill="#efdfbb" />
          {[150, 180, 210, 240, 270, 300, 330, 360].map((x, i) => (
            <path
              key={x}
              d={`M${184 + i * 18} 190 L${x} 352`}
              stroke="#a99a7f"
              opacity=".25"
              fill="none"
            />
          ))}
        </g>
      ) : variant === 6 ? (
        <g>
          <path
            d="M172 296 Q107 212 100 285 Q91 374 175 396"
            fill="none"
            stroke="#a0a286"
            strokeWidth="23"
          />
          <path d="M313 353 L414 239 L430 244 L328 421" fill="#bbc0a3" />
          <path d="M163 289 L318 289 L338 474 Q326 513 247 517 Q169 512 147 476Z" fill="#b7bca0" />
          <ellipse cx="240" cy="289" rx="78" ry="15" fill="#838e72" />
          <ellipse cx="240" cy="287" rx="68" ry="10" fill="#657259" />
          <path d="M182 318 L171 464" fill="none" stroke="#d9dbc4" strokeWidth="5" opacity=".6" />
          <path d="M319 358 L412 251" stroke="#d9dbc4" strokeWidth="3" />
        </g>
      ) : (
        <g>
          <path d="M174 387 L329 387 L307 502 Q248 529 194 501Z" fill={`url(#${id}-pot)`} />
          <ellipse cx="251" cy="386" rx="78" ry="17" fill="#b28568" />
          <ellipse cx="251" cy="385" rx="67" ry="11" fill="#514435" />
          <path
            d="M252 394 C242 324 271 258 254 176 Q241 104 252 63"
            fill="none"
            stroke="#73764b"
            strokeWidth="8"
          />
          {[
            { x: 252, y: 324, r: -62, s: 0.98 },
            { x: 255, y: 272, r: 63, s: 1.14 },
            { x: 259, y: 221, r: -64, s: 1.02 },
            { x: 255, y: 175, r: 57, s: 0.92 },
            { x: 250, y: 129, r: -48, s: 0.86 },
            { x: 250, y: 85, r: 32, s: 0.7 },
          ].map((leaf, i) => (
            <g
              key={i}
              transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.r}) scale(${leaf.s})`}
            >
              <path
                d={
                  variant === 3
                    ? 'M0 10 C-77 -12 -91 -74 -45 -113 L-26 -72 L-31 -126 Q-17 -141 0 -154 Q22 -134 33 -111 L21 -76 L49 -98 Q81 -58 64 -28 L29 -36 L49 -12 Q27 5 0 10Z'
                    : variant === 5
                      ? 'M0 8 C-35 13 -54 -12 -43 -40 C-68 -65 -58 -93 -35 -100 C-38 -129 -16 -149 0 -157 C22 -145 44 -121 34 -101 C61 -84 65 -61 44 -39 C57 -10 27 9 0 8Z'
                      : 'M0 8 C-61 -12 -62 -94 0 -151 C61 -98 56 -23 0 8Z'
                }
                fill={`url(#${id}-leaf)`}
              />
              <path
                d="M0 8 Q-6 -60 0 -144"
                stroke="#a7ae82"
                strokeWidth="1.8"
                fill="none"
                opacity=".55"
              />
              <path
                d="M-1 -42 L-31 -66 M-1 -71 L-31 -94 M0 -56 L29 -83 M0 -95 L21 -116"
                stroke="#a4ab7c"
                strokeWidth=".8"
                opacity=".35"
                fill="none"
              />
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}

function Dialog({
  title,
  close,
  children,
  drawer = false,
}: {
  title: string
  close: () => void
  children: React.ReactNode
  drawer?: boolean
}) {
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key !== 'Tab') return
      const nodes = dialog.current?.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, [tabindex="0"]',
      )
      if (!nodes?.length) {
        e.preventDefault()
        return
      }
      const first = nodes[0],
        last = nodes[nodes.length - 1]
      if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog.current)
      ) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', key)
    return () => {
      document.body.style.overflow = oldOverflow
      document.removeEventListener('keydown', key)
      previous?.focus()
    }
  }, [close])
  return (
    <div className="modal-shade" onClick={(e) => e.target === e.currentTarget && close()}>
      <div
        className={drawer ? 'dialog cart-drawer' : 'dialog product-dialog'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={dialog}
      >
        <button className="icon-btn dialog-close" onClick={close} aria-label="关闭">
          <X size={23} />
        </button>
        {children}
      </div>
    </div>
  )
}

function App() {
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [bag, setBag] = useState<Record<number, number>>(() => {
    try {
      const data = JSON.parse(localStorage.getItem('mori-bag') || '{}')
      if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
      return Object.fromEntries(
        Object.entries(data)
          .filter(
            ([id, n]) =>
              products.some((p) => p.id === Number(id)) &&
              Number.isInteger(n) &&
              Number(n) > 0 &&
              Number(n) < 100,
          )
          .map(([id, n]) => [Number(id), Number(n)]),
      )
    } catch {
      return {}
    }
  })
  const [message, setMessage] = useState('')
  const [order, setOrder] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  useEffect(() => {
    try {
      localStorage.setItem('mori-bag', JSON.stringify(bag))
    } catch {
      /* Storage is optional. */
    }
  }, [bag])
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(''), 2500)
    return () => clearTimeout(t)
  }, [message])
  const count = Object.values(bag).reduce((a, b) => a + b, 0)
  const total = products.reduce((n, p) => n + p.price * (bag[p.id] || 0), 0)
  const add = (p: Product) => {
    setBag((old) => ({ ...old, [p.id]: Math.min((old[p.id] || 0) + 1, 99) }))
    setOrder(false)
    setMessage(`${p.name}已放入购物袋`)
  }
  const change = (id: number, n: number) => {
    setBag((old) => {
      const next = { ...old }
      const q = (next[id] || 0) + n
      if (q <= 0) delete next[id]
      else next[id] = Math.min(q, 99)
      return next
    })
    setOrder(false)
  }
  const closeProduct = React.useCallback(() => setSelected(null), [])
  const closeCart = React.useCallback(() => setCartOpen(false), [])
  return (
    <>
      <a href="#main" className="skip-link">
        跳到主要内容
      </a>
      <div className="announcement">
        给生活一点绿意。<span>满 ¥299 包邮 · 每一份生长，都被温柔对待</span>
        <Leaf size={12} />
      </div>
      <header className="site-header">
        <a className="brand" href="#" aria-label="MORI 森间首页">
          mori<span>森 间</span>
        </a>
        <nav className={menu ? 'nav-links nav-open' : 'nav-links'} aria-label="主导航">
          <a onClick={() => setMenu(false)} href="#collection">
            植物与器物
          </a>
          <a onClick={() => setMenu(false)} href="#story">
            关于森间
          </a>
          <a onClick={() => setMenu(false)} href="#care">
            养护小记
          </a>
        </nav>
        <div className="nav-actions">
          <span className="nav-note">A slower kind of living.</span>
          <button
            className="bag-button"
            onClick={() => setCartOpen(true)}
            aria-label={`打开购物袋，${count}件商品`}
          >
            <ShoppingBag size={19} />
            <span>{count.toString().padStart(2, '0')}</span>
          </button>
          <button
            className="icon-btn mobile-menu"
            aria-label="切换导航"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="small-line" /> ROOTED IN EVERYDAY LIFE
            </div>
            <h1>
              把日子，
              <br />
              慢慢
              <span className="underlined">
                种好
                <svg viewBox="0 0 270 16" aria-hidden="true">
                  <path d="M3 10 Q130 -2 263 6 M35 15 Q139 3 241 10" />
                </svg>
              </span>
              。
            </h1>
            <p>
              一株植物，一件朴素的器物。
              <br />
              在忙碌的世界里，留一方自在生长的角落。
            </p>
            <a href="#collection" className="pill-button">
              遇见你的第一抹绿 <ArrowUpRight size={18} />
            </a>
            <div className="hero-foot">
              <span className="tiny-star" aria-hidden="true">
                <svg width="34" height="34" viewBox="0 0 34 34">
                  <path
                    d="M17 3V31M3 17H31M7 7L27 27M7 27L27 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span>
                用自然的节奏，
                <br />
                找回生活的呼吸。
              </span>
              <a className="scroll-link" href="#collection" aria-label="向下浏览">
                <ArrowDown size={19} />
              </a>
            </div>
          </div>
          <div className="hero-art">
            <div className="arch-bg" />
            <span className="art-coordinate">
              NATURE IS NOT A PLACE TO VISIT.
              <br />
              IT IS HOME.
            </span>
            <Botanical hero id="hero" />
            <div className="round-stamp">
              <span>GROW SLOW</span>
              <Leaf size={28} strokeWidth={1} />
              <span>LIVE WELL</span>
            </div>
            <div className="specimen-label">
              <span>01 / FICUS ELASTICA</span>
              <span>橡皮树 · 安静的陪伴者</span>
            </div>
            <div className="hero-pagination">
              <span className="active-dot" />
              <span />
              <span />
            </div>
          </div>
        </section>
        <div className="values-strip">
          <span>
            <Leaf size={17} strokeWidth={1.4} /> 为日常而生
          </span>
          <i />
          <span>
            <Sun size={18} strokeWidth={1.4} /> 自然，是最好的设计师
          </span>
          <i />
          <span>
            <Truck size={19} strokeWidth={1.4} /> 带着一份照顾到你身边
          </span>
        </div>
        <section className="collection section-wrap" id="collection">
          <div className="section-top">
            <div>
              <div className="eyebrow">THE EVERYDAY COLLECTION</div>
              <h2>让自然，住进日常。</h2>
            </div>
            <p>
              不必拥有一座花园，
              <br />
              一小片绿意，就足够让生活变得不同。
            </p>
          </div>
          <div className="collection-toolbar">
            <div className="filters" role="group" aria-label="筛选商品">
              {[
                ['all', '全部好物'],
                ['plants', '有生命的绿'],
                ['objects', '有温度的物'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  aria-pressed={category === id}
                  className={category === id ? 'active' : ''}
                  onClick={() => setCategory(id)}
                >
                  {label}
                  {category === id && <span />}
                </button>
              ))}
            </div>
            <span className="results-count">
              {products
                .filter((p) => category === 'all' || p.category === category)
                .length.toString()
                .padStart(2, '0')}{' '}
              件慢生活提案
            </span>
          </div>
          <div className="product-grid">
            {products
              .filter((p) => category === 'all' || p.category === category)
              .map((p) => (
                <article className="product-card" key={p.id}>
                  <div className="product-image" style={{ background: p.color }}>
                    <button
                      className="product-art-button"
                      onClick={() => setSelected(p)}
                      aria-label={`查看${p.name}详情`}
                    >
                      <Botanical id={`product-${p.id}`} variant={p.variant} />
                    </button>
                    <span className="product-badge">
                      {p.category === 'plants' ? '一份生长' : '手作日常'}
                    </span>
                    <button
                      className="quick-add"
                      onClick={() => add(p)}
                      aria-label={`添加${p.name}到购物袋`}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="product-title-row">
                    <button onClick={() => setSelected(p)}>{p.name}</button>
                    <span>¥{p.price}</span>
                  </div>
                  <span className="latin-name">{p.en}</span>
                </article>
              ))}
          </div>
          <p className="collection-note">
            每一株植物都有自己的样子。图片为原创艺术插画，本网站为交互设计演示。
          </p>
        </section>
        <section className="story" id="story">
          <div className="story-art">
            <div className="story-oval">
              <svg viewBox="0 0 400 450" role="img" aria-label="自然形态线描">
                <g fill="none" stroke="#acb28a" strokeWidth="1.4">
                  <path d="M200 420 Q163 267 220 76 M202 389 Q120 354 83 283 M199 348 Q292 285 319 204 M204 286 Q125 257 102 179 M212 224 Q277 190 298 114 M216 163 Q169 123 166 64" />
                  {[
                    [83, 283, -40],
                    [319, 204, 35],
                    [102, 179, -35],
                    [298, 114, 36],
                    [166, 64, -18],
                    [220, 76, 8],
                  ].map(([x, y, r], i) => (
                    <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
                      <path d="M0 0 C-63 -32 -50 -106 0 -150 C52 -98 64 -32 0 0Z" />
                      <path d="M0 0 L0 -148 M0 -32 L-30 -61 M0 -63 L-30 -92 M0 -47 L31 -77 M0 -82 L24 -109" />
                    </g>
                  ))}
                </g>
              </svg>
            </div>
            <span className="story-art-caption">THE ART OF SLOWING DOWN / 森间手记</span>
          </div>
          <div className="story-copy">
            <div className="eyebrow">OUR LITTLE PHILOSOPHY</div>
            <h2>
              生活不必很满，
              <br />
              有生长就好。
            </h2>
            <p>
              森间，来自一个简单的愿望：
              <br />
              让人与自然的距离，再近一点。
            </p>
            <p>
              我们相信，好的生活藏在那些很小的事里。
              <br />
              是一片新叶，是陶器掌心的温度，
              <br />
              也是停下来，给植物浇水的那五分钟。
            </p>
            <a href="#care" className="text-link">
              一起练习，慢慢生活 <ArrowRight size={19} />
            </a>
            <span className="story-sign">with nature, with love.</span>
          </div>
        </section>
        <section className="care section-wrap" id="care">
          <div className="section-top">
            <div>
              <div className="eyebrow">A LITTLE CARE GOES A LONG WAY</div>
              <h2>养绿，也是在养自己。</h2>
            </div>
            <span className="care-no">FIELD NOTES / 003</span>
          </div>
          <div className="care-grid">
            {[
              {
                n: '01',
                title: '找一处喜欢的光',
                en: 'Follow the light',
                icon: <Sun size={31} strokeWidth={1} />,
                text: '大多数室内植物喜欢明亮的散射光。离窗一两米，把强烈直射留给更勇敢的叶子。',
              },
              {
                n: '02',
                title: '听听土壤的声音',
                en: 'Less, but enough',
                icon: (
                  <svg width="33" height="33" viewBox="0 0 33 33">
                    <path
                      d="M16.5 3 C16.5 3 5 16 5 22 a11.5 9 0 0 0 23 0 C28 16 16.5 3 16.5 3Z M11 23 Q11 27 16 27"
                      fill="none"
                      stroke="currentColor"
                    />
                  </svg>
                ),
                text: '别让日历决定浇水。手指伸进土里两厘米，干了再浇，给根系留一点呼吸的空间。',
              },
              {
                n: '03',
                title: '接受一点不完美',
                en: 'Let it grow',
                icon: <Leaf size={31} strokeWidth={1} />,
                text: '一片黄叶，一条斑纹，都是生长的痕迹。照顾它，也允许它按照自己的节奏长大。',
              },
            ].map((note) => (
              <article className="care-card" key={note.n}>
                <div className="care-card-top">
                  <span>{note.n}</span>
                  {note.icon}
                </div>
                <h3>{note.title}</h3>
                <span className="latin-name">{note.en}</span>
                <p>{note.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="faq-section section-wrap">
          <div>
            <div className="eyebrow">GOOD TO KNOW</div>
            <h2>一些小小的解答。</h2>
            <p>
              第一次照顾植物？
              <br />
              我们也是从第一片叶子开始的。
            </p>
          </div>
          <div className="faq-list">
            {[
              [
                '我是新手，适合从哪一株开始？',
                '橡皮树是很好的开始：适应力强，对光照和浇水都比较宽容。先观察家里的光，再选择合适的植物，不必追求一步到位。',
              ],
              [
                '如何判断植物是不是需要浇水？',
                '先摸土，再看叶。表土下约两厘米干燥时再充分浇透，让多余的水从底孔流出。季节、盆径和室内湿度都会影响浇水频率。',
              ],
              [
                '这里可以真实下单吗？',
                '这是 MORI 的独立网站设计样例。你可以体验筛选、商品详情、购物袋与订单摘要；所有数据仅保存在当前浏览器，不会付款、发货或创建真实订单。',
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Plus size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="newsletter">
          <div>
            <div className="eyebrow">LET GOOD THINGS GROW</div>
            <h2>偶尔，收到一点绿意。</h2>
            <p>新鲜的养护灵感、不着急的生活提案。每月一封，刚刚好。</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSubscribed(true)
            }}
          >
            {subscribed ? (
              <p className="subscribe-success" role="status">
                <Check size={20} /> 已记录你的订阅意愿（本地演示，不发送邮件）。
              </p>
            ) : (
              <>
                <label className="sr-only" htmlFor="email">
                  你的电子邮箱
                </label>
                <div className="email-field">
                  <input required id="email" type="email" placeholder="你的电子邮箱" />
                  <button type="submit" aria-label="订阅森间来信">
                    <ArrowRight size={23} />
                  </button>
                </div>
                <span>一封来自森间的信。订阅为本地交互演示。</span>
              </>
            )}
          </form>
        </section>
      </main>
      <footer>
        <div className="footer-top">
          <a className="brand footer-brand" href="#">
            mori<span>森 间</span>
          </a>
          <p>
            植物与器物，
            <br />
            以及生活本来的样子。
          </p>
          <div>
            <a href="#collection">
              遇见好物 <ArrowUpRight size={14} />
            </a>
            <a href="#story">
              我们的故事 <ArrowUpRight size={14} />
            </a>
            <a href="#care">
              照顾一片绿 <ArrowUpRight size={14} />
            </a>
          </div>
          <span className="footer-drawing">
            <Leaf size={55} strokeWidth={0.7} />
          </span>
        </div>
        <div className="footer-bottom">
          <span>© 2026 MORI 森间 · 独立设计样例</span>
          <span>MADE WITH CARE. GROWN WITH TIME.</span>
          <a href="#">回到顶端 ↑</a>
        </div>
      </footer>
      {message && (
        <div className="toast" role="status">
          <Check size={17} />
          {message}
        </div>
      )}
      {selected && (
        <Dialog title={selected.name} close={closeProduct}>
          <div className="detail-art" style={{ background: selected.color }}>
            <Botanical id="detail" variant={selected.variant} />
          </div>
          <div className="detail-copy">
            <div className="eyebrow">A LITTLE PIECE OF NATURE</div>
            <h2>{selected.name}</h2>
            <span className="latin-name">{selected.en}</span>
            <p>{selected.detail}</p>
            <div className="detail-care">
              <Sun size={18} />
              {selected.light}
            </div>
            <div className="detail-bottom">
              <strong>¥{selected.price}</strong>
              <button className="pill-button" onClick={() => add(selected)}>
                加入购物袋 <Plus size={18} />
              </button>
            </div>
            <small>设计样例 · 商品与价格均用于演示</small>
          </div>
        </Dialog>
      )}
      {cartOpen && (
        <Dialog title="你的购物袋" close={closeCart} drawer>
          <div className="cart-heading">
            <div className="eyebrow">A LITTLE BAG OF GOOD THINGS</div>
            <h2>
              你的购物袋 <span>({count})</span>
            </h2>
          </div>
          {count === 0 ? (
            <div className="empty-cart">
              <Leaf size={50} strokeWidth={1} />
              <h3>留一个位置，给绿意。</h3>
              <p>购物袋还是空的，去遇见一件喜欢的好物吧。</p>
              <button
                className="pill-button"
                onClick={() => {
                  closeCart()
                  document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                逛逛日常好物 <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {products
                  .filter((p) => bag[p.id])
                  .map((p) => (
                    <div className="cart-item" key={p.id}>
                      <div className="cart-art" style={{ background: p.color }}>
                        <Botanical id={`bag-${p.id}`} variant={p.variant} />
                      </div>
                      <div className="cart-info">
                        <h3>{p.name}</h3>
                        <span>¥{p.price}</span>
                        <div className="quantity">
                          <button aria-label={`减少${p.name}数量`} onClick={() => change(p.id, -1)}>
                            <Minus size={13} />
                          </button>
                          <span>{bag[p.id]}</span>
                          <button aria-label={`增加${p.name}数量`} onClick={() => change(p.id, 1)}>
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                      <strong>¥{p.price * bag[p.id]}</strong>
                    </div>
                  ))}
              </div>
              <div className="cart-summary">
                <div>
                  <span>商品合计</span>
                  <strong>¥{total}</strong>
                </div>
                <div>
                  <span>运费（演示）</span>
                  <span>{total >= 299 ? '已达包邮' : '¥18'}</span>
                </div>
                <div className="grand-total">
                  <span>总计</span>
                  <strong>¥{total + (total >= 299 ? 0 : 18)}</strong>
                </div>
                {order ? (
                  <div className="order-success" role="status">
                    <Check size={20} />
                    <div>
                      <strong>你的慢生活清单，已准备好。</strong>
                      <p>此为本地订单摘要。未创建真实订单，也不会扣款。商品仍保留在购物袋中。</p>
                    </div>
                  </div>
                ) : (
                  <button className="pill-button checkout" onClick={() => setOrder(true)}>
                    生成订单摘要 <ArrowRight size={18} />
                  </button>
                )}
                <small>独立交互样例 · 不收款，不发货</small>
              </div>
            </>
          )}
        </Dialog>
      )}
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
