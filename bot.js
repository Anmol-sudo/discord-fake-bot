const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const { GUILD_ID, CHANNEL_ID } = process.env;

  const guild = await client.guilds.fetch(GUILD_ID);
  const channel = guild.channels.cache.get(CHANNEL_ID);

  if (channel && channel.isVoiceBased()) {
    joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false, // Tells the bot not to deafen itself on join
    });

    // Fetch the bot's own member object and undeafen it if needed
    try {
      const member = await guild.members.fetch(client.user.id);
      if (member.voice?.serverDeaf) {
        await member.voice.setDeaf(false);
        console.log("Bot undeafened.");
      }
    } catch (err) {
      console.error("Failed to undeafen the bot:", err);
    }

    console.log("Joined voice channel.");
  } else {
    console.log("Channel not found or not a voice channel.");
  }
});

client.login(process.env.BOT_TOKEN);
