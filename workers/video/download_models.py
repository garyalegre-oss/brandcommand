"""Public upstream models only; exact hashes match approved local Voice A."""
import hashlib, pathlib, urllib.request
DEST=pathlib.Path('/opt/models')
DEST.mkdir(exist_ok=True)
for name,sha in {
    'kokoro-v1.0.onnx':'beb0d1848dee9a49da392cc3df26958d46cfa35d321edf434f52949153f0df3a',
    'voices-v1.0.bin':'bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d',
}.items():
    p=DEST/name
    urllib.request.urlretrieve('https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/'+name,p)
    assert hashlib.sha256(p.read_bytes()).hexdigest()==sha, 'Model checksum mismatch'
    print(name,'verified',flush=True)
