import React, { useState, useRef, useEffect } from 'react';

interface DataPoint {
  x: number;
  y: number;
  value: number;
}

interface HeatmapConfig {
  width: number;
  height: number;
  cellSize: number;
  minColor: string;
  maxColor: string;
  backgroundColor: string;
  showValues: boolean;
  radius: number;
  blur: number;
}

const Test: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<DataPoint[]>([
    { x: 20, y: 30, value: 10 },
    { x: 50, y: 40, value: 25 },
    { x: 80, y: 60, value: 15 },
    { x: 30, y: 70, value: 30 },
    { x: 60, y: 20, value: 20 },
    { x: 40, y: 50, value: 35 },
    { x: 70, y: 80, value: 18 },
    { x: 15, y: 15, value: 8 },
    { x: 85, y: 85, value: 40 },
    { x: 45, y: 45, value: 28 },
  ]);

  const [config, setConfig] = useState<HeatmapConfig>({
    width: 400,
    height: 400,
    cellSize: 10,
    minColor: '#00ff00',
    maxColor: '#ff0000',
    backgroundColor: '#ffffff',
    showValues: true,
    radius: 30,
    blur: 15,
  });

  // 生成热力图
  const generateHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    canvas.width = config.width;
    canvas.height = config.height;

    // 清空画布并设置背景色
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, config.width, config.height);

    // 创建热力图数据网格
    const gridWidth = Math.ceil(config.width / config.cellSize);
    const gridHeight = Math.ceil(config.height / config.cellSize);
    const grid = new Array(gridWidth * gridHeight).fill(0);
    const weightSum = new Array(gridWidth * gridHeight).fill(0);

    // 计算每个点的权重影响
    data.forEach((point) => {
      const centerX = point.x;
      const centerY = point.y;
      const value = point.value;

      // 计算影响半径内的所有格子
      const startX = Math.max(
        0,
        Math.floor((centerX - config.radius) / config.cellSize),
      );
      const endX = Math.min(
        gridWidth - 1,
        Math.floor((centerX + config.radius) / config.cellSize),
      );
      const startY = Math.max(
        0,
        Math.floor((centerY - config.radius) / config.cellSize),
      );
      const endY = Math.min(
        gridHeight - 1,
        Math.floor((centerY + config.radius) / config.cellSize),
      );

      for (let i = startX; i <= endX; i++) {
        for (let j = startY; j <= endY; j++) {
          const cellX = i * config.cellSize + config.cellSize / 2;
          const cellY = j * config.cellSize + config.cellSize / 2;
          const distance = Math.sqrt(
            (cellX - centerX) ** 2 + (cellY - centerY) ** 2,
          );

          if (distance < config.radius) {
            const weight =
              Math.exp(
                -Math.pow(distance, 2) / (2 * Math.pow(config.blur, 2)),
              ) * value;
            const index = j * gridWidth + i;
            grid[index] += weight;
            weightSum[index] += Math.exp(
              -Math.pow(distance, 2) / (2 * Math.pow(config.blur, 2)),
            );
          }
        }
      }
    });

    // 归一化权重
    for (let i = 0; i < grid.length; i++) {
      if (weightSum[i] > 0) {
        grid[i] = grid[i] / weightSum[i];
      }
    }

    // 找出最大值和最小值用于归一化
    const maxValue = Math.max(...grid);
    const minValue = Math.min(...grid);

    // 绘制热力图
    for (let i = 0; i < gridWidth; i++) {
      for (let j = 0; j < gridHeight; j++) {
        const value = grid[j * gridWidth + i];
        const normalizedValue =
          maxValue > minValue ? (value - minValue) / (maxValue - minValue) : 0;

        // 颜色插值
        const color = interpolateColor(
          config.minColor,
          config.maxColor,
          normalizedValue,
        );

        ctx.fillStyle = color;
        ctx.fillRect(
          i * config.cellSize,
          j * config.cellSize,
          config.cellSize,
          config.cellSize,
        );

        // 显示数值
        if (config.showValues && value > 0) {
          ctx.fillStyle = '#000000';
          ctx.font = `${Math.max(8, config.cellSize * 0.6)}px Arial`;
          ctx.fillText(
            (Math.round(value * 100) / 100).toString(), // 转换为字符串
            i * config.cellSize + config.cellSize / 4,
            j * config.cellSize + config.cellSize / 1.5,
          );
        }
      }
    }
  };

  // 颜色插值函数
  const interpolateColor = (
    color1: string,
    color2: string,
    factor: number,
  ): string => {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // 十六进制转RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  // 导入数据
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let importedData: DataPoint[];

        // 尝试解析JSON
        if (file.name.endsWith('.json')) {
          importedData = JSON.parse(content);
        }
        // 尝试解析CSV
        else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n');
          importedData = lines
            .slice(1)
            .filter((line) => line.trim())
            .map((line) => {
              const values = line.split(',');
              return {
                x: parseFloat(values[0]),
                y: parseFloat(values[1]),
                value: parseFloat(values[2]),
              };
            });
        } else {
          throw new Error('不支持的文件格式');
        }

        setData(importedData);
      } catch (error) {
        console.error('导入数据失败:', error);
        alert('数据格式错误，请使用JSON或CSV格式');
      }
    };
    reader.readAsText(file);
  };

  // 导出数据
  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'heatmap-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // 添加随机数据点
  const addRandomPoint = () => {
    const newPoint: DataPoint = {
      x: Math.random() * config.width,
      y: Math.random() * config.height,
      value: Math.random() * 100,
    };
    setData([...data, newPoint]);
  };

  // 清除所有数据
  const clearData = () => {
    setData([]);
  };

  // 配置变更处理
  const handleNumberConfigChange = (
    key: keyof Pick<
      HeatmapConfig,
      'width' | 'height' | 'cellSize' | 'radius' | 'blur'
    >,
    value: string,
  ) => {
    const numValue = parseInt(value) || 0;
    setConfig((prev) => ({ ...prev, [key]: numValue }));
  };

  const handleColorConfigChange = (
    key: 'minColor' | 'maxColor',
    value: string,
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleBooleanConfigChange = (key: 'showValues', value: boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // 数据变更时重新生成热力图
  useEffect(() => {
    generateHeatmap();
  }, [data, config]);

  // 示例数据模板
  const loadExampleData = () => {
    const exampleData: DataPoint[] = [
      { x: 50, y: 50, value: 45 },
      { x: 120, y: 80, value: 60 },
      { x: 200, y: 150, value: 80 },
      { x: 280, y: 200, value: 55 },
      { x: 350, y: 300, value: 70 },
      { x: 150, y: 250, value: 40 },
      { x: 250, y: 350, value: 65 },
      { x: 320, y: 120, value: 35 },
      { x: 80, y: 320, value: 50 },
      { x: 380, y: 380, value: 90 },
    ];
    setData(exampleData);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>热力图配置工具</h1>

      {/* 控制面板 */}
      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3>数据控制</h3>
          <div
            style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}
          >
            <input
              type="file"
              accept=".json,.csv"
              onChange={importData}
              style={{ padding: '5px' }}
            />
            <button onClick={exportData} style={buttonStyle}>
              导出数据
            </button>
            <button onClick={addRandomPoint} style={buttonStyle}>
              添加随机点
            </button>
            <button onClick={clearData} style={buttonStyle}>
              清除所有点
            </button>
            <button onClick={loadExampleData} style={buttonStyle}>
              加载示例数据
            </button>
          </div>
        </div>

        <div>
          <h3>热力图配置</h3>
          <div
            style={{
              display: 'grid',
              gap: '10px',
              gridTemplateColumns: '1fr 1fr',
            }}
          >
            <label>
              宽度:
              <input
                type="number"
                value={config.width}
                onChange={(e) =>
                  handleNumberConfigChange('width', e.target.value)
                }
                style={inputStyle}
              />
            </label>
            <label>
              高度:
              <input
                type="number"
                value={config.height}
                onChange={(e) =>
                  handleNumberConfigChange('height', e.target.value)
                }
                style={inputStyle}
              />
            </label>
            <label>
              单元格大小:
              <input
                type="number"
                value={config.cellSize}
                onChange={(e) =>
                  handleNumberConfigChange('cellSize', e.target.value)
                }
                style={inputStyle}
                min="1"
                max="50"
              />
            </label>
            <label>
              影响半径:
              <input
                type="number"
                value={config.radius}
                onChange={(e) =>
                  handleNumberConfigChange('radius', e.target.value)
                }
                style={inputStyle}
                min="5"
                max="100"
              />
            </label>
            <label>
              模糊度:
              <input
                type="number"
                value={config.blur}
                onChange={(e) =>
                  handleNumberConfigChange('blur', e.target.value)
                }
                style={inputStyle}
                min="1"
                max="50"
              />
            </label>
            <label>
              最小颜色:
              <input
                type="color"
                value={config.minColor}
                onChange={(e) =>
                  handleColorConfigChange('minColor', e.target.value)
                }
                style={inputStyle}
              />
            </label>
            <label>
              最大颜色:
              <input
                type="color"
                value={config.maxColor}
                onChange={(e) =>
                  handleColorConfigChange('maxColor', e.target.value)
                }
                style={inputStyle}
              />
            </label>
            <label>
              显示数值:
              <input
                type="checkbox"
                checked={config.showValues}
                onChange={(e) =>
                  handleBooleanConfigChange('showValues', e.target.checked)
                }
                style={{ marginLeft: '10px' }}
              />
            </label>
          </div>
        </div>

        <div>
          <h3>数据统计</h3>
          <div>
            <p>数据点数量: {data.length}</p>
            <p>
              最大数值:{' '}
              {data.length > 0
                ? Math.max(...data.map((d) => d.value)).toFixed(2)
                : 'N/A'}
            </p>
            <p>
              最小数值:{' '}
              {data.length > 0
                ? Math.min(...data.map((d) => d.value)).toFixed(2)
                : 'N/A'}
            </p>
            <p>
              平均数值:{' '}
              {data.length > 0
                ? (
                    data.reduce((sum, d) => sum + d.value, 0) / data.length
                  ).toFixed(2)
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* 热力图显示区域 */}
      <div
        style={{
          border: '1px solid #ddd',
          display: 'inline-block',
          backgroundColor: config.backgroundColor,
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        }}
      >
        <canvas ref={canvasRef} />
      </div>

      {/* 图例 */}
      <div style={{ marginTop: '20px' }}>
        <h3>颜色图例</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '200px',
              height: '20px',
              background: `linear-gradient(to right, ${config.minColor}, ${config.maxColor})`,
            }}
          />
          <span>低密度 → 高密度</span>
        </div>
      </div>

      {/* 数据预览 */}
      {data.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>数据预览 (前10条)</h3>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={tableHeaderStyle}>X坐标</th>
                <th style={tableHeaderStyle}>Y坐标</th>
                <th style={tableHeaderStyle}>数值</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((point, index) => (
                <tr key={index}>
                  <td style={tableCellStyle}>{point.x.toFixed(2)}</td>
                  <td style={tableCellStyle}>{point.y.toFixed(2)}</td>
                  <td style={tableCellStyle}>{point.value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  padding: '5px 10px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '3px',
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  marginLeft: '5px',
  padding: '3px',
  width: '80px',
};

const tableHeaderStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left',
};

const tableCellStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '8px',
};

export default Test;
