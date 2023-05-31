require('dotenv').config();
const { token, apiorg, apikey } = require('./config.json');
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`Ready! Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async function (message) {
  try {
    if (message.author.bot) return;
    if (!message.content.startsWith(`<@${client.user.id}>`)) return;
    const prevMessages = await message.channel.messages
      .fetch({ limit: 3 })
      .then((msgs) => {
        const prevStr = msgs.reverse().map((msg) => {
          if (msg.author.bot) {
            return { role: 'assistant', content: msg.content };
          } else {
            return { role: 'user', content: msg.content };
          }
        });
        prevStr.unshift({ role: 'system', content: 'You are a helpful assistant.' });
        return prevStr;
      });
    console.log(prevMessages);

    const requestBody = {
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: `The following is a dialogue between a helpful chatbot and a user. The chatbot is helpful, creative, 
intelligent, and very friendly. The chatbot will answer the user's questions in detail and provide examples to clarify 
concepts.\n\ChatGPT: I am your chatbot assistant, ChatGPT. I am capable of answering many different types of questions, 
and will guide you in your search for knowledge. I will answer your questions in detail and provide examples to clarify 
any concepts.\n${prevMessages}\nUser:${message.content}\nChatGPT:`,
        },
      ],
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      stop: ['ChatGPT: ', 'User: '],
    };

    const fetch = await import('node-fetch');
    const response = await fetch.default('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apikey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    console.log(responseData.choices[0]);
    if (response.ok) {
      const chatbotResponse = responseData.choices[0].message;
      message.channel.send(chatbotResponse);
    } else {
      console.error(`Error ${response.status}: ${JSON.stringify(responseData)}`);
      message.channel.send('I am sorry, something went wrong while processing your request. Please try again later.');
    }
  } catch (error) {
    console.error(error);
    message.channel.send('An error occurred while processing your request. Please try again later.');
  }
});

client.login(token);
console.log('chatGPT Bot is Online on Discord');
