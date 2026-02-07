import prisma from "../config/prisma.js";
import * as providerStore from "./providerStore.js";

export async function registerProvider(data) {
  const {
    id,
    name,
    languages,
    maxTimeout,
    labels,
    address,
  } = data;

  
  const provider = await prisma.provider.upsert({
    where: { id },
    update: {
      name,
      languages,
      maxTimeout,
      labels,
      revoked: false,
      lastSeenAt: new Date(),
    },
    create: {
      id,
      name,
      languages,
      maxTimeout,
      labels,
    },
  });

  // Redis = live state
  await providerStore.registerProvider(
    id,
    address,
    { languages, maxTimeout, labels }
  );

  return provider;
}

export async function heartbeat(id) {
  await providerStore.heartbeat(id);

  await prisma.provider.update({
    where: { id },
    data: { lastSeenAt: new Date() },
  });
}
