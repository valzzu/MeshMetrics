const mqtt = require("mqtt");
const logger = require("pino")({ level: "info" });
const config = require("../../config");
const { handleMessage } = require("./handlers");
const { loadProtobufs } = require("./protobuf");

/**
 * Initializes and starts the MQTT client.
 * @returns {Promise<void>}
 */
async function startMqttClient() {
  const { brokerUrl, username, password, clientId, topics } = config.mqtt;
  const root = await loadProtobufs();

  const client = mqtt.connect(brokerUrl, {
    username,
    password,
    clientId,
  });

  client.on("connect", () => {
    logger.info("MQTT client connected");
    topics.forEach((topic) => {
      client.subscribe(topic, (err) => {
        if (err) {
          logger.error(`Failed to subscribe to ${topic}:`, err.message);
        } else {
          logger.info(`Subscribed to ${topic}`);
        }
      });
    });
  });

  client.on("message", (topic, message) => {
    handleMessage(topic, message, root).catch((err) => {
      //logger.error(`Error handling MQTT message, skipping. `, err.message);
    });
  });

  client.on("error", (err) => {
    logger.error(`MQTT client error:`, err.message);
  });
}

module.exports = { startMqttClient };
