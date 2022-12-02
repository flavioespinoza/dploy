import React from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import Deployment from '../components/Deployment';
import { useDeploymentDataQuery } from '../hooks/useDeploymentData';
import { keplrState } from '../recoil/atoms';

const ViewDeployment: React.FC<any> = () => {
  const keplr = useRecoilValue(keplrState);
  const { dseq } = useParams();
  const deployment = useDeploymentDataQuery({ owner: keplr?.accounts[0].address, dseq});
  return (
    <div>
     {deployment && deployment.deployment ?  <Deployment myDeployment={deployment} /> : null}
    </div>
  );
};

export default ViewDeployment;
