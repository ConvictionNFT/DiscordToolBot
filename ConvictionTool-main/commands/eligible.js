const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
require("dotenv").config();
const mongo = require("../mongo");
const convictionSchema = require("../schemas/convictionSchema");
const serverSchema = require("../schemas/serverSchema");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eligible")
    .setDescription("Checks if user is eligible to claim")
    .addStringOption((option) =>
      option
        .setName("wallet")
        .setDescription("Enter wallet address")
        .setRequired(true)
        .setMinLength(42)
        .setMaxLength(42)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (interaction.user.bot) return;

    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    try {
      await mongo().then(async (mongoose) => {
        let result = await serverSchema.findOne({ guildId });

        if (result) {
          const userResult = await convictionSchema.findOne({ userId });

          if (userResult) {
            const leafNodes = result.snapshotWallets.map((addr) =>
              keccak256(addr)
            );
            const merkleTree = new MerkleTree(leafNodes, keccak256, {
              sortPairs: true,
            });
            const claimingAddress = keccak256();
            if (
              merkleTree.verify(
                result.currentMerkle,
                claimingAddress,
                result.currentMerkle
              )
            ) {
              const muteEmbed = new EmbedBuilder()
                .setTitle(`**This wallet is eligible to claim**`)
                .setDescription(
                  `Last snapshot was taken on ${result?.updatedAt || "N/A"}`
                )

                .setTimestamp()

                .setColor("#E5451E");

              await interaction.editReply({
                embeds: [muteEmbed],
                ephemeral: true,
              });
            } else {
              const muteEmbed = new EmbedBuilder()
                .setTitle(`**This wallet is not eligible for claiming**`)
                .setDescription(
                  `Last snapshot was taken on ${result?.updatedAt || "N/A"}`
                )

                .setTimestamp()

                .setColor("#E5451E");

              await interaction.editReply({
                embeds: [muteEmbed],
                ephemeral: true,
              });
            }
          } else {
            const muteEmbed = new EmbedBuilder().setTitle(
              "You do not have registered wallet ...."
            );
            await interaction.editReply({
              embeds: [muteEmbed],
              ephemeral: true,
            });
          }
        } else {
          const muteEmbed = new EmbedBuilder().setTitle(
            "This server did not set the config yet..."
          );
          await interaction.editReply({ embeds: [muteEmbed], ephemeral: true });
        }

        mongoose.connection.close();
      });
    } catch (error) {}
  },
};
