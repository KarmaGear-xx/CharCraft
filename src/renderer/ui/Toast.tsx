import { useEffect } from 'react';
import { useCardStore } from '../store/store';

export default function Toast() {
  const error = useCardStore((s) => s.error);
  const success = useCardStore((s) => s.success);
  const setError = useCardStore((s) => s.setError);
  const setSuccess = useCardStore((s) => s.setSuccess);

  useEffect(() => {
    if (!error && !success) return;
    const id = setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 4000);
    return () => clearTimeout(id);
  }, [error, success, setError, setSuccess]);

  if (error) {
    return (
      <div className="toast toast-error" onClick={() => setError(null)} role="alert">
        <span>⚠️ {error}</span>
      </div>
    );
  }
  if (success) {
    return (
      <div className="toast toast-success" onClick={() => setSuccess(null)} role="status">
        <span>✓ {success}</span>
      </div>
    );
  }
  return null;
}
