import React, { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { providerInfo } from '../../recoil/atoms';
import { useRecoilValue } from 'recoil';
import { watchLeaseEvents } from '../../recoil/api';
import { QueryLeaseResponse } from '@akashnetwork/akashjs/build/protobuf/akash/market/v1beta2/query';

export const EventsTable: React.FC<{ lease: any }> = ({ lease }) => {
  const provider = useRecoilValue(providerInfo(lease?.lease?.leaseId?.provider));
  const [rows, setRows] = useState<any[]>([]);
  const [, setLastUpdate] = useState(0);
  const address = (lease as QueryLeaseResponse).lease?.leaseId?.owner;

  useEffect(() => {
    let socket: null | WebSocket = null;

    if (!provider || !lease) {
      return;
    }

    const onMessage = (message: any) => {
      if (message.data) {
        message.data
          .text()
          .then(JSON.parse)
          .then((data) => rows.push(data)) // deliberately mutating the log to avoid feedback loop
          .then(() => setLastUpdate(Date.now()));
      }
    };

    console.log('Opening event watch socket');

    watchLeaseEvents(address, provider, lease, onMessage).then((connection) => {
      connection.onerror = (err) => {
        console.log('Error on event watch socket:', err);
      };

      socket = connection;
    });

    return () => {
      setRows([]);

      if (socket) {
        console.log('Closing event watch socket');
        socket.close();
      }
    };
  }, [lease, provider, rows, setLastUpdate]);

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>TYPE</TableCell>
            <TableCell>REASON</TableCell>
            <TableCell>NOTE</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow
              key={`event-${idx}`}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                <div>{row.type}</div>
              </TableCell>
              <TableCell>
                <div>{row.reason}</div>
              </TableCell>
              <TableCell>{row.note}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
