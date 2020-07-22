import {Broker} from './broker/broker';

export function smqtt(port: number) {
    return new Broker(port);
}

smqtt(1883);
