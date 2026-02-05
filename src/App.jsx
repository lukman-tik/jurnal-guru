import React, { useState, useEffect } from 'react';

export default function JurnalGuru() {
  // --- 1. STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('input'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null); 

  // STATE KEAMANAN
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false); 
  const [inputPin, setInputPin] = useState(''); 
  const [savedPin, setSavedPin] = useState(() => {
    return localStorage.getItem('jurnal_guru_pin') || '1007'; 
  });

  // DATABASE JURNAL
  const [journals, setJournals] = useState(() => {
    const saved = localStorage.getItem('jurnal_guru_data');
    return saved ? JSON.parse(saved) : [];
  });

  // DATABASE SEKOLAH
  const [schoolData, setSchoolData] = useState(() => {
    const saved = localStorage.getItem('data_sekolah');
    return saved ? JSON.parse(saved) : {}; 
  });

  // FORM INPUT
  const [formData, setFormData] = useState({ kelas: '', mapel: '', catatan: '' });
  const [attendance, setAttendance] = useState({});

  // STATE MANAGE DATA
  const [newClassName, setNewClassName] = useState('');
  const [selectedClassForStudent, setSelectedClassForStudent] = useState('');
  const [studentListInput, setStudentListInput] = useState('');
  const [newPinInput, setNewPinInput] = useState(''); 

  // --- 2. EFEK SAMPING (AUTO SAVE) ---
  useEffect(() => {
    localStorage.setItem('jurnal_guru_data', JSON.stringify(journals));
  }, [journals]);

  useEffect(() => {
    localStorage.setItem('data_sekolah', JSON.stringify(schoolData));
  }, [schoolData]);

  useEffect(() => {
    localStorage.setItem('jurnal_guru_pin', savedPin);
  }, [savedPin]);

  // --- 3. LOGIC KEAMANAN ---
  const handleLoginAdmin = (e) => {
    e.preventDefault();
    if (inputPin === savedPin) {
      setIsAdminUnlocked(true);
      setInputPin('');
    } else {
      alert("PIN SALAH! Akses ditolak.");
      setInputPin('');
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdminUnlocked(false);
  };

  const handleChangePin = () => {
    if (newPinInput.length < 4) return alert("PIN minimal 4 angka!");
    setSavedPin(newPinInput);
    setNewPinInput('');
    alert("PIN Admin berhasil diganti!");
  };

  // --- 4. LOGIC MANAJEMEN DATA ---
  const addClass = () => {
    if (!newClassName) return alert("Nama kelas kosong!");
    if (schoolData[newClassName]) return alert("Kelas sudah ada!");
    setSchoolData({ ...schoolData, [newClassName]: [] });
    setNewClassName('');
  };

  const deleteClass = (className) => {
    // KONFIRMASI HAPUS KELAS
    if (window.confirm(`⚠️ PERINGATAN:\n\nApakah Anda yakin ingin menghapus KELAS ${className}?\nSemua data siswa di dalamnya akan ikut terhapus.`)) {
      const newData = { ...schoolData };
      delete newData[className];
      setSchoolData(newData);
    }
  };

  const saveStudents = () => {
    if (!selectedClassForStudent || !studentListInput) return alert("Data belum lengkap!");
    const studentsArray = studentListInput.split('\n').map(s => s.trim()).filter(s => s !== '');
    setSchoolData({ ...schoolData, [selectedClassForStudent]: studentsArray });
    setStudentListInput('');
    alert(`Berhasil simpan siswa ke ${selectedClassForStudent}!`);
  };

  const handleBackup = () => {
    const fullData = { journals, schoolData, version: "4.2", backupDate: new Date().toLocaleDateString() };
    const blob = new Blob([JSON.stringify(fullData)], { type: 'application/json' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Backup_Jurnal_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
  };

  const handleRestore = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (window.confirm("⚠️ RESTORE DATA:\n\nApakah Anda yakin? Data di HP ini akan diganti sepenuhnya dengan data dari file backup.")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.journals && data.schoolData) {
            localStorage.setItem('jurnal_guru_data', JSON.stringify(data.journals));
            localStorage.setItem('data_sekolah', JSON.stringify(data.schoolData));
            alert("✅ Sukses! Data berhasil diperbarui.");
            window.location.reload();
          } else { alert("File backup tidak valid!"); }
        } catch (error) { alert("Gagal membaca file."); }
      };
      reader.readAsText(file);
    }
  };

  const downloadReport = () => {
    if (journals.length === 0) return alert("Data kosong!");
    let csv = "Tanggal,Kelas,Mapel,Catatan,Rekap Absen,Detail Tidak Hadir\n";
    journals.forEach(row => {
      let absentDetails = [];
      if (row.attendanceData) {
        Object.entries(row.attendanceData).forEach(([name, status]) => {
          if (status !== 'H') absentDetails.push(`${name}(${status})`);
        });
      }
      csv += `${row.tanggal},${row.kelas},${row.mapel},"${row.catatan}","${row.summaryText || '-'}","${absentDetails.join("; ")}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Laporan_Jurnal.csv";
    link.click();
  };

  // --- 5. LOGIC JURNAL (Input, Edit, Hapus) ---
  const loadDefaultAttendance = (className) => {
    if (schoolData[className]) {
      const initialAbsen = {};
      schoolData[className].forEach(student => initialAbsen[student] = 'H');
      setAttendance(initialAbsen);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'kelas') loadDefaultAttendance(value);
  };

  const handleAttendanceChange = (name, status) => {
    setAttendance({ ...attendance, [name]: status });
  };

  const startEditing = (jurnal) => {
    setEditingId(jurnal.id);
    setFormData({ kelas: jurnal.kelas, mapel: jurnal.mapel, catatan: jurnal.catatan });
    setAttendance(jurnal.attendanceData || {}); 
    setActiveTab('input');
    window.scrollTo(0, 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ kelas: '', mapel: '', catatan: '' });
    setAttendance({});
  };

  // --- FUNGSI BARU: HAPUS DENGAN KONFIRMASI TEGAS ---
  const handleDeleteJournal = (id) => {
    if (window.confirm("❓ KONFIRMASI HAPUS:\n\nApakah Anda yakin ingin menghapus jurnal ini?\nData yang dihapus tidak bisa dikembalikan.")) {
      const updatedJournals = journals.filter((j) => j.id !== id);
      setJournals(updatedJournals);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.kelas || !formData.catatan) return alert("Kelas dan Catatan wajib diisi!");

    const summary = { H: 0, S: 0, I: 0, A: 0 };
    Object.values(attendance).forEach(status => summary[status] = (summary[status] || 0) + 1);
    const summaryText = `H:${summary.H}, S:${summary.S}, I:${summary.I}, A:${summary.A}`;

    const entryData = {
      tanggal: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      ...formData,
      attendanceData: attendance,
      summaryText: summaryText
    };

    if (editingId) {
      const updatedJournals = journals.map((item) => item.id === editingId ? { ...item, ...entryData } : item);
      setJournals(updatedJournals);
      alert("Data berhasil di-UPDATE! ✏️");
      setEditingId(null);
    } else {
      const newEntry = { id: Date.now(), ...entryData };
      setJournals([newEntry, ...journals]);
      alert("Jurnal tersimpan! ✅");
    }

    setFormData({ kelas: '', mapel: '', catatan: '' });
    setAttendance({});
  };

  const filteredJournals = journals.filter(j => 
    j.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.mapel.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const classList = Object.keys(schoolData);

  // --- 6. TAMPILAN (UI) ---
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif', border: '1px solid #ddd', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <header style={{ padding: '15px', background: editingId ? '#d97706' : '#2563eb', color: 'white', textAlign: 'center', transition: '0.3s' }}>
        <h2 style={{ margin: 0 }}>{editingId ? '✏️ Mode Edit' : '📘 Jurnal Guru v4.2'}</h2>
        <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.9, fontWeight: 'normal' }}>
          CyberCom Since 2000 (c) Lukman Nulkhikmat @2026
        </div>
        {isAdminUnlocked && activeTab === 'manage' && <small style={{background: '#16a34a', padding: '2px 8px', borderRadius: '10px', fontSize: '10px'}}>ADMIN ACCESS</small>}
      </header>

      <main style={{ flex: 1, padding: '20px', background: '#f8fafc', paddingBottom: '80px' }}>
        
        {/* INPUT TAB */}
        {activeTab === 'input' && (
          <div>
            <h3>{editingId ? '📝 Edit Data' : '✍️ Input Jurnal'}</h3>
            {editingId && <button onClick={cancelEdit} style={{...buttonStyle, background: '#64748b', marginBottom: '15px', width: '100%'}}>❌ Batal Edit</button>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select name="kelas" value={formData.kelas} onChange={handleInputChange} style={{...inputStyle, background: 'white'}}>
                <option value="">-- Pilih Kelas --</option>
                {classList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {formData.kelas && (
                <div style={{background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', maxHeight: '300px', overflowY: 'auto'}}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#444'}}>📋 Daftar Kehadiran:</h4>
                  {schoolData[formData.kelas]?.length === 0 ? <small>Belum ada siswa.</small> : 
                    schoolData[formData.kelas].map(student => (
                      <div key={student} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '5px'}}>
                        <span style={{fontSize: '13px', fontWeight: 'bold'}}>{student}</span>
                        <div style={{display: 'flex', gap: '2px'}}>
                          {['H', 'S', 'I', 'A'].map(status => (
                            <button key={status} type="button" onClick={() => handleAttendanceChange(student, status)} style={{width: '25px', height: '25px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', background: attendance[student] === status ? (status === 'H' ? '#16a34a' : status === 'S' ? '#ca8a04' : status === 'I' ? '#2563eb' : '#dc2626') : '#e2e8f0', color: attendance[student] === status ? 'white' : '#64748b'}}>{status}</button>
                          ))}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
              <input type="text" name="mapel" placeholder="Mata Pelajaran" value={formData.mapel} onChange={handleInputChange} style={inputStyle} />
              <textarea name="catatan" placeholder="Catatan kejadian..." rows="3" value={formData.catatan} onChange={handleInputChange} style={inputStyle} />
              <button type="submit" style={{...buttonStyle, background: editingId ? '#d97706' : '#2563eb'}}>{editingId ? '💾 Update' : '💾 Simpan'}</button>
            </form>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div>
            <h3>📚 Riwayat & Data</h3>
            
            <div style={{...cardStyle, borderLeft: '5px solid #0ea5e9'}}>
              <h4 style={{marginTop: 0, color: '#0284c7'}}>📂 Menu Data</h4>
              <button onClick={downloadReport} style={{...buttonStyle, width: '100%', background: '#0ea5e9', marginBottom: '10px', fontSize: '12px'}}>📥 Download Laporan (Excel)</button>
              <div style={{display: 'flex', gap: '5px'}}>
                <button onClick={handleBackup} style={{...buttonStyle, flex: 1, background: '#64748b', fontSize: '12px'}}>☁️ Backup</button>
                <div style={{flex: 1, position: 'relative', overflow: 'hidden'}}>
                  <button style={{...buttonStyle, width: '100%', background: '#f97316', fontSize: '12px'}}>📂 Restore</button>
                  <input type="file" accept=".json" onChange={handleRestore} style={{position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer'}} />
                </div>
              </div>
              <small style={{fontSize: '10px', color: '#666', display: 'block', marginTop: '5px'}}>*Restore akan menimpa data yang ada.</small>
            </div>

            <input type="text" placeholder="🔍 Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{...inputStyle, width: '93%', marginBottom: '15px'}} />
            
            {filteredJournals.map((j) => (
              <div key={j.id} style={cardStyle}>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <h4 style={{margin: 0, color: '#2563eb'}}>{j.kelas}</h4>
                  <div style={{display: 'flex', gap: '5px'}}>
                    <button onClick={() => startEditing(j)} style={{...deleteButtonStyle, background: '#fef08a', color: '#854d0e'}}>✏️</button>
                    {/* TOMBOL HAPUS YANG SUDAH DIAMANKAN */}
                    <button onClick={() => handleDeleteJournal(j.id)} style={deleteButtonStyle}>🗑️</button>
                  </div>
                </div>
                <small style={{color: '#666'}}>{j.tanggal}</small>
                <div style={{margin: '8px 0', padding: '5px', background: '#f1f5f9', borderRadius: '5px', fontSize: '12px'}}><strong>Absensi:</strong> {j.summaryText || "-"}</div>
                <p style={{margin: 0}}>{j.catatan}</p>
              </div>
            ))}
          </div>
        )}

        {/* MANAGE TAB */}
        {activeTab === 'manage' && (
          <div>
            <h3>⚙️ Pengaturan Admin</h3>
            
            {!isAdminUnlocked ? (
              <div style={{textAlign: 'center', marginTop: '50px'}}>
                <div style={{fontSize: '50px', marginBottom: '20px'}}>🔒</div>
                <p>Masukkan PIN Admin</p>
                <form onSubmit={handleLoginAdmin}>
                  <input type="password" placeholder="PIN" value={inputPin} onChange={(e) => setInputPin(e.target.value)} style={{...inputStyle, textAlign: 'center', fontSize: '20px', letterSpacing: '5px', width: '150px'}} maxLength={6} />
                  <br/><br/>
                  <button type="submit" style={buttonStyle}>Buka Gembok 🔓</button>
                </form>
              </div>
            ) : (
              <div>
                <button onClick={handleLogoutAdmin} style={{...buttonStyle, background: '#334155', width: '100%', marginBottom: '20px'}}>🔒 Logout Admin</button>

                <div style={cardStyle}>
                  <h4>1. Tambah Kelas</h4>
                  <div style={{display: 'flex', gap: '5px'}}>
                    <input type="text" placeholder="Nama Kelas" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} style={{...inputStyle, flex: 1}} />
                    <button onClick={addClass} style={{...buttonStyle, padding: '0 15px'}}>+ Buat</button>
                  </div>
                  <div style={{marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px'}}>
                    {classList.map(c => <span key={c} style={{background: '#e0f2fe', padding: '5px', borderRadius: '15px', fontSize: '12px'}}>{c} <span onClick={() => deleteClass(c)} style={{color:'red', cursor:'pointer'}}>×</span></span>)}
                  </div>
                </div>

                <div style={cardStyle}>
                  <h4>2. Input Siswa</h4>
                  <select value={selectedClassForStudent} onChange={(e) => setSelectedClassForStudent(e.target.value)} style={{...inputStyle, width: '100%', marginBottom: '10px', background:'white'}}>
                    <option value="">-- Pilih Kelas --</option>
                    {classList.map(c => <option key={c} value={c}>{c} ({schoolData[c].length} Siswa)</option>)}
                  </select>
                  <textarea placeholder="Paste nama siswa..." rows="5" value={studentListInput} onChange={(e) => setStudentListInput(e.target.value)} style={{...inputStyle, width: '93%'}} />
                  <button onClick={saveStudents} style={{...buttonStyle, width: '100%', marginTop:'10px', background:'#16a34a'}}>Simpan Siswa</button>
                </div>

                <div style={{...cardStyle, border: '1px solid #8b5cf6'}}>
                  <h4 style={{color: '#7c3aed'}}>3. Backup & Restore (Admin)</h4>
                  <div style={{display: 'flex', gap: '5px'}}>
                    <button onClick={handleBackup} style={{...buttonStyle, width: '100%', background: '#8b5cf6', fontSize: '12px'}}>☁️ Backup</button>
                    <div style={{width: '100%', position: 'relative', overflow: 'hidden'}}>
                      <button style={{...buttonStyle, width: '100%', background: '#7c3aed', fontSize: '12px'}}>📂 Restore</button>
                      <input type="file" accept=".json" onChange={handleRestore} style={{position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer'}} />
                    </div>
                  </div>
                </div>

                <div style={cardStyle}>
                  <h4>4. Ganti PIN Admin</h4>
                  <div style={{display: 'flex', gap: '5px'}}>
                    <input type="number" placeholder="PIN Baru" value={newPinInput} onChange={(e) => setNewPinInput(e.target.value)} style={{...inputStyle, flex: 1}} />
                    <button onClick={handleChangePin} style={{...buttonStyle, background: '#0f172a'}}>Ganti</button>
                  </div>
                </div>

                <div style={{marginTop: '20px'}}>
                  <button onClick={() => { if(window.confirm('⚠️ PERINGATAN KERAS:\nHapus SEMUA data aplikasi ini?\nTindakan ini tidak bisa dibatalkan!')) { setJournals([]); setSchoolData({}); localStorage.clear(); window.location.reload(); } }} style={{...buttonStyle, width: '100%', background: '#ef4444'}}>🗑️ Reset Total</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      <nav style={{ display: 'flex', borderTop: '1px solid #ddd', background: 'white', position: 'fixed', bottom: 0, width: '100%', maxWidth: '400px' }}>
        <button style={navButtonStyle(activeTab === 'input')} onClick={() => setActiveTab('input')}>{editingId ? '✏️ Edit' : '✏️ Input'}</button>
        <button style={navButtonStyle(activeTab === 'history')} onClick={() => setActiveTab('history')}>📜 Riwayat</button>
        <button style={navButtonStyle(activeTab === 'manage')} onClick={() => setActiveTab('manage')}>⚙️ {activeTab === 'manage' && !isAdminUnlocked ? '🔒' : ''} Atur</button>
      </nav>
    </div>
  );
}

const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' };
const buttonStyle = { padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
const cardStyle = { background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '10px' };
const deleteButtonStyle = { background: '#fee2e2', border: 'none', borderRadius: '5px', cursor: 'pointer', padding: '5px 10px' };
const navButtonStyle = (isActive) => ({ flex: 1, padding: '15px', background: isActive ? '#eff6ff' : 'transparent', border: 'none', color: isActive ? '#2563eb' : '#666', fontWeight: isActive ? 'bold' : 'normal', cursor: 'pointer', borderTop: isActive ? '3px solid #2563eb' : '3px solid transparent' });