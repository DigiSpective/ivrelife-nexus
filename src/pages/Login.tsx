// Legacy Login component - redirects to new auth system
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to new auth login page
    navigate('/auth/login', { replace: true });
  }, [navigate]);

  return null;
}