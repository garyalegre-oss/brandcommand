"""Verified dated draw drafts. No automatic result scraping or publishing.

Requires an explicit dated input and official source snapshots. Does not mark
completion: a human/agent must visually review the decoded output first.
"""
from pathlib import Path
from datetime import date, datetime, timezone
from functools import lru_cache
from fractions import Fraction
import argparse, hashlib, html, json, math, re, subprocess, textwrap, os, shutil
import numpy as np
import soundfile as sf
import onnxruntime as ort
from kokoro_onnx import Kokoro
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(os.environ.get('VIDEO_ROOT', str(Path(__file__).resolve().parents[2])))
W, H, FPS = 1080, 1920, 24
NAVY, CARD, TEAL, BLUE, WHITE, MUTED = '#061b2d', '#102b40', '#54ded3', '#42bbeb', '#f2f7fa', '#a6bdcc'
FFMPEG = Path(os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg') or '')

@lru_cache(None)
def font(size, bold=False):
    return ImageFont.truetype(os.environ['VIDEO_FONT_BOLD' if bold else 'VIDEO_FONT_REGULAR'], size)

def text(d, xy, s, size=40, color=WHITE, bold=False, anchor=None):
    d.text(xy, str(s), font=font(size, bold), fill=color, anchor=anchor)

def wrapped(d, s, y, size=40, color=WHITE, width=870, center=False):
    lines = []
    for paragraph in s.split('\n'):
        line = ''
        for word in paragraph.split():
            trial = (line+' '+word).strip()
            if d.textlength(trial, font=font(size)) > width:
                lines.append(line); line = word
            else: line = trial
        if line: lines.append(line)
    for line in lines:
        text(d, (540 if center else 100, y), line, size, color, anchor='mt' if center else None)
        y += size+16
    return y

def ball(d, x, y, num, r=52, color=TEAL):
    d.ellipse((x-r,y-r,x+r,y+r), fill=color)
    text(d,(x,y-3),f'{num:02}',int(r*.85),NAVY,True,'mm')

def row(d, nums, y, highlight=None, r=48):
    step=2*r+20; start=540-(len(nums)-1)*step/2
    for i, num in enumerate(nums):
        color=TEAL if highlight is None or num in highlight else '#627f91'
        ball(d,start+i*step,y,num,r,color)

def panel(d, y, bottom):
    d.rounded_rectangle((72,y,1008,bottom),radius=32,fill=CARD)

def date_label(value):
    v=date.fromisoformat(value)
    return f'{v:%B} {v.day}, {v.year}'

def base(g,i,title,subtitle):
    im=Image.new('RGB',(W,H),NAVY); d=ImageDraw.Draw(im)
    d.ellipse((660,-330,1320,330),fill='#0a3041')
    d.line((72,250,1008,250),fill='#244557',width=2)
    logo=Image.open(Path(__file__).parent/'assets/evidraw-app-icon.png').convert('RGBA'); logo.thumbnail((90,90))
    im.paste(logo,(72,98),logo)
    text(d,(186,95),'EVIDRAW',51,WHITE,True)
    text(d,(188,161),'DRAW BREAKDOWN',24,TEAL,True)
    text(d,(1008,143),f'{i+1:02} / 06',28,MUTED,anchor='rm')
    text(d,(80,289),g['game'].upper()+'  /  '+date_label(g['date']).upper(),27,TEAL,True)
    wrapped(d,title,370,68,WHITE,width=920)
    wrapped(d,subtitle,560,32,MUTED)
    text(d,(80,1720),'ANALYSIS, NOT A PREDICTION',27,TEAL,True)
    text(d,(80,1780),'evidraw.com',36,WHITE,True)
    text(d,(80,1840),'Results: WCLC + Loto-Quebec | Bonus excluded',23,MUTED)
    d.rounded_rectangle((80,1670,1000,1676),radius=3,fill='#244557')
    d.rounded_rectangle((80,1670,80+920*(i+1)/6,1676),radius=3,fill=TEAL)
    return im,d

@lru_cache(None)
def sum_counts(n,k):
    dp=[[0]*(n*k+1) for _ in range(k+1)]; dp[0][0]=1
    for v in range(1,n+1):
        for j in range(min(k,v),0,-1):
            for s in range(n*k,v-1,-1): dp[j][s]+=dp[j-1][s-v]
    assert sum(dp[k])==math.comb(n,k)
    assert sum(s*c for s,c in enumerate(dp[k]))*2==math.comb(n,k)*k*(n+1)
    return dp[k]

def stats(g):
    n,k=g['pool'],g['pick']; nums=g['numbers']; prev=g['previous_numbers']
    for vals,bonus in [(nums,g['bonus']),(prev,g['previous_bonus'])]:
        assert len(vals)==k and len(set(vals))==k and vals==sorted(vals)
        assert all(1<=v<=n for v in vals+[bonus]) and bonus not in vals
    assert g['previous_date']<g['date'] and g['rules_first_draw']<=g['previous_date']
    odd=sum(v%2 for v in nums); repeats=sorted(set(nums)&set(prev)); r=len(repeats)
    total=math.comb(n,k)
    parity=Fraction(math.comb((n+1)//2,odd)*math.comb(n//2,k-odd),total)
    repeat=Fraction(math.comb(k,r)*math.comb(n-k,k-r),total)
    mean=Fraction(k*(n+1),2); actual=sum(nums)
    relationship='below' if actual<mean else 'above' if actual>mean else 'equal to'
    return dict(sum=actual,mean=float(mean),relationship=relationship,odd=odd,even=k-odd,
        repeat_numbers=repeats,repeat_count=r,total_combinations=total,
        parity_probability=float(parity),parity_exact=str(parity),
        repeat_probability=float(repeat),repeat_exact=str(repeat),
        probability_label='Theoretical uniform sampling without replacement, not historical frequency',
        parity_formula=f'C({(n+1)//2},{odd}) * C({n//2},{k-odd}) / C({n},{k})',
        repeat_formula=f'C({k},{r}) * C({n-k},{k-r}) / C({n},{k})')

def parse_wclc(snapshot):
    raw=snapshot.read_text(encoding='utf-8')
    records=[]
    for block in re.split(r'<h4[^>]*>',raw,flags=re.I)[1:]:
        heading=html.unescape(re.sub('<[^>]+>','',block.split('</h4>')[0])).strip()
        try: dt=datetime.strptime(heading,'%A, %B %d, %Y').date().isoformat()
        except ValueError: continue
        match=re.search(r'<ul class="pastWinNumbers">(.*?)</ul>',block,re.S)
        if not match: continue
        nums=[int(v) for v in re.findall(r'<li class="pastWinNumber">\s*(\d+)\s*</li>',match[1])]
        bonus=re.search(r'<li class="pastWinNumberBonus">.*?</span>\s*(\d+)',match[1],re.S)
        if nums and bonus: records.append(dict(date=dt,numbers=nums,bonus=int(bonus[1])))
    return records

def verify(g,out):
    records=parse_wclc(out/'sources'/g['sources'][0]['file'])
    index=next(i for i,r in enumerate(records) if r['date']==g['date'])
    # Explicit dated input also permits catch-up; never relabel it as latest.
    assert records[index]==dict(date=g['date'],numbers=g['numbers'],bonus=g['bonus'])
    assert records[index+1]==dict(date=g['previous_date'],numbers=g['previous_numbers'],bonus=g['previous_bonus'])
    # Independent operator page was checked in rendered form; retain dated excerpt.
    assert all((out/'sources'/source['file']).is_file() for source in g['sources'])
    return records[:2]

def self_tests():
    for n,k in [(49,6),(52,7)]:
        assert sum(Fraction(math.comb((n+1)//2,o)*math.comb(n//2,k-o),math.comb(n,k)) for o in range(k+1))==1
        assert sum(Fraction(math.comb(k,r)*math.comb(n-k,k-r),math.comb(n,k)) for r in range(k+1))==1
        sum_counts(n,k)
    fixture=dict(pool=49,pick=6,previous_date='2026-09-30',date='2026-10-03',rules_first_draw='1982-06-12',previous_numbers=[1,2,3,4,5,6],previous_bonus=7,bonus=49)
    for nums,r,relation in [([8,10,12,14,16,18],0,'below'),([1,10,12,14,16,18],1,'below'),([1,2,3,4,5,6],6,'below'),([20,22,24,26,28,30],0,'equal to'),([40,41,42,43,44,45],0,'above')]:
        s=stats(dict(fixture,numbers=nums))
        assert s['repeat_count']==r and s['relationship']==relation

def slides(g,s):
    frames=[]; nums=g['numbers']; r=s['repeat_count']
    scope = 'Classic draw only • Gold Ball is separate' if g['slug']=='lotto-649' else 'Main draw only • MAXPLUS / MAXMILLIONS separate'
    im,d=base(g,0,'Inside the winning\nnumbers',scope)
    panel(d,740,1280); row(d,nums[:4],890,r=65); row(d,nums[4:],1060,r=65)
    text(d,(540,1195),f"BONUS  {g['bonus']:02}  •  separate from main numbers",29,MUTED,anchor='mm')
    wrapped(d,'Sum. Odd/even. Previous-draw repeats.',1400,42,WHITE,center=True)
    frames.append(im)
    im,d=base(g,1,'The main-number sum','Add the main numbers—not the bonus.')
    text(d,(80,680),s['sum'],166,TEAL,True)
    text(d,(82,890),f"Theoretical average: {s['mean']:g}",40,WHITE)
    panel(d,1010,1400)
    counts=sum_counts(g['pool'],g['pick']); k,n=g['pick'],g['pool']
    lo=k*(k+1)//2; hi=k*(2*n-k+1)//2; peak=max(counts)
    for j in range(80):
        val=round(lo+(hi-lo)*j/79); h=220*counts[val]/peak
        d.rectangle((110+j*10.8,1310-h,117+j*10.8,1310),fill='#32697b')
    x=110+(s['sum']-lo)/(hi-lo)*79*10.8
    d.line((x,1045,x,1315),fill=TEAL,width=5); text(d,(x,1345),s['sum'],28,TEAL,True,'mm')
    text(d,(540,1450),'Exact theoretical sum distribution',29,MUTED,anchor='mm')
    wrapped(d,f"This sum is {s['relationship']} the average—not a forecast.",1500,33,WHITE,center=True)
    frames.append(im)
    im,d=base(g,2,'Odd + even','An exact theoretical probability, not a win rate.')
    panel(d,740,1400)
    text(d,(300,785),s['odd'],154,TEAL,True,'mt'); text(d,(775,785),s['even'],154,BLUE,True,'mt')
    text(d,(300,980),'ODD',40,TEAL,True,'mm'); text(d,(775,980),'EVEN',40,BLUE,True,'mm')
    step=116; start=540-(len(nums)-1)*step/2
    for i,v in enumerate(nums): ball(d,start+i*step,1110,v,48,TEAL if v%2 else BLUE)
    text(d,(540,1250),f"{100*s['parity_probability']:.2f}%",64,WHITE,True,'mm')
    text(d,(540,1335),'Theoretical chance of this exact split',29,MUTED,anchor='mm')
    wrapped(d,'More common categories do not make an individual line more likely to win.',1480,33,MUTED,center=True)
    frames.append(im)
    title='No numbers repeated' if r==0 else 'One number repeated' if r==1 else f'{r} numbers repeated'
    im,d=base(g,3,title,f"Compared with {date_label(g['previous_date'])} • main numbers only")
    panel(d,735,1400)
    text(d,(540,750),r,160,TEAL,True,'mt')
    text(d,(540,955),'MAIN-NUMBER REPEATS',29,WHITE,True,'mm')
    text(d,(115,1030),'PREVIOUS DRAW',25,MUTED,True)
    row(d,g['previous_numbers'],1140,highlight=s['repeat_numbers'],r=46)
    detail='No overlap with this draw' if not r else 'Repeated: '+', '.join(map(str,s['repeat_numbers']))
    wrapped(d,detail,1250,36,WHITE,center=True)
    wrapped(d,f"Theoretical chance of exactly {r} {'repeat' if r == 1 else 'repeats'}: {100*s['repeat_probability']:.2f}%.",1460,35,WHITE,center=True)
    frames.append(im)
    im,d=base(g,4,'Explore it in the Lab','Preferences are experiments—not predictions.')
    panel(d,740,1360)
    for j,(label,value) in enumerate([('SUM',str(s['sum'])),('ODD / EVEN',f"{s['odd']} / {s['even']}"),('PREVIOUS-DRAW REPEATS',str(r))]):
        y=810+j*160; text(d,(115,y),label,28,MUTED,True); text(d,(945,y-17),value,65,TEAL,True,'rt')
        if j<2: d.line((115,y+105,955,y+105),fill='#2b485c',width=2)
    wrapped(d,'Matching a pattern does not mean matching the winning numbers.',1450,38,WHITE,center=True)
    frames.append(im)
    im,d=base(g,5,'Explore. Build.\nTrack.','Keep experiments honest.')
    panel(d,730,1400)
    wrapped(d,'Save portfolios BEFORE the draw.',815,56,TEAL,width=850,center=True)
    wrapped(d,'Compare equal line counts against random picks over many draws.',1035,43,WHITE,width=850,center=True)
    wrapped(d,'Every valid line has the same jackpot chance in a fair draw.',1235,32,MUTED,width=850,center=True)
    wrapped(d,'No guaranteed winnings. Play responsibly.',1480,38,WHITE,center=True)
    frames.append(im)
    return frames

def narration(g,s):
    r=s['repeat_count']
    repetition='No main numbers repeated from the previous draw.' if r==0 else f"Only number {s['repeat_numbers'][0]} repeated from the previous draw." if r==1 else f"{r} main numbers repeated: "+', '.join(map(str,s['repeat_numbers']))+'.'
    return [f"{g.get('spoken_game',g['game'])}, {date_label(g['date'])}. The main numbers were "+', '.join(map(str,g['numbers'][:-1]))+f", and {g['numbers'][-1]}. Bonus: {g['bonus']}.",
        f"The main numbers total {s['sum']}, {s['relationship']} the theoretical average of {s['mean']:g}. The bonus is excluded.",
        f"That's {s['odd']} odd and {s['even']} even. The theoretical chance of this split is about {100*s['parity_probability']:.1f} percent.",
        repetition+f" The theoretical chance of exactly {r} {'repeat' if r == 1 else 'repeats'} is about {100*s['repeat_probability']:.1f} percent.",
        'Explore sum, odd-even, and repeat preferences in the Lab. Matching these patterns does not mean matching the winning numbers.',
        'Save portfolios before the draw. Compare equal line counts with random picks. Explore Evidraw. No guaranteed winnings. Play responsibly.']

def timestamp(t):
    ms=round(t*1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'

def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('input'); parser.add_argument('--verify-only',action='store_true'); parser.add_argument('--revise-unreviewed-draft',action='store_true'); args=parser.parse_args()
    input_path=Path(args.input); g=json.loads(input_path.read_text(encoding='utf-8'))
    ledger_path=ROOT/'outputs/draw-video-completion-ledger.json'
    if ledger_path.exists() and not args.verify_only:
        ledger=json.loads(ledger_path.read_text(encoding='utf-8'))
        if any(row['game']==g['slug'] and row['draw_date']==g['date'] for row in ledger['completed']):
            print('Already completed; no duplicate output created.',flush=True)
            return
    out=ROOT/'outputs'/f"draw-breakdown-{g['slug']}-{g['date']}"; out.mkdir(exist_ok=True)
    self_tests(); verified_records=verify(g,out); s=stats(g)
    manifest=dict(input=g,statistics=s,verified_wclc_records=verified_records,
        generated_at=datetime.now(timezone.utc).isoformat(),input_sha256=digest(input_path),
        source_files=[dict(**src,sha256=digest(out/'sources'/src['file'])) for src in g['sources']],
        methodology='Uniform independent fair draw; exact combinatorial probabilities, not historical rates. No strategy performance or prediction claims. Bonus excluded.',
        tests='Combinatorial sum and mean, probability normalization, zero/one/multiple repeats and below/equal/above-mean fixtures passed.')
    (out/'verified-calculations-and-sources.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print(json.dumps(s,indent=2),flush=True)
    if args.verify_only: return
    file_game={'lotto-max':'Lotto-Max','lotto-649':'Lotto-649'}[g['slug']]
    target=out/f"Evidraw-{file_game}-{g['date']}.mp4"
    if target.exists():
        prior=json.loads((out/'validation.json').read_text(encoding='utf-8'))
        if not (args.revise_unreviewed_draft and prior['status']=='rendered_needs_visual_review'):
            raise RuntimeError('Draft already exists. Do not recreate a completed draw; only explicitly revise an unreviewed draft.')
    images=slides(g,s); lines=narration(g,s)
    (out/'transcript.txt').write_text('\n\n'.join(lines),encoding='utf-8')
    title=f"{g['game']} {date_label(g['date'])}: Winning Numbers & Draw Breakdown | Evidraw"
    description=f"What did the Lotto Max main draw look like on {date_label(g['date'])}?\n\nMain numbers: "+' · '.join(map(str,g['numbers']))+f"\nBonus: {g['bonus']}\n\nIn this breakdown:\n• Main-number sum: {s['sum']} (theoretical average: {s['mean']:g})\n• Odd/even split: {s['odd']} odd, {s['even']} even\n• Exact theoretical probability of this split: {100*s['parity_probability']:.2f}% (rounded)\n• Main-number repeats from {date_label(g['previous_date'])}: {s['repeat_count']}\n• How to explore these traits in the Evidraw Learning Lab\n\nExplore Evidraw: https://evidraw.com\n\nThis is a description of a completed draw, not a prediction or proof that a strategy would have won. The probabilities shown are theoretical fair-draw calculations, not historical win rates. Every valid individual line has the same jackpot chance in a fair draw. Bonus numbers are excluded from sums, parity and repeats. MAXMILLIONS and MAXPLUS are separate.\n\nEvidraw does not sell lottery tickets or guarantee winnings. Play responsibly.\n\nOfficial results checked October 7, 2026:\n"+g['sources'][0]['url']+'\n'+g['sources'][1]['url']+'\n\n#LottoMax #LotteryResults #Evidraw'
    # Keep the dated source-check label and game scope in sync with the input.
    description=description.replace('Official results checked October 7, 2026:',f"Official results checked {date_label(g['checked_at'][:10])}:")
    if g['slug']=='lotto-649':
        description=description.replace('Lotto Max main draw','Lotto 6/49 Classic draw').replace('MAXMILLIONS and MAXPLUS are separate.','Gold Ball is a separate draw and is not analyzed here.').replace('#LottoMax','#Lotto649')
    (out/'youtube-title-and-description.txt').write_text('TITLE\n'+title+'\n\nDESCRIPTION\n'+description,encoding='utf-8')
    opts=ort.SessionOptions(); opts.intra_op_num_threads=4; opts.inter_op_num_threads=1
    session=ort.InferenceSession(str(ROOT/'work/voice-models/kokoro-v1.0.onnx'),sess_options=opts,providers=['CPUExecutionProvider'])
    voice=Kokoro.from_session(session,str(ROOT/'work/voice-models/voices-v1.0.bin'))
    parts=[]; timeline=[]; elapsed=0; captions=[]
    for i,(im,line) in enumerate(zip(images,lines)):
        img=out/f'slide-{i+1}.png'; im.save(img)
        phonemes=' ˈɛvɪdɹɔː '.join(voice.tokenizer.phonemize(p,'en-us') if p.strip() else '' for p in line.split('Evidraw')).strip()
        samples,rate=voice.create(phonemes,voice='am_fenrir',speed=1.0,lang='en-us',is_phonemes=True,sentence_pause=.18,clause_pause=.06)
        samples=np.concatenate([np.zeros(round(rate*.25),np.float32),samples,np.zeros(round(rate*.35),np.float32)])
        wav=out/f'narration-{i+1}.wav'; sf.write(wav,samples,rate)
        duration=math.ceil(max(6,len(samples)/rate)*FPS)/FPS; part=out/f'part-{i+1}.mp4'
        subprocess.run([str(FFMPEG),'-hide_banner','-loglevel','error','-y','-loop','1','-framerate',str(FPS),'-i',str(img),'-i',str(wav),'-t',str(duration),'-vf',f'fade=t=in:st=0:d=0.20,fade=t=out:st={duration-.20}:d=0.20','-af','apad,loudnorm=I=-16:TP=-1.5:LRA=9','-c:v','libx264','-preset','fast','-threads','4','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',str(part)],check=True)
        parts.append(part); timeline.append(dict(start=elapsed,duration=duration,text=line))
        # Short sentence-sized caption cues, approximately timed within each scene.
        chunks=re.split(r'(?<=[.!?])\s+',line); total_words=sum(len(c.split()) for c in chunks); cue_start=elapsed
        for chunk in chunks:
            cue_end=cue_start+duration*len(chunk.split())/total_words
            captions.append(f'{len(captions)+1}\n{timestamp(cue_start)} --> {timestamp(cue_end)}\n'+textwrap.fill(chunk,48)+'\n')
            cue_start=cue_end
        elapsed+=duration; print(f'Scene {i+1}: {duration:.2f}s; total {elapsed:.2f}s',flush=True)
    concat=out/'concat.txt'; concat.write_text('\n'.join("file '"+p.name+"'" for p in parts))
    subprocess.run([str(FFMPEG),'-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-c','copy','-movflags','+faststart',str(target)],check=True)
    decode=subprocess.run([str(FFMPEG),'-v','error','-i',str(target),'-f','null','-'],capture_output=True,text=True,check=True)
    assert not decode.stderr.strip(),decode.stderr
    (out/'captions.srt').write_text('\n'.join(captions),encoding='utf-8')
    (out/'timeline.json').write_text(json.dumps(timeline,indent=2),encoding='utf-8')
    sheet=Image.new('RGB',(810,960))
    for i,im in enumerate(images): sheet.paste(im.resize((270,480)),(i%3*270,i//3*480))
    sheet.save(out/'review.jpg')
    report=dict(status='rendered_needs_visual_review',duration_seconds=elapsed,target_duration_met=45<=elapsed<=60,dimensions=[W,H],fps=FPS,audio_sample_rate=48000,voice='am_fenrir',voice_speed=1.0,full_decode='passed without errors',video_sha256=digest(target),caption_timing='Sentence-sized cues approximately timed inside each narration scene; not word-aligned.')
    (out/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('DRAFT RENDERED',str(target),json.dumps(report),flush=True)

if __name__=='__main__': main()
