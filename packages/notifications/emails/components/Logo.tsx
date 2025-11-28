import { Img } from '@react-email/components';
import React from 'react';

export function Logo() {
  return (
    <Img
      src="https://lin.ky/assets/logo.png"
      width="42"
      height="42"
      alt="Linky"
      style={logo}
    />
  );
}

const logo = {
  borderRadius: 8,
  width: 52,
  height: 52,
  margin: '0 auto',
};
