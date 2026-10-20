import { useCallback, useState } from 'react';

/**
 * Hook for managing temporary accessible toast notifications.
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ message, type = 'info', duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts(prev => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message, duration) => addToast({ message, type: 'success', duration }),
    [addToast]
  );

  const error = useCallback(
    (message, duration) => addToast({ message, type: 'error', duration }),
    [addToast]
  );

  const info = useCallback(
    (message, duration) => addToast({ message, type: 'info', duration }),
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
  };
};

export default useToast;
