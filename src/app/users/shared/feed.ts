import { User } from ".";

export class Feed {
    _id: string;
    user: string;
    isArticle: boolean;
    isPinned: boolean;
    isArchived: boolean;
    title: string;
    content: string;
    attachment: {
        url: string;
        contentType: string;
    };
    likes: [{ _id: string}];
    shares: [{ _id: string }];
    isShared: string;
    viewPermission: any;
    comments_amount: number;
    urlContents: {
        title: string;
        description: string;
        imageUrl: string;
        url: string;
    };
    createdAt: string;
    constructor() {
        this.content = '';
    }
}


export class UrlMetadata {
    author: string;
    date: string;
    description: string;
    image: string;
    logo: string;
    publisher: string;
    title: string;
    url: string;
}


