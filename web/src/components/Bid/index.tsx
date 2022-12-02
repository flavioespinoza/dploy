import React from 'react';
import { Box, Chip, Radio, Button, Tooltip } from '@mui/material';
import styled from '@emotion/styled';
import { useRecoilValue } from 'recoil';
import { providerAttributes, providerInfo } from '../../recoil/atoms';
import { Address } from '../Address';
import { formatCurrency } from '../../_helpers/formatter-currency';
import { getAvgCostPerMonth } from '../../_helpers/lease-calculations';
import { useNavigate } from 'react-router-dom';
import moultireLogo from "../../assets/images/moultire-logo.svg";
import ovrclkLogo from "../../assets/images/overclk-logo.svg";
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { Hashicon } from "@emeraldpay/hashicon-react";

const auditors = {
  akash18qa2a2ltfyvkyj0ggj3hkvuj6twzyumuaru9s4: {
    name: 'Moultrie Audits Bronze',
    website: 'https://www.moultrieaudits.com/',
    logo: () => <img src={moultireLogo} alt="Moultire"/>,
  },
  akash17fqxak4kprh2rlatjlv9w04s9ugl7mn32ckut3: {
    name: 'Moultrie Audits Silver',
    website: 'https://www.moultrieaudits.com/',
    logo: () => <img src={moultireLogo} alt="Moultire"/>,
  },
  akash1365yvmc4s7awdyj3n2sav7xfx76adc6dnmlx63: {
    name: 'Overclock Labs',
    website: 'https://akash.network',
    logo: () => <img src={ovrclkLogo} alt="Overlck"/>,
  },
};

export interface BidProps {
  bid: any;
  onNextButtonClick: any;
  bidId: any;
  onClick: any;
  isSelectedProvider: boolean;
}

export const Bid: React.FC<BidProps> = (props) => {
  const {bid, onNextButtonClick, bidId} = props;
  const price = getAvgCostPerMonth(Number(bid?.price?.amount));
  const provider = useRecoilValue(providerInfo(bid.bidId.provider));
  const attributes = useRecoilValue(providerAttributes(bid.bidId.provider));
  const isAudited = attributes?.providers?.length > 0;
  const navigate = useNavigate();

  const handleOpen = () => navigate(`/provider/${provider.provider.owner}`);

  return (
    <BidWrapper onClick={props.onClick}>
      <BidHeader>
        <Radio
          checked={!!props.isSelectedProvider}
          value={provider.provider.hostUri}
        />
        {isAudited && (
          <Chip
            variant="filled"
            label="Audited"
            color="success"
            size="small"
            sx={{marginLeft: "auto", marginRight: "10px", padding: "2px"}}
          />
        )}
        <StarBorderIcon/>
      </BidHeader>
      <HashNameAndHost>
        <Hashicon value={provider?.provider.owner} size={40} />
        <Tooltip title={provider?.provider.hostUri} placement="top" arrow >
          <HashName>{provider?.provider.hostUri}</HashName>
        </Tooltip>
      </HashNameAndHost>

      <BidCost>
        Cost estimation:
        <BidValue>{`~${formatCurrency.format(price)}/month`}</BidValue>
      </BidCost>

      <BidDetail>
        <BidLabel>Address:</BidLabel>
        <Address address={provider.provider.owner}/>
      </BidDetail>
      <BidDetail>
        <BidLabel>Audited By:</BidLabel>
        {attributes?.providers
          ?.map((provider) => auditors[provider.auditor])
          .map((auditor, idx) => {
            return auditor && <BadgeBox key={`auditor-${idx}`}>{auditor?.logo()}</BadgeBox>;
          })}
      </BidDetail>

      {/* We will need this when provider return more information about his assets */}

      {/*<BidDetail>*/}
      {/*  <BidLabel>All-Time Deployments:</BidLabel>*/}
      {/*</BidDetail>*/}

      {/*<BidDetail>*/}
      {/*  <BidLabel>Active Deployments:</BidLabel>*/}
      {/*</BidDetail>*/}

      {props.isSelectedProvider && (
        <div className="flex justify-between pt-6">
          <Button
            style={{color: 'black', border: '1px solid #D1D5DB'}}
            variant="outlined"
            color="secondary"
            onClick={handleOpen}
          >
            More Info
          </Button>
          <Button variant="contained" onClick={() => onNextButtonClick && onNextButtonClick(bidId)}>
            Submit Deploy Request
          </Button>
        </div>
      )}
    </BidWrapper>
  );
};

const BidWrapper = styled.div<{ checked?: boolean }>`
  width: 400px;
  box-sizing: border-box;
  padding: 32px;
  background: #ffffff;
  border: 1px solid ${(props) => (props.checked ? '#FA5757' : '#B7C1CF')};
  box-shadow: ${(props) => (props.checked ? '0 16px 16px rgba(58, 69, 98, 0.16)' : 'none')};
  border-radius: 16px;
  flex: none;
  order: 0;
  flex-grow: 0;

  &:hover {
    border: 1px solid #fa5757;
  }
`;

const BidHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HashNameAndHost = styled.div`
  display: flex;
  align-items: center;
  column-gap: 20px;
  padding: 10px 0;
  border-bottom: 1px solid #e5e7eb;
`;

const BidCost = styled.div`
  padding: 10px 0;
`;
const BidDetail = styled.div`
  display: flex;
  border-top: 1px solid #e5e7eb;
  padding: 12px 0;
`;

const BidValue = styled.div`
  font-family: 'Satoshi-Regular', serif;
  font-style: normal;
  font-weight: 700;
  font-size: 20px;
  line-height: 26px;
  color: #111827;
`;

const BadgeBox = styled(Box)`
  border: 1px solid #ebedf3;
  border-radius: 4px;
  height: 24px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BidLabel = styled.p`
  margin-right: auto;
  padding: 0;
`;

const HashName = styled.p`
  font-family: 'Satoshi-Regular',serif;
  font-style: normal;
  font-weight: 700;
  font-size: 18px;
  line-height: 24px;
  color: #111827;
  margin-bottom: 6px;
  width: 300px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;