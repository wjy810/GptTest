import json,re,pathlib,urllib.parse,sys
root=pathlib.Path(__file__).resolve().parents[2]
sites=json.loads((root/'sites.json').read_text())
excluded={'.git','node_modules','dist','artifacts'}
files=[p for p in root.rglob('*.md') if not excluded.intersection(p.relative_to(root).parts)]
links=[];missing=[];unknown_modes=[];readmes=[]
for file in files:
 text=file.read_text()
 clean=re.sub(r'```[\s\S]*?```','',text)
 for match in re.finditer(r'\[[^\]]*\]\(([^\n)]+)\)',clean):
  target=match.group(1).strip().split(' "')[0].strip('<>')
  if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:',target) or target.startswith('#'):continue
  target=urllib.parse.unquote(target.split('#')[0].split('?')[0])
  if not target:continue
  resolved=(file.parent/target).resolve()
  entry={'document':str(file.relative_to(root)),'target':target,'exists':resolved.exists()}
  links.append(entry)
  if not resolved.exists():missing.append(entry)
 for mode in re.findall(r'--mode\s+([a-z][a-z0-9_-]*)',text):
  if mode not in sites:unknown_modes.append({'document':str(file.relative_to(root)),'mode':mode})
for i,site in enumerate(sites):
 path=root/'apps'/site/'README.md'
 if path.exists():
  text=path.read_text();ports=re.findall(r'(?<!\d)(51\d{2})(?!\d)',text)
  readmes.append({'site':site,'expectedDevPort':5173+i,'portsMentioned':ports,'hasDevMode':f'npm run dev -- --mode {site}' in text,'hasBuildMode':f'npm run build -- --mode {site}' in text,'hasStandaloneOutput':bool(re.search(r'dist/'+re.escape(site)+r'(?:/|`|\s|$)',text))})
 else:readmes.append({'site':site,'README':'missing'})
result={'markdownFiles':len(files),'relativeLinks':len(links),'missingRelativeLinks':missing,'unknownModes':unknown_modes,'siteReadmes':readmes}
output=root/(sys.argv[1] if len(sys.argv)>1 else 'artifacts/reviews/doc-consistency.json')
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False,indent=2))
