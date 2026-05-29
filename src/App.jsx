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
    redo,
    clearAll
  } = useStore();

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  
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

  const getMousePos = (e) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const transform = stage.getAbsoluteTransform().invert();
    return transform.point(pointer);
  };

  const exportAsPNG = (stage) => {
    if (!stage) return;
    const originalX = stage.x();
    const originalY = stage.y();
    const originalScale = stage.scaleX();

    stage.setAttrs({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    stage.batchDraw();

    const dataURL = stage.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = 'canvas-export.png';
    link.href = dataURL;
    link.click();

    stage.setAttrs({ x: originalX, y: originalY, scaleX: originalScale, scaleY: originalScale });
    stage.batchDraw();
  };

  const exportAsSVG = (shapes) => {
    if (shapes.length === 0) {
      alert("No shapes to export!");
      return;
    }

    // Find bounding box to set viewbox
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shapes.forEach(s => {
      if (s.type === 'rect') {
        minX = Math.min(minX, s.x);
        minY = Math.min(minY, s.y);
        maxX = Math.max(maxX, s.x + s.width);
        maxY = Math.max(maxY, s.y + s.height);
      } else if (s.type === 'circle') {
        minX = Math.min(minX, s.x - s.radius);
        minY = Math.min(minY, s.y - s.radius);
        maxX = Math.max(maxX, s.x + s.radius);
        maxY = Math.max(maxY, s.y + s.radius);
      } else if (s.type === 'line' || s.type === 'pen') {
        for (let i = 0; i < s.points.length; i += 2) {
          minX = Math.min(minX, s.points[i]);
          minY = Math.min(minY, s.points[i+1]);
          maxX = Math.max(maxX, s.points[i]);
          maxY = Math.max(maxY, s.points[i+1]);
        }
      }
    });

    // Add padding
    const padding = 20;
    const width = (maxX - minX) + padding * 2;
    const height = (maxY - minY) + padding * 2;
    const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`;

    let svgContent = '';
    shapes.forEach(s => {
      const fill = s.fill || 'none';
      const stroke = s.stroke || 'black';
      const strokeWidth = s.strokeWidth || 2;
      const opacity = s.opacity ?? 1;

      if (s.type === 'rect') {
        svgContent += `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />\n`;
      } else if (s.type === 'circle') {
        svgContent += `<circle cx="${s.x}" cy="${s.y}" r="${s.radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />\n`;
      } else if (s.type === 'line' || s.type === 'pen') {
        const pointsStr = s.points.join(' ');
        // For 'line', we might want to connect start and end? No, Konva Line is a path.
        // A simple polyline is usually enough for Konva Line/Pen.
        svgContent += `<polyline points="${pointsStr}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />\n`;
      }
    });

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${svgContent}</svg>`;
    
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'canvas-export.svg';
    link.click();
    URL.revokeObjectURL(url);
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
        if (prev.length < 2) return [pos.x, pos.y, pos.x, pos.y];
        return [prev[0], prev[1], pos.x, pos.y];
      } else {
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
        display: 'flex', gap: '6px', background: 'white', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        alignItems: 'center', fontFamily: 'sans-serif'
      }}>
        {/* Drawing Tools */}
        <div style={{ display: 'flex', gap: '4px', padding: '4px', background: '#f5f5f5', borderRadius: '8px' }}>
          <button 
            onClick={() => setTool('select')} 
            style={{ 
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              backgroundColor: tool === 'select' ? '#fff' : 'transparent',
              boxShadow: tool === 'select' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              fontWeight: tool === 'select' ? 'bold' : 'normal' 
            }}
          >选择</button>
          <button 
            onClick={() => setTool('rect')} 
            style={{ 
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              backgroundColor: tool === 'rect' ? '#fff' : 'transparent',
              boxShadow: tool === 'rect' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              fontWeight: tool === 'rect' ? 'bold' : 'normal' 
            }}
          >矩形</button>
          <button 
            onClick={() => setTool('circle')} 
            style={{ 
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              backgroundColor: tool === 'circle' ? '#fff' : 'transparent',
              boxShadow: tool === 'circle' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              fontWeight: tool === 'circle' ? 'bold' : 'normal' 
            }}
          >圆形</button>
          <button 
            onClick={() => setTool('line')} 
            style={{ 
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              backgroundColor: tool === 'line' ? '#fff' : 'transparent',
              boxShadow: tool === 'line' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              fontWeight: tool === 'line' ? 'bold' : 'normal' 
            }}
          >直线</button>
          <button 
            onClick={() => setTool('pen')} 
            style={{ 
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              backgroundColor: tool === 'pen' ? '#fff' : 'transparent',
              boxShadow: tool === 'pen' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              fontWeight: tool === 'pen' ? 'bold' : 'normal' 
            }}
          >画笔</button>
        </div>

        <div style={{ width: '1px', height: '24px', background: '#ddd', margin: '0 4px' }} />

        {/* History Tools */}
        <div style={{ display: 'flex', gap: '4px', padding: '4px', background: '#f5f5f5', borderRadius: '8px' }}>
          <button 
            onClick={undo} 
            style={{ 
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              backgroundColor: 'transparent',
            }}
          >撤销</button>
          <button 
            onClick={redo} 
            style={{ 
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              backgroundColor: 'transparent',
            }}
          >重做</button>
        </div>

        <div style={{ width: '1px', height: '24px', background: '#ddd', margin: '0 4px' }} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => { if(window.confirm('Are you sure?')) clearAll(); }} 
            style={{ 
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              color: '#ff4d4f', background: 'transparent',
            }}
          >清空</button>
          <button 
            onClick={() => exportAsPNG(stageRef.current)}
            style={{ 
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              backgroundColor: '#e6f7ff', color: '#1890ff'
            }}
          >PNG</button>
          <button 
            onClick={() => exportAsSVG(shapes)}
            style={{ 
              padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
              backgroundColor: '#f6ffed', color: '#52c41a'
            }}
          >SVG</button>
        </div>
      </div>



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
        onDragEnd={handleShapeDragEnd}
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
              return <Rect key={shape.id} {...commonProps} width={shape.width} height={shape.height} />;
            } else if (shape.type === 'circle') {
              return <Circle key={shape.id} {...commonProps} radius={shape.radius} />;
            } else if (shape.type === 'line') {
              return <Line key={shape.id} {...commonProps} points={shape.points} tension={0} lineCap="round" lineJoin="round" hitStrokeWidth={20} />;
            } else if (shape.type === 'pen') {
              return <Line key={shape.id} {...commonProps} points={shape.points} tension={0.5} lineCap="round" lineJoin="round" hitStrokeWidth={20} />;
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
