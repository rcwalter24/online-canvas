import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Transformer } from 'react-konva';
import { useStore } from './store';
import PropertyEditor from './PropertyEditor';

const App = () => {
  const { 
    shapes, 
    selectedShapeId, 
    setSelectedShapeId, 
    addShape, 
    setTool, 
    tool,
    updateShape,
    undo,
    redo
  } = useStore();

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  
  // For drawing tools
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);

  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.min(Math.max(newScale, 0.1), 10);

    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, []);

  const handleDragEnd = (e) => {
    if (e.target !== stageRef.current) return;
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const getMousePos = (e) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const transform = stage.getAbsoluteTransform().invert();
    return transform.point(pointer);
  };

  const handleStageMouseDown = (e) => {
    if (tool === 'select') {
        if (e.target === e.target.getStage()) {
            setSelectedShapeId(null);
        }
        return;
    }

    const pos = getMousePos(e);
    if (!pos) return;

    if (tool === 'line' || tool === 'pen') {
      setIsDrawing(true);
      setCurrentPoints([pos.x, pos.y]);
      return;
    }

    const common = {
      x: pos.x,
      y: pos.y,
      fill: '#333',
      stroke: '#000',
      strokeWidth: 2,
      opacity: 1,
    };

    if (tool === 'rect') {
      addShape({ ...common, type: 'rect', width: 100, height: 100 });
    } else if (tool === 'circle') {
      addShape({ ...common, type: 'circle', radius: 50 });
    }
    
    setTool('select');
  };

  const handleStageMouseMove = (e) => {
    if (!isDrawing) return;

    const pos = getMousePos(e);
    if (!pos) return;

    setCurrentPoints((prev) => {
      if (tool === 'line') {
        // For line, we only update the last two coordinates (the end point)
        if (prev.length < 2) return [pos.x, pos.y, pos.x, pos.y];
        return [prev[0], prev[1], pos.x, pos.y];
      } else {
        // For pen, append the new point
        return [...prev, pos.x, pos.y];
      }
    });
  };

  const handleStageMouseUp = () => {
    if (!isDrawing) return;

    if (tool === 'line' || tool === 'pen') {
      const common = {
        fill: 'transparent', 
        stroke: '#333',
        strokeWidth: 2,
        opacity: 1,
      };
      addShape({ ...common, type: tool, points: currentPoints });
    }

    setIsDrawing(false);
    setCurrentPoints([]);
    setTool('select');
  };

  const handleTransformEnd = (e) => {
    const node = e.target;
    updateShape(node.id(), {
      x: node.x(),
      y: node.y(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
      rotation: node.rotation(),
    });
  };

  const handleShapeDragEnd = (e) => {
    updateShape(e.target.id(), {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  useEffect(() => {
    if (transformerRef.current && selectedShapeId) {
      const stage = stageRef.current.getStage();
      const selectedNode = stage.findOne(`#${selectedShapeId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedShapeId]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#f0f0f0', 
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
      <div style={{ 
        position: 'absolute', top: 10, left: 10, zIndex: 10,
        display: 'flex', gap: '10px', background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <button onClick={() => setTool('select')} style={{ fontWeight: tool === 'select' ? 'bold' : 'normal' }}>选择</button>
        <button onClick={() => setTool('rect')} style={{ fontWeight: tool === 'rect' ? 'bold' : 'normal' }}>矩形</button>
        <button onClick={() => setTool('circle')} style={{ fontWeight: tool === 'circle' ? 'bold' : 'normal' }}>圆形</button>
        <button onClick={() => setTool('line')} style={{ fontWeight: tool === 'line' ? 'bold' : 'normal' }}>直线</button>
        <button onClick={() => setTool('pen')} style={{ fontWeight: tool === 'pen' ? 'bold' : 'normal' }}>画笔</button>
        <div style={{ width: '1px', background: '#eee', margin: '0 5px' }}></div >
        <button onClick={undo} style={{ fontWeight: tool === 'undo' ? 'bold' : 'normal' }}>撤销</button>
        <button onClick={redo} style={{ fontWeight: tool === 'redo' ? 'bold' : 'normal' }}>重做</button>
      </div >

      <PropertyEditor />

      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        draggable={tool === 'select'}
        onDragEnd={handleDragEnd}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
      >
        <Layer>
          {shapes.map((shape) => {
            const commonProps = {
              key: shape.id,
              id: shape.id,
              x: shape.x,
              y: shape.y,
              fill: shape.fill,
              stroke: shape.stroke,
              strokeWidth: shape.strokeWidth,
              opacity: shape.opacity,
              draggable: true,
              onDragEnd: handleShapeDragEnd,
              onClick: (e) => {
                e.cancelBubble = true; 
                setSelectedShapeId(shape.id);
              },
              onTransformEnd: handleTransformEnd,
            };

            if (shape.type === 'rect') {
              return <Rect {...commonProps} width={shape.width} height={shape.height} />;
            } else if (shape.type === 'circle') {
              return <Circle {...commonProps} radius={shape.radius} />;
            } else if (shape.type === 'line') {
              return <Line {...commonProps} points={shape.points} tension={0} lineCap="round" lineJoin="round" />;
            } else if (shape.type === 'pen') {
              return <Line {...commonProps} points={shape.points} tension={0.5} lineCap="round" lineJoin="round" />;
            }
            return null;
          })}
          {isDrawing && (
            <Line
              points={currentPoints}
              stroke="#333"
              strokeWidth={2}
              opacity={0.5}
              tension={tool === 'pen' ? 0.5 : 0}
              lineCap="round"
              lineJoin="round"
            />
          )}
          <Transformer ref={transformerRef} />
        </Layer>
      </Stage>
    </div >
  );
};

export default App;
