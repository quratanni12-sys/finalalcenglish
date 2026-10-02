const CMS = process.env.CMS_URL
const BUSINESS = encodeURIComponent('ALC English')

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const safeUrl = (u) =>
  u && /^(https?:\/\/|\/|mailto:|tel:|#)/i.test(u) ? u : '#'

async function cmsFetch(path) {
  if (!CMS) throw new Error('CMS_URL is not set')
  const res = await fetch(CMS + path)
  if (!res.ok) throw new Error('CMS error ' + res.status)
  return res.json()
}

async function getPosts() {
  const data = await cmsFetch(
    `/api/posts?where[status][equals]=published&where[business][equals]=${BUSINESS}&sort=-createdAt&limit=50`
  )
  return data.docs
}

async function getPost(slug) {
  const data = await cmsFetch(
    `/api/posts?where[slug][equals]=${encodeURIComponent(slug)}&where[status][equals]=published&limit=1`
  )
  return data.docs[0] || null
}

function renderText(n) {
  let t = esc(n.text)
  const f = typeof n.format === 'number' ? n.format : 0
  if (f & 1) t = `<strong>${t}</strong>`
  if (f & 2) t = `<em>${t}</em>`
  if (f & 4) t = `<s>${t}</s>`
  if (f & 8) t = `<u>${t}</u>`
  if (f & 16) t = `<code>${t}</code>`
  return t
}

function renderNodes(nodes) {
  return (nodes || [])
    .map((n) => {
      const kids = () => renderNodes(n.children)
      switch (n.type) {
        case 'text':
          return renderText(n)
        case 'linebreak':
          return '<br>'
        case 'paragraph':
          return `<p>${kids()}</p>`
        case 'heading': {
          const tag = /^h[1-6]$/.test(n.tag) ? n.tag : 'h2'
          return `<${tag}>${kids()}</${tag}>`
        }
        case 'list': {
          const tag = n.listType === 'number' ? 'ol' : 'ul'
          return `<${tag}>${kids()}</${tag}>`
        }
        case 'listitem':
          return `<li>${kids()}</li>`
        case 'quote':
          return `<blockquote>${kids()}</blockquote>`
        case 'horizontalrule':
          return '<hr>'
        case 'table':
          return `<div class="table-wrap"><table><tbody>${kids()}</tbody></table></div>`
        case 'tablerow':
          return `<tr>${kids()}</tr>`
        case 'tablecell': {
          const tag = n.headerState > 0 ? 'th' : 'td'
          const span =
            (n.colSpan > 1 ? ` colspan="${Number(n.colSpan)}"` : '') +
            (n.rowSpan > 1 ? ` rowspan="${Number(n.rowSpan)}"` : '')
          return `<${tag}${span}>${kids()}</${tag}>`
        }
        case 'link':
        case 'autolink': {
          const url = safeUrl((n.fields && n.fields.url) || n.url)
          const blank = n.fields && n.fields.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
          return `<a href="${esc(url)}"${blank}>${kids()}</a>`
        }
        default:
          return n.children ? kids() : ''
      }
    })
    .join('')
}

const renderLexical = (data) =>
  data && data.root ? renderNodes(data.root.children) : ''

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

function page({ title, description, canonical, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${description ? `<meta name="description" content="${esc(description)}">` : ''}
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
${description ? `<meta property="og:description" content="${esc(description)}">` : ''}
<style>
body{font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:2rem 1rem;line-height:1.7;color:#222}
a{color:#0b5fff}
h1,h2{line-height:1.3}
time{color:#666;font-size:.9rem}
.answer{background:#eef4ff;padding:1rem;border-radius:8px}
.toc{background:#f6f6f6;padding:1rem;border-radius:8px}
.table-wrap{overflow-x:auto}
table{border-collapse:collapse;width:100%}
th,td{border:1px solid #ddd;padding:.5rem;text-align:left;vertical-align:top}
th{background:#f3f3f3}
td p,th p{margin:0}
</style>
</head>
<body>
<nav><a href="/">Home</a> | <a href="/blog">Blog</a></nav>
${body}
</body>
</html>`
}

module.exports = { getPosts, getPost, renderLexical, fmtDate, esc, page }
