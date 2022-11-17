const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const shareAbi = require("../abis/sharecontract.json");
const mainAbi = require("../abis/maincontract.json");
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
require("dotenv").config();
const web3 = createAlchemyWeb3(process.env.API_URL);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("checktoken")
    .setDescription("Checks the token ID points")
    .addIntegerOption((option) =>
      option
        .setName("token")
        .setDescription("Enter token number")
        .setRequired(true)
    ),
  async execute(interaction, args, Permissions, client) {
    await interaction.deferReply({ ephemeral: true });
    if (interaction.user.bot) return;
    const truncate = (input, len) =>
      input.length > len ? `${input.substring(0, len)}...` : input;
    const shareContract = new web3.eth.Contract(
      shareAbi,
      process.env.SHARE_CONTRACT
    );
    const mainContract = new web3.eth.Contract(
      mainAbi,
      process.env.MAIN_CONTRACT
    );

    try {
      let convictionpoints = await mainContract.methods
        .getConvictionForToken(args)
        .call();
      let holder = await mainContract.methods.ownerOf(args).call();
      let earnings = await shareContract.methods
        .bonusInfo(holder, [args])
        .call();

      holder = truncate(holder, 8);
      const muteEmbed = new EmbedBuilder()
        .setTitle("Conviction Info")
        .setDescription(`Token info for token **${args}**`)
        .addFields(
          { name: "Holder", value: `${holder}` },

          {
            name: "Conviction Points",
            value: `${convictionpoints} Points`,
            inline: true,
          },
          { name: "\u200B", value: "\u200B", inline: true },
          { name: "Total Earnings:", value: `${earnings} Ξ`, inline: true },
          { name: "\u200B", value: "\u200B" }
        )

        .setFooter({ text: "This is just a testing.." })
        .setTimestamp()
        .setColor("#E5451E");
      await interaction.editReply({ embeds: [muteEmbed], ephemeral: true });
    } catch (error) {
      const muteEmbed = new EmbedBuilder()
        .setTitle("No token found under that ID...")
        .setColor("#E5451E");
      await interaction.editReply({ embeds: [muteEmbed], ephemeral: true });
    }
  },
};
