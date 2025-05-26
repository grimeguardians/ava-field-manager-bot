const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// n8n webhook URL - UPDATE THIS with your actual webhook path
const N8N_WEBHOOK_URL = 'https://grimeguardians.app.n8n.cloud/webhook-test/job-status-updates';

client.once('ready', () => {
  console.log(`✅ Ava is online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  const content = message.content;
  const channelName = message.channel.name;
  
  // Only process messages in job-check-ins channel
  if (channelName !== 'job-check-ins') return;
  
  // Helper function to send data to n8n
  async function sendToN8N(messageData) {
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });
      
      if (response.ok) {
        console.log('✅ Data sent to n8n successfully');
      } else {
        console.error('❌ Failed to send to n8n:', response.status);
      }
    } catch (error) {
      console.error('❌ Error sending to n8n:', error);
    }
  }
  
  // Check for ARRIVED emoji (🚗)
  if (content.includes('🚗')) {
    console.log(`🛬 ${message.author.username} has ARRIVED at job`);
    
    try {
      await message.channel.send(`✅ Got it, ${message.author.username} — you're checked in! 🚗`);
      
      // Send to n8n webhook
      await sendToN8N({
        username: message.author.username,
        message: content,
        timestamp: message.createdAt.toISOString(),
        channel: channelName,
        action: 'arrived'
      });
      
    } catch (err) {
      console.error('❌ Failed to send ARRIVED message:', err);
    }
  }
  
  // Check for FINISHED emoji (🏁)
  if (content.includes('🏁')) {
    console.log(`✅ ${message.author.username} has FINISHED the job`);
    
    try {
      await message.channel.send(`🎉 Great work, ${message.author.username}! Job marked as finished. 🏁`);
      
      // Send to n8n webhook
      await sendToN8N({
        username: message.author.username,
        message: content,
        timestamp: message.createdAt.toISOString(),
        channel: channelName,
        action: 'finished'
      });
      
    } catch (err) {
      console.error('❌ Failed to send FINISHED message:', err);
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
