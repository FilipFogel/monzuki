"""Reject incomplete PNG resources before Android packages them."""
from pathlib import Path
import struct
import zlib

root = Path(__file__).resolve().parents[1]
icons = [root / 'android-app/app/src/main/res/drawable/launcher_art.png',
         root / 'android-app/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png']

def validate_png(data):
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'Invalid PNG signature'
    offset, compressed, ended = 8, bytearray(), False
    while offset < len(data):
        assert offset + 12 <= len(data), 'Truncated chunk header'
        length = struct.unpack('>I', data[offset:offset+4])[0]
        kind = data[offset+4:offset+8]
        end = offset + 12 + length
        assert end <= len(data), 'Truncated PNG chunk'
        payload = data[offset+8:offset+8+length]
        crc = struct.unpack('>I', data[offset+8+length:end])[0]
        assert zlib.crc32(kind + payload) & 0xffffffff == crc, 'PNG checksum mismatch'
        if kind == b'IDAT': compressed.extend(payload)
        if kind == b'IEND':
            assert length == 0 and end == len(data), 'Invalid PNG ending'
            ended = True
            break
        offset = end
    assert ended and compressed, 'Missing image data or IEND'
    decoder = zlib.decompressobj()
    assert decoder.decompress(compressed), 'Empty pixels'
    assert decoder.eof and not decoder.unused_data, 'Incomplete pixel stream'

for icon in icons:
    data = icon.read_bytes()
    validate_png(data)
    for truncated in (data[:8], data[:len(data)//2], data[:-12]):
        try:
            validate_png(truncated)
        except (AssertionError, zlib.error):
            pass
        else:
            raise AssertionError('Truncated icon was accepted')
    print('Verified complete PNG:', icon.relative_to(root))
