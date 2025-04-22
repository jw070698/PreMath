import React, { useState, useEffect } from 'react';
import { getStudentInitPrompt, STRUCTURED_FEEDBACK_PROMPT, } from '../utils/prompt';
import { studentStore } from '../stores/studentStore';
import './ScenarioSelection.css';
import UserInput from './UserInput';
import { Message, Conversation, StudentInfo } from '../utils/type'
import { chat } from '../utils/aiRequest';
import { Mapping } from '../utils/mapping';
import { useNavigate } from "react-router-dom";
const ScenarioSelection = () => {
    const navigate = useNavigate();
    const { setTutorUpSecenario, participantId, setCurrentSystem, tutorUpSecenario, changeScenario, overallStrategies, instantStrategies, setOverallStrategies, setInstantStrategies, latestMessage, updateStudents, scenarioIndex, updeateMessageDatabase, updateConversationDatabase, updateLatestMessage, initializeMessageBox, initializeConversation, updateConversation, updateMessageBox, studentInfo, conversation, messageBox } = studentStore(state => ({
        setCurrentSystem: state.setCurrentSystem,
        setTutorUpSecenario: state.setTutorUpSecenario,
        overallStrategies: state.overallStrategies,
        tutorUpSecenario: state.tutorUpSecenario,
        instantStrategies: state.instantStrategies,
        setOverallStrategies: state.setOverallStrategies,
        setInstantStrategies: state.setInstantStrategies,
        latestMessage: state.latestMessage,
        studentInfo: state.studentInfo,
        messageBox: state.messageBox,
        conversation: state.conversation,
        updateStudents: state.updateStudents,
        updateLatestMessage: state.updateLatestMessage,
        updateMessageBox: state.updateMessageBox,
        initializeMessageBox: state.initializeMessageBox,
        updateConversation: state.updateConversation,
        // initializeLatestMessage: state.initializeLatestMessage,
        initializeConversation: state.initializeConversation,
        scenarioIndex: state.scenarioIndex,
        changeScenario: state.changeScenario,
        updeateMessageDatabase: state.updeateMessageDatabase,
        updateConversationDatabase: state.updateConversationDatabase,
        participantId: state.participantId,
    }));
    const scenarioDatabase = [0, 1, 2, 3]
    const addLatestToMessageBox = (idx: number) => {
        const stuIdx = idx % 3;
        let stu1 = stuIdx == 0 ? 1 : 0;
        let stu2 = stuIdx == 2 ? 1 : 2;
        // stu1 = stu1 + scenarioIndex * 3;
        // stu2 = stu2 + scenarioIndex * 3;
        const stu1Message = {
            role: 'user',
            content: `${latestMessage[stu1].content}`
        };
        const stu2Message = {
            role: 'user',
            content: ` ${latestMessage[stu2].content}`
        };
        const agentMessage = {
            role: 'assistant',
            content: ` ${latestMessage[stuIdx].content}`
        };
        const tutorMessage = {
            role: 'user',
            content: ` ${prompt}`
        };
        const updatedMessages = [...messageBox[stuIdx], stu1Message, stu2Message, agentMessage, tutorMessage] as Message[];
        updateMessageBox(stuIdx, updatedMessages);
    }
    const onClickScenario = (idx: number) => {
        const currentScenario = Mapping[participantId - 1].tutraining[tutorUpSecenario].scenario - 1
        const mappingIndex = Mapping[participantId - 1].tutraining[idx].scenario - 1
        if (currentScenario === mappingIndex) {
            return;
        }
        console.log('mappingIndex', mappingIndex);
        changeScenario(mappingIndex);
        setTutorUpSecenario(idx);
        updateStudents(mappingIndex);
        addLatestToMessageBox(currentScenario);
        updeateMessageDatabase(currentScenario);
        updateConversationDatabase(currentScenario);



    }
    
    return (
        <div className="selection" style={{ display: 'flex', flexDirection: 'column', position: 'relative', left: '0.1%', width: '100%', height: '100%', gap: '12px' }}>
            <h1 style={{ fontSize: '17px' }}>Choose a scenario:</h1>
            <select className="scenario-dropdown" value={tutorUpSecenario} onChange={(e) => onClickScenario(Number(e.target.value))}>
                {[0, 1].map((idx) => (
                    <option key={idx} value={idx}>Scenario {idx + 1}</option>
                ))}
            </select>
            {/*<button className='scenario-button'
                onClick={() => {
                    const mappingIndex = Mapping[participantId - 1].tutest.scenario - 1
                    updateStudents(mappingIndex);
                    setCurrentSystem('ttest');
                    navigate('/test')
                }}
            >Test</button>*/}
        </div>
    )
}
export default ScenarioSelection;