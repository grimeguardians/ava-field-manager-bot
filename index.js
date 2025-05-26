const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// n8n webhook URL
const N8N_WEBHOOK_URL = 'https://grimeguardians.app.n8n.cloud/webhook/job-status-updates';

client.once('ready', () => {
  console.log(`✅ Ava is online as ${client.user.tag}`);
});

// Helper function to send data to n8n
async function sendToN8N(messageData) {
  try {
    const https = require('https');
    const url = require('url');
    
    const parsedUrl = url.parse(N8N_WEBHOOK_URL);
    const postData = JSON.stringify(messageData);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      console.log(`✅ Data sent to n8n, status: ${res.statusCode}`);
    });
    
    req.on('error', (error) => {
      console.error('❌ Error sending to n8n:', error);
    });
    
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Error in sendToN8N:', error);
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();
  const channelName = message.channel.name;

  if (content.includes('🚗')) {
    console.log(`🛬 ${message.author.username} has ARRIVED at job`);
    try {
      await message.channel.send(`✅ Got it, ${message.author.username} — you're checked in! 🚗`);
      
      // Only send to n8n if in job-check-ins channel
      if (channelName === 'job-check-ins') {
        await sendToN8N({
          username: message.author.username,
          message: message.content, // Original content, not lowercase
          timestamp: message.createdAt.toISOString(),
          channel: channelName,
          action: 'arrived'
        });
      }
      
    } catch (err) {
      console.error('❌ Failed to send ARRIVED message:', err);
    }
  }

  if (content.includes('🏁')) {
    console.log(`✅ ${message.author.username} has FINISHED the job`);
    try {
      await message.channel.send(`🎉 Great work, ${message.author.username}! Job marked as finished.`);
      
      // Only send to n8n if in job-check-ins channel
      if (channelName === 'job-check-ins') {
        await sendToN8N({
          username: message.author.username,
          message: message.content, // Original content, not lowercase
          timestamp: message.createdAt.toISOString(),
          channel: channelName,
          action: 'finished'
        });
      }
      
    } catch (err) {
      console.error('❌ Failed to send FINISHED message:', err);
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
