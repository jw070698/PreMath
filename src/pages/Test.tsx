import logo from './logo.svg';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Test.css';
import UserInput from '../Components/UserInput';
import { chat, bigChat } from '../utils/aiRequest';
import { FEED_BACK_PROMPT, initialPrompt, systemTips, initialUser, initialStudent } from '../utils/prompt'
import Display from '../Components/Display';
import Students from '../Components/Students';
import ScenarioSelection from '../Components/ScenarioSelection';
import { MdSchool } from 'react-icons/md';
import { studentStore } from '../stores/studentStore';
import { Mapping } from '../utils/mapping'
import TestSimulation from '../Components/TestSimulation'

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
function Scenarios() {

  const { participantId, currentSystem, setTutorUpSecenario, tutorUpSecenario, name, email, jannTeachingTime, setCurrentSystem } = studentStore(state => ({
    participantId: state.participantId,
    currentSystem: state.currentSystem,
    setCurrentSystem: state.setCurrentSystem,
    setTutorUpSecenario: state.setTutorUpSecenario,
    tutorUpSecenario: state.tutorUpSecenario,
    name: state.name,
    email: state.email,
    jannTeachingTime: state.jannTeachingTime,
  }));

  const [tuScenarioIndex, setTuScenarioIndex] = useState(0);
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
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [problemIndex, setProblemIndex] = useState(0);
  // const t = Mapping[participantId - 1].tutraining
  // useEffect(() => { console.log('tutorUpSecenario', tutorUpSecenario, participantId) }, [participantId]);
  useEffect(() => {
    var sceIdx = 0
    var probIdx = 0
    if (currentSystem == 'ttest') {
      sceIdx = Mapping[participantId - 1].tutest.scenario - 1
      probIdx = Mapping[participantId - 1].tutest.problem - 1
    } else {
      sceIdx = Mapping[participantId - 1].basetest.scenario - 1
      probIdx = Mapping[participantId - 1].basetest.problem - 1
    }

    //   const sceIdx = Mapping[participantId - 1].tutraining[tutorUpSecenario].scenario - 1
    // const probIdx = Mapping[participantId - 1].tutraining[tutorUpSecenario].problem - 1
    setScenarioIndex(sceIdx)
    setProblemIndex(probIdx)

  }, [tutorUpSecenario]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userMessage: Message = { role: 'user', content: prompt };//add new user message
    const systemTipsMessage: Message = { role: 'system', content: systemTips };
    const updatedMessages = [...messages, userMessage, systemTipsMessage];
    const updatedMessagesWithoutSystemTips = [...messages, userMessage];
    setMessages([...messages, userMessage]);

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
        <h1>Test</h1>
      </nav>
      <div className='Body-container'>
        {/* <ScenarioSelection /> */}
        <Display sceIndex={scenarioIndex} problemIndex={problemIndex} />
        <TestSimulation />
      </div>

    </div>
  );
}

export default Scenarios;
