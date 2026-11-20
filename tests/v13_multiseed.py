#!/usr/bin/env python3
"""Run 20 reproducible 1970–2031 campaign sims across all 5 regions and 4 strategies."""
from concurrent.futures import ThreadPoolExecutor,as_completed
from pathlib import Path
import json,os,subprocess,sys
root=Path(__file__).resolve().parents[1]
out=root/'tests'/'balance';out.mkdir(exist_ok=True)
regions=['northamerica','europe','asiapacific','latinamerica','mena']
strategies=['prestige','blockbuster','cheap','careful']
all_tasks=[(region,strategy,1301+ri*10+si) for ri,region in enumerate(regions) for si,strategy in enumerate(strategies)]
start=int(sys.argv[1]) if len(sys.argv)>1 else 0
size=int(sys.argv[2]) if len(sys.argv)>2 else len(all_tasks)
tasks=all_tasks[start:start+size]
def run(task):
 region,strategy,seed=task
 env={**os.environ,'SIM_REGION':region,'SAVE_VERIFY':'1'}
 p=subprocess.run(['node','sim.js',strategy,'1',str(seed)],cwd=root,env=env,text=True,capture_output=True,timeout=90)
 if p.returncode!=0:raise RuntimeError(f'{task}: {p.stderr[-1500:]}')
 result=json.loads(p.stdout.strip())
 if not result['savedOkay'] or not result['reloadedOkay']:
  raise AssertionError(f'{task}: save failed')
 path=out/f'v13_{region}_{strategy}_{seed}.json'
 path.write_text(json.dumps(result,indent=2)+'\n')
 return result
results=[]
with ThreadPoolExecutor(max_workers=2) as exe:
 futures={exe.submit(run,t):t for t in tasks}
 for f in as_completed(futures):
  r=f.result();results.append(r)
  print(f"PASS {len(results):02}/{len(tasks)} {r['region']}/{r['strat']} seed={r['seed']} {r['reason']} {r['year']} prestige={r['currentPrestige']:.0f} buzz={r['currentBuzz']:.0f} awards={r['counts']['wins']} archive={r['archiveCount']}",flush=True)
summary={'runs':len(results),'at2031':sum(x['year']>=2031 for x in results),'bankrupt':sum(x['reason']=='bankrupt' for x in results),'min_save_chars':min(x['packedSaveChars'] for x in results),'max_save_chars':max(x['packedSaveChars'] for x in results),'results':sorted(results,key=lambda x:x['seed'])}
(out/f'v13_multiseed_{start}_{size}_summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print('SUMMARY',json.dumps({k:v for k,v in summary.items() if k!='results'}),flush=True)
