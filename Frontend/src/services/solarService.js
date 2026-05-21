import axios from "axios";

const API = "https://samku-backend.onrender.com/api";

export const getLatestSolarData = async () => {
  const response = await axios.get(`${API}/solar/latest`);
  return response.data.data;
};
