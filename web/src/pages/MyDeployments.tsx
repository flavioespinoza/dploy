import React, { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { aktMarketCap, keplrState } from '../recoil/atoms';
import { Stack } from '@mui/material';
import { DeploymentTable } from '../components/DeploymentTable';
import useDeploymentData from '../hooks/useDeploymentData';
import Loading from '../components/Loading';
import { WordSwitch } from '../components/Switch/WordSwitch';

const MyDeployments: React.FC<{}> = () => {
  const keplr = useRecoilValue(keplrState);
  const akt = useRecoilValue(aktMarketCap);
  const deployments = useDeploymentData({ owner: keplr?.accounts[0].address });
  const [showAll, setShowAll] = React.useState(false);

  const tableData = useMemo(() => {
    return (
      deployments &&
      deployments.filter((deployment) => showAll || deployment.status === 1).map((obj) => obj)
    );
  }, [deployments, showAll, akt]);

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowAll(!e.target.checked);
  };

  if (!tableData) {
    return <Loading />;
  }

  return (
    <div id="my_deployments" style={{ width: '90vw'}}>
      <Stack id="stack" direction="row" spacing={1} alignItems="center" sx={{ marginBottom: '24px' }}>
        <WordSwitch on="Active only" off="All" checked={!showAll} onChange={handleToggleAll} />
      </Stack>
      <DeploymentTable rows={tableData} showAll={showAll} />
    </div>
  );
};

export default MyDeployments;
