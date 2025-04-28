import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getStudentInitPrompt, STRUCTURED_FEEDBACK_PROMPT, problems, getInitialTutorDialogue, FEED_BACK_PROMPT, scenarioDescription, bigPicturePrompt } from '../utils/prompt';
import { studentStore } from '../stores/studentStore';
import './Students.css';
import UserInput from './UserInput';
import { Message, Conversation, StudentInfo, TextLabel } from '../utils/type'
import { chat, bigChat } from '../utils/aiRequest';
import ReactMarkdown from 'react-markdown';
import { beforeStartGuidance, guidance } from '../utils/guidance';
import { Mapping } from '../utils/mapping'
import { getDatabase, get, ref, child, push, update, onValue, set } from "firebase/database";
import { db } from '../backend/firebase';
import { RiExpandDiagonalLine, RiCollapseDiagonalLine } from 'react-icons/ri';
import Diagram from './Diagram';
import { LuFastForward } from 'react-icons/lu';
import { getFirestore, doc, setDoc, collection, addDoc, updateDoc, increment } from 'firebase/firestore';

const Students = () => {
    const { descriptionOfStudents, updateStudents, participantId, tutorUpSecenario, setDescriptionOfStudents, instantStrategies, setInstantStrategies, overallStrategies, setOverallStrategies, conversationDatabase, students, loadLog, scenarioIndex, initializeMessageBox, initializeConversation, updateConversation, updateMessageBox, studentInfo, conversation, messageBox, hasScenarioStarted, setHasScenarioStarted, setSelectedDropdownOption, setSelectedStudentName }
        = studentStore(state => ({
            updateStudents: state.updateStudents,
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
            selectedDropdownOption: '',
            selectedStudentName: '',
            setSelectedDropdownOption: state.setSelectedDropdownOption,
            setSelectedStudentName: state.setSelectedStudentName,
        }));

    const messagesEndRef = useRef<null | HTMLDivElement>(null)

    const [prompt, setPrompt] = useState("");
    const [areStudentsResponding, setAreStudentsResponding] = useState(false);
    const [isFetchingInstantFeedback, setIsFetchingInstantFeedback] = useState<boolean>(false);
    const [isFetchingOverallFeedback, setIsFetchingOverallFeedback] = useState<boolean>(false);
    const [description, setDescription] = useState<string>("");
    const [instantStrategy, setInstantStrategy] = useState<string>("");
    const [overallFeedback, setOverallFeedback] = useState<string>("");
    const [topHeight, setTopHeight] = useState('70%');
    const [diagramStep, setDiagramStep] = useState(0);
    const [showDiagram, setShowDiagram] = useState(false);
    const [dropdownData, setDropdownData] = useState({});

    const advanceDiagram = () => {
        // 모든 대화에서 라벨 검증 결과 확인
        let hasInvalidLabels = false;
        let invalidLabelsCount = 0;
        let invalidLabelDetails: string[] = [];
        
        // First make sure all labels are properly verified
        // Force re-verification of all labels
        conversation.forEach((conv, convIndex) => {
            if (conv.labels && conv.labels.length > 0) {
                // Mark all labels as verified for now
                conv.labels.forEach(label => {
                    // If a label has "none" type, always mark it as verified
                    if (label.label.toLowerCase() === 'none') {
                        label.isVerified = true;
                    }
                    
                    // Count invalid labels
                    if ('isVerified' in label && label.isVerified === false) {
                        hasInvalidLabels = true;
                        invalidLabelsCount++;
                        invalidLabelDetails.push(`"${label.text}" (${label.label})`);
                    }
                });
                
                // Update conversation with verified labels
                updateConversation(conv);
            }
        });
        
        if (hasInvalidLabels) {
            // More detailed error message with information about which labels are incorrect
            alert(`Unable to generate diagram. You have ${invalidLabelsCount} incorrect label(s):\n\n${invalidLabelDetails.join('\n')}\n\nPlease correct your labels and try again.`);
            return; // 다이어그램 생성 중단
        } 
        
        // 틀린 라벨이 없으면 다이어그램 단계 진행
        setDiagramStep(prev => prev + 1);
        if (!showDiagram) {
            setShowDiagram(true);
        }
    };

    const forceVerifyAllLabels = () => {
        let labelsUpdated = false;
        
        // Go through all conversations and mark all labels as verified
        conversation.forEach((conv) => {
            if (conv.labels && conv.labels.length > 0) {
                const hadUnverified = conv.labels.some(label => !label.isVerified);
                
                // Mark all labels as verified
                conv.labels.forEach(label => {
                    label.isVerified = true;
                });
                
                // Only update if there were unverified labels
                if (hadUnverified) {
                    updateConversation(conv);
                    labelsUpdated = true;
                }
            }
        });
        
        if (labelsUpdated) {
            alert("All labels have been verified. You can now generate the diagram.");
        } else {
            alert("No labels needed verification.");
        }
    };

    const onFetchRecentFeedback = async (e: React.FormEvent) => {
        setIsFetchingInstantFeedback(true);

        console.log('fetching feedback');
        e.preventDefault();
        const promptToSend = STRUCTURED_FEEDBACK_PROMPT + "Conversation Dialogues: ####" + JSON.stringify(conversation) + "####";
        const currentScenario = scenarioIndex;
        var parts = ['', '']

        var result = ''
        while (1) {
            result = await chat([{ role: 'user', content: promptToSend }]);
            console.log('the result of feedback', result);
            parts = result.split('##').filter(part => part.trim() !== '');
            // console.log('parts:', typeof parts[1])
            console.log('parts:', parts, typeof parts[0], typeof parts[1])
            if (typeof parts[0] != 'string' || typeof parts[1] != 'string') {
                // console.log('parts:', typeof parts[1], typeof parts[2])

            } else {
                //退出循环
                break;
            }
        }
        setDescription(parts[0].trim());
        setDescriptionOfStudents(currentScenario, parts[0].trim());//update description in the store
        await updateFeedbackToDatabase(result, 'instantFeedback');
        setInstantStrategy(parts[1].trim());
        setInstantStrategies(currentScenario, parts[1].trim());//update strategy in the store

        console.log('Using db:', db);

        // get current feedback count and update the feedback count
        const userRef = ref(db, `user/${participantId}`);
        let currentInstantFeedbackCount = 0;
        onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                currentInstantFeedbackCount = data.tutorupTraining[`scenario${tutorUpSecenario + 1}`].instantFeedbackCount;
            } else {
                console.log('Data not found');
            }
        });

        const newCount = currentInstantFeedbackCount + 1;
        const updates = {
            [`user/${participantId}/tutorupTraining/scenario${tutorUpSecenario + 1}/instantFeedbackCount`]: newCount
        };
        update(ref(db), updates).then(() => {
            console.log(`Instant feedback count updated to ${newCount}`);
        }).catch((error) => {
            console.error('Error updating instant feedback count:', error);
        });

        setIsFetchingInstantFeedback(false);
    }
    const updateFeedbackToDatabase = async (feedback: string, feedbackType: string) => {
        const feedbackRef = ref(db, `user/${participantId}/tutorupTraining/scenario${tutorUpSecenario + 1}/${feedbackType}`);
        try {
            const snapshot = await get(feedbackRef)
            let existingFeedback: string[] = []
            existingFeedback = snapshot.val();
            if (snapshot.exists() && Array.isArray(existingFeedback)) {
                existingFeedback = snapshot.val();
                const updatedFeedback = [...existingFeedback, feedback];
                await set(feedbackRef, updatedFeedback);
                console.log('Feedback added successfully');
            } else {
                await set(feedbackRef, [feedback]);
                console.log('Initialised feedback successfully');
            }

        } catch (error) {
            console.log('Error updating feedback:', error);
        }
    }
    const onEndTraining = async (e: React.FormEvent) => {
        setIsFetchingOverallFeedback(true);

        e.preventDefault();
        const promptToSend = FEED_BACK_PROMPT + "Conversation Dialogues: ####" + JSON.stringify(conversation) + "####";
        console.log(JSON.stringify(conversation));
        const currentScenario = scenarioIndex;
        const result = await chat([{ role: 'user', content: promptToSend }]);
        console.log('the result of feedback', result);
        setOverallFeedback(result);
        setOverallStrategies(currentScenario, result);
        await updateFeedbackToDatabase(result, 'overallFeedback');

        // await set(overallRef, overallFeedback);
        // get current feedback count and update the feedback count
        const userRef = ref(db, `user/${participantId}`);
        let currentOverallFeedbackCount = 0;
        onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                currentOverallFeedbackCount = data.tutorupTraining[`scenario${tutorUpSecenario + 1}`].overallFeedbackCount;
            } else {
                console.log('Data not found');
            }
        });

        const newCount = currentOverallFeedbackCount + 1;
        const updates = {
            [`user/${participantId}/tutorupTraining/scenario${tutorUpSecenario + 1}/overallFeedbackCount`]: newCount
        };
        update(ref(db), updates).then(() => {
            console.log(`Overall feedback count updated to ${newCount}`);
        }).catch((error) => {
            console.error('Error updating overall feedback count:', error);
        });

        setIsFetchingOverallFeedback(false);
    }
    const createMessage = (student: StudentInfo): Message => {
        console.log('create message:', student);
        return (
            {
                role: 'user',
                content: `${student.name}: ${student.initialDialogue}`
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
        const problemIndex = Mapping[participantId - 1].tutraining[tutorUpSecenario].problem - 1
        return ({
            role: 'system',
            content: getStudentInitPrompt(student.name, student.personals, problems[problemIndex])
        })
    }

    useEffect(() => {
        const currentScenario = Mapping[participantId - 1].tutraining[tutorUpSecenario].scenario - 1
        // console.log('tutorUpSecenario:', participantId, tutorUpSecenario, currentScenario);
        // 시나리오별로 다른 학생 인덱스 설정
        const students = tutorUpSecenario === 0 ? [7, 8] : [1, 2];
        studentStore.setState({ students });
        setInstantStrategy(instantStrategies[currentScenario]);
        setOverallFeedback(overallStrategies[currentScenario]);
        setDescription(descriptionOfStudents[currentScenario]);
        if (Array.isArray(conversationDatabase[currentScenario]) && conversationDatabase[currentScenario].length > 0) {
            loadLog(currentScenario);
        } else {
            InitializeScenario();
        }
    }, [tutorUpSecenario])
    useEffect(() => {
        const currentScenario = Mapping[participantId - 1].tutraining[0].scenario - 1
        InitializeScenario();
    }, [])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom();
    }, [conversation]);

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
    // 
    const getStudentResponses = async (stuIdx: number): Promise<string> => {
        console.log('students:', students);
        console.log('idx:', stuIdx);
        
        // studentInfo가 undefined인지 체크
        if (!studentInfo || !students || stuIdx >= students.length) {
            console.error('Invalid student info or index');
            return '';
        }

        const otherIdx = stuIdx === 0 ? 0 : 1;
        console.log('otherIdx:', otherIdx);

        // students 배열의 인덱스가 유효한지 확인
        if (students[stuIdx] === undefined || !studentInfo[students[stuIdx]]) {
            console.error('Invalid student index:', stuIdx);
            return '';
        }

        const result = await chat([
            ...messageBox[stuIdx],
            {
                role: 'user',
                content: `${studentInfo[students[stuIdx]].name}: ${prompt}`
            }
        ]);

        console.log('getStudentResponses\n', messageBox);
        return result;
    };

    const updateTutorPrompt = async (prompt: string) => {
        const tutorMessage = {
            role: 'user', content: `Teacher:${prompt}`
        } as Message;


        await Promise.resolve(updateConversation({
            role: 'tutor', content: prompt
        }));

        var messageBoxNow = studentStore.getState().messageBox;
        console.log('messageBoxNow:', messageBoxNow);
        // for 2
        await Promise.all([0, 1].map(idx =>
            updateMessageBox(idx, [...messageBoxNow[idx], tutorMessage]),
        ));
        
        // for 3
        /*
        await Promise.all([0, 1, 2].map(idx =>

            updateMessageBox(idx, [...messageBoxNow[idx], tutorMessage]),

        ));*/
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
        e.preventDefault();
        if (!prompt.trim()) return;  // 빈 메시지 방지

        setAreStudentsResponding(true);

        try {
            // 교사의 메시지 추가
            const tutorMessage: Conversation = {
                role: 'tutor',
                content: prompt
            };
            
            // 대화 업데이트
            const updatedConversations = [...conversation, tutorMessage];
            initializeConversation(updatedConversations);
            await updateConversationDatabase(updatedConversations);

            // 각 학생의 응답 처리
            for (let i = 0; i < students.length; i++) {
                if (!studentInfo || !students[i] || !studentInfo[students[i]]) {
                    console.error('Missing student info for index:', i);
                    continue;
                }

                const response = await getStudentResponses(i);
                if (response) {
                    const studentMessage: Conversation = {
                        role: studentInfo[students[i]].name,
                        content: response
                    };
                    updatedConversations.push(studentMessage);
                    initializeConversation(updatedConversations);
                    await updateConversationDatabase(updatedConversations);
                }
            }
        } catch (error) {
            console.error('Error in simulateConversation:', error);
        } finally {
            setAreStudentsResponding(false);
            setPrompt('');
        }
    };
    const updateConversationDatabase = async (conv: Conversation[]) => {
        // Firestore reference
        const firestore = getFirestore();
        const userDocRef = doc(firestore, "users", participantId.toString());
        const scenarioDocRef = doc(userDocRef, "tutorupTraining", `scenario${tutorUpSecenario + 1}`);

        try {
            // 대화 데이터 저장
            await setDoc(scenarioDocRef, {
                conversation: conv.filter(item => item !== undefined),
                timestamp: new Date(),
            }, { merge: true });
            console.log('Conversations saved to Firestore successfully');
        } catch (error) {
            console.error('Error updating conversations:', error);
        }
    };
    const updateFastForwardCount = async () => {
        const firestore = getFirestore();
        const userDocRef = doc(firestore, "users", participantId.toString());
        const scenarioDocRef = doc(userDocRef, "tutorupTraining", `scenario${tutorUpSecenario + 1}`);
        
        try {
            await updateDoc(scenarioDocRef, {
                fastForwardCount: increment(1)
            });
            console.log('FastForward count updated successfully');
        } catch (error) {
            console.error('Error updating FastForward count:', error);
        }
    };
    const advanceStudentConversation = async () => {
        if (areStudentsResponding) {
            return;
        }
        
        setAreStudentsResponding(true);
        
        try {
            // FastForward 버튼 클릭 횟수 증가
            await updateFastForwardCount();

            // 현재 대화에 참여 중인 학생들만 찾아서 응답하게 합니다
            // 가장 최근 메시지의 발신자 파악
            let lastSpeaker = "";
            if (conversation.length > 0) {
                lastSpeaker = conversation[conversation.length - 1].role;
            }
            
            // 이미 대화에 참여 중인 학생 역할 목록 추출
            const activeStudentRoles = new Set<string>();
            conversation.forEach(msg => {
                if (msg.role !== 'tutor') {
                    activeStudentRoles.add(msg.role);
                }
            });
            
            // 디버깅 정보 출력
            console.log('Current students:', students);
            console.log('Student info:', studentInfo);
            console.log('Active student roles:', activeStudentRoles);
            console.log('Last speaker:', lastSpeaker);
            
            // 마지막 발언자가 아닌 학생을 찾습니다
            const nextStudentRoles = Array.from(activeStudentRoles).filter(role => role !== lastSpeaker);
            if (nextStudentRoles.length === 0) return; // 대화할 다른 학생이 없는 경우
            
            const nextStudentRole = nextStudentRoles[0] as string; // 다음으로 대화할 학생
            console.log('Next student role:', nextStudentRole);
            
            // students 배열에서 해당 학생의 인덱스 찾기
            let studentIdx = -1;
            for (let i = 0; i < students.length; i++) {
                const currentStudent = studentInfo[students[i]];
                console.log(`Checking student ${i}:`, currentStudent);
                if (currentStudent && currentStudent.name === nextStudentRole) {
                    studentIdx = i;
                    break;
                }
            }
            
            if (studentIdx === -1) {
                console.error(`Student ${nextStudentRole} not found in students array`);
                // 첫 번째 가능한 학생을 선택
                studentIdx = 0;
            }
            
            // 대화 요청 (마지막 발언에 대해 학생이 응답)
            const response = await chat([
                ...messageBox[studentIdx],
                {
                    role: 'user',
                    content: `${nextStudentRole} should continue the conversation, responding to what was just said. Write a natural response as ${nextStudentRole} without including "${nextStudentRole}:" at the beginning.`
                }
            ]);
            
            if (response) {
                // 학생 메시지 생성 및 추가
                const studentMessage: Conversation = {
                    role: nextStudentRole,
                    content: response
                };
                const newConversations = [...conversation, studentMessage];
                
                // 메시지박스 업데이트 (다른 학생들의 메시지박스에 이 응답 추가)
                const studentMsg = {
                    role: 'assistant',
                    content: `${nextStudentRole}: ${response}`
                } as Message;
                
                // 모든 학생의 메시지박스 업데이트
                for (let j = 0; j < students.length; j++) {
                    if (studentIdx !== j) { // 자기 자신 제외
                        updateMessageBox(j, [...messageBox[j], studentMsg]);
                    }
                }
                
                // 전체 대화 업데이트
                initializeConversation(newConversations);
                await updateConversationDatabase(newConversations);
            }
        } catch (error) {
            console.error('Error in advanceStudentConversation:', error);
        } finally {
            setAreStudentsResponding(false);
        }
    };

    const InitializeScenario = async () => {
        const problemIndex = Mapping[participantId - 1].tutraining[tutorUpSecenario].problem - 1
        const initialTutorDialogue = getInitialTutorDialogue(problemIndex);
        const initialTutorMessage = {
            role: 'user',
            content: 'Teacher: ' + initialTutorDialogue
        } as Message;
        const initialTutorConversation = {
            role: 'tutor',
            content: initialTutorDialogue
        }
        // initialize the conversation for each student
        // 시나리오별로 다른 학생 인덱스 사용
        const currentStudents = tutorUpSecenario === 0 ? [7, 8] : [1, 2];
        console.log('students:', currentStudents);
        const initialMessages = currentStudents.map((studentId) => createMessage(studentInfo[studentId]));
        const initialConversations = currentStudents.map((studentId) => createConversation(studentInfo[studentId]));
        const initialPrompts = currentStudents.map((studentId) => createInitialPrompt(studentInfo[studentId]));
        const initialSelfMessages = currentStudents.map((studentId) => createSelfMessage(studentInfo[studentId]));
        initializeMessageBox(
            [initialPrompts[0], initialTutorMessage, initialSelfMessages[0], initialMessages[1]],
            [initialPrompts[1], initialTutorMessage, initialMessages[0], initialSelfMessages[1]]
        );
        initializeConversation([initialTutorConversation, initialConversations[0], initialConversations[1]]);
        //3 --> 2
        //initializeMessageBox([initialPrompts[0], initialTutorMessage, initialSelfMessages[0], initialMessages[1], initialMessages[2]], [initialPrompts[1], initialTutorMessage, initialTutorMessage, initialMessages[0], initialSelfMessages[1], initialMessages[2]], [initialPrompts[2], initialTutorMessage, initialTutorMessage, initialMessages[0], initialMessages[1], initialSelfMessages[2]]); // add initial prompt into messageBox
        //initializeConversation([initialTutorConversation, initialConversations[0], initialConversations[1], initialConversations[2]]); // add initial dialogue among 1 tutor and 3 students into Conversation
        //update to database
        await updateConversationDatabase([initialTutorConversation, initialConversations[0], initialConversations[1], initialConversations[2]])

        // 再次获取最新的 messageBox 并打印
        const updatedMessageBox = studentStore.getState().messageBox;
    }

    const resetWholeDialogue = async (e: React.FormEvent) => {
        // get current reset count and update the reset count
        const userRef = ref(db, `user/${participantId}`);
        let currentResetBtnCount = 0;
        onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                currentResetBtnCount = data.tutorupTraining[`scenario${tutorUpSecenario + 1}`].resetBtnCount;
            } else {
                console.log('Data not found');
            }
        });

        const newCount = currentResetBtnCount + 1;
        const updates = {
            [`user/${participantId}/tutorupTraining/scenario${tutorUpSecenario + 1}/resetBtnCount`]: newCount
        };
        update(ref(db), updates).then(() => {
            console.log(`Reset button count updated to ${newCount}`);
        }).catch((error) => {
            console.error('Error updating reset button count:', error);
        });

        InitializeScenario();
    };
    // console.log('students: ', students)

    const handleDropdownChange = async (e: React.ChangeEvent<HTMLSelectElement>, studentRole: string, studentMessage: string) => {
        const selectedOption = e.target.value;
        // Store the selected option in dropdownData, keyed by studentRole
        setDropdownData(prev => ({
            ...prev,
            [studentRole]: selectedOption
        }));
        studentStore.getState().setDropdownData(prev => ({
            ...prev,
            [studentRole]: selectedOption,
          }));

        setSelectedDropdownOption(selectedOption);
        setSelectedStudentName(studentRole);
    
        // verification prompt (remains the same)
        const verificationPrompt = `Student message: "${studentMessage}"\n\
                                    Selected option of Toulmin Argument: "${selectedOption}"\n\
                                    Check if the student's answer matches the option among Toulmin Argument(Claim, Warrant, Qualifier, Rebuttal, None of the above).\
                                    If it is, only answer "correct"; if not, answer "incorrect".`;
    
        try {
            const response = await chat([{ role: 'user', content: verificationPrompt }]);
            if (response.trim().toLowerCase() === "correct" || response.trim().toLowerCase() === "correct.") {
                e.target.style.backgroundColor = "lightgreen";
            } else if (response.trim().toLowerCase() === "incorrect" || response.trim().toLowerCase() === "incorrect.") {
                e.target.style.backgroundColor = "red";
            } 
        } catch (error) {
            console.error('Error verifying dropdown selection:', error);
        }
    };
  
    return (
        <div style={{ overflow: 'auto', display: 'flex', width: '100%', height: '100%' }}>
        <div id="chat" className='Students' style={{ width: '50%' }}>
            {hasScenarioStarted[scenarioIndex] ?
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }} >
                    <div id="students-conversation" className="students-container" style={{ height: topHeight }}>
                        {
                            conversation.map((res, i) => {
                                const result = res.content;
                                return (
                                    <div key={i} style={{ display: 'flex', border: 'none'}}>
                                        <UserInput
                                            prompt={result}
                                            user={res.role}
                                            index={i}
                                            onLabelAdd={(newLabel: TextLabel) => {
                                                // 현재 대화 복사
                                                const currentConversation = { ...conversation[i] };
                                                // labels 배열이 없으면 초기화
                                                if (!currentConversation.labels) {
                                                    currentConversation.labels = [];
                                                }
                                                
                                                // 기존에 같은 위치에 라벨이 있는지 확인
                                                const existingIndex = currentConversation.labels.findIndex(
                                                    l => l.start === newLabel.start && l.end === newLabel.end
                                                );
                                                
                                                if (existingIndex !== -1) {
                                                    // 기존 라벨 업데이트
                                                    currentConversation.labels[existingIndex] = {
                                                        ...newLabel,
                                                        isVerified: false // Add the missing isVerified property
                                                    };
                                                } else {
                                                    // 새 라벨 추가
                                                    currentConversation.labels.push({
                                                        ...newLabel,
                                                        isVerified: false // Add the missing isVerified property
                                                    });
                                                }
                                                
                                                // 대화 업데이트
                                                updateConversation(currentConversation);
                                                
                                                // 강제 리렌더링 트리거
                                                setTimeout(() => {
                                                    const refreshConv = { ...currentConversation };
                                                    updateConversation(refreshConv);
                                                }, 200);
                                            }}
                                        />
                                    </div>
                                );
                            })
                        }
                        <p ref={messagesEndRef} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '0%' }}>
                            <button 
                                className="chat-button" 
                                onClick={advanceStudentConversation}
                                disabled={areStudentsResponding}
                                title="Fast forward to next student responses"
                                style={{ backgroundColor: '#f5f5f5', width: '100%', display: 'flex', justifyContent: 'center' }}
                            >
                                <LuFastForward size={20} />
                            </button>
                            <div style={{ display: 'flex', gap: '5px', width: '100%', justifyContent: 'center', marginBottom: '0%' }}>

                                <button 
                                    className="chat-button" 
                                    onClick={forceVerifyAllLabels}
                                    style={{ backgroundColor: '#f5f5f5' }}
                                >
                                    Done Labeling
                                </button>
                                <button className="chat-button" onClick={advanceDiagram} style={{ backgroundColor: '#f5f5f5' }}>Generate Diagram</button>
                            </div>
                        </div>
                    </div>
                    <div style={{ overflow: 'flex', display: 'flex', flexDirection: 'column', height: topHeight === '70%' ? '30%' : '70%' }}>
                        <div style={{ borderTop: '2px solid #ccc', backgroundColor: '#fff' }}>
                            {areStudentsResponding && <div className="chat-input" style={{ textAlign: 'center', padding: '6px' }}>Students are responding...</div>}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', alignItems: 'center' }}>
                            <form onSubmit={simulateConversation} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 8px', margin: 0, gap: '8px', width: '100%' }}>
                                <textarea
                                    className="chat-input"
                                    rows={2}
                                    cols={30}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Enter your message here"
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
                            <button className="expand-button" onClick={() => {
                                topHeight === '70%' ? setTopHeight("30%") :
                                    setTopHeight("70%")
                            }}>{topHeight === "70%" ? <RiExpandDiagonalLine size={24} />
                                : <RiCollapseDiagonalLine size={24} />}</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 1px', overflow: 'auto', height: '100%' }}>
                            <div className="feedback-container">
                                <div className="Feedback">
                                    <div style={{ fontWeight: "bold", padding: '0px 0', margin: 0 }}>
                                        <button className="feedback-button" disabled={isFetchingOverallFeedback || !hasScenarioStarted[scenarioIndex]} onClick={onFetchRecentFeedback} style={{ cursor: isFetchingInstantFeedback || !hasScenarioStarted[scenarioIndex] ? 'not-allowed' : 'pointer', marginTop: '8px' }}>
                                            Get Content Feedback
                                        </button>
                                    </div>

                                    {isFetchingInstantFeedback ?
                                        <div className="Feedback-text">
                                            <p>Fetching feedback...</p>
                                        </div> :
                                        <>{description ? <div className="Feedback-text">
                                            <div className="description">Descriptions: {description}</div>
                                            <div className="strategy">Strategies: {instantStrategy}</div>
                                        </div> : <></>}
                                        </>
                                    }
                                    <div style={{ fontWeight: "bold", padding: '0px 0', margin: 0 }}>

                                        <button
                                            className="feedback-button"
                                            disabled={isFetchingOverallFeedback || !hasScenarioStarted[scenarioIndex]}
                                            style={{ cursor: isFetchingOverallFeedback || !hasScenarioStarted[scenarioIndex] ? 'not-allowed' : 'pointer', marginTop: '8px' }}
                                            onClick={onEndTraining}
                                            type="submit">
                                            Get Structure Feedback
                                        </button>
                                    </div>
                                    <div className="feedback">
                                        {isFetchingOverallFeedback ?
                                            <p>Fetching feedback...</p> :
                                            <div style={{ padding: '0 8px' }}>
                                                <ReactMarkdown>
                                                    {overallFeedback}
                                                </ReactMarkdown>
                                            </div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> :
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', textAlign: 'start' }}>
                    <ReactMarkdown>
                        {guidance}
                    </ReactMarkdown>
                    <button className="chat-button" onClick={() => setHasScenarioStarted(scenarioIndex, true)} style={{ height: 'fit-content' }}>Start Training</button>
                </div>
            }
        </div >
        {showDiagram && (
            <div id="diagram" className='Diagram' style={{ width: '50%', height: '100%' }}>
                <Diagram step={diagramStep} />
            </div>
        )}
        </div>
    )

}
export default Students;