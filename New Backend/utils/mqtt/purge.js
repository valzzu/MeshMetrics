const logger = require("pino")();
const config = require("../../config");
const schemas = require("../../schemas");

/**
 * Starts periodic purging of outdated data.
 */
function startPurge() {
  const {
    intervalSeconds,
    nodesUnheardForSeconds,
    deviceMetricsAfterSeconds,
    environmentMetricsAfterSeconds,
    mapReportsAfterSeconds,
    neighbourInfosAfterSeconds,
    powerMetricsAfterSeconds,
    positionsAfterSeconds,
    textMessagesAfterSeconds,
    traceroutesAfterSeconds,
    waypointsAfterSeconds,
    forgetOutdatedNodePositionsAfterSeconds,
  } = config.mqtt.options.purge;

  if (!intervalSeconds) return;

  setInterval(async () => {
    logger.info("Purge interval triggered");
    await Promise.all([
      nodesUnheardForSeconds && purgeUnheardNodes(nodesUnheardForSeconds),
      deviceMetricsAfterSeconds &&
        purgeOldDeviceMetrics(deviceMetricsAfterSeconds),
      environmentMetricsAfterSeconds &&
        purgeOldEnvironmentMetrics(environmentMetricsAfterSeconds),
      mapReportsAfterSeconds && purgeOldMapReports(mapReportsAfterSeconds),
      neighbourInfosAfterSeconds &&
        purgeOldNeighbourInfos(neighbourInfosAfterSeconds),
      powerMetricsAfterSeconds &&
        purgeOldPowerMetrics(powerMetricsAfterSeconds),
      positionsAfterSeconds && purgeOldPositions(positionsAfterSeconds),
      textMessagesAfterSeconds &&
        purgeOldTextMessages(textMessagesAfterSeconds),
      traceroutesAfterSeconds && purgeOldTraceroutes(traceroutesAfterSeconds),
      waypointsAfterSeconds && purgeOldWaypoints(waypointsAfterSeconds),
      forgetOutdatedNodePositionsAfterSeconds &&
        forgetOutdatedNodePositions(forgetOutdatedNodePositionsAfterSeconds),
    ]);
  }, intervalSeconds * 1000);
}

async function purgeUnheardNodes(seconds) {
  try {
    const threshold = new Date(Date.now() - seconds * 1000);
    await schemas.nodeinfo.deleteMany({ mqtt_updated_at: { $lt: threshold } });
    logger.info(`Purged nodes unheard for ${seconds}s`);
  } catch (err) {
    logger.error(`Failed to purge unheard nodes:`, err.message);
  }
}

async function purgeOldDeviceMetrics(seconds) {
  try {
    const threshold = new Date(Date.now() - seconds * 1000);
    await schemas.telemetry.deleteMany({
      updated_at: { $lt: threshold },
      battery_level: { $ne: null },
    });
    logger.info(`Purged device metrics older than ${seconds}s`);
  } catch (err) {
    logger.error(`Failed to purge device metrics:`, err.message);
  }
}

async function purgeOldEnvironmentMetrics(seconds) {
  try {
    const threshold = new Date(Date.now() - seconds * 1000);
    await schemas.telemetry.deleteMany({
      updated_at: { $lt: threshold },
      temperature: { $ne: null },
    });
    logger.info(`Purged environment metrics older than ${seconds}s`);
  } catch (err) {
    logger.error(`Failed to purge environment metrics:`, err.message);
  }
}

async function purgeOldMapReports(seconds) {
  try {
    const threshold = new Date(Date.now() - seconds * 1000);
    await schemas.mapReport.deleteMany({ created_at: { $lt: threshold } });
    logger.info(`Purged map reports older than ${seconds}s`);
  } catch (err) {
    logger.error(`Failed to purge map reports:`, err.message);
  }
}

async function purgeOldNeighbourInfos(seconds) {
  try {
    const threshold = new Date(Date.now() - seconds * 1000);
    await schemas.neighbourInfo.deleteMany({ created_at: { $lt: threshold } });
    logger.info(`Purged neighbour infos older than ${seconds}s`);
  } catch (err) {
    logger.error(`Failed to purge neighbour infos:`, err.message);
  }
}

async function purgeOldPowerMetrics(seconds) {
  try {
    const threshold = new Date(Date.now() - seconds * 1000);
    await schemas.telemetry.deleteMany({
      updated_at: { $lt: threshold },
      voltage_ch1: { $ne: null },
    });
    logger.info(`Purged power metrics older than ${seconds}s`);
  } catch (err) {
    logger.error(`Failed to purge power metrics:`, err.message);
  }
}

async function purgeOldPositions(seconds) {
  try {
    const threshold = new Date(Date.now() - seconds * 1000);
    await schemas.position.deleteMany({ created_at: { $lt: threshold } });
    logger.info(`Purged positions older than ${seconds}s`);
  } catch (err) {
    logger.error(`Failed to purge positions:`, err.message);
  }
}

async function purgeOldTextMessages(seconds) {
  try {
    const threshold = new Date(Date.now() - seconds * 1000);
    await schemas.textMessage.deleteMany({ created_at: { $lt: threshold } });
    logger.info(`Purged text messages older than ${seconds}s`);
  } catch (err) {
    logger.error(`Failed to purge text messages:`, err.message);
  }
}

async function purgeOldTraceroutes(seconds) {
  try {
    const threshold = new Date(Date.now() - seconds * 1000);
    await schemas.traceroute.deleteMany({ created_at: { $lt: threshold } });
    logger.info(`Purged traceroutes older than ${seconds}s`);
  } catch (err) {
    logger.error(`Failed to purge traceroutes:`, err.message);
  }
}

async function purgeOldWaypoints(seconds) {
  try {
    const threshold = new Date(Date.now() - seconds * 1000);
    await schemas.waypoint.deleteMany({ created_at: { $lt: threshold } });
    logger.info(`Purged waypoints older than ${seconds}s`);
  } catch (err) {
    logger.error(`Failed to purge waypoints:`, err.message);
  }
}

async function forgetOutdatedNodePositions(seconds) {
  try {
    const threshold = new Date(Date.now() - seconds * 1000);
    await schemas.nodeinfo.updateMany(
      { position_updated_at: { $lt: threshold } },
      { $set: { latitude: null, longitude: null, altitude: null } }
    );
    logger.info(`Cleared outdated node positions older than ${seconds}s`);
  } catch (err) {
    logger.error(`Failed to clear outdated node positions:`, err.message);
  }
}

module.exports = { startPurge };
