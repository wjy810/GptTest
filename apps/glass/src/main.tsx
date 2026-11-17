import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDown, ArrowRight, ArrowUpRight, AudioLines, Check, ChevronLeft, ChevronRight, Headphones, Heart, Menu, Moon, Pause, Play, Plus, Sparkles, Sun, Volume2, Waves, X } from 'lucide-react'
import './styles.css'

const tracks = [
  { name: 'Somewhere, softer.', category: 'DEEP FOCUS', author: 'A quiet place to begin.', time: '04:32', frequency: 174, color: 'violet', mood: '专注', description: '低频音色与缓慢起伏，留出属于自己的思考空间。' },
  { name: 'Light through water.', category: 'SLOW DOWN', author: 'Let the outside world wait.', time: '06:18', frequency: 220, color: 'blue', mood: '放松', description: '像阳光穿过水面，让纷乱的思绪一点点沉下来。' },
  { name: 'A distant morning.', category: 'FRESH START', author: 'A little room for possibility.', time: '05:46', frequency: 261.63, color: 'peach', mood: '灵感', description: '柔和明亮的音色，适合空白画布前的第一刻。' },
  { name: 'After the last light.', category: 'REST EASY', author: 'Nothing else to do tonight.', time: '08:04', frequency: 146.83, color: 'green', mood: '休息', description: '把今天留在身后，以安静的低音为一天收尾。' },
]

