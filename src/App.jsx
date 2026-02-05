import React, { useState, useEffect } from 'react';

export default function JurnalGuru() {
  // 1. STATE MANAGEMENT
  const [activeTab, setActiveTab] = useState('input');
  const [searchTerm, setSearchTerm] = useState('');

  const [journals, setJournals] = useState(() => {
    const saved = localStorage.getItem('jurnal_guru_data');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [formData, setFormData] = useState({
    kelas: '',
    mapel: '',
    catatan: ''
  });

  // 2. EFEK SAMPING
  useEffect(() => {
    localStorage.setItem('jurnal_guru_data', JSON.stringify(journals));
  }, [journals]);

  // 3. LOGIC
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
    alert("Jurnal berhasil disimpan! ✅");
  };

  const deleteItem = (id) => {
    if (window.confirm("Hapus catatan ini saja?")) {
      const updatedJournals = journals.filter((jurnal) => jurnal.id !== id);
      setJournals(updatedJournals);
    }
  };

  const clearAllData = () => {
    if (window.confirm("Yakin ingin menghapus SEMUA data jurnal?")) {
      setJournals([]);
      localStorage.removeItem('jurnal_guru_data');
    }
  };

  // FITUR BARU: DOWNLOAD KE EXCEL (CSV)
  const downloadReport = () => {
    if (journals.length === 0) return alert("Belum ada data untuk didownload!");

    // 1. Buat Header CSV
    let csvContent = "Tanggal,Kelas,Mapel,Catatan\n";

    // 2. Masukkan Data baris per baris
    journals.forEach(row => {
      // Kita bungkus catatan pakai tanda kutip biar aman kalau ada koma di dalam teks
      csvContent += `${row.tanggal},${row.kelas},${row.mapel},"${row.catatan}"\n`;
    });

    // 3. Buat File Virtual & Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Laporan_Jurnal_Guru.csv"); // Nama filenya
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Search
  const filteredJournals = journals.filter((jurnal) => 
    jurnal.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jurnal.mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jurnal.catatan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 4. TAMPILAN
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif', border: '1px solid #ddd', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <header style={{ padding: '15px', background: '#2563eb', color: 'white', textAlign: 'center' }}>
        <h2 style={{ margin: 0 }}>📘 Jurnal Guru v1.3</h2>
      </header>

      <main style={{ flex: 1, padding: '20px', background: '#f8fafc', paddingBottom: '80px' }}>
        
        {/* TAB INPUT */}
        {activeTab === 'input' && (
          <div>
            <h3>✍️ Tulis Jurnal Baru</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" name="kelas" placeholder="Kelas (contoh: XI RPL 1)" value={formData.kelas} onChange={handleInputChange} style={inputStyle} />
              <input type="text" name="mapel" placeholder="Mata Pelajaran / Topik" value={formData.mapel} onChange={handleInputChange} style={inputStyle} />
              <textarea name="catatan" placeholder="Catatan kejadian..." rows="5" value={formData.catatan} onChange={handleInputChange} style={inputStyle} />
              <button type="submit" style={buttonStyle}>Simpan Jurnal</button>
            </form>
          </div>
        )}

        {/* TAB HISTORY */}
        {activeTab === 'history' && (
          <div>
            <h3>📚 Riwayat Jurnal</h3>
            <input 
              type="text" 
              placeholder="🔍 Cari kelas, mapel, atau siswa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{...inputStyle, width: '93%', marginBottom: '15px', borderColor: '#2563eb'}}
            />
            {journals.length === 0 ? <p style={{color: '#888'}}>Belum ada catatan.</p> : (
              filteredJournals.length > 0 ? (
                filteredJournals.map((jurnal) => (
                  <div key={jurnal.id} style={cardStyle}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                      <div>
                        <small style={{color: '#666', fontWeight: 'bold'}}>{jurnal.tanggal}</small>
                        <h4 style={{margin: '5px 0', color: '#2563eb'}}>{jurnal.kelas} - {jurnal.mapel}</h4>
                      </div>
                      <button onClick={() => deleteItem(jurnal.id)} style={deleteButtonStyle}>🗑️</button>
                    </div>
                    <p style={{margin: 0}}>{jurnal.catatan}</p>
                  </div>
                ))
              ) : <p style={{textAlign: 'center', color: '#888'}}>Tidak ditemukan data yang cocok.</p>
            )}
          </div>
        )}

        {/* TAB MANAGE (UPDATE: Ada Tombol Download) */}
        {activeTab === 'manage' && (
          <div>
            <h3>⚙️ Pengaturan</h3>
            <div style={cardStyle}>
              <p>Total Catatan: <strong>{journals.length}</strong></p>
              
              {/* TOMBOL BARU: DOWNLOAD */}
              <button onClick={downloadReport} style={{...buttonStyle, background: '#16a34a', width: '100%', marginBottom: '10px'}}>
                📥 Download Laporan (Excel)
              </button>

              <button onClick={clearAllData} style={{...buttonStyle, background: '#ef4444', width: '100%'}}>
                🗑️ Hapus SEMUA Data
              </button>
            </div>
            <div style={{marginTop: '20px', padding: '10px', background: '#e0f2fe', borderRadius: '8px', fontSize: '13px', color: '#0369a1'}}>
              💡 <strong>Tips:</strong> File yang didownload berformat .csv, bisa langsung dibuka di Microsoft Excel atau Google Sheets.
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

// STYLE
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '14px' };
const buttonStyle = { padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const cardStyle = { background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '10px' };
const deleteButtonStyle = { background: '#fee2e2', border: 'none', borderRadius: '5px', cursor: 'pointer', padding: '5px 10px', fontSize: '16px' };
const navButtonStyle = (isActive) => ({ flex: 1, padding: '15px', background: isActive ? '#eff6ff' : 'transparent', border: 'none', color: isActive ? '#2563eb' : '#666', fontWeight: isActive ? 'bold' : 'normal', cursor: 'pointer', borderTop: isActive ? '3px solid #2563eb' : '3px solid transparent' });