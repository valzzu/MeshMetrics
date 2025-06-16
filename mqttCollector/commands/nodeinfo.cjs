const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nodeinfo")
    .setDescription("Get information about a node")
    .addStringOption((option) =>
      option
        .setName("node_id")
        .setDescription("The node ID (hex)")
        .setRequired(true)
    ),
  async execute(interaction, { nodeinfoSchema }) {
    await interaction.deferReply();
    const nodeId = interaction.options.getString("node_id");

    try {
      const node = await nodeinfoSchema.findOne({ from: nodeId });
      if (!node) {
        return interaction.editReply(`No node found with ID ${nodeId}`);
      }

      const embed = {
        title: `Node Info: ${node.long_name || "Unknown"}`,
        fields: [
          { name: "Node ID", value: node.from, inline: true },
          { name: "Short Name", value: node.short_name || "N/A", inline: true },
          {
            name: "Hardware Model",
            value: node.hardware_model || "N/A",
            inline: true,
          },
          { name: "Role", value: node.role || "N/A", inline: true },
          {
            name: "Latitude",
            value: node.latitude ? node.latitude.toString() : "N/A",
            inline: true,
          },
          {
            name: "Longitude",
            value: node.longitude ? node.longitude.toString() : "N/A",
            inline: true,
          },
          {
            name: "MQTT Status",
            value: node.mqtt_connection_state || "Unknown",
            inline: true,
          },
        ],
        color: 0x00ff00,
      };

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching node info:", error);
      await interaction.editReply("Error fetching node information.");
    }
  },
};
