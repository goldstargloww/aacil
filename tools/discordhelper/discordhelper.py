# This example requires the 'message_content' intent.

from SECRETS import BOT_TOKEN
import discord


class MyClient(discord.Client):
    async def on_ready(self):
        print(f'Logged on as {self.user}!')

    async def on_message(self, message):
        if len(message.message_snapshots) == 1:
            orig_msg = message.message_snapshots[0]
            print(orig_msg)
            print(orig_msg.content)
            print(orig_msg.attachments)
            downloaded_attachments = []
            for x in orig_msg.attachments:
                downloaded_attachments.append(await x.read())
            print(downloaded_attachments)


intents = discord.Intents.default()
intents.message_content = True

client = MyClient(intents=intents)
client.run(BOT_TOKEN)
