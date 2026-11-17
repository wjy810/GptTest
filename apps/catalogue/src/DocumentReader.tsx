import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import replication from '../../../docs/REPLICATION.md?raw'
import designSystem from '../../../docs/DESIGN-SYSTEM.md?raw'
import researchMethod from '../../../docs/RESEARCH-METHOD.md?raw'

const documents: Record<string, string> = {
  replication,
  system: designSystem,
  research: researchMethod,
}

export default function DocumentReader({
  id,
  onReady,
}: {
  id: string
  onReady: (text: string) => void
}) {
  const text = documents[id]
  if (!text) throw new Error('Unknown handbook')
  useEffect(() => {
    onReady(text)
  }, [onReady, text])
  return (
    <article className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div
              className="markdown-table-scroll"
              role="region"
              aria-label="文档表格，可横向滚动"
              tabIndex={0}
            >
              <table>{children}</table>
            </div>
          ),
          a: ({ href, children }) =>
            href && /^https?:\/\//i.test(href) ? (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            ) : (
              <span className="repository-reference" title={`仓库内引用：${href || ''}`}>
                {children}
                <small>（仓库内文件）</small>
              </span>
            ),
        }}
      >
        {text}
      </ReactMarkdown>
    </article>
  )
}
