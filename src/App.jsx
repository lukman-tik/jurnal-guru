import React, { useState, useEffect } from 'react';

export default function JurnalGuru() {
  // 1. STATE MANAGEMENT
  const [activeTab, setActiveTab] = useState('input');
  
  // Baca data saat awal (Lazy Initialization)
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

  // 3. LOGIC (HANDLERS)
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

  // FITUR BARU: Hapus satu item saja
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

  // 4. TAMPILAN (UI)
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif', border: '1px solid #ddd', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <header style={{ padding: '15px', background: '#2563eb', color: 'white', textAlign: 'center' }}>
        <h2 style={{ margin: 0 }}>📘 Jurnal Guru v1.1</h2>
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

        {/* TAB HISTORY (YANG DI-UPDATE) */}
        {activeTab === 'history' && (
          <div>
            <h3>📚 Riwayat Jurnal</h3>
            {journals.length === 0 ? <p style={{color: '#888'}}>Belum ada catatan.</p> : (
              journals.map((jurnal) => (
                <div key={jurnal.id} style={cardStyle}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                    <div>
                      <small style={{color: '#666', fontWeight: 'bold'}}>{jurnal.tanggal}</small>
                      <h4 style={{margin: '5px 0', color: '#2563eb'}}>{jurnal.kelas} - {jurnal.mapel}</h4>
                    </div>
                    {/* TOMBOL HAPUS KECIL */}
                    <button onClick={() => deleteItem(jurnal.id)} style={deleteButtonStyle}>🗑️</button>
                  </div>
                  <p style={{margin: 0}}>{jurnal.catatan}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB MANAGE */}
        {activeTab === 'manage' && (
          <div>
            <h3>⚙️ Pengaturan</h3>
            <div style={cardStyle}>
              <p>Total Catatan: <strong>{journals.length}</strong></p>
              <button onClick={clearAllData} style={{...buttonStyle, background: '#ef4444'}}>🗑️ Hapus SEMUA Data</button>
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
const deleteButtonStyle = { background: '#fee2e2', border: 'none', borderRadius: '5px', cursor: 'pointer', padding: '5px 10px', fontSize: '16px' }; // Style baru
const navButtonStyle = (isActive) => ({ flex: 1, padding: '15px', background: isActive ? '#eff6ff' : 'transparent', border: 'none', color: isActive ? '#2563eb' : '#666', fontWeight: isActive ? 'bold' : 'normal', cursor: 'pointer', borderTop: isActive ? '3px solid #2563eb' : '3px solid transparent' });