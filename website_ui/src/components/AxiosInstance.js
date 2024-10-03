import axios from 'axios';

const baseURL = 'http://localhost:8000/';

const instance = axios.create({
  baseURL: baseURL,
  withCredentials: true,  // This ensures that cookies are included in cross-origin requests
});

export default instance;