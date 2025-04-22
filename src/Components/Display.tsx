import React from 'react';
import { problems, scenarioDescription } from '../utils/prompt';
import { studentStore } from '../stores/studentStore';
import './Display.css';
import StudentBar from './StudentInfo';
import { studentInfo } from '../utils/studentInfo';
import ScenarioSelection from './ScenarioSelection';

interface DisplayProps {
  sceIndex: number;
  problemIndex: number;
}

const Display: React.FC<DisplayProps> = ({ sceIndex, problemIndex }) => {
  const { students } = studentStore(state => ({
    students: state.students
  }));

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '25%',
      margin: 0,
      padding: 0,
      gap: 0
    }}>
      <div style={{ margin: 0, padding: 0 }}>
        <ScenarioSelection />
      </div>
      
      {/* Left Side */}
      <div style={{ height: '100%', overflow: 'auto', margin: 10, padding: 0 }}>
        {/* General Scenario */}
        <div style={{ fontWeight: 'bold', backgroundColor: 'rgba(247, 221, 231, 0.66)', padding: '8px 0' }}>
          General Scenario:
        </div>
        <p style={{ padding: '0 8px', textAlign: 'left' }}>
          {scenarioDescription[sceIndex]}
        </p>
        
        {/* The Problem */}
        <div style={{ fontWeight: 'bold', backgroundColor: 'rgba(247, 221, 231, 0.66)', padding: '8px 0' }}>
          Math Problem:
        </div>
        <p style={{ padding: '0 8px', textAlign: 'left' }}>
          {problems[problemIndex]}
        </p>

        {/* Student Information */}
        <div style={{ fontWeight: 'bold', backgroundColor: 'rgba(247, 221, 231, 0.66)', padding: '8px 0' }}>
          Student Information:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px 8px' }}>
          {students.map((s, idx) => (
            <StudentBar student={studentInfo[s]} key={idx} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Display;

