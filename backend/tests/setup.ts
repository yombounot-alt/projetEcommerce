import { spawnSync } from "child_process";
import { MongoBinary, MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { env } from "../src/config/env";
import { connectDatabase, disconnectDatabase } from "../src/config/database";

let replSet: MongoMemoryReplSet | undefined;

/**
 * mongodb-memory-server spawns its own downloaded mongod binary. On a machine whose
 * Application Control policy blocks spawning that binary (spawn errno UNKNOWN), calling
 * MongoMemoryReplSet.create() doesn't just reject cleanly — replica-set init starts a
 * second, unawaited instance internally, which times out later as an unhandled rejection
 * and gets reported as a spurious "Test suite failed to run" even after every test already
 * passed against the fallback DB below. Probing the binary directly first avoids ever
 * calling into that broken path.
 */
async function canSpawnMongod(): Promise<boolean> {
  try {
    const binaryPath = await MongoBinary.getPath({});
    return spawnSync(binaryPath, ["--version"], { timeout: 5_000 }).error === undefined;
  } catch {
    return false;
  }
}

// A replica set (not a standalone instance) is required: order checkout uses Mongo
// multi-document transactions (stock reservation + order creation), which only work
// against a replica set — this mirrors the production requirement documented in the README.
beforeAll(async () => {
  if (await canSpawnMongod()) {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
    env.MONGODB_TEST_URI = replSet.getUri("lumera_test");
  } else if (!env.MONGODB_TEST_URI) {
    // Fall back to the developer's own local replica set (MONGODB_TEST_URI in .env)
    // instead of failing the whole suite; it must still be a replica set for the same
    // transaction reason as above.
    throw new Error(
      "Cannot spawn mongodb-memory-server's mongod binary, and no MONGODB_TEST_URI fallback is configured in .env.",
    );
  }
  await connectDatabase();
}, 60_000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await disconnectDatabase();
  await replSet?.stop();
});
