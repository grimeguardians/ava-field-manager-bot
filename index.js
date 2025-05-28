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

// — START ADD: in-memory store for the latest jobId per user
const jobMap = new Map();
// helper to build the exact same ID format you use in n8n
function generateJobId(username, isoTimestamp) {
  const d = new Date(isoTimestamp);
  const datePart = d
    .toLocaleDateString('en-US', {
      timeZone: 'America/Chicago',
      year:   'numeric',
      month:  '2-digit',
      day:    '2-digit',
    })
    .replace(/\//g, '');
  const randomNum = Math.floor(Math.random() * 1000)
                      .toString()
                      .padStart(3, '0');
  return `${username}-${datePart}-${randomNum}`;
}
// — END ADD

client.once('ready', () => {
  console.log(`✅ Ava is online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content   = message.content.toLowerCase();
  const timestamp = new Date().toISOString();

  // — START ADD: compute CST date‐only string for jobId
  function getCstDateOnly() {
    return new Date().toLocaleDateString('en-US', {
      timeZone: 'America/Chicago',
      year:   'numeric',
      month:  '2-digit',
      day:    '2-digit',
    }).replace(/\//g, '');
  }
  // — END ADD

  const arrivalTriggers     = ['🚗','arrived',"i've arrived",'here',"i'm here",'starting'];
  const hasArrivalTrigger   = arrivalTriggers.some(t => content.includes(t));

  if (hasArrivalTrigger) {
    console.log(`🛬 ${message.author.username} has ARRIVED at job`);

    try {
      await message.channel.send(`✅ Got it, ${message.author.username} — you're checked in! 🚗`);

      // — START ADD: generate and store jobId on arrival
      const jobId = generateJobId(message.author.username, timestamp);
      jobMap.set(message.author.username, jobId);
      // — END ADD

      const payload = {
        username: message.author.username,
        message:  message.content + ' 🚗',
        timestamp,
        action:   'arrived',
        jobId,    // ✅ include jobId in the webhook
      };
      console.log('📡 Sending ARRIVED check-in to n8n:', payload);
      await axios.post(
        'https://grimeguardians.app.n8n.cloud/webhook-test/discord-checkin',
        payload
      );
    } catch (err) {
      console.error('❌ Failed to send ARRIVED webhook to n8n:', err.message);
      if (err.response) console.error('🔎 Response data:', err.response.data);
    }
  }

  const finishedTriggers    = ['🏁','finished',"i'm finished",'done','all done'];
  const hasFinishedTrigger  = finishedTriggers.some(t => content.includes(t));

  if (hasFinishedTrigger) {
    console.log(`✅ ${message.author.username} has FINISHED the job`);

    try {
      await message.channel.send(`🎉 Great work, ${message.author.username}! Job marked as finished.`);

      // — START ADD: retrieve the same jobId on finish
      const jobId = jobMap.get(message.author.username) || null;
      // — END ADD

      const payload = {
        username: message.author.username,
        message:  message.content + ' 🏁',
        timestamp,
        action:   'finished',
        jobId,    // ✅ carry jobId through so n8n can match the row
      };
      console.log('📡 Sending FINISHED check-in to n8n:', payload);
      await axios.post(
        'https://grimeguardians.app.n8n.cloud/webhook-test/discord-checkin',
        payload
      );
    } catch (err) {
      console.error('❌ Failed to send FINISHED webhook to n8n:', err.message);
      if (err.response) console.error('🔎 Response data:', err.response.data);
    }
  }
});  // <-- **CLOSE** your messageCreate listener

client.login(process.env.DISCORD_BOT_TOKEN);
