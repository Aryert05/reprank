import { useCallback, useEffect, useRef, useState } from 'react';
import { closeChatSocket, getChatSocket } from '../services/chatSocket.js';

// Identifies a chat message so the same one is never listed twice.
function messageKey(message) {
  return `${message?.timestamp}|${message?.username}|${message?.message}`;
}

// Experiment 8: Custom Hook that owns the real-time chat connection.
//
// It wraps the Socket.IO client in the same style as the other custom hooks
// in this project (useFetch / useForm / useToast): the hook owns the state
// and the effect, the page component only renders.
//
// The socket itself lives in a module-level singleton (services/chatSocket.js)
// so it is created once and reused, and it is closed when the component
// unmounts so no connection is left dangling.
export function useChat() {
  const [status, setStatus] = useState('connecting'); // connecting | connected | disconnected
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getChatSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      setStatus('connected');
      setError('');
    };

    const handleDisconnect = () => {
      setStatus('disconnected');
    };

    const handleConnectError = (err) => {
      setStatus('disconnected');
      setError(err?.message || 'Could not reach the chat server. Retrying...');
    };

    // A message broadcast by the server (including our own, echoed back).
    const handleMessage = (payload) => {
      if (!payload?.message) return;
      setMessages((current) => [...current, payload]);
    };

    // The recent real messages the server already has, sent on connect.
    // Merged into the local list instead of replacing it, so reconnecting
    // (after a drop or a server restart) never wipes messages the user can
    // already see. Messages are de-duplicated by timestamp + author + text.
    const handleHistory = (payload) => {
      if (!Array.isArray(payload)) return;

      setMessages((current) => {
        const seen = new Set(current.map(messageKey));
        const merged = [...current];

        for (const message of payload) {
          if (!message?.message) continue;
          const key = messageKey(message);
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(message);
        }

        return merged;
      });
    };

    const handleUsers = (payload) => {
      setUsers(Array.isArray(payload?.users) ? payload.users : []);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('chatMessage', handleMessage);
    socket.on('chatHistory', handleHistory);
    socket.on('chatUsers', handleUsers);

    // If the socket was already connected (e.g. re-mounted), reflect it now.
    if (socket.connected) setStatus('connected');

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('chatMessage', handleMessage);
      socket.off('chatHistory', handleHistory);
      socket.off('chatUsers', handleUsers);

      socketRef.current = null;
      closeChatSocket();
    };
  }, []);

  // Sends a payload and waits for the server's acknowledgement.
  // Resolves true only when the server actually accepted it, so the UI can
  // report a rejected message honestly instead of pretending it was sent.
  const emitWithAck = useCallback((event, payload) => {
    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      setError('Not connected to the chat server yet.');
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      let settled = false;

      // Never leave the UI waiting forever if the ack never arrives.
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        setError('The chat server did not respond. Please try again.');
        resolve(false);
      }, 5000);

      socket.emit(event, payload, (res) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        if (res?.ok === true) {
          setError('');
          resolve(true);
        } else {
          setError(res?.error || 'The server rejected that request.');
          resolve(false);
        }
      });
    });
  }, []);

  // Announces the display name to the server.
  const join = useCallback(
    (username) => emitWithAck('chatJoin', { username }),
    [emitWithAck],
  );

  // Sends a message. The message only appears in the list once the server has
  // broadcast it, so the UI never shows a message that was not delivered.
  const sendMessage = useCallback(
    (username, message) => {
      const trimmed = (message || '').trim();
      if (!trimmed) {
        setError('Type a message before sending.');
        return Promise.resolve(false);
      }
      return emitWithAck('chatMessage', { username, message: trimmed });
    },
    [emitWithAck],
  );

  const clearError = useCallback(() => setError(''), []);

  return { status, messages, users, error, join, sendMessage, clearError };
}
