async function call(endpoint: string, method: string, data?: any) {
  const res = await fetch(`${import.meta.env.VITE_PUBLIC_API_URL}/${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  return await res.json();
}

export const api = {
  get: (endpoint: string) => call(endpoint, 'GET'),
};