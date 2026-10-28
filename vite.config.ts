import {defineConfig} from 'vite';
import {resolve} from 'path';

export default defineConfig({
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        servico1: resolve(__dirname, 'servicos/conserto-e-manutencao-de-porta-de-enrolar/index.html'),
        servico2: resolve(__dirname, 'servicos/fabricacao-e-instalacao-de-porta-de-enrolar/index.html'),
        servico3: resolve(__dirname, 'servicos/motorizacao-e-troca-de-motor/index.html'),
        bairro1: resolve(__dirname, 'bairros/centro/index.html'),
        bairro2: resolve(__dirname, 'bairros/jardim-botanico/index.html'),
        bairro3: resolve(__dirname, 'bairros/nova-alianca/index.html'),
        bairro4: resolve(__dirname, 'bairros/vila-tiberio/index.html'),
        bairro5: resolve(__dirname, 'bairros/bonfim-paulista/index.html'),
        bairro6: resolve(__dirname, 'bairros/campos-eliseos/index.html'),
        sobre: resolve(__dirname, 'sobre/index.html'),
        faq: resolve(__dirname, 'perguntas-frequentes/index.html'),
        privacidade: resolve(__dirname, 'politica-de-privacidade/index.html'),
      },
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
