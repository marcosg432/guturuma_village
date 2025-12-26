// Script para fazer backup do banco SQLite
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'brisa_imperial.db');
const backupDir = path.join(__dirname, 'backups');

async function fazerBackup() {
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Arquivo do banco não encontrado:', dbPath);
      return;
    }
    
    // Criar diretório de backup se não existir
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('📁 Diretório de backup criado:', backupDir);
    }
    
    // Criar nome do arquivo com data e hora
    const agora = new Date();
    const dataStr = agora.toISOString()
      .replace(/T/, '_')
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .split('_')[0]; // Apenas a data
    const horaStr = agora.toTimeString()
      .split(' ')[0]
      .replace(/:/g, '-');
    
    const backupFileName = `brisa_imperial_backup_${dataStr}_${horaStr}.db`;
    const backupPath = path.join(backupDir, backupFileName);
    
    // Copiar arquivo
    fs.copyFileSync(dbPath, backupPath);
    
    // Obter tamanho dos arquivos
    const stats = fs.statSync(dbPath);
    const backupStats = fs.statSync(backupPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log('='.repeat(60));
    console.log('✅ BACKUP REALIZADO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`📁 Arquivo original: ${dbPath}`);
    console.log(`💾 Backup criado em: ${backupPath}`);
    console.log(`📊 Tamanho: ${sizeMB} MB`);
    console.log(`🕐 Data/Hora: ${agora.toLocaleString('pt-BR')}`);
    console.log('='.repeat(60));
    
    // Listar todos os backups
    const backups = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const fileStats = fs.statSync(filePath);
        return {
          name: file,
          size: fileStats.size,
          date: fileStats.mtime
        };
      })
      .sort((a, b) => b.date - a.date);
    
    if (backups.length > 0) {
      console.log(`\n📦 Total de backups: ${backups.length}`);
      console.log('\n🗂️  ÚLTIMOS 10 BACKUPS:');
      backups.slice(0, 10).forEach((backup, idx) => {
        const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
        console.log(`   ${idx + 1}. ${backup.name} (${sizeMB} MB) - ${backup.date.toLocaleString('pt-BR')}`);
      });
      
      // Sugerir limpeza se houver muitos backups
      if (backups.length > 10) {
        console.log(`\n💡 Dica: Você tem ${backups.length} backups. Considere deletar os mais antigos para economizar espaço.`);
      }
    }
    
    console.log('\n✅ Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro ao fazer backup:', error);
    process.exit(1);
  }
}

// Executar
fazerBackup();











