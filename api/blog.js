const { getPosts, fmtDate, esc, page } = require('./_lib')

module.exports = async (req, res) => {
  try {
    const posts = await getPosts()
    const origin = 'https://' + req.headers.host
    const items = posts
      .map(
        (p) => `<article>
<h2><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a></h2>
<time datetime="${esc(p.createdAt)}">${fmtDate(p.createdAt)}</time>
${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ''}
</article>`
      )
      .join('')

    const html = page({
      title: 'Blog | ALC English',
      description: 'English learning tips, exam guides and study advice from ALC English.',
      canonical: origin + '/blog',
      body: `<h1>Blog</h1>${items || '<p>New articles are coming soon.</p>'}`,
    })

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.status(200).send(html)
  } catch (e) {
    res.status(500).send('Blog is temporarily unavailable.')
  }
}