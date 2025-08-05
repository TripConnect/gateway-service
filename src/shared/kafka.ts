import { ConfigHelper } from 'common-utils';

export const KAFKA_BROKERS = [
  `${ConfigHelper.read('kafka.host')}:${ConfigHelper.read('kafka.port')}`,
];

export const KAFKA_SENT_CHAT_MESSAGE_TOPIC = ConfigHelper.read(
  'kafka.topic.chatting-fct-sent-message',
) as string;
