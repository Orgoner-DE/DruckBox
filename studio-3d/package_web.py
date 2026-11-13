from pathlib import Path
p=Path(__file__).parent
html=(p/'web/src/index.html').read_text()
for k,f in [('/* INLINE_CSS */','web/src/style.css'),('/* INLINE_CORE */','web/src/core.js'),('/* INLINE_APP */','web/src/app.js')]:
  contents=(p/f).read_text()
  if k.startswith('/* INLINE_') and 'JS' not in k: contents=contents.replace('</style>','<\\/style>')
  else: contents=contents.replace('</script>','<\\/script>')
  html=html.replace(k,contents)
(p/'2H4Y_3D_Studio_1.0.html').write_text(html)
(p/'android/app/src/main/assets/index.html').write_text(html)
print('HTML erstellt',len(html))
