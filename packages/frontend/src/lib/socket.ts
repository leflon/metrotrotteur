import { io } from "socket.io-client";

export function createSocket() {
  const token = localStorage.getItem('mtst') ?? crypto.randomUUID();
  localStorage.setItem('mtst', token);

  const socket = io(import.meta.env.VITE_PUBLIC_API_URL, {
    auth: {
      token,
      name: localStorage.getItem('mtpu')
    },
  });

  return socket;
}