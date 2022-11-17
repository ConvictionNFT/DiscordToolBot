const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const mainAbi = require("../abis/maincontract.json");
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
require("dotenv").config();
const mongo = require("../mongo");
const web3 = createAlchemyWeb3(process.env.API_URL);
const fs = require("fs");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const serverSchema = require("../schemas/serverSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("snapshot")
    .setDescription("Gets wallets")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction, wallet) {
    await interaction.deferReply({
      content: "Snapshot is being taken ...",
      ephemeral: true,
    });
    if (interaction.user.bot) return;
    let wallets = [];

    const mainContract = new web3.eth.Contract(
      mainAbi,
      process.env.MAIN_CONTRACT
    );
    let randomNum = Math.floor(Math.random() * 100) + 1;
    let rank5 = 0;
    let rank4 = 0;
    let rank3 = 0;
    let rank2 = 0;
    let rank1 = 0;

    const supply = await mainContract.methods.totalSupply().call();
    fs.writeFileSync(`snapshot-${randomNum}.txt`, "");

    for (let i = 0; i < parseInt(supply); i++) {
      const point = parseInt(
        await mainContract.methods.getConvictionForToken(i).call()
      );

      if (point >= 150) {
        rank1 += 1;
      } else if (150 > point && point >= 120) {
        rank2 += 1;
      } else if (120 > point && point >= 90) {
        rank3 += 1;
      } else if (90 > point && point >= 60) {
        rank4 += 1;
      } else if (60 > point && point >= 30) {
        rank5 += 1;
      }

      let holder = await mainContract.methods.ownerOf(i).call();

      holder = holder.toLowerCase();
      const content = `${holder}\n`;
      if (!wallets.includes(holder)) {
        wallets.push(holder);
        fs.appendFileSync(`snapshot-${randomNum}.txt`, content);
      }
    }

    const leafNodes = wallets.map((addr) => keccak256(addr));
    const merkleTree = new MerkleTree(leafNodes, keccak256, {
      sortPairs: true,
    });

    const currentMerkle = merkleTree.getHexRoot();
    await interaction.editReply({ files: [`snapshot-${randomNum}.txt`] });
    await interaction.followUp(
      `**Root Hash: ${currentMerkle}\nRank 1 Eligible: ${rank1}\nRank 2 Eligible: ${
        rank1 + rank2
      }\nRank 3 Eligible: ${rank1 + rank2 + rank3}\nRank 4 Eligible: ${
        rank1 + rank2 + rank3 + rank4
      }\nRank 5 Eligible: ${rank5 + rank4 + rank3 + rank2 + rank1}**`
    );
    setTimeout(() => {
      fs.unlink(`snapshot-${randomNum}.txt`, (err) => {
        if (err) {
          throw err;
        }
      });
    }, 5000);

    const guildId = interaction.guild.id;
    console.log(wallets);
    await mongo().then(async (mongoose) => {
      const result = await serverSchema.findOneAndUpdate(
        { guildId },
        {
          guildId,
          currentMerkle,
          snapshotWallets: wallets,
          contractAddress: process.env.SHARE_CONTRACT,
        },
        {
          upsert: true,
          new: true,
        }
      );
    });
  },
};
