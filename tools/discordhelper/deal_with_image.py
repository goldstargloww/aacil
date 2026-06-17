from PIL import Image, ImageOps
import sys
import subprocess

if len(sys.argv) < 3:
    print(f"Usage: {sys.argv[0]} file.png out.png")
    sys.exit(-1)

im = Image.open(sys.argv[1])
# Crop to content
bbox = im.getbbox()
im = im.crop(bbox)
# Make sure it supports alpha
if im.mode != 'RGBA':
    im = im.convert('RGBA')
# Limit size
im.thumbnail((600, 600))
# Make it square again
largest_dim = max(im.width, im.height)
im = ImageOps.pad(im, (largest_dim, largest_dim), color=(0, 0, 0, 0))
im.save(sys.argv[2])

subprocess.run(['pngcrush', '-q', '-ow',
                f"{sys.argv[2]}", f"{sys.argv[2]}.tmp"])
