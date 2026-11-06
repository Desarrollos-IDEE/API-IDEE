import os from 'os';
import fs from 'fs';
import { chromium, firefox } from '@playwright/test';

const read = (file) => {
  try {
    return fs.readFileSync(file, 'utf8').trim();
  } catch (err) {
    return 'n/d';
  }
};

const cgroupFile = (name) => {
  const path = read('/proc/self/cgroup').split('\n')
    .map((line) => line.split(':'))
    .find(([id]) => id === '0')?.[2];
  return read(`/sys/fs/cgroup${path && path !== '/' ? path : ''}/${name}`);
};

const browserVersion = async (browserType, options = {}) => {
  try {
    const browser = await browserType.launch({ ...options, timeout: 30000 });
    const version = browser.version();
    await browser.close();
    return version;
  } catch (err) {
    return `n/d (${err.message.split('\n')[0]})`;
  }
};

/**
 * Escribe al inicio de la suite el entorno en el que se ejecuta: CPU y memoria
 * disponibles (también los límites del contenedor) y versiones de los navegadores.
 */
export default async () => {
  try {
    const lines = [
      `CPU: ${os.cpus().length} núcleos, ${os.availableParallelism()} disponibles, cuota cgroup "${cgroupFile('cpu.max')}"`,
      `Memoria: ${Math.round(os.totalmem() / 2 ** 30)} GiB, límite cgroup "${cgroupFile('memory.max')}"`,
      `Google Chrome: ${await browserVersion(chromium, { channel: 'chrome' })}`,
      `Firefox: ${await browserVersion(firefox)}`,
    ];
    // eslint-disable-next-line no-console
    console.log(`Entorno de las pruebas:\n  ${lines.join('\n  ')}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`Entorno de las pruebas: no disponible (${err.message})`);
  }
};
