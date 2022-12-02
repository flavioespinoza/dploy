import React, { useCallback, useMemo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import styled from '@emotion/styled';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoDisturbOffIcon from '@mui/icons-material/DoDisturbOff';
import {
  activeCertificate,
  certificateList,
  keplrState,
  optIntoAnalytics,
  rpcEndpoint,
} from '../../recoil/atoms';
import {
  broadcastRevokeCertificate,
  createAndBroadcastCertificate,
  getAvailableCertificates,
  getCertificateByIndex,
  saveActiveSerial,
} from '../../recoil/api';
import { AntSwitch } from '../Switch/AntSwitch';
import { Address } from '../Address';
import Delayed from '../Delayed';

const Settings: React.FC<any> = () => {
  const keplr = useRecoilValue(keplrState);
  const [currentActiveCertificate, setCurrentActiveCertificate] = useRecoilState(activeCertificate);
  const certificates = useRecoilValue(certificateList(keplr?.accounts[0]?.address));
  const [certificatesList, setCertificatesList] = React.useState([]);
  const [currentCertificate, setCurrentCertificate] = React.useState<any>({});
  const [showAll, setShowAll] = React.useState(false);
  const [network] = React.useState('akashnet-2');
  const [currency] = React.useState('AKT');
  const [revokeOpen, setRevokeOpen] = React.useState(false);
  const [revokeCert, setRevokeCert] = React.useState('');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [showProgress, setShowProgress] = React.useState(false);
  const [fields, setFields] = React.useState([]);
  const [optInto, setOptInto] = useRecoilState(optIntoAnalytics);
  const availableCertificates = useMemo(
    () => getAvailableCertificates(keplr?.accounts[0]?.address),
    [keplr?.accounts[0]?.address]
  );

  // This function is cashed here, and also it forbid clicking outside the Dialog which confuses me a lot
  const onCLoseDialog = React.useCallback(
    (callback, value, reason) => {
      // https://mui.com/material-ui/api/dialog/#props
      if (reason && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
        return;
      }
      callback(value);
    },
    [setCreateOpen, setRevokeOpen]
  );

  const handleOptIntoAnalytics = () => setOptInto(!optInto);

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowAll(!e.target.checked);
  };

  const handleCreateCertificate = React.useCallback(async () => {
    setShowProgress(true);
    await createAndBroadcastCertificate(rpcEndpoint, keplr);
    window.location.reload();
  }, [keplr]);

  const handleRevokeCertificate = React.useCallback(async () => {
    setShowProgress(true);
    await broadcastRevokeCertificate(rpcEndpoint, keplr, revokeCert);
    window.location.reload();
  }, [keplr, revokeCert]);

  React.useEffect(() => {
    const result = [];

    if (currentActiveCertificate.$type === 'TLS Certificate') {
      const currentPublicKey = currentActiveCertificate.publicKey;

      for (const cert of certificates.certificates) {
        const pubKey = Buffer.from(cert.certificate.pubkey, 'base64').toString('ascii');

        if (pubKey === currentPublicKey) {
          const current = {
            current: true,
            available: true,
            owner: keplr?.accounts[0].address,
            index: availableCertificates.indexOf(pubKey),
            pubKey,
            ...cert,
          };
          console.log('current certificate', current);
          setCurrentCertificate(current);
          result.push(current);
        } else {
          result.push({
            current: false,
            available: availableCertificates.indexOf(pubKey) !== -1,
            owner: keplr?.accounts[0].address,
            index: availableCertificates.indexOf(pubKey),
            pubKey,
            ...cert,
          });
        }
      }
      setCertificatesList(result);
    }
  }, [currentActiveCertificate]);

  const activateCertificate = useCallback(
    (index: number) => {
      saveActiveSerial(keplr?.accounts[0]?.address, index);
      setCurrentActiveCertificate(getCertificateByIndex(keplr?.accounts[0]?.address, index));
    },
    [setCurrentActiveCertificate]
  );

  React.useEffect(() => {
    const _fields = [
      {
        title: 'Network',
        subtitle: 'Select your preferred network',
        value: network,
        options: ['akashnet-2'],
      },
      {
        title: 'Currency',
        subtitle: 'Select your preferred currency',
        value: currency,
        options: ['AKT'],
      },
      {
        title: 'Certificates',
        subtitle: 'Manage your certificates',
        value: '',
        options: certificatesList,
      },
    ];
    setFields(_fields);
  }, []);

  return (
    <Grid
      container
      sx={{ flexGrow: 1, paddingTop: 4 }}
      justifyContent="center"
      spacing={2}
    >
      <Grid item xs={12}>
        <div className="text-2xl font-bold">Settings</div>
      </Grid>
      <Grid item xs={12}>
        <SettingsCard>
          {fields.map((obj: any, i: number) => (
            <SettingsField key={i}>
              <div className="flex-none">
                <div className="text-base font-bold text-[#111827]">{obj.title}</div>
                {certificatesList.length > 0 && obj.title === 'Certificates' ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ marginBottom: '24px' }}
                  >
                    <AntSwitch
                      checked={!showAll}
                      onChange={handleToggleAll}
                      inputProps={{ 'aria-label': 'ant design' }}
                    />
                    <Typography>Valid only</Typography>
                  </Stack>
                ) : null}
              </div>

              <div className="grow">{/* spacer */}</div>

              {obj.title === 'Certificates' ? (
                <div className="flex-none mb-2">
                  <Button variant="outlined" onClick={() => setCreateOpen(true)}>
                    Generate New Certificate
                  </Button>
                </div>
              ) : (
                <div className="flex-none mb-2">{obj.value}</div>
              )}
            </SettingsField>
          ))}

          <Delayed>
            <>
              {certificatesList.length &&
              currentCertificate?.current &&
              currentCertificate?.certificate?.state === 'valid' ? null : (
                <Alert severity="error" variant="filled" >
                  You don't have a valid certificate. You must generate a new certificate to deploy.
                </Alert>
              )}
            </>
          </Delayed>

          {certificatesList.length > 0
            ? certificatesList.map((d: any, i: number) => {
                if (!showAll) {
                  // eslint-disable-next-line array-callback-return
                  if (d.certificate.state === 'revoked') return;
                }
                return (
                  <SettingsField key={i}>
                    <SettingsCertificateCard>
                      <div className="flex items-center">
                        <div className="flex mr-6">
                          <span className="text-base font-bold text-[#111827] mr-2">Cert:</span>
                          <Address address={d.certificate.cert} />
                        </div>
                        <div className="flex mr-6">
                          <span className="text-base font-bold text-[#111827] mr-2">Pubkey:</span>
                          <Address address={d.certificate.pubkey} />
                        </div>
                        <div className="flex mr-6">
                          <span className="text-base font-bold text-[#111827] mr-2">Owner:</span>
                          <Address address={d.owner} />
                        </div>
                        <div className="ml-6 text-[#FA5757]">
                          {d.current ? <div>Current</div> : null}
                        </div>
                        <div className="grow">{/* spacer */}</div>
                        <div className="border-r w-[106px] mr-2">
                          {d.certificate.state === 'revoked' ? (
                            <DoDisturbOffIcon style={{ color: '#C9CACD' }} />
                          ) : (
                            <CheckCircleIcon style={{ color: '#C9CACD' }} />
                          )}
                          <span className="ml-2">{d.certificate.state}</span>
                        </div>
                        {d.certificate.state === 'valid' && (
                          <div className="w-20">
                            <Button
                              onClick={() => {
                                setRevokeCert(d.serial);
                                setRevokeOpen(true);
                              }}
                            >
                              Revoke
                            </Button>
                          </div>
                        )}
                        {d.available && !d.current && (
                          <div className="w-20">
                            <Button onClick={() => activateCertificate(d.index)}>Activate</Button>
                          </div>
                        )}
                      </div>
                    </SettingsCertificateCard>
                  </SettingsField>
                );
              })
            : null}
          <SettingsField>
            <div className="flex-none">
              <div className="text-base font-bold text-[#111827]">Analytics</div>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ marginBottom: '24px' }}>
                <AntSwitch
                  checked={optInto}
                  onChange={handleOptIntoAnalytics}
                  inputProps={{ 'aria-label': 'ant design' }}
                />
                <Typography>{optInto ? 'Opted-in' : 'Opted-out'}</Typography>
              </Stack>
            </div>
          </SettingsField>
        </SettingsCard>
      </Grid>

      {/* Create Certificate */}
      <Dialog
        fullWidth={false}
        maxWidth="xs"
        onClose={(event, reason) =>
          onCLoseDialog(setCreateOpen, false, showProgress ? reason : false)
        }
        open={createOpen}
      >
        <DialogTitle>Create Certificate</DialogTitle>
        <DialogContent>
          {showProgress ? (
            <div className="flex justify-center">
              <CircularProgress />
            </div>
          ) : (
            <>
              <p className="pb-12 text-[#6B7280]">This will create a new certificate.</p>
              <div className="flex justify-center">
                <Button
                  className="w-[180px]"
                  variant="outlined"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <div className="w-[20px]">{/* spacer */}</div>
                <Button className="w-[180px]" variant="contained" onClick={handleCreateCertificate}>
                  Create
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Certificate */}
      <Dialog
        fullWidth={false}
        maxWidth="xs"
        onClose={(_, reason) => onCLoseDialog(setRevokeOpen, false, showProgress ? reason : false)}
        open={revokeOpen}
      >
        <DialogTitle>Revoke Certificate</DialogTitle>
        <DialogContent>
          {showProgress ? (
            <div className="flex justify-center">
              <CircularProgress />
            </div>
          ) : (
            <>
              <p className="pb-12 text-[#6B7280]">This cannot be undone. {revokeCert}</p>
              <div className="flex justify-center">
                <Button
                  className="w-[180px]"
                  variant="outlined"
                  onClick={() => {
                    setRevokeOpen(false);
                    setRevokeCert('');
                  }}
                >
                  Cancel
                </Button>
                <div className="w-[20px]">{/* spacer */}</div>
                <Button className="w-[180px]" variant="contained" onClick={handleRevokeCertificate}>
                  Revoke
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Grid>
  );
};

export default Settings;

const SettingsCard = styled(Paper)`
  padding: 24px;
  text-align: left;
  border: 0.75px solid gainsboro;
  border-radius: 8px;
  width: 1060px;
  min-height: 500px;
`;

const SettingsField = styled.div`
  display: flex;
  padding: 16px 0 16px;
  border-bottom: 1px solid gainsboro;
`;

const SettingsCertificateCard = styled.div`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 16px;
`;
