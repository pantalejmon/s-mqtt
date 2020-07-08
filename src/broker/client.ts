import {Client, Subscription} from 'aedes';
import eccrypto, {Ecies} from 'eccrypto';
import {Buffer} from 'buffer';

export class SecureClient {
    inputPrivateKey: Buffer;
    inputPublicKey: Buffer;
    outputPrivateKey: Buffer;
    outputPublicKey: Buffer;
    subscription: Array<Subscription> = [];

    constructor(public baseClient: Client) {
        this.generateKey();
    }

    async decryptInput(data: Ecies): Promise<Buffer> {
        return await eccrypto.decrypt(this.outputPrivateKey, data);
    }

    async encryptOutput(data: Buffer): Promise<Ecies> {
        return await eccrypto.encrypt(this.outputPublicKey, data);
    }

    private generateKey() {
        this.inputPrivateKey = eccrypto.generatePrivate();
        this.inputPublicKey = eccrypto.getPublic(this.inputPrivateKey);
        this.outputPrivateKey = eccrypto.generatePrivate();
        this.outputPublicKey = eccrypto.getPublic(this.outputPrivateKey);
    }
}
