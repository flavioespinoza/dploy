import React, { useEffect } from 'react';
import { SigningCosmosClient } from '@cosmjs/launchpad';
import { useRecoilState } from 'recoil';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import KeplrLogo from '../../assets/images/keplr-logo.jpeg';
import { loadActiveCertificate } from '../../recoil/api';
import { activeCertificate, keplrState as keplrStateAtom } from '../../recoil/atoms';
import { List, ListItem, ListItemText } from '@mui/material';

interface KeplrProps {
  children?: React.ReactNode;
}

export default function Keplr(props: KeplrProps) {
  const { children } = props;
  const [isOpen, setIsOpen] = React.useState(false);
  const [keplrState, setKeplrState] = useRecoilState(keplrStateAtom);
  const [, setActiveCert] = useRecoilState(activeCertificate);
  const { isSignedIn } = keplrState;

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let active = true;

    const fetchKeplr = async () => {
      setTimeout(async () => {
        // wait until window load, so we can check to see if keplr was injected into the browser
        if (!(window as any).keplr) {
          setIsOpen(true);
        } else if (!isSignedIn && window.keplr) {

          const chainId = 'akashnet-2';
          const keplr = window.keplr;

          // Enabling before using the Keplr is recommended.
          // This method will ask the user whether to allow access if they haven't visited this website.
          // Also, it will request that the user unlock the wallet if the wallet is locked.
          await keplr.enable(chainId);

          const offlineSigner = keplr.getOfflineSigner(chainId);

          // You can get the address/public keys by `getAccounts` method.
          // It can return the array of address/public key.
          // But, currently, Keplr extension manages only one address/public key pair.
          // XXX: This line is needed to set the sender address for SigningCosmosClient.
          const accounts = await offlineSigner.getAccounts();

          // Initialize the gaia api with the offline signer that is injected by Keplr extension.
          const cosmJS = new SigningCosmosClient(
            'https://rpc.akash.forbole.com:443',
            accounts[0].address,
            offlineSigner
          );

          setActiveCert(await loadActiveCertificate(accounts[0].address));

          setKeplrState({
            accounts: [...accounts],
            offlineSigner: offlineSigner,
            cosmosClient: cosmJS,
            isSignedIn: true,
            file: 'components/KeplrLogin',
          });
        }
      }, 0);
    };

    // Fetch Keplr
    fetchKeplr();

    // Clean up
    return () => {
      active = false;
    };
  }, [keplrState]);

  return (
    <div>

      {isSignedIn ? children : null}

      {/* Modal to install Keplr Chrome extension */}
      <Dialog onClose={handleClose} open={isOpen}>
        <DialogTitle>Install Keplr Wallet Extension for Chrome</DialogTitle>
        <List sx={{ pt: 0 }}>
          <ListItem>
            <ListItemAvatar>
              <img src={KeplrLogo} width="48" alt="Keplr Logo" />
            </ListItemAvatar>
            <a
              className="ml-3"
              href="https://help.keplr.app/getting-started/installing-keplr-wallet"
              onClick={handleClose}
            >
              <ListItemText primary="View it in the Chrome Web Store" />
            </a>
          </ListItem>
        </List>
      </Dialog>
    </div>
  );
}
