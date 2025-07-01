import { useEffect, useRef, useState } from 'react';
import mqtt from 'mqtt';

const MQTT_BROKER_URL = 'ws://192.168.8.13:9001/mqtt';
const MQTT_TOPIC = 'arec/pump';
const MQTT_USER = 'arec';
const MQTT_PASSWORD = 'arecmqtt';

/**
 * Custom React hook to connect to MQTT over WebSockets and subscribe to a topic.
 * Returns { lastMessage, isConnected, client }
 */
export function useMqtt({
  topic = MQTT_TOPIC,
  brokerUrl = MQTT_BROKER_URL,
  username = MQTT_USER,
  password = MQTT_PASSWORD,
}) {
  const [lastMessage, setLastMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    // Pass username and password in the MQTT connect options
    const client = mqtt.connect(brokerUrl, {
      username,
      password,
      reconnectPeriod: 3000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      setIsConnected(true);
      client.subscribe(topic, (err) => {
        if (err) {
          console.error('MQTT subscribe error:', err);
        }
      });
    });

    client.on('message', (topic, payload) => {
      try {
        const message = JSON.parse(payload.toString());
        setLastMessage(message);
      } catch (e) {
        console.error('Invalid MQTT payload:', payload.toString());
      }
    });

    client.on('error', (err) => {
      console.error('MQTT error:', err);
    });

    client.on('close', () => {
      setIsConnected(false);
    });

    return () => {
      client.end(true);
    };
  }, [brokerUrl, topic, username, password]);

  return { lastMessage, isConnected, client: clientRef.current };
}