import { useState } from "react";

function useApiAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const run = async (requestFn) => {
    try {
      setLoading(true);
      setError("");
      setResult(null);
      const response = await requestFn();
      setResult(response.data?.data ?? null);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    result,
    run,
    setError,
    setResult,
  };
}

export default useApiAction;
