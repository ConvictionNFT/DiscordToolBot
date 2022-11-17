const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const shareAbi = require("../abis/sharecontract.json");
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
require("dotenv").config();
const mongo = require("../mongo");
const web3 = createAlchemyWeb3(process.env.API_URL);
const convictionSchema = require("../schemas/convictionSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mytokens")
    .setDescription(
      "Gets the token id if user registered with verification system"
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (interaction.user.bot) return;
    const truncate = (input, len) =>
      input.length > len ? `${input.substring(0, len)}...` : input;
    const shareContract = new web3.eth.Contract(
      shareAbi,
      process.env.SHARE_CONTRACT
    );

    const userId = interaction.user.id;
    try {
      console.log(interaction.user.avatar);
      let pfp = `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.png`;
      await mongo().then(async (mongoose) => {
        let results = await convictionSchema.find({ userId });

        if (results.length != 0) {
          let wallets = "";
          let earnings = 0;
          let tokens = "";

          for (const result of results) {
            tokens += result.Nftholdings.join(",") + ",";
            const holder = truncate(result.wallet, 12);
            let earning = await shareContract.methods
              .bonusInfo(result.wallet, result.Nftholdings)
              .call();

            earnings += parseInt(earning[0]);
            wallets += `${holder} \n`;
          }

          earnings = parseFloat(
            web3.utils.fromWei(earnings.toString(), "ether")
          ).toFixed(3);
          const muteEmbed = new EmbedBuilder()
            .setTitle(`**${interaction.user.username}  Holder Info**`)

            .addFields(
              { name: "Wallet", value: `${wallets}` },

              {
                name: "All Tokens",
                value: `${tokens}`,
                inline: true,
              },
              { name: "\u200B", value: "\u200B", inline: true },
              { name: "Total Earnings:", value: `${earnings} Ξ`, inline: true },
              { name: "\u200B", value: "\u200B" }
            )

            .setFooter({ text: "This is just a testing.." })
            .setTimestamp()
            .setThumbnail(pfp)
            .setColor("#E5451E");
          await interaction.editReply({ embeds: [muteEmbed], ephemeral: true });
        } else {
          const muteEmbed = new EmbedBuilder().setTitle(
            "You do not have any token registered on verification bot.."
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
