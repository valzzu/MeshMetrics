const crypto = require("crypto");
const config = require("../../config");
const logger = require("pino")();

/**
 * Creates a nonce for decryption.
 * @param {number} packetId - Packet ID.
 * @param {number} fromNode - Sender node ID.
 * @returns {Buffer} Nonce buffer.
 */
function createNonce(packetId, fromNode) {
  const packetId64 = BigInt(packetId);
  const blockCounter = 0;
  const buf = Buffer.alloc(16);
  buf.writeBigUInt64LE(packetId64, 0);
  buf.writeUInt32LE(fromNode, 8);
  buf.writeUInt32LE(blockCounter, 12);
  return buf;
}

/**
 * Decrypts an encrypted packet.
 * @param {Object} packet - Packet object with id, from, and encrypted data.
 * @param {Object} Data - Protobuf Data type.
 * @returns {Object|null} Decoded data or null if decryption fails.
 */
function decrypt(packet, Data) {
  if (!config.mqtt.decryptionKeys || config.mqtt.decryptionKeys.length === 0) {
    logger.warn("No decryption keys configured, skipping decryption.");
    return null;
  }
  for (const decryptionKey of config.mqtt.decryptionKeys) {
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
        logger.warn(
          `Skipping decryption key with invalid length: ${key.length}`
        );
        continue;
      }

      const decipher = crypto.createDecipheriv(algorithm, key, nonceBuffer);
      const decryptedBuffer = Buffer.concat([
        decipher.update(Buffer.from(packet.encrypted)),
        decipher.final(),
      ]);

      return Data.decode(decryptedBuffer);
    } catch (err) {
      logger.error(`Failed to decrypt with key ${decryptionKey}:`, err.message);
    }
  }
  return null;
}

module.exports = { decrypt };
