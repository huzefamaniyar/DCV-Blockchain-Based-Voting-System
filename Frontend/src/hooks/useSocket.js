import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

export const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return socketRef.current;
};

export const useElectionSocket = (electionId, onVoteCast, onStatusChange) => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !electionId) return;

    // Join election room
    socket.emit('join-election', electionId);

    // Listen for vote updates
    if (onVoteCast) {
      socket.on('vote-cast', onVoteCast);
    }

    // Listen for status changes
    if (onStatusChange) {
      socket.on('status-changed', onStatusChange);
    }

    // Cleanup
    return () => {
      socket.emit('leave-election', electionId);
      if (onVoteCast) {
        socket.off('vote-cast', onVoteCast);
      }
      if (onStatusChange) {
        socket.off('status-changed', onStatusChange);
      }
    };
  }, [socket, electionId, onVoteCast, onStatusChange]);

  return socket;
};

export const useDashboardSocket = (onElectionUpdate, onElectionCreated) => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Join dashboard room
    socket.emit('join-dashboard');

    // Listen for election updates
    if (onElectionUpdate) {
      socket.on('election-updated', onElectionUpdate);
    }

    // Listen for new elections
    if (onElectionCreated) {
      socket.on('election-created', onElectionCreated);
    }

    // Cleanup
    return () => {
      if (onElectionUpdate) {
        socket.off('election-updated', onElectionUpdate);
      }
      if (onElectionCreated) {
        socket.off('election-created', onElectionCreated);
      }
    };
  }, [socket, onElectionUpdate, onElectionCreated]);

  return socket;
};
