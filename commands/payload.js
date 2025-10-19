const http = require('http');
const https = require('https');
const { URL } = require('url');

module.exports = {
  data: {
    name: 'postbin',
    description: 'ps4 goldhen payload run'
  },

  async execute(target, client) {
    const isInteraction = typeof target.isCommand === 'function' && typeof target.deferReply === 'function';
    const isMessage = typeof target.content === 'string' && target.attachments;

    function replyEphemeral(interaction, text) {
      try {
        if (interaction.replied || interaction.deferred) return interaction.followUp({ content: text, ephemeral: true });
        return interaction.reply({ content: text, ephemeral: true });
      } catch (e) {
        if (interaction.channel) return interaction.channel.send(text);
      }
    }

    function downloadToBuffer(fileUrl) {
      return new Promise((resolve, reject) => {
        const clientLib = fileUrl.startsWith('https://') ? https : http;
        clientLib.get(fileUrl, (res) => {
          if (res.statusCode !== 200) return reject(new Error(`Download failed: status ${res.statusCode}`));
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }).on('error', reject);
      });
    }

    function postBinary(targetUrl, buffer, timeout = 7000) {
      return new Promise((resolve, reject) => {
        let parsed;
        try {
          parsed = new URL(targetUrl);
        } catch (e) {
          return reject(new Error('Invalid target URL'));
        }

        const opts = {
          method: 'POST',
          hostname: parsed.hostname,
          port: parsed.port,
          path: parsed.pathname + parsed.search,
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': buffer.length,
            'User-Agent': 'discord-bot-postbin/1.0'
          },
          timeout
        };

        const req = (parsed.protocol === 'https:' ? https : http).request(opts, (res) => {
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8');
            resolve({ statusCode: res.statusCode, body });
          });
        });

        req.on('error', reject);
        req.on('timeout', () => req.destroy(new Error('Request timed out')));
        req.write(buffer);
        req.end();
      });
    }
    if (isInteraction) {
      const interaction = target;
      await interaction.deferReply();
      let ip = null;
      let port = null;
      let attachment = null;

      try {
        const optIp = interaction.options?.getString?.('ip');
        const optPort = interaction.options?.getInteger?.('port');
        const optAtt = interaction.options?.getAttachment?.('file');
        if (optIp) ip = optIp;
        if (optPort) port = optPort;
        if (optAtt) attachment = optAtt;
      } catch (e) {
      }
      if (!ip || !attachment) {
        const possibleAttach = interaction.options?._hoistedOptions?.find(o => o?.attachment)?.attachment;
        if (possibleAttach && !attachment) attachment = possibleAttach;
      }

      if (!ip) {
        await interaction.editReply('Please provide the target IP.');
        return;
      }

      if (!attachment) {
        await interaction.editReply('You must provide a `.bin` attachment in the `file`.');
        return;
      }

      if (!attachment.name || !attachment.name.toLowerCase().endsWith('.bin')) {
        await interaction.editReply('Please attach a file with a `.bin` extension.');
        return;
      }

      const finalPort = port || 3000;
      const targetUrl = `http://${ip}:${finalPort}/upload`;

      try {
        await interaction.editReply(`Downloading **${attachment.name}** (${attachment.size} bytes)...`);
        const buf = await downloadToBuffer(attachment.url);

        await interaction.editReply(`Posting **${attachment.name}** (${buf.length} bytes) to \`${targetUrl}\`...`);
        const res = await postBinary(targetUrl, buf);

        const preview = (res.body || '').slice(0, 1000);
        await interaction.editReply(`POST complete — status ${res.statusCode}.\nResponse:\n\`\`\`\n${preview}\n\`\`\``);
      } catch (err) {
        console.error('[postbin][interaction] error:', err);
        await interaction.editReply(`Failed: ${err && err.message ? err.message : String(err)}`);
      }

      return;
    }

    if (isMessage) {
      const message = target;
      const prefixParts = message.content.trim().split(/\s+/);
      const cmdToken = prefixParts[0] || '';
      const ip = prefixParts[1] || null;
      const port = prefixParts[2] ? parseInt(prefixParts[2], 10) : 3000;

      if (!ip) {
        return message.reply('Usage: `!postbin <ip> [port]` with the .bin file attached to the same message.');
      }

      if (!message.attachments.size) {
        return message.reply('Attach the .bin file to the same message when you run the command.');
      }

      const attachment = message.attachments.first();
      if (!attachment.name || !attachment.name.toLowerCase().endsWith('.bin')) {
        return message.reply('Please attach a file with a `.bin` extension.');
      }

      const targetUrl = `http://${ip}:${port}/upload`;
      try {
        const initMsg = await message.channel.send(`Downloading attachment **${attachment.name}** (${attachment.size} bytes)...`);
        const buf = await downloadToBuffer(attachment.url);

        await initMsg.edit(`Posting **${attachment.name}** (${buf.length} bytes) to \`${targetUrl}\`...`);
        const res = await postBinary(targetUrl, buf);
        const preview = (res.body || '').slice(0, 1000);

        await initMsg.edit(`POST complete — status ${res.statusCode}.\nResponse \n\`\`\`\n${preview}\n\`\`\``);
      } catch (err) {
        console.error('[postbin][message] error:', err);
        await message.channel.send('Failed to POST binary: ' + (err && err.message ? err.message : String(err)));
      }

      return;
    }
    console.warn('[postbin] execute called with unknown target type');
  }
};
