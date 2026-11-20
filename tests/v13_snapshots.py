#!/usr/bin/env python3
"""Reproducible milestones in early, middle and late eras for v13 tuning."""
from pathlib import Path
import json,os,subprocess
root=Path(__file__).resolve().parents[1]
cases=[('1990','prestige','europe',1421),('2010','careful','northamerica',1430),('2025','cheap','asiapacific',1452)]
results=[]
for year,strategy,region,seed in cases:
 p=subprocess.run(['node','sim.js',strategy,'1',str(seed)],cwd=root,env={**os.environ,'UNTIL':year,'SIM_REGION':region,'SAVE_VERIFY':'1'},capture_output=True,text=True,timeout=45)
 if p.returncode:raise RuntimeError(p.stderr)
 data=json.loads(p.stdout.strip())
 assert data['reloadedOkay'] and data['savedOkay']
 results.append({'targetYear':year,'region':region,'strategy':strategy,'seed':seed,'reachedYear':data['year'],'reason':data['reason'],'buzz':data['currentBuzz'],'prestige':data['currentPrestige'],'legacy':data['lifetimeLegacy'],'awards':data['counts']['wins'],'saveChars':data['packedSaveChars']})
 print('SNAPSHOT',results[-1],flush=True)
(root/'tests/balance/v13_snapshots.json').write_text(json.dumps(results,indent=2)+'\n')
