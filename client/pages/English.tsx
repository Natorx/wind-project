// TypingPractice.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

// 类型定义
interface WordSet {
  id: number;
  name: string;
  words: string[];
  isOfficial: boolean;
  createdAt: string;
}

// 后端返回的原始数据结构
interface RawWordSet {
  id: number;
  name: string;
  words: string;
  is_official: boolean;
  created_at: string;
}

interface TypingStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  startTime: number | null;
  endTime: number | null;
}

interface HistoryItem {
  word: string;
  correct: boolean;
  time: number;
}

// 官方词汇集 1 - 基础词汇
const OFFICIAL_WORD_SET_1: WordSet = {
  id: 1,
  name: "基础词汇 (50词)",
  words: [
    'apple', 'beautiful', 'computer', 'developer', 'experience',
    'fantastic', 'github', 'hello', 'internet', 'javascript',
    'knowledge', 'learning', 'mountain', 'network', 'open source',
    'programming', 'quality', 'react', 'software', 'technology',
    'unique', 'virtual', 'website', 'xenial', 'youtube',
    'zealous', 'algorithm', 'backend', 'cloud', 'database',
    'frontend', 'git', 'html', 'css', 'typescript',
    'python', 'java', 'rust', 'go', 'swift',
    'kotlin', 'ruby', 'php', 'docker', 'kubernetes',
    'aws', 'azure', 'mongodb', 'postgresql', 'redis'
  ],
  isOfficial: true,
  createdAt: new Date().toISOString()
};

// 官方词汇集 2 - 编程术语
const OFFICIAL_WORD_SET_2: WordSet = {
  id: 2,
  name: "编程术语 (40词)",
  words: [
    'asynchronous', 'callback', 'closure', 'compiler', 'dependency',
    'encapsulation', 'framework', 'functional', 'generics', 'immutable',
    'inheritance', 'interface', 'lambda', 'middleware', 'namespace',
    'optimization', 'polymorphism', 'queue', 'recursion', 'singleton',
    'thread', 'variable', 'webpack', 'xml', 'yaml',
    'zero', 'boolean', 'constant', 'debugger', 'event loop',
    'factory', 'garbage', 'hoisting', 'iterator', 'json',
    'keyword', 'lexical', 'memoization', 'nullable', 'object'
  ],
  isOfficial: true,
  createdAt: new Date().toISOString()
};

