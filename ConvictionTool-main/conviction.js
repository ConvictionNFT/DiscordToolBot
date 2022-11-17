const { Client, Collection, GatewayIntentBits } = require("discord.js");

require("dotenv").config();

const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const prefix = "-";

client.commands = new Collection();
const commandFiles = fs
  .readdirSync("./commands/")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}
client.once("ready", () => {
  console.log(`Logged in as ts ${client.user.tag}!`);
  client.user.setActivity("Conviction");
});

client.on("messageCreate", (msg) => {
  const args = msg.content.slice(prefix.length).split(" ");

  const command = args.shift().toLowerCase();
  async function tokenchecker() {
    client.commands.get("tokenchecker").execute(msg, args, Permissions, client);
    client.channels.fetch("999361447488409620").then((channel) => {
      channel.send("**Started 15 minute casual scan for holders**");
    });
    setTimeout(() => {
      tokenchecker();
    }, 1000 * 60 * 15);
  }
  if (msg.content[0] != "!") return;
  if (
    command === "starttokencheck" &&
    msg.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
  ) {
    tokenchecker();
  } else if (
    command === "tokeninfo" &&
    msg.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
  ) {
    client.commands.get("tokenchecker").execute(msg, args, Permissions, client);
  } else if (
    command === "mypoints" &&
    msg.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
  ) {
    client.commands.get("mypoints").execute(msg, args, Permissions, client);
  }
});
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  let commandName = interaction.commandName;
  if (interaction.commandName == "checktoken") {
    client.commands
      .get(commandName)
      .execute(
        interaction,
        interaction.options._hoistedOptions[0].value,
        Permissions,
        client
      );
  } else if (commandName == "mytokens") {
    client.commands.get(commandName).execute(interaction);
  } else if (commandName == "mywallets") {
    client.commands.get(commandName).execute(interaction);
  } else if (commandName == "checkwallet") {
    client.commands
      .get(commandName)
      .execute(interaction, interaction.options._hoistedOptions[0].value);
  } else if (commandName == "mypoints") {
    let data = fs
      .readFileSync("data.txt", { flag: "r", encoding: "utf-8" })
      .split("\n");
    client.commands
      .get(commandName)
      .execute(interaction, interaction.options._hoistedOptions[0].value, data);
  } else if (commandName == "snapshot") {
    client.commands.get(commandName).execute(interaction);
  } else if (commandName == "eligible") {
    client.commands.get(commandName).execute(interaction);
  }
});

client.login(process.env.BOT_TOKEN);
