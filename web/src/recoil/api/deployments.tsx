import {
  QueryClientImpl as DeploymentClient,
  QueryDeploymentRequest,
  QueryDeploymentsRequest,
} from '@akashnetwork/akashjs/build/protobuf/akash/deployment/v1beta2/query';
import {
  QueryClientImpl as ProviderClient,
  QueryProviderRequest,
} from '@akashnetwork/akashjs/build/protobuf/akash/provider/v1beta2/query';
import {
  QueryBidsRequest,
  QueryClientImpl as MarketClient,
  QueryLeaseRequest,
  QueryLeasesRequest,
} from '@akashnetwork/akashjs/build/protobuf/akash/market/v1beta2/query';
import {
  MsgCloseDeployment,
  MsgCreateDeployment,
  MsgDepositDeployment,
  MsgUpdateDeployment,
} from '@akashnetwork/akashjs/build/protobuf/akash/deployment/v1beta2/deploymentmsg';
import { getMsgClient, getRpc } from '@akashnetwork/akashjs/build/rpc';
import { leaseEventsPath, leasePath, leaseStatusPath, serviceLogsPath, submitManifestPath } from './paths';
import { KeplrWallet, rpcEndpoint } from '../atoms';
import {
  Lease,
  MsgCreateLease,
} from '@akashnetwork/akashjs/build/protobuf/akash/market/v1beta2/lease';
import { loadActiveCertificate, TLSCertificate } from './certificates';
import { mtlsFetch, proxyWSS } from './mtls';
import { getTypeUrl } from '@akashnetwork/akashjs/build/stargate';
import {
  DeploymentGroups,
  getCurrentHeight,
  Manifest,
  ManifestVersion,
} from '../../_helpers/deployments-utils';
import { wait } from '../../_helpers/helpers';
import { Deployment } from '@akashnetwork/akashjs/build/protobuf/akash/deployment/v1beta2/deployment';
import { Bid, BidID } from '@akashnetwork/akashjs/build/protobuf/akash/market/v1beta2/bid';
import { fetchRpcNodeStatus } from './rpc';
import { LeaseStatus } from '../../types';
import { fetchProviderAttributes } from './providers';

// 5AKT aka 5000000uakt
export const defaultInitialDeposit = 5000000;

export const fetchDeploymentQuery = async (params) => {
  const [, { owner, dseq}] = params.queryKey;
  const rpc = await getRpc(rpcEndpoint);
  const client = new DeploymentClient(rpc);

  const request = QueryDeploymentRequest.fromJSON({
    id: {
      owner: owner,
      dseq: dseq,
    },
  });

  const deployment = await client.Deployment(request);
  const leases = await fetchLease({ owner, dseq });

  return {
    deployment,
    leases,
  };
};

export const fetchDeployment = async (owner: string, dseq: string | undefined) => {
  // @fix : rpcEndpoint: change to envar
  const rpcEndpoint = 'https://rpc.akash.forbole.com:443/';
  const rpc = await getRpc(rpcEndpoint);
  const client = new DeploymentClient(rpc);

  const request = QueryDeploymentRequest.fromJSON({
    id: {
      owner: owner,
      dseq: dseq,
    },
  });

  const deployment = await client.Deployment(request);
  const leases = await fetchLease({ owner, dseq });

  return {
    deployment,
    leases,
  };
};

export const fetchDeploymentCount = async (
  filters: {
    owner?: string;
  },
  rpcEndpoint: string
) => {
  const pagination = {
    countTotal: true,
    limit: 1,
  };
  const rpc = await getRpc(rpcEndpoint);
  const client = new DeploymentClient(rpc);
  const response = await client.Deployments(
    QueryDeploymentsRequest.fromPartial({ pagination, filters })
  );
  return Number(response?.pagination?.total?.toString());
};

export const fetchDeploymentList = async (params) => {
  const [, { owner, state, dseq }] = params.queryKey;
  const pagination = {
    limit: 100,
  };
  const filters = {
    owner,
    state,
    dseq,
  };
  const deploymentCount = await fetchDeploymentCount({ owner: filters.owner }, rpcEndpoint);
  if (deploymentCount > 100) {
    pagination.limit = deploymentCount;
  }
  const rpc = await getRpc(rpcEndpoint);
  const client = new DeploymentClient(rpc);

  return client.Deployments(QueryDeploymentsRequest.fromPartial({ pagination, filters }));
};

export const fetchBidsList = async (
  filters: { owner: string; dseq: string },
  rpcEndpoint: string
) => {
  const rpc = await getRpc(rpcEndpoint);
  const client = new MarketClient(rpc);

  return client.Bids(QueryBidsRequest.fromJSON({ filters }));
};

