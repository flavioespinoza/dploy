import React from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import Delayed from '../components/Delayed';
import Settings from '../components/Settings';
import { keplrState } from '../recoil/atoms';

const SettingsPage: React.FC<any> = () => {
  return (
    <Settings />
  );
};

export default SettingsPage;
