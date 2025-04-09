import { DataSource } from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { DiscussionSpace, SpaceType } from '../../../modules/discussion/entities/discussion-space.entity';
import { Discussion } from '../../../modules/discussion/entities/discussion.entity';
import { User } from '../../../modules/user/entities/user.entity';

export async function seedDiscussions(dataSource: DataSource): Promise<void> {
  console.log('🌱 Seeding discussions...');

  const discussionRepository = dataSource.getRepository(Discussion);
  const userRepository = dataSource.getRepository(User);
  const spaceRepository = dataSource.getRepository(DiscussionSpace);

  // Check if discussions already exist
  const discussionCount = await discussionRepository.count();
  if (discussionCount > 0) {
    console.log(`💬 ${discussionCount} discussions already exist, skipping seeding`);
    return;
  }

  // Get non-admin, non-external users
  const eligibleUsers = await userRepository.find({
    where: {
      role: UserRole.STUDENT,
      isExternalUser: false,
    },
  });

  if (eligibleUsers.length === 0) {
    console.error('❌ No eligible users found for creating discussions');
    return;
  }

  // Get all spaces
  const spaces = await spaceRepository.find();
  if (spaces.length === 0) {
    console.error('❌ No spaces found for creating discussions');
    return;
  }

  // Generate random date between now and a week ago
  const getRandomDate = (): Date => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return new Date(oneWeekAgo.getTime() + Math.random() * (now.getTime() - oneWeekAgo.getTime()));
  };

  const getRandomTags = (allTags: string[]): string[] => {
    // Randomly decide how many tags to use (0-5)
    const tagCount = Math.floor(Math.random() * 6); // 0-5
    
    if (tagCount === 0) return [];
    if (tagCount >= allTags.length) return allTags;
    
    // Randomly select tags without duplicates
    const shuffled = [...allTags].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, tagCount);
  };

  // Sample content templates by space type (in Bahasa Indonesia)
  const contentTemplates: Record<SpaceType, Array<{ content: string; tags: string[] }>> = {
    [SpaceType.CAMPUS]: [
      {
        content: 'Ada yang memperhatikan renovasi baru di gedung utama? Bagaimana pendapat kalian tentang itu?',
        tags: ['kampus', 'fasilitas', 'renovasi', 'gedung', 'pembangunan'],
      },
      {
        content: 'Mencari teman belajar untuk ujian tengah semester! Siapa yang berminat?',
        tags: ['belajar', 'uts', 'kelompok', 'ujian', 'studi'],
      },
      {
        content: 'Makanan di kantin sudah lebih baik semester ini! Terutama pilihan vegetarian barunya.',
        tags: ['makanan', 'kantin', 'kampus', 'vegetarian', 'kuliner'],
      },
      {
        content: 'Apakah ada acara kampus yang menarik untuk dihadiri bulan ini?',
        tags: ['acara', 'kampus', 'kegiatan', 'event', 'hiburan'],
      },
      {
        content: 'WiFi di perpustakaan sangat lambat akhir-akhir ini. Apakah ada yang mengalami hal yang sama?',
        tags: ['wifi', 'perpustakaan', 'masalah', 'internet', 'jaringan'],
      },
      {
        content: 'Bagaimana pendapat kalian tentang sistem parkir baru di kampus? Apa sudah lebih efisien?',
        tags: ['parkir', 'fasilitas', 'kampus', 'kendaraan', 'efisiensi'],
      },
      {
        content: 'Ada yang tahu jadwal shuttle bus kampus untuk semester ini? Informasinya tidak ada di website.',
        tags: ['shuttle', 'transportasi', 'jadwal', 'bus', 'kampus'],
      },
      {
        content: 'Perpustakaan memperpanjang jam buka selama periode ujian. Ini sangat membantu!',
        tags: ['perpustakaan', 'ujian', 'fasilitas', 'studi', 'jam operasional'],
      },
      {
        content: 'Ada yang mau bergabung untuk membentuk komunitas peduli lingkungan kampus?',
        tags: ['lingkungan', 'komunitas', 'kampus', 'organisasi', 'kegiatan'],
      },
      {
        content: 'Lift di gedung C sering rusak. Kapan akan diperbaiki secara permanen?',
        tags: ['gedung', 'fasilitas', 'perbaikan', 'lift', 'infrastruktur'],
      },
    ],
    [SpaceType.ACADEMIC]: [
      {
        content: 'Bisakah seseorang merekomendasikan sumber yang bagus untuk belajar metodologi penelitian?',
        tags: ['penelitian', 'metodologi', 'sumber', 'referensi', 'akademik'],
      },
      {
        content: 'Saya mencari rekomendasi jurnal untuk mempublikasikan penelitian sarjana. Ada saran?',
        tags: ['jurnal', 'publikasi', 'penelitian', 'akademik', 'karya ilmiah'],
      },
      {
        content: 'Apakah ada yang pernah mengambil kelas Struktur Data dari Pak Ahmad? Bagaimana pengalamannya?',
        tags: ['mata kuliah', 'dosen', 'ulasan', 'struktur data', 'pengalaman'],
      },
      {
        content: 'Apa topik yang bagus untuk makalah dalam psikologi perkembangan?',
        tags: ['psikologi', 'makalah', 'topik', 'perkembangan', 'ide'],
      },
      {
        content: 'Ada tips untuk persiapan ujian komprehensif?',
        tags: ['ujian', 'belajar', 'persiapan', 'tips', 'komprehensif'],
      },
      {
        content: 'Bagaimana cara efektif menulis tinjauan literatur untuk skripsi?',
        tags: ['skripsi', 'literatur', 'penelitian', 'akademik', 'menulis'],
      },
      {
        content: 'Ada yang bisa merekomendasikan aplikasi untuk membantu membuat kutipan dan daftar pustaka?',
        tags: ['aplikasi', 'referensi', 'skripsi', 'kutipan', 'pustaka'],
      },
      {
        content: 'Teknik presentasi apa yang paling efektif untuk seminar akademik?',
        tags: ['presentasi', 'seminar', 'keterampilan', 'akademik', 'publik speaking'],
      },
      {
        content: 'Bagaimana cara mendapatkan umpan balik yang konstruktif dari pembimbing skripsi?',
        tags: ['skripsi', 'pembimbing', 'umpan balik', 'komunikasi', 'akademik'],
      },
      {
        content: 'Strategi apa yang efektif untuk membaca dan memahami paper ilmiah yang kompleks?',
        tags: ['paper', 'penelitian', 'strategi', 'pemahaman', 'literatur'],
      },
    ],
    [SpaceType.FACULTY]: [
      {
        content: 'Mata kuliah pilihan apa di fakultas kita yang kalian rekomendasikan untuk semester depan?',
        tags: ['mata kuliah', 'pilihan', 'rekomendasi', 'semester', 'fakultas'],
      },
      {
        content: 'Apakah ada yang tertarik membentuk kelompok belajar untuk kelas Teori Lanjutan Pak Budi?',
        tags: ['kelompok belajar', 'kelas', 'kolaborasi', 'teori lanjutan', 'studi'],
      },
      {
        content: 'Website fakultas belum diperbarui dengan penawaran mata kuliah baru. Ada yang punya informasi?',
        tags: ['mata kuliah', 'informasi', 'website', 'fakultas', 'pembaruan'],
      },
      {
        content: 'Apakah fakultas sudah mengumumkan tanggal untuk rangkaian seminar departemen?',
        tags: ['seminar', 'acara', 'departemen', 'jadwal', 'fakultas'],
      },
      {
        content: 'Mencari umpan balik tentang perubahan kurikulum baru yang diterapkan tahun ini.',
        tags: ['kurikulum', 'umpan balik', 'perubahan', 'pendidikan', 'evaluasi'],
      },
      {
        content: 'Bagaimana pengalaman magang di perusahaan yang bekerjasama dengan fakultas kita?',
        tags: ['magang', 'kerjasama', 'pengalaman', 'perusahaan', 'profesional'],
      },
      {
        content: 'Persiapan apa yang perlu dilakukan untuk sidang skripsi di fakultas kita?',
        tags: ['sidang', 'skripsi', 'persiapan', 'presentasi', 'tugas akhir'],
      },
      {
        content: 'Apakah ada rencana untuk mengadakan temu alumni fakultas tahun ini?',
        tags: ['alumni', 'acara', 'jaringan', 'fakultas', 'networking'],
      },
      {
        content: 'Apa pendapat kalian tentang penerapan kurikulum berbasis MBKM di fakultas kita?',
        tags: ['mbkm', 'kurikulum', 'pendapat', 'merdeka belajar', 'pendidikan'],
      },
      {
        content: 'Siapa dosen pembimbing yang paling responsif dan membantu di fakultas kita?',
        tags: ['dosen', 'pembimbing', 'saran', 'akademik', 'rekomendasi'],
      },
    ],
    [SpaceType.STUDY_PROGRAM]: [
      {
        content: 'Ada senior yang bersedia berbagi pengalaman tentang persyaratan proyek akhir?',
        tags: ['proyek akhir', 'pengalaman', 'tips', 'senior', 'persyaratan'],
      },
      {
        content: 'Apakah ada yang telah menyelesaikan magang di Tech Corp? Bagaimana pengalamanmu?',
        tags: ['magang', 'pengalaman', 'karir', 'perusahaan', 'praktik'],
      },
      {
        content: 'Apakah ada beasiswa khusus program studi yang perlu kita ketahui?',
        tags: ['beasiswa', 'pendanaan', 'kesempatan', 'finansial', 'program studi'],
      },
      {
        content: 'Jalur spesialisasi apa yang kalian rekomendasikan untuk seseorang yang tertarik dengan AI?',
        tags: ['spesialisasi', 'karir', 'saran', 'AI', 'teknologi'],
      },
      {
        content: 'Apakah ada yang memiliki silabus untuk mata kuliah wajib semester depan?',
        tags: ['silabus', 'mata kuliah', 'perencanaan', 'wajib', 'akademik'],
      },
      {
        content: 'Bagaimana cara menyeimbangkan tugas kuliah dengan kegiatan organisasi di program studi kita?',
        tags: ['manajemen waktu', 'organisasi', 'kuliah', 'keseimbangan', 'produktivitas'],
      },
      {
        content: 'Ada rekomendasi topik skripsi yang relevan dengan kebutuhan industri saat ini?',
        tags: ['skripsi', 'industri', 'topik', 'relevansi', 'penelitian'],
      },
      {
        content: 'Apakah program studi kita menyediakan pelatihan sertifikasi tambahan? Mana yang paling bermanfaat?',
        tags: ['sertifikasi', 'pelatihan', 'pengembangan', 'keahlian', 'profesional'],
      },
      {
        content: 'Peluang penelitian apa yang tersedia untuk mahasiswa S1 di program studi kita?',
        tags: ['penelitian', 'sarjana', 'kesempatan', 'akademik', 'S1'],
      },
      {
        content: 'Bagaimana prospek kerja untuk lulusan program studi kita dalam 5 tahun ke depan?',
        tags: ['karir', 'lulusan', 'prospek', 'masa depan', 'lapangan kerja'],
      },
    ],
    [SpaceType.ORGANIZATION]: [
      {
        content: 'Organisasi kita mengadakan workshop Jumat depan! Siapa yang berencana untuk hadir?',
        tags: ['workshop', 'acara', 'organisasi', 'partisipasi', 'kegiatan'],
      },
      {
        content: 'Mencari relawan untuk program pengabdian masyarakat akhir pekan ini.',
        tags: ['relawan', 'masyarakat', 'pengabdian', 'sosial', 'kegiatan'],
      },
      {
        content: 'Kegiatan apa yang harus kita rencanakan untuk pameran organisasi semester ini?',
        tags: ['pameran', 'perencanaan', 'kegiatan', 'organisasi', 'promosi'],
      },
      {
        content: 'Umpan balik diperlukan untuk rapat organisasi terakhir - apa yang bisa kita tingkatkan?',
        tags: ['umpan balik', 'rapat', 'peningkatan', 'evaluasi', 'organisasi'],
      },
      {
        content: 'Pemilihan untuk posisi pengurus baru akan diadakan bulan depan - pertimbangkan untuk mencalonkan diri!',
        tags: ['pemilihan', 'kepemimpinan', 'posisi', 'organisasi', 'pengurus'],
      },
      {
        content: 'Ide apa yang kalian punya untuk penggalangan dana organisasi semester ini?',
        tags: ['dana', 'penggalangan', 'ide', 'fundraising', 'inovasi'],
      },
      {
        content: 'Bagaimana pendapat kalian tentang kolaborasi dengan organisasi lain untuk acara besar?',
        tags: ['kolaborasi', 'acara', 'organisasi', 'kerjasama', 'networking'],
      },
      {
        content: 'Apakah kita perlu memperbarui AD/ART organisasi tahun ini?',
        tags: ['ad/art', 'peraturan', 'organisasi', 'konstitusi', 'pembaruan'],
      },
      {
        content: 'Strategi apa yang efektif untuk merekrut anggota baru di organisasi kita?',
        tags: ['rekrutmen', 'anggota', 'strategi', 'organisasi', 'promosi'],
      },
      {
        content: 'Bagaimana cara meningkatkan komunikasi antara pengurus dan anggota organisasi?',
        tags: ['komunikasi', 'manajemen', 'organisasi', 'pengurus', 'anggota'],
      },
    ],
    [SpaceType.OTHER]: [
      {
        content: 'Ada yang menjual buku bekas untuk Pengantar Filsafat?',
        tags: ['buku', 'jual', 'filsafat', 'bekas', 'kuliah'],
      },
      {
        content: 'Apa pilihan akomodasi terjangkau terbaik di dekat kampus?',
        tags: ['akomodasi', 'kost', 'saran', 'terjangkau', 'tempat tinggal'],
      },
      {
        content: 'Mencari rekomendasi tempat belajar yang nyaman di sekitar kampus.',
        tags: ['tempat belajar', 'rekomendasi', 'luar kampus', 'nyaman', 'studi'],
      },
      {
        content: 'Apakah ada yang pernah naik layanan shuttle baru ke kampus pusat? Seberapa andal?',
        tags: ['transportasi', 'shuttle', 'perjalanan', 'kampus pusat', 'mobilitas'],
      },
      {
        content: 'Kafe terbaik untuk belajar di dekat kampus? Saya butuh Wi-Fi dan stopkontak!',
        tags: ['kafe', 'belajar', 'luar kampus', 'wifi', 'stopkontak'],
      },
      {
        content: 'Rekomendasi aplikasi untuk meningkatkan produktivitas dan manajemen waktu?',
        tags: ['aplikasi', 'produktivitas', 'waktu', 'teknologi', 'efisiensi'],
      },
      {
        content: 'Tempat fotokopi terdekat dengan harga terjangkau untuk mencetak materi kuliah?',
        tags: ['fotokopi', 'cetak', 'materi', 'terjangkau', 'lokasi'],
      },
      {
        content: 'Ada rekomendasi psikolog atau konselor yang bisa membantu mengatasi stres kuliah?',
        tags: ['kesehatan mental', 'konseling', 'stres', 'psikolog', 'bantuan'],
      },
      {
        content: 'Kegiatan ekstrakurikuler apa yang paling membantu pengembangan soft skill?',
        tags: ['ekstrakurikuler', 'soft skill', 'pengembangan', 'kegiatan', 'keterampilan'],
      },
      {
        content: 'Tips bertahan hidup dengan budget mahasiswa di Jakarta? Terutama untuk makanan!',
        tags: ['budget', 'mahasiswa', 'tips', 'jakarta', 'makanan'],
      },
    ],
  };

  // Create 50 discussions
  const discussions: Partial<Discussion>[] = [];
  for (let i = 0; i < 50; i++) {
    // Randomly select a user, space, and whether it's anonymous
    const user = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];
    const space = spaces[Math.floor(Math.random() * spaces.length)];
    const isAnonymous = Math.random() > 0.8; // 20% chance of being anonymous

    // Select content template based on space type
    const templates = contentTemplates[space.spaceType] || contentTemplates[SpaceType.OTHER];
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Create discussion with random number of tags (0-5)
    discussions.push({
      content: template.content,
      tags: getRandomTags(template.tags),
      isAnonymous,
      authorId: user.id,
      spaceId: space.id,
      createdAt: getRandomDate(),
      updatedAt: getRandomDate(),
    });
  }

  // Save discussions
  const savedDiscussions = await discussionRepository.save(discussions);
  console.log(`💬 Created ${savedDiscussions.length} discussions`);
}
