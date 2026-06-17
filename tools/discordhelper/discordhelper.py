# This example requires the 'message_content' intent.

from SECRETS import BOT_TOKEN
from PIL import Image, ImageOps
import csv
import discord
import io
import logging
import subprocess

logger = logging.getLogger(__name__)
csv_fp = open('messages.csv', 'w', encoding='utf-8')
csv_w = csv.writer(csv_fp)


def deal_with_image(data):
    im = Image.open(io.BytesIO(data))
    # Crop to content
    bbox = im.getbbox()
    im = im.crop(bbox)
    # Make sure it supports alpha
    if im.mode != 'RGBA':
        im = im.convert('RGBA')
    # print(im)
    # Limit size
    im.thumbnail((600, 600))
    # print(im)
    # Make it square again
    largest_dim = max(im.width, im.height)
    im = ImageOps.pad(im, (largest_dim, largest_dim), color=(0, 0, 0, 0))
    # print(im)
    return im


class MyClient(discord.Client):
    async def on_ready(self):
        print(f'Logged on as {self.user}!')

    async def on_message(self, message):
        if len(message.message_snapshots) == 1:
            orig_msg = message.message_snapshots[0]
            # print(orig_msg.content)
            downloaded_attachments = []
            for x in orig_msg.attachments:
                downloaded_attachments.append(await x.read())
            try:
                processed_imgs = [deal_with_image(x)
                                  for x in downloaded_attachments]
            except Exception as e:
                logger.error(e)

            for (i, im) in enumerate(processed_imgs):
                attach_id = orig_msg.attachments[i].id
                with open(f"{attach_id}.png", 'wb') as f:
                    im.save(f)
                subprocess.run(['pngcrush', '-q', '-ow',
                                f"{attach_id}.png", f"{attach_id}.tmp"])
                print(attach_id)

                csv_w.writerow([attach_id, orig_msg.content])
                csv_fp.flush()


intents = discord.Intents.default()
intents.message_content = True

client = MyClient(intents=intents)
client.run(BOT_TOKEN)
