// Inisialisasi
// Inisialisasi Peta
var map = L.map('map', {
    zoomControl: false 
}).setView([-7.03, 110.38], 11); // Koordinat tengah matematis & Zoom out sedikit


// Fungsi Reset View: Otomatis mencari tengah berdasarkan data
function resetView() {
    if (geoJsonLayer) {
        // Engineering solution: Biarkan Leaflet menghitung batas kotak data kamu
        map.fitBounds(geoJsonLayer.getBounds(), {
            padding: [20, 20] // Kasih nafas/margin 20px biar gak mepet pinggir layar
        });
    } else {
        // Fallback kalau data belum dimuat (Safety net)
        // Koordinat Matematis Tengah Semarang:
        map.setView([-7.03, 110.38], 11); 
    }
    
    // Reset dropdown
    document.getElementById('district-selector').value = ""; 
    map.closePopup();
}

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Variabel Global untuk menyimpan layer GeoJSON dan nama kolom yang sedang aktif
/* --- LOAD DATA GEOJSON --- */
var geoJsonLayer; // Variabel global biar bisa diakses dari console/fungsi lain

// Ganti nama file ini sesuai file export QGIS kamu!
fetch('peta-bencana-semarang.geojson')
    .then(response => response.json())
    .then(data => {
        
        // 1. Render Peta
        geoJsonLayer = L.geoJson(data, {
            style: style, // Panggil fungsi style di atas
            onEachFeature: onEachFeature // Panggil fungsi interaksi (popup/hover)
        }).addTo(map);

        // 2. Isi Dropdown (Biar gak kosong)
        populateDropdown(data);
        
        console.log("Data loaded successfully! 🚀");
    })
    .catch(error => {
        console.error('Gagal load GeoJSON:', error);
        alert("Gagal memuat data peta. Cek Console log (F12) untuk detail.");
    });

var activeDataKey = 'Total'; // Default view

// --- FUNGSI PEWARNAAN ---
function getColor(d) {
    // Fungsi ini mereplikasi Graduated Symbology QGIS Anda (Natural Breaks)
    // Nilai batas (breaks) ini harus kamu ambil dari setting QGIS kamu!
    // Contoh di bawah menggunakan nilai batas perkiraan untuk kolom 'Total':
    return d > 8 ? '#800026' : // Sangat Tinggi (Total > 8)
           d > 5 ? '#BD0026' : // Tinggi
           d > 3 ? '#E31A1C' : // Sedang
           d > 1 ? '#FEB24C' : // Rendah
                   '#FFEDA0'; // Sangat Rendah (atau 0)
}

