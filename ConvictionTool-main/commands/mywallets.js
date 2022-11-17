const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
require("dotenv").config();
const mongo = require("../mongo");
const convictionSchema = require("../schemas/convictionSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mywallets")
    .setDescription(
      "Gets the wallets if user registered with verification system"
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (interaction.user.bot) return;
    const truncate = (input, len) =>
      input.length > len ? `${input.substring(0, len)}...` : input;

    const userId = interaction.user.id;
    try {
      console.log(interaction.user.avatar);
      let pfp = `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png`;
      await mongo().then(async (mongoose) => {
        let results = await convictionSchema.find({ userId });
        if (results.length != 0) {
          let tx = "";
          for (const result of results) {
            const holder = truncate(result.wallet, 12);
            tx += `${holder} \n`;
          }

          const muteEmbed = new EmbedBuilder()
            .setTitle(`**${interaction.user.username}  Wallets Info**`)

            .setDescription(tx)

            .setFooter({ text: "This is just a testing.." })
            .setTimestamp()
            .setThumbnail(pfp)
            .setColor("#E5451E");
          await interaction.editReply({ embeds: [muteEmbed], ephemeral: true });
        } else {
          const muteEmbed = new EmbedBuilder().setTitle(
            "You do not have any wallet registered on verification bot.."
          );
          await interaction.editReply({ embeds: [muteEmbed], ephemeral: true });
        }

        mongoose.connection.close();
      });
    } catch (error) {
      console.log(error);
    }
  },
};
