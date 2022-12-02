import * as React from 'react';
import { useRecoilState } from 'recoil';
import styled from '@emotion/styled';
import { Button, ButtonProps, Input } from '@mui/material';
import {
  Deployment
} from '@akashnetwork/akashjs/build/protobuf/akash/deployment/v1beta2/deployment';
import { closeDeployment } from '../../recoil/api';
import { KeplrWallet, optIntoAnalytics } from '../../recoil/atoms';
import { updateStr } from '../../_helpers/callback-utils';
import { Icon, IconType } from '../Icons';
import { Prompt } from '../Prompt';
import { pendo } from '../../recoil/api/pendo';

const InputContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 16px;
`;

export type CloseDeploymentButtonProps = React.PropsWithChildren<{
  icon?: IconType;
  deployment: Deployment;
  wallet: KeplrWallet;
} & ButtonProps>;

export const CloseDeploymentButton: React.FC<CloseDeploymentButtonProps> = (
  {
    icon,
    deployment,
    wallet,
    children,
    ...rest
  }) => {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [showProgress, setShowProgress] = React.useState(false);
  const [optInto] = useRecoilState(optIntoAnalytics);

  const onButtonClick = React.useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  const cleanupState = React.useCallback(() => {
    setOpen(false);
    setName(''); // resets the name between multiple clicks
  }, [setOpen, setName]);

  const onCancel = React.useCallback(() => {
    cleanupState();
  }, [cleanupState]);

  const onSend = React.useCallback(async () => {
    setShowProgress(true);
    if (name !== '' && name === deployment.deploymentId?.dseq.toString()) {
      await pendo(deployment.deploymentId?.dseq.low, 'close_deployment', optInto);
      await closeDeployment(wallet, deployment);
      // This is wrong
      window.location.reload();
    }
  }, [deployment, wallet, name, cleanupState]);

  return (
    <>
      <Button
        fullWidth={true}
        variant="outlined"
        color="secondary"
        aria-label="close deployment"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        sx={{
          justifyContent: 'left',
          gap: '10px',
          backgroundColor: '#FFFFFF',
          color: '#374151',
          border: '1px solid #D1D5DB',
        }}
        onClick={onButtonClick}
        {...rest}
      >
        {icon && <Icon type={icon}/>}
        {children}
      </Button>

      <Prompt
        title="Close Deployment"
        open={open}
        onClose={onCancel}
        showProgress={showProgress}
        actions={[
          {label: 'Cancel', callback: onCancel},
          {
            label: 'Close',
            callback: onSend,
            disabled: name !== deployment.deploymentId?.dseq.toString(),
          },
        ]}
      >
        <div>
          <div>
            Enter the DSEQ of the deployment ({deployment.deploymentId?.dseq.toString()}) to
            proceed.
          </div>
          <InputContainer>
            <Input type="text" placeholder="" value={name} onChange={updateStr(setName)}/>
          </InputContainer>
        </div>
      </Prompt>
    </>
  );
};
