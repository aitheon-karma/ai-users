export class Treasury_Account {
    _id;
    user: any;
    type: Treasury_AccountType;
    balance: number;
    currency: Treasury_Currency;
    ethAddress: string;
    createdAt: Date;
    updatedAt: Date;

    tokens: any;
}

/**
 * Keep enums as string for better read
 */
export enum Treasury_AccountType {
    AITHEON_AIC = 'AITHEON_AIC',
    AITHEON_ETH = 'AITHEON_ETH',
    EXTERNAL_AIC = 'EXTERNAL_AIC',
    EXTERNAL_ETH = 'EXTERNAL_ETH'
}

export enum Treasury_Currency {
    AIC = 'AIC',
    ETH = 'ETH',
    USD = 'USD'
}
