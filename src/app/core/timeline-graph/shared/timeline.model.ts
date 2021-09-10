//Events in each quarter
export class QuarterData {
    _id: string;
    event: string;
}
//Timeline quarter object
export class TimelineQuarter {
    _id: string;
    quarter: string;
    quarterData : QuarterData[];
}
//profile timeline data 
export class ProfileTimeline {
    _id: string;
    content: string;
    hasImage:boolean;
    imageUrl:string;
}

//Main Model
export class Timeline {
    _id: string;
    year: string;
    timelineQuarter :TimelineQuarter[];
    profileTimeline : ProfileTimeline[];
}


export class Timeline_Settings {
    enableHorizontalView:boolean = false;
    isProfileView:boolean = false;
}
