import React, { useState, useCallback, useRef } from 'react';
import './UserInput.css';
import './Students.css';
import { studentStore } from '../stores/studentStore';
import { Conversation, TextLabel } from '../utils/type';
import { db } from '../backend/firebase';
import { onValue, ref, update } from 'firebase/database';
import { chat } from '../utils/aiRequest';
import { getFirestore, doc, arrayUnion, updateDoc, setDoc } from 'firebase/firestore';

interface UserInputProps {
    prompt: string;
    user: string;
    index: number;
    onLabelAdd?: (label: TextLabel) => void;
}

interface LabelWithVerification extends TextLabel {
    isVerified: boolean;
    attempts: number;
}

const UserInput: React.FC<UserInputProps> = ({ prompt, user, index, onLabelAdd }) => {
    const { currentSystem, participantId, tutorUpSecenario, changeScenario, setDescriptionOfStudents, descriptionOfStudents, conversationDatabase, overallStrategies, instantStrategies, setOverallStrategies, setInstantStrategies, latestMessage, students, loadLog, scenarioIndex, updateLatestMessage, initializeMessageBox, initializeConversation, updateConversation, updateMessageBox, initializeLatestMessage, studentInfo, conversation, messageBox }
        = studentStore(state => ({
            currentSystem: state.currentSystem,
            participantId: state.participantId,
            changeScenario: state.changeScenario,
            descriptionOfStudents: state.descriptionOfStudents,
            setDescriptionOfStudents: state.setDescriptionOfStudents,
            instantStrategies: state.instantStrategies,
            overallStrategies: state.overallStrategies,
            setInstantStrategies: state.setInstantStrategies,
            setOverallStrategies: state.setOverallStrategies,
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
            tutorUpSecenario: state.tutorUpSecenario,
            // getResponse: state.getResponse
        }));
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const [selectedText, setSelectedText] = useState<{ text: string; start: number; end: number } | null>(null);
    const [labels, setLabels] = useState<LabelWithVerification[]>([]);
    const messageRef = useRef<HTMLDivElement>(null);

    const handleSelection = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setShowDropdown(false);
            return;
        }

        const range = selection.getRangeAt(0);
        const text = range.toString().trim();
        
        if (text && messageRef.current) {
            // Get the exact text content of the message
            const messageContent = messageRef.current.textContent || '';
            
            // Find the exact position of the selected text in the message
            const start = messageContent.indexOf(text);
            if (start === -1) {
                console.error('Selected text not found in message');
                return;
            }
            const end = start + text.length;
            
            const rect = range.getBoundingClientRect();
            const messageRect = messageRef.current.getBoundingClientRect();
            
            setSelectedText({
                text,
                start,
                end
            });
            
            setDropdownPosition({
                top: rect.bottom - messageRect.top,
                left: rect.left - messageRect.left
            });
            
            setShowDropdown(true);
        }
    };

    const verifyLabel = async (text: string, label: string): Promise<boolean> => {
        // For "none" label, we always return true since it's a valid option for any text
        if (label.toLowerCase() === 'none') {
            console.log('Label is "none", automatically verifying as true');
            return true;
        }
        
        // The simplified prompt for better verification results
        const prompt = `Analyze if the text: "${text}" is a ${label} in Toulmin's argument model.

Definitions:
- Data: Facts or evidence supporting the claim
- Data Claim: A partial claim based on data
- Claim: The main argument or position being proven
- Warrant: The reasoning that connects data to claim
- Qualifier: Words that limit the scope of the claim
- Rebuttal: Counter-arguments or exceptions to the claim

RESPOND ONLY WITH "true" or "false".`;

        try {
            const response = await chat([{ role: 'user', content: prompt }]);
            console.log('Label verification response:', response);
            
            // For more reliable verification, check if the response contains "true" or is affirmative
            const isTrue = 
                response.toLowerCase().includes('true') || 
                response.toLowerCase().includes('yes') ||
                response.toLowerCase().includes('correct');
                
            return isTrue;
        } catch (error) {
            console.error('Label verification failed:', error);
            return false;
        }
    };

    const handleLabel = async (labelType: string) => {
        if (selectedText) {
            console.log("Applying label:", labelType, "to text:", selectedText.text);
            
            // 기존에 같은 위치에 라벨이 있는지 확인
            const existingIndex = labels.findIndex(
                l => l.start === selectedText.start && l.end === selectedText.end
            );
            
            // 현재 시도 횟수 계산
            let currentAttempts = 1;
            if (existingIndex !== -1) {
                currentAttempts = (labels[existingIndex].attempts || 0) + 1;
            }
            
            // 검증 상태 확인
            let isVerified = false;
            if (labelType.toLowerCase() === 'none') {
                isVerified = true;
            } else {
                // 이전에 맞춘 적이 있는지 확인
                const wasVerifiedBefore = existingIndex !== -1 && labels[existingIndex].isVerified;
                
                // 현재 라벨이 이전과 동일한지 확인
                const isSameLabel = existingIndex !== -1 && labels[existingIndex].label === labelType;
                
                // 현재 라벨 검증
                const currentVerification = await verifyLabel(selectedText.text, labelType);
                
                // 이전에 맞췄거나 현재 맞춘 경우 true
                isVerified = wasVerifiedBefore || currentVerification;
            }
            
            console.log(`Label "${labelType}" is verified:`, isVerified);
            
            // 새 라벨 객체 생성
            const newLabel: LabelWithVerification = {
                text: selectedText.text,
                label: labelType,
                start: selectedText.start,
                end: selectedText.end,
                isVerified: isVerified,
                attempts: currentAttempts
            };
            
            let updatedLabels: LabelWithVerification[];
            if (existingIndex !== -1) {
                // 기존 라벨 업데이트
                updatedLabels = [...labels];
                updatedLabels[existingIndex] = newLabel;
            } else {
                // 새 라벨 추가
                updatedLabels = [...labels, newLabel];
            }
            
            // 로컬 상태 업데이트
            setLabels(updatedLabels);
            console.log("Updated labels:", updatedLabels);
            
            try {
                const firestore = getFirestore();
                const userDocRef = doc(firestore, "users", participantId.toString());
                const scenarioDocRef = doc(userDocRef, "tutorupTraining", `scenario${tutorUpSecenario + 1}`);

                // 현재 메시지 찾기
                const currentMessageIndex = conversation.findIndex(
                    msg => msg.content === prompt && msg.role === user.toLowerCase()
                );

                if (currentMessageIndex !== -1) {
                    // 현재 메시지의 labels 배열 업데이트
                    const updatedConversation = [...conversation];
                    const currentMessage = updatedConversation[currentMessageIndex];
                    
                    if (!currentMessage.labels) {
                        currentMessage.labels = [];
                    }

                    // 기존 라벨 찾기
                    const existingLabelIndex = currentMessage.labels.findIndex(
                        (l) => l.start === selectedText.start && l.end === selectedText.end
                    );

                    // 현재 메시지의 labels 업데이트
                    if (existingLabelIndex !== -1) {
                        currentMessage.labels[existingLabelIndex] = newLabel;
                    } else {
                        currentMessage.labels.push(newLabel);
                    }

                    // Firestore에 저장
                    await setDoc(scenarioDocRef, {
                        conversation: {
                            [currentMessageIndex]: {
                                content: prompt,
                                role: user.toLowerCase(),
                                labels: currentMessage.labels.map(label => ({
                                    ...label,
                                    isVerified: label.start === selectedText.start && 
                                              label.end === selectedText.end ? 
                                              isVerified : label.isVerified
                                }))
                            }
                        }
                    }, { merge: true });

                    // 로컬 상태 업데이트
                    updateConversation(currentMessage);
                }
                console.log("Label data saved to Firestore");
            } catch (error) {
                console.error("Error saving label data to Firestore:", error);
            }
            
            // 전역 상태 업데이트 (conversation)
            if (onLabelAdd) {
                console.log("Passing label to parent component");
                onLabelAdd(newLabel);
            }
            
            // Diagram 렌더링을 위한 값 설정
            console.log("Setting store values for diagram");
            studentStore.getState().setSelectedDropdownOption(labelType);
            studentStore.getState().setSelectedStudentName(user);
            
            // 드롭다운 데이터 설정
            studentStore.getState().setDropdownData(prev => ({
                ...prev,
                [user]: labelType
            }));
            
            setShowDropdown(false);
            setSelectedText(null);
        }
    };

    const renderTextWithLabels = () => {
        if (!labels.length) return prompt;

        let lastIndex = 0;
        const result = [];
        const sortedLabels = [...labels].sort((a, b) => a.start - b.start);

        // 겹치는 라벨 제거
        const nonOverlappingLabels = [];
        for (let i = 0; i < sortedLabels.length; i++) {
            const current = sortedLabels[i];
            let overlaps = false;
            
            for (let j = 0; j < nonOverlappingLabels.length; j++) {
                const existing = nonOverlappingLabels[j];
                // 라벨이 겹치는지 확인
                if (current.start < existing.end && current.end > existing.start) {
                    overlaps = true;
                    break;
                }
            }
            
            if (!overlaps) {
                nonOverlappingLabels.push(current);
            }
        }

        // 정렬된 비겹침 라벨 사용
        const finalLabels = nonOverlappingLabels.sort((a, b) => a.start - b.start);

        finalLabels.forEach((label, i) => {
            // Make sure indices are within bounds
            const safeStart = Math.max(0, Math.min(lastIndex, prompt.length));
            const labelStart = Math.max(0, Math.min(label.start, prompt.length));
            const labelEnd = Math.max(0, Math.min(label.end, prompt.length));
            
            // 라벨 이전의 일반 텍스트 추가
            if (labelStart > safeStart) {
                result.push(
                    <span key={`text-${i}`}>
                        {prompt.slice(safeStart, labelStart)}
                    </span>
                );
            }

            // 라벨이 적용된 텍스트 추가 (ensure text exists)
            if (labelStart < labelEnd) {
                result.push(
                    <span
                        key={`label-${i}`}
                        className={`label-${label.label.toLowerCase()}`}
                        title={`${label.label}${label.isVerified ? ' ✓' : ' ✗'}`}
                        style={{
                            backgroundColor: getLabelColor(label.label, label.isVerified),
                            padding: '2px 4px',
                            borderRadius: '4px',
                            margin: '0 2px',
                            border: `2px solid ${label.isVerified ? '#4CAF50' : '#f44336'}`,
                            position: 'relative',
                            display: 'inline-block'
                        }}
                    >
                        {prompt.slice(labelStart, labelEnd)}
                        <span style={{
                            position: 'absolute',
                            top: '-20px',
                            right: '0',
                            backgroundColor: label.isVerified ? '#4CAF50' : '#f44336',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            zIndex: 1
                        }}>
                            {label.label} {label.isVerified ? '✓' : '✗'}
                        </span>
                    </span>
                );
            }

            lastIndex = labelEnd;
        });

        // 마지막 라벨 이후의 텍스트 추가
        if (lastIndex < prompt.length) {
            result.push(
                <span key="text-end">
                    {prompt.slice(lastIndex)}
                </span>
            );
        }

        return result;
    };

    const getLabelColor = (label: string, isVerified?: boolean) => {
        // 검증 결과에 따라 배경색 결정
        if (isVerified) {
            return '#e8f5e9';  // 연한 초록색 (맞을 때)
        } else {
            return '#fce4ec';  // 연한 핑크색 (틀릴 때)
        }
    };

    if (user === 'system') {
        return null
    }
    const jumpToDialogue = () => {
        if (currentSystem === 'ttest' || currentSystem === 'btest') {
            return;
        }

        if (user === 'tutor') {
            //清理converasation
            const conToKeep: Conversation[] = conversation.slice(0, scenarioIndex + 1);
            initializeConversation(conToKeep);
            //清理messageBox
            const messageToKeep = messageBox.map((message, idx) => message.slice(0, scenarioIndex + 1));
            initializeMessageBox(messageToKeep[0], messageToKeep[1]);
            //initializeMessageBox(messageToKeep[0], messageToKeep[1], messageToKeep[2]);

            // get current green bubble count and update the green bubble count
            const userRef = ref(db, `user/${participantId}`);
            let currentGreenBubbleCount = 0;
            onValue(userRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    currentGreenBubbleCount = data.tutorupTraining[`scenario${tutorUpSecenario + 1}`].greenBubbleCount;
                } else {
                    console.log('Data not found');
                }
            });

            const newCount = currentGreenBubbleCount + 1;
            const updates = {
                [`user/${participantId}/tutorupTraining/scenario${tutorUpSecenario + 1}/greenBubbleCount`]: newCount
            };
            update(ref(db), updates).then(() => {
                console.log(`Green bubble count updated to ${newCount}`);
            }).catch((error) => {
                console.error('Error updating green bubble count:', error);
            });
        }
    }
    const role = user.toLowerCase() === 'teacher' ? 'teacher' : 'student';
    return (
        <div className={`message-wrapper ${role}`} style={{ width: '100%' }}>
            <div className={`${user.toLowerCase()}`} style={{
                display: 'flex',
                justifyContent: user.toLowerCase() === 'teacher' ? 'flex-end' : 'flex-start',
                width: '100%'
            }}>
                <div className="sender-name" style={{
                    position: 'absolute',
                    top: '-16px',
                    [user.toLowerCase() === 'teacher' ? 'right' : 'left']: 0,
                    fontSize: '14px',
                    color: '#666'
                }}>
                    {user.toLowerCase() === 'teacher' ? 'Teacher' : user}
                </div>
                <div 
                    className="message-bubble"
                    onMouseUp={handleSelection}
                    ref={messageRef}
                    style={{
                        backgroundColor: user.toLowerCase() === 'teacher' ? '#e8f5e9' : '#c6d9f8',
                        borderRadius: '20px',
                        borderTopLeftRadius: user.toLowerCase() === 'teacher' ? '20px' : '4px',
                        borderTopRightRadius: user.toLowerCase() === 'teacher' ? '4px' : '20px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        lineHeight: 1.4,
                        boxShadow: '0 1px 1px rgba(0, 0, 0, 0.1)',
                        marginTop: '16px',
                        [user.toLowerCase() === 'teacher' ? 'marginLeft' : 'marginRight']: '30%',
                        maxWidth: '70%',
                        textAlign: 'left'
                    }}
                >
                    {renderTextWithLabels()}
                </div>
            </div>
            
            {showDropdown && (
                <div 
                    className="label-dropdown"
                    style={{
                        position: 'absolute',
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        zIndex: 1000
                    }}
                >
                    <select 
                        onChange={(e) => {
                            if (e.target.value) {
                                handleLabel(e.target.value);
                            }
                        }}
                        value=""
                    >
                        <option value="">Select label</option>
                        <option value="data">Data</option>
                        <option value="dataclaim">Data Claim</option>
                        <option value="claim">Claim</option>
                        <option value="warrant">Warrant</option>
                        <option value="qualifier">Qualifier</option>
                        <option value="rebuttal">Rebuttal</option>
                        <option value="none">None</option>
                    </select>
                </div>
            )}
        </div>
    );
};

export default UserInput;
