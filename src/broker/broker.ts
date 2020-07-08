import aedes, {Aedes, AedesPublishPacket, Client} from 'aedes';
import net from 'net';
import {SecureClient} from './client';
import {Buffer} from 'buffer';
import {Ecies} from 'eccrypto';

export class Broker {
    private aedes: Aedes = aedes({authorizeForward: this.forwardHandler.bind(this)});
    private server;
    private clients: Array<SecureClient> = [];

    constructor(port: number) {
        this.server = net.createServer(this.aedes.handle);
        this.server.listen(port, () => console.log(`S-MQTT server starts on port: ${port}`));

        this.aedes.on('client', (client: Client) => {
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

        this.aedes.on('subscribe', (sub, client) => {
            for (const t of this.clients) {
                if (t.baseClient === client) {
                    t.subscription = sub;
                }
            }
        });
    }


    forwardHandler(client: Client, data: AedesPublishPacket) {
        console.log('tp1 ' + client + ' ' + data.payload);
        const newData = {...data};

        const secureClient = this.findUser(client);
        secureClient.encryptOutput(data.payload as Buffer).then(datae => {

            const ecies: Ecies = datae;
            newData.payload = JSON.stringify(ecies);
            const json: any = JSON.parse(JSON.stringify(ecies));

            json.iv = Buffer.from(json.iv);
            json.ephemPublicKey = Buffer.from(json.ephemPublicKey);
            json.ciphertext = Buffer.from(json.ciphertext);
            json.mac = Buffer.from(json.mac);

            secureClient.decryptInput(json).then(datad => console.log('Po odczytaniu: ' + datad.toString()));
        });
        return newData;
    }

    findUser(client: Client): SecureClient {
        for (const c of this.clients) {
            if (c.baseClient === client) {
                return c;
            }
        }
        return null;
    }
}
