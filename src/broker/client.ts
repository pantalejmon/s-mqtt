import {Client} from 'aedes';

export class SecureClient {
    inputPrivateKey: string;
    inputPublicKey: string;
    outputPrivateKey: string;
    outputPublicKey: string;

    constructor(private baseClient: Client) {
        this.inputPrivateKey = 'xxx';
        this.inputPublicKey = 'xxx';
        this.outputPrivateKey = 'xxx';
        this.outputPublicKey = 'xxx';
    }
}