function App() {
  const [track, setTrack] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(24)
  const [favorite, setFavorite] = useState<number[]>([])
  const [filter, setFilter] = useState('全部')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const [menu, setMenu] = useState(false)
  const [faq, setFaq] = useState<number | null>(0)
  const [timer, setTimer] = useState(0)
  const context = useRef<AudioContext | null>(null)
  const gain = useRef<GainNode | null>(null)
  const voices = useRef<OscillatorNode[]>([])
  const current = tracks[track]

  function stopSound() {
    voices.current.forEach(voice => { try { voice.stop() } catch { /* Already stopped. */ } })
    voices.current = []
  }

  async function startSound(index: number) {
    try {
      if (!context.current) context.current = new AudioContext()
      await context.current.resume()
      stopSound()
      const bus = context.current.createGain()
      bus.gain.setValueAtTime(volume / 100 * 0.12, context.current.currentTime)
      bus.connect(context.current.destination)
      gain.current?.disconnect()
      gain.current = bus
      ;[1, 1.5, 2].forEach((ratio, i) => {
        const osc = context.current!.createOscillator()
        const level = context.current!.createGain()
        osc.type = 'sine'
        osc.frequency.value = tracks[index].frequency * ratio
        osc.detune.value = i * 2
        level.gain.value = 1 / (i + 1)
        osc.connect(level).connect(bus)
        osc.start()
        voices.current.push(osc)
      })
      setPlaying(true)
      setError('')
    } catch { setPlaying(false); setError('当前浏览器无法播放音色。请尝试支持 Web Audio 的浏览器。') }
  }

  function togglePlay() {
    if (playing) { stopSound(); setPlaying(false) }
    else void startSound(track)
  }

  function selectTrack(index: number) {
    setTrack(index)
    setElapsed(0)
    if (playing) void startSound(index)
  }

  useEffect(() => { gain.current?.gain.setTargetAtTime(volume / 100 * 0.12, context.current?.currentTime ?? 0, 0.15) }, [volume])
  useEffect(() => {
    if (!playing) return
    const interval = setInterval(() => setElapsed(v => v + 1), 1000)
    return () => clearInterval(interval)
  }, [playing])
  useEffect(() => {
    if (timer > 0 && elapsed >= timer * 60) { stopSound(); setPlaying(false); setTimer(0) }
  }, [elapsed, timer])
  useEffect(() => () => { stopSound(); void context.current?.close() }, [])

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
  const toggleFavorite = (index: number) => setFavorite(items => items.includes(index) ? items.filter(i => i !== index) : [...items, index])

  return <div className="aura-site"><a className="skip-link" href="#main-content">跳到主要内容</a>
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <nav className="nav shell" aria-label="主导航"><a className="brand" href="#"><AudioLines size={29} strokeWidth={1.5} /> aura<span>®</span></a><div className={`nav-links ${menu ? 'nav-open' : ''}`}><a href="#discover" onClick={() => setMenu(false)}>声音探索</a><a href="#philosophy" onClick={() => setMenu(false)}>关于 AURA</a><a href="#rituals" onClick={() => setMenu(false)}>日常仪式</a></div><a className="nav-cta" href="#player">找到你的频率 <ArrowUpRight size={15} /></a><button className="menu-toggle icon-button" onClick={() => setMenu(!menu)} aria-label={menu ? '关闭导航' : '打开导航'} aria-expanded={menu}>{menu ? <X /> : <Menu />}</button></nav>
    <main id="main-content">
      <section className="hero shell" id="player"><div className="hero-copy"><span className="eyebrow"><i /> A LITTLE SPACE, JUST FOR YOU</span><h1>Less noise.<br />More <span>you.</span></h1><p>在喧闹的世界里，找到自己的频率。<br />为专注、休息，以及那些不必有目的的时刻。</p><div className="hero-actions"><button className="primary-button" onClick={togglePlay}>{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}{playing ? '暂停这一刻' : '听见片刻宁静'}</button><a href="#discover">探索全部声音 <ArrowRight size={15} /></a></div><div className="hero-footnote"><Headphones size={16} /><span>戴上耳机，让世界轻一点。</span><span className="footnote-line" /><span>无需注册</span></div></div>
        <div className="player-scene"><div className="scene-orbit scene-orbit-one" /><div className="scene-orbit scene-orbit-two" /><div className="floating-label"><span className="status-dot" /> MADE FOR YOUR MOMENT</div><div className={`player-card ${current.color}`}><div className="player-card-top"><span><AudioLines size={13} /> NOW {playing ? 'PLAYING' : 'PAUSED'}</span><button className="icon-button" onClick={() => toggleFavorite(track)} aria-label={favorite.includes(track) ? '取消收藏当前声音' : '收藏当前声音'} aria-pressed={favorite.includes(track)}><Heart size={18} fill={favorite.includes(track) ? 'currentColor' : 'none'} /></button></div><div className={`record ${playing ? 'record-playing' : ''}`} aria-hidden="true"><div className="record-inner"><i /><i /><i /><i /></div><span /></div><span className="track-category">{current.category}</span><h2>{current.name}</h2><p>{current.author}</p><div className="waveform" aria-hidden="true">{Array.from({ length: 39 }, (_, i) => <i key={i} className={playing ? 'bar-active' : ''} style={{ height: `${10 + Math.abs(Math.sin(i * 0.68)) * 23}px`, animationDelay: `${i * -0.08}s` }} />)}</div><div className="playback-time"><span>{formatTime(elapsed)}</span><span>AMBIENT LOOP</span></div><div className="player-controls"><button className="icon-button" aria-label="上一个声音" onClick={() => selectTrack((track + 3) % 4)}><ChevronLeft size={23} /></button><button className="play-button" aria-label={playing ? '暂停声音' : '播放声音'} onClick={togglePlay}>{playing ? <Pause fill="currentColor" size={21} /> : <Play fill="currentColor" size={21} />}</button><button className="icon-button" aria-label="下一个声音" onClick={() => selectTrack((track + 1) % 4)}><ChevronRight size={23} /></button></div><div className="volume-control"><Volume2 size={15} /><input type="range" min="0" max="100" value={volume} onChange={e => setVolume(+e.target.value)} aria-label="音量" /><output>{volume}%</output></div><div className="player-notice">实时合成音色演示 · 非录制音乐</div></div><div className="floating-note"><Sparkles size={15} /><span>Your mind deserves<br /><b>a softer place to land.</b></span></div></div>
      </section>
      <div className="shell" aria-live="polite">{error && <p className="audio-error">{error}</p>}</div>
      <div className="mood-strip shell"><span>FIND YOUR STATE OF MIND</span><div><span><Moon size={15} /> 休息</span><i /><span><Waves size={15} /> 放松</span><i /><span><Sun size={15} /> 灵感</span><i /><span><AudioLines size={15} /> 专注</span></div><a href="#discover" aria-label="向下探索"><ArrowDown size={17} /></a></div>
      <section className="discover section shell" id="discover"><div className="section-heading"><div><span className="eyebrow">01 / THE SOUND LIBRARY</span><h2>每一种心情，<br className="mobile-break" />都有它的声音。</h2></div><p>从一段声音开始，<br />回到当下的自己。</p></div><div className="library-toolbar"><div className="filter-tabs" aria-label="按心情筛选">{['全部', '专注', '放松', '灵感', '休息', '已收藏'].map(item => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} aria-pressed={filter === item}>{item}{item === '已收藏' && favorite.length > 0 ? ` ${favorite.length}` : ''}</button>)}</div><span>4 CURATED SOUNDS</span></div><div className="sound-grid">{tracks.map((item, i) => (filter === '全部' || filter === item.mood || filter === '已收藏' && favorite.includes(i)) && <article className={`sound-card ${item.color} ${track === i ? 'selected' : ''}`} key={item.name}><button className="sound-art" onClick={() => { selectTrack(i); void startSound(i) }} aria-label={`播放 ${item.name}`}><div className={`sound-object object-${i}`} /><span className="sound-number">0{i + 1}</span><span className="sound-play"><Play size={17} fill="currentColor" /></span><span className="sound-art-label">{item.category}</span></button><div className="sound-info"><div><span>{item.mood} · 合成音景</span><h3>{item.name}</h3></div><button className="icon-button" aria-label={`${favorite.includes(i) ? '取消收藏' : '收藏'} ${item.name}`} aria-pressed={favorite.includes(i)} onClick={() => toggleFavorite(i)}><Heart size={17} fill={favorite.includes(i) ? 'currentColor' : 'none'} /></button></div><p>{item.description}</p></article>)}</div>{filter === '已收藏' && favorite.length === 0 && <div className="empty-favorites"><Heart size={24} /><p>还没有收藏。点击声音旁的爱心，留下你的心头好。</p><button onClick={() => setFilter('全部')}>探索声音 <ArrowRight size={15} /></button></div>}</section>
      <section className="philosophy shell" id="philosophy"><div className="philosophy-art" aria-hidden="true"><div className="pearl pearl-one" /><div className="pearl pearl-two" /><div className="philosophy-line" /><span>SPACE TO SIMPLY BE.</span></div><div className="philosophy-copy"><span className="eyebrow">02 / OUR PHILOSOPHY</span><h2>你不需要<br />时刻都在<span>前进。</span></h2><p>我们习惯把每一分钟填满。播放、刷新、回应。<br />但有些时候，我们需要的只是一小段空白。</p><p>AURA 是一个声音实验，也是一次邀请：<br />把注意力从屏幕外收回来，给自己一点安静的空间。</p><div className="philosophy-values"><span><Check size={14} /> 无广告干扰</span><span><Check size={14} /> 浏览器本地合成</span><span><Check size={14} /> 不收集个人信息</span></div></div></section>
      <section className="rituals section shell" id="rituals"><div className="section-heading"><div><span className="eyebrow">03 / SMALL DAILY RITUALS</span><h2>从一个小小的仪式开始。</h2></div><span className="section-script">Make room for yourself.</span></div><div className="ritual-grid"><article><span className="ritual-index">01</span><Sun size={25} strokeWidth={1.3} /><h3>早晨，慢一点。</h3><p>先听一段声音，再打开消息。<br />让今天从自己的节奏开始。</p><button onClick={() => { selectTrack(2); void startSound(2); document.getElementById('player')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }}>开启晨间声音 <ArrowUpRight size={15} /></button></article><article><span className="ritual-index">02</span><Headphones size={25} strokeWidth={1.3} /><h3>专注，轻一点。</h3><p>留出一段不被打断的时间。<br />只有你，和眼前想做的事。</p><button onClick={() => { selectTrack(0); setTimer(25); void startSound(0); document.getElementById('player')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }}>开始 25 分钟专注 <ArrowUpRight size={15} /></button></article><article><span className="ritual-index">03</span><Moon size={25} strokeWidth={1.3} /><h3>夜晚，柔一点。</h3><p>把未完成留给明天。<br />今天的你，已经做得够多。</p><button onClick={() => { selectTrack(3); setTimer(10); void startSound(3); document.getElementById('player')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }}>开始 10 分钟休息 <ArrowUpRight size={15} /></button></article></div><div className="timer-status" aria-live="polite">{timer > 0 ? <><Moon size={14} /> 当前计时：{timer} 分钟后暂停声音。<button onClick={() => setTimer(0)}>取消计时</button></> : <><i /> 想听多久，都由你决定。</>}</div></section>
      <section className="faq section shell"><div><span className="eyebrow">A FEW THINGS TO KNOW</span><h2>安心，开始就好。</h2></div><div className="faq-list">{[
        ['这些声音是如何生成的？', '所有音色通过浏览器 Web Audio API 实时合成，由三个低音量正弦波叠加构成。这是可交互的界面与音频技术习作，不是完整录制曲目或专业音乐服务。'],
        ['需要下载、注册或付费吗？', '不需要。点击播放即可在浏览器中使用。收藏仅在本次页面会话中保留；刷新页面后会重置。'],
        ['专注计时如何工作？', '选择“25 分钟专注”或“10 分钟休息”后，页面根据播放时间暂停音频。切换声音会重新计算播放时间；浏览器后台限制可能影响计时精度。'],
      ].map(([q, a], i) => <div key={q} className={`faq-item ${faq === i ? 'faq-open' : ''}`}><button aria-expanded={faq === i} aria-controls={`answer-${i}`} onClick={() => setFaq(faq === i ? null : i)}>{q}<Plus size={17} /></button><p id={`answer-${i}`} hidden={faq !== i}>{a}</p></div>)}</div></section>
      <section className="closing shell"><span className="eyebrow">YOUR MOMENT STARTS HERE</span><h2>Take a breath.<br /><span>You're right where you need to be.</span></h2><button className="primary-button" onClick={() => { if (!playing) void startSound(track); document.getElementById('player')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }}><Play size={15} fill="currentColor" /> 把这一刻留给自己</button><div className="closing-glow" /></section>
    </main><footer className="footer shell"><a className="brand" href="#"><AudioLines size={24} /> aura<span>®</span></a><span>Less noise. More you.</span><small>© 2026 AURA · 原创设计与 Web Audio 交互习作</small><a href="#">BACK TO TOP <ArrowUpRight size={13} /></a></footer>
  </div>
}

createRoot(document.getElementById('root')!).render(<App />)
