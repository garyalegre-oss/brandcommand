"""Bounded daily cloud renderer. YouTube credentials stay on Evidraw's server.

One server-authorized new draw per day; no local fixtures are auto-published.
The server independently fetches official results and stores the exact input.
The renderer re-fetches and cross-checks sources, renders, validates and uploads.
The server alone controls the approved playlist and public visibility.
"""
import hashlib,json,os,sys,time
import run_once as worker

def validate_input(job):
    raw=job.get('inputJson','')
    if len(raw)>16000 or hashlib.sha256(raw.encode()).hexdigest()!=job.get('input_hash'):
        raise ValueError('Input integrity mismatch')
    g=json.loads(raw)
    allowed={
      'lotto-649':(49,6,'https://www.wclc.com/winning-numbers/lotto-649-extra.htm','https://loteries.lotoquebec.com/en/lotteries/lotto-6-49-resultats','https://www.wclc.com/display-on/display-on-downloads/game-conditions-lotto-649-dec-2023.htm',worker.RULES_SHA),
      'lotto-max':(52,7,'https://www.wclc.com/winning-numbers/lotto-max-extra.htm','https://loteries.lotoquebec.com/en/lotteries/lotto-max-resultats','https://www.wclc.com/display-on/display-on-downloads/lotto-max-3.0-game-conditions.htm','9aaf0473964b0f03a5e9e424c8e71ba5110fb2aae1dab8a84ebb3f5e29984945'),
    }
    n,k,w,l,r,h=allowed[g['slug']]
    if (g['pool'],g['pick'])!=(n,k) or g['rules_sha256']!=h: raise ValueError('Unapproved game rules')
    if [x['url'] for x in g['sources']]!=[w,l,r]: raise ValueError('Unapproved source destination')
    if [x['file'] for x in g['sources']]!=['wclc-results.html','loto-quebec.html','rules.pdf']: raise ValueError('Invalid source filenames')
    worker.assert_job(job,g['slug']+'-'+g['date'],hashlib.sha256(raw.encode()).hexdigest())
    return g

def main():
    if os.environ.get('CLOUD_AUTOMATION_ENABLED')!='true':
        worker.log('Cloud automation disabled. No work requested.');return
    token=os.environ.get('EVIDRAW_CLOUD_TOKEN','').strip()
    if not token: raise ValueError('Cloud connection required')
    worker.ENDPOINT='https://evidraw.com/api/admin/video-studio/cloud/worker'
    response=worker.send(token,{'action':'discover'})
    if response.get('paused'):
        worker.log('Owner paused automation. No work performed.');return
    if response.get('warnings'): worker.log('Official-source warning: review Video Studio before next run.')
    job=response.get('job'); advance=response.get('advance')
    if job:
        try:
            g=validate_input(job)
            worker.ROOT.mkdir(parents=True,exist_ok=True)
            p=worker.ROOT/'cloud-input.json';p.write_text(job['inputJson'],encoding='utf-8')
            worker.execute(token,job,g,job['draw_key'],job['input_hash'],p)
            advance=job['id']
        except Exception:
            worker.send(token,{'action':'failed','id':job['id'],'lease':job['lease']})
            raise
    if not advance:
        worker.log('No new eligible draw. Existing videos left untouched.')
        if response.get('warnings'): raise RuntimeError('Official sources need attention')
        return
    # Resume only processing checks. Never re-upload on an uncertain result.
    until=time.monotonic()+300
    while time.monotonic()<until:
        result=worker.send(token,{'action':'advance','id':advance})
        if result.get('paused'):worker.log('Owner paused publication.');return
        if result.get('status')=='public':
            worker.log('PUBLICATION VERIFIED on the approved channel and playlist. Video: '+result['videoId']);return
        if result.get('status')!='processing':raise RuntimeError('Unexpected publication state')
        time.sleep(30)
    worker.log('YouTube still processing. Left private; next daily run can check it without re-uploading.')

if __name__=='__main__':
    try:main()
    except Exception as error:
        worker.log('STOPPED: '+type(error).__name__+'. Inspect Video Studio / Render. No automatic write retry.');sys.exit(1)
