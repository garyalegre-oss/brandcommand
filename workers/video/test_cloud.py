import hashlib,json,os,unittest
from unittest.mock import patch
import cloud_daily as cloud
import run_once as worker

class CloudTests(unittest.TestCase):
    def job(self,g=None):
        g=g or {**worker.read(worker.FIXTURE),'rules_sha256':worker.RULES_SHA}
        g['sources']=g['sources'][:3]
        for s,name in zip(g['sources'],['wclc-results.html','loto-quebec.html','rules.pdf']):s['file']=name
        raw=json.dumps(g);return {'inputJson':raw,'input_hash':hashlib.sha256(raw.encode()).hexdigest(),'draw_key':g['slug']+'-'+g['date'],'id':'00000000-0000-4000-8000-000000000001','lease':'a'*64}
    def test_valid(self):self.assertEqual(cloud.validate_input(self.job())['numbers'],[9,15,20,23,26,31])
    def test_modified_input(self):
        j=self.job();j['inputJson']+=' '
        with self.assertRaises(ValueError):cloud.validate_input(j)
    def test_source_allowlist(self):
        j=self.job();g=json.loads(j['inputJson']);g['sources'][0]['url']='https://evil.invalid'
        with self.assertRaises(ValueError):cloud.validate_input(self.job(g))
    def test_disabled_never_calls_server(self):
        with patch.dict(os.environ,{'CLOUD_AUTOMATION_ENABLED':'false'}),patch.object(worker,'send') as send:cloud.main();send.assert_not_called()
    def test_paused_no_render(self):
        with patch.dict(os.environ,{'CLOUD_AUTOMATION_ENABLED':'true','EVIDRAW_CLOUD_TOKEN':'a'*64}),patch.object(worker,'send',return_value={'paused':True}),patch.object(worker,'execute') as execute:cloud.main();execute.assert_not_called()
    def test_empty_no_render(self):
        with patch.dict(os.environ,{'CLOUD_AUTOMATION_ENABLED':'true','EVIDRAW_CLOUD_TOKEN':'a'*64}),patch.object(worker,'send',return_value={'job':None}),patch.object(worker,'execute') as execute:cloud.main();execute.assert_not_called()
if __name__=='__main__':unittest.main()
