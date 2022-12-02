import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import Long from 'long';
import { fetchDeploymentList, fetchLeaseStatus, fetchLeaseListActive, fetchDeploymentQuery } from '../recoil/api';
import { activeCertificate, aktMarketCap, keplrState } from '../recoil/atoms';
import { useQuery } from 'react-query';
import { leaseCalculator } from '../_helpers/lease-calculations';
import { uniqueName } from '../_helpers/unique-name';

interface DeploymentData {
  name: string;
  url: string;
  lease: any;
  status: number;
  dseq: string;
}

interface UseDeploymentDataProps {
  owner: string;
  dseq?: string | number;
}

export function useDeploymentDataQuery(props: UseDeploymentDataProps) {
  const { owner, dseq } = props;
  const { data: deploymentQuery } = useQuery([`deployment_${dseq}`, { owner, dseq }], fetchDeploymentQuery, {
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });
  return deploymentQuery;
}

export default function useDeploymentData(props: UseDeploymentDataProps) {
  const { owner } = props;
  const akt = useRecoilValue(aktMarketCap);
  const keplr = useRecoilValue(keplrState);
  const [deploymentsData, setDeploymentsData] = useState<Array<DeploymentData>>();
  const { data: deploymentsQuery } = useQuery(['deployments', { owner }], fetchDeploymentList, {
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });
  const { data: leasesQuery } = useQuery(['leases', { owner }], fetchLeaseListActive, {
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const certificate = useRecoilValue(activeCertificate);

  const leases = useMemo(() => leasesQuery?.leases.map((lease) => lease.lease), [leasesQuery]);

  // Setup some memoized callbacks to avoid redundant queries
  const getDeploymentLease = useCallback(
    (deployment) => {
      if (deployment.state !== 1) return;

      return leases.find((lease) => {
        return lease.leaseId.dseq.toString() === deployment.deploymentId.dseq.toString();
      });
    },
    [leases]
  );

  // Would be good to cache the provider info an pass in here to reduce RPC calls
  const getLeaseStatus = useCallback(
    (lease) => {
      if (certificate.$type === 'TLS Certificate') {
        // console.log('fetching status for lease', lease);
        return lease && fetchLeaseStatus(lease, certificate);
      }
    },
    [certificate]
  );

  useEffect(() => {
    // Map it all together, and your mother's brother is named Robert
    Promise.all(
      deploymentsQuery?.deployments.map(async (query) => {
        let name = '';
        let url = '';
        const lease = getDeploymentLease(query.deployment);
        const status = await getLeaseStatus(lease);
        const leaseInfo = leaseCalculator(
          query.deployment,
          query.escrowAccount,
          lease,
          akt?.current_price || 0
        );
        // Doing this cause dseq sometimes comes as plain object and not Long type,
        // and if that happen can't crate dseq string
        const dseq = new Long(
          query.deployment.deploymentId.dseq?.low,
          query.deployment.deploymentId.dseq?.high,
          query.deployment.deploymentId.dseq?.unsigned
        )?.toString();
        const application = JSON.parse(localStorage.getItem(dseq));
        if (application !== null && application.name !== '') {
          name = application.name;
        } else {
          name = uniqueName(keplr?.accounts[0]?.address, dseq);
        }
        if (status && status.services) {
          url = Object.values(status.services)
            .map((service) => (service as any).uris[0])
            .join(', ');
        }
        // Table row object
        return {
          name,
          dseq,
          url,
          lease: leaseInfo
            ? `Time Left: ${leaseInfo ? leaseInfo.timeLeft : 'N/A'}`
            : `Time Left: 0 days`,
          status: query.deployment.state,
        };
      })
    ).then(setDeploymentsData);
  }, [deploymentsQuery, getDeploymentLease, getLeaseStatus]);

  return deploymentsData;
}
