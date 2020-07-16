import aedes, {Aedes, AedesPublishPacket, Client, Subscription} from 'aedes';
import net from 'net';
import {SecureClient} from './client';
import {Buffer} from 'buffer';
import {Keys} from './keys';

export class Broker {
    private CONFIG_TOPIC = 'initial';
    private aedes: Aedes = aedes({authorizeForward: this.forwardHandler.bind(this), authorizePublish: this.decodeMessage.bind(this)});
    private server;
    private clients: Array<SecureClient> = [];

    constructor(port: number) {
        this.server = net.createServer(this.aedes.handle);
        this.server.listen(port, () => console.log(`[INFO] S-MQTT server starts on port: ${port}`));

        this.aedes.on('client', this.prepareUser.bind(this));
        this.aedes.on('subscribe', this.reloadSubscribtion.bind(this));
    }

    async decodeMessage(client: Client, data: AedesPublishPacket, callback) {
        if (client) {
            try {
                const inputJson = JSON.parse((data.payload as string));
                inputJson.iv = Buffer.from(inputJson.iv);
                inputJson.ephemPublicKey = Buffer.from(inputJson.ephemPublicKey);
                inputJson.ciphertext = Buffer.from(inputJson.ciphertext);
                inputJson.mac = Buffer.from(inputJson.mac);
                const user = this.findUser(client);
                data.payload = await user.decryptInput(inputJson);
            } catch {
                console.log('[INFO] Invalid syntax from clientId: ' + client.id + ' data: ' + data.payload);
            }
            callback();
        }
    }

    /**
     * Message forwarder
     * @param client - target client
     * @param data   - mqtt packet
     */
    forwardHandler(client: Client, data: AedesPublishPacket) {
        if (data.topic !== this.CONFIG_TOPIC) {
            const newData = {...data};
            const secureClient = this.findUser(client);
            secureClient.encryptOutput(data.payload as Buffer).then(ecies => {
                newData.payload = Buffer.from(JSON.stringify(ecies));
            });
            return newData;
        } else {
            return data;
        }
    }

    /**
     * Method for recognize user in memory
     * client
     */
    findUser(client: Client): SecureClient {
        for (const c of this.clients) {
            if (c.baseClient === client) {
                return c;
            }
        }
        return null;
    }

    /**
     * Method to initialize client after connect to broker
     * param client
     */
    prepareUser(client: Client) {
        const sclient = new SecureClient(client);
        this.clients.push(sclient);
        const cmd: 'publish' = 'publish';
        const qos: 0 | 1 | 2 = 0;
        const keys: Keys = {outputPrivateKey: sclient.outputPrivateKey, inputPublicKey: sclient.inputPublicKey};
        const packet = {
            qos,
            retain: true,
            topic: 'initial',
            payload: JSON.stringify(keys),
            dup: false,
            cmd
        };
        client.publish(packet, () => console.log(`[INFO] user ${sclient.baseClient.id} connected`));
    }

    /**
     * Method to reload new subscribtion
     * param sub
     * param client
     */
    reloadSubscribtion(sub: Subscription[], client: Client) {
        for (const t of this.clients) {
            if (t.baseClient === client) {
                t.subscription = sub;
            }
        }
    }
}
