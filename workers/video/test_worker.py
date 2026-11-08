import json,os,unittest
from unittest.mock import patch
from pathlib import Path
import run_once as worker

class SafetyTests(unittest.TestCase):
    def test_fixture_is_only_approved_brand(self):
        g=worker.read(worker.FIXTURE)
        self.assertEqual(g['slug'],'lotto-649')
        self.assertEqual(g['date'],'2026-11-07')
        self.assertEqual(g['numbers'],[9,15,20,23,26,31])
        self.assertEqual(g['previous_numbers'],[1,3,22,28,36,41])
        self.assertEqual(g['bonus'],6)
        self.assertEqual(sum(g['numbers']),124)
        self.assertFalse(set(g['numbers'])&set(g['previous_numbers']))
    def test_job_binding(self):
        key='lotto-649-2026-11-07'; h=worker.sha(worker.FIXTURE)
        good=dict(draw_key=key,input_hash=h,id='12345678-1234-1234-1234-123456789012',lease='a'*64)
        worker.assert_job(good,key,h)
        for changes in [dict(draw_key='lotto-max-2026-11-06'),dict(input_hash='b'*64),dict(id='../x'),dict(lease='oops')]:
            with self.assertRaises(ValueError): worker.assert_job({**good,**changes},key,h)
    def test_invalid_credential_before_network(self):
        with patch('urllib.request.build_opener') as network:
            with self.assertRaises(ValueError): worker.send('bad',{})
            network.assert_not_called()
    def test_bad_asset_before_network(self):
        with patch('urllib.request.build_opener') as network:
            with self.assertRaises(ValueError): worker.send('a'*64,asset='../../secret',job='x',content=b'')
            network.assert_not_called()
    def test_no_youtube_publication_path(self):
        src=Path(worker.__file__).read_text()
        self.assertNotIn('googleapis.com',src)
        self.assertNotIn('privacyStatus',src)
        self.assertIn('timeout=600',src)
        self.assertIn('NoRedirect()',src)
    def test_cloud_bounded(self):
        docker=(Path(worker.__file__).parent/'Dockerfile').read_text()
        self.assertIn('"900s"',docker)
        self.assertIn('USER worker',docker)
        self.assertNotIn('ARG EVIDRAW_WORKER_TOKEN',docker)
    def test_all_fixture_sources_official(self):
        from urllib.parse import urlsplit
        for item in worker.read(worker.FIXTURE)['sources']:
            u=urlsplit(item['url'])
            self.assertEqual(u.scheme,'https')
            self.assertIn(u.hostname,['www.wclc.com','loteries.lotoquebec.com'])
            self.assertEqual(Path(item['file']).name,item['file'])
if __name__=='__main__': unittest.main()
