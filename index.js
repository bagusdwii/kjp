const fetch = require('node-fetch');
const FormData = require('form-data');
const chalk = require('chalk');
const readline = require('readline-sync');
// const fs = require('fs');

const tembak = async (data) => {
  const MAX_RETRIES = 100;
  const TIMEOUT_MS = 10000;

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const form = new FormData();
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      form.append('tanggal_ambil', `${year}-${month}-${day}`);
      form.append('wilayah', data.wilayah);
      form.append('lokasi', data.lokasi);
      form.append('kk', data.kk);
      form.append('ktp', data.nik);
      form.append('kartu', data.kartu);
      form.append('captha', '2525');
      form.append('box', 'on');
      form.append('daterange-btn', '');

      const response = await fetch(
        'https://antriankjp.pasarjaya.co.id/is0ufr88unmal65snmilpr6345_non_api_sabtu_2024.php',
        {
          method: 'POST',
          headers: {
            ...form.getHeaders(),
            Origin: 'https://antriankjp.pasarjaya.co.id',
            Referer: 'https://antriankjp.pasarjaya.co.id/index.php',
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
            Cookie: 'PHPSESSID=k8ebc9anlmdpm9efh2b57v4123',
          },
          body: form,
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (response.ok) {
        return await response.text();
      } else {
        console.warn(
          `Attempt ${attempt}: Response not OK (${response.status})`
        );
      }
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error.message || error);
      if (attempt === MAX_RETRIES) {
        throw new Error(
          `Failed after ${MAX_RETRIES} attempts: ${error.message || error}`
        );
      }
    }
  }
};

const main = async () => {
  console.clear();
  console.log(chalk.green('Tembak Antrian KJP Pasar Jaya'));
  console.log('=====================================');
  //jumlah akun
  const akuns = require('./data.json');
  console.log(chalk.yellow(`Jumlah akun: ${akuns.length}\n`));
  const startindex =
    readline.question('Ingin mulai dari akun ke berapa? (default 1): ') || 1;
  //waktu mulai bot
  const starttime =
    readline.question('Ingin mulai pada jam berapa? (default 07:00): ') ||
    '07:00';
  const [startHour, startMinute] = starttime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(startHour, startMinute, 0, 0);
  const currentTime = new Date();
  if (currentTime < startDate) {
    const timeToWait = startDate - currentTime;
    console.log(
      chalk.yellow(`Bot akan mulai dalam ${timeToWait / 1000} detik...`)
    );
    await new Promise((resolve) => setTimeout(resolve, timeToWait));
  } else {
    console.log(chalk.yellow('Bot sudah dimulai.'));
  }
  for (let i = startindex - 1; i < akuns.length; i++) {
    const data = akuns[i];
    console.log(`\nAkun ke-${i + 1}`);
    console.log('NIK :', chalk.yellow(`${data.nik}`));
    const result = await tembak(data).catch((error) => {
      console.error('Error:', error);
      return null;
    });
    console.log(chalk.blue(result));
    console.log('');
  }
};

main();
