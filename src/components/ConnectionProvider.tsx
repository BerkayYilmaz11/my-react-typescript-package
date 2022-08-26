/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, FC, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { JsonObject, JsonArray, Options, JsonValue } from "react-use-websocket/dist/lib/types";

enum ConnectionState {
  CONNECTING = "Connecting",
  OPEN = "Open",
  CLOSING = "Closing",
  CLOSED = "Closed",
  UNINSTANTIATED = "Uninstantiated",
}

interface ContextType {
  connectionStatus: ConnectionState;
  sendMessage: (message: JsonObject | JsonArray) => void;
  lastMessage: JsonValue | null;
  changeConnectionUrl: (url: string) => void;
}

const ConnectionContext = createContext<ContextType>({
  connectionStatus: ConnectionState.UNINSTANTIATED,
  sendMessage: () => {},
  lastMessage: null,
  changeConnectionUrl: () => {},
});

type ConnectionOptions = Options;

interface ConnectionProviderParams {
  children: ReactNode;
  socketUrl: string;
  options?: ConnectionOptions;
}

const ConnectionProvider: FC<ConnectionProviderParams> = ({ children, socketUrl, options }) => {
  const [connectionUrl, setConnectionUrl] = useState(socketUrl);

  const { readyState, sendJsonMessage, lastJsonMessage } = useWebSocket(connectionUrl, options);

  useEffect(() => {
    if (socketUrl !== connectionUrl) setConnectionUrl(socketUrl);
  }, [connectionUrl, socketUrl]);

  const changeConnectionUrl = useCallback((url: string) => {
    setConnectionUrl(url);
  }, []);

  const sendMessage = useCallback(
    (message: JsonObject | JsonArray) => {
      sendJsonMessage(message);
    },
    [sendJsonMessage],
  );

  const connectionStatus = {
    [ReadyState.CONNECTING]: ConnectionState.CONNECTING,
    [ReadyState.OPEN]: ConnectionState.OPEN,
    [ReadyState.CLOSING]: ConnectionState.CLOSING,
    [ReadyState.CLOSED]: ConnectionState.CLOSED,
    [ReadyState.UNINSTANTIATED]: ConnectionState.UNINSTANTIATED,
  }[readyState];

  const contextValue: ContextType = useMemo(() => {
    return {
      connectionStatus: connectionStatus,
      changeConnectionUrl: changeConnectionUrl,
      sendMessage: sendMessage,
      lastMessage: lastJsonMessage,
    };
  }, [changeConnectionUrl, connectionStatus, lastJsonMessage, sendMessage]);

  const { Provider } = ConnectionContext;

  return <Provider value={contextValue}>{children}</Provider>;
};

export const useConnection = () => useContext(ConnectionContext);

export default ConnectionProvider;
