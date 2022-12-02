import React, { ChangeEventHandler, useState } from 'react';
import { Box, Button, Divider, Stack } from '@mui/material';
import { Bid as BidCard } from '../components/Bid';
import { fetchBidsWithAudit } from '../recoil/api';
import { Bid } from '@akashnetwork/akashjs/build/protobuf/akash/market/v1beta2/bid';
import styled from '@emotion/styled';
import Loading from '../components/Loading';
import { useQuery } from "react-query";
import CachedIcon from '@mui/icons-material/Cached';
import { WordSwitch } from "../components/Switch/WordSwitch";

export interface SelectProviderProps {
  deploymentId: { owner: string; dseq: string },
  onNextButtonClick?: (bidId: any) => void;
}

const Title = styled.h2`
  display: inline-block;
  height: 1.75rem;
`

const sortingMethods = {
  random: {
    algorithm: (ba: Bid, bb: Bid) => 0,
  },
  byPrice: {
    algorithm: (ba: Bid, bb: Bid) => (
      parseInt(ba.price.amount) - parseInt(bb.price.amount)
    ),
  }
}

const filterMethods = {
  none: {
    algorithm: (bid: any) => true
  },
  byAudit: {
    algorithm: (bid: any) => bid.auditStatus?.length > 0
  }
}

export default function SelectProvider(
  {
    onNextButtonClick,
    deploymentId
  }: SelectProviderProps): JSX.Element {

  const {data: bids, refetch} = useQuery(
    ["bids", deploymentId],
    () => fetchBidsWithAudit(deploymentId),
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      refetchInterval: 6000
    },
  );

  const [selectedProvider, setSelectedProvider] = React.useState<string>();
  const [sortMethod] = useState(sortingMethods.byPrice);
  const [filterMethod, setFilterMethod] = React.useState(filterMethods.byAudit);

  const isSelectedProvider = (providerId: string) => (
    selectedProvider && providerId === selectedProvider
  );

  const selectProvider = (providerId: string) => (evt: React.MouseEvent) => {
    evt.preventDefault();
    setSelectedProvider(providerId);
  }

  const toggleFilter: ChangeEventHandler<HTMLInputElement> = (evt) => {
    const checked = evt.target.checked;
    setFilterMethod(checked ? filterMethods.byAudit : filterMethods.none)
  }

  return (<Stack style={{width: '100%'}}>
      <Box className="flex items-center justify-between mb-2">
        <Title className="text-lg font-bold">Select a Provider</Title>
        <div className="flex items-center gap-2 p-4">
          <Button
            style={{
              height: "30px",
              backgroundColor: "white",
              border: '1px solid #D1D5DB',
              textTransform: "capitalize"
            }}
            variant="outlined"
            color="secondary"
            startIcon={<CachedIcon sx={{color: "#9CA3AF"}}/>}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <WordSwitch
            on="Only Audited"
            off="All"
            checked={filterMethod === filterMethods.byAudit}
            onChange={toggleFilter}
          />
        </div>
      </Box>
      <Divider className="mt-2 mb-4"/>
      <Box
        display="flex"
        flexDirection="row"
        alignItems="top"
        justifyContent="center"
        flexWrap="wrap"
        gap={2}
        marginTop="1rem"
      >
        {bids?.filter(filterMethod.algorithm)
          .sort(sortMethod.algorithm)
          .map((bid: any, i: number) => (
            <BidCard
              key={i}
              bid={bid}
              isSelectedProvider={isSelectedProvider(bid.bidId.provider)}
              onClick={selectProvider(bid.bidId.provider)}
              onNextButtonClick={onNextButtonClick}
              {...bid}
            />
          ))}
      </Box>
      <Loading/>
    </Stack>
  );
}
