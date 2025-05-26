const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`✅ Ava is online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  if (content.includes('🚗')) {
    console.log(`🛬 ${message.author.username} has ARRIVED at job`);
    try {
      await message.channel.send(`✅ Got it, ${message.author.username} — you're checked in! 🚗`);
    } catch (err) {
      console.error('❌ Failed to send ARRIVED message:', err);
    }
    // TODO: Send to n8n webhook
  }

  if (content.includes('🏁')) {
    console.log(`✅ ${message.author.username} has FINISHED the job`);
    try {
      await message.channel.send(`🎉 Great work, ${message.author.username}! Job marked as finished.`);
    } catch (err) {
      console.error('❌ Failed to send FINISHED message:', err);
    }
    // TODO: Send to n8n webhook
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);