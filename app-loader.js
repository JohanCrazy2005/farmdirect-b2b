(async function() {
  const parts = ['app.part0.js','app.part1.js','app.part2.js'];
  let code = '';
  for (const p of parts) {
    const r = await fetch(p);
    code += await r.text();
  }
  const s = document.createElement('script');
  s.textContent = code;
  document.body.appendChild(s);
})();
