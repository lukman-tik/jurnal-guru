import React, { useState, useEffect } from 'react';

export default function JurnalGuru() {
  // --- 1. STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('input'); 
  const [searchTerm, setSearchTerm] = useState('');

  // STATE UNTUK EDIT DATA
  const [editingId, setEditingId] = useState(null); // ID jurnal yang sedang diedit (null = mode input baru)

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

  // --- 2. EFEK SAMPING (AUTO SAVE) ---
  useEffect(() => {
    localStorage.setItem('jurnal_guru_data', JSON.stringify(journals));
  }, [journals]);

  useEffect(() => {
    localStorage.setItem('data_sekolah', JSON.stringify(schoolData));
  }, [schoolData]);

  // --- 3. LOGIC MANAJEMEN DATA ---
  const addClass = () => {
    if (!newClassName) return alert("Nama kelas kosong!");
    if (schoolData[newClassName]) return alert("Kelas sudah ada!");
    setSchoolData({ ...schoolData, [newClassName]: [] });
    setNewClassName('');
  };

  const deleteClass = (className) => {
    if (window.confirm(`Hapus kelas ${className}? Data siswa hilang.`)) {
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

  // --- 4. LOGIC JURNAL & ABSENSI (DI-UPDATE UNTUK EDIT) ---
  
  // Fungsi Load Default Absensi (Semua Hadir)
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

    // Jika ganti KELAS secara manual, reset absensi ke default (H semua)
    if (name === 'kelas') {
      loadDefaultAttendance(value);
    }
  };

  const handleAttendanceChange = (name, status) => {
    setAttendance({ ...attendance, [name]: status });
  };

  // FUNGSI BARU: PERSIAPAN EDIT
  const startEditing = (jurnal) => {
    setEditingId(jurnal.id); // Tandai kita sedang mengedit ID ini
    setFormData({
      kelas: jurnal.kelas,
      mapel: jurnal.mapel,
      catatan: jurnal.catatan
    });
    // Load absensi lama (jika ada), kalau data lama sekali (sebelum fitur absen) load kosong
    setAttendance(jurnal.attendanceData || {}); 
    setActiveTab('input'); // Pindah otomatis ke tab input
    window.scrollTo(0, 0); // Scroll ke atas
  };

  // FUNGSI BARU: BATAL EDIT
  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ kelas: '', mapel: '', catatan: '' });
    setAttendance({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.kelas || !formData.catatan) return alert("Kelas dan Catatan wajib diisi!");

    // Hitung Ringkasan Absen
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
      // --- LOGIKA UPDATE (EDIT) ---
      const updatedJournals = journals.map((item) => 
        item.id === editingId ? { ...item, ...entryData } : item
      );
      setJournals(updatedJournals);
      alert("Data berhasil di-UPDATE! ✏️");
      setEditingId(null); // Keluar mode edit
    } else {
      // --- LOGIKA SIMPAN BARU ---
      const newEntry = { id: Date.now(), ...entryData };
      setJournals([newEntry, ...journals]);
      alert("Jurnal tersimpan! ✅");
    }

    // Reset Form
    setFormData({ kelas: '', mapel: '', catatan: '' });
    setAttendance({});
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

  // Search Filter
  const filteredJournals = journals.filter(j => 
    j.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.mapel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const classList = Object.keys(schoolData);

  // --- 5. TAMPILAN (UI) ---
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif', border: '1px solid #ddd', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <header style={{ padding: '15px', background: editingId ? '#d97706' : '#2563eb', color: 'white', textAlign: 'center', transition: '0.3s' }}>
        <h2 style={{ margin: 0 }}>{editingId ? '✏️ Mode Edit' : '📘 Jurnal Guru v3.0'}</h2>
      </header>

      <main style={{ flex: 1, padding: '20px', background: '#f8fafc', paddingBottom: '80px' }}>
        
        {/* INPUT TAB */}
        {activeTab === 'input' && (
          <div>
            <h3>{editingId ? '📝 Edit Data Jurnal' : '✍️ Input Jurnal Baru'}</h3>
            
            {/* Tombol Batal Edit */}
            {editingId && (
              <button onClick={cancelEdit} style={{...buttonStyle, background: '#64748b', marginBottom: '15px', width: '100%'}}>
                ❌ Batal Edit (Kembali ke Input Baru)
              </button>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select name="kelas" value={formData.kelas} onChange={handleInputChange} style={{...inputStyle, background: 'white'}}>
                <option value="">-- Pilih Kelas --</option>
                {classList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* LIST ABSENSI */}
              {formData.kelas && (
                <div style={{background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', maxHeight: '300px', overflowY: 'auto'}}>
                  <h4 style={{margin: '0 0 10px 0', fontSize: '14px', color: '#444'}}>📋 Daftar Kehadiran:</h4>
                  {schoolData[formData.kelas]?.length === 0 ? <small>Belum ada siswa.</small> : 
                    schoolData[formData.kelas].map(student => (
                      <div key={student} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '5px'}}>
                        <span style={{fontSize: '13px', fontWeight: 'bold'}}>{student}</span>
                        <div style={{display: 'flex', gap: '2px'}}>
                          {['H', 'S', 'I', 'A'].map(status => (
                            <button 
                              key={status} 
                              type="button"
                              onClick={() => handleAttendanceChange(student, status)}
                              style={{
                                width: '25px', height: '25px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold',
                                background: attendance[student] === status ? 
                                  (status === 'H' ? '#16a34a' : status === 'S' ? '#ca8a04' : status === 'I' ? '#2563eb' : '#dc2626') : '#e2e8f0',
                                color: attendance[student] === status ? 'white' : '#64748b'
                              }}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}

              <input type="text" name="mapel" placeholder="Mata Pelajaran" value={formData.mapel} onChange={handleInputChange} style={inputStyle} />
              <textarea name="catatan" placeholder="Catatan kejadian..." rows="3" value={formData.catatan} onChange={handleInputChange} style={inputStyle} />
              
              <button type="submit" style={{...buttonStyle, background: editingId ? '#d97706' : '#2563eb'}}>
                {editingId ? '💾 Update Perubahan' : '💾 Simpan Laporan'}
              </button>
            </form>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div>
            <h3>📚 Riwayat</h3>
            <input type="text" placeholder="🔍 Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{...inputStyle, width: '93%', marginBottom: '15px'}} />
            {filteredJournals.map((j) => (
              <div key={j.id} style={cardStyle}>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <h4 style={{margin: 0, color: '#2563eb'}}>{j.kelas}</h4>
                  <div style={{display: 'flex', gap: '5px'}}>
                    {/* TOMBOL EDIT (PENSIL) */}
                    <button onClick={() => startEditing(j)} style={{...deleteButtonStyle, background: '#fef08a', color: '#854d0e'}}>✏️</button>
                    {/* TOMBOL HAPUS */}
                    <button onClick={() => { if(window.confirm('Hapus?')) setJournals(journals.filter(x => x.id !== j.id)) }} style={deleteButtonStyle}>🗑️</button>
                  </div>
                </div>
                <small style={{color: '#666'}}>{j.tanggal}</small>
                <div style={{margin: '8px 0', padding: '5px', background: '#f1f5f9', borderRadius: '5px', fontSize: '12px'}}>
                  <strong>Absensi:</strong> {j.summaryText || "-"}
                </div>
                <p style={{margin: 0}}>{j.catatan}</p>
              </div>
            ))}
          </div>
        )}

        {/* MANAGE TAB */}
        {activeTab === 'manage' && (
          <div>
            <h3>⚙️ Data Sekolah</h3>
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

            <div style={cardStyle}>
              <h4>3. Laporan</h4>
              <button onClick={downloadReport} style={{...buttonStyle, width: '100%', background: '#0ea5e9'}}>📥 Download Excel Lengkap</button>
              <button onClick={() => { if(window.confirm('Hapus SEMUA data?')) { setJournals([]); localStorage.clear(); window.location.reload(); } }} style={{...buttonStyle, width: '100%', background: '#ef4444', marginTop: '10px'}}>🗑️ Reset Aplikasi</button>
            </div>
          </div>
        )}
      </main>

      <nav style={{ display: 'flex', borderTop: '1px solid #ddd', background: 'white', position: 'fixed', bottom: 0, width: '100%', maxWidth: '400px' }}>
        <button style={navButtonStyle(activeTab === 'input')} onClick={() => setActiveTab('input')}>
          {editingId ? '✏️ Edit' : '✏️ Input'}
        </button>
        <button style={navButtonStyle(activeTab === 'history')} onClick={() => setActiveTab('history')}>📜 Riwayat</button>
        <button style={navButtonStyle(activeTab === 'manage')} onClick={() => setActiveTab('manage')}>⚙️ Atur</button>
      </nav>
    </div>
  );
}

const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' };
const buttonStyle = { padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
const cardStyle = { background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '10px' };
const deleteButtonStyle = { background: '#fee2e2', border: 'none', borderRadius: '5px', cursor: 'pointer', padding: '5px 10px' };
const navButtonStyle = (isActive) => ({ flex: 1, padding: '15px', background: isActive ? '#eff6ff' : 'transparent', border: 'none', color: isActive ? '#2563eb' : '#666', fontWeight: isActive ? 'bold' : 'normal', cursor: 'pointer', borderTop: isActive ? '3px solid #2563eb' : '3px solid transparent' });