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
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-fuchsia-500/30 p-4 lg:p-8 relative overflow-x-hidden">
      {/* Dynamic Cyber Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex justify-between items-center px-4 py-4 rounded-3xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-fuchsia-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-flow"></div>
              <div className="relative w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center">
                <Music className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent leading-none">UNLOCKMUSIC</h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.3em] mt-1">Advanced Decryption System</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">System Status</span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                ONLINE • LOCAL_ONLY
              </span>
            </div>
          </div>
        </header>

        {/* Bento Grid */}
        <main className="grid grid-cols-12 gap-4">
          
          {/* Main Dropzone - Spans 8 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              col-span-12 lg:col-span-8 relative group cursor-pointer
              bg-zinc-900/40 border border-zinc-800 rounded-[40px] p-12 backdrop-blur-md
              transition-all duration-500 cyber-border
              ${isDragging ? 'bg-blue-500/5 scale-[1.01]' : 'hover:bg-zinc-900/60 hover:border-zinc-700/50'}
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
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500/20 to-fuchsia-500/20 flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-[spin_10s_linear_infinite]" />
                <Upload className={`w-10 h-10 ${isDragging ? 'text-blue-400' : 'text-zinc-400'} group-hover:scale-125 transition-transform duration-500`} />
              </div>
              <h2 className="text-3xl font-black text-white mb-3 tracking-tight">上传加密音频</h2>
              <p className="text-zinc-400 max-w-sm font-medium">支持所有主流平台加密格式，拖拽即刻解锁本地高清音质</p>
            </div>
          </motion.div>

          {/* Stats & Actions Side Panel */}
          <div className="col-span-12 lg:col-span-4 grid grid-cols-1 gap-4">
            {/* Format Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-6 backdrop-blur-md flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-6 block">Output Profile</span>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/50 rounded-2xl group transition-all">
                    <span className="text-sm font-bold text-blue-100">Smart Conversion</span>
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-800/30 border border-zinc-800/50 rounded-2xl opacity-40">
                    <span className="text-sm font-bold">Lossless (WAV)</span>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <button 
                  onClick={downloadAll}
                  disabled={!files.some(f => f.status === 'completed')}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-fuchsia-600 hover:from-blue-500 hover:to-fuchsia-500 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all disabled:opacity-20 active:scale-95"
                >
                  批量下载已解锁
                </button>
              </div>
            </motion.div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-6 backdrop-blur-md"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 block">Analytics</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/20 border border-zinc-800/50 rounded-2xl">
                  <div className="text-3xl font-black text-white">{completedCount}</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">解锁成功</div>
                </div>
                <div className="p-4 bg-zinc-800/20 border border-zinc-800/50 rounded-2xl">
                  <div className="text-xl font-black text-white">{(totalSize / 1024 / 1024).toFixed(1)}</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">MB 处理量</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Queue List - Spans 12 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-12 bg-zinc-900/40 border border-zinc-800 rounded-[40px] p-8 backdrop-blur-md min-h-[400px]"
          >
            <div className="flex items-center justify-between mb-10 px-2">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-black text-white tracking-tighter">处理队列</h3>
                <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 font-mono text-xs border border-zinc-700">
                  {files.length} ITEMS
                </span>
              </div>
              <button 
                onClick={clearAll}
                className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-red-400 transition-colors"
              >
                Clear Queue
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence initial={false}>
                {files.length === 0 ? (
                  <div className="col-span-full h-64 flex flex-col items-center justify-center text-zinc-700 space-y-4 opacity-30">
                    <Music className="w-16 h-16 stroke-[1px]" />
                    <p className="text-lg font-bold tracking-widest uppercase">Awaiting Input...</p>
                  </div>
                ) : (
                  files.map((file) => (
                    <motion.div
                      key={file.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group relative p-5 rounded-3xl bg-zinc-800/30 border border-zinc-800/50 hover:border-zinc-600/50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 shadow-2xl">
                          {file.metadata?.picture ? (
                            <img src={file.metadata.picture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-6 h-6 text-zinc-700" />
                          )}
                          {file.status === 'processing' && (
                            <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center">
                              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-white truncate leading-tight mb-1">
                            {file.metadata?.title || file.name}
                          </h4>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider truncate">
                            {file.status === 'completed' 
                              ? `${file.metadata?.artist || 'Unknown'} • ${file.name.split('.').pop()}`
                              : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2">
                          {file.status === 'completed' && (
                            <button 
                              onClick={() => downloadFile(file)}
                              className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/10"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => removeFile(file.id)}
                            className="p-2.5 rounded-xl bg-zinc-950/50 text-zinc-600 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="absolute top-2 right-2">
                        {file.status === 'completed' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />}
                        {file.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </main>

        <footer className="py-10 border-t border-zinc-900/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 italic">UnlockMusic Core v1.0.4</span>
          </div>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
            <a href="#" className="hover:text-blue-500 transition-colors">Documentation</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Privacy Shield</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Github Repo</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

