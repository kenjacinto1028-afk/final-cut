#!/usr/bin/env python3
"""Reproducible v13.1 final balance matrix. Never overwrite v13 baseline results."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import json,os,subprocess,sys
root=Path(__file__).resolve().parents[1]
out=root/'tests'/'balance';out.mkdir(exist_ok=True)
regions=['northamerica','europe','asiapacific','latinamerica','mena']
strategies=['prestige','blockbuster','cheap','careful']
cases=[(region,strategy,1301+i*10+j) for i,region in enumerate(regions) for j,strategy in enumerate(strategies)]
start=int(sys.argv[1]) if len(sys.argv)>1 else 0
size=int(sys.argv[2]) if len(sys.argv)>2 else len(cases)
cases=cases[start:start+size]
def run(case):
 region,strategy,seed=case
 proc=subprocess.run(['node','sim.js',strategy,'1',str(seed)],cwd=root,env={**os.environ,'SIM_REGION':region,'SAVE_VERIFY':'1'},capture_output=True,text=True,timeout=100)
 if proc.returncode:raise RuntimeError(f'{case}: {proc.stderr[-1000:]}')
 r=json.loads(proc.stdout)
 assert r['savedOkay'] and r['reloadedOkay'],(case,'save failed')
 (out/f'v13_1_{region}_{strategy}_{seed}.json').write_text(json.dumps(r,indent=2)+'\n')
 return r
with ThreadPoolExecutor(max_workers=2) as pool:
 results=[]
 for future in as_completed([pool.submit(run,c) for c in cases]):
  r=future.result();results.append(r)
  print(f"PASS {len(results):02d}/{len(cases)} {r['region']}/{r['strat']}: {r['reason']} {r['year']} score={r['value']} ceremony={r['counts']['wins']} buzz={r['currentBuzz']}",flush=True)
print('SUMMARY',json.dumps({'cases':len(results),'reached2031':sum(x['year']>=2031 for x in results),'save_reload':sum(x['reloadedOkay'] for x in results)}),flush=True)
