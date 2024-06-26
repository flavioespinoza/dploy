import React from 'react';
import { useRecoilValue } from 'recoil';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { providerInfo } from '../../recoil/atoms';
import { DeploymentMissing } from '../SdlConfiguration/DeploymentMissing';

interface LeaseProps {
  dseq: string;
  lease: any;
}

export const Leases: React.FC<LeaseProps> = ({ dseq, lease }) => {
  const [providerDetails, setProviderDetails] = React.useState([]);
  const [status, setStatus] = React.useState([]);
  const [, setCapabilities] = React.useState([]);
  const [dataCenter, setDataCenter] = React.useState([]);
  const [network, setNetwork] = React.useState([]);
  const [details, setDetails] = React.useState([]);
  const [capacity, setCapacity] = React.useState([]);
  const [, setInfo] = React.useState([]);
  const provider = useRecoilValue(providerInfo(lease?.lease?.leaseId?.provider));
  const application = JSON.parse(localStorage.getItem(dseq));
  const attributes = provider?.provider?.attributes as any;

  React.useEffect(() => {
    const formatData = async () => {
      try {
        if (attributes) {
          const _attributes = {} as any;
          const _capabilities = [] as any;
          for (const attribute of attributes) {
            if (attribute.key.includes('capabilities')) {
              _capabilities.push({ key: attribute.key, value: attribute.value });
            } else {
              _attributes[attribute.key] = attribute.value;
            }
          }
          setProviderDetails([
            { label: 'Name', value: _attributes?.organization },
            { label: 'Region', value: _attributes?.region },
            { label: 'Provider Address', value: provider?.provider?.owner },
          ]);
          setStatus([
            { label: 'Organization', value: _attributes?.organization },
            { label: 'Status', value: _attributes?.status },
            { label: 'Auditors', value: null },
          ]);
          setCapabilities(_capabilities);
          setDataCenter([
            { label: 'Data Center', value: _attributes?.data_center },
            { label: 'Generation', value: _attributes?.generation },
            { label: 'Host URI', value: provider?.provider?.hostUri },
          ]);
          setNetwork([
            { label: 'Network Download', value: _attributes?.network_download },
            { label: 'Network Upload', value: _attributes?.network_upload },
            { label: 'CPU', value: _attributes?.cpu },
          ]);
          setDetails([
            { label: 'GSEQ', value: lease?.lease?.leaseId?.gseq },
            { label: 'OSEQ', value: lease?.lease?.leaseId?.oseq },
            { label: 'OSEQ', value: dseq },
          ]);
          setCapacity([
            { label: 'Virtual CPUs', value: application?.cpu },
            { label: 'Memory', value: application?.memory },
            { label: 'Storage', value: application?.storage },
          ]);
          setInfo([
            { label: 'Email', value: provider?.provider?.info?.email },
            { label: 'Website', value: provider?.provider?.info?.website },
          ]);
        }
      } catch (error) {
        console.error(error);
      }
    };
    formatData();
  }, [dseq]);

  return (
    <div>
      {application === null ? (
        <div className="p-12">
          <DeploymentMissing dseq={dseq} />
        </div>
      ) : (
        <Box sx={{ flexGrow: 1, backgroundColor: 'pink', padding: 0 }}>
          <Grid container spacing={0} sx={{ backgroundColor: '#F9FAFB' }}>
            <Grid item xs={6}>
              <Item>
                <Stack
                  direction="column"
                  justifyContent="center"
                  alignItems="stretch"
                  spacing={0.5}
                >
                  <Title>Provider Details</Title>
                  <Divider />
                  {providerDetails.map((obj: any, i: number) => {
                    return (
                      <div key={i}>
                        <Label>{obj.label}</Label>
                        <Value>{obj.value ? obj.value : 'n/a'}</Value>
                      </div>
                    );
                  })}
                </Stack>
              </Item>
            </Grid>
            <Grid item xs={6}>
              <Item>
                <Stack
                  direction="column"
                  justifyContent="center"
                  alignItems="stretch"
                  spacing={0.5}
                >
                  <Title>Provider Details</Title>
                  <Divider />
                  {status.map((obj: any, i: number) => {
                    return (
                      <div key={i}>
                        <Label>{obj.label}</Label>
                        <Value>{obj.value ? obj.value : 'n/a'}</Value>
                      </div>
                    );
                  })}
                </Stack>
              </Item>
            </Grid>
          </Grid>
          <Grid container spacing={0} sx={{ backgroundColor: '#FFFFFF' }}>
            <Grid item xs={6}>
              <Item>
                <Stack
                  direction="column"
                  justifyContent="center"
                  alignItems="stretch"
                  spacing={0.5}
                >
                  <Title>Attributes</Title>
                  <Divider />
                  {dataCenter.map((obj: any, i: number) => {
                    return (
                      <div key={i}>
                        <Label>{obj.label}</Label>
                        <Value>{obj.value ? obj.value : 'n/a'}</Value>
                      </div>
                    );
                  })}
                </Stack>
              </Item>
            </Grid>
            <Grid item xs={6}>
              <Item>
                <Stack
                  direction="column"
                  justifyContent="center"
                  alignItems="stretch"
                  spacing={0.5}
                >
                  <Title>Network</Title>
                  <Divider />
                  {network.map((obj: any, i: number) => {
                    return (
                      <div key={i}>
                        <Label>{obj.label}</Label>
                        <Value>{obj.value ? obj.value : 'n/a'}</Value>
                      </div>
                    );
                  })}
                </Stack>
              </Item>
            </Grid>
          </Grid>
          <Grid container spacing={0} sx={{ backgroundColor: '#F9FAFB' }}>
            <Grid item xs={6}>
              <Item>
                <Stack
                  direction="column"
                  justifyContent="center"
                  alignItems="stretch"
                  spacing={0.5}
                >
                  <Title>Details</Title>
                  <Divider />
                  {details.map((obj: any, i: number) => {
                    return (
                      <div key={i}>
                        <Label>{obj.label}</Label>
                        <Value>{obj.value ? obj.value : 'n/a'}</Value>
                      </div>
                    );
                  })}
                </Stack>
              </Item>
            </Grid>
            <Grid item xs={6}>
              <Item>
                <Stack
                  direction="column"
                  justifyContent="center"
                  alignItems="stretch"
                  spacing={0.5}
                >
                  <Title>Capacity</Title>
                  <Divider />
                  {capacity.map((obj: any, i: number) => {
                    return (
                      <div key={i}>
                        <Label>{obj.label}</Label>
                        <Value>{obj.value ? obj.value : 'n/a'}</Value>
                      </div>
                    );
                  })}
                </Stack>
              </Item>
            </Grid>
          </Grid>
        </Box>
      )}
    </div>
  );
};

const Item = styled.div`
  width: 100%;
  padding: 24px;
  background-color: transparent;
`;

const Title = styled.div`
  font-family: 'Satoshi-Regular';
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  color: #111827;
`;

const Label = styled.span`
  width: 132px;
  float: left;
  padding-top: 4px;
  padding-bottom: 4px;
  font-family: 'Satoshi-Regular';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #6b7280;
`;

const Value = styled.span`
  float: left;
  padding-top: 4px;
  padding-bottom: 4px;
  font-family: 'Satoshi-Regular';
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #111827;
`;
