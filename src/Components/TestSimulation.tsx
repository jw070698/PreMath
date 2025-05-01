import React, { useState, useEffect, useRef } from 'react';
import { getStudentInitPrompt, STRUCTURED_FEEDBACK_PROMPT, problems, getInitialTutorDialogue, FEED_BACK_PROMPT, bigPicturePrompt, scenarioDescription } from '../utils/prompt';
import { studentStore } from '../stores/studentStore';
import './TestSimulation.css';
import UserInput from './UserInput';
import { Message, Conversation, StudentInfo } from '../utils/type'
import { chat, bigChat } from '../utils/aiRequest';
import ReactMarkdown from 'react-markdown';
import { beforeStartGuidance, testGuidance } from '../utils/guidance';
import { Mapping } from '../utils/mapping'
import { useNavigate } from "react-router-dom";
import { getDatabase, get, ref, child, push, update, onValue, set } from "firebase/database";
import { db } from '../backend/firebase';
const TestSimulation = () => {
    const navigate = useNavigate();
    const { currentSystem, descriptionOfStudents, participantId, tutorUpSecenario, setDescriptionOfStudents, instantStrategies, setInstantStrategies, overallStrategies, setOverallStrategies, conversationDatabase, students, loadLog, scenarioIndex, initializeMessageBox, initializeConversation, updateConversation, updateMessageBox, studentInfo, conversation, messageBox, hasScenarioStarted, setHasScenarioStarted }
        = studentStore(state => ({
            currentSystem: state.currentSystem,
            tutorUpSecenario: state.tutorUpSecenario,
            participantId: state.participantId,
            studentInfo: state.studentInfo,
            messageBox: state.messageBox,
            conversation: state.conversation,
            updateMessageBox: state.updateMessageBox,
            initializeMessageBox: state.initializeMessageBox,
            updateConversation: state.updateConversation,
            initializeConversation: state.initializeConversation,
            scenarioIndex: state.scenarioIndex,
            conversationDatabase: state.conversationDatabase,
            loadLog: state.loadLog,
            students: state.students,
            hasScenarioStarted: state.hasScenarioStarted,
            setHasScenarioStarted: state.setHasScenarioStarted,
            descriptionOfStudents: state.descriptionOfStudents,
            setDescriptionOfStudents: state.setDescriptionOfStudents,
            instantStrategies: state.instantStrategies,
            setInstantStrategies: state.setInstantStrategies,
            overallStrategies: state.overallStrategies,
            setOverallStrategies: state.setOverallStrategies,
        }));

    const messagesEndRef = useRef<null | HTMLDivElement>(null)

    const [prompt, setPrompt] = useState("");
    const [areStudentsResponding, setAreStudentsResponding] = useState(false);
    const [isFetchingInstantFeedback, setIsFetchingInstantFeedback] = useState<boolean>(false);
    const [isFetchingOverallFeedback, setIsFetchingOverallFeedback] = useState<boolean>(false);
    const [description, setDescription] = useState<string>("");
    const [instantStrategy, setInstantStrategy] = useState<string>("");
    const [overallFeedback, setOverallFeedback] = useState<string>("");
    const [readTestGuidance, setReadTestGuidance] = useState<boolean>(false);



    const onEndTraining = async (e: React.FormEvent) => {
        setIsFetchingOverallFeedback(true);

        e.preventDefault();
        const promptToSend = FEED_BACK_PROMPT + "Conversation Dialogues: ####" + JSON.stringify(conversation) + "####";
        const currentScenario = scenarioIndex;
        const result = await chat([{ role: 'user', content: promptToSend }]);
        console.log('the result of feedback', result);
        setOverallFeedback(result);
        setOverallStrategies(currentScenario, result);

        setIsFetchingOverallFeedback(false);
    }
    const updateConversationDatabase = async (conv: Conversation[]) => {
        var testRef
        if (currentSystem == 'ttest') {
            console.log('tutorUpTest');
            testRef = ref(db, `user/${participantId}/tutorUpTest/conversation`);

        } else {
            testRef = ref(db, `user/${participantId}/baselineTest/conversation`);
        }

        try {
            // 读取现有的 conversation 数组
            const snapshot = await get(testRef);
            let existingConversations: Conversation[] = [];
            existingConversations = snapshot.val();
            console.log('testConversations:', existingConversations);
            if (snapshot.exists() && Array.isArray(existingConversations)) {
                existingConversations = snapshot.val();
                const updatedConversations = [...existingConversations, ...conv];
                // console.log('updatedConversations:', updatedConversations);
                await set(testRef, updatedConversations);
                console.log('Conversations added successfully');
            } else {
                await set(testRef, conv);
                console.log('Initialised conversations successfully');
            }


        } catch (error) {
            console.error('Error updating conversations:', error);
        }

    }
    const createMessage = (student: StudentInfo): Message => {
        console.log('create message:', student);
        return (
            {
                role: 'user',
                content: `#${student.name}#: ${student.initialDialogue}`
            })
    };
    const createSelfMessage = (student: StudentInfo): Message => {
        return (
            {
                role: 'assistant',
                content: student.initialDialogue
            })
    }
    const createConversation = (student: StudentInfo): Conversation => ({
        role: student.name,
        content: student.initialDialogue
    })
    const createInitialPrompt = (student: StudentInfo): Message => {
        var problemIndex = 0;
        if (currentSystem == 'ttest') {
            problemIndex = Mapping[participantId - 1].tutest.problem - 1
        } else {
            problemIndex = Mapping[participantId - 1].basetest.problem - 1
        }
        return ({
            role: 'system',
            content: getStudentInitPrompt(student.name, student.personals, problems[problemIndex])
        })
    }

    useEffect(() => {
        const currentScenario = Mapping[participantId - 1].tutraining[tutorUpSecenario].scenario - 1

        InitializeScenario();


    }, [])


    function extractName(input: string): string {
        // 使用正则表达式匹配被#号包围的名字部分
        const match = input.match(/^#([^#]+)#/);

        if (match) {
            const name = match[1].trim(); // 提取名字部分并去除多余空格
            return name;
        } else {
            // 如果没有匹配到格式，则返回空字符串或其他适当值
            return '';
        }
    }
    const getStudentResponses = async (stuIdx: number): Promise<string> => {
        const idx = stuIdx % 3;
        let stu1 = stuIdx == 0 ? 1 : 0;
        let stu2 = stuIdx == 2 ? 1 : 2;
        const updatedMessageBox = studentStore.getState().messageBox;
        console.log('getStudentResponses', studentInfo[stuIdx].name, updatedMessageBox);
        const result = await chat(updatedMessageBox[idx]);
        const agentMessage = {
            role: 'assistant',
            content: result
        } as Message;
        const userMessage = {
            role: 'user',
            content: `#${studentInfo[stuIdx].name}#: ${result}`
        } as Message;
        await updateMessageBox(idx, [...messageBox[idx], agentMessage]);
        await updateMessageBox(stu1, [...messageBox[stu1], userMessage]);
        await updateMessageBox(stu2, [...messageBox[stu2], userMessage]);

        return result;
    }

    const updateTutorPrompt = async (prompt: string) => {
        const tutorMessage = {
            role: 'user', content: `#Teacher#:${prompt}`
        } as Message;


        await Promise.resolve(updateConversation({
            role: 'teacher', content: prompt
        }));

        var messageBoxNow = studentStore.getState().messageBox;
        console.log('messageBoxNow:', messageBoxNow);
        await Promise.all([0, 1, 2].map(idx =>

            updateMessageBox(idx, [...messageBoxNow[idx], tutorMessage]),

        ));
        var messageBoxNow = studentStore.getState().messageBox;
        console.log('messageBoxNow:', messageBoxNow);


    }
    const getBigPictureConversation = (conversation: Conversation[]): string => {
        var con = '';
        conversation.map((res, i) => {
            con = con + '\n' + res.role + ':' + res.content;
        })
        return con;
    }
    const simulateConversation = async (e: React.FormEvent) => {
        // setAreStudentsResponding(true);

        e.preventDefault();
        //first update tutor's response, then update students' response in getResponse
        const tutorResponse = prompt;
        setPrompt('');
        var conversationForBigPicture = [...conversation, { role: 'teacher', content: tutorResponse }];
        await updateConversationDatabase([{ role: 'teacher', content: tutorResponse }]);
        await updateTutorPrompt(tutorResponse);
        let iterationCount = 0;
        const maxIterations = 30;
        // var initialBigPicMessage = bigPicturePrompt
        var problemIndex = 0
        var sceIndex = 0
        if (currentSystem == 'ttest') {
            problemIndex = Mapping[participantId - 1].tutest.problem - 1
            sceIndex = Mapping[participantId - 1].tutest.scenario - 1
        } else {
            problemIndex = Mapping[participantId - 1].basetest.problem - 1
            sceIndex = Mapping[participantId - 1].basetest.scenario - 1
        }
        // const problemIndex = Mapping[participantId - 1].tutraining[tutorUpSecenario].problem - 1
        // const sceIndex = Mapping[participantId - 1].tutraining[tutorUpSecenario].scenario - 1
        var initialBigPicMessage = bigPicturePrompt(problems[problemIndex], [studentInfo[students[0], students[1], students[2]], scenarioDescription[sceIndex]]);

        const initialMessage = [{
            role: 'system',
            content: initialBigPicMessage
        }] as Message[];
        while (iterationCount < maxIterations) {
            iterationCount++;
            var conversationString = getBigPictureConversation(conversationForBigPicture);
            console.log('conversationForBigPicture:', conversationString);

            const result = await bigChat([...initialMessage, { role: 'user', content: conversationString }]);

            console.log('resultintest:', result);
            const name = extractName(result);
            if (name == '') {
                console.log('Name extraction failed:', result);
                initialMessage.push({
                    role: 'system', content: `Remember, always output your output in the following format:
#StudentName#Student's content 
Or
#Teacher#Teacher's content` });
                continue;
            }
            console.log('Name:', result, name, [initialMessage, { role: 'system', content: conversationString }]);
            if (name == 'Tutor') {
                setAreStudentsResponding(false);
                break;
            } else {
                setAreStudentsResponding(true);
            }
            // const students = [3, 4, 5]
            if (!(name == studentInfo[students[0]].name || name == studentInfo[students[1]].name || name == studentInfo[students[2]].name)) {
                //提取字符失败，重新调用chat
                console.log('NameFail', result);
            }
            const studentIndex = studentInfo.findIndex(student => student.name === name);
            //call student GPT
            const response = await getStudentResponses(studentIndex);
            // console.log('response:', response);
            conversationForBigPicture.push({ role: name, content: response });
            updateConversation({ role: name, content: response });
            await updateConversationDatabase([{ role: name, content: response }]);

        }

    }
    const InitializeScenario = async () => {
        var problemIndex = 0;
        if (currentSystem == 'ttest') {
            problemIndex = Mapping[participantId - 1].tutest.problem - 1
        } else {
            problemIndex = Mapping[participantId - 1].basetest.problem - 1
        }
        // const problemIndex = Mapping[participantId - 1].tutraining[tutorUpSecenario].problem - 1
        const initialTutorDialogue = getInitialTutorDialogue(problemIndex);
        const initialTutorMessage = {
            role: 'user',
            content: '#Tutor:#' + initialTutorDialogue
        } as Message;
        const initialTutorConversation = {
            role: 'tutor',
            content: initialTutorDialogue
        }
        // initialize the conversation for each student
        // const students = [3, 4, 5]
        const initialMessages = students.map((_, idx) => createMessage(studentInfo[students[idx]]));
        const initialConversations = students.map((_, idx) => createConversation(studentInfo[students[idx]]));
        const initialPrompts = students.map((_, idx) => createInitialPrompt(studentInfo[students[idx]]));
        const initialSelfMessages = students.map((_, idx) => createSelfMessage(studentInfo[students[idx]]));
        initializeMessageBox(
            [initialPrompts[0], initialTutorMessage, initialSelfMessages[0], initialMessages[1]],
            [initialPrompts[1], initialTutorMessage, initialMessages[0], initialSelfMessages[1]]
        );
        initializeConversation([initialTutorConversation, initialConversations[0], initialConversations[1]]);
        // for 3
        //initializeMessageBox([initialPrompts[0], initialTutorMessage, initialSelfMessages[0], initialMessages[1], initialMessages[2]], [initialPrompts[1], initialTutorMessage, initialTutorMessage, initialMessages[0], initialSelfMessages[1], initialMessages[2]], [initialPrompts[2], initialTutorMessage, initialTutorMessage, initialMessages[0], initialMessages[1], initialSelfMessages[2]]); // add initial prompt into messageBox
        //initializeConversation([initialTutorConversation, initialConversations[0], initialConversations[1], initialConversations[2]]); // add initial dialogue among 1 tutor and 3 students into Conversation
        // 再次获取最新的 messageBox 并打印
        const updatedMessageBox = studentStore.getState().messageBox;
        await updateConversationDatabase([initialTutorConversation, initialConversations[0], initialConversations[1], initialConversations[2]]);
        // console.log('updatedMessageBox:', updatedMessageBox);
    }

    const resetWholeDialogue = async (e: React.FormEvent) => {
        InitializeScenario();
    };
    const navToNextPage = () => {
        if (participantId <= 6) {
            //go to tutor up training
            if (currentSystem != 'ttest') {
                const currentScenario = Mapping[participantId - 1].tutraining[tutorUpSecenario].scenario - 1
                // const mappingIndex = Mapping[participantId - 1].tutraining[idx].scenario - 1

                navigate('/scenarios')
            }
        }
        else {
            if (currentSystem != 'btest') {
                navigate('/baseline')
            }
        }
    }
    return (
        <div className='Students'>
            {readTestGuidance ?
                <div style={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div id="students-conversation" className="test-container" style={{ position: 'relative', overflowY: 'auto', flexGrow: 1}}>
                            {
                                conversation.map((res, i) => {
                                    const result = res.content
                                    return (
                                        // <div key={i}>{result}</div>
                                        <UserInput
                                            key={i}
                                            prompt={result}
                                            user={res.role}
                                            index={i}
                                        />
                                    )
                                })
                            }
                            <p ref={messagesEndRef} />
                        </div>
                    <div style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '15%' }}>
                        <div style={{ borderTop: '2px solid #ccc', backgroundColor: '#fff' }}>
                            {areStudentsResponding && <div className="chat-input" style={{ textAlign: 'center', padding: '6px' }}>Students are responding...</div>}
                        </div>
                        <form onSubmit={simulateConversation} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 8px', margin: 0, gap: '12px' }}>
                            <textarea
                                className="chat-input"
                                rows={2}
                                cols={30}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Enter your respond here"
                                style={{ width: '100%', height: 'auto' }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault(); // 防止换行
                                        simulateConversation(e); // 提交表单
                                    }
                                }}
                            />
                            <button className="chat-button" type="submit" disabled={areStudentsResponding} style={{ cursor: areStudentsResponding ? 'not-allowed' : 'pointer' }}>Submit</button>
                            <button className="chat-button" onClick={resetWholeDialogue}  >Reset</button>

                        </form>
                        <button onClick={navToNextPage}>
                            Next
                        </button>

                    </div>
                </div> :
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', textAlign: 'start' }}>
                    <ReactMarkdown>
                        {testGuidance}
                    </ReactMarkdown>
                    <button className="chat-button" onClick={() => setReadTestGuidance(true)} style={{ height: 'fit-content' }}>Start Test</button>
                </div>
            }
        </div >
    )

}
export default TestSimulation;