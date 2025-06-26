const axios = require("axios");
const logger = require("pino")();
const config = require("../../config");
const PositionUtil = require("./position_util");
const { decrypt } = require("./decrypt");
const schemas = require("../../schemas");
const BITFIELD_OK_TO_MQTT_MASK = 1 << 0;

/**
 * Converts hex ID to numeric ID.
 * @param {string} hexId - Hex ID with optional '!' prefix.
 * @returns {bigint} Numeric ID.
 */
function convertHexIdToNumericId(hexId) {
  return BigInt(`0x${hexId.replaceAll("!", "")}`);
}

/**
 * Handles incoming MQTT messages.
 * @param {string} topic - MQTT topic.
 * @param {Buffer} message - Message payload.
 * @param {protobuf.Root} root - Protobuf root.
 */
async function handleMessage(topic, message, root) {
  const ServiceEnvelope = root.lookupType("ServiceEnvelope");
  const Data = root.lookupType("Data");
  const Position = root.lookupType("Position");
  const User = root.lookupType("User");
  const Waypoint = root.lookupType("Waypoint");
  const NeighborInfo = root.lookupType("NeighborInfo");
  const Telemetry = root.lookupType("Telemetry");
  const RouteDiscovery = root.lookupType("RouteDiscovery");
  const MapReport = root.lookupType("MapReport");

  const envelope = ServiceEnvelope.decode(message);
  if (!envelope.packet) return;

  const isEncrypted = envelope.packet.encrypted?.length > 0;
  if (isEncrypted) {
    const decoded = decrypt(envelope.packet, Data);
    if (decoded) envelope.packet.decoded = decoded;
  }

  const portnum = envelope.packet?.decoded?.portnum;
  const bitfield = envelope.packet?.decoded?.bitfield;

    // Increment portnum count if portnum is valid
    if (portnum != null && envelope.packet.decoded) {
      try {
        await schemas.portnumCount.incrementCount(portnum);
      } catch (err) {
        logger.error(`Error incrementing portnum count for ${portnum}:`, err.message);
      }
    }
  const {
    allowedPortnums,
    dropPacketsNotOkToMqtt,
    dropPortnumsWithoutBitfield,
    logUnknownPortnums,
  } = config.mqtt.options;

  if (envelope.packet.decoded) {
    if (bitfield != null) {
      const isOkToMqtt = bitfield & BITFIELD_OK_TO_MQTT_MASK;
      if (dropPacketsNotOkToMqtt && !isOkToMqtt) return;
    } else if (dropPortnumsWithoutBitfield?.includes(portnum)) {
      return;
    }
  }

  if (allowedPortnums && !allowedPortnums.includes(portnum)) return;

  const fromStr = envelope.packet.from.toString(16);
  const toStr = envelope.packet.to.toString(16);
  const gatewayId = envelope.gatewayId
    ? convertHexIdToNumericId(envelope.gatewayId)
    : null;

  const commonFields = {
    to: toStr,
    from: fromStr,
    channel: envelope.packet.channel,
    packet_id: envelope.packet.id,
    channel_id: envelope.channelId,
    gateway_id: gatewayId,
    created_at: new Date(),
  };

  if (portnum === 1 && config.mqtt.options.collectTextMessages) {
    if (
      config.mqtt.options.ignoreDirectMessages &&
      envelope.packet.to !== 0xffffffff
    )
      return;
    const text = envelope.packet.decoded.payload.toString();
    try {
      const [sender, receiver] = await Promise.all([
        schemas.nodeinfo.findOne({ from: fromStr }),
        envelope.packet.to !== 0xffffffff
          ? schemas.nodeinfo.findOne({ from: toStr })
          : null,
      ]);

      await schemas.textMessage.create({
        ...commonFields,
        text,
        rx_time: envelope.packet.rxTime,
        rx_snr: envelope.packet.rxSnr,
        rx_rssi: envelope.packet.rxRssi,
        hop_limit: envelope.packet.hopLimit,
      });

      if (config.webhookUrl) {
        await axios.post(config.webhookUrl, {
          username: sender?.long_name || "Unknown",
          embeds: [
            {
              color: 0x00ffff,
              description:
                envelope.packet.to === 0xffffffff
                  ? text
                  : `Private message -> ${
                      receiver?.long_name || "Unknown User"
                    }`,
              footer: { text: envelope.channelId },
            },
          ],
        });
      }
    } catch (err) {
      logger.error(`Error processing TEXT_MESSAGE_APP:`, err.message);
    }
  } else if (portnum === 3) {
    const position = Position.decode(envelope.packet.decoded.payload);
    if (position.latitudeI && position.longitudeI) {
      let adjustedPosition = { ...position };
      if (
        bitfield == null &&
        config.mqtt.options.oldFirmwarePositionPrecision
      ) {
        adjustedPosition.latitudeI = PositionUtil.setPositionPrecision(
          position.latitudeI,
          config.mqtt.options.oldFirmwarePositionPrecision
        );
        adjustedPosition.longitudeI = PositionUtil.setPositionPrecision(
          position.longitudeI,
          config.mqtt.options.oldFirmwarePositionPrecision
        );
        adjustedPosition.precisionBits =
          config.mqtt.options.oldFirmwarePositionPrecision;
      }

      try {
        await schemas.nodeinfo.findOneAndUpdate(
          { from: fromStr },
          {
            latitude: adjustedPosition.latitudeI,
            longitude: adjustedPosition.longitudeI,
            altitude: adjustedPosition.altitude || null,
            position_updated_at: new Date(),
          },
          { upsert: true }
        );
      } catch (err) {
        logger.error(`Error updating node position:`, err.message);
      }

      if (config.mqtt.options.collectPositions) {
        try {
          await schemas.position.create({
            ...commonFields,
            latitude: adjustedPosition.latitudeI,
            longitude: adjustedPosition.longitudeI,
            altitude: adjustedPosition.altitude,
            precision_bits: adjustedPosition.precisionBits,
            time: adjustedPosition.time,
          });
        } catch (err) {
          logger.error(`Error saving position:`, err.message);
        }
      }
    }
  } else if (portnum === 4) {
    const user = User.decode(envelope.packet.decoded.payload);
    try {
      const existingNode = await schemas.nodeinfo.findOne({ from: fromStr });
      if (!existingNode && config.webhookUrl) {
        await axios.post(config.webhookUrl, {
          embeds: [
            {
              title: "New node discovered",
              description: `${fromStr} - ${user.longName} - ${user.shortName}`,
              color: 0x00ff00,
              footer: { text: envelope.channelId },
            },
          ],
        });
      }

      await schemas.nodeinfo.findOneAndUpdate(
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
          mqtt_updated_at: new Date(),
        },
        { upsert: true }
      );
    } catch (err) {
      logger.error(`Error processing NODEINFO_APP:`, err.message);
    }
  } else if (portnum === 8 && config.mqtt.options.collectWaypoints) {
    const waypoint = Waypoint.decode(envelope.packet.decoded.payload);
    try {
      await schemas.waypoint.create({
        ...commonFields,
        waypoint_id: waypoint.id,
        latitude: waypoint.latitudeI,
        longitude: waypoint.longitudeI,
        expire: waypoint.expire,
        locked_to: waypoint.lockedTo,
        name: waypoint.name,
        description: waypoint.description,
        icon: waypoint.icon,
      });
    } catch (err) {
      logger.error(`Error processing WAYPOINT_APP:`, err.message);
    }
  } else if (portnum === 71 && config.mqtt.options.collectNeighbourInfo) {
    const neighbourInfo = NeighborInfo.decode(envelope.packet.decoded.payload);
    try {
      await schemas.nodeinfo.findOneAndUpdate(
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

      if (config.mqtt.options.collectNeighbourInfo) {
        await schemas.neighbourInfo.create({
          from: fromStr,
          node_broadcast_interval_secs: neighbourInfo.nodeBroadcastIntervalSecs,
          neighbours: neighbourInfo.neighbors.map((n) => ({
            node_id: n.nodeId,
            snr: n.snr,
          })),
          created_at: new Date(),
        });
      }
    } catch (err) {
      logger.error(`Error processing NEIGHBORINFO_APP:`, err.message);
    }
  } else if (portnum === 67) {
    const telemetry = Telemetry.decode(envelope.packet.decoded.payload);
    const data = {};

    if (telemetry.deviceMetrics) {
      data.battery_level = telemetry.deviceMetrics.batteryLevel || null;
      data.voltage = telemetry.deviceMetrics.voltage || null;
      data.channel_utilization =
        telemetry.deviceMetrics.channelUtilization || null;
      data.air_util_tx = telemetry.deviceMetrics.airUtilTx || null;
      data.uptime_seconds = telemetry.deviceMetrics.uptimeSeconds || null;
    }

    if (telemetry.environmentMetrics) {
      data.temperature = telemetry.environmentMetrics.temperature || null;
      data.relative_humidity =
        telemetry.environmentMetrics.relativeHumidity || null;
      data.barometric_pressure =
        telemetry.environmentMetrics.barometricPressure || null;
      data.gas_resistance = telemetry.environmentMetrics.gasResistance || null;
      data.voltage = telemetry.environmentMetrics.voltage || data.voltage;
      data.current = telemetry.environmentMetrics.current || null;
      data.iaq = telemetry.environmentMetrics.iaq || null;
      data.wind_direction = telemetry.environmentMetrics.windDirection || null;
      data.wind_speed = telemetry.environmentMetrics.windSpeed || null;
      data.wind_gust = telemetry.environmentMetrics.windGust || null;
      data.wind_lull = telemetry.environmentMetrics.windLull || null;
    }

    if (telemetry.powerMetrics) {
      data.voltage_ch1 = telemetry.powerMetrics.ch1Voltage || null;
      data.current_ch1 = telemetry.powerMetrics.ch1Current || null;
      data.voltage_ch2 = telemetry.powerMetrics.ch2Voltage || null;
      data.current_ch2 = telemetry.powerMetrics.ch2Current || null;
      data.voltage_ch3 = telemetry.powerMetrics.ch3Voltage || null;
      data.current_ch3 = telemetry.powerMetrics.ch3Current || null;
    }

    if (Object.keys(data).length > 0) {
      try {
        await schemas.telemetry.findOneAndUpdate(
          { from: fromStr },
          { from: fromStr, ...data, updated_at: new Date() },
          { upsert: true }
        );
      } catch (err) {
        logger.error(`Error processing TELEMETRY_APP:`, err.message);
      }
    }
  } else if (portnum === 70) {
    const routeDiscovery = RouteDiscovery.decode(
      envelope.packet.decoded.payload
    );
    try {
      await schemas.traceroute.create({
        ...commonFields,
        want_response: envelope.packet.decoded.wantResponse,
        route: routeDiscovery.route,
        snr_towards: routeDiscovery.snrTowards,
        route_back: routeDiscovery.routeBack,
        snr_back: routeDiscovery.snrBack,
      });
    } catch (err) {
      logger.error(`Error processing TRACEROUTE_APP:`, err.message);
    }
  } else if (portnum === 73 && config.mqtt.options.collectMapReports) {
    const mapReport = MapReport.decode(envelope.packet.decoded.payload);
    try {
      await schemas.nodeinfo.findOneAndUpdate(
        { from: fromStr },
        {
          long_name: mapReport.longName,
          short_name: mapReport.shortName,
          hardware_model: mapReport.hwModel,
          role: mapReport.role,
          latitude: mapReport.latitudeI,
          longitude: mapReport.latitudeI,
          altitude: mapReport.altitude || null,
          firmware_version: mapReport.firmwareVersion,
          region: mapReport.region,
          modem_preset: mapReport.modemPreset,
          has_default_channel: mapReport.hasDefaultChannel,
          position_precision: mapReport.positionPrecision,
          num_online_local_nodes: mapReport.numOnlineLocalNodes,
          position_updated_at: new Date(),
          mqtt_updated_at: new Date(),
        },
        { upsert: true }
      );

      if (config.mqtt.options.collectMapReports) {
        await schemas.mapReport.create({
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
          longitude: mapReport.latitudeI,
          altitude: mapReport.altitude,
          position_precision: mapReport.positionPrecision,
          num_online_local_nodes: mapReport.numOnlineLocalNodes,
          created_at: new Date(),
        });
      }
    } catch (err) {
      logger.error(`Error processing MAP_REPORT_APP:`, err.message);
    }
  } else if (
    logUnknownPortnums &&
    ![0, 1, 5, 34, 65, 66, 72, 257].includes(portnum) &&
    portnum <= 511
  ) {
    logger.warn(`Unknown portnum: ${portnum}`, envelope);
  }
}

module.exports = { handleMessage };
