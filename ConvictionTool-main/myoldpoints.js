const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const { Alchemy, Network } = require("alchemy-sdk");
const config = {
  apiKey: "YOUR_API_KEY",
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(config);
require("dotenv").config();

const fs = require("fs");

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

    const fromAddress = wallet;
    let totalBlueChips = 0;
    let oneMoreNeeded = true;
    let tx = [];
    let repeats = 1;
    let buyPageKey;
    let sellPageKey;
    let order = "desc";
    const finishStuff = async () => {
      while (oneMoreNeeded && repeats < 11) {
        if ((repeats) => 5) {
          order = "asc";
        }
        console.log(`Getting first ${1000 * repeats}`);
        let sellOptions = {
          fromBlock: "0x0",
          fromAddress: fromAddress,
          excludeZeroValue: false,
          category: ["erc721"],
          withMetadata: true,
          order: order,
        };
        if (sellPageKey) {
          sellOptions.pageKey = sellPageKey;
        }
        let sell = await alchemy.core.getAssetTransfers(sellOptions);
        let buyOptions = {
          fromBlock: "0x0",
          toAddress: fromAddress,
          excludeZeroValue: false,
          category: ["erc721"],
          withMetadata: true,
          order: order,
        };
        if (buyPageKey) {
          buyOptions.pageKey = buyPageKey;
        }
        let buys = await alchemy.core.getAssetTransfers(buyOptions);
        oneMoreNeeded = buys.pageKey != undefined || sell.pageKey != undefined;
        buys = buys.transfers;
        sell = sell.transfers;
        let potentialHoldings = [];
        for (items of buys) {
          for (let contract of data) {
            contract = contract.split(":")[1].trim().toLowerCase();
            if (items.rawContract.address == contract) {
              potentialHoldings.push(items);
            }
          }
        }

        for (let potential of potentialHoldings) {
          let notFound = false;
          for (let items of sell) {
            const boolEan =
              items.rawContract.address == potential.rawContract.address &&
              items.tokenId == potential.tokenId;
            if (boolEan) {
              notFound = true;
              break;
            }
          }
          if (!notFound) {
            try {
              const name = data
                .find(
                  (element) =>
                    element.split(":")[1].trim().toLowerCase() ==
                    potential.rawContract.address
                )
                .split(":")[0];
              const timeStamp = potential.metadata.blockTimestamp;
              var unixTimestamp = Math.floor(
                new Date(timeStamp).getTime() / 1000
              );
              let now = Math.floor(Date.now() / 1000);
              let diff = now - unixTimestamp;
              let days = Math.floor(diff / 86400);
              totalBlueChips += 1;

              const contractAddress = potential.rawContract.address;
              const tokenId = potential.tokenId; // Not sure in which format

              if (!tx.find((element) => element.name == name)) {
                tx.push({ name: name, points: days, tokenIds: [tokenId] });
              } else {
                let result = tx.find((element) => {
                  let elementz = element.tokenIds.find(
                    (kelement) => kelement == tokenId
                  );
                  if (elementz) {
                    return true;
                  }
                  return false;
                });
                if (!result) {
                  tx.find((element) => element.name == name).points += days;
                  tx.find((element) => element.name == name).tokenIds.push(
                    tokenId
                  );
                }
              }
            } catch {}
          }
        }
        repeats += 1;
      }
      tx.sort((a, b) => b.points - a.points);
      let emb = new EmbedBuilder()
        .setTitle("Your Points")
        .setDescription(
          `Here are your points for holding blue chip NFTs for wallet\n**${truncate(
            fromAddress,
            8
          )}**`
        );

      let generaltx = "";
      for (let items of tx) {
        try {
          generaltx += `**${items.name}** - ${items.points} points\n`;
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
