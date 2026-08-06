import { io } from "socket.io-client";

export function createSocket() {
  const token = localStorage.getItem('mtst') ?? crypto.randomUUID();
  localStorage.setItem('mtst', token);

  const socket = io(import.meta.env.VITE_PUBLIC_SOCKET_URL, {
    path: import.meta.env.VITE_PUBLIC_SOCKET_PATH,
    auth: {
      token,
      name: localStorage.getItem('mtpu')
    },
  });

  return socket;
}