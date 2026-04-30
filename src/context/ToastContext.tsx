import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import type { AxiosError } from 'axios';
import { api } from '../services/api';

type Severity = 'success' | 'error';

interface ToastState {
  open: boolean;
  message: string;
  severity: Severity;
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const show = useCallback((message: string, severity: Severity) => {
    setState({ open: true, message, severity });
  }, []);

  const toast = {
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'error'),
  };

  const handleClose = (_: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    setState(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    const id = api.interceptors.response.use(
      response => response,
      (error: AxiosError<{ message?: string }>) => {
        const serverMessage = error.response?.data?.message;
        const statusMessage =
          error.response?.status === 400 ? 'Bad request' :
          error.response?.status === 404 ? 'Not found' :
          error.response?.status === 409 ? 'Conflict' :
          error.response?.status != null && error.response.status >= 500 ? 'Server error' :
          null;
        show(serverMessage ?? statusMessage ?? 'Something went wrong', 'error');
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, [show]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={state.severity} variant="filled" sx={{ width: '100%' }}>
          {state.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
