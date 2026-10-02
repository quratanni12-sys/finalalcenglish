const { getPost, renderLexical, fmtDate, page } = require('./_lib')

module.exports = async (req, res) => {
  try {
    const slug = String(req.query.slug || '')
    const post = slug ? await getPost(slug) : null

    if (!post) {
      res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.send(
        page({
          title: 'Not found | ALC English',
          canonical: 'https://' + req.headers.host + '/blog',
          body: '<h1>Article not found</h1><p><a href="/blog">Back to blog</a></p>',
        })
      )
    }

    const origin = 'https://' + req.headers.host
    const html = page({
      title: (post.meta && post.meta.title) || post.title,
      description: (post.meta && post.meta.description) || post.excerpt || '',
      canonical: origin + '/blog/' + post.slug,
      body: `<article>
<h1>${require('./_lib').esc(post.title)}</h1>
<time datetime="${post.createdAt}">${fmtDate(post.createdAt)}</time>
<div>${renderLexical(post.content)}</div>
</article>`,
    })

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.status(200).send(html)
  } catch (e) {
    res.status(500).send('Article is temporarily unavailable.')
  }
}