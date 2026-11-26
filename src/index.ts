import * as readline from "readline"; // Mengimpor modul untuk membaca input dari terminal.

// Membuat antarmuka untuk input dan output terminal.
const rl = readline.createInterface({
    input: process.stdin, // Menentukan sumber input dari keyboard.
    output: process.stdout, // Menentukan tempat menampilkan output.
});

// Menyimpan rincian setiap bahan atau komponen.
type Komponen = {
    nama: string; // Menyimpan nama komponen.
    jumlahPakai: number; // Menyimpan jumlah komponen yang digunakan.
    satuanPakai: string; // Menyimpan satuan pemakaian.
    biaya: number; // Menyimpan biaya komponen yang digunakan.
    sisa: number; // Menyimpan jumlah komponen yang tersisa.
    satuanSisa: string; // Menyimpan satuan sisa komponen.
};

// Menyimpan data setiap produk.
type Produk = {
    nama: string;
    daftarKomponen: Komponen[];
    totalBiayaKomponen: number;
    biayaTakTerduga: number;
    jumlahProduksi: number;
    satuanProduksi: string;
    keuntungan: number;
    hppPerProduk: number;
    hargaJual: number;
};

// Menyimpan seluruh produk selama program berjalan.
const daftarProduk: Produk[] = [];

// Menyimpan seluruh komponen yang dimasukkan pengguna.
const daftarKomponen: Komponen[] = [];

// Menyimpan total biaya komponen yang sudah digunakan.
let totalBiayaKomponen = 0;

// Fungsi untuk meminta input teks dari pengguna.
async function tanya(pertanyaan: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(pertanyaan, (jawaban) => {
            resolve(jawaban.trim());
        });
    });
}

// Fungsi untuk meminta input angka yang valid.
async function inputAngka(pertanyaan: string): Promise<number> {
    let angka = 0;
    let valid: boolean = false;

    while (!valid) {
        const jawaban = await tanya(pertanyaan);
        angka = Number(jawaban.replace(",", "."));

        if (jawaban !== "" && Number.isFinite(angka)) {
            valid = true;
        } else {
            console.log("Input harus berupa angka yang valid.");
        }
    }

    return angka;
}

// Fungsi untuk meminta angka yang lebih besar dari nol.
async function inputPositif(pertanyaan: string): Promise<number> {
    let angka = 0;
    let valid: boolean = false;

    while (!valid) {
        angka = await inputAngka(pertanyaan);

        if (angka > 0) {
            valid = true;
        } else {
            console.log("Angka harus lebih besar dari 0.");
        }
    }

    return angka;
}

// Fungsi untuk meminta biaya yang boleh bernilai nol.
async function inputBiaya(pertanyaan: string): Promise<number> {
    let biaya = -1;
    let valid: boolean = false;

    while (!valid) {
        biaya = await inputAngka(pertanyaan);

        if (biaya >= 0) {
            valid = true;
        } else {
            console.log("Biaya tidak boleh negatif.");
        }
    }

    return biaya;
}

// Fungsi untuk memeriksa kelompok satuan.
function kelompokSatuan(satuan: string): string {
    if (satuan === "g" || satuan === "kg") {
        return "berat";
    } else if (satuan === "ml" || satuan === "l") {
        return "volume";
    } else {
        return "jumlah";
    }
}

// Fungsi untuk mengubah satuan ke satuan dasar.
function konversiSatuan(jumlah: number, satuan: string): number {
    switch (satuan) {
        case "kg":
            return jumlah * 1000;
        case "g":
            return jumlah;
        case "l":
            return jumlah * 1000;
        case "ml":
            return jumlah;
        case "pcs":
            return jumlah;
        default:
            return 0;
    }
}

// Fungsi untuk membaca jumlah dan satuan dalam satu input.
async function inputJumlahSatuan(
    pertanyaan: string
): Promise<{ jumlah: number; satuan: string }> {
    let jumlah = 0;
    let satuan = "";
    let valid: boolean = false;

    while (!valid) {
        const jawaban = (await tanya(pertanyaan)).toLowerCase();
        const cocok = jawaban.match(/^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|pcs)$/);

        if (cocok !== null && cocok[1] !== undefined && cocok[2] !== undefined) {
            jumlah = Number(cocok[1].replace(",", "."));
            satuan = cocok[2];

            if (Number.isFinite(jumlah) && jumlah > 0) {
                valid = true;
            } else {
                console.log("Jumlah harus lebih besar dari 0.");
            }
        } else {
            console.log("Format salah. Contoh: 3 kg, 250 g, 2 l, atau 10 pcs.");
        }
    }

    return { jumlah, satuan };
}

// Fungsi untuk menampilkan angka dalam format Rupiah.
function rupiah(nilai: number): string {
    return "Rp " + Math.round(nilai).toLocaleString("id-ID");
}

// Fungsi untuk menampilkan jumlah dengan satuannya.
function formatJumlah(jumlah: number, satuan: string): string {
    return `${Number(jumlah.toFixed(3))} ${satuan}`;
}

