const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
} = require("@discordjs/voice");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// 🔇 Silent audio loop function
function playSilentLoop(connection) {
  const player = createAudioPlayer();

  function createResource() {
    return createAudioResource(
      fs.createReadStream(path.join(__dirname, "weeknd-hip-hop-radio.m4a")),
      { inputType: StreamType.Arbitrary }
    );
  }

  let resource = createResource();
  player.play(resource);
  connection.subscribe(player);

  player.on("idle", () => {
    resource = createResource(); // Create a new resource each time
    player.play(resource);
  });

  console.log("Started silent audio loop.");
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const { GUILD_ID, CHANNEL_ID } = process.env;

  const guild = await client.guilds.fetch(GUILD_ID);
  const channel = guild.channels.cache.get(CHANNEL_ID);

  if (channel && channel.isVoiceBased()) {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false, // Don't deafen the bot
    });

    playSilentLoop(connection); // 🎵 Start silent loop

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

// 🔄 Rejoin logic
client.on("voiceStateUpdate", (oldState, newState) => {
  if (
    oldState.member.id === client.user.id &&
    oldState.channelId &&
    !newState.channelId
  ) {
    const channel = oldState.guild.channels.cache.get(process.env.CHANNEL_ID);
    if (channel) {
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: oldState.guild.id,
        adapterCreator: oldState.guild.voiceAdapterCreator,
        selfDeaf: false,
      });
      playSilentLoop(connection);
      console.log("Rejoined voice channel.");
    }
  }
});

client.login(process.env.BOT_TOKEN);