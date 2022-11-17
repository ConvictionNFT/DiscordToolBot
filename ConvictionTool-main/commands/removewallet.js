const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
require("dotenv").config();
const convictionSchema = require("../schemas/convictionSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removewallet")
    .setDescription("Remove wallet from sysstem")
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

    let checker = await convictionSchema.findOne({
      wallet,
    });

    if (checker && checker.userId == interaction.user.id) {
      const removed = generalschema.findOneAndDelete({
        wallet,
      });

      if (removed) {
        await interaction.followUp({
          content: "Wallet removed",
        });
      } else {
        await interaction.followUp({
          content: "Error removing wallet",
        });
      }
    } else {
      await interaction.followUp({
        content: "Wallet not registered to you",
      });
    }
  },
};
