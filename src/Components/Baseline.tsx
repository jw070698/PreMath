import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getStudentInitPrompt, problems, STRUCTURED_FEEDBACK_PROMPT, problem, getInitialTutorDialogue, FEED_BACK_PROMPT, bigPicturePrompt } from '../utils/prompt';
import { studentStore } from '../stores/studentStore';
import './Baseline.css';
import UserInput from './UserInput';
import { Message, Conversation, StudentInfo } from '../utils/type'
import { chat, bigChat } from '../utils/aiRequest';
import ReactMarkdown from 'react-markdown';
import { beforeStartGuidance, baselineGuidance } from '../utils/guidance';
import { Mapping } from '../utils/mapping'
import { baselineScenarios, baselineQuestion, baselineDescription, baselineTask } from '../utils/baseline'
import { getDatabase, get, ref, child, push, update, onValue, set } from "firebase/database";
import { db } from '../backend/firebase';
import Markdown from 'react-markdown';
import { RiCollapseDiagonalLine, RiExpandDiagonalLine } from 'react-icons/ri';
interface BaselineProps {
    sceIndex: number,
    problemIndex: number,
}
const Baseline: React.FC<BaselineProps> = ({ sceIndex, problemIndex }) => {
    const { descriptionOfStudents, baselineScenario, participantId, setAnswerDatabase, answerDatabase, setDescriptionOfStudents, instantStrategies, setInstantStrategies, overallStrategies, setOverallStrategies, conversationDatabase, students, loadLog, scenarioIndex, initializeMessageBox, initializeConversation, updateConversation, updateMessageBox, studentInfo, conversation, messageBox, hasScenarioStarted, setHasScenarioStarted }
        = studentStore(state => ({
            baselineScenario: state.baselineScenario,
            setAnswerDatabase: state.setAnswerDatabase,
            answerDatabase: state.answerDatabase,
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
    // const mapInfo = Mapping[participantId - 1]
    const [userAnswer, setUserAnswer] = useState('');
    const [feedbackShown, setFeedbackShown] = useState(false);
    const [jsonData, setJsonData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [guidanceRead, setGuidanceRead] = useState<boolean>(false);
    const longHeight = '70%';
    const shortHeight = '30%';
    const [topHeight, setTopHeight] = useState<string>(longHeight);

    useEffect(() => {

        setFeedbackShown(false);
        const fetchData = async () => {
            try {
                const scenarioIndex = Mapping[participantId - 1].basetraining[baselineScenario].scenario
                const response = await fetch(`/scenario${scenarioIndex}.json`);
                if (!response.ok) {
                    throw new Error(` / scenario${scenarioIndex}.json ,Network response was not ok`,);
                }
                const data = await response.json();
                setJsonData(data);
            } catch (error: any) {
                setError('Failed to fetch JSON data: ' + error.message);
                console.error('Error fetching JSON:', error);
            }
        };

        fetchData();
    }, []);


    const [userAnswers, setUserAnswers] = useState<string[]>(['']);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setUserAnswer(e.target.value);

    };
    const handleKeyPress = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        return;
        if (e.key === 'Enter') {
            setUserAnswers([...userAnswers, userAnswer]);
            setAnswerDatabase(baselineScenario, [...answerDatabase[baselineScenario], userAnswer]);
            await updateAnswerToDatabase(userAnswer);
            setUserAnswer('');
        }
    };
    const GetFeedback = () => {
        setFeedbackShown(true);
    }
    const startTraining = () => {
        setGuidanceRead(true);
    }
    useEffect(() => {

        const currentAnswers = answerDatabase[baselineScenario];
        setUserAnswers(currentAnswers);
        setUserAnswer(currentAnswers[currentAnswers.length - 1]);

    }, [scenarioIndex]);
    const updateAnswerToDatabase = async (answer: string) => {
        const answerRef = ref(db, `user/${participantId}/baselineTraining/scenario${baselineScenario + 1}`);
        try {
            const snapshot = await get(answerRef);
            let existingAnswers: string[] = snapshot.val();
            if (snapshot.exists() && Array.isArray(existingAnswers)) {
                existingAnswers.push(answer);
                // update(answerRef, existingAnswers);
                await set(answerRef, existingAnswers);
                console.log('existingAnswers:', existingAnswers);
            } else {
                await set(answerRef, [answer]);
            }

        } catch (e) {
            console.error(e);
        }
    }
    const handleSubmit = async () => {

        // 
        await updateAnswerToDatabase(userAnswer);
        setUserAnswers([...userAnswers, userAnswer]);
        setAnswerDatabase(baselineScenario, [...answerDatabase[baselineScenario], userAnswer]);
        setUserAnswer('');
        console.log('User Answer:', userAnswer);
    };


    const renderTable = (): React.ReactNode => {
        if (error) {
            return <div>Error: {error}</div>;
        }

        if (!jsonData) {
            return <div>Loading...</div>;
        }

        return (
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Scenario</th>
                            <th>Strategies (Category and Instances)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jsonData.list.map((item: any, index: number) => (
                            <tr key={index}>
                                <td>{item.scenario}</td>
                                <td>
                                    {item.strategies.map((strategy: any, idx: number) => (
                                        <div key={idx}>
                                            <strong>{strategy.category}:</strong>
                                            <br />
                                            {strategy.instances.map((instance: string, i: number) => (
                                                <div key={i}>- {instance}</div>
                                            ))}
                                            <br />
                                        </div>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // const baselineSce = baselineScenario[sceIndex]

    const baselineDes = baselineDescription[sceIndex]
    const baselineQ = baselineQuestion
    return (
        <div className='Baseline'>
            {
                guidanceRead ?
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'auto', height: '100%' }}>
                        <div className="baseline-container" style={{ height: topHeight }}>
                            <div className="baseline-inner-container">
                                <h2>Baseline</h2>
                                <div>
                                    <h3>Scenario Description</h3>
                                    <p>{baselineDescription[sceIndex]}</p>
                                </div>

                                <div>
                                    <h3>Question</h3>
                                    <p>{baselineQuestion}</p>
                                </div>

                                <div>
                                    <h3>Task</h3>
                                    <p>{baselineTask}</p>
                                </div>
                                <div>
                                    <h3>Your answers</h3>
                                    <div>
                                        <div className="user-answers-list">
                                            {userAnswers.map((answer, index) => {
                                                console.log('anwers:', userAnswers)
                                                return (
                                                    <div key={index} className="user-answer-item">
                                                        {index + 1}. {answer}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%', padding: '8px 0', height: topHeight === longHeight ? shortHeight : longHeight }}>
                            <div style={{ display: 'flex', gap: 4, width: '100%' }}>
                                <textarea
                                    value={userAnswer}
                                    onChange={handleInputChange}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Please type your answer here"
                                    className="user-input"
                                />
                                <button onClick={handleSubmit} className="submit-button">Submit</button>
                                <button onClick={GetFeedback} style={{ height: 'fit-content' }}>Get Feedback</button>
                                <button className="expand-button" onClick={() => {
                                    topHeight === longHeight ? setTopHeight(shortHeight) :
                                        setTopHeight(longHeight)
                                }}>{topHeight === longHeight ? <RiExpandDiagonalLine size={24} />
                                    : <RiCollapseDiagonalLine size={24} />}</button>
                            </div>

                            <div>
                                {feedbackShown ? renderTable() : null}
                            </div>
                        </div>
                    </div>
                    :
                    <div>
                        <h2>Guidance</h2>
                        <ReactMarkdown>
                            {baselineGuidance}
                        </ReactMarkdown>
                        <button onClick={startTraining}>Start Training</button>
                    </div>
            }

        </div>
    )
}
export default Baseline;