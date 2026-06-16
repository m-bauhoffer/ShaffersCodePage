import { randomBytes } from "node:crypto";
import { getAdminDb } from "./firebaseAdmin.js";

const db = getAdminDb();
const CODE_PREFIX = "SH";
const CODE_LENGTH = 6;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEFAULT_PRICE_POOL = [
  "PAPAS EXTRA",
  "MEDALLON EXTRA",
  "MEDALLON EXTRA",
  "10% OFF",
  "10% OFF",
  "10% OFF",
  "10% OFF",
  "10% OFF",
  "10% OFF",
  "10% OFF",
];

function parseArgs(argv) {
  const options = {
    count: 50,
    price: "",
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--count") {
      const value = argv[index + 1];

      if (!value) {
        throw new Error("Debes indicar un valor para --count.");
      }

      options.count = Number.parseInt(value, 10);
      index += 1;
      continue;
    }

    if (arg === "--price") {
      const value = argv[index + 1];

      if (!value) {
        throw new Error("Debes indicar un valor para --price.");
      }

      options.price = value.trim();
      index += 1;
      continue;
    }

    throw new Error(`Argumento no soportado: ${arg}`);
  }

  if (!Number.isInteger(options.count) || options.count <= 0) {
    throw new Error("--count debe ser un entero mayor a 0.");
  }

  return options;
}

function createRandomSegment(length) {
  let segment = "";

  while (segment.length < length) {
    const byte = randomBytes(1)[0];
    segment += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }

  return segment;
}

function createCode(existingCodes) {
  let code;

  do {
    code = `${CODE_PREFIX}-${createRandomSegment(CODE_LENGTH)}`;
  } while (existingCodes.has(code));

  existingCodes.add(code);
  return code;
}

function getPriceForIndex(index, selectedPrice) {
  if (selectedPrice) {
    return selectedPrice;
  }

  return DEFAULT_PRICE_POOL[index % DEFAULT_PRICE_POOL.length];
}

async function addCodes() {
  const options = parseArgs(process.argv.slice(2));
  const existingSnapshot = await db.collection("discountCodes").get();
  const existingCodes = new Set(existingSnapshot.docs.map((document) => document.id));
  const newCodes = Array.from({ length: options.count }, (_, index) => ({
    code: createCode(existingCodes),
    price: getPriceForIndex(index, options.price),
  }));

  if (options.dryRun) {
    console.log("Dry run completado. Codigos a insertar:");
    newCodes.forEach(({ code, price }) => console.log(`${code}\t${price}`));
    return;
  }

  const batch = db.batch();

  newCodes.forEach((data) => {
    const docRef = db.collection("discountCodes").doc(data.code);

    batch.set(docRef, {
      code: data.code,
      price: data.price,
      assigned: false,
      assignedAt: null,
      assignedToUid: null,
    });
  });

  await batch.commit();

  console.log(`${newCodes.length} codigos agregados correctamente.`);
  newCodes.forEach(({ code, price }) => console.log(`${code}\t${price}`));
}

addCodes().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
