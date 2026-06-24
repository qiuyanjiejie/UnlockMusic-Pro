/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Music, Download, Trash2, CheckCircle2, AlertCircle, Loader2, Github } from 'lucide-react';
import { saveAs } from 'file-saver';
import { DecryptedFile } from './types';
import { decryptFile } from './utils/decrypter';

export default function App() {
  const [files, setFiles] = useState<DecryptedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files) as File[];
    handleFiles(droppedFiles);
  }, []);

  const handleFiles = async (newFiles: File[]) => {
    const fileEntries: DecryptedFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      originalName: file.name,
      size: file.size,
      type: file.type,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...fileEntries]);

    for (const entry of fileEntries) {
      const actualFile = newFiles.find(f => f.name === entry.name);
      if (!actualFile) continue;

      setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'processing' } : f));

      try {
        const result = await decryptFile(actualFile);
        setFiles(prev => prev.map(f => f.id === entry.id ? { 
          ...f, 
          status: 'completed', 
          blob: result.blob,
          name: `${f.name.split('.')[0]}.${result.ext}`,
          metadata: result.metadata
        } : f));
      } catch (err) {
        setFiles(prev => prev.map(f => f.id === entry.id ? { 
          ...f, 
          status: 'error', 
          errorMessage: err instanceof Error ? err.message : 'Unknown error' 
        } : f));
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const downloadFile = (file: DecryptedFile) => {
    if (file.blob) {
      saveAs(file.blob, file.name);
    }
  };

  const downloadAll = () => {
    files.filter(f => f.status === 'completed').forEach(downloadFile);
  };

  const clearAll = () => {
    setFiles([]);
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const completedCount = files.filter(f => f.status === 'completed').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-blue-500/30 p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">UnlockMusic Pro</h1>
              <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-semibold">v1.0 • 本地解密</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-zinc-500">
            <span>隐私保护</span>
            <span>无服务器处理</span>
          </div>
        </header>

        {/* Bento Grid Layout */}
        <main className="grid grid-cols-12 gap-4 auto-rows-min">
          
          {/* Main Dropzone - Spans 8 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`
              col-span-12 lg:col-span-8 row-span-2 relative group cursor-pointer
              border border-zinc-800 bg-zinc-900/50 rounded-[32px] p-12
              transition-all duration-300 ease-out flex flex-col items-center justify-center
              ${isDragging ? 'border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10' : 'hover:bg-zinc-900 hover:border-zinc-700'}
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input 
              id="fileInput" 
              type="file" 
              multiple 
              className="hidden" 
              onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
              accept=".ncm,.qmc0,.qmc3,.qmcflac,.qmcogg,.tkm,.mflac,.mgg,.kgm,.vpr"
            />
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Upload className={`w-10 h-10 ${isDragging ? 'text-blue-400' : 'text-zinc-400'}`} />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">点击或拖拽音频文件到此处</h2>
              <p className="text-zinc-500 max-w-md">支持 NCM, QMC, KGM, XM, BKM, FLAC_MOD 等主流加密格式</p>
            </div>
          </motion.div>

          {/* Output Info - Spans 4 cols */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-12 lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-[24px] p-6 flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 block mb-6">输出格式</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-zinc-800/50 border border-blue-500/30 rounded-xl">
                  <span className="text-sm font-medium">MP3 (自动)</span>
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-800/20 border border-zinc-800 rounded-xl opacity-50">
                  <span className="text-sm font-medium">WAV (原始)</span>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 block mb-4">自动优化</span>
              <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-800">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  系统会自动根据解密后的流数据选择最佳容器格式，并尽可能保留原始元数据。
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats Card - Spans 4 cols */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-12 lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-[24px] p-6 flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 block mb-4">转换统计</span>
              <div className="space-y-1">
                <div className="text-4xl font-bold text-white">{completedCount}</div>
                <div className="text-xs text-zinc-500">已解锁歌曲</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-zinc-800">
              <div>
                <div className="text-lg font-bold text-white">{(totalSize / 1024 / 1024).toFixed(1)} <span className="text-[10px] text-zinc-500">MB</span></div>
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">总处理量</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">100%</div>
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">解密率</div>
              </div>
            </div>
          </motion.div>

          {/* Queue Card - Spans 8 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-12 lg:col-span-8 min-h-[400px] bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 block mb-1">转换队列</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  文件列表
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                    {files.length}
                  </span>
                </h3>
              </div>
              {files.length > 0 && (
                <div className="flex gap-2">
                  <button 
                    onClick={downloadAll}
                    disabled={!files.some(f => f.status === 'completed')}
                    className="text-xs font-bold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:grayscale transition-all text-white shadow-lg shadow-blue-600/20"
                  >
                    全部下载
                  </button>
                  <button 
                    onClick={clearAll}
                    className="text-xs font-bold px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400"
                  >
                    清空
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-2 max-h-[500px] custom-scrollbar">
              <AnimatePresence initial={false}>
                {files.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-3 opacity-50">
                    <Music className="w-12 h-12 stroke-1" />
                    <p className="text-sm font-medium">队列目前为空</p>
                  </div>
                ) : (
                  files.map((file) => (
                    <motion.div
                      key={file.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 transition-all group"
                    >
                      <div className="relative w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                        {file.metadata?.picture ? (
                          <img src={file.metadata.picture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-5 h-5 text-zinc-600" />
                        )}
                        {file.status === 'processing' && (
                          <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-zinc-100 truncate">
                            {file.metadata?.title || file.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {file.status === 'completed' ? (
                            <p className="text-[10px] text-zinc-500 font-medium truncate uppercase tracking-wider">
                              {file.metadata?.artist || 'Unknown Artist'} • {file.name.split('.').pop()}
                            </p>
                          ) : (
                            <p className="text-[10px] text-zinc-500 font-medium tracking-wider">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {file.status === 'completed' && (
                          <>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">已完成</span>
                            <button 
                              onClick={() => downloadFile(file)}
                              className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {file.status === 'error' && (
                          <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-red-400/10">
                            <AlertCircle className="w-3 h-3" />
                            <span>{file.errorMessage?.includes('under development') ? '开发中' : '失败'}</span>
                          </div>
                        )}
                        <button 
                          onClick={() => removeFile(file.id)}
                          className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </main>

        <footer className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
          <p>© 2026 UNLOCKMUSIC PRO • 开源安全</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-zinc-400 transition-colors">隐私条款</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">格式支持</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">关于工具</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

