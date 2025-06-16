const mqtt = require("mqtt");
const axios = require("axios");
const dotenv = require("dotenv");
const { connect } = require("mongoose");
const protobufjs = require("protobufjs");
const crypto = require("crypto");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");

dotenv.config();

// Schemas
const nodeinfoSchema = require("./schema/nodeinfo.cjs");
const positionSchema = require("./schema/position.cjs");
const telemetrySchema = require("./schema/telemetry.cjs");
const textMessageSchema = require("./schema/textMessage.cjs");
const waypointSchema = require("./schema/waypoint.cjs");
const neighbourInfoSchema = require("./schema/neighbourInfo.cjs");
const mapReportSchema = require("./schema/mapReport.cjs");
const tracerouteSchema = require("./schema/traceroute.cjs");

// Configuration
const config = {
  mqtt: {
    topics: ["msh/EU_868/FI/#", "msh/Finland/#"],
    url: process.env.MQTT_URL,
    user: process.env.MQTT_USER,
    pass: process.env.MQTT_PASS,
    clientId: "mqtt_to_discord_bot",
  },
  discord: {
    token: process.env.DISCORD_TOKEN,
    prefix: "!mesa",
  },
  logging: {
    knownPacketTypes: true,
    unknownPacketTypes: false,
    collectServiceEnvelopes: false,
    collectPositions: true,
    collectTextMessages: true,
    collectWaypoints: true,
    collectNeighbourInfo: true,
    collectMapReports: true,
    collectTraceroutes: true,
  },
  decryptionKeys: ["1PG7OiApB1nwvP+rz05pAQ=="],
  webhookUrl: process.env.WEBHOOK_URL2,
  mongoUrl: process.env.MONGO_URL,
};

// Protobuf Setup
const root = new protobufjs.Root();
root.resolvePath = (origin, target) => path.join(__dirname, "protobufs", target);
root.loadSync("meshtastic/mqtt.proto");
const Data = root.lookupType("Data");
const ServiceEnvelope = root.lookupType("ServiceEnvelope");
const MapReport = root.lookupType("MapReport");
const NeighborInfo = root.lookupType("NeighborInfo");
const Position = root.lookupType("Position");
const RouteDiscovery = root.lookupType("RouteDiscovery");
const Telemetry = root.lookupType("Telemetry");
const User = root.lookupType("User");
const Waypoint = root.lookupType("Waypoint");

// MongoDB Connection
connect(config.mongoUrl, {})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// MQTT Client
const mqttClient = mqtt.connect(config.mqtt.url, {
  username: config.mqtt.user,
  password: config.mqtt.pass,
  clientId: config.mqtt.clientId,
});

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  for (const topic of config.mqtt.topics) {
    mqttClient.subscribe(topic, (err) => {
      if (err) {
        console.error(`Failed to subscribe to ${topic}:`, err);
      } else {
        console.log(`Subscribed to ${topic}`);
      }
    });
  }
});

mqttClient.on("error", (err) => console.error("MQTT error:", err));

// Discord Bot Setup
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
discordClient.commands = new Collection();
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  discordClient.commands.set(command.data.name, command);
}

discordClient.once("ready", () => {
  console.log(`Discord bot logged in as ${discordClient.user.tag}`);
});

discordClient.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = discordClient.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, { nodeinfoSchema, positionSchema });
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    await interaction.reply({
      content: "There was an error executing this command!",
      ephemeral: true,
    });
  }
});

// Utility Functions
function createNonce(packetId, fromNode) {
  const packetId64 = BigInt(packetId);
  const blockCounter = 0;
  const buf = Buffer.alloc(16);
  buf.writeBigUInt64LE(packetId64, 0);
  buf.writeUInt32LE(fromNode, 8);
  buf.writeUInt32LE(blockCounter, 12);
  return buf;
}

function decrypt(packet) {
  for (const decryptionKey of config.decryptionKeys) {
    try {
      const key = Buffer.from(decryptionKey, "base64");
      const nonceBuffer = createNonce(packet.id, packet.from);
      const algorithm =
        key.length === 16
          ? "aes-128-ctr"
          : key.length === 32
          ? "aes-256-ctr"
          : null;
      if (!algorithm) {
        console.error(`Invalid key length: ${key.length}`);
        continue;
      }
      const decipher = crypto.createDecipheriv(algorithm, key, nonceBuffer);
      const decryptedBuffer = Buffer.concat([
        decipher.update(packet.encrypted),
        decipher.final(),
      ]);
      return Data.decode(decryptedBuffer);
    } catch (e) {
      console.error("Decryption failed with key:", decryptionKey, e);
    }
  }
  return null;
}

