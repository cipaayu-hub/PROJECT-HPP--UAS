//Entitas untuk menyimpan rincian setiap bahan baku atau komponen produk
export interface KomponenBahan {
  namaBahan: string;
  hargaPembelian: number;
  jumlahPembelian: number;
  satuanPembelian: string; // Contoh: 'kg', 'g', 'l', 'ml', 'pcs'
  jumlahPemakaian: number;
  satuanPemakaian: string;
  biayaTerpakai: number;
  sisaBahan: number;
}

// Entitas utama untuk menyimpan informasi produk beserta hasil perhitungan HPP
export interface ProdukHPP {
  id: string;
  namaProduk: string;
  jumlahProduksi: number;
  satuanHasil: string; // Contoh: 'porsi', 'bungkus', 'botol'
  daftarBahan: KomponenBahan[];
  metodeBiayaTakTerduga: string; // 'nominal' | 'persentase' | 'tanpa'
  nilaiBiayaTakTerduga: number;
  persentaseKeuntungan: number; // 20, 30, atau 50
  totalBiayaProduksi: number;
  hppPerProduk: number;
  hargaJual: number;
  aktif: boolean;
}

// ============================================================================
// BAGIAN 2: FUNGSI LOGIKA PERHITUNGAN HPP (MATERI UTS)
// Kontributor: Hafizha Zahwa Putri (@hafizhazahwa)
// ============================================================================

/**
 * 1. Mengonversi satuan berat (kg -> g) dan volume (l -> ml) ke satuan dasar.
 * Menerapkan: Seleksi Kondisi (if majemuk), Operator Logika (||), Operator Aritmatika (*).
 */
export function konversiKeSatuanDasar(jumlah: number, satuan: string): number {
  const satuanKecil: string = satuan.toLowerCase().trim();
  let hasilKonversi: number = jumlah;

  // Jika satuan kg atau l, kalikan 1000 agar menjadi gram atau mililiter
  if (satuanKecil === "kg" || satuanKecil === "l") {
    hasilKonversi = jumlah * 1000;
  }

  return hasilKonversi;
}

/**
 * 2. Mengecek apakah satuan pembelian dan satuan pemakaian berada dalam kelompok yang sama.
 * Menerapkan: Tipe data boolean, Operator Logika (&&, ||, !), Operator Perbandingan (===).
 */
export function cekKesesuaianSatuan(satuanBeli: string, satuanPakai: string): boolean {
  const beli: string = satuanBeli.toLowerCase().trim();
  const pakai: string = satuanPakai.toLowerCase().trim();

  const kelompokBerat: boolean = (beli === "kg" || beli === "g") && (pakai === "kg" || pakai === "g");
  const kelompokVolume: boolean = (beli === "l" || beli === "ml") && (pakai === "l" || pakai === "ml");
  const kelompokUnit: boolean = beli === "pcs" && pakai === "pcs";

  // Mengembalikan true hanya jika kedua satuan berada di kelompok yang sama
  return kelompokBerat || kelompokVolume || kelompokUnit;
}

/**
 * 3. Menghitung biaya bahan yang benar-benar terpakai dalam satu batch produksi.
 * Menerapkan: Operator Perbandingan (<=), Operator Aritmatika (/, *).
 */
export function hitungBiayaTerpakai(
  hargaBeli: number,
  jumlahBeliDasar: number,
  jumlahPakaiDasar: number
): number {
  // Mencegah pembagian dengan nol atau input tidak valid
  if (jumlahBeliDasar <= 0 || hargaBeli < 0) {
    return 0;
  }

  const biaya: number = (jumlahPakaiDasar / jumlahBeliDasar) * hargaBeli;
  return biaya;
}

/**
 * 4. Menghitung sisa bahan setelah dipakai produksi (dalam satuan dasar).
 * Menerapkan: Compound Assignment (-=), Operator Perbandingan (<).
 */
export function hitungSisaBahan(jumlahBeliDasar: number, jumlahPakaiDasar: number): number {
  let sisa: number = jumlahBeliDasar;
  sisa -= jumlahPakaiDasar; // Penggunaan operator compound assignment

  if (sisa < 0) {
    return 0;
  }

  return sisa;
}

/**
 * 5. Menghitung biaya tak terduga berdasarkan metode yang dipilih pengguna.
 * Menerapkan: Seleksi Kondisi (switch dengan 3 case + default), Operator Aritmatika (*, /).
 */
export function hitungBiayaTakTerduga(
  totalBiayaBahan: number,
  metode: string,
  nilai: number
): number {
  let biayaTambahan: number = 0;

  switch (metode.toLowerCase().trim()) {
    case "nominal":
      biayaTambahan = nilai > 0 ? nilai : 0;
      break;
    case "persentase":
      biayaTambahan = nilai > 0 ? totalBiayaBahan * (nilai / 100) : 0;
      break;
    case "tanpa":
      biayaTambahan = 0;
      break;
    default:
      biayaTambahan = 0;
      break;
  }

  return biayaTambahan;
}

/**
 * 6. Menghitung total biaya produksi, HPP per unit, serta harga jual (dibulatkan ke atas kelipatan Rp500).
 * Menerapkan: Compound Assignment (+=), Operator Modulus (%), Operator Aritmatika (+, /, *).
 */
export function hitungRingkasanHPP(
  daftarBahan: KomponenBahan[],
  metodeTakTerduga: string,
  nilaiTakTerduga: number,
  jumlahProduksi: number,
  persentaseKeuntungan: number
): { totalBiayaProduksi: number; hppPerProduk: number; hargaJual: number } {
  let totalBiayaBahan: number = 0;

  // Menjumlahkan seluruh biaya terpakai dari tiap komponen bahan
  for (let i: number = 0; i < daftarBahan.length; i++) {
    totalBiayaBahan += daftarBahan[i]?.biayaTerpakai ?? 0;
  }

  const biayaTakTerduga: number = hitungBiayaTakTerduga(
    totalBiayaBahan,
    metodeTakTerduga,
    nilaiTakTerduga
  );

  let totalBiayaProduksi: number = totalBiayaBahan;
  totalBiayaProduksi += biayaTakTerduga;

  // Menghitung HPP per unit produk
  const hppPerProduk: number = jumlahProduksi > 0 ? totalBiayaProduksi / jumlahProduksi : 0;

  // Menghitung harga jual sebelum pembulatan
  const hargaSebelumBulat: number = hppPerProduk + hppPerProduk * (persentaseKeuntungan / 100);

  // Pembulatan ke atas ke kelipatan Rp500 menggunakan modulus (%)
  let hargaJual: number = Math.ceil(hargaSebelumBulat);
  const sisaModulus: number = hargaJual % 500;
  if (sisaModulus !== 0) {
    hargaJual += 500 - sisaModulus;
  }

  return {
    totalBiayaProduksi,
    hppPerProduk,
    hargaJual,
  };
}