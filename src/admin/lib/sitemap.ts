const SITE_ORIGIN = (typeof window !== 'undefined' ? window.location.origin : 'https://potolki.md');
const PATHS = ['/', '/services', '/gallery', '/prices', '/about', '/contact'];

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export function buildSitemap(origin: string = SITE_ORIGIN): string {
  const today = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">');

  for (const path of PATHS) {
    const url = origin + path;
    const priority = path === '/' ? '1.0' : '0.8';
    const changefreq = path === '/' || path === '/gallery' ? 'weekly' : 'monthly';
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(url)}</loc>`);
    lines.push(`    <lastmod>${today}</lastmod>`);
    lines.push(`    <changefreq>${changefreq}</changefreq>`);
    lines.push(`    <priority>${priority}</priority>`);
    // hreflang alternates
    lines.push(`    <xhtml:link rel="alternate" hreflang="ru" href="${escapeXml(url)}" />`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="ro" href="${escapeXml(url + '?lang=ro')}" />`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(url)}" />`);
    lines.push('  </url>');
  }
  lines.push('</urlset>');
  return lines.join('\n');
}

export function buildRobotsTxt(origin: string = SITE_ORIGIN): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /admin/',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
