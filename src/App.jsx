import React, { useState, useEffect } from 'react';

// Komponen Utama
export default function JurnalGuru() {
  // 1. STATE MANAGEMENT
  
  // Menu aktif (input, history, manage)
  const [activeTab, setActiveTab] = useState('input');
  
  // PERBAIKAN DI SINI:
  // Kita baca data dari LocalStorage LANGSUNG saat aplikasi mulai (Lazy Initialization).
  // Jadi data tidak akan tertimpa kosong saat di-refresh.
  const [journals, setJournals] = useState(() => {
    const saved = localStorage.getItem('jurnal_guru_data');
    if (saved) {
      return JSON.parse(saved);
    } else {
      return [];
    }
  });
  
  // State untuk form input
  const [formData, setFormData] = useState({
    kelas: '',
    mapel: '',
    catatan: ''
  });

  // 2. EFEK SAMPING (SIDE EFFECTS)
  
  // Setiap kali data 'journals' berubah (ditambah/dihapus), otomatis simpan ke LocalStorage
  useEffect(() => {
    localStorage.setItem('jurnal_guru_data', JSON.stringify(journals));
  }, [journals]);

  // 3. FUNGSI LOGIC (HANDLERS)

  // Menangani ketikan di form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Simpan jurnal baru
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.kelas || !formData.catatan) return alert("Kelas dan Catatan wajib diisi!");

    const newEntry = {
      id: Date.now(), // ID unik pakai waktu sekarang
      tanggal: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      ...formData
    };

    setJournals([newEntry, ...journals]); // Tambah data baru di paling atas
    setFormData({ kelas: '', mapel: '', catatan: '' }); // Reset form agar bersih kembali
    alert("Jurnal berhasil disimpan! ✅");
  };

  // Hapus semua data
  const clearAllData = () => {
    if (window.confirm("Yakin ingin menghapus semua data jurnal?")) {
      setJournals([]); // Kosongkan state
      localStorage.removeItem('jurnal_guru_data'); // Kosongkan memori browser
    }
  };

  // 4. TAMPILAN (UI)
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif', border: '1px solid #ddd', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ padding: '15px', background: '#2563eb', color: 'white', textAlign: 'center' }}>
        <h2 style={{ margin: 0 }}>📘 Jurnal Guru Digital</h2>
      </header>

      {/* Konten Utama (Scrollable) */}
      <main style={{ flex: 1, padding: '20px', background: '#f8fafc' }}>
        
        {/* TAB 1: INPUT */}
        {activeTab === 'input' && (
          <div>
            <h3>✍️ Tulis Jurnal Baru</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="text" 
                name="kelas" 
                placeholder="Kelas (contoh: XI RPL 1)" 
                value={formData.kelas} 
                onChange={handleInputChange}
                style={inputStyle} 
              />
              <input 
                type="text" 
                name="mapel" 
                placeholder="Mata Pelajaran / Topik" 
                value={formData.mapel} 
                onChange={handleInputChange}
                style={inputStyle} 
              />
              <textarea 
                name="catatan" 
                placeholder="Catatan kejadian di kelas..." 
                rows="5"
                value={formData.catatan} 
                onChange={handleInputChange}
                style={inputStyle} 
              />
              <button type="submit" style={buttonStyle}>Simpan Jurnal</button>
            </form>
          </div>
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === 'history' && (
          <div>
            <h3>📚 Riwayat Jurnal</h3>
            {journals.length === 0 ? <p style={{color: '#888'}}>Belum ada catatan.</p> : (
              journals.map((jurnal) => (
                <div key={jurnal.id} style={cardStyle}>
                  <small style={{color: '#666', fontWeight: 'bold'}}>{jurnal.tanggal}</small>
                  <h4 style={{margin: '5px 0', color: '#2563eb'}}>{jurnal.kelas} - {jurnal.mapel}</h4>
                  <p style={{margin: 0}}>{jurnal.catatan}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: MANAGE */}
        {activeTab === 'manage' && (
          <div>
            <h3>⚙️ Pengaturan</h3>
            <div style={cardStyle}>
              <p>Total Catatan Tersimpan: <strong>{journals.length}</strong></p>
              <button onClick={clearAllData} style={{...buttonStyle, background: '#ef4444'}}>
                🗑️ Hapus Semua Data
              </button>
            </div>
            <p style={{fontSize: '12px', color: '#888', marginTop: '20px'}}>
              *Data tersimpan di browser ini (Local Storage).
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav style={{ display: 'flex', borderTop: '1px solid #ddd', background: 'white', position: 'sticky', bottom: 0 }}>
        <button style={navButtonStyle(activeTab === 'input')} onClick={() => setActiveTab('input')}>
          ✏️ Input
        </button>
        <button style={navButtonStyle(activeTab === 'history')} onClick={() => setActiveTab('history')}>
          📜 Riwayat
        </button>
        <button style={navButtonStyle(activeTab === 'manage')} onClick={() => setActiveTab('manage')}>
          ⚙️ Atur
        </button>
      </nav>

    </div>
  );
}

// --- STYLE ---
const inputStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  fontSize: '14px'
};

const buttonStyle = {
  padding: '12px',
  background: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const cardStyle = {
  background: 'white',
  padding: '15px',
  borderRadius: '10px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  marginBottom: '10px'
};

const navButtonStyle = (isActive) => ({
  flex: 1,
  padding: '15px',
  background: isActive ? '#eff6ff' : 'transparent',
  border: 'none',
  color: isActive ? '#2563eb' : '#666',
  fontWeight: isActive ? 'bold' : 'normal',
  cursor: 'pointer',
  borderTop: isActive ? '3px solid #2563eb' : '3px solid transparent'
});