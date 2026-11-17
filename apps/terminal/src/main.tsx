import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Code2,
  Copy,
  GitBranch,
  Layers,
  Menu,
  Play,
  Plus,
  ShieldCheck,
  Terminal,
  Workflow,
  X,
  Zap,
} from 'lucide-react'
import './styles.css'

const commands = {
  deploy: {
    label: '部署项目',
    command: 'trace deploy --preview',
    lines: [
      '● Resolving project configuration...',
      '✓ Framework detected: Vite + React',
      '✓ Build completed in 1.24s',
      '✓ 12 assets optimized · 48.2 kB gzip',
      '✓ Preview environment created (simulation)',
      '→ Preview: demo.local / constellation',
      '✓ Done. Your next idea is ready.',
    ],
  },
  check: {
    label: '检查质量',
    command: 'trace check --all',
    lines: [
      '● Starting quality checks...',
      '✓ TypeScript · 0 errors',
      '✓ Lint · 42 files checked',
      '✓ Unit tests · 24 / 24 passed (sample data)',
      '✓ Accessibility · 0 critical issues (sample data)',
      '→ Quality score: 98 / 100 (simulation)',
      '✓ All systems ready.',
    ],
  },
  status: {
    label: '查看状态',
    command: 'trace status',
    lines: [
      '● Connecting to local workspace...',
      '✓ Project: constellation',
      '✓ Branch: main · working tree clean',
      '✓ Environment: local demo',
      '→ Last deployment: just now (simulation)',
      '→ Regions: sin1 · fra1 · sfo1 (sample)',
      '✓ Everything in its right place.',
    ],
  },
} as const
type CommandKey = keyof typeof commands
const snippets = {
  config: [
    '// trace.config.ts',
    'import { defineConfig } from "trace"',
    '',
    'export default defineConfig({',
    '  project: "constellation",',
    '  framework: "vite",',
    '  region: "auto",',
    '  preview: {',
    '    enabled: true,',
    '    branches: ["*"],',
    '  },',
    '})',
  ],
  workflow: [
    '# .github/workflows/trace.yml',
    'name: Ship with confidence',
    'on: [push, pull_request]',
    '',
    'jobs:',
    '  deploy:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - run: npm ci',
    '      - run: npm run build',
    '      # Illustrative configuration only',
  ],
} as const

