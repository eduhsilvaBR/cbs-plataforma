import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Budget } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, '..', '..', 'logo cbs.png');

export const generateBudgetPDF = (budget: Budget): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        bufferPages: true,
        size: 'A4',
        margin: 50
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      // Cabeçalho com logo
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 50, 50, { width: 100 });
        } catch (err) {
          console.warn('Erro ao carregar logo:', err);
        }
      }

      // Título
      doc.fontSize(24).font('Helvetica-Bold').text('ORÇAMENTO DE FRETE', 200, 60);
      doc.fontSize(10).font('Helvetica').text(`#${budget.id.toString().padStart(6, '0')}`, 200, 90);

      // Linha separadora
      doc.moveTo(50, 130).lineTo(550, 130).stroke();

      // Informações do cliente
      doc.fontSize(12).font('Helvetica-Bold').text('DADOS DO CLIENTE', 50, 150);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nome: ${budget.clientName}`, 50, 175);
      doc.text(`Email: ${budget.clientEmail}`, 50, 195);
      doc.text(`Telefone: ${budget.clientPhone}`, 50, 215);

      // Informações do frete
      doc.fontSize(12).font('Helvetica-Bold').text('DETALHES DO FRETE', 50, 260);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Tipo de Veículo: ${budget.vehicleType}`, 50, 285);
      doc.text(`Origem: ${budget.originAddress}`, 50, 305);
      doc.text(`Destino: ${budget.destinationAddress}`, 50, 325);

      // Cálculo
      doc.fontSize(12).font('Helvetica-Bold').text('CÁLCULO DO FRETE', 50, 370);

      const tableTop = 400;
      const col1X = 50;
      const col2X = 350;

      doc.fontSize(10).font('Helvetica');
      doc.text('Distância:', col1X, tableTop);
      doc.text(`${budget.distance} km`, col2X, tableTop, { align: 'right' });

      doc.text('Valor por km:', col1X, tableTop + 25);
      doc.text(`R$ ${(budget.basePrice / budget.distance).toFixed(2)}`, col2X, tableTop + 25, { align: 'right' });

      doc.text('Valor Base:', col1X, tableTop + 50);
      doc.text(`R$ ${budget.basePrice.toFixed(2)}`, col2X, tableTop + 50, { align: 'right' });

      if (budget.tolEstimate > 0) {
        doc.text('Estimativa de Pedágio:', col1X, tableTop + 75);
        doc.text(`R$ ${budget.tolEstimate.toFixed(2)}`, col2X, tableTop + 75, { align: 'right' });
      }

      // Linha separadora
      doc.moveTo(50, tableTop + 110).lineTo(550, tableTop + 110).stroke();

      // Total
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('TOTAL:', col1X, tableTop + 125);
      doc.text(`R$ ${budget.totalPrice.toFixed(2)}`, col2X, tableTop + 125, { align: 'right' });

      // Rodapé
      doc.fontSize(8).font('Helvetica').fillColor('#666');
      doc.text('Orçamento válido por 7 dias', 50, 750, { align: 'center' });
      doc.text(`Gerado em ${new Date(budget.createdAt).toLocaleDateString('pt-BR')}`, 50, 765, { align: 'center' });
      doc.text('CBS Transportes - www.cbstransportes.com.br', 50, 780, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
