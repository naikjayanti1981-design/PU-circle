import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen, 
  FileText, 
  Download, 
  ThumbsUp, 
  MessageSquare, 
  UploadCloud, 
  AlertCircle, 
  Calendar, 
  ChevronRight, 
  Filter, 
  Search, 
  X, 
  Send, 
  User, 
  CheckCircle2, 
  Inbox, 
  Layers,
  GraduationCap,
  Sparkles,
  Link,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PUClass, PUStream, MaterialCategory, PUModule, StudyMaterial, UserComment, CircularNotification } from './types';
import { PU_SUBJECTS } from './data';

export default function App() {
  // Mobile / Desktop View state
  const [currentTab, setCurrentTab] = useState<'updates' | 'materials' | 'forum'>('materials');

  // DB States
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [circulars, setCirculars] = useState<CircularNotification[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<'All' | PUClass>('All');
  const [filterStream, setFilterStream] = useState<'All' | PUStream>('All');
  const [filterCategory, setFilterCategory] = useState<'All' | MaterialCategory>('All');
  const [filterSubject, setFilterSubject] = useState<'All' | string>('All');
  const [filterModule, setFilterModule] = useState<'All' | PUModule>('All');

  // Active resource details state (expanded / selected)
  const [activeMaterial, setActiveMaterial] = useState<StudyMaterial | null>(null);
  const [materialComments, setMaterialComments] = useState<UserComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  // General forum state
  const [generalComments, setGeneralComments] = useState<UserComment[]>([]);
  const [generalAuthor, setGeneralAuthor] = useState('');
  const [generalCommentText, setGeneralCommentText] = useState('');

  // Upload Form State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadClass, setUploadClass] = useState<PUClass>('2nd PU');
  const [uploadStream, setUploadStream] = useState<PUStream>('Science');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadCategory, setUploadCategory] = useState<MaterialCategory>('Notes');
  const [uploadModule, setUploadModule] = useState<PUModule>('Whole Syllabus');
  const [uploadUploader, setUploadUploader] = useState('');
  const [uploadEmail, setUploadEmail] = useState('');
  
  // File drag-n-drop state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base64Content, setBase64Content] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [mRes, cRes, comRes] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/circulars'),
        fetch('/api/comments'),
      ]);

      if (!mRes.ok || !cRes.ok || !comRes.ok) {
        throw new Error('Failed to reach backend endpoints');
      }

      const mData = await mRes.json();
      const cData = await cRes.json();
      const comData = await comRes.json();

      setMaterials(mData);
      setCirculars(cData);
      
      // Separate comments
      const genComments = comData.filter((c: UserComment) => c.targetId === 'general');
      setGeneralComments(genComments.sort((a: UserComment, b: UserComment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setComments(comData);
    } catch (err: any) {
      console.warn('Backend not fully ready or returned errors, using mock storage fallback.', err);
      setErrorStatus('Backend offline, running on in-memory clientside state.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments for active material
  useEffect(() => {
    if (activeMaterial) {
      fetchCommentsForMaterial(activeMaterial.id);
    }
  }, [activeMaterial]);

  const fetchCommentsForMaterial = async (id: string) => {
    try {
      const res = await fetch(`/api/comments?targetId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setMaterialComments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter study materials based on active query
  const filteredMaterials = materials.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.uploader.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = filterClass === 'All' ? true : item.className === filterClass;
    const matchesStream = filterStream === 'All' ? true : item.stream === filterStream;
    const matchesCategory = filterCategory === 'All' ? true : item.category === filterCategory;
    const matchesSubject = filterSubject === 'All' ? true : item.subject === filterSubject;
    const matchesModule = filterModule === 'All' ? true : item.modulePartition === filterModule;

    return matchesSearch && matchesClass && matchesStream && matchesCategory && matchesSubject && matchesModule;
  });

  // Dynamic list of chapters/modules partitions available based on current materials
  const availablePartitions = useMemo(() => {
    const partitions = new Set<string>();
    materials.forEach(item => {
      if (item.modulePartition && item.modulePartition.trim() !== '') {
        partitions.add(item.modulePartition.trim());
      }
    });
    // Natural alphanumeric sorting for chapters (e.g. "Chapter 1", "Chapter 2", "Chapter 10")
    const sorted = Array.from(partitions).sort((a, b) => {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    const list = ['All', 'Whole Syllabus'];
    sorted.forEach(p => {
      if (p !== 'Whole Syllabus' && !list.includes(p)) {
        list.push(p);
      }
    });
    return list;
  }, [materials]);

  // Subjects corresponding to the active filter stream
  const availableSubjectsForFilter = PU_SUBJECTS.filter(sub => {
    if (filterStream === 'All') return true;
    return sub.stream === filterStream || sub.stream === 'General';
  });

  // Subjects corresponding to the upload stream
  const availableSubjectsForUpload = PU_SUBJECTS.filter(sub => {
    return sub.stream === uploadStream || sub.stream === 'General';
  });

  // Auto-set upload subject when stream changing matches nothing in list
  useEffect(() => {
    if (availableSubjectsForUpload.length > 0) {
      const exists = availableSubjectsForUpload.some(s => s.name === uploadSubject);
      if (!exists) {
        setUploadSubject(availableSubjectsForUpload[0].name);
      }
    }
  }, [uploadStream]);

  // Byte formatter
  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Handle file picker and drag and drop
  const processSelectedFile = (file: File) => {
    if (file.size > 40 * 1024 * 1024) {
      alert('File is too large! Maximum limit is 40MB.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64Content(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Submit Upload Form
  const handleMaterialUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      alert('Please enter a descriptive title!');
      return;
    }
    if (!selectedFile || !base64Content) {
      alert('Please select or drop a study file to share!');
      return;
    }

    setUploadProgress(true);
    try {
      const payload = {
        title: uploadTitle,
        description: uploadDescription,
        subject: uploadSubject || (availableSubjectsForUpload[0]?.name || 'English'),
        className: uploadClass,
        stream: uploadStream,
        category: uploadCategory,
        modulePartition: uploadModule,
        uploader: uploadUploader.trim() || 'Student Contributor',
        uploaderEmail: uploadEmail.trim() || 'anonymous@pucircle.org',
        fileName: selectedFile.name,
        fileType: selectedFile.name.split('.').pop() || 'pdf',
        fileSize: formatBytes(selectedFile.size),
        fileBase64: base64Content
      };

      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Upload server error');
      }

      const newMaterial = await res.json();
      setMaterials(prev => [newMaterial, ...prev]);
      
      // Success visual workflow
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setIsUploadOpen(false);
        // Clear forms
        setUploadTitle('');
        setUploadDescription('');
        setSelectedFile(null);
        setBase64Content('');
        setUploadModule('Whole Syllabus');
      }, 1500);

    } catch (err) {
      console.error(err);
      alert('Failed to upload material metadata to local server. Falling back to in-memory save.');
      // Fallback save in-memory so preview works regardless of container filesystem states
      const mockId = `mat-${Date.now()}`;
      const mockMaterial: StudyMaterial = {
        id: mockId,
        title: uploadTitle,
        description: uploadDescription || 'No description provided',
        subject: uploadSubject || (availableSubjectsForUpload[0]?.name || 'English'),
        className: uploadClass,
        stream: uploadStream,
        category: uploadCategory,
        modulePartition: uploadModule,
        uploader: uploadUploader.trim() || 'Student Contributor',
        uploaderEmail: uploadEmail.trim() || 'anonymous@pucircle.org',
        uploadDate: new Date().toISOString().split('T')[0],
        fileSize: formatBytes(selectedFile.size),
        fileType: selectedFile.name.split('.').pop() || 'pdf',
        fileName: selectedFile.name,
        likes: 0,
        downloads: 0,
        isCustom: true
      };
      setMaterials(prev => [mockMaterial, ...prev]);
      setIsUploadOpen(false);
    } finally {
      setUploadProgress(false);
    }
  };

  // Like a Study Material Card
  const handleLikeMaterial = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/materials/${id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setMaterials(prev => prev.map(m => m.id === id ? { ...m, likes: data.likes } : m));
        if (activeMaterial && activeMaterial.id === id) {
          setActiveMaterial(prev => prev ? { ...prev, likes: data.likes } : null);
        }
      }
    } catch (err) {
      // client side fallback
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, likes: m.likes + 1 } : m));
      if (activeMaterial && activeMaterial.id === id) {
        setActiveMaterial(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
      }
    }
  };

  // Submit Comments targeting specific files
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeMaterial) return;

    try {
      const payload = {
        targetId: activeMaterial.id,
        author: commentAuthor.trim() || 'Anonymous Student',
        authorEmail: 'student@pucircle.org',
        text: newCommentText
      };

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const added = await res.json();
        setMaterialComments(prev => [...prev, added]);
        setNewCommentText('');
        // Update comments count on main card list
        setMaterials(prev => prev.map(m => m.id === activeMaterial.id ? { ...m, commentsCount: (m.downloads || 0) + 1 } : m));
      }
    } catch (err) {
      const mockCom: UserComment = {
        id: `comm-${Date.now()}`,
        targetId: activeMaterial.id,
        author: commentAuthor.trim() || 'Anonymous Student',
        authorEmail: 'student@pucircle.org',
        text: newCommentText,
        createdAt: new Date().toISOString()
      };
      setMaterialComments(prev => [...prev, mockCom]);
      setNewCommentText('');
    }
  };

  // General Forum Comments Posting
  const handlePostGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalCommentText.trim()) return;

    try {
      const payload = {
        targetId: 'general',
        author: generalAuthor.trim() || 'Anonymous Student',
        authorEmail: 'guest.pu@pucircle.org',
        text: generalCommentText
      };

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const added = await res.json();
        setGeneralComments(prev => [added, ...prev]);
        setGeneralCommentText('');
      }
    } catch (err) {
      const mockCom: UserComment = {
        id: `comm-${Date.now()}`,
        targetId: 'general',
        author: generalAuthor.trim() || 'Anonymous Student',
        authorEmail: 'guest.pu@pucircle.org',
        text: generalCommentText,
        createdAt: new Date().toISOString()
      };
      setGeneralComments(prev => [mockCom, ...prev]);
      setGeneralCommentText('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden" id="app_root">
      
      {/* Top micro urgent banner */}
      <div className="bg-indigo-900 text-indigo-100 py-2 px-4 text-xs font-mono text-center flex justify-center items-center gap-2 relative z-10" id="top_promo_banner">
        <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
        <span>Karnataka PU Student Portal Hub — Download Question Papers, Study Guides & Blueprints instantly</span>
      </div>

      {/* Main Header navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-xs px-4 md:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3" id="main_site_header">
        <div className="flex items-center justify-between" id="header_branding_block">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans flex items-center gap-1.5 leading-none">
                PU Circle
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-lg">PRO</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Pre-University Learning & Files Sharing Center</p>
            </div>
          </div>
          
          {/* Quick upload modal trigger for mobile screen sizes */}
          <button 
            type="button" 
            onClick={() => setIsUploadOpen(true)}
            className="md:hidden flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-3 py-2 rounded-xl transition shadow-xs"
            id="mobile_btn_add_resource"
          >
            <UploadCloud className="w-4 h-4" />
            Upload
          </button>
        </div>

        {/* Global Search Interface */}
        <div className="flex items-center gap-2 max-w-lg w-full md:w-96" id="header_middle_search">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search circulars, subject notes, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 outline-hidden focus:border-indigo-500 focus:bg-white text-sm pl-10 pr-4 py-2 rounded-xl transition"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop upload trigger */}
        <div className="hidden md:flex items-center gap-3" id="header_right_triggers">
          <button 
            type="button" 
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4  py-2 rounded-xl transition active:scale-98 shadow-sm"
            id="desktop_btn_add_resource"
          >
            <UploadCloud className="w-4 h-4" />
            Share Study Material
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6" id="main_grid_container">
        
        {/* Mobile View Navigation - Segmented Control */}
        <div className="md:hidden flex bg-slate-100 p-1 rounded-xl mb-6 shadow-inner" id="section_segmented_mobile_control">
          <button
            type="button"
            onClick={() => setCurrentTab('materials')}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${currentTab === 'materials' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            <BookOpen className="w-4 h-4" />
            Library
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('updates')}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${currentTab === 'updates' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            <AlertCircle className="w-4 h-4" />
            Circulars
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('forum')}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${currentTab === 'forum' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            <MessageSquare className="w-4 h-4" />
            Student Forum
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8" id="core_app_layout_grid">
          
          {/* LEFT SIDE BAR ON DESKTOP: Circulars, Notices */}
          <section className={`col-span-1 md:col-span-3 space-y-6 ${currentTab === 'updates' ? 'block' : 'hidden md:block'}`} id="left_side_circulars_rail">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4" id="circulars_rail_header">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-sans">
                  <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
                  Board Circulars
                </h2>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full">LIVE</span>
              </div>
              
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">Official board instructions, practical checklists, SATS notices, and prep timetables from DPUE.</p>

              {loading ? (
                <div className="space-y-4 pt-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                      <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4" id="circulars_feed_list">
                  {circulars.map(circ => (
                    <div 
                      key={circ.id} 
                      className={`p-3.5 rounded-xl border transition ${circ.important ? 'bg-rose-50/50 border-rose-100 hover:bg-rose-50' : 'bg-slate-50/60 border-slate-100 hover:bg-slate-50'}`}
                      id={`circ_card_${circ.id}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${circ.important ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
                          {circ.category}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>{circ.postedDate}</span>
                        </div>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-900 mt-2 leading-snug hover:text-indigo-600 transition cursor-pointer">
                        {circ.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 lines-clamp-3 leading-relaxed">
                        {circ.description}
                      </p>

                      <div className="mt-3 pt-3 border-t border-dotted border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-medium">{circ.authority}</span>
                        {circ.important && (
                          <span className="text-rose-600 font-semibold flex items-center gap-1 animate-pulse">
                            ● urgent
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {circulars.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-sm">
                      No active circular bulletins listed today.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* QUICK ACADEMIC STATS */}
            <div className="hidden md:block bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm" id="sidebar_promo_box">
              <h3 className="font-bold text-sm text-indigo-200 tracking-wider uppercase font-mono mb-2">Student Dashboard</h3>
              <p className="text-lg font-bold">Share & Learn together!</p>
              <p className="text-xs text-indigo-200 mt-1 leading-relaxed">PU Circle operates fully on student uploads. Help your friends, upload your college revision sheets, formulas, or model question practices today!</p>
              <div className="mt-4 pt-3 border-t border-indigo-800 flex justify-between text-xs text-indigo-300">
                <div>
                  <span className="block text-lg font-bold text-white font-mono">{materials.length}</span>
                  <span>Notes listed</span>
                </div>
                <div>
                  <span className="block text-lg font-bold text-white font-mono">
                    {materials.reduce((sum, item) => sum + (item.downloads || 0), 0)}
                  </span>
                  <span>Downloads</span>
                </div>
              </div>
            </div>
          </section>

          {/* MAIN COLUMN AREA: Academic Library materials */}
          <section className={`col-span-1 md:col-span-6 space-y-6 ${currentTab === 'materials' ? 'block' : 'hidden md:block'}`} id="middle_materials_library">
            
            {/* Header filters */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs" id="materials_filter_panel">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4" id="filters_header_row">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-slate-900">Custom Filter Library</span>
                </div>
                
                {(filterClass !== 'All' || filterStream !== 'All' || filterCategory !== 'All' || filterSubject !== 'All' || filterModule !== 'All') && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setFilterClass('All');
                      setFilterStream('All');
                      setFilterCategory('All');
                      setFilterSubject('All');
                      setFilterModule('All');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium bg-indigo-50 px-2 py-1 rounded-lg"
                    id="btn_clear_all_filters"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Dynamic filtering tags */}
              <div className="space-y-3.5" id="filter_options_rows">
                {/* 1st vs 2nd PU */}
                <div className="flex flex-wrap items-center gap-2" id="filter_row_class">
                  <span className="text-xs font-semibold text-slate-400 w-16">Grade:</span>
                  <div className="flex flex-wrap gap-1.5 plan-selectors">
                    {(['All', '1st PU', '2nd PU'] as const).map(option => (
                      <button 
                        key={option} 
                        type="button" 
                        onClick={() => setFilterClass(option)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${filterClass === option ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Streams science/commerce/arts */}
                <div className="flex flex-wrap items-center gap-2" id="filter_row_stream">
                  <span className="text-xs font-semibold text-slate-400 w-16">Stream:</span>
                  <div className="flex flex-wrap gap-1.5 plan-selectors">
                    {(['All', 'Science', 'Commerce', 'Arts', 'General'] as const).map(option => (
                      <button 
                        key={option} 
                        type="button" 
                        onClick={() => setFilterStream(option)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${filterStream === option ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resource category */}
                <div className="flex flex-wrap items-center gap-2" id="filter_row_category">
                  <span className="text-xs font-semibold text-slate-400 w-16">Type:</span>
                  <div className="flex flex-wrap gap-1.5 plan-selectors">
                    {(['All', 'Notes', 'Question Paper', 'Syllabus & Blueprint'] as const).map(option => (
                      <button 
                        key={option} 
                        type="button" 
                        onClick={() => setFilterCategory(option as any)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${filterCategory === option ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chapter/Part Partition */}
                <div className="flex flex-wrap items-center gap-2" id="filter_row_module">
                  <span className="text-xs font-semibold text-slate-400 w-16">Chapter/Part:</span>
                  <div className="flex flex-wrap gap-1.5 plan-selectors">
                    {availablePartitions.map(option => (
                      <button 
                        key={option} 
                        type="button" 
                        onClick={() => setFilterModule(option)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${filterModule === option ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subjects dropdown selection */}
                <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-100" id="filter_row_subject">
                  <span className="text-xs font-semibold text-slate-400 w-16">Subject:</span>
                  <div className="flex items-center gap-2 w-full sm:w-auto max-w-sm">
                    <select
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-200 outline-hidden focus:border-indigo-500 py-2 px-3 rounded-lg w-full text-slate-700"
                    >
                      <option value="All">All Subjects ({availableSubjectsForFilter.length})</option>
                      {availableSubjectsForFilter.map(sub => (
                        <option key={sub.code} value={sub.name}>
                          {sub.name} [{sub.code}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between" id="materials_list_header_bar">
              <div className="text-slate-900 font-bold font-sans text-lg flex items-center gap-2">
                <h3>Pre-University Resources</h3>
                <span className="text-xs font-mono font-medium px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                  {filteredMaterials.length} results
                </span>
              </div>
              
              <div className="text-xs text-slate-400 italic">Sorted by uploaded date</div>
            </div>

            {/* Study Material Grid Cards list */}
            {loading ? (
              <div className="space-y-4 pt-1" id="materials_deck_loading">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white border rounded-2xl p-5 animate-pulse space-y-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-100 rounded w-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4" id="study_materials_cards_list">
                {filteredMaterials.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setActiveMaterial(item)}
                    className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 transition flex flex-col sm:flex-row gap-4 items-start cursor-pointer hover:shadow-xs active:scale-99"
                    id={`material_item_${item.id}`}
                  >
                    {/* File icon based on category/file type */}
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" id={`icon_block_${item.id}`}>
                      {item.category === 'Question Paper' ? (
                        <FileText className="w-6 h-6 text-indigo-600" />
                      ) : item.category === 'Syllabus & Blueprint' ? (
                        <Layers className="w-6 h-6 text-indigo-600" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-indigo-600" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5" id={`info_block_${item.id}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                          {item.className}
                        </span>
                        <span className="text-[10px] font-mono uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                          {item.stream}
                        </span>
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                          {item.subject}
                        </span>
                        <span className="text-[10px] font-mono bg-violet-50 text-violet-700 px-2.5 py-0.5 rounded-full font-bold">
                          {item.modulePartition || 'Whole Syllabus'}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base leading-tight font-sans hover:text-indigo-600 transition">
                        {item.title}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed lines-clamp-2">
                        {item.description}
                      </p>

                      <div className="pt-3 flex flex-wrap items-center justify-between text-slate-400 text-[11px] gap-3" id={`actions_block_${item.id}`}>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-slate-500">By {item.uploader}</span>
                          <span>•</span>
                          <span>{item.uploadDate}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-slate-500 font-mono" onClick={e => e.stopPropagation()}>
                          <button 
                            type="button" 
                            onClick={(e) => handleLikeMaterial(item.id, e)}
                            className="flex items-center gap-1.5 hover:text-indigo-600 group transition px-1 py-0.5"
                          >
                            <ThumbsUp className="w-3.5 h-3.5 group-hover:scale-110 transition text-slate-400 group-hover:text-indigo-600" />
                            <span>{item.likes}</span>
                          </button>
                          
                          <div className="flex items-center gap-1.5">
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.downloads} downloads</span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-400">
                            <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 bg-slate-50 rounded">
                              {item.fileType}
                            </span>
                            <span>{item.fileSize}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                ))}

                {filteredMaterials.length === 0 && (
                  <div className="bg-white border rounded-2xl p-12 text-center text-slate-500 space-y-4" id="empty_materials_view">
                    <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                    <div>
                      <p className="font-bold text-slate-800">No study materials match your filters</p>
                      <p className="text-xs text-slate-500 mt-1">Try resetting the custom selectors or type a broader search keyword.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setFilterClass('All');
                        setFilterStream('All');
                        setFilterCategory('All');
                        setFilterSubject('All');
                        setSearchQuery('');
                      }}
                      className="border border-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-50 transition"
                      id="btn_reset_empty_state"
                    >
                      Clear Selection
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* RIGHT SIDEBAR ON DESKTOP: Unified Student Forum Discussion */}
          <section className={`col-span-1 md:col-span-3 space-y-6 ${currentTab === 'forum' ? 'block' : 'hidden md:block'}`} id="right_community_forum_rail">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col h-[520px]">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4" id="forum_rail_header">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-sans">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  Student Forum
                </h2>
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">shared chat</span>
              </div>

              {/* Forum Messages Feed scrolled wrapper */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-0 text-xs" id="forum_messages_scroller">
                {generalComments.map(com => (
                  <div key={com.id} className="p-3 bg-slate-50 rounded-xl space-y-1" id={`forum_msg_${com.id}`}>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <User className="w-3 h-3 text-indigo-500" />
                        {com.author}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {new Date(com.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed break-words">{com.text}</p>
                  </div>
                ))}
                {generalComments.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    Be the first PU student to post an update or question in the community discussion board!
                  </div>
                )}
              </div>

              {/* Instant message input */}
              <form onSubmit={handlePostGeneral} className="pt-4 border-t border-slate-100 space-y-2 mt-4" id="forum_message_form">
                <input 
                  type="text" 
                  placeholder="Your Name / Handle"
                  value={generalAuthor}
                  onChange={(e) => setGeneralAuthor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 outline-hidden focus:border-indigo-500 text-xs px-3 py-1.5 rounded-lg transition"
                  maxLength={30}
                />
                
                <div className="relative">
                  <textarea 
                    rows={2}
                    placeholder="Ask standard doubts, post alert updates, talk PU colleges..."
                    value={generalCommentText}
                    onChange={(e) => setGeneralCommentText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-hidden focus:border-indigo-500 text-xs pr-10 pl-3 py-2 rounded-lg resize-none transition"
                    maxLength={180}
                  />
                  <button 
                    type="submit"
                    className="absolute right-2.5 bottom-3 text-indigo-600 hover:text-indigo-800 transition"
                    title="Send comment"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>

            </div>

            {/* Quick guidance on syllabus download safety */}
            <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 text-[11px] text-amber-800 space-y-1.5" id="download_disclaimer_block">
              <span className="font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 font-mono">
                💡 EXAM PREPARATION GUIDE
              </span>
              <p className="leading-relaxed">All answers, papers, and files on this service are collected by student/lecturer submissions. Double-check blueprints against DPUE official circulars to stay 100% accurate before board exams.</p>
            </div>
          </section>

        </div>
      </main>

      {/* DETAILED MATERIAL VIEWER AND COMMENTING MODAL */}
      <AnimatePresence>
        {activeMaterial && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" id="resource_viewer_backdrop">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col border border-slate-100"
              id="resource_viewer_panel"
            >
              {/* Modal sticky header */}
              <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between" id="viewer_modal_header">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-mono font-bold uppercase">
                    {activeMaterial.className}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full font-mono font-bold uppercase">
                    {activeMaterial.stream}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 bg-violet-100 text-violet-800 rounded-full font-mono font-bold uppercase">
                    {activeMaterial.modulePartition || 'Whole Syllabus'}
                  </span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveMaterial(null)}
                  className="p-1 px-3 py-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Close <span className="font-bold">✕</span>
                </button>
              </div>

              {/* Viewer contents */}
              <div className="p-6 space-y-5 flex-1" id="viewer_modal_body">
                <div>
                  <div className="text-[11px] font-mono text-slate-400 mb-1">
                    Uploaded inside <span className="text-indigo-600 font-semibold">{activeMaterial.subject}</span> Category: {activeMaterial.category}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-sans tracking-tight">
                    {activeMaterial.title}
                  </h3>
                </div>

                {/* File size & Download Trigger Block */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4" id="download_actions_panel">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="p-3 bg-white rounded-xl shadow-xs text-indigo-600">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 truncate max-w-xs">{activeMaterial.fileName}</div>
                      <div className="text-xs text-slate-500 font-mono uppercase">{activeMaterial.fileType} format • {activeMaterial.fileSize}</div>
                    </div>
                  </div>

                  {/* Trigger Direct download */}
                  <a 
                    href={activeMaterial.downloadUrl || `/api/download/${activeMaterial.id}`}
                    className="w-full sm:w-auto text-center flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-3 rounded-xl transition cursor-pointer active:scale-98 shadow-sm shadow-indigo-100"
                    onClick={() => {
                      setMaterials(prev => prev.map(m => m.id === activeMaterial.id ? { ...m, downloads: m.downloads + 1 } : m));
                      setActiveMaterial(prev => prev ? { ...prev, downloads: prev.downloads + 1 } : null);
                    }}
                    id="link_material_direct_download"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </a>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description / Study Context</h4>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    {activeMaterial.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl" id="uploader_metadata_grid">
                  <div>
                    <span className="text-slate-400 block">Uploaded By:</span>
                    <span className="font-semibold text-slate-800">{activeMaterial.uploader}</span>
                    <span className="text-slate-400 text-[10px] block font-mono">{activeMaterial.uploaderEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Allotment Date:</span>
                    <span className="font-semibold text-slate-800">{activeMaterial.uploadDate}</span>
                    <div className="flex items-center gap-3 mt-1.5">
                      <button 
                        type="button" 
                        onClick={(e) => handleLikeMaterial(activeMaterial.id, e)}
                        className="flex items-center gap-1 text-slate-500 hover:text-indigo-600"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{activeMaterial.likes} likes</span>
                      </button>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500">{activeMaterial.downloads} downloads</span>
                    </div>
                  </div>
                </div>

                {/* Resource Specific Commenting section */}
                <div className="pt-4 border-t border-slate-100 space-y-4" id="material_comments_section">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    Study Material Discussions ({materialComments.length})
                  </h4>

                  {/* Scrolled list of comments on this specific course */}
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1" id="material_comments_wrapper">
                    {materialComments.map(com => (
                      <div key={com.id} className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-indigo-500" />
                            {com.author}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(com.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{com.text}</p>
                      </div>
                    ))}
                    {materialComments.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        No student remarks or doubt questions posted yet on this file.
                      </div>
                    )}
                  </div>

                  {/* Post a feedback comment */}
                  <form onSubmit={handlePostComment} className="flex flex-col gap-2 pt-2 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100" id="post_material_comment_form">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        placeholder="Your Student Name"
                        value={commentAuthor}
                        onChange={(e) => setCommentAuthor(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 outline-hidden focus:border-indigo-500 text-xs px-3 py-2 rounded-lg transition"
                        maxLength={35}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Write a helpful review, study doubt, or verification answer..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 outline-hidden focus:border-indigo-500 text-xs px-3 py-2 rounded-lg transition"
                        maxLength={150}
                        required
                      />
                      <button 
                        type="submit" 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Reply
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADVANCED SHARED STUDY MATERIAL UPLOADER MODAL */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" id="upload_modal_backdrop">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col border border-slate-100"
              id="upload_modal_panel"
            >
              {/* Modal sticky header */}
              <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between" id="upload_modal_header">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="text-indigo-600 w-5 h-5" />
                  Share Learning Materials
                </h3>
                <button 
                  type="button" 
                  onClick={() => setIsUploadOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition text-sm"
                >
                  ✕ Close
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleMaterialUpload} className="p-6 space-y-4" id="main_upload_form">
                
                {/* Drag / Drop Area */}
                <div 
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 min-h-36 ${dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  id="drag_drop_container"
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-1.5" id="selected_file_feedback">
                      <div className="text-indigo-600 flex justify-center">
                        <CheckCircle2 className="w-10 h-10 animate-bounce" />
                      </div>
                      <div className="text-sm font-bold text-slate-900 truncate max-w-md">{selectedFile.name}</div>
                      <div className="text-xs text-slate-400 uppercase font-mono">{selectedFile.name.split('.').pop()} • {formatBytes(selectedFile.size)}</div>
                      <div className="text-xs text-indigo-600 font-medium pt-1">Click or Drag to swap file</div>
                    </div>
                  ) : (
                    <div className="space-y-1.5" id="file_selectors_placeholders">
                      <div className="text-slate-400 flex justify-center">
                        <UploadCloud className="w-10 h-10" />
                      </div>
                      <div className="text-sm font-bold text-slate-800">Drag & Drop Study Document</div>
                      <div className="text-xs text-slate-400 leading-normal max-w-xs mx-auto">Supports PDFs, Image Notes, Text Sheets or Blueprints (Max 40MB limit)</div>
                      <button 
                        type="button" 
                        className="mt-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                      >
                        Choose File manually
                      </button>
                    </div>
                  )}
                </div>

                {/* Form fields */}
                <div className="space-y-3 text-xs" id="upload_metadata_inputs">
                  
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Resource Title *</label>
                    <input 
                      type="text"
                      placeholder="e.g. 2nd PU Maths 2025 Supplementary Key Solutions"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 outline-hidden focus:border-indigo-500 py-2.5 px-3 rounded-lg text-sm text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Brief Description (Helpful context for downloaders)</label>
                    <textarea 
                      rows={2}
                      placeholder="e.g. Outlines Part-D 5mark integration procedures step-by-step with proofs..."
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 outline-hidden focus:border-indigo-500 py-2 px-3 rounded-lg text-xs"
                      maxLength={180}
                    />
                  </div>

                  {/* Class, Stream, Category in Grid row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Target PU Class</label>
                      <select 
                        value={uploadClass} 
                        onChange={(e) => setUploadClass(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 outline-hidden focus:border-indigo-500 py-2.5 px-2.5 rounded-lg text-xs"
                      >
                        <option value="1st PU">1st PU (Grade 11)</option>
                        <option value="2nd PU">2nd PU (Grade 12)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Academic Stream</label>
                      <select 
                        value={uploadStream} 
                        onChange={(e) => setUploadStream(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 outline-hidden focus:border-indigo-500 py-2.5 px-2.5 rounded-lg text-xs"
                      >
                        <option value="Science">Science (PCMB/C/E)</option>
                        <option value="Commerce">Commerce</option>
                        <option value="Arts">Arts</option>
                        <option value="General">General / Languages</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Resource Category</label>
                      <select 
                        value={uploadCategory} 
                        onChange={(e) => setUploadCategory(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 outline-hidden focus:border-indigo-500 py-2.5 px-2.5 rounded-lg text-xs"
                      >
                        <option value="Notes">Syllabus Notes</option>
                        <option value="Question Paper">Past Question Paper</option>
                        <option value="Syllabus & Blueprint">Official Blueprint</option>
                      </select>
                    </div>
                  </div>

                  {/* Subject, Module Partition, and Author */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Subject Allotment *</label>
                      <select 
                        value={uploadSubject} 
                        onChange={(e) => setUploadSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 outline-hidden focus:border-indigo-500 py-2.5 px-2.5 rounded-lg text-xs"
                        required
                      >
                        {availableSubjectsForUpload.map(sub => (
                          <option key={sub.code} value={sub.name}>
                            {sub.name} [{sub.code}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Chapter/Part Partition</label>
                      <input 
                        type="text"
                        list="chapters-list"
                        value={uploadModule} 
                        onChange={(e) => setUploadModule(e.target.value)}
                        placeholder="e.g. Chapter 1, Unit 2, Whole Syllabus"
                        className="w-full bg-slate-50 border border-slate-200 outline-hidden focus:border-indigo-500 py-2.5 px-3 rounded-lg text-xs"
                      />
                      <datalist id="chapters-list">
                        <option value="Whole Syllabus" />
                        <option value="Chapter 1" />
                        <option value="Chapter 2" />
                        <option value="Chapter 3" />
                        <option value="Chapter 4" />
                        <option value="Chapter 5" />
                        <option value="Chapter 6" />
                        <option value="Chapter 7" />
                        <option value="Chapter 8" />
                        <option value="Chapter 9" />
                        <option value="Chapter 10" />
                        <option value="Chapter 11" />
                        <option value="Chapter 12" />
                        <option value="Chapter 13" />
                        <option value="Chapter 14" />
                        <option value="Chapter 15" />
                        <option value="Unit 1" />
                        <option value="Unit 2" />
                        <option value="Unit 3" />
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Your Name / Lecturer Alias</label>
                      <input 
                        type="text"
                        placeholder="e.g. Prof. Kamath (Optional)"
                        value={uploadUploader}
                        onChange={(e) => setUploadUploader(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 outline-hidden focus:border-indigo-500 py-2.5 px-3 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                </div>

                {/* Submit trigger button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3" id="upload_modal_actions">
                  <button 
                    type="button" 
                    onClick={() => setIsUploadOpen(false)}
                    className="border border-slate-200 text-slate-600 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>

                  <button 
                    type="submit"
                    disabled={uploadProgress || uploadSuccess}
                    className={`text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition flex items-center gap-2 ${uploadSuccess ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xs shadow-indigo-100'}`}
                    id="btn_submit_material"
                  >
                    {uploadProgress ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        Writing files...
                      </>
                    ) : uploadSuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Uploaded successfully!
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        Share Resource
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-8 mt-12 px-4 border-t border-slate-900" id="main_site_footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <div className="p-1 px-1.5 bg-indigo-600 text-white rounded font-bold text-[10px]">PUC</div>
              <span className="font-bold text-indigo-400 font-sans uppercase tracking-wider text-xs">PU CIRCLE Hub</span>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">The shared archive created for Pre-University students, by Pre-University students.</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500 text-[11px] font-mono">
            <span>© 2026 Karnataka DPUE Academic Support Collective</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Syllabus Guidelines</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Security Code</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
