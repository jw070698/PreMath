import logo from './logo.svg';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Scenarios.css';
import UserInput from '../Components/UserInput';
import { chat, bigChat } from '../utils/aiRequest';
import { FEED_BACK_PROMPT, initialPrompt, systemTips, initialUser, initialStudent } from '../utils/prompt'
import Display from '../Components/Display';
import Students from '../Components/Students';
import ScenarioSelection from '../Components/ScenarioSelection';
import { MdSchool } from 'react-icons/md';
import { studentStore } from '../stores/studentStore';
import Baseline from '../Components/Baseline';
import BaselineScenarioSelection from '../Components/BaselineScenarioSelection'
import { Mapping } from '../utils/mapping'

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
function BaselineScenarios() {


    const { participantId, name, updateStudents, email, jannTeachingTime, baselineScenario } = studentStore(state => ({
        participantId: state.participantId,
        name: state.name,
        email: state.email,
        jannTeachingTime: state.jannTeachingTime,
        baselineScenario: state.baselineScenario,
        updateStudents: state.updateStudents,
    }));
    const [scenarioIndex, setScenarioIndex] = useState(0);
    const [problemIndex, setProblemIndex] = useState(0);
    useEffect(() => {
        const sceIdx = Mapping[participantId - 1].basetraining[baselineScenario].scenario - 1
        const probIdx = Mapping[participantId - 1].basetraining[baselineScenario].problem - 1
        setScenarioIndex(sceIdx)
        setProblemIndex(probIdx)

        updateStudents(sceIdx)
    }, [baselineScenario]);

    const [prompt, setPrompt] = useState("");
    const [response, setResponse] = useState<string[]>([""]);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'system',
            content: initialPrompt,

        }, {
            role: 'user',
            content: initialUser
        },
        {
            role: 'assistant',
            content: initialStudent
        }
    ]);

    const [feedback, setFeedback] = useState<string>("");
    const onEndTraining = async (e: React.FormEvent) => {
        e.preventDefault();
        const promptToSend = FEED_BACK_PROMPT + "Conversation Dialogues: ####" + JSON.stringify(messages) + "####";
        const result = await chat([{ role: 'user', content: promptToSend }]);
        console.log('the result of feedback', result);
        setFeedback(result);
    }
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const userMessage: Message = { role: 'user', content: prompt };//add new user message
        const systemTipsMessage: Message = { role: 'system', content: systemTips };
        const updatedMessages = [...messages, userMessage, systemTipsMessage];
        const updatedMessagesWithoutSystemTips = [...messages, userMessage];
        setMessages([...messages, userMessage]);
        //     const initialResult = await chat(updatedMessages);
        //     const initialAssistantMessage: Message = { role: 'assistant', content: initialResult };
        //     // Self-check the initial response
        //     const checkPrompt = `Step by step, please check the following initial response and ensure it follows these rules:
        //     rules:
        //     1. students should never say let's do something
        //     2. students should not encourage each other
        //     3. students should not ask other to do something
        //     4. students should not promote team work
        //     5. students should never use any strategies to promote their engagement, like using positive words to encourage other students or bring up any actions that will promote their engagement.
        //     6. only students' conversation should be simulated, no facial or body actions or sounds
        //     7. this is an online learning environment, so students' responses should be limited to their conversations. 
        //     
        //     After checking the initial response, you should only give feedback and adjust suggestions based on the rules and don't have to adjust the initial response based on the feedback.
        //     
        //     Initial Response: "${initialResult}
        //     
        // 
        //     "
        //     `;
        //    
        //     const checkResult = await chat([...updatedMessages, initialAssistantMessage, { role: 'system', content: checkPrompt }]);
        //     const feedbackMessage: Message = { role: 'assistant', content: 'feedback; ' + checkResult };
        //     // Adjust the response based on feedback if necessary
        //     const adjustPrompt = `Initial Response: "${initialResult}"
        //     Feedback: "${checkResult}"
        //     Based on the feedback, please adjust the initial response and generate the final response. You should only give the final response after you have adjusted the initial response based on the feedback.`;
        //     const finalResult = await chat([...updatedMessages, initialAssistantMessage, feedbackMessage, { role: 'system', content: adjustPrompt }]);
        //     const finalAssistantMessage: Message = { role: 'assistant', content: finalResult };
        //     setMessages([...updatedMessages, initialAssistantMessage, feedbackMessage, finalAssistantMessage]);
        //     setResponse([...response, finalResult]);
        //     console.log('updated messages', [...updatedMessages, initialAssistantMessage, feedbackMessage, finalAssistantMessage]);
        console.log('before call API')
        const result = await chat(updatedMessages);
        const assistantMessage: Message = { role: 'assistant', content: result };//receive new assistant message

        setMessages([...updatedMessagesWithoutSystemTips, assistantMessage]);
        setResponse([...response, result]);
        setPrompt('');
        console.log('messages', messages);

    };

    return (
        <div className="App" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            <nav id="titlebar"
                style={{
                    width: '100%',
                    height: '3%',
                    backgroundColor: '#FADFEE',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '1rem',
                    padding: '0.5% 0',
                }}
            >
                <MdSchool size={28} />
                <h1>Strategy Up</h1>
            </nav>
            <div className='Body-container'>
                {/* <ScenarioSelection /> */}
                <BaselineScenarioSelection />

                <Display sceIndex={scenarioIndex} problemIndex={problemIndex} />
                <Baseline sceIndex={scenarioIndex} problemIndex={problemIndex} />
            </div>

        </div>
    );
}

export default BaselineScenarios;
