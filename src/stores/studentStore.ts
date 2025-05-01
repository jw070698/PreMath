import { create } from "zustand";
import { studentInfo } from "../utils/studentInfo";
import { Message, Conversation, StudentInfo } from "../utils/type";
import { chat } from "../utils/aiRequest";
import { getStudentInitPrompt } from "../utils/prompt";
interface StudentStoreState {
  answerDatabase: string[][];
  conversationDatabase: Conversation[][];
  messageDatabase: Message[][][];
  latestMessage: Message[];
  studentInfo: StudentInfo[];
  conversation: Conversation[];
  messageBox: Message[][];
  // userInfo: string[];
  scenarioIndex: number;

  students: number[];
  overallStrategies: string[];
  instantStrategies: string[];
  descriptionOfStudents: string[];
  isFeedbackTabSelected: boolean[];
  hasScenarioStarted: boolean[];
  participantId: number;
  name: string;
  email: string;
  jannTeachingTime: string;
  baselineScenario: number;
  tutorUpSecenario: number;
  currentSystem: string
  
  // getResponse: (idx: number, prompt: string) => void,
  updateMessageBox: (idx: number, updatedMessages: Message[]) => Promise<void>;
  updateConversation: (updatedConversation: Conversation) => void;
  updateLatestMessage: (idx: number, message: Message) => void;
  initializeLatestMessage: (m1: Message, m2: Message) => void;
  //initializeLatestMessage: (m1: Message, m2: Message, m3: Message) => void;
  initializeConversation: (con: Conversation[]) => void;
  initializeMessageBox: (m1: Message[], m2: Message[]) => void;
  //initializeMessageBox: (m1: Message[], m2: Message[], m3: Message[]) => void;
  changeScenario: (idx: number) => void;
  updeateMessageDatabase: (scenarioIndx: number) => void;
  updateConversationDatabase: (scenarioIndx: number) => void;
  loadLog: (scenarioIndex: number) => void;
  updateStudents: (idx: number) => void;
  setOverallStrategies: (idx: number, strategy: string) => void;
  setInstantStrategies: (idx: number, strategy: string) => void;
  setDescriptionOfStudents: (idx: number, description: string) => void;
  setIsFeedbackTabSelected: (toSet: boolean, scenarioIndex: number) => void;
  setHasScenarioStarted: (idx: number, hasStarted: boolean) => void;
  setParticipantId: (id: number) => void;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setJannTeachingTime: (time: string) => void;
  setCurrentSystem: (system: string) => void;
  setBaselineScenario: (scenario: number) => void;
  setTutorUpSecenario: (scenario: number) => void;
  setAnswerDatabase: (idx: number, newanswer: string[]) => void;
  selectedDropdownOption: string;
  selectedStudentName: string;
  setSelectedDropdownOption: (option: string) => void;
  setSelectedStudentName: (name: string) => void;
  dropdownData: { [key: string]: string };
  setDropdownData: (update: (prev: { [key: string]: string }) => { [key: string]: string }) => void;

}

