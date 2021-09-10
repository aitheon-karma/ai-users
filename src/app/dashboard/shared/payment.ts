export class Payment {
    _id: string;
    amountUsd: number;
    sentCurrency: string;
    // external
    externalId: string;
    status: string;
    extra: {
        address: string,
        status_url: string,
        qrcode_url: string,
        timeout: number
    };
    createdAt: string;
}
