export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface Conversation {
    role: string;
    content: string;
    labels?: LabelWithVerification[];
}
export interface StudentInfo {
    "id": number,
    "name": string,
    "age": number,
    "grade": number,
    "initialDialogue": string,
    "personals": {
        "characteristics": string[],
        "ability": string[],
        "behavior": string[]
    }
}

export interface TextLabel {
    text: string;
    label: string;
    start: number;
    end: number;
}

export interface LabelWithVerification extends TextLabel {
    isVerified: boolean;
}

export interface UserInfo {
    userId: number,
    userName: string,
    email: string,
    howLong: string,
    baselineTraining: {
        scenario1: Conversation[],
        scenario2: Conversation[],
    },
    baselineTest: {
        conversation: Conversation[],
    },
    tutorupTraining: {
        scenario1: {
            conversation: Conversation[],
            overallFeedbackCount: number,
            instantFeedbackCount: number,
            resetBtnCount: number,
            greenBubbleCount: number
        },
        scenario2: {
            conversation: Conversation[],
            overallFeedbackCount: number,
            instantFeedbackCount: number,
            resetBtnCount: number,
            greenBubbleCount: number
        },
    },
    tutorUpTest: {
        conversation: Conversation[],
    },
}