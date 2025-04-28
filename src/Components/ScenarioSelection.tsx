import React, { useState, useEffect } from 'react';
import { getStudentInitPrompt, STRUCTURED_FEEDBACK_PROMPT, problems, getInitialTutorDialogue } from '../utils/prompt';
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
        try {
            // 시나리오 전환 시 기존 대화 내용 초기화
            initializeMessageBox([], []);
            initializeConversation([]);
        } catch (error) {
            console.error('Error resetting conversation:', error);
        }
    }

    const InitializeScenario = async (scenarioIdx: number) => {
        const problemIndex = Mapping[participantId - 1].tutraining[tutorUpSecenario].problem - 1;
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
        const students = tutorUpSecenario === 0 ? [7, 8] : [1, 2];
        const initialMessages = students.map((studentId) => {
            return {
                role: 'user' as const,
                content: `${studentInfo[studentId].name}: ${studentInfo[studentId].initialDialogue}`
            }
        });
        const initialConversations = students.map((studentId) => ({
            role: studentInfo[studentId].name,
            content: studentInfo[studentId].initialDialogue
        }));
        const initialPrompts = students.map((studentId) => ({
            role: 'system' as const,
            content: getStudentInitPrompt(studentInfo[studentId].name, studentInfo[studentId].personals, problems[problemIndex])
        }));
        const initialSelfMessages = students.map((studentId) => {
            return {
                role: 'assistant' as const,
                content: studentInfo[studentId].initialDialogue
            }
        });

        // Initialize message box and conversation
        initializeMessageBox(
            [initialPrompts[0], initialTutorMessage, initialSelfMessages[0], initialMessages[1]],
            [initialPrompts[1], initialTutorMessage, initialMessages[0], initialSelfMessages[1]]
        );
        initializeConversation([initialTutorConversation, initialConversations[0], initialConversations[1]]);
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
        const students = idx === 0 ? [7, 8] : [1, 2];
        studentStore.setState({ students });
        // 새 시나리오 초기화
        InitializeScenario(mappingIndex);
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