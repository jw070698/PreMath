import React, { useState, useEffect } from 'react';
import { getStudentInitPrompt, STRUCTURED_FEEDBACK_PROMPT, } from '../utils/prompt';
import { studentStore } from '../stores/studentStore';
import './StudentInfo.css';
import { problem } from '../utils/prompt';
import { Message, Conversation, StudentInfo } from '../utils/type'
interface StudentBarProps {
    student: StudentInfo
}
const StudentBar: React.FC<StudentBarProps> = ({ student }) => {
    const { conversationDatabase, latestMessage, students, loadLog, scenarioIndex, updateLatestMessage, initializeMessageBox, initializeConversation, updateConversation, updateMessageBox, initializeLatestMessage, studentInfo, conversation, messageBox }
        = studentStore(state => ({
            latestMessage: state.latestMessage,
            studentInfo: state.studentInfo,
            messageBox: state.messageBox,
            conversation: state.conversation,
            updateLatestMessage: state.updateLatestMessage,
            updateMessageBox: state.updateMessageBox,
            initializeMessageBox: state.initializeMessageBox,
            updateConversation: state.updateConversation,
            initializeLatestMessage: state.initializeLatestMessage,
            initializeConversation: state.initializeConversation,
            scenarioIndex: state.scenarioIndex,
            conversationDatabase: state.conversationDatabase,
            loadLog: state.loadLog,
            students: state.students,
            // getResponse: state.getResponse
        }));

    return (
        <div className="studentBar">
            <div className="studentName">
                {student.name}
            </div>
            <div className="studentPersonal">
                <div className="characteristics">
                    <div
                        style={{
                            fontWeight: 'bold',
                            fontSize: '15px'
                        }}
                    >Grade: {student.grade}</div>
                    <div
                        style={{
                            fontWeight: 'bold',
                            fontSize: '15px'
                        }}
                    >Age: {student.age}</div>
                    <div
                        style={{
                            fontWeight: 'bold',
                            fontSize: '15px'
                        }}
                    >Level of Knowledge: </div>
                    <ul style={{ padding: '4px', margin: '2px', marginLeft: '8px' }}>
                        {student.personals.characteristics.map((_, i) => {
                            return (
                                <li key={i}>{_}</li>
                            )
                        })}
                    </ul>
                </div>
                <div className="ability"
                >
                    <div style={{
                        fontWeight: 'bold',
                        fontSize: '15px'
                    }}>Argumentation Skills: </div>
                    <ul style={{ padding: '4px', margin: '2px', marginLeft: '8px' }}>

                        {student.personals.ability.map((_, i) => {
                            return (
                                <li>{_}</li>
                            )
                        })}
                    </ul>
                </div>
            </div>
        </div >
    )
}
export default StudentBar;