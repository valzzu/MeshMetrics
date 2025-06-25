const { connect } = require("mongoose");
const logger = require("pino")({ level: "info" });
const config = require("./config");
const app = require("./app");
const { startMqttClient } = require("./utils/mqtt/client");
const { startPurge } = require("./utils/mqtt/purge");

async function startServer() {
  try {
    connect(config.mongoUrl)
      .then(() => logger.info("Connected to Database!"))
      .catch((err) =>
        logger.error("Failed to connect to database:", err.message)
      );

    await startMqttClient();
    startPurge();

    app.listen(config.port, () => {
      logger.info(`Backend running at http://localhost:${config.port}`);
    });
  } catch (err) {
    logger.error("Failed to start:", err.message);
    process.exit(1);
  }
}

startServer();