function App() {
  const [activeCommand, setActiveCommand] = useState<CommandKey>('deploy')
  const [lines, setLines] = useState<string[]>([...commands.deploy.lines])
  const [running, setRunning] = useState(false)
  const [editorTab, setEditorTab] = useState<'terminal' | 'config'>('terminal')
  const [snippet, setSnippet] = useState<'config' | 'workflow'>('config')
  const [copied, setCopied] = useState(false)
  const [fallback, setFallback] = useState(false)
  const [annual, setAnnual] = useState(false)
  const [plan, setPlan] = useState<string | null>(null)
  const [faq, setFaq] = useState<number | null>(0)
  const [menu, setMenu] = useState(false)
  const [customCommand, setCustomCommand] = useState('')
  const [notice, setNotice] = useState('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const log = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && (event.key === '1' || event.key === '2')) {
        event.preventDefault()
        setEditorTab(event.key === '1' ? 'terminal' : 'config')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  useEffect(() => {
    log.current?.scrollTo(0, log.current.scrollHeight)
  }, [lines])
  useEffect(() => {
    if (plan) dialog.current?.showModal()
    else dialog.current?.close()
  }, [plan])

  function runCommand(key: CommandKey) {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setActiveCommand(key)
    setEditorTab('terminal')
    setLines([])
    setRunning(true)
    setNotice('')
    commands[key].lines.forEach((line, i) => {
      timers.current.push(
        setTimeout(
          () => {
            setLines((old) => [...old, line])
            if (i === commands[key].lines.length - 1) setRunning(false)
          },
          220 + i * 280,
        ),
      )
    })
  }

  function submitCommand(event: React.FormEvent) {
    event.preventDefault()
    if (running) return
    const value = customCommand
      .trim()
      .toLowerCase()
      .replace(/^trace\s+/, '')
      .split(' ')[0]
    if (value === 'deploy' || value === 'check' || value === 'status') runCommand(value)
    else if (value === 'clear') setLines([])
    else if (value === 'help')
      setLines([
        'AVAILABLE LOCAL DEMO COMMANDS',
        '→ deploy  simulate preview deployment',
        '→ check   simulate quality checks',
        '→ status  show illustrative project status',
        '→ clear   clear this terminal',
        'No commands reach a server or execute shell code.',
      ])
    else if (value)
      setLines((old) => [
        ...old,
        `Command not found: ${customCommand.trim()}`,
        '→ Try deploy, check, status, clear, or help.',
      ])
    setCustomCommand('')
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText('trace deploy --preview')
      setCopied(true)
      setFallback(false)
      timers.current.push(setTimeout(() => setCopied(false), 1800))
    } catch {
      setFallback(true)
    }
  }

  function focusDemo() {
    document.getElementById('live-demo')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'center',
    })
    setEditorTab('terminal')
    timers.current.push(setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 350))
  }

  return (
    <div className="trace-site">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <div className="grid-backdrop" aria-hidden="true" />
      <div className="announcement">
        <span className="announcement-tag">DESIGN STUDY</span>
        <span>终端美学 × 开发者体验 · 浏览器本地交互演示</span>
        <ArrowUpRight size={12} />
      </div>
      <nav className="nav shell" aria-label="主导航">
        <a href="#" className="brand">
          <span className="brand-symbol">▰</span> TRACE<span className="brand-version">/ 0.1</span>
        </a>
        <div className={`nav-links ${menu ? 'nav-open' : ''}`}>
          <a href="#features" onClick={() => setMenu(false)}>
            Features
          </a>
          <a href="#workflow" onClick={() => setMenu(false)}>
            Workflow
          </a>
          <a href="#pricing" onClick={() => setMenu(false)}>
            Pricing
          </a>
          <a href="#faq" onClick={() => setMenu(false)}>
            FAQ
          </a>
        </div>
        <button className="nav-button" onClick={focusDemo}>
          Try the demo <ArrowUpRight size={13} />
        </button>
        <button
          className="menu-button"
          onClick={() => setMenu(!menu)}
          aria-label={menu ? '关闭导航' : '打开导航'}
          aria-expanded={menu}
        >
          {menu ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      <main id="main-content">
        <section className="hero shell">
          <div className="hero-label">
            <span className="status-light" /> BUILT FOR THE WAY YOU THINK
            <span className="label-line" />
          </div>
          <div className="hero-heading">
            <h1>
              Less friction.
              <br />
              More{' '}
              <span>
                flow<span className="cursor">_</span>
              </span>
            </h1>
            <div className="hero-description">
              <p>
                从第一个想法，到最后一次部署。
                <br />
                把复杂藏在工具里，把专注留给你。
              </p>
              <span>ONE WORKSPACE. ZERO CONTEXT SWITCHING.</span>
              <div className="hero-actions">
                <button className="primary-button" onClick={focusDemo}>
                  进入交互终端 <ArrowRight size={16} />
                </button>
                <a href="#workflow">
                  看看它如何工作 <ChevronRight size={15} />
                </a>
              </div>
            </div>
          </div>
          <div className="workspace" id="live-demo">
            <div className="workspace-title">
              <span className="window-dots">
                <i />
                <i />
                <i />
              </span>
              <span>constellation / workspace</span>
              <span>
                <GitBranch size={12} /> main
              </span>
            </div>
            <div className="workspace-body">
              <aside className="workspace-sidebar">
                <div className="project-heading">
                  <span className="project-icon">c.</span>
                  <div>
                    constellation<span>Personal workspace</span>
                  </div>
                  <ChevronDown size={12} />
                </div>
                <span className="sidebar-label">WORKSPACE</span>
                <button
                  className={editorTab === 'terminal' ? 'sidebar-active' : ''}
                  onClick={() => setEditorTab('terminal')}
                >
                  <Terminal size={14} /> Terminal <span>⌘ 1</span>
                </button>
                <button
                  className={editorTab === 'config' ? 'sidebar-active' : ''}
                  onClick={() => setEditorTab('config')}
                >
                  <Code2 size={14} /> Configuration <span>⌘ 2</span>
                </button>
                <span className="sidebar-label second-label">QUICK ACTIONS</span>
                {(Object.keys(commands) as CommandKey[]).map((key) => (
                  <button
                    key={key}
                    className={
                      activeCommand === key && editorTab === 'terminal' ? 'command-selected' : ''
                    }
                    onClick={() => runCommand(key)}
                    disabled={running}
                  >
                    <span className="command-dot" />
                    {commands[key].label}
                    <ChevronRight size={12} />
                  </button>
                ))}
                <div className="sidebar-bottom">
                  <span className="status-light" /> Local demo mode
                  <small>All output is simulated.</small>
                </div>
              </aside>
              <div className="terminal-area">
                <div className="editor-tabs">
                  <button
                    className={editorTab === 'terminal' ? 'editor-tab-active' : ''}
                    onClick={() => setEditorTab('terminal')}
                  >
                    <Terminal size={12} /> terminal <span>×</span>
                  </button>
                  <button
                    className={editorTab === 'config' ? 'editor-tab-active' : ''}
                    onClick={() => setEditorTab('config')}
                  >
                    <Code2 size={12} /> trace.config.ts <span>○</span>
                  </button>
                  <span className="local-badge">LOCAL SIMULATION</span>
                </div>
                {editorTab === 'terminal' ? (
                  <>
                    <div className="terminal-content" ref={log}>
                      <div className="terminal-welcome">
                        <span>TRACE CLI</span> <small>v0.1.0 / browser demo</small>
                      </div>
                      <p className="terminal-command">
                        <span>~/constellation</span> <b>❯</b> {commands[activeCommand].command}
                      </p>
                      <div
                        className="terminal-lines"
                        role="log"
                        aria-live="polite"
                        aria-label="本地模拟命令输出"
                      >
                        {lines.map((line, i) => (
                          <div
                            key={`${line}-${i}`}
                            className={
                              line.startsWith('✓')
                                ? 'success-line'
                                : line.startsWith('→')
                                  ? 'info-line'
                                  : ''
                            }
                          >
                            <span>{line.slice(0, 1)}</span>
                            {line.slice(1)}
                          </div>
                        ))}
                      </div>
                      {running && (
                        <div className="running-line">
                          <span className="loading-dot" /> Running local simulation...
                        </div>
                      )}
                    </div>
                    <form className="terminal-input" onSubmit={submitCommand}>
                      <label htmlFor="command-input">❯</label>
                      <input
                        ref={inputRef}
                        id="command-input"
                        value={customCommand}
                        onChange={(e) => setCustomCommand(e.target.value)}
                        placeholder={running ? 'Working…' : '输入 help 查看命令'}
                        disabled={running}
                        autoComplete="off"
                        spellCheck={false}
                        aria-label="输入演示命令"
                      />
                      <button type="submit" disabled={running} aria-label="执行本地模拟命令">
                        <ArrowRight size={16} />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="config-preview">
                    <p className="config-caption">示意配置 · 用于展示信息架构，不连接真实服务</p>
                    {snippets.config.map((line, i) => (
                      <div key={i}>
                        <span>{i + 1}</span>
                        <code className={line.trim().startsWith('//') ? 'code-comment' : ''}>
                          {line || ' '}
                        </code>
                      </div>
                    ))}
                  </div>
                )}
                <div className="editor-status">
                  <span>
                    <GitBranch size={11} /> main* <span>⊗ 0</span>
                    <span>⚠ 0</span>
                  </span>
                  <span>
                    UTF-8 <span>TypeScript</span>
                    <span>✓ Ready</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-bottom">
            <span>
              <ShieldCheck size={13} /> 无需注册 · 无需连接代码仓库
            </span>
            <span>DESIGNED FOR DEVELOPERS, BY DESIGN.</span>
            <a href="#features" aria-label="探索功能">
              <ArrowDown size={15} />
            </a>
          </div>
        </section>
        <section className="compatibility shell">
          <span>FEELS RIGHT AT HOME WITH</span>
          <div>
            <b>
              React <small>↗</small>
            </b>
            <b>Next.js</b>
            <b>
              Vite <span>ϟ</span>
            </b>
            <b>
              TypeScript<span className="ts-logo">TS</span>
            </b>
            <b>
              Astro <span>Λ</span>
            </b>
          </div>
          <p>生态名称用于界面展示；本演示不执行框架集成。</p>
        </section>
        <section className="section shell" id="features">
          <div className="section-header">
            <div>
              <span className="eyebrow">01 / LESS IN THE WAY</span>
              <h2>
                Your stack. <span>In sync.</span>
              </h2>
            </div>
            <p>
              工具不应该成为另一个需要管理的项目。
              <br />
              从清晰的状态，到自然的下一步。
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature-large">
              <div className="feature-icon">
                <Workflow size={20} />
              </div>
              <h3>
                从想法到上线，
                <br />
                保持同一个节奏。
              </h3>
              <p>
                构建、检查、预览。在一个连贯的工作流里完成，
                <br />
                把切换工具的时间，留给真正有意思的事。
              </p>
              <div className="pipeline">
                <div>
                  <Code2 size={18} />
                  <span>Write</span>
                  <small>your next idea</small>
                </div>
                <i />
                <div>
                  <Check size={18} />
                  <span>Check</span>
                  <small>with confidence</small>
                </div>
                <i />
                <div>
                  <Zap size={18} />
                  <span>Ship</span>
                  <small>without friction</small>
                </div>
              </div>
              <div className="feature-meta">
                <span>ONE CONTINUOUS WORKFLOW</span>
                <ArrowUpRight size={16} />
              </div>
            </article>
            <article>
              <div className="feature-icon">
                <Zap size={19} />
              </div>
              <h3>
                更少等待，
                <br />
                更多心流。
              </h3>
              <p>
                用明确的进度和即时反馈，
                <br />
                让每一个操作都心中有数。
              </p>
              <div className="speed-viz">
                <span>BUILD COMPLETE</span>
                <strong>
                  1.24<small>s</small>
                </strong>
                <div>
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <small>ILLUSTRATIVE METRIC</small>
              </div>
            </article>
            <article>
              <div className="feature-icon">
                <Layers size={19} />
              </div>
              <h3>
                复杂系统，
                <br />
                清晰呈现。
              </h3>
              <p>
                一致的视觉语言和状态系统，
                <br />
                让信息一眼就能读懂。
              </p>
              <div className="status-viz">
                <div>
                  <span>
                    <i className="green-dot" /> Production
                  </span>
                  <b>Healthy</b>
                </div>
                <div>
                  <span>
                    <i className="yellow-dot" /> Preview
                  </span>
                  <b>Building</b>
                </div>
                <div>
                  <span>
                    <i className="gray-dot" /> Development
                  </span>
                  <b>Idle</b>
                </div>
              </div>
            </article>
          </div>
        </section>
        <section className="section workflow shell" id="workflow">
          <div className="workflow-copy">
            <span className="eyebrow">02 / YOUR NEXT GOOD HABIT</span>
            <h2>
              A small config.
              <br />
              <span>A clear path.</span>
            </h2>
            <p>
              好的工具应该顺着你的思路走。
              <br />
              少一点配置的噪音，多一点表达的空间。
            </p>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <h3>从熟悉的项目开始</h3>
                  <p>沿用你喜欢的框架和代码组织方式。</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h3>让约定替你处理细节</h3>
                  <p>通过可读的配置，理解每一个默认行为。</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h3>每一步，都有清晰的反馈</h3>
                  <p>成功、等待或错误，下一步始终明确。</p>
                </div>
              </li>
            </ol>
            <button className="text-button" onClick={focusDemo}>
              在演示终端里试一试 <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="code-window">
            <div className="code-window-top">
              <div>
                {(['config', 'workflow'] as const).map((item) => (
                  <button
                    key={item}
                    className={snippet === item ? 'code-tab-active' : ''}
                    onClick={() => setSnippet(item)}
                  >
                    {item === 'config' ? 'trace.config.ts' : 'workflow.yml'}
                  </button>
                ))}
              </div>
              <Code2 size={13} />
            </div>
            <div className="code-body">
              {snippets[snippet].map((line, i) => (
                <div key={i}>
                  <span>{i + 1}</span>
                  <code
                    className={
                      line.trim().startsWith('//') || line.trim().startsWith('#')
                        ? 'code-comment'
                        : line.includes('"')
                          ? 'code-string'
                          : ''
                    }
                  >
                    {line || ' '}
                  </code>
                </div>
              ))}
            </div>
            <div className="code-window-footer">
              <span>
                <Circle size={7} fill="currentColor" /> READABLE BY DESIGN
              </span>
              <span>示意代码</span>
            </div>
          </div>
        </section>
        <section className="manifesto shell">
          <span className="eyebrow">A NOTE TO THE PEOPLE WHO BUILD</span>
          <blockquote>
            “The best tool is the one
            <br />
            that lets you <em>forget the tool.</em>”
          </blockquote>
          <div>
            <span>TRACE DESIGN PRINCIPLE / 001</span>
            <span className="manifesto-line" />
            <span>让工具退后，让创造向前。</span>
          </div>
        </section>
        <section className="section pricing shell" id="pricing">
          <div className="section-header">
            <div>
              <span className="eyebrow">03 / ROOM TO GROW</span>
              <h2>
                Start small. <span>Think big.</span>
              </h2>
            </div>
            <div className="billing-control">
              <span>月付</span>
              <button
                role="switch"
                aria-checked={annual}
                aria-label="切换年付价格"
                className={annual ? 'billing-switch annual' : 'billing-switch'}
                onClick={() => setAnnual(!annual)}
              >
                <i />
              </button>
              <span>
                年付 <b>−20%</b>
              </span>
            </div>
          </div>
          <p className="pricing-note">以下为定价界面交互演示，不提供真实付费服务。</p>
          <div className="pricing-grid">
            {[
              {
                name: 'Hobby',
                tag: 'FOR THE WEEKEND IDEAS',
                price: 0,
                description: '给那些值得开始的小想法。',
                features: [
                  '1 个示例工作空间',
                  '本地命令交互演示',
                  '示例配置与工作流',
                  '无需信用卡',
                ],
              },
              {
                name: 'Pro',
                tag: 'FOR YOUR NEXT BIG THING',
                price: annual ? 16 : 20,
                description: '给认真打磨的下一个作品。',
                features: [
                  '无限示例项目',
                  '分支预览界面展示',
                  '质量检查状态展示',
                  '工作流配置示例',
                ],
              },
              {
                name: 'Team',
                tag: 'FOR BUILDING TOGETHER',
                price: annual ? 32 : 40,
                description: '给一起创造的人。',
                features: [
                  '团队空间界面示例',
                  '角色与权限设计模式',
                  '协作状态视觉展示',
                  '团队工作流说明',
                ],
              },
            ].map((item, i) => (
              <article key={item.name} className={i === 1 ? 'plan featured-plan' : 'plan'}>
                {i === 1 && <span className="plan-popular">THE SWEET SPOT</span>}
                <span className="plan-tag">{item.tag}</span>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="plan-price">
                  <span>$</span>
                  {item.price}
                  <small>/ 人 / 月</small>
                </div>
                <span className="plan-period">
                  {item.price === 0
                    ? 'Always a good place to start.'
                    : annual
                      ? `年付合计 $${item.price * 12} / 人`
                      : '按月计费 · 随时调整'}
                </span>
                <button onClick={() => setPlan(item.name)}>
                  {i === 0 ? '体验免费方案' : '查看方案详情'}
                  <ArrowUpRight size={14} />
                </button>
                <ul>
                  {item.features.map((f) => (
                    <li key={f}>
                      <Check size={13} />
                      {f}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
        <section className="section faq shell" id="faq">
          <div>
            <span className="eyebrow">04 / GOOD QUESTIONS</span>
            <h2>
              A little
              <br />
              <span>more clarity.</span>
            </h2>
            <p>关于这个演示，你可能想知道。</p>
          </div>
          <div className="faq-list">
            {[
              [
                'TRACE 是可以安装使用的真实工具吗？',
                '当前 TRACE 是独立的界面与交互设计习作，不是已发布的命令行工具。页面里的 trace 命令在浏览器中模拟执行，不会连接服务器、部署项目或修改文件。',
              ],
              [
                '终端里显示的测试和性能数据是真实的吗？',
                '不是。测试数量、构建耗时、部署区域与质量得分都是明确标注的示例数据，用于展示状态反馈与信息层级；不代表本项目实际的测试或性能结果。',
              ],
              [
                '可以在终端输入哪些命令？',
                '支持 deploy、check、status、clear 和 help，也支持添加 trace 前缀。所有输入仅在本地解释；其他命令会返回提示，不会执行系统 shell。',
              ],
              [
                '如何把这套风格用于自己的项目？',
                '从等宽字体、8px 间距系统、低对比边框和明确的状态色开始。保留必要的信息层级，并保证文本对比度、键盘焦点和减少动效设置。',
              ],
            ].map(([question, answer], i) => (
              <div key={question} className={`faq-item ${faq === i ? 'faq-open' : ''}`}>
                <button
                  aria-expanded={faq === i}
                  aria-controls={`faq-answer-${i}`}
                  onClick={() => setFaq(faq === i ? null : i)}
                >
                  {question}
                  <Plus size={15} />
                </button>
                <p id={`faq-answer-${i}`} hidden={faq !== i}>
                  {answer}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="closing shell">
          <div className="closing-grid" aria-hidden="true" />
          <span className="eyebrow">
            <span className="status-light" /> READY WHEN YOU ARE
          </span>
          <h2>
            Your next idea
            <br />
            deserves <span>a clear path.</span>
          </h2>
          <div className="copy-command">
            <code>
              <span>$</span> trace deploy --preview
            </code>
            <button onClick={copyCommand} aria-label="复制示例命令">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <span className="copy-status" aria-live="polite">
            {copied ? '示例命令已复制' : '在上方演示终端中执行 · 无需安装'}
          </span>
          {fallback && (
            <input
              className="copy-fallback"
              aria-label="请选中复制示例命令"
              readOnly
              value="trace deploy --preview"
              onFocus={(e) => e.target.select()}
            />
          )}
          <button
            className="text-button"
            onClick={() => {
              runCommand('deploy')
              focusDemo()
            }}
          >
            运行本地演示 <ArrowRight size={15} />
          </button>
          {notice && <p role="status">{notice}</p>}
        </section>
      </main>
      <footer className="footer shell">
        <a className="brand" href="#">
          <span className="brand-symbol">▰</span> TRACE
        </a>
        <span>LESS FRICTION. MORE FLOW.</span>
        <small>© 2026 TRACE / 原创开发工具界面习作</small>
        <a href="#">
          BACK TO TOP <ArrowUpRight size={12} />
        </a>
      </footer>
      <dialog
        ref={dialog}
        className="plan-dialog"
        aria-labelledby="plan-title"
        onCancel={() => setPlan(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPlan(null)
        }}
      >
        <div className="dialog-heading">
          <span>PLAN PREVIEW / {plan?.toUpperCase()}</span>
          <button aria-label="关闭方案详情" onClick={() => setPlan(null)}>
            <X size={18} />
          </button>
        </div>
        <h2 id="plan-title">
          {plan}
          <span>，为你的下一步。</span>
        </h2>
        <p>
          你选择了 <b>{plan}</b> 方案和<b>{annual ? '年付' : '月付'}</b>
          模式。这里是定价流程的交互演示，没有付款、账户创建或服务开通。
        </p>
        <div className="dialog-note">
          <ShieldCheck size={18} />
          <span>
            所有交互在浏览器本地完成。
            <br />
            无需提供任何个人或支付信息。
          </span>
        </div>
        <button
          className="primary-button"
          onClick={() => {
            setPlan(null)
            focusDemo()
          }}
        >
          返回终端体验 <ArrowRight size={15} />
        </button>
      </dialog>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
