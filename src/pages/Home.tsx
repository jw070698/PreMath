import { useEffect, useState } from "react";
import './Home.css';
import { guidance, userStudyGuidance } from "../utils/guidance";
import ReactMarkdown from "react-markdown";
import { MdSchool } from "react-icons/md";
import { studentStore } from '../stores/studentStore';
import { useNavigate } from "react-router-dom";
import { Mapping } from '../utils/mapping';
import { db, firestore } from '../backend/firebase';
import { set, ref, onValue } from "firebase/database";
import { doc, getDoc, setDoc } from "firebase/firestore";

const Home = () => {
  const [readGuidance, setReadGuidance] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { participantId, updateStudents, changeScenario, name, email, jannTeachingTime, setTutorUpSecenario, setBaselineSecenario, setParticipantId, setName, setEmail, setJannTeachingTime } = studentStore(state => ({
    participantId: state.participantId,
    setTutorUpSecenario: state.setTutorUpSecenario,
    setBaselineSecenario: state.setBaselineScenario,
    changeScenario: state.changeScenario,
    name: state.name,
    email: state.email,
    jannTeachingTime: state.jannTeachingTime,
    setParticipantId: state.setParticipantId,
    setName: state.setName,
    setEmail: state.setEmail,
    setJannTeachingTime: state.setJannTeachingTime,
    updateStudents: state.updateStudents,
  }));

  // make a form handler to store the participant information
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const participantId = formData.get('participant-id') as string;
      const participantIdInt = parseInt(participantId);
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      const jannTeachingTime = formData.get('jann-teaching-time') as string;
  
      setParticipantId(participantIdInt);
      setName(name);
      setEmail(email);
      setJannTeachingTime(jannTeachingTime);
  
      // Firestore에서 사용자가 존재하는지 확인
      const userDocRef = doc(firestore, 'users', participantIdInt.toString());
      const userDoc = await getDoc(userDocRef);
      let userExists = userDoc.exists();
  
      if (!userExists) {
        // Firestore에 사용자 정보 저장
        const userInfo = {
          userId: participantIdInt,
          userName: name,
          email: email,
          howLong: jannTeachingTime,
          baselineTraining: {
            scenario1: [],
            scenario2: [],
          },
          baselineTest: {
            conversation: []
          },
          tutorupTraining: {
            scenario1: {
              conversation: [],
              overallFeedback: [],
              instantFeedback: [],
              overallFeedbackCount: 0,
              instantFeedbackCount: 0,
              resetBtnCount: 0,
              greenBubbleCount: 0
            },
            scenario2: {
              conversation: [],
              overallFeedback: [],
              instantFeedback: [],
              overallFeedbackCount: 0,
              instantFeedbackCount: 0,
              resetBtnCount: 0,
              greenBubbleCount: 0
            },
          },
          tutorUpTest: {
            conversation: []
          }
        };
  
        await setDoc(userDocRef, userInfo);
        console.log(`Add ID ${participantIdInt} into Firestore.`);
      } else {
        console.log(`ID ${participantIdInt} already exists.`);
      }
  
      if (participantId in ['1', '2', '3', '4', '5', '6'] || participantId === '6') {
        console.log('participantId', participantId);
        const mappingIndex = Mapping[parseInt(participantId) - 1].basetraining[0].scenario - 1
        changeScenario(mappingIndex);
        updateStudents(mappingIndex);
        setBaselineSecenario(0);
      } else {
        const mappingIndex = Mapping[parseInt(participantId) - 1].tutraining[0].scenario - 1
        changeScenario(mappingIndex);
        updateStudents(mappingIndex);
        setTutorUpSecenario(0);
      }
      
      navigate('/scenarios');
    } catch (error) {
      console.error("Error saving user information:", error);
      alert("Error saving user information.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '1rem',
        backgroundColor: '#FADFEE',
        padding: '0 16px',
        borderRadius: '8px',
      }}>
        <MdSchool size={32} />
        <h1>Tutor Training</h1>
      </div>
      <div style={{ display: 'flex', maxWidth: '50%', height: '70%' }}>
        {!readGuidance ?
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <ReactMarkdown>
              {userStudyGuidance}
            </ReactMarkdown>
            <button className="home-button" onClick={() => setReadGuidance(true)}>I understand, continue</button>
          </div>
          : (
            <div className="form-container">
              <button className="home-button" style={{ width: '100%', marginBottom: '32px' }} onClick={() => setReadGuidance(false)}>Back</button>
              <h2>Participant Information</h2>
              <form onSubmit={handleSubmit}>
                <label>
                  Participant ID
                  <input type="text" name="participant-id" required />
                </label>
                <label>
                  Name
                  <input type="text" name="name" required />
                </label>
                <label>
                  Email
                  <input type="email" name="email" required />
                </label>
                <label>
                  How long have you taught in JANN?
                  <input type="text" name="jann-teaching-time" required />
                </label>
                <button 
                  className="home-button" 
                  style={{ width: '100%' }} 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Submit"}
                </button>
              </form>
            </div>
          )}
      </div>
    </div>
  );
}

export default Home;