const TypingPractice: React.FC = () => {
  // 状态管理
  const [wordSets, setWordSets] = useState<WordSet[]>([OFFICIAL_WORD_SET_1, OFFICIAL_WORD_SET_2]);
  const [currentSetId, setCurrentSetId] = useState<number>(1);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [completedWords, setCompletedWords] = useState<string[]>([]);
  const [remainingWords, setRemainingWords] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    totalChars: 0,
    startTime: null,
    endTime: null,
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [newSetName, setNewSetName] = useState<string>('');
  const [newSetWords, setNewSetWords] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number | null>(null);

  // 获取当前词汇集
  const currentWordSet = wordSets.find(set => set.id === currentSetId);

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 加载自定义词汇集（从数据库）
  const loadCustomWordSets = async () => {
    try {
      setIsLoading(true);
      console.log('开始加载自定义词汇集...');
      
      const customSets = await invoke<RawWordSet[]>('get_custom_word_sets');
      console.log('从数据库加载的原始数据:', customSets);
      
      if (customSets && Array.isArray(customSets) && customSets.length > 0) {
        // 将后端的 words 字符串解析为数组
        const parsedSets: WordSet[] = customSets
          .filter((set): set is RawWordSet => set != null && typeof set.id === 'number')
          .map((set) => {
            try {
              const parsedWords = JSON.parse(set.words);
              console.log(`解析词汇集 ${set.name}:`, parsedWords);
              return {
                id: set.id,
                name: set.name,
                words: Array.isArray(parsedWords) ? parsedWords : [],
                isOfficial: false,
                createdAt: set.created_at || new Date().toISOString()
              };
            } catch (parseError) {
              console.error(`解析词汇集 ${set.name} 失败:`, parseError);
              return {
                id: set.id,
                name: set.name,
                words: [],
                isOfficial: false,
                createdAt: set.created_at || new Date().toISOString()
              };
            }
          });
        
        console.log('解析后的词汇集:', parsedSets);
        setWordSets([OFFICIAL_WORD_SET_1, OFFICIAL_WORD_SET_2, ...parsedSets]);
      } else {
        console.log('没有找到自定义词汇集');
      }
    } catch (error) {
      console.error('加载自定义词汇集失败:', error);
      showMessage('error', '加载自定义词汇集失败: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存自定义词汇集到数据库
  const saveCustomWordSet = async (name: string, words: string[]): Promise<WordSet> => {
    console.log('保存词汇集:', name, words);
    
    const newSet = await invoke<RawWordSet>('save_custom_word_set', {
      name,
      words: JSON.stringify(words)
    });
    
    console.log('保存成功，返回数据:', newSet);
    
    // 返回的数据需要解析 words
    return {
      id: newSet.id,
      name: newSet.name,
      words: JSON.parse(newSet.words),
      isOfficial: false,
      createdAt: newSet.created_at || new Date().toISOString()
    };
  };

  // 删除自定义词汇集
  const deleteCustomWordSet = async (id: number) => {
    try {
      console.log('删除词汇集:', id);
      
      await invoke('delete_custom_word_set', { id });
      
      setWordSets(prevSets => prevSets.filter(set => set.id !== id));
      if (currentSetId === id) {
        setCurrentSetId(1);
      }
      showMessage('success', '词汇集删除成功！');
    } catch (error) {
      console.error('删除词汇集失败:', error);
      showMessage('error', '删除失败，请重试');
    }
  };

  // 重置游戏状态
  const resetGameState = useCallback(() => {
    setUserInput('');
    setCompletedWords([]);
    setIsActive(false);
    setHistory([]);
    setStats({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      totalChars: 0,
      startTime: null,
      endTime: null,
    });
    startTimeRef.current = null;
  }, []);

  // 初始化词汇集
  const initializeWordSet = useCallback((setId: number) => {
    const selectedSet = wordSets.find(set => set.id === setId);
    if (selectedSet && selectedSet.words.length > 0) {
      console.log('初始化词汇集:', selectedSet.name, selectedSet.words);
      setRemainingWords([...selectedSet.words]);
      // 随机选择一个初始单词
      const randomIndex = Math.floor(Math.random() * selectedSet.words.length);
      setCurrentWord(selectedSet.words[randomIndex]);
    }
  }, [wordSets]);

  // 获取新单词
  const getNewWord = useCallback(() => {
    if (!currentWordSet) return;
    
    const notCompleted = remainingWords.filter(word => !completedWords.includes(word));
    
    if (notCompleted.length === 0) {
      setIsActive(false);
      if (startTimeRef.current) {
        const endTime = Date.now();
        const timeInMinutes = (endTime - startTimeRef.current) / 60000;
        const wpm = Math.round(stats.correctChars / 5 / timeInMinutes);
        setStats((prev) => ({
          ...prev,
          wpm: wpm || 0,
          endTime: endTime,
        }));
      }
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * notCompleted.length);
    setCurrentWord(notCompleted[randomIndex]);
  }, [remainingWords, completedWords, currentWordSet, stats.correctChars]);

  // 切换词汇集
  const switchWordSet = (setId: number) => {
    console.log('切换词汇集:', setId);
    
    if (isActive) {
      if (window.confirm('切换词汇集会重置当前进度，确定要继续吗？')) {
        resetGameState();
        setCurrentSetId(setId);
        setTimeout(() => {
          initializeWordSet(setId);
        }, 0);
      }
    } else {
      resetGameState();
      setCurrentSetId(setId);
      setTimeout(() => {
        initializeWordSet(setId);
      }, 0);
    }
  };

  // 重置游戏
  const resetGame = () => {
    resetGameState();
    if (currentWordSet) {
      setTimeout(() => {
        initializeWordSet(currentSetId);
        inputRef.current?.focus();
      }, 0);
    }
  };

  // 更新实时统计
  const updateStats = (input: string, currentWordText: string) => {
    let correct = 0;
    let incorrect = 0;

    for (let i = 0; i < input.length; i++) {
      if (i < currentWordText.length && input[i] === currentWordText[i]) {
        correct++;
      } else {
        incorrect++;
      }
    }

    const totalChars = correct + incorrect;
    const accuracy = totalChars > 0 ? (correct / totalChars) * 100 : 100;

    setStats((prev) => ({
      ...prev,
      correctChars: correct,
      incorrectChars: incorrect,
      totalChars: totalChars,
      accuracy: accuracy,
    }));
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);

    if (!isActive && value.length > 0) {
      setIsActive(true);
      const startTime = Date.now();
      setStats((prev) => ({ ...prev, startTime: startTime }));
      startTimeRef.current = startTime;
    }

    updateStats(value, currentWord);

    if (value.toLowerCase() === currentWord.toLowerCase()) {
      const wordTime = Date.now();
      
      setHistory((prev) => [
        ...prev,
        {
          word: currentWord,
          correct: true,
          time: wordTime,
        },
      ]);

      setCompletedWords((prev) => [...prev, currentWord]);
      setUserInput('');
      getNewWord();
    }
  };

  // 添加自定义词汇集
  const handleAddCustomSet = async () => {
    if (!newSetName.trim()) {
      showMessage('error', '请输入词汇集名称');
      return;
    }
    
    const wordsArray = newSetWords
      .split(/[,\n]/)
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length > 0);
    
    if (wordsArray.length === 0) {
      showMessage('error', '至少添加一个单词');
      return;
    }
    
    try {
      const newSet = await saveCustomWordSet(newSetName, wordsArray);
      setWordSets(prev => [...prev, newSet]);
      setShowCustomModal(false);
      setNewSetName('');
      setNewSetWords('');
      showMessage('success', '词汇集添加成功！');
    } catch (error) {
      console.error('添加自定义词汇集失败:', error);
      showMessage('error', '添加失败: ' + error);
    }
  };

  // 初始化
  useEffect(() => {
    const initialize = async () => {
      await loadCustomWordSets();
      setIsLoading(false);
    };
    initialize();
  }, []);

  // 当前词汇集变化时重新初始化
  useEffect(() => {
    if (!isLoading && currentWordSet) {
      console.log('当前词汇集变化:', currentWordSet.name);
      initializeWordSet(currentSetId);
      inputRef.current?.focus();
    }
  }, [currentSetId, isLoading, initializeWordSet]);

  // 计算 WPM
  useEffect(() => {
    if (stats.startTime && isActive) {
      const interval = setInterval(() => {
        const now = Date.now();
        const timeInMinutes = (now - stats.startTime!) / 60000;
        const wpm = Math.round(stats.correctChars / 5 / timeInMinutes);
        setStats((prev) => ({ ...prev, wpm: wpm || 0 }));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [stats.correctChars, stats.startTime, isActive]);

  // 高亮显示输入对比
  const renderWordWithHighlight = () => {
    if (!currentWord) return null;
    
    return currentWord.split('').map((char, index) => {
      let color = 'text-gray-400';
      if (index < userInput.length) {
        color = userInput[index] === char ? 'text-green-600' : 'text-red-500';
      }
      return (
        <span key={index} className={`${color} font-mono text-4xl`}>
          {char}
        </span>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Typing Practice
          </h1>
          <p className="text-gray-600">
            Type the words as fast and accurately as you can!
          </p>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white animate-fade-in`}>
            {message.text}
          </div>
        )}

        {/* 词汇集选择器 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-semibold text-gray-700">选择词汇集</label>
            <button
              onClick={() => setShowCustomModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              + 自定义词汇集
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {wordSets.map((set) => (
              <div key={set.id} className="relative">
                <button
                  onClick={() => switchWordSet(set.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-all ${
                    currentSetId === set.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="text-left">
                      <div className="font-semibold text-gray-800">{set.name}</div>
                      <div className="text-xs text-gray-500">{set.words.length} 个单词</div>
                    </div>
                    {set.isOfficial && (
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">官方</span>
                    )}
                  </div>
                </button>
                {!set.isOfficial && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`确定要删除"${set.name}"吗？`)) {
                        deleteCustomWordSet(set.id);
                      }
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 进度条 */}
        <div className="mt-8 mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>进度</span>
            <span>
              {completedWords.length} / {currentWordSet?.words.length || 0} 个单词
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((completedWords.length) / (currentWordSet?.words.length || 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* 统计面板 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.wpm}</div>
            <div className="text-xs text-gray-600">WPM</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{Math.round(stats.accuracy)}%</div>
            <div className="text-xs text-gray-600">准确率</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{completedWords.length}</div>
            <div className="text-xs text-gray-600">已完成</div>
          </div>
        </div>

        {/* 主要游戏区域 */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 mb-8 shadow-md border border-gray-200">
          {/* 当前单词显示 */}
          <div className="text-center mb-8">
            <div className="text-gray-600 text-sm mb-2">当前单词</div>
            <div className="text-6xl font-bold tracking-wider mb-4">
              {renderWordWithHighlight()}
            </div>
            <div className="text-gray-500 text-sm">
              长度: {currentWord?.length || 0} 个字符
            </div>
          </div>

          {/* 输入框 */}
          <div className="mb-6">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleInputChange}
              disabled={completedWords.length === (currentWordSet?.words.length || 0)}
              placeholder={
                completedWords.length === 0
                  ? '点击这里开始打字...'
                  : '输入上面的单词...'
              }
              className="w-full px-6 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-800 text-xl font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-gray-400"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          {/* 提示信息 */}
          <div className="text-center text-gray-600 text-sm">
            {completedWords.length === (currentWordSet?.words.length || 0) ? (
              <div className="text-green-600 font-semibold">
                🎉 恭喜！你完成了所有单词！ 🎉
              </div>
            ) : (
              <div>
                按 <kbd className="px-2 py-1 bg-gray-200 rounded text-sm font-mono">Enter</kbd>{' '}
                提交单词 • 不区分大小写 • 先保证准确率！
              </div>
            )}
          </div>
        </div>

        {/* 历史记录 */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h3 className="text-gray-800 font-semibold mb-3">最近输入的单词</h3>
          <div className="max-h-64 overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                还没有输入单词，开始打字吧！
              </div>
            ) : (
              <div className="space-y-2">
                {history.slice().reverse().map((item, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg flex justify-between items-center bg-green-50 border border-green-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-green-600">✓</span>
                      <span className="text-gray-800 font-mono">{item.word}</span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {new Date(item.time).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 重置按钮 */}
        <div className="mt-6 text-center">
          <button
            onClick={resetGame}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            重置进度
          </button>
        </div>

        {/* 自定义词汇集模态框 */}
        {showCustomModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">创建自定义词汇集</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    词汇集名称
                  </label>
                  <input
                    type="text"
                    value={newSetName}
                    onChange={(e) => setNewSetName(e.target.value)}
                    placeholder="例如：雅思词汇"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    单词列表 <span className="text-xs text-gray-500">(每行一个或用逗号分隔)</span>
                  </label>
                  <textarea
                    value={newSetWords}
                    onChange={(e) => setNewSetWords(e.target.value)}
                    placeholder="apple&#10;beautiful&#10;computer&#10;或: apple, beautiful, computer"
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddCustomSet}
                    className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomModal(false);
                      setNewSetName('');
                      setNewSetWords('');
                    }}
                    className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TypingPractice;