function hexToBigInt(hex) {
  return BigInt("0x" + hex.replaceAll("!", ""));
}

// MQTT Message Handler
mqttClient.on("message", async (topic, message) => {
  try {
    if (topic.includes("/stat/!")) {
      const nodeIdHex = topic.split("/").pop();
      const mqttConnectionState = message.toString();
      const from = hexToBigInt(nodeIdHex).toString();
      await nodeinfoSchema.findOneAndUpdate(
        { from },
        {
          mqtt_connection_state: mqttConnectionState,
          mqtt_updated_at: new Date(),
        },
        { upsert: true }
      );
      console.log(`Node ${nodeIdHex} status: ${mqttConnectionState}`);
      return;
    }

    let envelope;
    try {
      envelope = ServiceEnvelope.decode(message);
    } catch (e) {
      console.error("Failed to decode ServiceEnvelope:", e);
      return;
    }
    if (!envelope.packet) return;

    if (config.logging.collectServiceEnvelopes) {
      console.log("Service envelope:", envelope.packet);
    }

    const isEncrypted = envelope.packet.encrypted?.length > 0;
    if (isEncrypted) {
      const decoded = decrypt(envelope.packet);
      if (decoded) envelope.packet.decoded = decoded;
    }

    const portnum = envelope.packet?.decoded?.portnum;
    if (!portnum) return;

    const fromStr = envelope.packet.from.toString(16);
    const toStr = envelope.packet.to.toString(16);

    if (portnum === 1 && config.logging.collectTextMessages) {
      const text = envelope.packet.decoded.payload.toString();
      if (config.logging.knownPacketTypes) {
        console.log("TEXT_MESSAGE_APP", { to: toStr, from: fromStr, text });
      }

      const sender = await nodeinfoSchema.findOne({ from: fromStr });
      const receiver =
        envelope.packet.to !== 0xffffffff
          ? await nodeinfoSchema.findOne({ from: toStr })
          : null;

      await textMessageSchema.create({
        to: toStr,
        from: fromStr,
        channel: envelope.packet.channel,
        packet_id: envelope.packet.id,
        channel_id: envelope.channelId,
        gateway_id: envelope.gatewayId ? hexToBigInt(envelope.gatewayId) : null,
        text,
        rx_time: envelope.packet.rxTime,
        rx_snr: envelope.packet.rxSnr,
        rx_rssi: envelope.packet.rxRssi,
        hop_limit: envelope.packet.hopLimit,
      });

      const embed = {
        color: 0x00ffff,
        description:
          envelope.packet.to === 0xffffffff
            ? text
            : `Private message -> ${receiver?.long_name || "Unknown User"}`,
      };
      await axios
        .post(config.webhookUrl, {
          username: sender?.long_name || "Unknown",
          embeds: [embed],
        })
        .catch((err) => console.error("Failed to send to Discord:", err));
    } else if (portnum === 3 && config.logging.collectPositions) {
      const position = Position.decode(envelope.packet.decoded.payload);
      if (config.logging.knownPacketTypes) {
        console.log("POSITION_APP", { from: fromStr, position });
      }

      if (position.latitudeI != null && position.longitudeI != null) {
        await nodeinfoSchema.findOneAndUpdate(
          { from: fromStr },
          {
            latitude: position.latitudeI,
            longitude: position.longitudeI,
            altitude: position.altitude || null,
            position_updated_at: new Date(),
          },
          { upsert: true }
        );
      }

      await positionSchema.create({
        to: toStr,
        from: fromStr,
        channel: envelope.packet.channel,
        packet_id: envelope.packet.id,
        channel_id: envelope.channelId,
        gateway_id: envelope.gatewayId ? hexToBigInt(envelope.gatewayId) : null,
        latitude: position.latitudeI,
        longitude: position.longitudeI,
        altitude: position.altitude,
        precision_bits: position.precisionBits,
        time: position.time,
      });
    } else if (portnum === 4) {
      const user = User.decode(envelope.packet.decoded.payload);
      if (config.logging.knownPacketTypes) {
        console.log("NODEINFO_APP", { from: fromStr, user });
      }

      const existingNode = await nodeinfoSchema.findOne({ from: fromStr });
      if (!existingNode) {
        await axios
          .post(config.webhookUrl, {
            embeds: [
              {
                title: "New node discovered",
                description: `${fromStr} - ${user.longName} - ${user.shortName}`,
                color: 0x00ff00,
              },
            ],
          })
          .catch((err) => console.error("Failed to send to Discord:", err));
      }

      await nodeinfoSchema.findOneAndUpdate(
        { from: fromStr },
        {
          id: user.id,
          from: fromStr,
          long_name: user.longName,
          short_name: user.shortName,
          hardware_model: user.hwModel,
          role: user.role,
          hop_start: envelope.packet.hopStart,
          hops_away: envelope.packet.hopsAway,
          timestamp: envelope.packet.timestamp,
        },
        { upsert: true, new: true }
      );
    } else if (portnum === 8 && config.logging.collectWaypoints) {
      const waypoint = Waypoint.decode(envelope.packet.decoded.payload);
      if (config.logging.knownPacketTypes) {
        console.log("WAYPOINT_APP", { to: toStr, from: fromStr, waypoint });
      }

      await waypointSchema.create({
        to: toStr,
        from: fromStr,
        waypoint_id: waypoint.id,
        latitude: waypoint.latitudeI,
        longitude: waypoint.longitudeI,
        expire: waypoint.expire,
        locked_to: waypoint.lockedTo,
        name: waypoint.name,
        description: waypoint.description,
        icon: waypoint.icon,
        channel: envelope.packet.channel,
        packet_id: envelope.packet.id,
        channel_id: envelope.channelId,
        gateway_id: envelope.gatewayId ? hexToBigInt(envelope.gatewayId) : null,
      });
    } else if (portnum === 71 && config.logging.collectNeighbourInfo) {
      const neighbourInfo = NeighborInfo.decode(
        envelope.packet.decoded.payload
      );
      if (config.logging.knownPacketTypes) {
        console.log("NEIGHBORINFO_APP", {
          from: fromStr,
          neighbour_info: neighbourInfo,
        });
      }

      await nodeinfoSchema.findOneAndUpdate(
        { from: fromStr },
        {
          neighbours_updated_at: new Date(),
          neighbour_broadcast_interval_secs:
            neighbourInfo.nodeBroadcastIntervalSecs,
          neighbours: neighbourInfo.neighbors.map((n) => ({
            node_id: n.nodeId,
            snr: n.snr,
          })),
        },
        { upsert: true }
      );

      await neighbourInfoSchema.create({
        from: fromStr,
        node_broadcast_interval_secs: neighbourInfo.nodeBroadcastIntervalSecs,
        neighbours: neighbourInfo.neighbors.map((n) => ({
          node_id: n.nodeId,
          snr: n.snr,
        })),
      });
    } else if (portnum === 67) {
      const telemetry = Telemetry.decode(envelope.packet.decoded.payload);
      if (config.logging.knownPacketTypes) {
        console.log("TELEMETRY_APP", { from: fromStr, telemetry });
      }

      const data = {};
      if (telemetry.deviceMetrics) {
        data.battery_level = telemetry.deviceMetrics.batteryLevel;
        data.voltage = telemetry.deviceMetrics.voltage;
        data.channel_utilization = telemetry.deviceMetrics.channelUtilization;
        data.air_util_tx = telemetry.deviceMetrics.airUtilTx;
        data.uptime_seconds = telemetry.deviceMetrics.uptimeSeconds;
      }
      if (telemetry.environmentMetrics) {
        data.temperature = telemetry.environmentMetrics.temperature;
        data.relative_humidity = telemetry.environmentMetrics.relativeHumidity;
        data.barometric_pressure =
          telemetry.environmentMetrics.barometricPressure;
        data.gas_resistance = telemetry.environmentMetrics.gasResistance;
        data.voltage = telemetry.environmentMetrics.voltage || data.voltage;
        data.current = telemetry.environmentMetrics.current;
        data.iaq = telemetry.environmentMetrics.iaq;
        data.wind_direction = telemetry.environmentMetrics.windDirection;
        data.wind_speed = telemetry.environmentMetrics.windSpeed;
      }
      if (telemetry.powerMetrics) {
        data.ch1_voltage = telemetry.powerMetrics.ch1Voltage;
        data.ch1_current = telemetry.powerMetrics.ch1Current;
        data.ch2_voltage = telemetry.powerMetrics.ch2Voltage;
        data.ch2_current = telemetry.powerMetrics.ch2Current;
        data.ch3_voltage = telemetry.powerMetrics.ch3Voltage;
        data.ch3_current = telemetry.powerMetrics.ch3Current;
      }

      await telemetrySchema.findOneAndUpdate(
        { from: fromStr },
        { from: fromStr, ...data },
        { upsert: true, new: true }
      );
    } else if (portnum === 70 && config.logging.collectTraceroutes) {
      const routeDiscovery = RouteDiscovery.decode(
        envelope.packet.decoded.payload
      );
      if (config.logging.knownPacketTypes) {
        console.log("TRACEROUTE_APP", {
          to: toStr,
          from: fromStr,
          want_response: envelope.packet.decoded.wantResponse,
          route_discovery: routeDiscovery,
        });
      }

      await tracerouteSchema.create({
        to: toStr,
        from: fromStr,
        want_response: envelope.packet.decoded.wantResponse,
        route: routeDiscovery.route,
        snr_towards: routeDiscovery.snrTowards,
        route_back: routeDiscovery.routeBack,
        snr_back: routeDiscovery.snrBack,
        channel: envelope.packet.channel,
        packet_id: envelope.packet.id,
        channel_id: envelope.channelId,
        gateway_id: envelope.gatewayId ? hexToBigInt(envelope.gatewayId) : null,
      });
    } else if (portnum === 73 && config.logging.collectMapReports) {
      const mapReport = MapReport.decode(envelope.packet.decoded.payload);
      const fromNum = envelope.packet.from;
      if (
        (fromNum === 3774324368 &&
          mapReport.firmwareVersion === "2.3.0.5f47ca1") ||
        (fromNum === 3663859228 &&
          mapReport.firmwareVersion === "2.3.1.4fa7f5a") ||
        (fromNum === 1153561478 &&
          mapReport.firmwareVersion === "2.3.1.4fa7f5a") ||
        (fromNum === 3664091724 &&
          mapReport.firmwareVersion === "2.3.0.5f47ca1")
      ) {
        return;
      }

      if (config.logging.knownPacketTypes) {
        console.log("MAP_REPORT_APP", { from: fromStr, map_report: mapReport });
      }

      await nodeinfoSchema.findOneAndUpdate(
        { from: fromStr },
        {
          long_name: mapReport.longName,
          short_name: mapReport.shortName,
          hardware_model: mapReport.hwModel,
          role: mapReport.role,
          latitude: mapReport.latitudeI,
          longitude: mapReport.longitudeI,
          altitude: mapReport.altitude || null,
          firmware_version: mapReport.firmwareVersion,
          region: mapReport.region,
          modem_preset: mapReport.modemPreset,
          has_default_channel: mapReport.hasDefaultChannel,
          position_precision: mapReport.positionPrecision,
          num_online_local_nodes: mapReport.numOnlineLocalNodes,
          position_updated_at: new Date(),
        },
        { upsert: true }
      );

      await mapReportSchema.create({
        from: fromStr,
        long_name: mapReport.longName,
        short_name: mapReport.shortName,
        role: mapReport.role,
        hardware_model: mapReport.hwModel,
        firmware_version: mapReport.firmwareVersion,
        region: mapReport.region,
        modem_preset: mapReport.modemPreset,
        has_default_channel: mapReport.hasDefaultChannel,
        latitude: mapReport.latitudeI,
        longitude: mapReport.longitudeI,
        altitude: mapReport.altitude,
        position_precision: mapReport.positionPrecision,
        num_online_local_nodes: mapReport.numOnlineLocalNodes,
      });
    } else if (config.logging.unknownPacketTypes) {
      if (
        portnum === undefined ||
        portnum === 0 ||
        portnum === 1 ||
        portnum === 5 ||
        portnum === 34 ||
        portnum === 65 ||
        portnum === 66 ||
        portnum === 72 ||
        portnum === 257 ||
        portnum > 511
      ) {
        return;
      }
      console.log("Unknown portnum:", portnum, envelope);
    }
  } catch (e) {
    console.error("Error processing MQTT message:", e);
  }
});

// Login Discord Bot
discordClient.login(config.discord.token);

console.log("Bot started");
