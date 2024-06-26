import React from 'react';
import styled from '@emotion/styled';
import { Box, Button, Card, Stack, Tooltip } from '@mui/material';
import { useRecoilState } from 'recoil';
import { useFormikContext } from 'formik';
import { keplrState, rpcEndpoint } from '../recoil/atoms';
import { getAccountBalance } from '../recoil/api/bank';
import { loadActiveCertificate, createAndBroadcastCertificate } from '../recoil/api';
import { Icon } from '../components/Icons';
import Delayed from '../components/Delayed';
import { Title, Text } from '../components/Text';
import { uaktToAKT } from '../_helpers/lease-calculations';
import { getKeplr } from '../_helpers/keplr-utils';

export const PreflightCheck: React.FC<{}> = () => {
  const [hasKeplr, setHasKeplr] = React.useState(false);
  const [keplr, setKeplr] = useRecoilState(keplrState);
  const [balance, setBalance] = React.useState(0);
  const { submitForm } = useFormikContext();
  const [certificate, setCertificate] = React.useState({ $type: 'Invalid Certificate' });

  React.useEffect(() => {
    if (window.keplr) {
      setHasKeplr(true);
    }
  }, []);

  React.useEffect(() => {
    handleConnectWallet();
  }, []);

  React.useEffect(() => {
    if (!window.keplr) return;
    if (keplr.isSignedIn && keplr?.accounts[0]?.address) {
      getAccountBalance(keplr.accounts[0].address).then((result) => {
        const akt = uaktToAKT(result);
        setBalance(akt);
      });
      loadActiveCertificate(keplr.accounts[0].address).then((result) => {
        setCertificate(result);
      });
    }
  }, [keplr]);

  const handleConnectWallet = async () => {
    const _keplr = await getKeplr();
    setKeplr(_keplr);
  };

  const handleCreateCertificate = async () => {
    await createAndBroadcastCertificate(rpcEndpoint, keplr);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={2}
      sx={{
        '& .MuiTextField-root': { m: 1, width: '25ch' },
        margin: '0 auto',
        width: '821px',
      }}
    >
      <PreflightCheckWrapper>
        <div>
          <Title size={18} className="pb-6 h-12">
            Checking Essentials
          </Title>
          <Delayed>
            {/* Check Keplr & Login */}
            <Stack sx={{ width: '100%' }} spacing={0}>
              {!hasKeplr && (
                <PreflightCheckItem>
                  <div className="flex mb-2">
                    <Icon type="alert" />
                    <Title size={14} className="pl-2">
                      You will need to install the Keplr wallet extension for Chrome.
                    </Title>
                    <div className="grow">{/* spacer - do not remove */}</div>
                    <a
                      href="https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap"
                      target="_blank"
                    >
                      <PreflightActionButton>Get Keplr</PreflightActionButton>
                    </a>
                    <Tooltip title="Sign in to your Keplr wallet" placement="top">
                      <div className="ml-2">
                        <Icon type="infoGray" />
                      </div>
                    </Tooltip>
                  </div>
                  <Text size={14}>In order to deploy you will need to connect your wallet.</Text>
                </PreflightCheckItem>
              )}
            </Stack>

            <Stack sx={{ width: '100%', marginBottom: '16px' }} spacing={0}>
              {hasKeplr && !keplr.isSignedIn ? (
                <PreflightCheckItem>
                  <div className="flex mb-2">
                    <Icon type="alert" />
                    <Title size={14} className="pl-2">
                      Connect your Wallet
                    </Title>
                    <div className="grow">{/* spacer - do not remove */}</div>
                    <PreflightActionButton onClick={handleConnectWallet}>
                      Connect Wallet
                    </PreflightActionButton>
                    <Tooltip title="Sign in to your Keplr wallet" placement="top">
                      <div className="ml-2">
                        <Icon type="infoGray" />
                      </div>
                    </Tooltip>
                  </div>
                  <Text size={14}>In order to deploy you will need to connect your wallet.</Text>
                </PreflightCheckItem>
              ) : null}
              {hasKeplr && keplr.isSignedIn ? (
                <PreflightCheckItem>
                  <div className="flex">
                    <Icon type="checkVerified" />
                    <Title size={14} className="pl-3">
                      Wallet Connected
                    </Title>
                    <div className="grow">{/* spacer - do not remove */}</div>
                  </div>
                </PreflightCheckItem>
              ) : null}
            </Stack>

            {/* Check Funds */}
            <Stack sx={{ width: '100%', marginBottom: '16px' }} spacing={0}>
              {balance < 5 && (
                <PreflightCheckItem>
                  <div className="flex mb-2">
                    <Icon type="alert" />
                    <Title size={14} className="pl-2">
                      Insufficient funds in your wallet
                    </Title>
                    <div className="grow">{/* spacer - do not remove */}</div>
                  </div>
                  <Text size={14}>
                    Minimum wallet balance is at least 5 AKT. You can add funds to your wallet or
                    specify an authorized depositor.
                  </Text>
                </PreflightCheckItem>
              )}
              {balance >= 5 ? (
                <PreflightCheckItem>
                  <div className="flex">
                    <Icon type="checkVerified" />
                    <Title size={14} className="pl-2">
                      Wallet Funds Sufficient
                    </Title>
                    <div className="grow">{/* spacer - do not remove */}</div>
                  </div>
                </PreflightCheckItem>
              ) : null}
            </Stack>

            {/* Check Certificate */}
            <Stack sx={{ width: '100%', marginBottom: '16px' }} spacing={0}>
              {certificate.$type === 'Invalid Certificate' && (
                <PreflightCheckItem>
                  <div className="flex mb-2">
                    <Icon type="alert" />
                    <Title size={14} className="pl-2">
                      Missing Certificate
                    </Title>
                    <div className="grow">{/* spacer - do not remove */}</div>
                    <PreflightActionButton onClick={handleCreateCertificate}>
                      Create Certificate
                    </PreflightActionButton>
                    <Tooltip
                      title="Create a valid certificate on the Akash Network."
                      placement="top"
                    >
                      <div className="ml-2">
                        <Icon type="infoGray" />
                      </div>
                    </Tooltip>
                  </div>
                  <Text size={14}>In order to deploy you will need to create a certificate.</Text>
                </PreflightCheckItem>
              )}
              {certificate.$type === 'TLS Certificate' ? (
                <PreflightCheckItem>
                  <div className="flex">
                    <Icon type="checkVerified" />
                    <Title size={14} className="pl-2">
                      Valid Certificate
                    </Title>
                    <div className="grow">{/* spacer - do not remove */}</div>
                  </div>
                </PreflightCheckItem>
              ) : null}
            </Stack>
          </Delayed>
        </div>
      </PreflightCheckWrapper>
      <DeploymentAction>
        <Button variant="contained" onClick={submitForm}>
          Next
        </Button>
      </DeploymentAction>
    </Box>
  );
};

const DeploymentAction = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const PreflightCheckWrapper = styled(Card)`
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 24px;
  min-height: 320px;
`;

const PreflightCheckItem = styled.div`
  width: 100%;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
`;

const PreflightActionButton = styled(Button)`
  color: #374151;
  background: #ffffff;
  border: 1px solid #d1d5db;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  font-family: 'Satoshi-Regular';
  font-style: normal;
  font-weight: 800;
  font-size: 12px;
  padding: 2px 16px;
  height: 38px;
  width: 132px;
  text-transform: none;
`;
