import { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowUpRight, ArrowDown, ArrowRight, X, Plus, Download } from 'lucide-react'
import './styles.css'
const works = [
  {
    id: '01',
    name: 'NO SIGNAL',
    category: '品牌系统',
    tag: '独立音乐节 / 2026',
    theme: 'signal',
    description:
      '把噪声变成一种语言。为一场不按常理出牌的音乐节，构建从海报、腕带到数字舞台的一整套身份系统。',
    challenge: '如何让一个没有固定音乐类型的音乐节拥有清晰的视觉身份？',
    method:
      '以干扰信号为母题，把字体拉伸、切片与重新组合。荧光色负责吸引注意，严格的基线网格负责维持信息可读性。',
    deliver: '视觉识别 / 海报系统 / 场地导视 / 动态标识',
  },
  {
    id: '02',
    name: 'OFF TYPE',
    category: '数字体验',
    tag: '独立字体工作室 / 2026',
    theme: 'type',
    description:
      '字不只是用来读的。一个可变化、可触摸、可玩的数字字体展示空间，让用户在选择字体之前，先体验它的性格。',
    challenge: '如何把专业字体参数，转化成人人都愿意参与的体验？',
    method: '先给一个大得无法忽视的字，再给一个能直接改变它的控制器。用即时反馈替代长篇参数介绍。',
    deliver: '网站设计 / 交互原型 / 字体样张 / 设计系统',
  },
  {
    id: '03',
    name: 'NOT MILK',
    category: '品牌系统',
    tag: '植物饮品 / 2025',
    theme: 'milk',
    description: '不装乖的植物力量。让每天早餐桌上的一小盒饮品，成为个性十足的生活宣言。',
    challenge: '如何在充满柔和色彩的健康饮品中，建立反差？',
    method:
      '亮橙色与浓黑文字直接碰撞。包装用大字说清品类，侧面才展开原料与营养信息。视觉大胆，信息诚实。',
    deliver: '品牌策略 / 标识 / 包装 / 社交视觉',
  },
  {
    id: '04',
    name: 'ODD OBJECTS',
    category: '实验项目',
    tag: '持续进行的物件实验 / 2026',
    theme: 'objects',
    description:
      '给无用之物一点有趣的理由。把几何形状、重力和不合时宜的颜色，装进一场持续更新的视觉实验。',
    challenge: '在没有商业brief的情况下，怎样建立持续创作的方法？',
    method: '限定三个基础形状、两种材料和一个意外。每次只改变一个变量，用约束催生新的组合。',
    deliver: '艺术指导 / 3D 语言研究 / 动态实验',
  },
]
function Star() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x="44"
          y="0"
          width="12"
          height="100"
          transform={`rotate(${i * 22.5} 50 50)`}
        />
      ))}
    </svg>
  )
}
function Poster({ theme }: { theme: string }) {
  return (
    <div className={`poster poster-${theme}`} aria-hidden="true">
      <div className="poster-micro">
        <span>
          ODD® EXPERIMENT NO.
          {theme === 'signal' ? '001' : theme === 'type' ? '002' : theme === 'milk' ? '003' : '004'}
        </span>
        <span>2026 ↗</span>
      </div>
      {theme === 'signal' ? (
        <>
          <div className="signal-text">
            NO
            <br />
            <span>SIGNAL</span>
          </div>
          <div className="signal-wave">
            {Array.from({ length: 18 }, (_, i) => (
              <i key={i} style={{ height: `${35 + Math.sin(i * 0.7) * 26}%` }} />
            ))}
          </div>
        </>
      ) : theme === 'type' ? (
        <>
          <div className="type-glyph">
            Aa<span>↗</span>
          </div>
          <div className="type-bottom">
            A TYPE OF
            <br />
            <em>DIFFERENT.</em>
          </div>
        </>
      ) : theme === 'milk' ? (
        <>
          <div className="milk-title">
            PLANT
            <br />
            POWER.
          </div>
          <div className="carton">
            <span>
              100%
              <br />
              PLANTS.
            </span>
            <strong>
              NOT
              <br />
              MILK<span>®</span>
            </strong>
            <small>OAT DRINK / 250 ML</small>
          </div>
          <div className="milk-circle">
            GOOD
            <br />
            BY NATURE.
          </div>
        </>
      ) : (
        <>
          <div className="object-grid" />
          <div className="object-ball" />
          <div className="object-ring" />
          <div className="object-bar" />
          <span className="object-caption">
            MAKE
            <br />
            NO SENSE.
            <br />
            <b>
              MAKE
              <br />
              SOMETHING.
            </b>
          </span>
        </>
      )}
      <span className="poster-bottom">INDEPENDENT THINKING. UNEXPECTED OUTCOMES.</span>
    </div>
  )
}
function App() {
  const [filter, setFilter] = useState('全部')
  const [project, setProject] = useState<(typeof works)[number] | null>(null)
  const [menu, setMenu] = useState(false)
  const [service, setService] = useState('品牌系统')
  const [budget, setBudget] = useState('2–5 万')
  const [brief, setBrief] = useState('')
  const [downloaded, setDownloaded] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    project ? dialog.current?.showModal() : dialog.current?.close()
  }, [project])
  function download() {
    const content = `# ODD 项目简报\n\n服务方向：${service}\n预算范围：${budget}\n\n## 项目想法\n${brief}\n\n此文件由本地设计演示生成，未向工作室发送。\n`
    const a = document.createElement('a')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }))
    a.href = url
    a.download = 'odd-project-brief.md'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setDownloaded(true)
  }
  return (
    <>
      <a className="skip" href="#work">
        跳到作品
      </a>
      <header>
        <a href="#" className="logo" aria-label="ODD首页">
          odd<span>®</span>
        </a>
        <span className="header-note">
          INDEPENDENT MINDS.
          <br />
          UNEXPECTED DESIGN.
        </span>
        <button
          className="menu-button"
          aria-label="切换导航"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Plus />}
        </button>
        <nav className={menu ? 'open' : ''}>
          <a href="#work" onClick={() => setMenu(false)}>
            作品 <span>01</span>
          </a>
          <a href="#about" onClick={() => setMenu(false)}>
            我们 <span>02</span>
          </a>
          <a href="#contact" className="talk" onClick={() => setMenu(false)}>
            搞点事情 <ArrowUpRight size={20} />
          </a>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-top">
            <span>CREATIVE STUDIO / SHANGHAI + EVERYWHERE</span>
            <span>
              <i /> OPEN FOR ODD IDEAS
            </span>
          </div>
          <h1>
            GOOD IS
            <br />
            <span>BORING.</span>
            <svg className="scribble" viewBox="0 0 800 160" aria-hidden="true">
              <path d="M15 99Q221 -15 746 41Q813 51 754 102Q370 180 43 120Q5 110 45 88Q280 2 734 41" />
            </svg>
          </h1>
          <div className="hero-bottom">
            <p>
              别做「还不错」。
              <br />
              做让人<span>忘不掉</span>的。
            </p>
            <div className="hero-description">
              我们是一间保持古怪的独立创意工作室。
              <br />
              用大胆的品牌、数字体验和一点点不讲道理，
              <br />
              帮有想法的人，把想法变成现实。
            </div>
            <a href="#work" className="hero-arrow" aria-label="探索作品">
              <ArrowDown size={54} />
            </a>
          </div>
          <div className="sticker">
            <Star />
            <span>
              STAY
              <br />A LITTLE
              <br />
              ODD.
            </span>
          </div>
        </section>
        <div className="ticker">
          <span>LESS EXPECTED</span>
          <Star />
          <span>MORE REMEMBERED</span>
          <Star />
          <span>少一点套路，多一点记忆点</span>
          <Star />
        </div>
        <section className="work" id="work">
          <div className="section-head">
            <h2>
              SELECTED
              <br />
              <span>WORK.</span>
              <sup>(04)</sup>
            </h2>
            <div>
              <p>
                一些认真做出来的，
                <br />
                不太正经的东西。
              </p>
              <div className="filters">
                {['全部', '品牌系统', '数字体验', '实验项目'].map((x) => (
                  <button aria-pressed={x === filter} key={x} onClick={() => setFilter(x)}>
                    {x}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="work-grid">
            {works
              .filter((w) => filter === '全部' || filter === w.category)
              .map((w) => (
                <article className={`work-card card-${w.theme}`} key={w.id}>
                  <button
                    className="work-art"
                    onClick={() => setProject(w)}
                    aria-label={`查看${w.name}项目`}
                  >
                    <Poster theme={w.theme} />
                    <span className="project-open">
                      <ArrowUpRight size={27} />
                    </span>
                  </button>
                  <div className="project-info">
                    <button onClick={() => setProject(w)}>
                      {w.name}
                      <ArrowUpRight size={23} />
                    </button>
                    <p>{w.tag}</p>
                    <span>{w.category}</span>
                  </div>
                </article>
              ))}
          </div>
        </section>
        <section className="about" id="about">
          <div className="about-top">
            <span>02 / NO ORDINARY STUDIO</span>
            <span>GOOD PEOPLE. ODD IDEAS.</span>
          </div>
          <div className="about-main">
            <h2>
              正常很安全。
              <br />
              我们选<span>有趣。</span>
            </h2>
            <div>
              <p>
                世界上已经有够多「差不多」。
                <br />
                差不多的品牌、差不多的页面、差不多的体验。
              </p>
              <p>
                我们想做一点不一样的。
                <br />
                从一个好问题出发，找到属于你的那一点古怪。
                <br />
                再把它，放大到无法忽视。
              </p>
              <a href="#contact">
                把你的怪点子告诉我们 <ArrowUpRight />
              </a>
            </div>
          </div>
          <div className="services">
            {[
              [
                '01',
                '品牌系统',
                'BRAND IDENTITIES',
                '策略、命名、视觉识别、包装，让你的品牌从第一眼就有自己的声音。',
              ],
              [
                '02',
                '数字体验',
                'DIGITAL EXPERIENCES',
                '网站、交互、数字产品。好看是起点，好用和有记忆点才是目的地。',
              ],
              [
                '03',
                '艺术指导',
                'ART DIRECTION',
                '从一个视觉概念，到一整个世界。让图像、文字和动效朝同一个方向走。',
              ],
            ].map(([n, t, en, desc]) => (
              <details key={n}>
                <summary>
                  <span>{n}</span>
                  <h3>{t}</h3>
                  <small>{en}</small>
                  <Plus />
                </summary>
                <p>{desc}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="process">
          <span>HOW WE MAKE IT HAPPEN / 不是魔法，是方法。</span>
          <div>
            {[
              ['01', '问点好问题。', 'QUESTION', '先理解你、你的用户，以及你不想成为谁。'],
              ['02', '允许跑偏。', 'EXPLORE', '尝试三种方向，推到极端，找到最有生命力的那个。'],
              ['03', '认真到细节。', 'MAKE', '把想法打磨成完整的系统，让每一个触点都成立。'],
            ].map(([n, t, en, p]) => (
              <article key={n}>
                <b>{n}</b>
                <h3>{t}</h3>
                <span>{en}</span>
                <p>{p}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="contact" id="contact">
          <div className="contact-title">
            <span>03 / MAKE SOMETHING MATTER</span>
            <h2>
              GOT AN
              <br />
              <em>ODD</em> IDEA<span>?</span>
            </h2>
            <p>
              先把想法写下来。
              <br />
              好项目，往往从一句「要不我们……」开始。
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              download()
            }}
          >
            <fieldset>
              <legend>01 / 你想做什么？</legend>
              <div className="choice-row">
                {['品牌系统', '数字体验', '艺术指导'].map((s) => (
                  <button
                    type="button"
                    key={s}
                    aria-pressed={service === s}
                    onClick={() => {
                      setService(s)
                      setDownloaded(false)
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
            <label htmlFor="budget">02 / 预算范围</label>
            <select
              id="budget"
              value={budget}
              onChange={(e) => {
                setBudget(e.target.value)
                setDownloaded(false)
              }}
            >
              {['2–5 万', '5–10 万', '10 万以上', '还没想好'].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
            <label htmlFor="brief">03 / 说说你的想法</label>
            <textarea
              id="brief"
              required
              minLength={5}
              maxLength={2000}
              placeholder="不必很完整。有点古怪更好。"
              value={brief}
              onChange={(e) => {
                setBrief(e.target.value)
                setDownloaded(false)
              }}
            />
            <button className="download-button">
              生成我的项目简报 <Download size={21} />
            </button>
            <small role="status">
              {downloaded
                ? '简报已生成并下载。你可以保存或自行发送给合作方。'
                : '本地简报工具 · 不会向服务器发送你的信息'}
            </small>
          </form>
        </section>
      </main>
      <footer>
        <a href="#" className="footer-word">
          odd<span>®</span>
        </a>
        <div>
          <span>
            BE GOOD.
            <br />
            STAY ODD.
          </span>
          <p>
            © 2026 ODD STUDIO
            <br />
            原创设计研究 · 虚构工作室与项目
          </p>
          <a href="#">
            BACK TO TOP <ArrowUpRight size={20} />
          </a>
        </div>
      </footer>
      <dialog
        className="project-dialog"
        ref={dialog}
        aria-labelledby="project-title"
        onCancel={() => setProject(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setProject(null)
        }}
      >
        <button className="close" aria-label="关闭项目" onClick={() => setProject(null)}>
          <X />
        </button>
        {project && (
          <>
            <Poster theme={project.theme} />
            <div className="project-detail">
              <span>CASE STUDY / {project.id}</span>
              <h2 id="project-title">{project.name}</h2>
              <p className="detail-intro">{project.description}</p>
              <h3>THE QUESTION / 问题</h3>
              <p>{project.challenge}</p>
              <h3>THE APPROACH / 方法</h3>
              <p>{project.method}</p>
              <h3>THE OUTPUT / 产出方向</h3>
              <p>{project.deliver}</p>
              <small>虚构设计案例，用于展示视觉系统与项目叙事。</small>
              <a href="#contact" onClick={() => setProject(null)}>
                一起做点不一样的 <ArrowRight size={20} />
              </a>
            </div>
          </>
        )}
      </dialog>
    </>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
