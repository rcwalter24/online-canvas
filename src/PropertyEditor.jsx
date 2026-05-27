import React from 'react';
import { useStore } from './store';

const PropertyEditor = () => {
  const { 
    selectedShapeId, 
    setSelectedShapeId, 
    shapes, 
    updateShape,
    moveShape,
    removeShape
  } = useStore();

  const selectedShape = shapes.find(s => s.id === selectedShapeId);

  if (!selectedShape) {
    return (
      <div style={{
        position: 'absolute', top: 60, right: 10, width: 200,
        background: 'white', padding: '15px', borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', fontSize: '14px', color: '#666'
      }}>
        请先选择一个图形
      </div >
    );
  }

  const handleChange = (key, value) => {
    updateShape(selectedShapeId, { [key]: value });
  };

  // Define which properties to show for which shape types
  const renderDimensionControls = () => {
    switch (selectedShape.type) {
      case 'rect':
        return (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label>宽度: {selectedShape.width}</label>
              <input 
                type="range" 
                min="10" 
                max="500" 
                step="1"
                value={selectedShape.width} 
                onChange={(e) => handleChange('width', parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label>高度: {selectedShape.height}</label>
              <input 
                type="range" 
                min="10" 
                max="500" 
                step="1"
                value={selectedShape.height} 
                onChange={(e) => handleChange('height', parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div >
          </>
        );
      case 'circle':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label>半径: {selectedShape.radius}</label>
            <input 
              type="range" 
              min="5" 
              max="250" 
              step="1"
              value={selectedShape.radius} 
              onChange={(e) => handleChange('radius', parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div >
        );
      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'absolute', top: 60, right: 10, width: 220,
      background: 'white', padding: '15px', borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)', fontSize: '14px', color: '#666',
      zIndex: 10, display: 'flex', flexDirection: 'column', gap: '15px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
        属性编辑 ({selectedShape.type})
      </div >

      {/* Dimension Controls (Conditional) */}
      {renderDimensionControls()}

      {/* Fill Color (Only for shapes that can be filled) */}
      {(selectedShape.type === 'rect' || selectedShape.type === 'circle') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label>填充颜色</label>
          <input 
            type="color" 
            value={selectedShape.fill} 
            onChange={(e) => handleChange('fill', e.target.value)}
            style={{ width: '100%', height: '30px', cursor: 'pointer' }}
          />
        </div >
      )}

      {/* Stroke Color */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label>描边颜色</label>
        <input 
          type="color" 
          value={selectedShape.stroke} 
          onChange={(e) => handleChange('stroke', e.target.value)}
          style={{ width: '100%', height: '30px', cursor: 'pointer' }}
        />
      </div >

      {/* Stroke Width */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label>描边宽度: {selectedShape.strokeWidth}</label>
        <input 
          type="range" 
          min="0" 
          max="20" 
          step="1"
          value={selectedShape.strokeWidth} 
          onChange={(e) => handleChange('strokeWidth', parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div >

      {/* Opacity */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label>透明度: {Math.round(selectedShape.opacity * 100)}%</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01"
          value={selectedShape.opacity} 
          onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div >

      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>图层控制</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
          <button 
            onClick={() => moveShape(selectedShapeId, 'forward')}
            style={{ padding: '5px', fontSize: '12px', cursor: 'pointer' }}
          >
            上移一层
          </button>
          <button 
            onClick={() => moveShape(selectedShapeId, 'backward')}
            style={{ padding: '5px', fontSize: '12px', cursor: 'pointer' }}
          >
            下移一层
          </button>
          <button 
            onClick={() => moveShape(selectedShapeId, 'front')}
            style={{ padding: '5px', fontSize: '12px', cursor: 'pointer' }}
          >
            置于顶层
          </button>
          <button 
            onClick={() => moveShape(selectedShapeId, 'back')}
            style={{ padding: '5px', fontSize: '12px', cursor: 'pointer' }}
          >
            置于底层
          </button>
        </div >
      </div >

      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <button 
          onClick={() => removeShape(selectedShapeId)}
          style={{ padding: '5px', fontSize: '12px', cursor: 'pointer', color: 'red' }}
        >
          删除图形
        </button>
        <button 
          onClick={() => setSelectedShapeId(null)}
          style={{ padding: '5px', fontSize: '12px', cursor: 'pointer', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          取消选择
        </button>
      </div >
    </div >
  );
};

export default PropertyEditor;