export const fetchBidsWithAudit = ({ owner, dseq }) => {
  return fetchBidsList({ owner, dseq }, rpcEndpoint).then((result) =>
    Promise.all(
      result.bids
        .filter((bid) => bid.bid)
        .map((resp) => Bid.toJSON(resp.bid))
        .map((bid: any) =>
          fetchProviderAttributes({ owner: bid.bidId.provider }, rpcEndpoint).then((attrResp) => ({
            auditStatus: attrResp.providers,
            ...bid,
          }))
        )
    )
  );
};

export const fetchLeaseListActive = async (params) => {
  const [, { owner }] = params.queryKey;
  const rpc = await getRpc(rpcEndpoint);
  const client = new MarketClient(rpc);

  return client.Leases(
    QueryLeasesRequest.fromPartial({
      filters: { owner, state: 'active' },
      pagination: { limit: 5000 },
    })
  );
};

export const fetchLease = async (params) => {
  const { owner, dseq } = params;
  const rpc = await getRpc(rpcEndpoint);
  const client = new MarketClient(rpc);

  return client.Leases(QueryLeasesRequest.fromPartial({ filters: { owner, dseq } }));
};

export const fetchLeaseStatus = async (lease: any, cert: TLSCertificate) => {
  if (!lease || !lease.leaseId) return;

  const leaseId = {
    dseq: lease.leaseId.dseq.low,
    gseq: lease.leaseId.gseq,
    oseq: lease.leaseId.oseq,
  }

  const url = leaseStatusPath(leaseId);
  const rpc = await getRpc(rpcEndpoint);
  const client = new ProviderClient(rpc);
  const request = QueryProviderRequest.fromPartial({
    owner: lease.leaseId.provider,
  });

  const provider: any = await client.Provider(request);
  const providerFetch = mtlsFetch(cert, provider.provider.hostUri);

  return providerFetch(url).then(
    (response) => response.ok && response.json(),
    (err) => {
      console.log(err);
      return null;
    }
  ) as Promise<LeaseStatus>;
};

export const watchLeaseLogs = async (address: string, provider: any, lease: any, message: any) => {
  const leaseId = {
    dseq: lease.leaseId.dseq.low,
    gseq: lease.leaseId.gseq,
    oseq: lease.leaseId.oseq,
  }
  const cert = await loadActiveCertificate(address);
  const url = serviceLogsPath(leaseId);
  const providerUri = new URL(provider.provider.hostUri);
  const upstream = `upstream/${providerUri.hostname}:${providerUri.port}`;
  const socket = new WebSocket(`${proxyWSS}/${upstream}/${url}?follow=true`, ['log-protocol']);

  if (cert.$type !== 'TLS Certificate') {
    return Promise.reject('No certificate available');
  }

  socket.onopen = () => {
    socket.send(createCertificateMessage(cert));
  };

  socket.onmessage = message;

  return socket;
};

export const watchLeaseEvents = async (
  address: string,
  provider: any,
  lease: any,
  message: any
) => {
  const obj: any = Lease.toJSON(lease.lease);
  const cert = await loadActiveCertificate(address);
  const url = leaseEventsPath(obj.leaseId);

  const providerUri = new URL(provider.provider.hostUri);
  const upstream = `upstream/${providerUri.hostname}:${providerUri.port}`;

  if (cert.$type !== 'TLS Certificate') {
    return Promise.reject('No certificate available');
  }

  const socket = new WebSocket(`${proxyWSS}/${upstream}/${url}?follow=true`, ['event-protocol']);

  socket.onopen = () => {
    socket.send(createCertificateMessage(cert));
  };

  socket.onmessage = message;

  return socket;
};

function createCertificateMessage(cert: TLSCertificate): string {
  return JSON.stringify({
    type: 'certificate',
    certificate: {
      csr: cert.csr,
      privateKey: cert.privateKey,
    },
  });
}

export async function fundDeployment(
  wallet: KeplrWallet,
  deployment: Deployment,
  quantity: number
) {
  const { deploymentId } = deployment;
  const [account] = wallet.accounts;
  const signer = wallet.offlineSigner;

  if (!signer || !deploymentId) return;

  const client = await getMsgClient(rpcEndpoint, signer);
  const amount = {
    denom: 'uakt',
    amount: quantity.toString(),
  };

  const msg = {
    typeUrl: getTypeUrl(MsgDepositDeployment),
    value: MsgDepositDeployment.fromPartial({
      id: deploymentId,
      depositor: account.address,
      amount,
    }),
  };

  return client.signAndBroadcast(
    account.address,
    [msg],
    'auto',
    `Send ${(quantity / 10 ** 6).toFixed(2)} AKT to deployment`
  );
}

export async function closeDeployment(wallet: KeplrWallet, deployment: Deployment) {
  const { deploymentId } = deployment;
  const [account] = wallet.accounts;
  const signer = wallet.offlineSigner;

  if (!signer || !deploymentId) return;

  const client = await getMsgClient(rpcEndpoint, signer);
  const msg = {
    typeUrl: getTypeUrl(MsgCloseDeployment),
    value: MsgCloseDeployment.fromPartial({
      id: deploymentId,
    }),
  };

  return client.signAndBroadcast(account.address, [msg], 'auto', 'Close deployment');
}

