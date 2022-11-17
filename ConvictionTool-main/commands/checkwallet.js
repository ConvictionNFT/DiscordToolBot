const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const shareAbi = require("../abis/sharecontract.json");
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
require("dotenv").config();
const mongo = require("../mongo");
const web3 = createAlchemyWeb3(process.env.API_URL);
const convictionSchema = require("../schemas/convictionSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("checkwallet")
    .setDescription(
      "Gets the token id if user registered with verification system"
    )
    .addStringOption((option) =>
      option
        .setName("wallet")
        .setDescription("Enter wallet address")
        .setRequired(true)
        .setMinLength(42)
        .setMaxLength(42)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction, wallet) {
    await interaction.deferReply({ ephemeral: true });
    if (interaction.user.bot) return;

    const shareContract = new web3.eth.Contract(
      shareAbi,
      process.env.SHARE_CONTRACT
    );

    try {
      await mongo().then(async (mongoose) => {
        let result = await convictionSchema.findOne({ wallet });

        if (result) {
          let userId = result.userId;

          let member = await interaction.guild.members.fetch({
            user: userId,
            force: true,
          });

          let pfp = `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`;
          let earnings = await shareContract.methods
            .bonusInfo(result.wallet, result.Nftholdings)
            .call();
          const muteEmbed = new EmbedBuilder()
            .setTitle(`**${interaction.user.username}  Holder Info**`)

            .addFields(
              { name: "User", value: `<@${result.userId}>` },
              { name: "Wallet", value: `${result.wallet}` },
              { name: "\u200B", value: "\u200B" },
              {
                name: "All Tokens",
                value: `${result.Nftholdings.join(",")}`,
                inline: true,
              },
              { name: "\u200B", value: "\u200B", inline: true },
              { name: "Total Earnings:", value: `${earnings} Ξ`, inline: true },
              { name: "\u200B", value: "\u200B" }
            )

            .setFooter({ text: "This is just a testing.." })
            .setTimestamp()

            .setColor("#E5451E")
            .setThumbnail(pfp);
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
