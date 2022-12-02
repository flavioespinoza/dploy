import * as React from 'react';
import { useRecoilValue } from 'recoil';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { Alert, Button, Grid, Stack, Tooltip } from '@mui/material';
import { DeploymentEvents } from '../DeploymentEvents';
import { keplrState } from '../../recoil/atoms';
import { formatCurrency } from '../../_helpers/formatter-currency';
import { flattenObject } from '../../_helpers/flatten-object';
import fetchPriceAndMarketCap from '../../recoil/api/akt';
import { leaseCalculator } from '../../_helpers/lease-calculations';
import { QueryDeploymentResponse } from '@akashnetwork/akashjs/build/protobuf/akash/deployment/v1beta2/query';
import { FundDeploymentButton } from './FundDeploymentButton';
import { CloseDeploymentButton } from './CloseDeploymentButton';
import { CloneDeploymentButton } from './CloneDeploymentButton';
import { Address } from '../Address';
import { uniqueName } from '../../_helpers/unique-name';
import { Icon } from '../Icons';
import { useLeaseStatus } from '../../hooks/useLeaseStatus';

const Deployment: React.FC<any> = (props) => {
  const { myDeployment } = props;
  const { dseq } = useParams<any>();
  const keplr = useRecoilValue(keplrState);
  const [appName, setAppName] = React.useState('');
  const [info, setInfo] = React.useState<{ label: string; value: string }[]>([]);
  const [costLease, setCostLease] = React.useState<{ label: string; value: string | number }[]>([]);
  const [endpoints, setEndpoints] = React.useState<{ value: string }[]>([]);
  const [lease, setLease] = React.useState<any>();
  const [deployment, setDeployment] = React.useState<QueryDeploymentResponse>();
  const application = JSON.parse(localStorage.getItem(dseq));
  const navigate = useNavigate();
  const leaseStatus = useLeaseStatus(lease?.lease);

  React.useEffect(() => {
    const getDeployment = async () => {
      try {
        let _lease = {} as any;
        let flatLease = {} as any;
        let image = 'n/a';
        const owner = keplr?.accounts[0]?.address;
        const deployment = flattenObject(myDeployment.deployment) as any;
        const leases = flattenObject(myDeployment.leases) as any;
        const akt = await fetchPriceAndMarketCap();

        if (application !== null && application.image !== null && application.image !== '') {
          image = application.image;
        }

        for (const obj of leases.leases) {
          const _dseq = obj.lease.leaseId.dseq.low;
          if (_dseq === Number(dseq)) {
            _lease = obj;
            setLease(obj);
            flatLease = flattenObject(obj) as any;
          }
        }

        setDeployment(myDeployment.deployment);

        setInfo([
          {
            label: 'Status',
            value: deployment['deployment.state'] === 1 ? 'Active' : 'Not Active',
          },
          {
            label: 'Owner',
            value: owner,
          },
          {
            label: 'Image',
            value: image,
          },
        ]);

        if (flatLease['lease.leaseId.provider']) {
          const leaseCost = leaseCalculator(
            myDeployment.deployment.deployment,
            myDeployment.deployment.escrowAccount,
            _lease.lease,
            akt.current_price
          );
          setCostLease([
            {
              label: 'Provider',
              value: flatLease['lease.leaseId.provider'],
            },
            {
              label: 'Time Left',
              value: leaseCost.timeLeft,
            },
            {
              label: 'Cost/Month',
              value: `${formatCurrency.format(leaseCost.costUsd)} / ${leaseCost.costAkt} AKT`,
            },
            {
              label: 'Spent',
              value: `${formatCurrency.format(leaseCost.spentUsd)} / ${leaseCost.spentAkt} AKT`,
            },
            {
              label: 'Balance',
              value: `${formatCurrency.format(leaseCost.balanceUsd)} / ${leaseCost.balanceAkt} AKT`,
            },
          ]);
        } else {
          setCostLease([
            {
              label: 'Alert',
              value:
                'No lease data available. This happens when a deployment is created and no bid is accepted.',
            },
          ]);
        }
      } catch (error) {
        console.error(error);
      }
    };
    getDeployment();
  }, [dseq]);

  React.useEffect(() => {
    const result: any = [];
    let count = 0;
    if (leaseStatus?.services) {
      for (const [key] of Object.entries(leaseStatus.services)) {
        if (count === 0) {
          if (leaseStatus.services[key].uris && leaseStatus.services[key].uris.length > 0) {
            leaseStatus.services[key].uris.forEach((uri: string) => {
              result.push({ value: uri });
            });
            setEndpoints(result);
          }
          count++;
        }
      }
    }
  }, [leaseStatus]);

  React.useEffect(() => {
    if (application !== null && application.name !== '') {
      setAppName(application.name);
    } else {
      setAppName(uniqueName(keplr?.accounts[0]?.address, dseq));
    }
  }, []);

  // In case that current SDL is deployed from another machine, only show Tooltip and not show re-deploy page
  const ConditionalLinkReDeploy = application !== null ? Link : Tooltip;
  // In case that current SDL is deployed from another machine or status closed, only show Tooltip and not show update page
  const ConditionalLinkUpdate =
    application !== null && deployment?.deployment?.state === 1 ? Link : Tooltip;

  // prevents flashing info before redirecting
  if (!deployment?.deployment) {
    return null;
  }

  if (deployment?.deployment?.state === 1 && !lease) {
    navigate(`/configure-deployment/${dseq}`);
    return null;
  }

  return (
    <Grid container spacing={2} style={{ maxWidth: '90vw', width: '90vw', margin: 'auto' }}>
      <Grid item xs={4} style={{ maxHeight: '90vh', height: '90vh', padding: 0 }}>
        <DeploymentCard>
          <div className="flex mb-4">
            <div className="text-2xl font-bold">
              {appName} <span className="text-[#adadad] ml-2">{`(${dseq})`}</span>
            </div>
          </div>
          <DeploymentSectionWrapper>
            {endpoints.length > 0 ? (
              <a href={'http://' + endpoints[0].value} target="_blank" rel="noreferrer">
                {endpoints[0].value}
              </a>
            ) : null}
          </DeploymentSectionWrapper>
          <DeploymentSectionWrapper style={{ borderBottom: 'none' }}>
            <div className="p-3 text-lg font-bold">Actions</div>
            {deployment?.deployment && (
              <React.Fragment>
                {/* deployment?.state is 1 if it is in active state. It should be that state === 2 is in-active but i am not 100% sure */}
                <ConditionalLinkUpdate
                  title={
                    deployment?.deployment?.state !== 1
                      ? 'It is not allowed to update closed deployment'
                      : "This SDL is deployed with another tool and can't be updated from here"
                  }
                  placement="top"
                  to={`update-deployment`}
                >
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    aria-label="update deployment"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    startIcon={<Icon type="update" />}
                    sx={{
                      justifyContent: 'left',
                      gap: '10px',
                      backgroundColor: '#FFFFFF',
                      color: '#374151',
                      border: '1px solid #D1D5DB',
                      marginBottom: '12px',
                    }}
                  >
                    Update Deployment
                  </Button>
                </ConditionalLinkUpdate>
                <ConditionalLinkReDeploy
                  title="This SDL is deployed with another tool and can't be re-deployed from here"
                  placement="top"
                  to={`re-deploy`}
                >
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    aria-label="re-deploy"
                    startIcon={<Icon type="redeploy" />}
                    sx={{
                      justifyContent: 'left',
                      gap: '10px',
                      backgroundColor: '#FFFFFF',
                      color: '#374151',
                      border: '1px solid #D1D5DB',
                      marginBottom: '12px',
                    }}
                  >
                    Re-Deploy
                  </Button>
                </ConditionalLinkReDeploy>
                <CloneDeploymentButton
                  icon="clone"
                  wallet={keplr}
                  deployment={deployment.deployment}
                  style={{ marginBottom: 12 }}
                >
                  Clone Deployment
                </CloneDeploymentButton>

                {deployment?.deployment?.state === 1 && (
                  <CloseDeploymentButton
                    icon="trash"
                    wallet={keplr}
                    deployment={deployment.deployment}
                    style={{ marginBottom: 12 }}
                  >
                    Delete Deployment
                  </CloseDeploymentButton>
                )}
              </React.Fragment>
            )}
          </DeploymentSectionWrapper>
          <DeploymentSectionWrapper>
            <div className="p-3 text-lg font-bold">Info</div>
            {info.map((obj: any, i: number) => (
              <DeploymentInfo key={i}>
                {obj.label === 'Owner' ? (
                  <>
                    <div>{obj.label}:</div>
                    <Address address={obj.value} />
                  </>
                ) : (
                  <>
                    <div>{obj.label}:</div>
                    <div className="font-medium">{obj.value}</div>
                  </>
                )}
              </DeploymentInfo>
            ))}
          </DeploymentSectionWrapper>
          <DeploymentSectionWrapper style={{ borderBottom: 'none' }}>
            <div className="p-3 text-lg font-bold">Cost/Lease</div>
            {costLease.map((obj: any, i: number) => (
              <DeploymentInfo key={i}>
                {obj.label === 'Alert' ? (
                  <Alert severity="warning" variant="filled" style={{ width: '100%' }}>
                    {obj.value}
                  </Alert>
                ) : (
                  <>
                    {obj.label === 'Provider' ? (
                      <>
                        <div>{obj.label}:</div>
                        <Address address={obj.value} />
                      </>
                    ) : (
                      <>
                        <div>{obj.label}:</div>
                        <div className="font-medium">{obj.value}</div>
                      </>
                    )}
                  </>
                )}
              </DeploymentInfo>
            ))}
            {deployment?.deployment && (
              <FundDeploymentButton icon="money" deployment={deployment.deployment} wallet={keplr}>
                Add Funds
              </FundDeploymentButton>
            )}
          </DeploymentSectionWrapper>
          <DeploymentSectionWrapper style={{ borderBottom: 'none' }}>
            <div className="p-3 text-lg font-bold">Endpoints</div>
            <Stack
              spacing={2}
              sx={{ minHeight: '72px', marginBottom: '12px', paddingLeft: '12px' }}
            >
              {endpoints.map((obj: any, i: number) => (
                <a key={i} href={`http://${obj.value}`} target="_blank" rel="noreferrer">
                  {obj.value}
                </a>
              ))}
            </Stack>
          </DeploymentSectionWrapper>
        </DeploymentCard>
      </Grid>
      <Grid item xs={8} style={{ maxHeight: '90vh', height: '90vh', paddingTop: 0 }}>
        <DeploymentEventsCard>
          {dseq ? <DeploymentEvents dseq={dseq} lease={lease} leaseStatus={leaseStatus} /> : null}
        </DeploymentEventsCard>
      </Grid>
    </Grid>
  );
};

export default Deployment;

const DeploymentSectionWrapper = styled.div`
  margin-bottom: 24px;
  border-bottom: 1px solid #d1d5db;
`;

const DeploymentInfo = styled.div`
  width: 100%;
  padding: 12px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  border-top: 1px solid #d1d5db;
`;

const DeploymentCard = styled.div`
  background-color: white;
  padding: 20px 20px 6px 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  height: 100%;
  overflow: scroll;
`;

const DeploymentEventsCard = styled(DeploymentCard)`
  padding: 0;
  overflow: hidden;
`;
