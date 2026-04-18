const API_CONFIG = {
    
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
    
    
    endpoints: {
      auth: '/api/auth',
      orders: '/api/orders',
      stations: '/api/stations',
      pricing: '/api/dispatcher/pricing',
      payments: '/api/dispatcher/payments',
      user: '/api/user',
      wagons: '/api/dispatcher/wagons'  
    }
  };
  
  export default API_CONFIG;