import React, { useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  StepLabel,
  Step,
  Stepper,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Slide,
  Stack,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import { deploymentSdl, keplrState, myDeployments as myDeploymentsAtom } from '../../recoil/atoms';
import { createDeployment, createLease, sendManifest } from '../../recoil/api';
import Keplr from '../KeplrLogin';
import { Dialog } from '../Dialog';
import FeaturedApps from '../../pages/FeaturedApps';
import SelectApp from '../../pages/SelectApp';
import SelectProvider from '../../pages/SelectProvider';
import { ConfigureApp } from '../../pages/ConfigureApp';
import { PreflightCheck } from '../../pages/PreflightCheck';
import { nameToURI, uriToName } from '../../_helpers/param-helpers';
import { initialValues, InitialValuesProps } from '../SdlConfiguration/settings';
import { myDeploymentFormat } from '../../_helpers/my-deployment-utils';

const steps = ['Featured Apps', 'Select', 'Configure', 'Review', 'Deploy'];

export interface DeploymentStepperProps {
  dseq?: string;
  leaseId?: string;
}

const DeploymentStepper: React.FC<DeploymentStepperProps> = () => {
  const keplr = useRecoilValue(keplrState);
  const navigate = useNavigate();
  const [deploymentId, setDeploymentId] = React.useState<{ owner: string; dseq: string }>();
  const { folderName, templateId, intentId, dseq } = useParams();
  const [sdl, setSdl] = useRecoilState(deploymentSdl);
  const [progressVisible, setProgressVisible] = useState(false);
  const [cardMessage, setCardMessage] = useState('');
  const [activeStep, setActiveStep] = useState({ currentCard: 0 });
  const [open, setOpen] = React.useState(false);
  const [errorTitle, setErrorTitle] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState(null);
  const [myDeployments, setMyDeployments] = useRecoilState(myDeploymentsAtom);

  React.useEffect(() => {
    const params = [folderName, uriToName(templateId), intentId];
    const index = params
      .map((x) => {
        return x !== undefined ? (1 as number) : (0 as number);
      })
      .reduce((a, b) => a + b);
    setActiveStep({ currentCard: index });
  }, [folderName, templateId, intentId]);

  React.useEffect(() => {
    if (dseq) {
      setDeploymentId({
        owner: keplr.accounts[0].address,
        dseq,
      });
      setActiveStep({ currentCard: 4 });
      return;
    }
  }, [dseq, keplr]);

  const selectFolder = (folderName: string) => {
    navigate(`/new-deployment/${nameToURI(folderName)}`);
  };

  const selectTemplate = (templateId: string) => {
    navigate(`/new-deployment/${nameToURI(folderName)}/${nameToURI(templateId)}`);
  };

  const handlePreflightCheck = (intentId: string) => {
    navigate(`/new-deployment/${nameToURI(folderName)}/${nameToURI(templateId)}/${intentId}`);
  };

  const handleReset = () => setActiveStep({ currentCard: 0 });

  const handleDeployment = (key: string, deployment: any) => {
    const newDeployments = { ...myDeployments };
    newDeployments[key] = deployment;
    setMyDeployments(newDeployments);
  };

  const acceptBid = async (bidId: any) => {
    setProgressVisible(true);
    setCardMessage('Creating lease');
    try {
      const lease = await createLease(keplr, bidId);
      if (lease) {
        setCardMessage('Sending manifest');
        sendManifest(keplr.accounts[0].address, lease, sdl)
          .then(
            () => setActiveStep({ currentCard: 5 }),
            () => setActiveStep({ currentCard: 5 })
          )
          .finally(() => navigate(`/my-deployments/${dseq}`));
      } else {
        setCardMessage('Could not create lease.');
      }
    } catch (error) {
      await handleError(error, 'acceptBid');
    }
  };

  // Error handling dialog
  const handleClose = (reason: string) => {
    if (reason === 'closeButtonClick') {
      setOpen(false);
    }
  };

  const handleError = async (error: Error, method: string) => {
    let title = 'Error';
    let message = 'An error occurred while sending your request.';
    if (method === 'acceptBid') {
      title = 'Error Select Provider';
      message = 'An error occurred while selecting a provider.';
    }
    if (method === 'createDeployment') {
      title = 'Error Create Deployment';
      message = 'An error occurred while trying to deploy.';
      if (error.message.includes('Query failed with (6)')) {
        message = `There was an RPC error. This may happen during upgrades to the Akash Network.`;
      }
    }
    setErrorTitle(title);
    setErrorMessage(message);
    setProgressVisible(false);
    setCardMessage('');
    setOpen(true);
    throw new Error(`${method}: ${error.message}`);
  };

  return (
    <Box sx={{ width: '100%', minHeight: '450px', marginBottom: '25px' }}>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        onSubmit={async (value: InitialValuesProps) => {
          // the onSubmit method is called from the component PreflightCheck.
          // it uses the useFormikContext hook.
          // const { submitForm } = useFormikContext();
          console.log('value :', value);

          setProgressVisible(true);
          setCardMessage('Creating deployment');
          try {
            const result = await createDeployment(keplr, value.sdl);
            if (result.deploymentId) {
              setDeploymentId(result.deploymentId);
              setSdl(value.sdl);
              setProgressVisible(false);
              navigate(`/configure-deployment/${result.deploymentId.dseq}`);

              // set deployment to localStorage object using Atom
              const _deployment = await myDeploymentFormat(result, value);
              handleDeployment(_deployment.key, JSON.stringify(_deployment.data));

              // set deployment to localStorage item by dseq (deprecate ?)
              localStorage.setItem(_deployment.key, JSON.stringify(_deployment.data));
            }
          } catch (error) {
            await handleError(error, 'createDeployment');
          }
        }}
      >
        {({ setFieldValue }) => {
          return (
            <>
              <Stepper activeStep={activeStep.currentCard} sx={{ mb: '20px' }}>
                {steps.map((label) => {
                  const stepProps: { completed?: boolean } = {};
                  const labelProps: {
                    optional?: React.ReactNode;
                  } = {};
                  return (
                    <Step key={label} {...stepProps}>
                      <StepLabel {...labelProps}>{label}</StepLabel>
                    </Step>
                  );
                })}
              </Stepper>

              {progressVisible && (
                <Box sx={{ minWidth: 600 }}>
                  <Card>
                    <CardContent
                      style={{
                        textAlign: 'center',
                        marginTop: '100px',
                        marginBottom: '100px',
                      }}
                    >
                      <Slide direction="up" in={progressVisible} unmountOnExit>
                        <Stack sx={{ width: '100%', color: 'grey.700' }} spacing={2}>
                          <Typography variant="h3">{cardMessage}</Typography>
                          <LinearProgress />
                        </Stack>
                      </Slide>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {activeStep.currentCard === steps.length
                ? null
                : !progressVisible && (
                    <React.Fragment>
                      {activeStep.currentCard === 0 && (
                        <FeaturedApps
                          onDeployNowClick={(folderName) => {
                            selectFolder(folderName);
                          }}
                          callback={(sdl) =>
                            navigate(`/new-deployment/custom-sdl`, { state: { sdl: sdl } })
                          }
                          setFieldValue={setFieldValue}
                        />
                      )}
                      {activeStep.currentCard === 1 && (
                        <SelectApp
                          folderName={uriToName(folderName)}
                          setFieldValue={setFieldValue}
                          onNextButtonClick={selectTemplate}
                        />
                      )}
                      {activeStep.currentCard === 2 && (
                        <ConfigureApp
                          folderName={uriToName(folderName)}
                          templateId={uriToName(templateId)}
                          onNextButtonClick={handlePreflightCheck}
                        />
                      )}
                      {activeStep.currentCard === 3 && <PreflightCheck />}
                      {activeStep.currentCard === 4 && deploymentId && (
                        <Keplr>
                          <SelectProvider
                            deploymentId={deploymentId}
                            onNextButtonClick={(bidId: any) => acceptBid(bidId)}
                          />
                        </Keplr>
                      )}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          pt: 2,
                        }}
                      >
                        <Box sx={{ flex: '1 1 auto' }} />
                        {activeStep.currentCard === steps.length - 1 ? (
                          <Button
                            variant="contained"
                            onClick={handleReset}
                            style={{ color: 'white' }}
                          >
                            Deploy Another App
                          </Button>
                        ) : null}
                      </Box>
                    </React.Fragment>
                  )}
            </>
          );
        }}
      </Formik>
      <Dialog open={open} onClose={handleClose} title={errorTitle} message={errorMessage} />
    </Box>
  );
};

export default DeploymentStepper;
