import { useState, useRef, useEffect, useCallback } from 'react';

export function useBotProtection() {
  const [captchaA] = useState(() => Math.floor(Math.random() * 10) + 2);
  const [captchaB] = useState(() => Math.floor(Math.random() * 10) + 1);
  const [captchaValue, setCaptchaValue] = useState('');
  const honeypotRef = useRef(null);
  const mountedAt = useRef(Date.now());

  const validate = useCallback(() => {
    if (honeypotRef.current?.value) return false;
    if (Date.now() - mountedAt.current < 3000) return false;
    if (Number(captchaValue) !== captchaA + captchaB) return false;
    return true;
  }, [captchaA, captchaB, captchaValue]);

  return {
    honeypotRef,
    captchaA,
    captchaB,
    captchaValue,
    setCaptchaValue,
    validate,
  };
}
