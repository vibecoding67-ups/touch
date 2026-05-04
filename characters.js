/**
 * characters.js
 * 
 * Tambah karakter baru cukup dengan menambah object ke array CHARACTERS.
 * 
 * Format:
 * {
 *   id: 'unique_id',          // string unik
 *   name: 'Nama Karakter',    // nama yang tampil
 *   type: 'emoji',            // 'emoji' | 'image'
 *   src: '🐾',               // emoji string ATAU path ke file gambar (jika type: 'image')
 *   size: 64,                 // ukuran dalam px (opsional, default 64)
 *   unlocked: true,           // true = langsung bisa dipilih
 *   description: '...',       // deskripsi singkat
 * }
 */

const CHARACTERS = [
  {
    id: 'capybara',
    name: 'Capybara',
    type: 'emoji',
    src: '🦫',
    size: 64,
    unlocked: true,
    description: 'Si santai yang selalu tenang',
  },
  {
    id: 'cat',
    name: 'Kucing',
    type: 'emoji',
    src: '🐱',
    size: 64,
    unlocked: true,
    description: 'Misterius dan menggemaskan',
  },
  {
    id: 'bunny',
    name: 'Kelinci',
    type: 'emoji',
    src: '🐰',
    size: 64,
    unlocked: true,
    description: 'Lompat sana lompat sini',
  },
  {
    id: 'hamster',
    name: 'Hamster',
    type: 'emoji',
    src: '🐹',
    size: 64,
    unlocked: true,
    description: 'Pipi tembem penuh biji',
  },
  {
    id: 'penguin',
    name: 'Penguin',
    type: 'emoji',
    src: '🐧',
    size: 64,
    unlocked: true,
    description: 'Waddle waddle!',
  },
  {
    id: 'frog',
    name: 'Katak',
    type: 'emoji',
    src: '🐸',
    size: 64,
    unlocked: true,
    description: 'Ribbit ribbit~',
  },

  // ── Contoh karakter dengan gambar ──────────────────────────────────────────
  // Uncomment dan ganti path setelah kamu punya file gambarnya:
  //
  // {
  //   id: 'custom_dog',
  //   name: 'Anjing Lucu',
  //   type: 'image',
  //   src: 'assets/dog.png',   // taruh gambar di folder assets/
  //   size: 72,
  //   unlocked: true,
  //   description: 'Anjing peliharaanku!',
  // },
];
