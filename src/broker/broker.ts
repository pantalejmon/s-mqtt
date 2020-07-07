import aedes, {Aedes, Client} from 'aedes';
import net from 'net';
import {SecureClient} from './client';

export class Broker {
    private aedes: Aedes = aedes();
    private server;
    private clients: Array<SecureClient> = [];

    constructor(port: number) {
        this.server = net.createServer(this.aedes.handle);
        this.server.listen(port, () => console.log(`S-MQTT server starts on port: ${port}`));

        console.log(this.aedes);

        this.aedes.on('client', (client: Client) => {
            console.log('Dołączono klienta: ' + client.id);
            this.clients.push(new SecureClient(client));
            const cmd: 'publish' = 'publish';
            const qos: 0 | 1 | 2 = 0;
            const packet = {
                qos,
                retain: true,
                topic: 'initial',
                payload: `Welcome ${client.id}`,
                dup: false,
                cmd
            };
            client.publish(packet, () => console.log(`Przywitano ${client.id}`));
        });
    }
}
