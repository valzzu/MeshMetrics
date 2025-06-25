const path = require("path");
const protobufjs = require("protobufjs");

/**
 * Loads Meshtastic Protobuf definitions.
 * @returns {Promise<protobufjs.Root>} Loaded Protobuf root.
 */
async function loadProtobufs() {
  const root = new protobufjs.Root();
  root.resolvePath = (origin, target) =>
    path.join(__dirname, "../../protobufs", target);
  await root.load("meshtastic/mqtt.proto");
  return root;
}

module.exports = { loadProtobufs };
