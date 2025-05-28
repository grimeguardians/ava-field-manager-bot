const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
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
  const timestamp = new Date().toISOString(); // ✅ Use one consistent timestamp

  const arrivalTriggers = ['🚗', 'arrived', "i've arrived", 'here', "i'm here", "starting"];
  const hasArrivalTrigger = arrivalTriggers.some(trigger => content.includes(trigger));
  
  if (hasArrivalTrigger) {
    console.log(`🛬 ${message.author.username} has ARRIVED at job`);

    try {
      await message.channel.send(`✅ Got it, ${message.author.username} — you're checked in! 🚗`);

      const payload = {
        username: message.author.username,
        message: message.content + ' 🚗',
        timestamp: timestamp,
        action: 'arrived'
      };
      console.log('📡 Sending ARRIVED check-in to n8n:', payload);

      await axios.post('https://grimeguardians.app.n8n.cloud/webhook-test/discord-checkin', payload);
    } catch (err) {

      console.error('❌ Failed to send ARRIVED webhook to n8n:', err.message);
      if (err.response) {
        console.error('🔎 Response data:', err.response.data);
      }
    }
  }

  const finishedTriggers = ['🏁', 'finished', "i'm finished", 'done', 'all done'];
  const hasFinishedTrigger = finishedTriggers.some(trigger => content.includes(trigger));
  
  if (hasFinishedTrigger) {
    console.log(`✅ ${message.author.username} has FINISHED the job`);

    try {
      await message.channel.send(`🎉 Great work, ${message.author.username}! Job marked as finished.`);

      const payload = {
        username: message.author.username,
        message: message.content + ' 🏁',
        timestamp: timestamp,
        action: 'finished'
      };
      console.log('📡 Sending FINISHED check-in to n8n:', payload);

      await axios.post('https://grimeguardians.app.n8n.cloud/webhook-test/discord-checkin', payload);
    } catch (err) {

      console.error('❌ Failed to send FINISHED webhook to n8n:', err.message);
      if (err.response) {
        console.error('🔎 Response data:', err.response.data);
      }
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
