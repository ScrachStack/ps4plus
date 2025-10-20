const fs = require("fs"),
    path = require("path");
const {
    Client,
    GatewayIntentBits,
    Partials,
    Events,
    REST,
    Routes,
    Collection
} = require("discord.js");
const config = require("./config");
const {
    token,
    clientId
} = config;

const client = new Client({
    intents: Object.values(GatewayIntentBits),
    partials: Object.values(Partials)
});
client.commands = new Collection();

const commands = fs.readdirSync(path.join(__dirname, "commands"))
    .filter(f => f.endsWith(".js"))
    .map(f => {
        const cmd = require(`./commands/${f}`);
        if (cmd ?.data && cmd ?.execute) {
            client.commands.set(cmd.data.name, cmd);
            return cmd.data.toJSON();
        }
    }).filter(Boolean);

const rest = new REST({
    version: "10"
}).setToken(token);

client.once(Events.ClientReady, () => {
    console.log(`[Sync Studios]: Bot logged in as ${client.user.tag}`);
    console.log("[Sync Studios] PS$+++: Loading ....");
    console.log("[Sync Studios] Support: https://disboard.org/server/join/1119734000974565439");
    console.log("[Sync Studios] Made By ScratchStack");
});

client.on(Events.InteractionCreate, async i => {
    if (!i.isChatInputCommand()) return;
    const cmd = client.commands.get(i.commandName);
    if (!cmd) return i.reply({
        content: "Command not found.",
        ephemeral: true
    });
    try {
        await cmd.execute(i);
    } catch (err) {
        console.error(`[Command Error] ${i.commandName}`, err);
        i.reply({
            content: "There was an error executing this command.",
            ephemeral: true
        });
    }
});

(async () => {
    try {
        await rest.put(Routes.applicationCommands(clientId), {
            body: commands
        });
    } catch (err) {
        console.error("[Command Sync Error]", err);
    }
    await client.login(token);
})();


const express = require("express");
const multer = require("multer");
const http = require("http");
const https = require("https");
const { URL } = require("url");

const app = express();
const upload = multer({ dest: "uploads/" });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index", { result: null, error: null });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const ip = req.body.ip;
  const port = req.body.port || 9090;

  if (!ip || !req.file) {
    return res.render("index", {
      result: null,
      error: "Missing IP or file.",
    });
  }

  const filePath = req.file.path;
  const fileBuffer = fs.readFileSync(filePath);
  const url = `http://${ip}:${port}/upload`;

  try {
    const result = await new Promise((resolve, reject) => {
      const u = new URL(url);
      console.log(u.hostname)
      console.log(u.port)
      const options = {
        method: "POST",
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Length": fileBuffer.length,
          "User-Agent": "ps4plus-web/1.0",
        },
        timeout: 150000,
      };

      const request = (u.protocol === "https:" ? https : http).request(
        options,
        (r) => {
          let body = "";
          r.on("data", (chunk) => (body += chunk));
          r.on("end", () =>
            resolve({ status: r.statusCode, body: body.slice(0, 500) })
          );
        }
      );

      request.on("error", reject);
      request.on("timeout", () =>
        request.destroy(new Error("Connection Timeout"))
      );
      request.write(fileBuffer);
      request.end();
    });

    res.render("index", {
      result: result,
      error: null,
    });
  } catch (err) {
    res.render("index", {
      result: null,
      error: err.message || "Unknown error occurred.",
    });
  } finally {
    fs.unlinkSync(filePath);
  }
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`[PSPlus Web] Running at http://localhost:${PORT}`)
);