// Fungsi utama yang menjalankan seluruh proses kalkulator HPP.
async function main(): Promise<void> {
    console.log("================================================");
    console.log("          KALKULATOR HARGA POKOK PRODUK");
    console.log("================================================");

    const namaProduk = await tanya("Nama produk: ");

    let tambahKomponen: boolean = true;

    while (tambahKomponen) {
        console.log("\n--- Input Bahan atau Komponen ---");

        let nama = await tanya("Nama bahan/komponen: ");
        const hargaBeli = await inputPositif("Harga pembelian total (Rp): ");
        const dataBeli = await inputJumlahSatuan("Jumlah yang dibeli (contoh: 3 kg atau 50 pcs): ");
        let dataPakai = await inputJumlahSatuan("Jumlah yang digunakan (contoh: 300 g atau 4 pcs): ");

        let dataKomponenValid: boolean = false;

        while (!dataKomponenValid) {
            if (kelompokSatuan(dataBeli.satuan) !== kelompokSatuan(dataPakai.satuan)) {
                console.log("Satuan pembelian dan pemakaian harus sejenis.");
                dataPakai = await inputJumlahSatuan("Masukkan ulang jumlah yang digunakan: ");
            } else {
                const jumlahBeliDasar = konversiSatuan(dataBeli.jumlah, dataBeli.satuan);
                const jumlahPakaiDasar = konversiSatuan(dataPakai.jumlah, dataPakai.satuan);

                // Seleksi kondisi bertingkat tiga: jumlah, harga, lalu nama komponen.
                if (jumlahPakaiDasar <= jumlahBeliDasar) {
                    if (hargaBeli > 0 && jumlahBeliDasar > 0) {
                        if (nama.trim() !== "") {
                            dataKomponenValid = true;
                        } else {
                            console.log("Nama bahan/komponen tidak boleh kosong.");
                            nama = await tanya("Masukkan nama bahan/komponen: ");
                        }
                    } else {
                        console.log("Harga dan jumlah pembelian harus lebih besar dari 0.");
                        dataKomponenValid = false;
                    }
                } else {
                    console.log("Jumlah yang digunakan melebihi jumlah yang dibeli.");
                    dataPakai = await inputJumlahSatuan("Masukkan ulang jumlah yang digunakan: ");
                }
            }
        }

        const jumlahBeliDasar = konversiSatuan(dataBeli.jumlah, dataBeli.satuan);
        const jumlahPakaiDasar = konversiSatuan(dataPakai.jumlah, dataPakai.satuan);

        let biayaTerpakai = hargaBeli;
        biayaTerpakai *= jumlahPakaiDasar;
        biayaTerpakai /= jumlahBeliDasar;

        let sisaDasar = jumlahBeliDasar;
        sisaDasar -= jumlahPakaiDasar;

        if (sisaDasar < 0) {
            sisaDasar = 0;
        }

        let sisa = sisaDasar;

        if (dataBeli.satuan === "kg" || dataBeli.satuan === "l") {
            sisa = sisaDasar / 1000;
        }

        totalBiayaKomponen += biayaTerpakai;

        daftarKomponen.push({
            nama: nama,
            jumlahPakai: dataPakai.jumlah,
            satuanPakai: dataPakai.satuan,
            biaya: biayaTerpakai,
            sisa: sisa,
            satuanSisa: dataBeli.satuan,
        });

        console.log(`\nBiaya komponen digunakan: ${rupiah(biayaTerpakai)}`);
        console.log(`Sisa komponen: ${formatJumlah(sisa, dataBeli.satuan)}`);

        let jawabanLanjut = "";
        let pilihanLanjutValid: boolean = false;

        while (!pilihanLanjutValid) {
            jawabanLanjut = (await tanya("Tambah bahan/komponen lain? (y/n): ")).toLowerCase();

            if (jawabanLanjut === "y" || jawabanLanjut === "n") {
                pilihanLanjutValid = true;
            } else {
                console.log("Masukkan y untuk ya atau n untuk tidak.");
            }
        }

        if (jawabanLanjut === "n") {
            tambahKomponen = false;
        }
    }

    console.log("\n--- Biaya Tak Terduga ---");
    console.log("1. Masukkan nominal biaya");
    console.log("2. Masukkan persentase dari biaya komponen");
    console.log("3. Tidak ada biaya tak terduga");

    let metodeBiayaValid: boolean = false;
    let metodeBiaya = 0;

    while (!metodeBiayaValid) {
        metodeBiaya = await inputAngka("Pilih metode (1/2/3): ");

        if (metodeBiaya === 1 || metodeBiaya === 2 || metodeBiaya === 3) {
            metodeBiayaValid = true;
        } else {
            console.log("Pilihan tidak valid. Pilih 1, 2, atau 3.");
        }
    }

    let biayaTakTerduga = 0;

    switch (metodeBiaya) {
        case 1:
            biayaTakTerduga = await inputBiaya("Nominal biaya tak terduga (Rp): ");
            break;

        case 2: {
            const persentase = await inputBiaya("Persentase biaya tak terduga (contoh: 10 untuk 10%): ");
            biayaTakTerduga = totalBiayaKomponen * (persentase / 100);
            break;
        }

        case 3:
            biayaTakTerduga = 0;
            break;

        default:
            biayaTakTerduga = 0;
            break;
    }

    const jumlahProduksi = await inputPositif("Jumlah produk yang dihasilkan dalam satu batch: ");
    const satuanProduksi = await tanya("Satuan hasil produk (contoh: porsi/potong/bungkus/botol): ");

    console.log("\n--- Pilihan Keuntungan ---");
    console.log("1. Keuntungan 20%");
    console.log("2. Keuntungan 30%");
    console.log("3. Keuntungan 50%");

    let pilihanKeuntungan = 0;
    let pilihanKeuntunganValid: boolean = false;

    while (!pilihanKeuntunganValid) {
        pilihanKeuntungan = await inputAngka("Pilih keuntungan (1/2/3): ");

        if (pilihanKeuntungan === 1 || pilihanKeuntungan === 2 || pilihanKeuntungan === 3) {
            pilihanKeuntunganValid = true;
        } else {
            console.log("Pilihan tidak valid. Pilih 1, 2, atau 3.");
        }
    }

    let keuntungan = 0;

    switch (pilihanKeuntungan) {
        case 1:
            keuntungan = 20;
            break;

        case 2:
            keuntungan = 30;
            break;

        case 3:
            keuntungan = 50;
            break;

        default:
            keuntungan = 20;
            break;
    }

    const totalBiayaProduksi = totalBiayaKomponen + biayaTakTerduga;
    const hppPerProduk = totalBiayaProduksi / jumlahProduksi;
    const hargaSebelumPembulatan = hppPerProduk * (1 + keuntungan / 100);

    const sisaPembulatan = hargaSebelumPembulatan % 500;
    const hargaJual = sisaPembulatan === 0
        ? hargaSebelumPembulatan
        : hargaSebelumPembulatan + (500 - sisaPembulatan);

    console.log("\n================================================");
    console.log("              LAPORAN HPP PRODUK");
    console.log("================================================");
    console.log(`Nama produk                 : ${namaProduk}`);

    console.log("\nRINCIAN BAHAN DAN KOMPONEN");

    for (const komponen of daftarKomponen) {
        console.log(
            `- ${komponen.nama}: ${formatJumlah(komponen.jumlahPakai, komponen.satuanPakai)} digunakan, biaya ${rupiah(komponen.biaya)}, sisa ${formatJumlah(komponen.sisa, komponen.satuanSisa)}`
        );
    }

    console.log(`\nTotal biaya bahan/komponen  : ${rupiah(totalBiayaKomponen)}`);
    console.log(`Biaya tak terduga           : ${rupiah(biayaTakTerduga)}`);
    console.log(`Total biaya produksi       : ${rupiah(totalBiayaProduksi)}`);
    console.log(`Jumlah hasil produksi      : ${jumlahProduksi} ${satuanProduksi}`);
    console.log(`HPP per ${satuanProduksi}             : ${rupiah(hppPerProduk)}`);
    console.log(`Keuntungan yang dipilih    : ${keuntungan}%`);
    console.log(`Harga sebelum pembulatan   : ${rupiah(hargaSebelumPembulatan)}`);
    console.log(`Harga jual yang disarankan : ${rupiah(hargaJual)}`);
    console.log("Catatan: harga dibulatkan ke atas.");
    console.log("================================================");
}


async function menuUtama(): Promise<void> {
    let pilihan = "";

    while (pilihan !== "6") {
        console.log("\n===== MENU KALKULATOR HPP =====");
        console.log("1. Tambah Produk");
        console.log("2. Lihat Daftar Produk");
        console.log("3. Ubah Data Produk");
        console.log("4. Hapus Data Produk");
        console.log("5. Cari Produk");
        console.log("6. Keluar");

        pilihan = await tanya("Pilih menu (1-6): ");

        switch (pilihan) {
            case "1":
                console.log("Menu Tambah Produk dipilih.");
                break;
            case "2":
                console.log("Menu Lihat Daftar Produk dipilih.");
                break;
            case "3":
                console.log("Menu Ubah Data Produk dipilih.");
                break;
            case "4":
                console.log("Menu Hapus Data Produk dipilih.");
                break;
            case "5":
                console.log("Menu Cari Produk dipilih.");
                break;
            case "6":
                console.log("Program selesai. Terima kasih!");
                break;
            default:
                console.log("Pilihan tidak valid. Silakan pilih 1-6.");
                break;
        }
    }
}

menuUtama()
    .catch((error: unknown) => {
        console.error("Terjadi kesalahan:", error);
    })
    .finally(() => {
        rl.close();
    });