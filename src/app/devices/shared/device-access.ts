export class DeviceAccess {
    _id?: string;
    user: {
        _id: string;
        email: string;
        profile: {
            firstName: string;
            lastName: string
        }
    };
    accessLevel: string;
    organization?: string;
    savingAccess?: boolean;
    editMode?: boolean;
}
