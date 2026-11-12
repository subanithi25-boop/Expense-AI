import React from 'react';
import { LoginPage } from './LoginPage';

/**
 * RegisterPage re-uses the LoginPage component.
 * The LoginPage already has a toggle between sign-in and register modes.
 * This route simply renders that page so /register is a valid URL
 * that the landing page can link to.
 */
export const RegisterPage: React.FC = () => {
  return <LoginPage />;
};
