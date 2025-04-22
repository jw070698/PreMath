import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line, Group } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { studentStore } from '../stores/studentStore';
import { chat } from '../utils/aiRequest';


interface DiagramProps {
  step: number;
}


interface ShapeConfig {
  id: string;
  type: 'rect' | 'rectWithText' | 'circle' | 'line' | 'cirWithText';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  studentName?: string;
  studentConversation?: string;
  points?: number[];
  fontSize?: number;
  draggable: boolean;
  fill?: string;
}

const Diagram: React.FC<DiagramProps> = ({ step }) => {
  useEffect(() => {
    console.log("Diagram step:", step);
  }, [step]);
  const conversation = studentStore(state => state.conversation);
  const dropdownData = studentStore(state => state.dropdownData);
  const conversationStr = JSON.stringify(conversation, null, 2);
  const dropdownDataStr = JSON.stringify(dropdownData, null, 2);

  console.log(conversation);
  console.log(dropdownData);
  const [shapes, setShapes] = useState<ShapeConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  //const [diagramLoaded, setDiagramLoaded] = useState(false);
  const { selectedDropdownOption, selectedStudentName } = studentStore(state => ({
    selectedDropdownOption: state.selectedDropdownOption,
    selectedStudentName: state.selectedStudentName,
  }));
  // In line editing
  const [isEditingText, setIsEditingText] = useState(false);
  const [editTextValue, setEditTextValue] = useState('');
  const [editShapeId, setEditShapeId] = useState<string | null>(null);

  useEffect(() => {
    console.log("selectedDropdownOption:", selectedDropdownOption);
    console.log("selectedStudentName:", selectedStudentName);
  }, [selectedDropdownOption, selectedStudentName]);

  const didFetchDiagramData = useRef(false);

  useEffect(() => {
    const fetchDiagramData = async () => {
      if (didFetchDiagramData.current) return;
      if (!selectedDropdownOption || !selectedStudentName) return;
      didFetchDiagramData.current = true;
      // (claim, grounds, warrant, qualifier, rebuttal, backing)
      // 처음 라벨링을 한 데 까지 반영해서 처음 만들고,
      // 아니면 어떤 버튼을 만들어서 한번에 처음부터 끝까지 generate 되는거
      const prompt = `Please generate a JSON array of diagram shape instructions to draw a diagram representing "${conversationStr}" with type "${dropdownDataStr}" based on Toulmin Argument(Data, Data Claim, Claim, Warrant, Qualifier, Rebuttal). 
                      Don't use student conversations that labeled as None of the above.
                      Make sure the diagram should be presented by following speaking timeline(from left to right).
                      Split diagrams by student name.
                      The JSON array should consist of objects following this format:
                      {
                        "id": string,
                        "type": "rect" | "rectWithText" | "circle" | "line" | "cirWithText",
                        "x": number,
                        "y": number,
                        "width"?: number,
                        "height"?: number,
                        "text"?: string,
                        "studentName"?: string,
                        "studentConversation"?: string,
                        "points"?: number[],
                        "fontSize"?: number,
                        "draggable": true,
                        "fill"?: string
                      }
                      Return only the JSON.
                      Specify what student conversation makes it to that specific type in "studentConversation".
                      One example is:
                      [
                        {
                            "id": "data1",
                            "type": "rectWithText",
                            "x": 50,
                            "y": 120,
                            "width": 150,
                            "height": 70,
                            "text": "Data",
                            "studentName": "Student1",
                            "studentConversation"?: "Discuss the growth factor and the percent change of q(x)=84(1)^x.",
                            "draggable": true,
                            "fill": "#add8e6",
                            "fontSize": 14
                        },
                        {
                            "id": "qualifier1",
                            "type": "rectWithText",
                            "x": 250,
                            "y": 120,
                            "width": 150,
                            "height": 70,
                            "text": "Qualifier",
                            "studentName": "Student2",
                            "studentConversation"?: "something",
                            "draggable": true,
                            "fill": "#8a2be2",
                            "fontSize": 14
                        },
                        {
                            "id": "claim1",
                            "type": "rectWithText",
                            "x": 450,
                            "y": 120,
                            "width": 150,
                            "height": 70,
                            "text": "Claim",
                            "studentName": "Student1",
                            "studentConversation"?: "It's not growth or decay.",
                            "draggable": true,
                            "fill": "#ffd700",
                            "fontSize": 14
                        },
                        {
                            "id": "warrant1",
                            "type": "rectWithText",
                            "x": 250,
                            "y": 220,
                            "width": 150,
                            "height": 70,
                            "text": "Warrant",
                            "studentName": "Student3",
                            "studentConversation"?: "Because the growth decay factor is one and it doesn't change.",
                            "draggable": true,
                            "fill": "#fa8072",
                            "fontSize": 14
                        },
                        {
                            "id": "rebuttal1",
                            "type": "rectWithText",
                            "x": 450,
                            "y": 30,
                            "width": 150,
                            "height": 70,
                            "text": "Rebuttal",
                            "studentName": "Student2",
                            "studentConversation"?: "something",
                            "draggable": true,
                            "fill": "#ff6347",
                            "fontSize": 14
                        },
                        {
                            "id": "line1",
                            "type": "line",
                            "points": [200, 155, 250, 155],
                            "draggable": true
                        },
                        {
                            "id": "line2",
                            "type": "line",
                            "points": [400, 155, 450, 155],
                            "draggable": true
                        },
                        {
                            "id": "line3",
                            "type": "line",
                            "points": [325, 190, 325, 220],
                            "draggable": true
                        },
                        {
                            "id": "line4",
                            "type": "line",
                            "points": [525, 100, 525, 120],
                            "draggable": true
                        }
                    ]`;

      try {
        const response = await chat([{ role: 'user', content: prompt }]);
        console.log("OpenAI response:", response);
        let trimmedResponse = response.replace(/^```(?:json)?\s*|```$/g, '').trim();
        const shapesFromAPI = JSON.parse(trimmedResponse);
        setShapes(shapesFromAPI);
      } catch (error) {
        console.error("Error fetching diagram data:", error);
      }
    };
    fetchDiagramData();
  }, [selectedDropdownOption, selectedStudentName]);

  // 
  const addRectangle = () => {
    const newRect: ShapeConfig = {
      id: `rect-${Date.now()}`,
      type: 'rect',
      x: 50,
      y: 50,
      width: 100,
      height: 60,
      draggable: true,
      fill: '#ff9999',
    };
    setShapes([...shapes, newRect]);
  };

  const handleSelect = (e: KonvaEventObject<MouseEvent>, shapeId: string) => {
    e.cancelBubble = true;
    setSelectedId(shapeId);
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent | MouseEvent>, shapeId: string) => {
    const x = e.target.x();
    const y = e.target.y();
    setShapes(prev =>
      prev.map(shape => (shape.id === shapeId ? { ...shape, x, y } : shape))
    );
  };

  const handleTextDblClick = (e: KonvaEventObject<MouseEvent>, shape: ShapeConfig) => {
    e.cancelBubble = true;
    setIsEditingText(true);
    setEditTextValue(shape.text || '');
    setEditShapeId(shape.id);
  };

  const handleEditComplete = () => {
    if (!editShapeId) return;
    setShapes(prev =>
      prev.map(shape =>
        shape.id === editShapeId ? { ...shape, text: editTextValue } : shape
      )
    );
    setIsEditingText(false);
    setEditShapeId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEditComplete();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px', backgroundColor: '#eee' }}>
        <button onClick={addRectangle}>Add Rect</button>
        
      </div>

      {/* In line editing */}
      {isEditingText && (
        <input
          style={{
            position: 'absolute',
            top: '80px',
            left: '800px',
            fontSize: '16px'
          }}
          value={editTextValue}
          onChange={(e) => setEditTextValue(e.target.value)}
          onBlur={handleEditComplete}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      )}

      {/* Canvas */}
      <Stage
        width={800}
        height={650}
        style={{ border: '1px solid #ccc', background: '#f9f9f9' }}
        onMouseDown={() => setSelectedId(null)}
      >
        <Layer>
          {shapes.map(shape => {
            switch (shape.type) {
              case 'rect':
                return (
                  <Rect
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    fill={shape.fill}
                    draggable={shape.draggable}
                    onClick={(e) => handleSelect(e, shape.id)}
                    onDblClick={(e) => handleTextDblClick(e, shape)}
                    onDragEnd={(e) => handleDragEnd(e, shape.id)}
                    stroke={shape.id === selectedId ? 'blue' : undefined}
                  />
                );
              case 'rectWithText':
                return (
                  <Group
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    draggable={shape.draggable}
                    onClick={(e) => handleSelect(e, shape.id)}
                    onDragEnd={(e) => handleDragEnd(e, shape.id)}
                  >
                    <Rect
                      width={shape.width}
                      height={shape.height}
                      fill={shape.fill}
                      stroke={shape.id === selectedId ? 'blue' : undefined}
                    />
                    <Text
                      text={shape.text + (shape.studentName ? ` (${shape.studentName})` : '') + (shape.studentConversation ? `\n${shape.studentConversation}` : "")}
                      fill="#000"
                      fontSize={shape.fontSize || 16}
                      x={10} 
                      y={10}
                    />
                  </Group>
                );
              case 'circle':
                return (
                  <Circle
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    radius={20}
                    fill={shape.fill}
                    draggable={shape.draggable}
                    onClick={(e) => handleSelect(e, shape.id)}
                    onDblClick={(e) => handleTextDblClick(e, shape)}
                    onDragEnd={(e) => handleDragEnd(e, shape.id)}
                    stroke={shape.id === selectedId ? 'blue' : undefined}
                  />
                );
                case 'cirWithText':
                  return (
                    <Group
                      key={shape.id}
                      x={shape.x}
                      y={shape.y}
                      draggable={shape.draggable}
                      onClick={(e) => handleSelect(e, shape.id)}
                      onDragEnd={(e) => handleDragEnd(e, shape.id)}
                    >
                      <Circle
                        width={shape.width}
                        height={shape.height}
                        fill={shape.fill}
                        stroke={shape.id === selectedId ? 'blue' : undefined}
                      />
                      <Text
                        text={shape.text + (shape.studentName ? ` (${shape.studentName})` : '') + (shape.studentConversation ? `\n${shape.studentConversation}` : "")}
                        fill="#000"
                        fontSize={shape.fontSize || 16}
                        x={10} 
                        y={10}
                      />
                    </Group>
                  );
              case 'line':
                return (
                  <Line
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    points={shape.points || []}
                    stroke="#333"
                    strokeWidth={2}
                    draggable={shape.draggable}
                    onClick={(e) => handleSelect(e, shape.id)}
                    onDblClick={(e) => handleTextDblClick(e, shape)}
                    onDragEnd={(e) => handleDragEnd(e, shape.id)}
                  />
                );
              /*case 'text':
                return (
                  <Text
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    text={shape.text}
                    fontSize={shape.fontSize}
                    fill={shape.fill}
                    draggable={shape.draggable}
                    onClick={(e) => handleSelect(e, shape.id)}
                    onDblClick={(e) => handleTextDblClick(e, shape)}
                    onDragEnd={(e) => handleDragEnd(e, shape.id)}
                    stroke={shape.id === selectedId ? 'blue' : undefined}
                  />
                );*/
              default:
                return null;
            }
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default Diagram;
