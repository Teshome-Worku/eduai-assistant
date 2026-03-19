import { useState, useEffect } from 'react';

/**
 * Custom hook for data fetching with loading/error states
 * @param {Function} fetchFn - API function to call
 * @param {Array} deps - Dependencies array for re-fetching
 */
const useFetch = (fetchFn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetchFn();
        setData(res.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, deps);

  const refetch = async () => {
    setLoading(true);
    try {
      const res = await fetchFn();
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};

export default useFetch;
