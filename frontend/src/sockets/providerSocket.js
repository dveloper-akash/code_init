import { io } from "socket.io-client";

export function connectToProvider(providerIp) {
  return io(`http://${providerIp}:7000`, {
    transports: ["websocket"],
  });
}