function style(feature) {
    // Membaca nilai dari kolom yang sedang aktif (Total, Banjir, Longsor, dll.)
    var value = feature.properties[activeDataKey];
    return {
        fillColor: getColor(value),
        weight: 1.5,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}

// --- FUNGSI MEMUAT DATA ---
fetch('peta-bencana-semarang.geojson')
    .then(response => response.json())
    .then(data => {
        geoJsonLayer = L.geoJson(data, {
            style: style,
            onEachFeature: onEachFeature // Untuk popups dan zoom
        }).addTo(map);

        // Setelah data dimuat, kita isi dropdown dan atur pop-up
        populateDropdown(data);
    });

/* --- INTERAKSI (Popup & Hover) --- */
function onEachFeature(feature, layer) {
    var props = feature.properties;

    // Konten Popup: Tampilkan data lengkap saat diklik
    var popupContent = `
        <div style="font-family: 'Red Hat Display', sans-serif; min-width: 200px;">
            <h4 style="margin: 0; color: #333;">${props.WADMKC}</h4>
            <small style="color: #666;">Kecamatan di Kota Semarang</small>
            <hr style="margin: 8px 0; border: 0; border-top: 1px solid #ddd;">
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Total Bencana:</span>
                <b>${props.Total || 0} kejadian</b>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Dominan:</span>
                <span style="color: ${getDominantColor(props.Dominan)}; font-weight: bold;">
                    ${props.Dominan || '-'}
                </span>
            </div>
            
            <div style="background: #f8f9fa; padding: 5px; border-radius: 4px; margin-top: 8px; font-size: 0.9em;">
                🌊 Banjir: <b>${props.Banjir || 0}</b> <br>
                ⛰️ Longsor: <b>${props.Longsor || 0}</b>
            </div>
        </div>
    `;
    
    layer.bindPopup(popupContent);

    // Efek Hover: Highlight wilayah saat mouse lewat
    layer.on({
        mouseover: function(e) {
            var layer = e.target;
            layer.setStyle({
                weight: 3,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.9
            });
            layer.bringToFront();
        },
        mouseout: function(e) {
            geoJsonLayer.resetStyle(e.target);
        },
        click: function(e) {
            map.fitBounds(e.target.getBounds()); // Zoom otomatis saat klik
        }
    });
}

function changeDataView(newKey) {
    activeDataKey = newKey;
    // Update style map based on the new activeKey
    geoJsonLayer.setStyle(style); 
    // Anda mungkin perlu menyesuaikan fungsi style() atau getColor() di sini 
    // jika nilai batas (breaks) Banjir dan Total Anda berbeda.
}

function populateDropdown(data) {
    var selector = document.getElementById('district-selector');
    var features = data.features.map(f => f.properties.WADMKC).sort();

    features.forEach(name => {
        var option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        selector.appendChild(option);
    });
}

function zoomToDistrict(districtName) {
    if (!districtName) return;

    // Iterasi layer untuk mencari fitur yang namanya cocok
    geoJsonLayer.eachLayer(function(layer) {
        if (layer.feature.properties.WADMKC === districtName) {
            map.fitBounds(layer.getBounds());
        }
    });
}

/* --- FUNGSI BARU UNTUK UI --- */

// Fungsi Tombol Zoom Kustom
function customZoomIn() {
    map.zoomIn();
}

function customZoomOut() {
    map.zoomOut();
}

// Update fungsi changeDataView untuk mengatur styling tombol Aktif
function changeDataView(newKey, btnElement) {
    activeDataKey = newKey;
    geoJsonLayer.setStyle(style);
    
    // Update UI Tombol
    // 1. Hapus class 'active' dari semua tombol
    document.querySelectorAll('.data-group .material-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 2. Tambahkan class 'active' ke tombol yang diklik
    if (btnElement) {
        btnElement.classList.add('active');
    }
}

// Fungsi untuk mengembalikan pandangan ke posisi awal (Semarang)
function resetView() {
    // Koordinat pusat Semarang dan Zoom level awal (12)
    map.setView([-7.03, 110.38], 11);
    
    // Opsional: Kembalikan dropdown ke posisi default
    document.getElementById('district-selector').value = "";
}

/* --- 1. INISIALISASI PETA --- */
// zoomControl: false -> Mematikan tombol zoom bawaan Leaflet (karena kita punya tombol sendiri)
var map = L.map('map', {
    zoomControl: false 
}).setView([-6.99, 110.42], 12); // Koordinat Pusat Semarang

// Tambahkan Peta Dasar (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);


/* --- 2. SETUP DATA & VARIABLE GLOBAL --- */
var geoJsonLayer;
var activeDataKey = 'Total'; // Default data yang ditampilkan pertama kali


/* --- LOGIKA PEWARNAAN (Based on your Data Range 0-10) --- */

// 1. Warna untuk Angka (Graduated Color)
function getColor(d) {
    // Data kamu max 10 (Genuk). Kita buat interval biar warnanya variatif.
    return d >= 9 ? '#800026' : // Merah Gelap (Genuk, Tembalang)
           d >= 7 ? '#BD0026' : // Merah (Semarang Timur, Tugu)
           d >= 4 ? '#E31A1C' : // Oranye Tua (Gayamsari, Pedurungan)
           d >= 1 ? '#FEB24C' : // Oranye Muda (Kecamatan ringan)
                    '#FFEDA0';  // Kuning Pucat (0 kejadian / Aman)
}

// 2. Warna untuk Kategori (Peta Dominan)
function getDominantColor(jenis) {
    // Pastikan string ini SAMA PERSIS dengan isi kolom 'Dominan' di CSV kamu
    return jenis === 'Banjir'   ? '#0d6efd' : // Biru (Bootstrap Primary)
           jenis === 'Longsor'  ? '#8B4513' : // Cokelat SaddleBrown
           jenis === 'Gempa'    ? '#dc3545' : // Merah
           jenis === 'Aman'     ? '#198754' : // Hijau (Bootstrap Success)
                                  '#6c757d';  // Abu-abu (Lainnya)
}

// Fungsi Utama Styling
/* --- FUNGSI STYLING UTAMA --- */
function style(feature) {
    // Ambil nilai dari kolom yang sedang aktif (Total, Banjir, atau Longsor)
    var value = feature.properties[activeDataKey];
    
    // Tentukan warna: Pakai resep Angka atau resep Kategori?
    var finalColor;
    if (activeDataKey === 'Dominan') {
        finalColor = getDominantColor(value); // Pakai resep Kategori
    } else {
        // Asumsi data angka, tapi hati-hati kalau nilainya null/undefined
        finalColor = getColor(value || 0); // Pakai resep Angka
    }

    return {
        fillColor: finalColor,
        weight: 1,          // Garis antar kecamatan tipis aja
        opacity: 1,
        color: 'white',     // Warna garis putih
        dashArray: '3',     // Garis putus-putus dikit biar fancy
        fillOpacity: 0.7    // Transparan dikit biar basemap kelihatan
    };
}


/* --- 4. INTERAKSI (POPUP & HOVER) --- */
function onEachFeature(feature, layer) {
    var props = feature.properties;

    // Konten Popup HTML
    var popupContent = `
        <div style="font-family: 'Red Hat Display', sans-serif;">
            <h3 style="margin: 0 0 5px 0;">${props.WADMKC}</h3>
            <hr style="border: 0; border-top: 1px solid #ccc; margin-bottom: 5px;">
            <b>Total Bencana:</b> ${props.Total}<br>
            <b>Bencana Dominan:</b> ${props.Dominan}<br>
            <br>
            <small><i>Rincian: Banjir (${props.Banjir}), Longsor (${props.Longsor})</i></small>
        </div>
    `;
    layer.bindPopup(popupContent);

    // Efek Hover (Highlight saat mouse di atas wilayah)
    layer.on({
        mouseover: function(e) {
            var layer = e.target;
            layer.setStyle({
                weight: 3,
                color: '#666',
                fillOpacity: 0.9
            });
            layer.bringToFront(); // Angkat wilayah ke paling atas
        },
        mouseout: function(e) {
            geoJsonLayer.resetStyle(e.target); // Kembalikan style normal
        },
        click: function(e) {
            map.fitBounds(e.target.getBounds()); // Zoom ke wilayah saat diklik
        }
    });
}


/* --- 5. MEMUAT DATA GEOJSON --- */
// Pastikan nama file ini sesuai dengan file GeoJSON kamu di folder yang sama
fetch('Semarang_Bencana_FINAL.geojson')
    .then(response => response.json())
    .then(data => {
        // Masukkan data ke peta
        geoJsonLayer = L.geoJson(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);

        // Isi Dropdown Pilihan Kecamatan
        populateDropdown(data);
    })
    .catch(error => console.error('Error loading GeoJSON:', error));


/* --- 6. FUNGSI KONTROL BAR (THE REAL WORK) --- */

// A. Tombol Zoom Kustom
function customZoomIn() { map.zoomIn(); }
function customZoomOut() { map.zoomOut(); }

// B. Tombol Reset View (Target)
function resetView() {
    map.setView([-7.03, 110.38], 11); // Kembali ke koordinat awal
    document.getElementById('district-selector').value = ""; // Reset dropdown
    map.closePopup();
}

// C. Tombol Ganti Data (Total, Banjir, Longsor)
function changeDataView(key, btnElement) {
    activeDataKey = key; // Ubah kunci data (misal dari 'Total' ke 'Banjir')
    
    // Render ulang warna peta
    geoJsonLayer.setStyle(style);

    // Update tampilan tombol Aktif (Biru)
    // 1. Matikan semua tombol
    document.querySelectorAll('.data-group .material-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    // 2. Nyalakan tombol yang diklik
    if (btnElement) {
        btnElement.classList.add('active');
        legend.update();
    }
}

// D. Dropdown & Zoom Logic
function populateDropdown(data) {
    var selector = document.getElementById('district-selector');
    
    // Ambil daftar nama kecamatan dan urutkan A-Z
    var districtList = data.features.map(f => f.properties.WADMKC).sort();

    districtList.forEach(name => {
        var option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        selector.appendChild(option);
    });
}

function zoomToDistrict(name) {
    if (!name) return;

    // Cari layer yang namanya cocok dengan pilihan dropdown
    geoJsonLayer.eachLayer(function(layer) {
        if (layer.feature.properties.WADMKC === name) {
            map.fitBounds(layer.getBounds()); // Zoom ke batas wilayah
            layer.openPopup(); // Buka popup otomatis
        }
    });
}

/* --- LEGENDA DINAMIS --- */

/* --- LEGENDA DINAMIS (VERSI STABIL) --- */

var legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
    // Buat elemen div untuk legenda
    this._div = L.DomUtil.create('div', 'info legend');
    this.update(); // Render isi legenda
    return this._div;
};

legend.update = function () {
    // Jika div belum siap, berhenti dulu
    if (!this._div) return;

    var contents = ''; // Kita tampung HTML di sini dulu
    
    // JUDUL LEGENDA
    var title = activeDataKey === 'Dominan' ? 'Jenis Bencana' : 'Tingkat Bahaya';
    contents += `<h4 style="margin:0 0 8px; font-size:14px; text-transform:uppercase; border-bottom:1px solid #ccc; padding-bottom:5px;">${title}</h4>`;

    // A. MODE DOMINAN (KATEGORI)
    if (activeDataKey === 'Dominan') {
        var categories = ['Banjir', 'Longsor', 'Gempa', 'Aman'];
        categories.forEach(function(jenis) {
            // Kotak warna + Label
            contents += 
                `<div style="display:flex; align-items:center; margin-bottom:4px;">
                    <i style="background:${getDominantColor(jenis)}; width:18px; height:18px; display:inline-block; margin-right:8px; border-radius:3px;"></i>
                    <span>${jenis}</span>
                </div>`;
        });
    } 
    
    // B. MODE ANGKA (GRADASI MERAH)
    else {
        // Angka batas sesuai fungsi getColor kamu
        var grades = [0, 1, 4, 7, 9];
        var labels = ['Aman', 'Rendah', 'Sedang', 'Tinggi', 'Bahaya'];

        for (var i = 0; i < grades.length; i++) {
            contents +=
                `<div style="display:flex; align-items:center; margin-bottom:4px;">
                    <i style="background:${getColor(grades[i] + 0.1)}; width:18px; height:18px; display:inline-block; margin-right:8px; border-radius:3px;"></i>
                    <span>${grades[i]}${grades[i + 1] ? '&ndash;' + grades[i + 1] : '+'} <small style="color:#666; margin-left:5px;">(${labels[i]})</small></span>
                </div>`;
        }
    }

    // Masukkan semua HTML ke dalam div legenda
    this._div.innerHTML = contents;
};

// Pasang ke peta
legend.addTo(map);
