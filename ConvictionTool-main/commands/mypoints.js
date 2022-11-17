const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mypoints")
    .setDescription("gets points of user")
    .addStringOption((option) =>
      option
        .setName("wallet")
        .setDescription("Enter wallet address")
        .setRequired(true)
        .setMinLength(42)
        .setMaxLength(42)
    ),
  async execute(interaction, wallet, data) {
    await interaction.deferReply({ ephemeral: true });
    if (interaction.user.bot) return;
    const truncate = (input, len) =>
      input.length > len ? `${input.substring(0, len)}...` : input;

    const fromAddress = wallet.toLowerCase();

    const finishStuff = async () => {
      let fullData = [];
      for (let contractAddress of data) {
        console.log("Entering contract: " + contractAddress);
        contractAddress = contractAddress.split(":")[1].toLowerCase().trim();
        var config = {
          method: "post",
          url: `https://api.etherscan.io/api?module=account&action=tokennfttx&contractaddress=${contractAddress}&address=${fromAddress}&startblock=0&sort=asc&apikey=${process.env.ETHERSCAN_API_KEY}`,
          headers: {},
        };
        let response = await axios(config)
          .then(function (response) {
            if (response.data.message == "No transactions found") {
              return null;
            }

            let buys = response.data.result.filter((e) => {
              return e.to.toLowerCase() == fromAddress;
            });

            let sells = response.data.result.filter((e) => {
              return e.from.toLowerCase() == fromAddress;
            });
            let notSold = buys.filter((e) => {
              return !sells.some((e2) => e2.tokenID == e.tokenID);
            });
            console.log(notSold);
            if (notSold.length == 0) return null;
            const doc = notSold.map((e) => {
              return {
                timestamp: Math.floor(
                  (Math.floor(Date.now() / 1000) - parseInt(e.timeStamp)) /
                    3600 /
                    24
                ),
                tokenName: e.tokenName,
              };
            });
            let tokenName = doc[0].tokenName;
            let totalPoints = doc.reduce((a, b) => a + b.timestamp, 0);
            let returnObject = {
              totalPoints: totalPoints,
              tokenName: tokenName,
            };
            return returnObject;
          })
          .catch(function (error) {
            console.log(error);
          });
        if (response != null) {
          fullData.push(response);
        }
      }
      let totalBlueChips = fullData ? fullData.length : 0;
      let emb = new EmbedBuilder()
        .setTitle("Your Points")
        .setDescription(
          `Here are your points for holding blue chip NFTs for wallet\n**${truncate(
            fromAddress,
            8
          )}**`
        );

      let generaltx = "";
      for (let items of fullData) {
        try {
          generaltx += `**${items.tokenName}** - ${items.totalPoints} points\n`;
        } catch {}
      }
      try {
        emb.setDescription(generaltx);
      } catch {}

      if (totalBlueChips == 0) {
        emb.setDescription("You don't have any blue chip NFTs");
      }
      emb.setColor(process.env.color_hex);
      await interaction.editReply({ embeds: [emb] });
    };
    await finishStuff();

    // Print contract address and tokenId for each NFT (ERC721 or ERC1155):
  },
};
