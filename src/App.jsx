import React, { useState, useEffect } from 'react';

export default function JurnalGuru() {
  // --- 1. STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('manage'); // Kita default ke 'manage' dulu biar Bapak langsung setting
  const [searchTerm, setSearchTerm] = useState('');

  // A. DATABASE JURNAL (Seperti Biasa)
  const [journals, setJournals] = useState(() => {
    const saved = localStorage.getItem('jurnal_guru_data');
    return saved ? JSON.parse(saved) : [];
  });

  // B. DATABASE SEKOLAH (BARU: Simpan Kelas & Siswa)
  // Struktur: { "XI RPL 1": ["Ahmad", "Budi"], "X TKJ": ["Citra"] }
  const [schoolData, setSchoolData] = useState(() => {
    const saved = localStorage.getItem('data_sekolah');
    return saved ? JSON.parse(saved) : {}; 
  });

  // State Form Input Jurnal
  const [formData, setFormData] = useState({
    kelas: '',
    mapel: '',
    catatan: ''
  });

  // State Form Tambah Data (Di Menu Manage)
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

  // --- 3. LOGIC MANAJEMEN DATA (KELAS & SISWA) ---
  
  // Tambah Kelas Baru
  const addClass = () => {
    if (!newClassName) return alert("Nama kelas tidak boleh kosong!");
    if (schoolData[newClassName]) return alert("Kelas ini sudah ada!");

    // Buat kelas baru dengan daftar siswa kosong
    setSchoolData({ ...schoolData, [newClassName]: [] });
    setNewClassName('');
    alert(`Kelas ${newClassName} berhasil dibuat!`);
  };

  // Hapus Kelas
  const deleteClass = (className) => {
    if (window.confirm(`Yakin hapus kelas ${className}? Data siswa di dalamnya akan hilang.`)) {
      const newData = { ...schoolData };
      delete newData[className];
      setSchoolData(newData);
    }
  };

  // Simpan Siswa ke Kelas (Fitur Paste Excel)
  const saveStudents = () => {
    if (!selectedClassForStudent) return alert("Pilih kelas dulu!");
    if (!studentListInput) return alert("Daftar nama kosong!");

    // Pecah text berdasarkan baris (Enter), lalu bersihkan spasi
    const studentsArray = studentListInput.split('\n').map(name => name.trim()).filter(name => name !== '');

    // Update data sekolah
    setSchoolData({
      ...schoolData,
      [selectedClassForStudent]: studentsArray
    });

    setStudentListInput('');
    alert(`Berhasil menyimpan ${studentsArray.length} siswa ke kelas ${selectedClassForStudent}!`);
  };

  // --- 4. LOGIC JURNAL ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.kelas || !formData.catatan) return alert("Kelas dan Catatan wajib diisi!");

    const newEntry = {
      id: Date.now(),
      tanggal: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      ...formData
    };

    setJournals([newEntry, ...journals]);
    setFormData({ kelas: '', mapel: '', catatan: '' });
    alert("Jurnal disimpan! (Fitur Absensi akan hadir di update berikutnya)");
  };

  const deleteItem = (id) => {
    if (window.confirm("Hapus catatan ini?")) {
      setJournals(journals.filter((j) => j.id !== id));
    }
  };

  // Filter Search
  const filteredJournals = journals.filter((jurnal) => 
    jurnal.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jurnal.mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jurnal.catatan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const classList = Object.keys(schoolData); // Ambil daftar nama kelas saja

  // --- 5. TAMPILAN (UI) ---
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif', border: '1px solid #ddd', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <header style={{ padding: '15px', background: '#2563eb', color: 'white', textAlign: 'center' }}>
        <h2 style={{ margin: 0 }}>📘 Jurnal Guru v2.0</h2>
        <small>Database Sekolah</small>
      </header>

      <main style={{ flex: 1, padding: '20px', background: '#f8fafc', paddingBottom: '80px' }}>
        
        {/* TAB 1: INPUT JURNAL */}
        {activeTab === 'input' && (
          <div>
            <h3>✍️ Tulis Jurnal</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Dropdown Dinamis dari Data Sekolah */}
              <select name="kelas" value={formData.kelas} onChange={handleInputChange} style={{...inputStyle, background: 'white'}}>
                <option value="">-- Pilih Kelas --</option>
                {classList.length === 0 && <option disabled>Belum ada data kelas (Ke menu Atur dulu)</option>}
                {classList.map((kelas) => (
                  <option key={kelas} value={kelas}>{kelas}</option>
                ))}
              </select>

              <input type="text" name="mapel" placeholder="Mata Pelajaran" value={formData.mapel} onChange={handleInputChange} style={inputStyle} />
              <textarea name="catatan" placeholder="Catatan kejadian..." rows="5" value={formData.catatan} onChange={handleInputChange} style={inputStyle} />
              <button type="submit" style={buttonStyle}>Simpan Jurnal</button>
            </form>
          </div>
        )}

        {/* TAB 2: RIWAYAT */}
        {activeTab === 'history' && (
          <div>
            <h3>📚 Riwayat</h3>
            <input type="text" placeholder="🔍 Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{...inputStyle, width: '93%', marginBottom: '15px'}} />
            {journals.map((jurnal) => (
              <div key={jurnal.id} style={cardStyle}>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <h4 style={{margin: 0, color: '#2563eb'}}>{jurnal.kelas}</h4>
                  <button onClick={() => deleteItem(jurnal.id)} style={deleteButtonStyle}>🗑️</button>
                </div>
                <small>{jurnal.tanggal}</small>
                <p>{jurnal.catatan}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: ATUR (MANAGE) - TEMPAT KERJA KITA SEKARANG */}
        {activeTab === 'manage' && (
          <div>
            <h3>⚙️ Data Sekolah</h3>
            
            {/* Bagian 1: Tambah Kelas */}
            <div style={cardStyle}>
              <h4>1. Tambah Kelas</h4>
              <div style={{display: 'flex', gap: '5px'}}>
                <input 
                  type="text" 
                  placeholder="Nama Kelas (Contoh: XI RPL 1)" 
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  style={{...inputStyle, flex: 1}}
                />
                <button onClick={addClass} style={{...buttonStyle, padding: '0 15px'}}>+ Buat</button>
              </div>

              {/* List Kelas yang ada */}
              <div style={{marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px'}}>
                {classList.map(cls => (
                  <span key={cls} style={{background: '#e0f2fe', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '5px'}}>
                    {cls} 
                    <span onClick={() => deleteClass(cls)} style={{cursor: 'pointer', fontWeight: 'bold', color: 'red'}}>×</span>
                  </span>
                ))}
                {classList.length === 0 && <small style={{color: '#888'}}>Belum ada kelas.</small>}
              </div>
            </div>

            {/* Bagian 2: Input Siswa */}
            <div style={cardStyle}>
              <h4>2. Input Siswa (Copy-Paste)</h4>
              <p style={{fontSize: '12px', color: '#666'}}>Pilih kelas, lalu paste daftar nama siswa dari Excel di bawah ini.</p>
              
              <select 
                value={selectedClassForStudent} 
                onChange={(e) => setSelectedClassForStudent(e.target.value)} 
                style={{...inputStyle, background: 'white', width: '100%', marginBottom: '10px'}}
              >
                <option value="">-- Pilih Kelas --</option>
                {classList.map((kelas) => (
                  <option key={kelas} value={kelas}>{kelas} ({schoolData[kelas].length} Siswa)</option>
                ))}
              </select>

              <textarea 
                placeholder="Paste nama siswa di sini...&#10;Ahmad&#10;Budi&#10;Candra" 
                rows="6" 
                value={studentListInput}
                onChange={(e) => setStudentListInput(e.target.value)}
                style={{...inputStyle, width: '93%'}}
              />
              
              <button onClick={saveStudents} style={{...buttonStyle, width: '100%', marginTop: '10px', background: '#16a34a'}}>
                💾 Simpan Data Siswa
              </button>
            </div>

          </div>
        )}
      </main>

      <nav style={{ display: 'flex', borderTop: '1px solid #ddd', background: 'white', position: 'fixed', bottom: 0, width: '100%', maxWidth: '400px' }}>
        <button style={navButtonStyle(activeTab === 'input')} onClick={() => setActiveTab('input')}>✏️ Input</button>
        <button style={navButtonStyle(activeTab === 'history')} onClick={() => setActiveTab('history')}>📜 Riwayat</button>
        <button style={navButtonStyle(activeTab === 'manage')} onClick={() => setActiveTab('manage')}>⚙️ Atur</button>
      </nav>

    </div>
  );
}

// STYLE (SAMA)
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' };
const buttonStyle = { padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const cardStyle = { background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '10px' };
const deleteButtonStyle = { background: '#fee2e2', border: 'none', borderRadius: '5px', cursor: 'pointer', padding: '5px 10px', fontSize: '16px' };
const navButtonStyle = (isActive) => ({ flex: 1, padding: '15px', background: isActive ? '#eff6ff' : 'transparent', border: 'none', color: isActive ? '#2563eb' : '#666', fontWeight: isActive ? 'bold' : 'normal', cursor: 'pointer', borderTop: isActive ? '3px solid #2563eb' : '3px solid transparent' });