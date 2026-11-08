"""Shared execution harness. Only the explicit Evidraw fixture is enabled.

No YouTube credentials or publication capability. Cloud output goes to existing
owner-scoped Evidraw review storage using a short-lived, revocable worker token.
No token logging, no arbitrary commands/URLs/brands, one job per execution.
"""
import base64,hashlib,json,os,re,shutil,subprocess,sys,time,urllib.request
from pathlib import Path

HERE=Path(__file__).resolve().parent
ROOT=Path(os.environ.get('VIDEO_ROOT','/tmp/brandcommand-video-test'))
FIXTURE=HERE/'evidraw-test.json'
ENDPOINT='https://evidraw.com/api/admin/video-studio/worker'
RULES_SHA='a1876ae4fcc5b87b86f32085e220c095bd9a8308a7589dbc5b6ea7f3b9292f17'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p): return json.loads(p.read_text(encoding='utf-8'))
def log(message): print(message,flush=True)

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):
        raise RuntimeError('Unexpected redirect blocked')

def send(token,body=None,*,job=None,asset=None,content=None,lease=None):
    if not re.fullmatch('[a-f0-9]{64}',token): raise ValueError('Invalid worker credential')
    url=ENDPOINT
    headers={'Authorization':'Bearer '+token,'User-Agent':'BrandCommandPrivateTest/1.0'}
    if asset:
        if asset not in ('video','captions','copy','transcript','evidence','review'): raise ValueError('Invalid asset')
        if not re.fullmatch('[a-f0-9-]{36}',job or ''): raise ValueError('Invalid job')
        url+='?job='+job+'&asset='+asset
        headers.update({'Content-Type':'application/octet-stream','X-Job-Lease':lease})
        data=content
    else:
        headers['Content-Type']='application/json'
        data=json.dumps(body).encode()
    request=urllib.request.Request(url,data=data,headers=headers,method='POST')
    with urllib.request.build_opener(NoRedirect()).open(request,timeout=90) as response:
        return json.load(response)

def assert_job(job,key,input_hash):
    if job.get('draw_key')!=key or job.get('input_hash')!=input_hash:
        raise ValueError('Queued job does not match the one authorized fixture')
    if not re.fullmatch('[a-f0-9-]{36}',job.get('id','')) or not re.fullmatch('[a-f0-9]{64}',job.get('lease','')):
        raise ValueError('Invalid job lease')

def prepare_sources(g,out):
    from render_verified_draw import parse_wclc
    sources=out/'sources'; sources.mkdir(parents=True,exist_ok=True)
    preserved={}
    for item in g['sources']:
        name=item['file']
        if Path(name).name!=name: raise ValueError('Invalid source path')
        # URLs are only from the checked-in fixture, never from queued requests.
        req=urllib.request.Request(item['url'],headers={'User-Agent':'BrandCommandDrawVerification/1.0'})
        with urllib.request.urlopen(req,timeout=40) as response:
            data=response.read(2*1024*1024+1)
        if len(data)>2*1024*1024: raise ValueError('Source too large')
        (sources/name).write_bytes(data)
        preserved[name]=base64.b64encode(data).decode()
    records=parse_wclc(sources/g['sources'][0]['file'])
    idx=next(i for i,r in enumerate(records) if r['date']==g['date'])
    for r,day,nums,bonus in [(records[idx],g['date'],g['numbers'],g['bonus']),(records[idx+1],g['previous_date'],g['previous_numbers'],g['previous_bonus'])]:
        assert r==dict(date=day,numbers=nums,bonus=bonus)
    lq=(sources/g['sources'][1]['file']).read_text(encoding='utf-8')
    section=lq.split('<div id="dateAffichee">'+g['date']+'</div>',1)[1]
    assert list(map(int,re.findall(r'<span class="num">(\d+)</span>',section)[:6]))==g['numbers']
    assert int(re.search(r'<span class="num complementaire">(\d+)</span>',section)[1])==g['bonus']
    assert sha(sources/g['sources'][2]['file'])==RULES_SHA
    return preserved