export const studentStore = create<StudentStoreState>((set, get) => ({
  jannTeachingTime: "",
  answerDatabase: [[], []],
  tutorUpSecenario: 0,
  currentSystem: 't',
  baselineScenario: 0,
  descriptionOfStudents: ["", "", ""] as string[],
  overallStrategies: ["", "", "", ""] as string[],
  instantStrategies: ["", "", "", ""] as string[],
  conversationDatabase: [[], [], [], []] as Conversation[][],
  messageDatabase: [
    [[], []],
    [[], []],
    [[], []],
    [[], []],
  ] as Message[][][],
  /*messageDatabase: [
    [[], [], []],
    [[], [], []],
    [[], [], []],
    [[], [], []],
  ] as Message[][][],*/
  latestMessage: [{}, {}] as Message[],
  //latestMessage: [{}, {}, {}] as Message[],
  scenarioIndex: 0,
  students: [0, 1],
  //students: [0, 1, 2],
  studentInfo: studentInfo,
  conversation: [] as Conversation[], // overall conversations without prompts
  messageBox: [[], []] as Message[][],
  //messageBox: [[], [], []] as Message[][], //prompt and conversation for each student
  isFeedbackTabSelected: [false, false, false, false] as boolean[],
  hasScenarioStarted: [false, false, false, false] as boolean[],
  participantId: 1,
  name: "",
  email: "",
  selectedDropdownOption: '',
  selectedStudentName: '',
  dropdownData: {},
  setDropdownData: (update: (prev: { [key: string]: string }) => { [key: string]: string }) =>
    set((state) => ({ dropdownData: update(state.dropdownData) })),
  // ...
  setSelectedDropdownOption: (option: string) =>
    set({ selectedDropdownOption: option }, false), // 두 번째 인자 false를 추가
  setSelectedStudentName: (name: string) =>
    set({ selectedStudentName: name }, false),
  // jannTeachingCount: 0,
  setAnswerDatabase: (idx: number, newanswer: string[]) => set((state) => {
    const { answerDatabase } = get();
    const updatedAnswerDatabase = answerDatabase.map((answers, index) =>
      index === idx ? newanswer : answers
    );
    return {
      answerDatabase: updatedAnswerDatabase,
    };
  }),
  setTutorUpSecenario: (scenario: number) => set((state) => ({ tutorUpSecenario: scenario })),
  setCurrentSystem: (system: string) => set((state) => ({ currentSystem: system })),
  setDescriptionOfStudents: (idx: number, description: string) =>
    set((state) => {
      const { descriptionOfStudents } = get();
      const updatedDescriptionOfStudents = descriptionOfStudents.map(
        (str, index) => (index === idx ? description : str)
      );
      return {
        descriptionOfStudents: updatedDescriptionOfStudents,
      };
    }),
  setOverallStrategies: (idx: number, strategy: string) =>
    set((state) => {
      const { overallStrategies } = get();
      const updatedOverallStrategies = overallStrategies.map((str, index) =>
        index === idx ? strategy : str
      );
      return {
        overallStrategies: updatedOverallStrategies,
      };
    }),
  setInstantStrategies: (idx: number, strategy: string) =>
    set((state) => {
      const { instantStrategies } = get();
      const updatedInstantStrategies = instantStrategies.map((str, index) =>
        index === idx ? strategy : str
      );
      return {
        instantStrategies: updatedInstantStrategies,
      };
    }),
  updateStudents: (idx: number) =>
    set((state) => {
      // 시나리오 1(tutorUpSecenario === 0)에서는 학생 [7, 8]을 사용
      // 시나리오 2(tutorUpSecenario === 1)에서는 학생 [1, 2]를 사용
      const students = state.tutorUpSecenario === 0 ? [7, 8] : [1, 2];
      return { students };
    }),
  /*updateStudents: (idx: number) =>
    set((state) => ({ students: [idx * 3 + 0, idx * 3 + 1, idx * 3 + 2] })),*/
  changeScenario: (idx: number) => set((state) => ({ scenarioIndex: idx })),
  initializeLatestMessage: (m1: Message, m2: Message) =>
    set((state) => {
      //初始化三个学生的latestMessage，需要最开始的时候调用一下
      // console.log('enter initializeLatestMessage', m1, m2, m3);
      return { latestMessage: [m1, m2] };
    }),
  /*
  initializeLatestMessage: (m1: Message, m2: Message, m3: Message) =>
    set((state) => {
      //初始化三个学生的latestMessage，需要最开始的时候调用一下
      // console.log('enter initializeLatestMessage', m1, m2, m3);
      return { latestMessage: [m1, m2, m3] };
    }),*/
  initializeConversation: (con: Conversation[]) => {
    set((state) => {
      return { conversation: [...con] };
    });
  },
  initializeMessageBox: (m1: Message[], m2: Message[]) =>
    set((state) => {
      return { messageBox: [m1, m2] };
    }),
  /*
  initializeMessageBox: (m1: Message[], m2: Message[], m3: Message[]) =>
    set((state) => {
      return { messageBox: [m1, m2, m3] };
    }),*/
  updateMessageBox: (idx: number, updatedMessages: Message[]) =>
    new Promise<void>((resolve) => {
      set((state) => {
        const { messageBox } = get();
        const updatedMessageBox = messageBox.map((messages, index) =>
          index === idx ? updatedMessages : messages
        );
        return { messageBox: updatedMessageBox };
      });

      // 使用 setTimeout 来确保状态更新后调用 resolve
      setTimeout(() => {
        resolve();
      }, 0);
    }),
  updateConversation: (updatedConversation) => 
    set((state) => {
      const newConversation = [...state.conversation];
      const index = newConversation.findIndex(
        conv => conv.role === updatedConversation.role && 
                conv.content === updatedConversation.content
      );
      if (index !== -1) {
        newConversation[index] = updatedConversation;
      }
      return { conversation: newConversation };
    }),

  updateLatestMessage: (idx: number, message: Message) =>
    set((state) => {
      const { latestMessage } = get();
      const updatedLatestMessage = latestMessage.map((msg, index) =>
        index === idx ? message : msg
      );
      return { latestMessage: updatedLatestMessage };
    }),
  updeateMessageDatabase: (scenarioIndx: number) =>
    set((state) => {
      // const messageToUpdate=state.messageBox[studentIndex];
      const newMessageDatabase = [
        ...state.messageDatabase.slice(0, scenarioIndx),
        state.messageBox,
        ...state.messageDatabase.slice(scenarioIndx + 1),
      ];
      return { messageDatabase: newMessageDatabase };
    }),
  updateConversationDatabase: (scenarioIndx: number) =>
    set((state) => {
      const newConversationDatabase = [
        ...state.conversationDatabase.slice(0, scenarioIndx),
        state.conversation,
        ...state.conversationDatabase.slice(scenarioIndx + 1),
      ];
      return { conversationDatabase: newConversationDatabase };
    }),

  loadLog: (scenarioIndex: number) => {
    set((state) => {
      const { messageDatabase, conversationDatabase } = get();

      // Clone messageBox and conversations to maintain immutability
      const messagesBox = [
        ...messageDatabase[scenarioIndex].map((messages) => [...messages]),
      ];
      const conversations = [...conversationDatabase[scenarioIndex]];

      // Update latestMessage with the last message from each student's message array
      const latestMessage = messagesBox.map(
        (messages) => messages[messages.length - 1]
      );
      console.log("latestMessage:", latestMessage);
      // Remove the last 'assistant' message for each student's message array
      messagesBox.forEach((messages) => {
        const lastAssistantIndex = messages
          .slice()
          .reverse()
          .findIndex((message) => message.role === "assistant");
        if (lastAssistantIndex !== -1) {
          const indexToRemove = messages.length - 1 - lastAssistantIndex;
          messages.splice(indexToRemove, 1);
        }
      });

      // Update state with new values
      return {
        messageBox: messagesBox,
        conversation: conversations,
        latestMessage: latestMessage,
      };
    });
  },
  setIsFeedbackTabSelected: (toSet: boolean, scenarioIndex: number) =>
    set((state) => {
      const { isFeedbackTabSelected } = get();
      const updatedIsFeedbackTabSelected = isFeedbackTabSelected.map(
        (current, index) => (index === scenarioIndex ? toSet : current)
      );
      return {
        isFeedbackTabSelected: updatedIsFeedbackTabSelected,
      };
    }),
  setHasScenarioStarted: (idx: number, hasStarted: boolean) =>
    set((state) => {
      const { hasScenarioStarted } = get();
      const updatedHasScenarioStarted = hasScenarioStarted.map(
        (current, index) => (index === idx ? hasStarted : current)
      );
      return {
        hasScenarioStarted: updatedHasScenarioStarted,
      };
    }),
  setParticipantId: (id: number) => set((state) => ({ participantId: id })),
  setName: (name: string) => set((state) => ({ name: name })),
  setEmail: (email: string) => set((state) => ({ email: email })),
  setJannTeachingTime: (time: string) =>
    set((state) => ({ jannTeachingTime: time })),
  setBaselineScenario: (scenario: number) => set((state) => ({ baselineScenario: scenario })),
  
}));
