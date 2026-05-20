import axios from "axios";

const API = "http://localhost:5000/api";

export const getLatestSolarData = async () => {
  const response = await axios.get(`${API}/solar/latest`);
  return response.data.data;
};
