/* --- GLOBAL THEME MANAGER --- */
const toggleBtn = document.getElementById('nav-theme-btn');
const themeIcon = document.getElementById('theme-icon');

// Fungsi simple: Ganti Teks Icon
function updateIcon() {
    const isDark = document.body.classList.contains('dark-mode');
    
    // Jika Dark Mode aktif, tampilkan ikon Matahari ('light_mode') untuk switch ke terang
    // Jika Light Mode aktif, tampilkan ikon Bulan ('dark_mode') untuk switch ke gelap
    themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
}

// 1. Cek Preferensi Tersimpan saat Load
const currentTheme = localStorage.getItem('theme');
if (currentTheme) {
    document.body.classList.add(currentTheme);
}
// Pastikan ikon sesuai saat halaman pertama kali dibuka
if (themeIcon) {
    updateIcon();
}

// 2. Event Listener Tombol
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        // Simpan preferensi
        let theme = 'light';
        if (document.body.classList.contains('dark-mode')) {
            theme = 'dark-mode';
        }
        localStorage.setItem('theme', theme);
        
        // Ganti Icon
        updateIcon();
    });
}

// 3. Auto-Active Link (Highlight Menu)
document.addEventListener('DOMContentLoaded', () => {
    const currentLocation = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        if(currentLocation.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        }
        // Fix untuk Home page ("/")
        if ((currentLocation === '/' || currentLocation.endsWith('/')) && link.getAttribute('href') === 'index.html') {
             link.classList.add('active');
        }
    });
});