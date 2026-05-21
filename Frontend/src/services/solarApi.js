const BASE_URL = "https://samku-backend.onrender.com/api/solar";

export const getLatestSolar = async () => {
  const res = await fetch(`${BASE_URL}/latest`);
  return res.json();
};

export const pushSolarData = async (data) => {
  const res = await fetch(`${BASE_URL}/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
};