export async function createDeployment(wallet: KeplrWallet, sdl: any) {
  const [account] = wallet.accounts;
  const signer = wallet.offlineSigner;
  const status = await fetchRpcNodeStatus(rpcEndpoint);
  if (!signer) return;

  const client = await getMsgClient(rpcEndpoint, signer);

  const groups = DeploymentGroups(sdl);
  const mani = Manifest(sdl, true);
  const ver = await ManifestVersion(mani);

  const msg = {
    typeUrl: getTypeUrl(MsgCreateDeployment),
    value: MsgCreateDeployment.fromPartial({
      // Group find in SDL
      id: {
        owner: account.address,
        dseq: status.sync_info.latest_block_height,
      },
      groups: groups,
      deposit: {
        denom: 'uakt',
        amount: '5000000',
      },
      // Version is actually a checksum of SDL yaml file converted
      version: ver,
      depositor: account.address,
    }),
  };

  return {
    deploymentId: {
      owner: account.address,
      dseq: status.sync_info.latest_block_height,
    },
    tx: await client.signAndBroadcast(account.address, [msg], 'auto', 'Creating the deployment'),
  };
}

export async function updateDeployment(wallet: KeplrWallet, deploymentId: any, sdl: any) {
  const [account] = wallet.accounts;
  const signer = wallet.offlineSigner;

  if (!signer) return;

  const client = await getMsgClient(rpcEndpoint, signer);
  const mani = Manifest(sdl, true);
  const ver = await ManifestVersion(mani);

  const msg = {
    typeUrl: getTypeUrl(MsgUpdateDeployment),
    value: MsgUpdateDeployment.fromPartial({
      id: deploymentId,
      version: ver,
    }),
  };

  return {
    deploymentId,
    tx: await client.signAndBroadcast(account.address, [msg], 'auto', 'Update the deployment'),
  };
}

export async function createLease(wallet: KeplrWallet, bidId: BidID) {
  const [account] = wallet.accounts;
  const signer = wallet.offlineSigner;

  if (!signer || !bidId) return;

  const client = await getMsgClient(rpcEndpoint, signer);
  const msg = {
    typeUrl: getTypeUrl(MsgCreateLease),
    value: MsgCreateLease.fromJSON({
      bidId,
    }),
  };

  await client.signAndBroadcast(account.address, [msg], 'auto', 'Create lease for deployment');

  const rpc = await getRpc(rpcEndpoint);
  const queryClient = new MarketClient(rpc);
  const qmsg = QueryLeaseRequest.fromJSON({ id: bidId });

  return queryClient.Lease(qmsg).then((response) => response.lease);
}

export async function sendManifest(address: string, lease: Lease, sdl: any) {
  const obj: any = Lease.toJSON(lease);
  const dseq = `${lease?.leaseId?.dseq?.low}`;
  const url = submitManifestPath(dseq);
  const cert = await loadActiveCertificate(address);

  if (cert.$type !== 'TLS Certificate') {
    return Promise.reject('No certificate available');
  }

  // Wait 5 seconds for provider to have lease
  await wait(5000);

  const rpc = await getRpc(rpcEndpoint);
  const client = new ProviderClient(rpc);
  const request = QueryProviderRequest.fromPartial({
    owner: obj.leaseId.provider,
  });

  const provider: any = await client.Provider(request);
  const providerFetch = mtlsFetch(cert, provider.provider.hostUri);
  const manifest = Manifest(sdl, true);

  let jsonStr = JSON.stringify(manifest);

  jsonStr = jsonStr.replaceAll('"quantity":{"val', '"size":{"val');
  jsonStr = jsonStr.replaceAll('"mount":', '"readOnlyTmp":');
  jsonStr = jsonStr.replaceAll('"readOnly":', '"mount":');
  jsonStr = jsonStr.replaceAll('"readOnlyTmp":', '"readOnly":');

  return providerFetch(url, {
    method: 'PUT',
    body: jsonStr,
  });
}

export async function newDeploymentData(
  apiEndpoint,
  yamlJson,
  dseq,
  fromAddress,
  deposit = defaultInitialDeposit,
  depositorAddress = null
) {
  const groups = DeploymentGroups(yamlJson);
  const mani = Manifest(yamlJson);
  const ver = await ManifestVersion(mani);
  const id = {
    owner: fromAddress,
    dseq: dseq,
  };
  const _deposit = {
    denom: 'uakt',
    amount: deposit.toString(),
  };

  if (!id.dseq) {
    id.dseq = await getCurrentHeight(apiEndpoint);
  }

  return {
    sdl: yamlJson,
    manifest: mani,
    groups: groups,
    deploymentId: id,
    orderId: [],
    leaseId: [],
    version: ver,
    deposit: _deposit,
    depositor: depositorAddress || fromAddress,
  };
}
