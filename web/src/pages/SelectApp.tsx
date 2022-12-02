import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Avatar, Button } from '@mui/material';
import { WalletDeployButtons } from '../components/WalletDeployButton';
import axios from 'axios';
import yaml from 'js-yaml';
import { Icon } from '../components/Icons';
import { transformSdl } from '../_helpers/helpers';
import { fetchSdlList, templateList } from '../recoil/api/sdl';
import SocialIcon from '../components/Icons/SocialIcon';
import { Template } from '../components/SdlConfiguration/settings';
import { useQuery } from 'react-query';
import { ButtonTemplate } from '../components/Button';

export interface SelectAppProps {
  folderName: string | undefined;
  onNextButtonClick: (id: string) => any;
  setFieldValue: (name: string, value: any) => void;
}

export default function SelectApp(props: SelectAppProps): JSX.Element {
  const { folderName, onNextButtonClick, setFieldValue } = props;
  const { data: directoryConfig } = useQuery(['sdlList', { folderName }], fetchSdlList, {
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const [selectedSdl, setSelectedSdl] = useState<Template>(
    directoryConfig?.topology?.topologyList?.find(
      (topology) => topology.title === directoryConfig?.topology?.selected
    )
  );

  useEffect(() => {
    setSelectedSdl(
      directoryConfig?.topology?.topologyList?.find(
        (topology) => topology.title === directoryConfig?.topology?.selected
      )
    );
  }, [directoryConfig]);

  const [social, setSocial] = useState([]);

  useEffect(() => {
    const result = [];
    if (directoryConfig?.topology?.social) {
      for (const [key, value] of Object.entries(directoryConfig?.topology.social)) {
        if (typeof value === 'string' && value.length > 0) {
          result.push({
            socialNetwork: key,
            url: value,
          });
        }
      }
      setSocial(result);
    }
  }, []);

  const selectTemplateAndFetchSdl = async (template: Template) => {
    setSelectedSdl(template);
    try {
      const response = await axios.get(template.url);
      //const configuration = await yaml.load(response.data);
      const configuration = await yaml.load(response.data);
      // We need to transform storage property to be arrayed by default to be able to add persistent storage
      setFieldValue('sdl', transformSdl(configuration));
    } catch (e) {
      new Error(e as any);
    }
  };

  return (
    <div className="container">
      <BannerImage />
      <SdlWrapper className="container">
        <SdlIntro>
          {folderName && (
            <Avatar
              src={templateList.find((template) => template.name === folderName).logo}
              alt="Logo"
            />
          )}
          <SdlInformation>
            <SdlInformationTitle>{directoryConfig?.title.name}</SdlInformationTitle>
            <SdlInformationDescription>
              {directoryConfig?.title.description}
            </SdlInformationDescription>
          </SdlInformation>
          {/* Please look at the => https://app.zenhub.com/workspaces/overclock-engineering-62633c61724345001aa75887/issues/ovrclk/console/199 */}
          {/* Also un-comment line 303 when this feature should be visible */}
          {/*<ShareButton startIcon={<Icon type="share" />} variant="outlined" size="small">*/}
          {/*  Share*/}
          {/*</ShareButton>*/}
        </SdlIntro>
        {directoryConfig?.topology && (
          <>
            <Divider />
            {directoryConfig?.topology.topologyList?.length > 1 && (
              <SdlInformationTitle fontWeight={500}>
                Choose from one of the available topology options
              </SdlInformationTitle>
            )}
            <TypologyWrapper>
              {directoryConfig?.topology.topologyList?.length > 1 &&
                directoryConfig?.topology.topologyList?.map((typology: Template) => {
                  return (
                    <WalletDeployButtons
                      key={typology.title}
                      typology={typology}
                      selected={selectedSdl}
                      onButtonSelect={selectTemplateAndFetchSdl}
                    />
                  );
                })}
            </TypologyWrapper>
            <DeployButton
              variant='contained'
              disabled={!selectedSdl}
              onClick={() => onNextButtonClick(selectedSdl.title.toLowerCase())}
            >
              Deploy Now
            </DeployButton>
          </>
        )}
        {directoryConfig?.referenceLinks && (
          <React.Fragment>
            <Divider />
            <SdlInformationTitle fontWeight={500}>Stay Tuned</SdlInformationTitle>
            <ReferenceWrapped>
              <Reference>
                <ReferenceLabel htmlFor="website">Website</ReferenceLabel>
                <SocialLink href={directoryConfig.referenceLinks?.webpage} target="_blank">
                  <span className="mr-2">
                    <Icon type="linkChain" />
                  </span>
                  <span className="overflow-hidden">{directoryConfig.referenceLinks?.webpage}</span>
                </SocialLink>
              </Reference>
              <Reference>
                <ReferenceLabel htmlFor="docs">Docs</ReferenceLabel>
                <SocialLink href={directoryConfig.referenceLinks?.docs} target="_blank">
                  <span className="mr-2">
                    <Icon type="linkChain" />
                  </span>
                  <span className="overflow-hidden">{directoryConfig.referenceLinks?.docs}</span>
                </SocialLink>
              </Reference>
              <Reference>
                <ReferenceLabel htmlFor="sdlRepo">SDL Repo</ReferenceLabel>
                <SocialLink href={directoryConfig.referenceLinks?.sdlRepo} target="_blank">
                  <span className="mr-2">
                    <Icon type="linkChain" />
                  </span>
                  <span className="overflow-hidden">{directoryConfig.referenceLinks?.sdlRepo}</span>
                </SocialLink>
              </Reference>
            </ReferenceWrapped>
            <Divider />
            <div className="flex">
              {social?.map((obj: any, i: number) => {
                return <SocialIcon key={i} socialNetwork={obj.socialNetwork} url={obj.url} />;
              })}
            </div>
          </React.Fragment>
        )}
        {directoryConfig?.promotion && (
          <>
            <Divider />
            <PromotionWrapped>
              <PromotionInformation>
                <SdlInformationTitle fontWeight={500}>
                  {directoryConfig?.promotion.title}
                </SdlInformationTitle>
                <SdlInformationDescription>
                  {directoryConfig?.promotion.description}
                </SdlInformationDescription>
                <CTAButton>CTA Promotion</CTAButton>
              </PromotionInformation>
              <PromotionImage>
                <img src={directoryConfig?.promotion.image} alt="Promotion" />
              </PromotionImage>
            </PromotionWrapped>
          </>
        )}
        {directoryConfig?.headline && (
          <>
            <Divider />
            <Headline>
              <SdlInformationTitle fontWeight={500}>
                {directoryConfig?.headline.title}
              </SdlInformationTitle>
              <SdlInformationDescription>
                {directoryConfig?.headline.description}
              </SdlInformationDescription>
              <CTAButton>Button</CTAButton>
            </Headline>
          </>
        )}
        {directoryConfig?.video && (
          <>
            <Divider />
            <VideoWrapper>
              <SdlInformationTitle fontWeight={500}>Video</SdlInformationTitle>
              <img src={directoryConfig?.video} alt="Directory config"></img>
            </VideoWrapper>
          </>
        )}
      </SdlWrapper>
    </div>
  );
}

const SocialLink = styled.a`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 4px 17px 4px 15px;
  width: 190px;
  height: 28px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  float: right;
  white-space: nowrap;

  font-family: 'Satoshi-Regular';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #6b7280;
`;

const BannerImage = styled('div')<{ bannerColor?: string }>`
  height: 200px;
  width: 100vw;
  background: ${(p) => p.bannerColor};
  background-size: cover;
  padding-top: 10%;
  position: absolute;
  left: 0;
  right: 0;
`;

const SdlWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  gap: 24px;
  position: relative;
  max-width: 929px;
  width: 100%;
  top: 100px;

  background: #ffffff;
  box-shadow: 0px 1px 3px 0px #0000001a;
  border-radius: 8px;
`;

const SdlIntro = styled.div`
  display: flex;
  align-items: start;
  width: 100%;
`;

const SdlInformation = styled.div`
  padding: 0 20px;
`;

const SdlInformationTitle = styled.h4<{ fontWeight?: number }>`
  font-weight: ${(props) => props?.fontWeight ?? 700};
  font-size: 16px;
  line-height: 24px;
  color: #111827;
`;
const SdlInformationDescription = styled.p`
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #6b7280;
`;

const TypologyWrapper = styled.div`
  display: flex;
  width: 100%;
  column-gap: 12px;
`;

const DeployButton = styled(Button)`
  align-self: end;

  &:hover {
    background-color: #925562;
  }

  &:disabled {
    color: white;
    background-color: #7e7073;
  }
`;

// const ShareButton = styled(Button)`
//   ${ButtonTemplate};
//   margin-left: auto;
// `;

const CTAButton = styled(Button)`
  ${ButtonTemplate};
`;

const Divider = styled.div`
  width: 100%;
  background: #e5e7eb;
  height: 1px;
`;

const ReferenceWrapped = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 10px;
`;

const Reference = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ReferenceLabel = styled.label`
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #6b7280;
  padding-bottom: 8px;
`;

const PromotionWrapped = styled.div`
  display: flex;
  column-gap: 30px;
`;

const PromotionInformation = styled.div`
  row-gap: 20px;
  display: flex;
  flex-direction: column;
  align-items: baseline;
`;

const PromotionImage = styled.div``;

const Headline = styled.div`
  row-gap: 20px;
  display: flex;
  flex-direction: column;
  align-items: baseline;
`;

const VideoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 30px;
  width: 100%;
`;
