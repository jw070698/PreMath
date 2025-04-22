import React, { useState, useEffect } from 'react';
import { getStudentInitPrompt, STRUCTURED_FEEDBACK_PROMPT, } from '../utils/prompt';
import { studentStore } from '../stores/studentStore';
import './ScenarioSelection.css';
import UserInput from './UserInput';
import { Message, Conversation, StudentInfo } from '../utils/type'
import { chat } from '../utils/aiRequest';
import { Mapping } from '../utils/mapping';
import { useNavigate } from "react-router-dom";
const BaselineScenarioSelection = () => {
    const navigate = useNavigate();
    const { setBaselineScenario, baselineScenario, setCurrentSystem, setTutorUpSecenario, participantId, tutorUpSecenario, changeScenario, overallStrategies, instantStrategies, setOverallStrategies, setInstantStrategies, latestMessage, updateStudents, scenarioIndex, updeateMessageDatabase, updateConversationDatabase, updateLatestMessage, initializeMessageBox, initializeConversation, updateConversation, updateMessageBox, studentInfo, conversation, messageBox } = studentStore(state => ({
        setBaselineScenario: state.setBaselineScenario,
        setTutorUpSecenario: state.setTutorUpSecenario,
        overallStrategies: state.overallStrategies,
        tutorUpSecenario: state.tutorUpSecenario,
        instantStrategies: state.instantStrategies,
        setOverallStrategies: state.setOverallStrategies,
        setInstantStrategies: state.setInstantStrategies,
        latestMessage: state.latestMessage,
        setCurrentSystem: state.setCurrentSystem,
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
        baselineScenario: state.baselineScenario,
    }));

    const onClickScenario = (idx: number) => {
        // setCurrentSystem('b');
        setBaselineScenario(idx);
        const currentScenario = Mapping[participantId - 1].basetraining[baselineScenario].scenario - 1
        const mappingIndex = Mapping[participantId - 1].basetraining[idx].scenario - 1
        if (currentScenario === mappingIndex) {
            return;
        }
        changeScenario(mappingIndex);
        setBaselineScenario(idx);
        updateStudents(mappingIndex);
        console.log('mappingIndex', mappingIndex)

    }
    return (
        <div className="selection">
            <h1 style={{ fontSize: '28px' }}>Choose a scenario:</h1>

            {
                [0, 1].map((idx) => {
                    return (
                        <div key={idx}>
                            <button
                                className={`scenario-button ${idx === baselineScenario ? 'active-scenario' : 'inactive-scenario'}`}
                                onClick={() => onClickScenario(idx)}>Scenario {idx + 1}
                            </button>
                        </div>
                    )
                })
            }
            <div>
                <button className='scenario-button'
                    onClick={() => {
                        setCurrentSystem('btest');
                        const mappingIndex = Mapping[participantId - 1].basetest.scenario - 1
                        updateStudents(mappingIndex);
                        navigate('/test')

                    }}
                >Test</button>
            </div>
        </div>
    )
}
export default BaselineScenarioSelection;