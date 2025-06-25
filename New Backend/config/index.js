require("dotenv").config();

const requiredEnvVars = ["MONGO_URL", "FRONTEND_URL", "WEBHOOK_URL2"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(", ")}`
  );
}

module.exports = {
  port: process.env.PORT || 8000,
  mongoUrl: process.env.MONGO_URL,
  frontendUrl: process.env.FRONTEND_URL,
  webhookUrl: process.env.WEBHOOK_URL2,
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET"],
  },
  mqtt: {
    brokerUrl: "mqtt://mqtt.meshtastic.org",
    username: "meshdev",
    password: "large4cats",
    clientId: "MeshMetrics",
    topics: ["msh/EU_868/FI/#", "msh/Finland/#"],
    decryptionKeys: ["1PG7OiApB1nwvP+rz05pAQ==", "1PG7OiApB1nwvP+rz05pMQ=="],
    options: {
      allowedPortnums: null,
      logUnknownPortnums: true,
      collectServiceEnvelopes: true,
      collectPositions: true,
      collectTextMessages: true,
      ignoreDirectMessages: false,
      collectWaypoints: true,
      collectNeighbourInfo: true,
      collectMapReports: true,
      dropPacketsNotOkToMqtt: false,
      dropPortnumsWithoutBitfield: null,
      oldFirmwarePositionPrecision: null,
      purge: {
        intervalSeconds: 0,
        nodesUnheardForSeconds: null,
        deviceMetricsAfterSeconds: null,
        environmentMetricsAfterSeconds: null,
        mapReportsAfterSeconds: null,
        neighbourInfosAfterSeconds: null,
        powerMetricsAfterSeconds: null,
        positionsAfterSeconds: null,
        serviceEnvelopesAfterSeconds: null,
        textMessagesAfterSeconds: null,
        traceroutesAfterSeconds: null,
        waypointsAfterSeconds: null,
        forgetOutdatedNodePositionsAfterSeconds: null,
      },
    },
  },
};
