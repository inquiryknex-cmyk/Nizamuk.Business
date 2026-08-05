/*
  فتات الخبز المرئيّة.

  ثلاث وعشرون صفحة كانت تحمل BreadcrumbList في ld+json ولا تُظهر منه شيئًا.
  فالبنية كانت مقروءةً لجوجل ومحجوبةً عن الزائرة — وهي التي تحتاجها أكثر،
  لأنها تصل من بحثٍ إلى صفحةٍ داخلية ولا تعرف أين هي من الموقع.

  والدالّتان هنا تأخذان القائمة نفسها: renderCrumbs للعين، jsonLdCrumbs
  لمحرّك البحث. فما يُعلَن هو ما يُرى، ولا يفترقان عند أول تعديل.

  الشكل: [{ name, url }, …] وآخرها الصفحة الحالية بلا url.
*/
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderCrumbs(items) {
  const last = items.length - 1;
  return `<nav class="crumbs" aria-label="مسار التصفّح">
      <ol>
${items.map((it, i) => `        <li>${i === last || !it.url
    ? `<span aria-current="page">${esc(it.name)}</span>`
    : `<a href="${esc(it.url)}">${esc(it.name)}</a>`}</li>`).join('\n')}
      </ol>
    </nav>`;
}

export function jsonLdCrumbs(items, origin = 'https://nizamok.com') {
  return items.map((it, i) => {
    const base = `{ "@type": "ListItem", "position": ${i + 1}, "name": "${esc(it.name)}"`;
    return it.url ? `${base}, "item": "${origin}${it.url}" }` : `${base} }`;
  }).join(',\n          ');
}