def execute(token,job,g,key,input_hash):
    from render_verified_draw import FFMPEG, self_tests
    from PIL import Image
    import soundfile as sf
    assert_job(job,key,input_hash)
    self_tests()
    out=ROOT/'outputs'/('draw-breakdown-'+key)
    model_dir=ROOT/'work/voice-models'; model_dir.mkdir(parents=True,exist_ok=True)
    for name in ('kokoro-v1.0.onnx','voices-v1.0.bin'):
        dest=model_dir/name
        if not dest.exists(): dest.symlink_to(Path('/opt/models')/name)
    preserved=prepare_sources(g,out)
    log('Official results and applicable rules verified; rendering in cloud.')
    subprocess.run([sys.executable,str(HERE/'render_verified_draw.py'),str(FIXTURE)],check=True,timeout=600)
    report=read(out/'validation.json')
    video=next(out.glob('Evidraw-*.mp4'))
    assert sha(video)==report['video_sha256']
    assert report['dimensions']==[1080,1920] and 45<=report['duration_seconds']<=60
    assert report['voice']=='am_fenrir' and report['voice_speed']==1
    decode=subprocess.run([str(FFMPEG),'-v','error','-i',str(video),'-f','null','-'],capture_output=True,timeout=90)
    assert decode.returncode==0 and not decode.stderr.strip()
    scenes=read(out/'timeline.json'); sheet=Image.new('RGB',(810,960))
    for i,scene in enumerate(scenes):
        assert sf.info(out/f'narration-{i+1}.wav').duration<=scene['duration']
        p=out/f'decoded-{i}.png'
        subprocess.run([str(FFMPEG),'-v','error','-y','-ss',str(scene['start']+scene['duration']/2),'-i',str(video),'-frames:v','1',str(p)],check=True,timeout=20)
        im=Image.open(p); assert im.size==(1080,1920)
        sheet.paste(im.resize((270,480)),(i%3*270,i//3*480))
    sheet.save(out/'decoded-review.jpg')
    times=[int(h)*3600+int(m)*60+int(s)+int(ms)/1000 for h,m,s,ms in re.findall(r'(\d\d):(\d\d):(\d\d),(\d\d\d)',(out/'captions.srt').read_text())]
    assert times==sorted(times) and abs(times[-1]-report['duration_seconds'])<.002
    evidence=read(out/'verified-calculations-and-sources.json')
    evidence['cloud_test']={'brand':'evidraw','worker':'BrandCommand shared worker','run_id':os.environ.get('RENDER_GIT_COMMIT','unknown'),'mode':'review-only','font':'DejaVu Sans','validation':report,'fetched_at_utc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
    evidence['source_snapshots_base64']=preserved
    (out/'verified-calculations-and-sources.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
    assets={'video':video,'captions':out/'captions.srt','copy':out/'youtube-title-and-description.txt','transcript':out/'transcript.txt','evidence':out/'verified-calculations-and-sources.json','review':out/'decoded-review.jpg'}
    hashes={}
    for kind,path in assets.items():
        limit=24*1024*1024 if kind=='video' else 2*1024*1024
        if path.stat().st_size>limit: raise ValueError('Output exceeds storage limit')
        hashes[kind]=sha(path)
    for kind,path in assets.items():
        result=send(token,job=job['id'],asset=kind,content=path.read_bytes(),lease=job['lease'])
        assert result['sha256']==hashes[kind]
    send(token,{'action':'complete','id':job['id'],'lease':job['lease'],'detail':{'fullDecode':True,'inputHash':input_hash,'voice':'am_fenrir','speed':1,'width':1080,'height':1920,'duration':report['duration_seconds'],'hashes':hashes}})
    log('CLOUD DRAFT READY FOR VISUAL REVIEW. No YouTube upload or publication performed.')

def main():
    # No recurring consumer. Absent credential means harmless preflight, not a render.
    from render_verified_draw import self_tests
    self_tests()
    token=os.environ.get('EVIDRAW_WORKER_TOKEN','').strip()
    if os.environ.get('ENABLED_BRAND','evidraw')!='evidraw':
        raise ValueError('Only Evidraw is enabled for this private test')
    if not token:
        log('PREFLIGHT PASS. Add the owner-provided short-lived worker token for the one private test.')
        return
    if os.environ.get('PRIVATE_TEST_ENABLED')!='true':
        log('Test disabled; no network write or render.')
        return
    g=read(FIXTURE); key=g['slug']+'-'+g['date']; input_hash=sha(FIXTURE)
    deadline=time.monotonic()+180
    while time.monotonic()<deadline:
        response=send(token,{'action':'poll','catalog':[{'key':key,'inputHash':input_hash}]})
        if response.get('job'):
            job=response['job']
            assert_job(job,key,input_hash)
            try: execute(token,job,g,key,input_hash)
            except Exception:
                send(token,{'action':'failed','id':job['id'],'lease':job['lease']})
                raise
            return
        log('Waiting for the owner to queue the single verified test draw.')
        time.sleep(10)
    log('No queued job; stopped without creating a video. No retry scheduled by this process.')
if __name__=='__main__':
    try: main()
    except Exception as error:
        # Never print credential-bearing request objects or response bodies.
        log('STOPPED: '+type(error).__name__+'. No public posting. Inspect source/connection checks.')
        sys.exit(1)
